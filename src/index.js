const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
});

app.listen(PORT, () => {
  // Log to help verify the server is running.
  console.log(`API listening on port ${PORT}`);
});
