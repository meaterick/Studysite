import type { Instrumentation } from "next";

// 서버 인스턴스가 시작될 때 한 번, 요청을 받기 전에 실행된다.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { startDataServices } = await import("./lib/dataServices");
  startDataServices();
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { recordServerError } = await import("./lib/serverErrors");
  recordServerError(err, request, context);
};
