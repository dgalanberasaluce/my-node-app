const revokedTokens = new Map();

const purgeExpired = () => {
  const now = Date.now();

  for (const [token, expiresAt] of revokedTokens.entries()) {
    if (expiresAt <= now) {
      revokedTokens.delete(token);
    }
  }
};

const revoke = (token, expiresAt) => {
  purgeExpired();
  revokedTokens.set(token, expiresAt);
};

const isRevoked = (token) => {
  purgeExpired();
  return revokedTokens.has(token);
};

module.exports = {
  revoke,
  isRevoked,
};
