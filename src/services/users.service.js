const bcrypt = require('bcryptjs');
const usersRepository = require('../repositories/users.repository');
const { PASSWORD_SALT_ROUNDS } = require('../config');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toPublicUser = (user) => {
  if (!user) {
    return null;
  }

  const { passwordHash, ...publicUser } = user;
  return publicUser;
};

const listUsers = () => usersRepository.findAll().map(toPublicUser);

const getUserById = (id) => toPublicUser(usersRepository.findById(id));

const updateUser = async (id, updates) => {
  const user = usersRepository.findById(id);

  if (!user) {
    throw createError(404, 'User not found');
  }

  const nextUpdates = {};

  if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
    nextUpdates.name = updates.name;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
    if (usersRepository.isEmailTaken(updates.email, id)) {
      throw createError(409, 'Email is already registered');
    }

    nextUpdates.email = updates.email;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'password')) {
    nextUpdates.passwordHash = await bcrypt.hash(updates.password, PASSWORD_SALT_ROUNDS);
  }

  const updatedUser = usersRepository.update(id, nextUpdates);
  return toPublicUser(updatedUser);
};

const deleteUser = (id) => {
  const deletedUser = usersRepository.remove(id);

  if (!deletedUser) {
    throw createError(404, 'User not found');
  }

  return toPublicUser(deletedUser);
};

module.exports = {
  toPublicUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
