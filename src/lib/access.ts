export const PRESENTER_EMAIL = 'presenter@example.com';

const ALLOWED_SUFFIX = '@gcaa.org.tw';

export function isAllowedUser(email: string | null | undefined, emailVerified: boolean): boolean {
  if (!emailVerified || !email) return false;
  return email.toLowerCase().endsWith(ALLOWED_SUFFIX);
}

export function isPresenter(email: string | null | undefined, emailVerified: boolean): boolean {
  if (!isAllowedUser(email, emailVerified)) return false;
  return email?.toLowerCase() === PRESENTER_EMAIL;
}
