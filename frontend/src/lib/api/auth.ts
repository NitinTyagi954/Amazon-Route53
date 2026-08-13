import { API_BASE_URL } from "../config";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
}

export class ApiAuthError extends Error {
  statusCode: number;
  detail?: string;

  constructor(message: string, statusCode: number, detail?: string) {
    super(message);
    this.name = "ApiAuthError";
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/**
 * POST /api/auth/login — exchange credentials for a session token.
 */
export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new ApiAuthError(
      "Unable to connect to the server. Please check your connection and try again.",
      0,
      err?.message
    );
  }

  if (response.ok) {
    return response.json();
  }

  let errorDetail = "";
  try {
    const body = await response.json();
    if (typeof body.detail === "string") {
      errorDetail = body.detail;
    } else if (Array.isArray(body.detail)) {
      errorDetail = body.detail.map((e: any) => e.msg || e.message).join(", ");
    } else {
      errorDetail = JSON.stringify(body);
    }
  } catch {
    errorDetail = response.statusText;
  }

  if (response.status === 401) {
    throw new ApiAuthError(
      "Incorrect email or password. Please check your credentials and try again.",
      401,
      errorDetail
    );
  }

  if (response.status === 422) {
    throw new ApiAuthError(
      errorDetail || "Validation error: please check the fields and try again.",
      422,
      errorDetail
    );
  }

  throw new ApiAuthError(
    errorDetail || `Unexpected error (${response.status}). Please try again.`,
    response.status,
    errorDetail
  );
}

export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/register — create a new user account.
 */
export async function registerUser(payload: RegisterRequest): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new ApiAuthError(
      "Unable to connect to the server. Please check your connection and try again.",
      0,
      err?.message
    );
  }

  if (response.ok) {
    return;
  }

  let errorDetail = "";
  try {
    const body = await response.json();
    if (typeof body.detail === "string") {
      errorDetail = body.detail;
    } else if (Array.isArray(body.detail)) {
      errorDetail = body.detail.map((e: any) => e.msg || e.message).join(", ");
    } else {
      errorDetail = JSON.stringify(body);
    }
  } catch {
    errorDetail = response.statusText;
  }

  if (response.status === 409) {
    throw new ApiAuthError(
      errorDetail || "An account with this email address already exists.",
      409,
      errorDetail
    );
  }

  if (response.status === 422) {
    throw new ApiAuthError(
      errorDetail || "Validation error: please check the fields and try again.",
      422,
      errorDetail
    );
  }

  throw new ApiAuthError(
    errorDetail || `Unexpected error (${response.status}). Please try again.`,
    response.status,
    errorDetail
  );
}

import { getStoredAuthToken } from "../auth";

/**
 * POST /api/auth/logout — invalidate the current session.
 */
export async function logoutUser(): Promise<void> {
  const token = getStoredAuthToken();
  if (!token) return;

  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });
  } catch (err) {
    // Ignore network errors on logout, we'll clear the token anyway
    console.error("Logout request failed:", err);
  }
}
