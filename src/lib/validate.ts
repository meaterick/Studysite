const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 40;
}
