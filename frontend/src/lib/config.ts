/**
 * Application environment configuration.
 */

let rawUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  (process.env.NODE_ENV === "production"
    ? "https://amazon-route53-production.up.railway.app"
    : "http://localhost:8000");

// Sanitize URL to remove accidental trailing API suffixes or slashes
if (rawUrl.endsWith("/api/hosted-zones")) {
  rawUrl = rawUrl.substring(0, rawUrl.length - "/api/hosted-zones".length);
} else if (rawUrl.endsWith("/api/hosted-zones/")) {
  rawUrl = rawUrl.substring(0, rawUrl.length - "/api/hosted-zones/".length);
}

if (rawUrl.endsWith("/")) {
  rawUrl = rawUrl.slice(0, -1);
}

export const API_BASE_URL = rawUrl;

