import "server-only";

// 프로세스 메모리 안의 간단한 요청 빈도 제한(토큰 버킷). 서버는 PM2 단일 프로세스로 돌기 때문에
// (배포 전환 중 몇 초만 두 프로세스가 겹친다) 외부 저장소 없이도 충분하다. 계정 하나가 자동화로
// 채팅·제출·저장을 폭주시켜 CPU·디스크를 고갈시키는 것을 막는 용도다(보안 검토 P0-2).
// nginx의 IP별 제한(deploy.yml)과 함께 두 겹으로 막는다.

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export interface RateRule {
  /** 순간적으로 허용하는 최대 횟수 */
  burst: number;
  /** 초당 다시 채워지는 횟수 */
  perSecond: number;
}

export const RATE_RULES = {
  chatMessage: { burst: 8, perSecond: 1 / 3 },
  draftSave: { burst: 10, perSecond: 1 },
  submission: { burst: 3, perSecond: 1 / 60 },
  checkAnswer: { burst: 20, perSecond: 1 / 2 },
  learningWrite: { burst: 20, perSecond: 1 / 2 },
} as const satisfies Record<string, RateRule>;

const globalStore = globalThis as unknown as { __aegisRateBuckets?: Map<string, Bucket> };
const buckets = (globalStore.__aegisRateBuckets ??= new Map<string, Bucket>());
const MAX_KEYS = 20_000;

/** key(예: "chat:<사용자 id>")에 대해 한 번 소비한다. 허용되면 true. */
export function consumeRate(key: string, rule: RateRule): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_KEYS) sweep(now);
    bucket = { tokens: rule.burst, updatedAt: now };
    buckets.set(key, bucket);
  } else {
    bucket.tokens = Math.min(rule.burst, bucket.tokens + ((now - bucket.updatedAt) / 1000) * rule.perSecond);
    bucket.updatedAt = now;
  }
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

/** 오래 쓰지 않은 버킷을 정리한다(가득 찬 상태로 돌아갔을 만큼 지난 것). */
function sweep(now: number) {
  for (const [key, b] of buckets) {
    if (now - b.updatedAt > 10 * 60_000) buckets.delete(key);
  }
  // 그래도 너무 많으면 오래된 것부터 버린다.
  if (buckets.size >= MAX_KEYS) {
    const drop = buckets.size - MAX_KEYS / 2;
    let i = 0;
    for (const key of buckets.keys()) {
      if (i++ >= drop) break;
      buckets.delete(key);
    }
  }
}

export class RateLimitError extends Error {
  constructor() {
    super("RATE_LIMITED");
  }
}

export const RATE_LIMIT_MESSAGE = "요청이 너무 잦습니다. 잠시 후 다시 시도해 주십시오.";
