const cookieName = "studio_session";

function getPassword() {
  return process.env.APP_PASSWORD?.trim() ?? "";
}

function getSecret() {
  return process.env.AUTH_SECRET?.trim() || getPassword();
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function authEnabled() {
  return Boolean(getPassword());
}

export function authCookieName() {
  return cookieName;
}

export async function expectedSessionToken() {
  const password = getPassword();
  const secret = getSecret();
  if (!password) return "";
  return sha256(`${password}:${secret}`);
}

export async function verifyPassword(password: string) {
  const expected = getPassword();
  return Boolean(expected) && password === expected;
}
