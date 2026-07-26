import crypto from "node:crypto";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function getSecret() {
  return process.env.AUTH_TOKEN_SECRET || "demo-travel-platform-local-secret";
}

function toBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

export function signToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    externalUserId: user.externalUserId,
    exp: Date.now() + TOKEN_TTL_MS
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = crypto.createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  let payload;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return null;
  }

  if (!payload.exp || payload.exp < Date.now()) {
    return null;
  }

  return payload;
}
