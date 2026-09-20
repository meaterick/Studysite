export const OPERATOR_COOKIE = "aegis_operator";

const DEV_FALLBACK_PASSCODE = "aegis-operator-2026";

export function operatorPasscode(): string {
  return process.env.OPERATOR_PASSCODE?.trim() || DEV_FALLBACK_PASSCODE;
}

export function isCorrectPasscode(input: string): boolean {
  return input.trim().length > 0 && input.trim() === operatorPasscode();
}

export function isOperatorCookieValid(value: string | undefined): boolean {
  return !!value && value === operatorPasscode();
}
