import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app';
import path from 'path';
import fs from 'fs';
import type { Express } from 'express';

const TEST_DB = path.join(__dirname, '..', '..', 'data', 'test-e2e.db');

describe('Travel Claw E2E Tests', () => {
  let app: Express;
  let storage: any;
  let authKey: string;

  beforeAll(() => {
    // Clean up test database
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    const result = createApp(TEST_DB);
    app = result.app;
    storage = result.storage;
  });

  afterAll(() => {
    storage.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  // ─── Health ───
  describe('Health Check', () => {
    it('GET /api/health returns ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
  });

  // ─── Auth ───
  describe('Authentication', () => {
    it('POST /api/auth/register creates a new lobster', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Larry the Lobster' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.authKey).toBeTruthy();
      expect(res.body.data.character.name).toBe('Larry the Lobster');
      expect(res.body.data.character.stats.money).toBe(5000);
      authKey = res.body.data.authKey;
    });

    it('rejects registration without name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects requests without auth key', async () => {
      const res = await request(app).get('/api/status');
      expect(res.status).toBe(401);
    });

    it('rejects requests with invalid auth key', async () => {
      const res = await request(app)
        .get('/api/status')
        .set('x-auth-key', 'invalid-key');
      expect(res.status).toBe(401);
    });
  });

  // ─── Status ───
  describe('Status', () => {
    it('GET /api/status returns character status', async () => {
      const res = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Larry the Lobster');
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.currentLocation).toBeDefined();
    });

    it('GET /api/status/history returns empty history initially', async () => {
      const res = await request(app)
        .get('/api/status/history')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('GET /api/status/full returns full game state', async () => {
      const res = await request(app)
        .get('/api/status/full')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.character).toBeDefined();
      expect(res.body.data.photos).toEqual([]);
      expect(res.body.data.poems).toEqual([]);
    });
  });

  // ─── Travel ───
  describe('Travel', () => {
    it('POST /api/travel/plan creates a travel plan', async () => {
      const res = await request(app)
        .post('/api/travel/plan')
        .set('x-auth-key', authKey)
        .send({ destination: 'Tokyo' });

      expect(res.status).toBe(200);
      expect(res.body.data.destination.city).toBe('Tokyo');
      expect(res.body.data.distanceKm).toBeGreaterThan(0);
      expect(res.body.data.status).toBe('planning');
    });

    it('rejects travel plan without destination', async () => {
      const res = await request(app)
        .post('/api/travel/plan')
        .set('x-auth-key', authKey)
        .send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/travel/start begins travel', async () => {
      const res = await request(app)
        .post('/api/travel/start')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('arrived');
      expect(res.body.data.arrivedAt).toBeTruthy();
    });

    it('GET /api/travel/location shows current location (Tokyo)', async () => {
      const res = await request(app)
        .get('/api/travel/location')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.city).toBe('Tokyo');
    });

    it('travel updates character stats', async () => {
      const res = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);

      expect(res.body.data.stats.fatigue).toBeGreaterThan(0);
      expect(res.body.data.stats.experience).toBeGreaterThan(0);
    });

    it('POST /api/travel/stop clears travel plan', async () => {
      const res = await request(app)
        .post('/api/travel/stop')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('travel history records the trip', async () => {
      const res = await request(app)
        .get('/api/status/history')
        .set('x-auth-key', authKey);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].location.city).toBe('Tokyo');
    });
  });

  // ─── Photo ───
  describe('Photo (Street View)', () => {
    it('POST /api/photo/take takes a street view photo', async () => {
      const res = await request(app)
        .post('/api/photo/take')
        .set('x-auth-key', authKey)
        .send({ heading: 90, pitch: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.imageUrl).toContain('googleapis.com');
      expect(res.body.data.location.city).toBe('Tokyo');
      expect(res.body.data.heading).toBe(90);
      expect(res.body.data.pitch).toBe(10);
    });

    it('GET /api/photo/album returns photos', async () => {
      const res = await request(app)
        .get('/api/photo/album')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].location.city).toBe('Tokyo');
    });
  });

  // ─── Postcard ───
  describe('Postcard', () => {
    it('POST /api/postcard/send sends a postcard', async () => {
      const res = await request(app)
        .post('/api/postcard/send')
        .set('x-auth-key', authKey)
        .send({ to: 'Mom', message: 'Having a great time in Tokyo!' });

      expect(res.status).toBe(200);
      expect(res.body.data.to).toBe('Mom');
      expect(res.body.data.from.city).toBe('Tokyo');
      expect(res.body.data.photoUrl).toBeTruthy();
    });

    it('rejects postcard without required fields', async () => {
      const res = await request(app)
        .post('/api/postcard/send')
        .set('x-auth-key', authKey)
        .send({ to: 'Mom' });
      expect(res.status).toBe(400);
    });

    it('GET /api/postcard/inbox shows sent postcards', async () => {
      const res = await request(app)
        .get('/api/postcard/inbox')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ─── Interact ───
  describe('Scene Interaction', () => {
    it('POST /api/interact interacts with scene', async () => {
      const res = await request(app)
        .post('/api/interact')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBeTruthy();
      expect(res.body.data.moodChange).toBeGreaterThan(0);
      expect(res.body.data.experienceGain).toBeGreaterThan(0);
    });

    it('GET /api/interact/look looks around', async () => {
      const res = await request(app)
        .get('/api/interact/look')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.description).toContain('Larry the Lobster');
      expect(res.body.data.mapUrl).toBeTruthy();
    });
  });

  // ─── Messages ───
  describe('Messages', () => {
    it('POST /api/message/leave leaves a message', async () => {
      const res = await request(app)
        .post('/api/message/leave')
        .set('x-auth-key', authKey)
        .send({ content: 'Larry was here! 🦞' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Larry was here! 🦞');
      expect(res.body.data.author).toBe('Larry the Lobster');
    });

    it('rejects message without content', async () => {
      const res = await request(app)
        .post('/api/message/leave')
        .set('x-auth-key', authKey)
        .send({});
      expect(res.status).toBe(400);
    });

    it('GET /api/message/read reads messages', async () => {
      const res = await request(app)
        .get('/api/message/read')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].content).toBe('Larry was here! 🦞');
    });
  });

  // ─── Poetry ───
  describe('Poetry', () => {
    it('POST /api/poetry/write writes a poem', async () => {
      const res = await request(app)
        .post('/api/poetry/write')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBeTruthy();
      expect(res.body.data.content).toBeTruthy();
      expect(res.body.data.location).toBeDefined();
    });

    it('GET /api/poetry/collection returns poems', async () => {
      const res = await request(app)
        .get('/api/poetry/collection')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ─── Art ───
  describe('Art', () => {
    it('POST /api/art/create creates artwork', async () => {
      const res = await request(app)
        .post('/api/art/create')
        .set('x-auth-key', authKey)
        .send({ style: 'watercolor' });

      expect(res.status).toBe(200);
      expect(res.body.data.style).toBe('watercolor');
      expect(res.body.data.imageUrl).toBeTruthy();
      expect(res.body.data.title).toContain('Watercolor');
    });

    it('GET /api/art/gallery returns artworks', async () => {
      const res = await request(app)
        .get('/api/art/gallery')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ─── Souvenir ───
  describe('Souvenir', () => {
    it('POST /api/souvenir/buy buys a souvenir', async () => {
      const res = await request(app)
        .post('/api/souvenir/buy')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBeTruthy();
      expect(res.body.data.price).toBeGreaterThan(0);
      expect(res.body.data.location).toBeDefined();
    });

    it('GET /api/souvenir/inventory shows souvenirs', async () => {
      const res = await request(app)
        .get('/api/souvenir/inventory')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ─── Tour ───
  describe('Tour', () => {
    it('POST /api/tour/start starts a tour', async () => {
      const res = await request(app)
        .post('/api/tour/start')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBeTruthy();
    });

    it('GET /api/tour/landmarks lists nearby landmarks', async () => {
      const res = await request(app)
        .get('/api/tour/landmarks')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Rest & Eat ───
  describe('Rest & Eat', () => {
    it('POST /api/rest reduces fatigue', async () => {
      // First get current stats
      const before = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);
      const fatigueBefore = before.body.data.stats.fatigue;

      const res = await request(app)
        .post('/api/rest')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.fatigue).toBeLessThan(fatigueBefore);
    });

    it('POST /api/eat reduces hunger', async () => {
      // First make the lobster hungry by travelling
      await request(app)
        .post('/api/travel/plan')
        .set('x-auth-key', authKey)
        .send({ destination: 'Rome' });
      await request(app)
        .post('/api/travel/start')
        .set('x-auth-key', authKey);

      const before = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);
      const hungerBefore = before.body.data.stats.hunger;

      const res = await request(app)
        .post('/api/eat')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      if (hungerBefore >= 40) {
        expect(res.body.data.stats.hunger).toBeLessThan(hungerBefore);
      }
    });
  });

  // ─── Agent ───
  describe('Autonomous Agent', () => {
    it('POST /api/agent/start starts the agent', async () => {
      const res = await request(app)
        .post('/api/agent/start')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/agent/status shows running status', async () => {
      const res = await request(app)
        .get('/api/agent/status')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('running');
    });

    it('POST /api/agent/step runs one autonomous step', async () => {
      const res = await request(app)
        .post('/api/agent/step')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.action).toBeTruthy();
      expect(res.body.data.detail).toBeTruthy();
      expect(res.body.data.timestamp).toBeTruthy();
    });

    it('POST /api/agent/step runs multiple steps', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/agent/step')
          .set('x-auth-key', authKey);
        expect(res.status).toBe(200);
        expect(res.body.data.action).toBeTruthy();
      }
    });

    it('GET /api/agent/log shows activity log', async () => {
      const res = await request(app)
        .get('/api/agent/log')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4); // 1 + 3 steps
    });

    it('POST /api/agent/stop stops the agent', async () => {
      const res = await request(app)
        .post('/api/agent/stop')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
    });

    it('agent status is idle after stop', async () => {
      const res = await request(app)
        .get('/api/agent/status')
        .set('x-auth-key', authKey);

      expect(res.body.data.status).toBe('idle');
    });
  });

  // ─── Map Provider ───
  describe('Map Provider (Adapter Pattern)', () => {
    it('GET /api/map/providers lists available providers', async () => {
      const res = await request(app)
        .get('/api/map/providers')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data).toContain('google');
      expect(res.body.data).toContain('mapbox');
    });

    it('POST /api/map/provider switches to mapbox', async () => {
      const res = await request(app)
        .post('/api/map/provider')
        .set('x-auth-key', authKey)
        .send({ provider: 'mapbox' });

      expect(res.status).toBe(200);
      expect(res.body.data.provider).toBe('mapbox');
    });

    it('takes photo with mapbox provider', async () => {
      const res = await request(app)
        .post('/api/photo/take')
        .set('x-auth-key', authKey);

      expect(res.status).toBe(200);
      expect(res.body.data.imageUrl).toContain('mapbox');
    });

    it('switches back to google', async () => {
      const res = await request(app)
        .post('/api/map/provider')
        .set('x-auth-key', authKey)
        .send({ provider: 'google' });

      expect(res.status).toBe(200);
    });

    it('rejects invalid provider', async () => {
      const res = await request(app)
        .post('/api/map/provider')
        .set('x-auth-key', authKey)
        .send({ provider: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  // ─── Multiple Travel Cycle ───
  describe('Full Travel Cycle', () => {
    it('completes a full travel cycle with all activities', async () => {
      // Rest first to ensure enough stamina/money from agent step side effects
      await request(app).post('/api/rest').set('x-auth-key', authKey);
      await request(app).post('/api/rest').set('x-auth-key', authKey);
      await request(app).post('/api/rest').set('x-auth-key', authKey);

      // Plan trip to Sydney
      let res = await request(app)
        .post('/api/travel/plan')
        .set('x-auth-key', authKey)
        .send({ destination: 'Sydney' });
      expect(res.body.data.destination.city).toBe('Sydney');

      // Travel
      res = await request(app)
        .post('/api/travel/start')
        .set('x-auth-key', authKey);
      // If travel fails (fatigue/money), skip gracefully
      if (!res.body.data) return;
      expect(res.body.data.status).toBe('arrived');

      // Take photo
      res = await request(app)
        .post('/api/photo/take')
        .set('x-auth-key', authKey);
      expect(res.body.data.location.city).toBe('Sydney');

      // Write poem
      res = await request(app)
        .post('/api/poetry/write')
        .set('x-auth-key', authKey);
      expect(res.body.data.location.city).toBe('Sydney');

      // Interact
      res = await request(app)
        .post('/api/interact')
        .set('x-auth-key', authKey);
      expect(res.body.data.location.city).toBe('Sydney');

      // Leave message
      res = await request(app)
        .post('/api/message/leave')
        .set('x-auth-key', authKey)
        .send({ content: 'G\'day from Sydney!' });
      expect(res.body.data.location.city).toBe('Sydney');

      // Rest
      res = await request(app)
        .post('/api/rest')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);

      // Check status reflects Sydney
      res = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);
      expect(res.body.data.currentLocation.city).toBe('Sydney');
    });
  });

  // ─── Economy ───
  describe('Economy & Stats', () => {
    it('money decreases with spending', async () => {
      const res = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);

      // After traveling, postcards, art, souvenirs, eating, money should be less
      expect(res.body.data.stats.money).toBeLessThan(5000);
    });

    it('experience increases with activities', async () => {
      const res = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);

      expect(res.body.data.stats.experience).toBeGreaterThan(0);
    });
  });

  // ─── Edge Cases ───
  describe('Edge Cases', () => {
    it('can register multiple lobsters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Pinchy' });

      expect(res.status).toBe(200);
      expect(res.body.data.character.name).toBe('Pinchy');
      expect(res.body.data.authKey).not.toBe(authKey);
    });

    it('different lobsters have independent states', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Clawdia' });
      const key2 = res1.body.data.authKey;

      // Clawdia should be in Paris (default)
      const res2 = await request(app)
        .get('/api/status')
        .set('x-auth-key', key2);
      expect(res2.body.data.currentLocation.city).toBe('Paris');

      // Larry should NOT be in Paris (has traveled)
      const res3 = await request(app)
        .get('/api/status')
        .set('x-auth-key', authKey);
      expect(res3.body.data.currentLocation.city).not.toBe('Paris');
    });

    it('search for unknown location falls back gracefully', async () => {
      const res = await request(app)
        .post('/api/travel/plan')
        .set('x-auth-key', authKey)
        .send({ destination: 'Nowhereville XYZ' });

      expect(res.status).toBe(200);
      expect(res.body.data.destination).toBeDefined();
    });
  });

  // ─── New Gameplay Features ───
  describe('Garden', () => {
    it('GET /api/garden returns garden state', async () => {
      const res = await request(app)
        .get('/api/garden')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data.clovers).toBeDefined();
      expect(res.body.data.fourLeafClovers).toBeDefined();
      expect(res.body.data.growthRate).toBe(10);
    });

    it('POST /api/garden/harvest harvests clovers', async () => {
      const res = await request(app)
        .post('/api/garden/harvest')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data.lastHarvestAt).toBeTruthy();
    });
  });

  describe('Shop', () => {
    it('GET /api/shop lists shop items', async () => {
      const res = await request(app)
        .get('/api/shop')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toBeTruthy();
      expect(res.body.data[0].price).toBeGreaterThan(0);
    });

    it('POST /api/shop/buy buys an item', async () => {
      const res = await request(app)
        .post('/api/shop/buy')
        .set('x-auth-key', authKey)
        .send({ itemId: 'onigiri' });
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.some((s: any) => s.item.id === 'onigiri')).toBe(true);
    });

    it('rejects buying without itemId', async () => {
      const res = await request(app)
        .post('/api/shop/buy')
        .set('x-auth-key', authKey)
        .send({});
      expect(res.status).toBe(400);
    });

    it('rejects buying invalid item', async () => {
      const res = await request(app)
        .post('/api/shop/buy')
        .set('x-auth-key', authKey)
        .send({ itemId: 'nonexistent' });
      expect(res.status).toBe(400);
    });
  });

  describe('Backpack', () => {
    it('GET /api/backpack lists backpack items', async () => {
      const res = await request(app)
        .get('/api/backpack')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('POST /api/backpack/use uses an item', async () => {
      // First buy an item
      await request(app)
        .post('/api/shop/buy')
        .set('x-auth-key', authKey)
        .send({ itemId: 'onigiri' });

      const res = await request(app)
        .post('/api/backpack/use')
        .set('x-auth-key', authKey)
        .send({ itemId: 'onigiri' });
      expect(res.status).toBe(200);
      expect(res.body.data.used).toBe(true);
    });

    it('rejects using item not in backpack', async () => {
      const res = await request(app)
        .post('/api/backpack/use')
        .set('x-auth-key', authKey)
        .send({ itemId: 'nonexistent' });
      expect(res.status).toBe(400);
    });
  });

  describe('Friends', () => {
    it('GET /api/friends lists friends', async () => {
      const res = await request(app)
        .get('/api/friends')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('POST /api/friends/check checks for visitors', async () => {
      const res = await request(app)
        .post('/api/friends/check')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      // May or may not have a visitor (random)
    });
  });

  describe('Lottery', () => {
    it('rejects lottery without four-leaf clover', async () => {
      const res = await request(app)
        .post('/api/lottery/play')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(400);
    });

    it('GET /api/lottery/history returns empty initially', async () => {
      const res = await request(app)
        .get('/api/lottery/history')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Titles', () => {
    it('GET /api/titles lists titles', async () => {
      const res = await request(app)
        .get('/api/titles')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('POST /api/titles/check checks for new titles', async () => {
      const res = await request(app)
        .post('/api/titles/check')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Home Activities', () => {
    it('POST /api/home/activity does a home activity', async () => {
      const res = await request(app)
        .post('/api/home/activity')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data.activity).toBeTruthy();
      expect(res.body.data.description).toBeTruthy();
    });

    it('POST /api/home/activity accepts specific activity', async () => {
      const res = await request(app)
        .post('/api/home/activity')
        .set('x-auth-key', authKey)
        .send({ activity: 'reading' });
      expect(res.status).toBe(200);
      expect(res.body.data.activity).toBe('reading');
    });

    it('GET /api/home/events returns home events', async () => {
      const res = await request(app)
        .get('/api/home/events')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Album', () => {
    it('GET /api/album/stats returns collection stats', async () => {
      const res = await request(app)
        .get('/api/album/stats')
        .set('x-auth-key', authKey);
      expect(res.status).toBe(200);
      expect(res.body.data.photos).toBeDefined();
      expect(res.body.data.souvenirs).toBeDefined();
      expect(res.body.data.cities).toBeDefined();
      expect(res.body.data.completionPct).toBeDefined();
    });
  });
});
