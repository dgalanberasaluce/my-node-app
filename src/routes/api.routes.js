const { Router } = require('express');
const { hello, echo } = require('../controllers/api.controller');
const authenticate = require('../middlewares/auth');

const router = Router();

// All routes under /api are protected — a valid JWT is required.
router.use(authenticate);

router.get('/hello', hello);
router.post('/echo', echo);

module.exports = router;
