const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Slot = require('../src/models/Slot');
const Booking = require('../src/models/Booking');

let mongo;
let userToken;
let providerToken;
let slotId;

async function register(name, email, role = 'user') {
  const response = await request(app).post('/api/auth/register').send({
    name, email, password: 'Password123', role
  });
  return response;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Slot.deleteMany({}), Booking.deleteMany({})]);
  // Ensure indexes are created before tests that check unique booking constraints.
  await Promise.all([User.syncIndexes(), Slot.syncIndexes(), Booking.syncIndexes()]);

  const user = await register('Test User', 'user@example.com', 'user');
  userToken = user.body.data.token;
  const provider = await register('Test Provider', 'provider@example.com', 'provider');
  providerToken = provider.body.data.token;

  const startTime = new Date(Date.now() + 60 * 60 * 1000);
  const endTime = new Date(Date.now() + 90 * 60 * 1000);
  const slot = await request(app).post('/api/slots')
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ startTime: startTime.toISOString(), endTime: endTime.toISOString() });
  slotId = slot.body.data.slot._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('register and login return a JWT', async () => {
  const login = await request(app).post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'Password123' });
  expect(login.status).toBe(200);
  expect(login.body.data.token).toBeTruthy();
});

test('user cannot create provider slots', async () => {
  const startTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
  const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const response = await request(app).post('/api/slots')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ startTime, endTime });
  expect(response.status).toBe(403);
});

test('user can book a slot and it disappears from availability', async () => {
  const booking = await request(app).post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`).send({ slotId });
  expect(booking.status).toBe(201);

  const available = await request(app).get('/api/slots');
  expect(available.body.data.slots.some(s => s._id === slotId)).toBe(false);
});

test('second booking attempt for same slot returns 409', async () => {
  const first = await request(app).post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`).send({ slotId });
  expect(first.status).toBe(201);

  const secondUser = await register('Second User', 'second@example.com', 'user');
  const second = await request(app).post('/api/bookings')
    .set('Authorization', `Bearer ${secondUser.body.data.token}`)
    .send({ slotId });
  expect(second.status).toBe(409);
});

test('cancellation frees the slot for booking again', async () => {
  const booked = await request(app).post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`).send({ slotId });
  const bookingId = booked.body.data.booking._id;

  const cancelled = await request(app).patch(`/api/bookings/${bookingId}/cancel`)
    .set('Authorization', `Bearer ${userToken}`);
  expect(cancelled.status).toBe(200);

  const available = await request(app).get('/api/slots');
  expect(available.body.data.slots.some(s => s._id === slotId)).toBe(true);
});

test('invalid request body returns 400', async () => {
  const response = await request(app).post('/api/auth/register').send({
    name: 'A', email: 'not-an-email', password: '123'
  });
  expect(response.status).toBe(400);
});
