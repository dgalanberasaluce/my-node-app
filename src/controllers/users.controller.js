const usersService = require('../services/users.service');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const getUsers = (req, res) => {
  const users = usersService.listUsers();
  res.json({ users });
};

const getUserById = (req, res, next) => {
  try {
    const user = usersService.getUserById(req.params.id);

    if (!user) {
      throw createError(404, 'User not found');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUserById = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email', 'password'];
    const requestKeys = Object.keys(req.body || {});

    if (requestKeys.length === 0) {
      throw createError(400, 'At least one field is required');
    }

    const hasInvalidField = requestKeys.some((key) => !allowedFields.includes(key));
    if (hasInvalidField) {
      throw createError(400, 'Only name, email and password can be updated');
    }

    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      if (!isNonEmptyString(req.body.name)) {
        throw createError(400, 'name must be a non-empty string');
      }
      updates.name = req.body.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
      if (!isNonEmptyString(req.body.email)) {
        throw createError(400, 'email must be a non-empty string');
      }
      updates.email = req.body.email.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'password')) {
      if (!isNonEmptyString(req.body.password)) {
        throw createError(400, 'password must be a non-empty string');
      }
      updates.password = req.body.password;
    }

    const user = await usersService.updateUser(req.params.id, updates);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const deleteUserById = (req, res, next) => {
  try {
    usersService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
