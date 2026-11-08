const { Card } = require('../models');

// --- Helpers --------------------------------------------------------------

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds the Mongo filter for a user's cards, optionally narrowed by a search term
const buildCardQuery = ({ search, userId }) => {
  const query = { userId };

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    const searchNum = Number(search);

    query.$or = [
      { playerName: pattern },
      { card: pattern },
      { teamName: pattern },
      { publisher: pattern },
      ...(Number.isNaN(searchNum) ? [] : [{ cardValue: searchNum }])
    ];
  }

  return query;
};

// Copies only the allowed fields from the request body, so a client
// can't reassign a card's userId (or set any other field) through it.
const pickCardFields = (body = {}) => {
  const fields = {};
  if (body.playerName !== undefined) fields.playerName = String(body.playerName).trim();
  if (body.teamName !== undefined) fields.teamName = String(body.teamName).trim();
  if (body.publisher !== undefined) fields.publisher = String(body.publisher).trim();
  if (body.card !== undefined) fields.card = String(body.card).trim();
  if (body.cardValue !== undefined) fields.cardValue = Number(body.cardValue);
  return fields;
};

// Loads a card by id and checks that the logged-in user owns it.
// Sends the 404/403 response itself and returns null if either check fails.
const loadOwnedCard = async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return null;
  }
  if (card.userId !== req.userId) {
    res.status(403).json({ error: 'You can only access your own cards' });
    return null;
  }
  return card;
};

// --- Handlers -------------------------------------------------------------

// GET /api/users/:userId/cards?search=
exports.listCards = async (req, res, next) => {
  try {
    const search = (req.query.search ?? '').toString().trim();
    const cards = await Card.find(buildCardQuery({ search, userId: req.params.userId })).lean();
    res.status(200).json(cards);
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:userId/cards
exports.createCard = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const fields = pickCardFields(req.body);

    if (Number.isNaN(fields.cardValue)) {
      return res.status(400).json({ error: 'cardValue must be a number' });
    }

    // Two card shapes exist: player cards and simple named cards
    const isPlayerCard = 'playerName' in fields || 'teamName' in fields;
    const name = isPlayerCard ? fields.playerName : fields.card;

    if (!name) {
      return res.status(400).json({ error: 'playerName or card is required' });
    }

    // A user can't own two cards with the same name (case-insensitive)
    const exactName = { $regex: `^${escapeRegex(name)}$`, $options: 'i' };
    const duplicate = await Card.exists({
      userId,
      $or: [{ playerName: exactName }, { card: exactName }]
    });

    if (duplicate) {
      return res.status(409).json({ error: 'You already have a card with that name' });
    }

    const newCard = isPlayerCard
      ? {
          playerName: fields.playerName,
          teamName: fields.teamName ?? '',
          cardValue: fields.cardValue ?? 0,
          publisher: fields.publisher ?? ''
        }
      : { card: fields.card };

    const card = await Card.create({ ...newCard, userId });

    res.status(201).location(`/api/cards/${card._id}`).json(card);
  } catch (err) {
    next(err);
  }
};

// GET /api/cards/:id
exports.getCard = async (req, res, next) => {
  try {
    const card = await loadOwnedCard(req, res);
    if (!card) return;

    res.status(200).json(card);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/cards/:id
exports.updateCard = async (req, res, next) => {
  try {
    const fields = pickCardFields(req.body);

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }
    if (Number.isNaN(fields.cardValue)) {
      return res.status(400).json({ error: 'cardValue must be a number' });
    }

    const card = await loadOwnedCard(req, res);
    if (!card) return;

    card.set(fields);
    await card.save();

    res.status(200).json(card);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cards/:id
exports.deleteCard = async (req, res, next) => {
  try {
    const card = await loadOwnedCard(req, res);
    if (!card) return;

    await card.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
