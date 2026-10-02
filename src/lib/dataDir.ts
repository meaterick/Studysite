import "server-only";
import path from "path";

// 서버 데이터(DB·첨부 파일·작업 공간 초안·백업)의 뿌리 폴더. 배포 환경에서는 DATA_DIR이 매 배포마다
// 지워지는 release 폴더 바깥(DEPLOY_DIR/data)을 가리켜 재배포해도 데이터가 남는다.
export const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
