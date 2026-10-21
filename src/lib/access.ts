export const PRESENTER_UID = 'mPxi76Tc4HWN5q6bwqqXy76chfj2';

const ALLOWED_SUFFIX = '@gcaa.org.tw';

export function isAllowedUser(email: string | null | undefined, emailVerified: boolean): boolean {
  if (!emailVerified || !email) return false;
  return email.toLowerCase().endsWith(ALLOWED_SUFFIX);
}

export function isPresenter(uid: string | null | undefined, email: string | null | undefined, emailVerified: boolean): boolean {
  if (!isAllowedUser(email, emailVerified)) return false;
  return uid === PRESENTER_UID;
}
