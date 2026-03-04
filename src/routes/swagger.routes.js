'use strict';

const { Router } = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const router = Router();
const spec = require('../docs/openapi.json');

// Serve swagger UI at /docs
router.use('/', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));

// Also expose raw spec for clients
router.get('/spec.json', (req, res) => res.json(spec));

module.exports = router;
