import "server-only";
import fs from "fs";
import { DATA_DIR } from "./dataDir";

// 디스크가 가득 차면 로그인·진도 저장·채팅까지 모든 쓰기가 실패하므로, 큰 쓰기(과제 제출·작업 공간 저장)는
// 남은 공간이 일정량 아래로 내려가면 미리 거절한다(보안 검토 P0-2).

/** 이만큼은 항상 남겨 둔다(계정·진도·채팅 같은 작은 쓰기와 로그를 위해). */
const RESERVE_BYTES = 512 * 1024 * 1024;

/** bytes만큼 쓰고 나서도 여유 공간이 남는지. 확인할 수 없는 환경이면 true. */
export function hasDiskSpaceFor(bytes: number): boolean {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const stat = fs.statfsSync(DATA_DIR);
    const free = Number(stat.bavail) * Number(stat.bsize);
    return free - bytes > RESERVE_BYTES;
  } catch {
    return true;
  }
}

export const DISK_FULL_MESSAGE = "서버 저장 공간이 부족해 지금은 저장할 수 없습니다. 운영자에게 알려 주십시오.";

/** 데이터 폴더가 있는 디스크의 남은 공간과 전체 크기(확인할 수 없으면 null) */
export function diskUsage(): { free: number; total: number } | null {
  try {
    const stat = fs.statfsSync(DATA_DIR);
    return { free: Number(stat.bavail) * Number(stat.bsize), total: Number(stat.blocks) * Number(stat.bsize) };
  } catch {
    return null;
  }
}
