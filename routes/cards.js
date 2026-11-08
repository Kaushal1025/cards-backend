const express = require('express');
const cards = require('../controllers/cardsController');
const validateObjectId = require('../middleware/validateObjectId');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Runs before any route below that contains :id
router.param('id', validateObjectId);

// Every card route needs a logged-in user
router.use(requireAuth);

// Listing and creating cards happen under their owner, at /api/users/:userId/cards.
// Once a card exists it has its own identity, so single-card operations use
// the shorter URL below (a pattern called "shallow nesting").
// GET    /api/cards/:id - Fetch one card
// PATCH  /api/cards/:id - Partially update a card
// DELETE /api/cards/:id - Delete a card
router
  .route('/:id')
  .get(cards.getCard)
  .patch(cards.updateCard)
  .delete(cards.deleteCard);

module.exports = router;
