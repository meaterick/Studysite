"use client";

import { createContext, useContext, type ReactNode } from "react";

// 공용 브라우저(동아리방 PC 등)에서 여러 계정이 번갈아 로그인해도 진도·퀴즈·
// 작성한 코드가 섞이지 않도록, 브라우저에 저장하는 모든 키 앞에 현재 계정
// 식별자를 붙인다. 로그아웃 상태에서는 "guest" 하나를 공유한다.
const UserScopeContext = createContext("guest");

export function UserScopeProvider({ uid, children }: { uid: string; children: ReactNode }) {
  return <UserScopeContext.Provider value={uid}>{children}</UserScopeContext.Provider>;
}

export function useUserScope() {
  return useContext(UserScopeContext);
}
