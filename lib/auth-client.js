// lib/auth-client.js - Client-side auth utilities
export async function checkAuth() {
  try {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.error("Auth check failed:", err);
    return null;
  }
}
