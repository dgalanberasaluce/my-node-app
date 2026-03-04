const { Router } = require('express');
const { hello, echo } = require('../controllers/api.controller');

const router = Router();

router.get('/hello', hello);
router.post('/echo', echo);

module.exports = router;
