// 이 사이트 실습 코드(주로 Python, 가끔 bash/JS)만 예쁘게 칠하면 되는
// 아주 작은 구문 강조기입니다. shiki 같은 완전한 라이브러리를 쓰는 대신
// markdown.ts와 같은 방식으로 필요한 만큼만 손으로 짰습니다 — 배포 서버가
// RAM 1GB짜리 OCI 인스턴스라 무거운 문법 데이터베이스를 올리지 않기 위함.

export type TokenKind =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "call"
  | "decorator"
  | "builtin"
  | "plain";

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS: Record<string, Set<string>> = {
  python: new Set(
    "def return import from as if elif else for while in is not and or class try except finally with lambda True False None break continue pass yield raise global nonlocal assert del async await".split(" ")
  ),
  bash: new Set("if then else fi for do done while in echo export cd source function return exit set".split(" ")),
  javascript: new Set(
    "const let var function return if else for while in of import from export default class new this async await true false null undefined typeof instanceof try catch finally throw break continue switch case yield".split(" ")
  ),
};
KEYWORDS.py = KEYWORDS.python;
// 브라우저(Pyodide)에 없는 패키지(torch·transformers 등)를 쓰는 코드는 실행
// 셀이 아니라 읽기용 블록으로 보여준다 — 강조는 Python과 똑같이 한다.
KEYWORDS["python-colab"] = KEYWORDS.python;
KEYWORDS.js = KEYWORDS.javascript;
KEYWORDS.ts = KEYWORDS.javascript;
KEYWORDS.typescript = KEYWORDS.javascript;
KEYWORDS.sh = KEYWORDS.bash;
KEYWORDS.shell = KEYWORDS.bash;

const BUILTINS = new Set(
  "self print len range np numpy pd torch nn F plt enumerate zip map filter sum max min abs int float str list dict tuple set super".split(
    " "
  )
);

const COMMENT_CHAR: Record<string, string> = {
  python: "#",
  py: "#",
  "python-colab": "#",
  bash: "#",
  sh: "#",
  shell: "#",
};

function lineCommentChar(lang: string): string | undefined {
  if (lang in COMMENT_CHAR) return COMMENT_CHAR[lang];
  if (["javascript", "js", "typescript", "ts"].includes(lang)) return "//";
  return undefined;
}

const TOKEN_RE = /(#.*$)|(\/\/.*$)|('''[\s\S]*?'''|"""[\s\S]*?""")|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(@\w+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+)|(.)/g;

// 콘텐츠(code)는 빌드에 포함된 상수라 매 요청마다 다시 토큰화할 필요가 없다.
const highlightCache = new Map<string, Token[][]>();

/** 한 언어 전체 코드를 줄 단위 토큰 배열로 변환합니다. */
export function highlightCode(code: string, lang?: string): Token[][] {
  const cacheKey = `${lang ?? ""}\u0000${code}`;
  const cached = highlightCache.get(cacheKey);
  if (cached) return cached;
  const result = highlightCodeUncached(code, lang);
  highlightCache.set(cacheKey, result);
  return result;
}

function highlightCodeUncached(code: string, lang?: string): Token[][] {
  const language = (lang ?? "").toLowerCase();
  const keywords = KEYWORDS[language];
  const commentChar = lineCommentChar(language);

  return code.split("\n").map((line) => {
    if (!keywords && !commentChar) {
      return [{ kind: "plain", text: line }];
    }
    const tokens: Token[] = [];
    TOKEN_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TOKEN_RE.exec(line)) !== null) {
      const [
        ,
        hashComment,
        slashComment,
        tripleString,
        string,
        decorator,
        number,
        call,
        word,
        space,
        other,
      ] = match;
      if (hashComment !== undefined) {
        if (commentChar === "#") tokens.push({ kind: "comment", text: hashComment });
        else tokens.push({ kind: "plain", text: hashComment });
      } else if (slashComment !== undefined) {
        if (commentChar === "//") tokens.push({ kind: "comment", text: slashComment });
        else tokens.push({ kind: "plain", text: slashComment });
      } else if (tripleString !== undefined) {
        tokens.push({ kind: "string", text: tripleString });
      } else if (string !== undefined) {
        tokens.push({ kind: "string", text: string });
      } else if (decorator !== undefined) {
        tokens.push({ kind: "decorator", text: decorator });
      } else if (number !== undefined) {
        tokens.push({ kind: "number", text: number });
      } else if (call !== undefined) {
        tokens.push({ kind: "call", text: call });
      } else if (word !== undefined) {
        if (keywords?.has(word)) tokens.push({ kind: "keyword", text: word });
        else if (BUILTINS.has(word)) tokens.push({ kind: "builtin", text: word });
        else tokens.push({ kind: "plain", text: word });
      } else if (space !== undefined) {
        tokens.push({ kind: "plain", text: space });
      } else if (other !== undefined) {
        tokens.push({ kind: "plain", text: other });
      }
    }
    return tokens;
  });
}
