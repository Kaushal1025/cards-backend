import { describe, test, beforeAll, afterAll, afterEach, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Card } from '../models';

let mongoServer;
let app;

beforeAll(async () => {
  // A throwaway MongoDB that lives in memory for the length of the test run
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';

  // Important: load the app AFTER setting the environment variables
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Card.deleteMany({});
});

// --- Helpers --------------------------------------------------------------

// Registers a user through the API and returns { token, user }
const register = async (login = 'tester', password = 'secret123') => {
  const res = await request(app)
    .post('/api/users')
    .send({ login, password, firstName: 'Test', lastName: 'User' });
  return res.body;
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const sampleCard = {
  playerName: 'Player 1',
  teamName: 'Team A',
  cardValue: 10,
  publisher: 'Publisher X'
};

// --- Tests ----------------------------------------------------------------

describe('Health check', () => {
  test('GET /api/ping returns 200 and a message', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello World');
  });
});

describe('Registration', () => {
  test('POST /api/users creates a user and returns a token', async () => {
    const res = await request(app).post('/api/users').send({
      login: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      email: 'new@user.com'
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.login).toBe('newuser');
    expect(res.headers.location).toBe(`/api/users/${res.body.user._id}`);
  });

  test('stores a hash, never the plain-text password', async () => {
    await register('hashme', 'plaintext');
    const stored = await User.findOne({ login: 'hashme' }).select('+password');
    expect(stored.password).not.toBe('plaintext');
    expect(stored.password).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  test('never returns the password', async () => {
    const { user } = await register();
    expect(user).not.toHaveProperty('password');
  });

  test('ignores a role sent by the client', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ login: 'sneaky', password: 'pw', role: 'admin' });
    expect(res.body.user.role).toBe('user');
  });

  test('returns 400 if the password is missing', async () => {
    const res = await request(app).post('/api/users').send({ login: 'nopass' });
    expect(res.status).toBe(400);
  });

  test('returns 409 if the login is taken', async () => {
    await register('taken');
    const res = await request(app).post('/api/users').send({ login: 'taken', password: 'x' });
    expect(res.status).toBe(409);
  });
});

describe('Login', () => {
  test('POST /api/auth/login returns a token and the user', async () => {
    await register('loginuser', 'correctpassword');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: 'loginuser', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.login).toBe('loginuser');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('returns 401 for a wrong password', async () => {
    await register('loginuser', 'correctpassword');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: 'loginuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid login or password');
  });

  test('returns 401 for an unknown user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: 'ghost', password: 'whatever' });
    expect(res.status).toBe(401);
  });

  test('is not fooled by a MongoDB operator in the body', async () => {
    await register('victim', 'secret');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: { $ne: null }, password: 'secret' });
    expect(res.status).toBe(401);
  });
});

describe('Protected routes', () => {
  test('return 401 without a token', async () => {
    const { user } = await register();
    const res = await request(app).get(`/api/users/${user._id}/cards`);
    expect(res.status).toBe(401);
  });

  test('return 401 with an invalid token', async () => {
    const { user } = await register();
    const res = await request(app)
      .get(`/api/users/${user._id}/cards`)
      .set(auth('not-a-real-token'));
    expect(res.status).toBe(401);
  });

  test('GET /api/users/:userId returns your own account', async () => {
    const { token, user } = await register('me');
    const res = await request(app).get(`/api/users/${user._id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.login).toBe('me');
    expect(res.body).not.toHaveProperty('password');
  });

  test("GET /api/users/:userId returns 403 for someone else's account", async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const res = await request(app)
      .get(`/api/users/${bob.user._id}`)
      .set(auth(alice.token));
    expect(res.status).toBe(403);
  });
});

describe('Cards', () => {
  test('POST /api/users/:userId/cards creates a card', async () => {
    const { token, user } = await register();

    const res = await request(app)
      .post(`/api/users/${user._id}/cards`)
      .set(auth(token))
      .send(sampleCard);

    expect(res.status).toBe(201);
    expect(res.body.playerName).toBe('Player 1');
    expect(res.body.userId).toBe(user._id);
    expect(res.headers.location).toBe(`/api/cards/${res.body._id}`);
  });

  test('rejects a duplicate card name for the same user', async () => {
    const { token, user } = await register();
    const url = `/api/users/${user._id}/cards`;

    await request(app).post(url).set(auth(token)).send(sampleCard);
    const res = await request(app).post(url).set(auth(token)).send({ playerName: 'player 1' });

    expect(res.status).toBe(409);
  });

  test("can't create a card for another user", async () => {
    const alice = await register('alice');
    const bob = await register('bob');

    const res = await request(app)
      .post(`/api/users/${bob.user._id}/cards`)
      .set(auth(alice.token))
      .send(sampleCard);

    expect(res.status).toBe(403);
  });

  test('GET /api/users/:userId/cards lists only your cards', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    await Card.create({ ...sampleCard, userId: alice.user._id });
    await Card.create({ ...sampleCard, playerName: 'Bob Card', userId: bob.user._id });

    const res = await request(app)
      .get(`/api/users/${alice.user._id}/cards`)
      .set(auth(alice.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].playerName).toBe('Player 1');
  });

  test('?search= filters the list', async () => {
    const { token, user } = await register();
    await Card.create({ ...sampleCard, userId: user._id });
    await Card.create({ ...sampleCard, playerName: 'Player 2', teamName: 'Team B', userId: user._id });

    const res = await request(app)
      .get(`/api/users/${user._id}/cards?search=Team B`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].playerName).toBe('Player 2');
  });

  test('GET /api/cards/:id fetches one of your cards', async () => {
    const { token, user } = await register();
    const card = await Card.create({ ...sampleCard, userId: user._id });

    const res = await request(app).get(`/api/cards/${card._id}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.playerName).toBe('Player 1');
  });

  test('PATCH /api/cards/:id updates only the fields sent', async () => {
    const { token, user } = await register();
    const card = await Card.create({ ...sampleCard, userId: user._id });

    const res = await request(app)
      .patch(`/api/cards/${card._id}`)
      .set(auth(token))
      .send({ cardValue: 2 });

    expect(res.status).toBe(200);
    expect(res.body.cardValue).toBe(2);
    expect(res.body.playerName).toBe('Player 1');
  });

  test('PATCH ignores attempts to move a card to another user', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const card = await Card.create({ ...sampleCard, userId: alice.user._id });

    await request(app)
      .patch(`/api/cards/${card._id}`)
      .set(auth(alice.token))
      .send({ cardValue: 5, userId: bob.user._id });

    const stored = await Card.findById(card._id);
    expect(stored.userId).toBe(alice.user._id);
  });

  test('DELETE /api/cards/:id deletes a card', async () => {
    const { token, user } = await register();
    const card = await Card.create({ ...sampleCard, userId: user._id });

    const res = await request(app).delete(`/api/cards/${card._id}`).set(auth(token));

    expect(res.status).toBe(204);
    expect(await Card.findById(card._id)).toBeNull();
  });

  test("returns 403 when changing or deleting someone else's card", async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const card = await Card.create({ ...sampleCard, userId: alice.user._id });

    const patch = await request(app)
      .patch(`/api/cards/${card._id}`)
      .set(auth(bob.token))
      .send({ cardValue: 1 });
    const del = await request(app).delete(`/api/cards/${card._id}`).set(auth(bob.token));

    expect(patch.status).toBe(403);
    expect(del.status).toBe(403);
    expect(await Card.findById(card._id)).not.toBeNull();
  });

  test('returns 404 for a card that does not exist', async () => {
    const { token } = await register();
    const missingId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/cards/${missingId}`).set(auth(token));
    expect(res.status).toBe(404);
  });

  test('returns 400 for a malformed id', async () => {
    const { token } = await register();
    const res = await request(app).get('/api/cards/not-an-id').set(auth(token));
    expect(res.status).toBe(400);
  });
});
