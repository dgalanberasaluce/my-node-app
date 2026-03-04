const { v4: uuidv4 } = require('uuid');

const users = [];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const findAll = () => users.slice();

const findById = (id) => users.find((user) => user.id === id) || null;

const findByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
};

const create = ({ name, email, passwordHash }) => {
  const now = new Date().toISOString();
  const user = {
    id: uuidv4(),
    name: String(name).trim(),
    email: normalizeEmail(email),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  return user;
};

const update = (id, updates) => {
  const user = findById(id);

  if (!user) {
    return null;
  }

  if (typeof updates.name === 'string') {
    user.name = updates.name.trim();
  }

  if (typeof updates.email === 'string') {
    user.email = normalizeEmail(updates.email);
  }

  if (typeof updates.passwordHash === 'string') {
    user.passwordHash = updates.passwordHash;
  }

  user.updatedAt = new Date().toISOString();

  return user;
};

const remove = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    return null;
  }

  const [deletedUser] = users.splice(index, 1);
  return deletedUser;
};

const isEmailTaken = (email, excludeId) => {
  const normalizedEmail = normalizeEmail(email);
  return users.some((user) => user.id !== excludeId && normalizeEmail(user.email) === normalizedEmail);
};

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  remove,
  isEmailTaken,
};
