/**
 * Application environment configuration.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  (process.env.NODE_ENV === "production"
    ? "https://amazon-route53-production.up.railway.app"
    : "http://localhost:8000");
