const authService = require('../services/auth.service');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw createError(400, 'name, email and password are required');
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

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw createError(400, 'email and password are required');
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

const logout = (req, res, next) => {
  try {
    authService.logout(req.token, req.user);
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
