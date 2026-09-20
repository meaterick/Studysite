export type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang?: string; code: string }
  | { type: "formula"; code: string }
  | { type: "callout"; tone: "info" | "warn" | "example" | "quote"; title?: string; text: string }
  | { type: "diagram"; id: string };

export interface WeekMeta {
  slug: string;
  number: number;
  phase: string;
  title: string;
  subtitle: string;
  selfHours: string;
  sessionHours: string;
  difficulty: number; // 1-5
  keywords: string[];
  objectives: string[];
  learningOrder: string[];
  /** raw markdown for the "핵심 개념" section */
  conceptsMd: string;
  /** raw markdown for the "실습" section */
  practiceMd: string;
  quiz: string[];
  worksheet: { label: string; hint?: string }[];
  /** raw markdown for the "과제" section (required / advanced / rubric) */
  assignmentMd: string;
  dueNote: string;
  furtherReading: string[];
}
