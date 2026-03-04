const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const {
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} = require('../controllers/users.controller');

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUserById);
router.delete('/:id', deleteUserById);

module.exports = router;
