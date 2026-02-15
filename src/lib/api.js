/**
 * Fetches desktop/system properties shown in the My Computer properties window.
 */
export async function fetchSiteInfo() {
  const response = await fetch("/api/site-info");
  if (!response.ok) {
    throw new Error("Could not load properties.");
  }
  return response.json();
}

/**
 * Validates Gemini API key by checking model access via backend.
 */
export async function validateGeminiKey(apiKey) {
  const response = await fetch("/api/validate-gemini-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });

  const payload = await response.json();
  return { ok: response.ok && payload?.ok, payload };
}

/**
 * Sends a command prompt message to Gemini through backend proxy.
 */
export async function queryGeminiFromCmd({ apiKey, prompt }) {
  const response = await fetch("/api/cmd-gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, prompt }),
  });

  const payload = await response.json();
  return { ok: response.ok && payload?.ok, payload };
}
