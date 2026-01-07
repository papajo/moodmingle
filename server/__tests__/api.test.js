import request from 'supertest';
import { jest } from '@jest/globals';
// We need to use dynamic import or ensure the server doesn't start
import { app } from '../index.js';

describe('API Endpoints', () => {
  // Test User Creation
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        username: 'TestUser_' + Date.now(),
        avatar: 'http://example.com/avatar.jpg'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
  });

  // Test User Retrieval
  it('should get a user by id', async () => {
    // First create a user
    const createRes = await request(app)
      .post('/api/users')
      .send({ username: 'GetTest_' + Date.now() });

    const userId = createRes.body.id;

    // Then get it
    const res = await request(app).get(`/api/users/${userId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(userId);
  });

  // Test Mood Setting
  it('should set user mood', async () => {
    // Create user
    const createRes = await request(app)
      .post('/api/users')
      .send({ username: 'MoodTest_' + Date.now() });
    const userId = createRes.body.id;

    // Set mood
    const res = await request(app)
      .post('/api/mood')
      .send({
        userId: userId,
        moodId: 'happy'
      });

    expect(res.statusCode).toEqual(200);

    // Verify mood
    const moodRes = await request(app).get(`/api/mood/${userId}`);
    expect(moodRes.body.id).toEqual('happy');
  });
});
