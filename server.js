const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const apiRouter = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// --- Database -------------------------------------------------------------
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/CardsDB';
mongoose
  .connect(url)
  .then(() => console.log('MongoDB connected successfully via Mongoose'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- App ------------------------------------------------------------------
const app = express();

// Allow the React frontend, which runs at a different address, to call this API
app.use(cors());
// Turn JSON request bodies into a JavaScript object at req.body
app.use(express.json());

// Every API route lives under /api and is defined in ./routes
app.use('/api', apiRouter);

// Must come after all routes: unknown routes, then the central error handler
app.use(notFound);
app.use(errorHandler);

// Start listening only when run directly (node server.js), not when a test
// file loads the app with require()
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
