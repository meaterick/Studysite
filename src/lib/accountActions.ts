"use server";

import { redirect } from "next/navigation";
import { requireUser } from "./dal";
import { deleteSession } from "./session";
import { deleteUser, listUsers } from "./userStore";

export type DeleteAccountState = { error: string } | null;

/**
 * 로그인한 본인의 계정을 삭제(회원 탈퇴)한다. 확인은 화면의 확인 창에서 받는다.
 * 서버 액션은 Next.js가 요청 출처(Origin)를 검사하므로 다른 사이트에서 대신 호출할 수 없다.
 */
export async function deleteMyAccount(): Promise<DeleteAccountState> {
  const user = await requireUser("/account");
  if (user.role === "admin" && listUsers().filter((u) => u.role === "admin").length <= 1) {
    return { error: "마지막 관리자 계정은 탈퇴할 수 없습니다. 다른 관리자 계정이 남아 있어야 탈퇴할 수 있습니다." };
  }
  await deleteUser(user.id);
  await deleteSession();
  redirect("/");
}
