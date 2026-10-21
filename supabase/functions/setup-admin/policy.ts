export const APPROVED_EMAIL = "odongoclinton3@gmail.com";

export function isApprovedEmail(email: string | undefined) {
  return email?.trim().toLowerCase() === APPROVED_EMAIL;
}

export function canClaim(email: string | undefined, confirmedAt: string | undefined) {
  return isApprovedEmail(email) && Boolean(confirmedAt);
}