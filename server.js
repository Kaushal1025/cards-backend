const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- App ------------------------------------------------------------------
const app = express();

// Allow the React frontend, which runs at a different address, to call this API
app.use(cors());
// Turn JSON request bodies into a JavaScript object at req.body
app.use(express.json());

// GET /api/ping - Health check
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Hello World' });
});

// Start listening only when run directly (node server.js), not when a test
// file loads the app with require()
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
