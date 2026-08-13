import { API_BASE_URL } from "../config";
import { getStoredAuthToken } from "../auth";
import { ApiError, DNSRecordItem } from "./hostedZones";

export interface CreateDNSRecordRequest {
  name: string;
  type: string;
  ttl: number;
  value: string;
}

export interface UpdateDNSRecordRequest {
  name: string;
  type: string;
  ttl: number;
  value: string;
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const errorJson = await response.json();
    if (typeof errorJson.detail === "string") return errorJson.detail;
    if (Array.isArray(errorJson.detail))
      return errorJson.detail.map((e: any) => e.msg || e.message).join(", ");
    return JSON.stringify(errorJson);
  } catch {
    return response.statusText;
  }
}

export async function createDNSRecord(
  zoneId: string,
  payload: CreateDNSRecordRequest
): Promise<DNSRecordItem> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new ApiError(
      "Unable to connect to the server.",
      0,
      err?.message
    );
  }

  if (!response.ok) {
    const detail = await parseApiError(response);
    if (response.status === 401) throw new ApiError(detail || "Authentication failed.", 401, detail);
    if (response.status === 404) throw new ApiError(detail || "Hosted zone not found.", 404, detail);
    if (response.status === 422) throw new ApiError(detail || "Validation error.", 422, detail);
    throw new ApiError(detail || `Server error (${response.status})`, response.status, detail);
  }

  return response.json();
}

export async function getDNSRecord(recordId: number): Promise<DNSRecordItem> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/records/${recordId}`, {
      method: "GET",
      headers,
    });
  } catch (err: any) {
    throw new ApiError("Unable to connect to the server.", 0, err?.message);
  }

  if (!response.ok) {
    const detail = await parseApiError(response);
    if (response.status === 401) throw new ApiError(detail || "Authentication failed.", 401, detail);
    if (response.status === 404) throw new ApiError(detail || "Record not found.", 404, detail);
    throw new ApiError(detail || `Server error (${response.status})`, response.status, detail);
  }

  return response.json();
}

export async function updateDNSRecord(
  recordId: number,
  payload: UpdateDNSRecordRequest
): Promise<DNSRecordItem> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/records/${recordId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new ApiError("Unable to connect to the server.", 0, err?.message);
  }

  if (!response.ok) {
    const detail = await parseApiError(response);
    if (response.status === 401) throw new ApiError(detail || "Authentication failed.", 401, detail);
    if (response.status === 404) throw new ApiError(detail || "Record not found.", 404, detail);
    if (response.status === 422) throw new ApiError(detail || "Validation error.", 422, detail);
    throw new ApiError(detail || `Server error (${response.status})`, response.status, detail);
  }

  return response.json();
}

export async function deleteDNSRecord(recordId: number): Promise<void> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/records/${recordId}`, {
      method: "DELETE",
      headers,
    });
  } catch (err: any) {
    throw new ApiError("Unable to connect to the server.", 0, err?.message);
  }

  if (response.status === 204) return;

  const detail = await parseApiError(response);
  if (response.status === 401) throw new ApiError(detail || "Authentication failed.", 401, detail);
  if (response.status === 404) throw new ApiError(detail || "Record not found.", 404, detail);
  throw new ApiError(detail || `Server error (${response.status})`, response.status, detail);
}