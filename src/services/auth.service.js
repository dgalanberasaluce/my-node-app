const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const usersRepository = require('../repositories/users.repository');
const tokenBlacklistRepository = require('../repositories/tokenBlacklist.repository');
const { toPublicUser } = require('./users.service');

const PASSWORD_SALT_ROUNDS = 10;

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
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

const logout = (token, payload) => {
  const expiresAt = payload && payload.exp ? payload.exp * 1000 : Date.now();
  tokenBlacklistRepository.revoke(token, expiresAt);
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
