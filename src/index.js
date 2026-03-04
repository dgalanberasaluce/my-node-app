const createApp = require('./app');
const { PORT, NODE_ENV } = require('./config');
const { logger } = require('./logger');

const app = createApp();

app.listen(PORT, () => {
  logger.info('server started', { port: PORT, environment: NODE_ENV });
});
