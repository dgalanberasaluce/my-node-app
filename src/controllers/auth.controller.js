const authService = require('../services/auth.service');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// Basic email format check — rejects obviously invalid values before hitting the DB.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 320; // RFC 5321 max email length; also covers name/password

const validateEmail = (email) =>
  isNonEmptyString(email) &&
  email.length <= MAX_FIELD_LENGTH &&
  EMAIL_REGEX.test(email.trim());

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!isNonEmptyString(name) || name.length > MAX_FIELD_LENGTH) {
      throw createError(400, 'name is required and must be at most 320 characters');
    }
    if (!validateEmail(email)) {
      throw createError(400, 'A valid email address is required (max 320 chars)');
    }
    if (!isNonEmptyString(password) || password.length < 8) {
      throw createError(400, 'password is required and must be at least 8 characters');
    }
    if (password.length > MAX_FIELD_LENGTH) {
      throw createError(400, 'password must be at most 320 characters');
    }

    const result = await authService.register({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!validateEmail(email)) {
      throw createError(400, 'A valid email address is required');
    }
    if (!isNonEmptyString(password)) {
      throw createError(400, 'password is required');
    }

    const result = await authService.login({
      email: email.trim(),
      password,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.token, req.user);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const me = (req, res, next) => {
  try {
    const user = authService.getCurrentUser(req.user.sub);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
};
