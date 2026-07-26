const DEFAULT_ATRE_API_URL = "http://localhost:5003";

function getAtreBaseUrl() {
  return (process.env.ATRE_API_URL || DEFAULT_ATRE_API_URL).replace(/\/$/, "");
}

export async function postToAtre(path, payload) {
  const response = await fetch(`${getAtreBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message = data?.message || `ATRE request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data || { ok: true };
}
