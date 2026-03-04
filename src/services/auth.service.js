const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ms = require('ms');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER, JWT_AUDIENCE, PASSWORD_SALT_ROUNDS } = require('../config');
const usersRepository = require('../repositories/users.repository');
const tokenBlacklistRepository = require('../repositories/tokenBlacklist.repository');
const { toPublicUser } = require('./users.service');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const createAccessToken = (user) =>
  jwt.sign(
    // Keep the payload minimal: avoid embedding PII (email, name) in the token.
    // `jti` (JWT ID) provides a unique revocable identifier per token.
    { sub: user.id, jti: uuidv4() },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256',
    }
  );

const register = async ({ name, email, password }) => {
  const existingUser = usersRepository.findByEmail(email);

  if (existingUser) {
    throw createError(409, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = usersRepository.create({ name, email, passwordHash });
  const token = createAccessToken(user);

  return {
    user: toPublicUser(user),
    token,
  };
};

const login = async ({ email, password }) => {
  const user = usersRepository.findByEmail(email);

  if (!user) {
    throw createError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw createError(401, 'Invalid email or password');
  }

  const token = createAccessToken(user);

  return {
    user: toPublicUser(user),
    token,
  };
};

const logout = async (token, payload) => {
  // If the token carries an exp claim use it; otherwise fall back to
  // JWT_EXPIRES_IN so the black-list entry lives as long as the token would.
  const expiresAt =
    payload && payload.exp
      ? payload.exp * 1000
      : Date.now() + (ms(JWT_EXPIRES_IN) || 3_600_000);
  await tokenBlacklistRepository.revoke(token, expiresAt);
};

const getCurrentUser = (userId) => {
  const user = usersRepository.findById(userId);

  if (!user) {
    throw createError(404, 'User not found');
  }

  return toPublicUser(user);
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
