const express = require('express');
const users = require('../controllers/usersController');
const cards = require('../controllers/cardsController');
const validateObjectId = require('../middleware/validateObjectId');
const { requireAuth, requireSelf } = require('../middleware/auth');

const router = express.Router();

// Runs before any route below that contains :userId
router.param('userId', validateObjectId);

// POST /api/users - Register a new user (open to everyone)
router.post('/', users.createUser);

// Everything below needs a logged-in user, and only their own account
// GET /api/users/:userId - Fetch one user
router.get('/:userId', requireAuth, requireSelf, users.getUser);

// Cards belong to a user (1:many), so the collection is nested under its owner
// GET  /api/users/:userId/cards?search=  - List (and optionally search) a user's cards
// POST /api/users/:userId/cards          - Create a card owned by this user
router
  .route('/:userId/cards')
  .all(requireAuth, requireSelf)
  .get(cards.listCards)
  .post(cards.createCard);

module.exports = router;
