const crypto = require("node:crypto");

const HASH_PREFIX = "scrypt";
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 128 * 1024 * 1024
};
const KEY_LENGTH = 64;

function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return [
    HASH_PREFIX,
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt,
    key.toString("hex")
  ].join("$");
}

function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const [, rawN, rawR, rawP, salt, storedKeyHex] = parts;
  const params = {
    N: Number(rawN),
    r: Number(rawR),
    p: Number(rawP),
    maxmem: SCRYPT_OPTIONS.maxmem
  };

  if (!Number.isInteger(params.N) || !Number.isInteger(params.r) || !Number.isInteger(params.p)) {
    return false;
  }

  try {
    const storedKey = Buffer.from(storedKeyHex, "hex");
    const candidateKey = crypto.scryptSync(password, salt, storedKey.length, params);
    return storedKey.length === candidateKey.length && crypto.timingSafeEqual(storedKey, candidateKey);
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
