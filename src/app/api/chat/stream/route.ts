import { NextRequest, NextResponse } from "next/server";
import { isBlockedIp } from "@/lib/ipDefense";
import { apiUser } from "@/lib/apiAuth";
import { recordSecurityEvent, securityRequest } from "@/lib/securityEvents";
import { findUserById } from "@/lib/userStore";
import { subscribeChat } from "@/lib/chatStore";
import { conversationView, inboxView } from "@/lib/chatView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 채팅 실시간 스트림(Server-Sent Events). 연결하자마자 현재 상태를 한 번 보내고, 이후 대화가
// 바뀔 때마다 새 상태를 보낸다. 스터디원은 자기 대화만, 운영자는 ?user=<id>로 지정한 대화나
// ?inbox=1(전체 목록)을 받을 수 있다. nginx가 응답을 모아 두지 않도록 X-Accel-Buffering을 끈다.

const HEARTBEAT_MS = 25_000;
// 연결을 수백 개 열어 서버·nginx 연결을 고갈시키지 못하도록 계정별·전체 동시 연결 수를 제한한다(보안 검토 P0-2).
// 한 사람이 여러 탭을 열어 두는 정도(채팅 창 + 채점 화면 등)는 충분히 허용한다.
const MAX_STREAMS_PER_USER = 6;
const MAX_STREAMS_TOTAL = 300;

const globalStreams = globalThis as unknown as { __aegisChatStreams?: { total: number; perUser: Map<string, number> } };
const streams = (globalStreams.__aegisChatStreams ??= { total: 0, perUser: new Map<string, number>() });

function acquireStream(userId: string): boolean {
  const mine = streams.perUser.get(userId) ?? 0;
  if (mine >= MAX_STREAMS_PER_USER || streams.total >= MAX_STREAMS_TOTAL) return false;
  streams.perUser.set(userId, mine + 1);
  streams.total++;
  return true;
}

function releaseStream(userId: string) {
  const mine = (streams.perUser.get(userId) ?? 1) - 1;
  if (mine <= 0) streams.perUser.delete(userId);
  else streams.perUser.set(userId, mine);
  streams.total = Math.max(0, streams.total - 1);
}

export async function GET(request: NextRequest) {
  const user = await apiUser(request);
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const isAdmin = user.role === "admin";
  if (!isAdmin && (params.get("inbox") === "1" || (params.get("user") && params.get("user") !== user.id))) {
    recordSecurityEvent("forbidden", { ...securityRequest(request, user.id), status: 403 });
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let snapshot: () => unknown;
  let relevant: (userId: string) => boolean;
  if (isAdmin && params.get("inbox") === "1") {
    snapshot = () => ({ type: "inbox", items: inboxView() });
    relevant = () => true;
  } else if (isAdmin && params.get("user")) {
    const target = params.get("user")!;
    if (!findUserById(target)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    snapshot = () => ({ type: "conversation", conversation: conversationView(target, "admin") });
    relevant = (id) => id === target;
  } else if (!isAdmin) {
    snapshot = () => ({ type: "conversation", conversation: conversationView(user.id, "member") });
    relevant = (id) => id === user.id;
  } else {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!acquireStream(user.id)) {
    recordSecurityEvent("rate_limited", { ...securityRequest(request, user.id), status: 429 });
    return NextResponse.json({ error: "too_many_connections" }, { status: 429 });
  }

  const streamIp = securityRequest(request).ip ?? "";
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        if (isBlockedIp(streamIp, user.id)) {
          recordSecurityEvent("ip_blocked", { ip: streamIp, userId: user.id, method: "GET", path: "/ip-blocked", status: 403 });
          cleanup();
          return;
        }
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const push = () => send(`data: ${JSON.stringify(snapshot())}\n\n`);
      // 짧은 시간에 변경이 몰려도(메시지 + 읽음 표시) 한 번만 보낸다.
      let timer: ReturnType<typeof setTimeout> | null = null;
      const unsubscribe = subscribeChat((id) => {
        if (!relevant(id) || timer) return;
        timer = setTimeout(() => {
          timer = null;
          push();
        }, 50);
      });
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
      cleanup = () => {
        if (closed) return;
        closed = true;
        releaseStream(user.id);
        unsubscribe();
        clearInterval(heartbeat);
        if (timer) clearTimeout(timer);
        try {
          controller.close();
        } catch {
          // 이미 닫혔다.
        }
      };
      request.signal.addEventListener("abort", cleanup);
      send("retry: 3000\n\n");
      push();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-store, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
