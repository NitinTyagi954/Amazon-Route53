import { API_BASE_URL } from "../config";
import { getStoredAuthToken } from "../auth";

export interface HostedZoneItem {
  id: string;
  name: string;
  comment?: string | null;
  is_private: boolean;
  caller_reference: string;
  record_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHostedZoneRequest {
  name: string;
  comment?: string | null;
  is_private: boolean;
  caller_reference?: string | null;
}

export interface PaginatedHostedZonesResponse {
  items: HostedZoneItem[];
  total: number;
  page: number;
  limit: number;
}

export class ApiError extends Error {
  statusCode: number;
  detail?: string | any;

  constructor(message: string, statusCode: number, detail?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/**
 * Creates a new Hosted Zone on the FastAPI backend (POST /api/hosted-zones).
 */
export async function createHostedZone(
  payload: CreateHostedZoneRequest
): Promise<HostedZoneItem> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/hosted-zones`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: payload.name,
        comment: payload.comment || null,
        is_private: payload.is_private,
        caller_reference: payload.caller_reference || null,
      }),
    });
  } catch (err: any) {
    throw new ApiError(
      "Unable to connect to the server. Please check that the backend is running.",
      0,
      err?.message
    );
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === "string") {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((e: any) => e.msg || e.message).join(", ");
      } else {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 409) {
      throw new ApiError(
        errorDetail || "A hosted zone with this caller reference already exists.",
        409,
        errorDetail
      );
    }

    if (response.status === 401) {
      throw new ApiError(
        errorDetail || "Authentication failed: Missing or invalid session token.",
        401,
        errorDetail
      );
    }

    if (response.status === 422) {
      throw new ApiError(
        errorDetail || "Validation error: Please check the domain name format.",
        422,
        errorDetail
      );
    }

    throw new ApiError(
      errorDetail || `Server returned error (${response.status})`,
      response.status,
      errorDetail
    );
  }

  return response.json();
}

/**
 * Fetches paginated Hosted Zones from the FastAPI backend (GET /api/hosted-zones).
 */
export async function getHostedZones(
  page = 1,
  limit = 10,
  search?: string
): Promise<PaginatedHostedZonesResponse> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search && search.trim()) {
    queryParams.set("search", search.trim());
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/hosted-zones?${queryParams.toString()}`,
      {
        method: "GET",
        headers,
      }
    );
  } catch (err: any) {
    throw new ApiError(
      "Unable to connect to the server. Please check that the backend is running.",
      0,
      err?.message
    );
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === "string") {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((e: any) => e.msg || e.message).join(", ");
      } else {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401) {
      throw new ApiError(
        errorDetail || "Authentication failed: Missing or invalid session token.",
        401,
        errorDetail
      );
    }

    throw new ApiError(
      errorDetail || `Failed to fetch hosted zones (${response.status})`,
      response.status,
      errorDetail
    );
  }


  return response.json();
}

export interface UpdateHostedZoneRequest {
  name?: string;
  comment?: string | null;
  is_private?: boolean;
}

/**
 * Updates an existing Hosted Zone on the FastAPI backend (PUT /api/hosted-zones/{id}).
 */
export async function updateHostedZone(
  id: string,
  payload: UpdateHostedZoneRequest
): Promise<HostedZoneItem> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/hosted-zones/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new ApiError(
      "Unable to connect to the server. Please check that the backend is running.",
      0,
      err?.message
    );
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === "string") {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((e: any) => e.msg || e.message).join(", ");
      } else {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401) {
      throw new ApiError(
        errorDetail || "Authentication failed: Missing or invalid session token.",
        401,
        errorDetail
      );
    }

    if (response.status === 404) {
      throw new ApiError(
        errorDetail || "Hosted zone not found.",
        404,
        errorDetail
      );
    }

    if (response.status === 422) {
      throw new ApiError(
        errorDetail || "Validation error: Please check the domain name format.",
        422,
        errorDetail
      );
    }

    throw new ApiError(
      errorDetail || `Server returned error (${response.status})`,
      response.status,
      errorDetail
    );
  }

  return response.json();
}

/**
 * Deletes a Hosted Zone on the FastAPI backend (DELETE /api/hosted-zones/{id}).
 * Returns void on HTTP 204 success.
 */
export async function deleteHostedZone(id: string): Promise<void> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/hosted-zones/${id}`, {
      method: "DELETE",
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      "Unable to connect to the server. Please check that the backend is running.",
      0,
      err?.message
    );
  }

  if (response.status === 204) {
    return; // success — no body
  }

  let errorDetail = "";
  try {
    const errorJson = await response.json();
    if (typeof errorJson.detail === "string") {
      errorDetail = errorJson.detail;
    } else if (Array.isArray(errorJson.detail)) {
      errorDetail = errorJson.detail.map((e: any) => e.msg || e.message).join(", ");
    } else {
      errorDetail = JSON.stringify(errorJson);
    }
  } catch {
    errorDetail = response.statusText;
  }

  if (response.status === 401) {
    throw new ApiError(
      errorDetail || "Authentication failed: Missing or invalid session token.",
      401,
      errorDetail
    );
  }

  if (response.status === 404) {
    throw new ApiError(
      errorDetail || "Hosted zone not found. It may have already been deleted.",
      404,
      errorDetail
    );
  }

  throw new ApiError(
    errorDetail || `Server returned error (${response.status})`,
    response.status,
    errorDetail
  );
}
