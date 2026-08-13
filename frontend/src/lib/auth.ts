/**
 * Authentication token utilities.
 */

const TOKEN_KEY = "aws_route53_auth_token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    null
  );
}

export function setStoredAuthToken(token: string, persist = true): void {
  if (typeof window === "undefined") return;
  if (persist) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_token");
}
