// 채팅 화면(클라이언트)과 서버가 주고받는 직렬화 형태. 작성자 id 등 화면에 필요 없는 정보는 뺀다.

export interface ChatMessageView {
  id: string;
  authorName: string;
  role: "member" | "admin";
  text: string;
  createdAt: string;
  topic?: string;
}

export interface ConversationView {
  userId: string;
  messages: ChatMessageView[];
  /** 상대방이 마지막으로 읽은 시각 (내 메시지의 "읽음" 표시에 쓴다) */
  otherReadAt?: string;
  /** 상대방이 보낸 메시지 중 내가 읽지 않은 수 */
  unread: number;
}

export interface InboxItemView {
  userId: string;
  name: string;
  email: string;
  lastText?: string;
  lastRole?: "member" | "admin";
  updatedAt?: string;
  unread: number;
}
