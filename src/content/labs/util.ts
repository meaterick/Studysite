// 코드 문자열은 String.raw처럼 백슬래시를 그대로 두어야 Python 코드("\n", 정규식 등)가 깨지지 않는다.
// 첫 줄바꿈 하나만 없애, 템플릿을 여는 백틱 바로 다음 줄부터 코드를 쓸 수 있게 한다.
export function py(strings: TemplateStringsArray, ...values: unknown[]): string {
  return String.raw({ raw: strings.raw }, ...values).replace(/^\n/, "");
}
