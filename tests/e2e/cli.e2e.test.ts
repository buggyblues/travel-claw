import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { createApp } from '../../src/server/app';
import { ApiClient } from '../../src/client/api.client';

const TEST_DB = path.join(__dirname, '..', '..', 'data', 'test-cli.db');
const TEST_PORT = 3299;

/**
 * CLI E2E Tests - Tests the full client→server stack.
 * Uses ApiClient (same as CLI) against a real running server
 * to test all CLI command paths including auth.
 */
describe('Travel Claw CLI E2E Tests', () => {
  let server: http.Server;
  let storage: any;
  let api: ApiClient;
  let authKey: string;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    const result = createApp(TEST_DB);
    server = result.app.listen(TEST_PORT);
    storage = result.storage;
    api = new ApiClient(`http://localhost:${TEST_PORT}`);
    await new Promise<void>((resolve) => server.on('listening', resolve));
  });

  afterAll(() => {
    server.close();
    storage.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  // ─── CLI Binary Smoke Test ───
  describe('CLI Binary', () => {
    it('--help shows usage', () => {
      const output = execSync('npx tsx src/client/index.ts --help', {
        cwd: path.join(__dirname, '..', '..'),
        encoding: 'utf-8',
        timeout: 15000,
      });
      expect(output).toContain('Travel Claw');
      expect(output).toContain('travel');
      expect(output).toContain('auth');
      expect(output).toContain('garden');
      expect(output).toContain('shop');
      expect(output).toContain('friends');
      expect(output).toContain('lottery');
      expect(output).toContain('home');
      expect(output).toContain('album');
    });
  });

  // ─── Auth ───
  describe('Auth Flow', () => {
    it('registers a new lobster via API', async () => {
      const res = await api.register('Snappy');
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.character.name).toBe('Snappy');
      expect(data.authKey).toBeTruthy();
      authKey = data.authKey;
      api.setAuthKey(authKey);
    });

    it('rejects requests without auth key', async () => {
      const noAuthApi = new ApiClient(`http://localhost:${TEST_PORT}`);
      const res = await noAuthApi.status();
      expect(res.success).toBe(false);
    });

    it('status returns character after auth', async () => {
      const res = await api.status();
      expect(res.success).toBe(true);
      expect((res.data as any).name).toBe('Snappy');
    });
  });

  // ─── Status ───
  describe('Status Commands', () => {
    it('status returns character info', async () => {
      const res = await api.status();
      expect(res.success).toBe(true);
      const char = res.data as any;
      expect(char.name).toBe('Snappy');
      expect(char.stats.money).toBe(5000);
      expect(char.currentLocation.city).toBe('Paris');
    });

    it('history is empty initially', async () => {
      const res = await api.statusHistory();
      expect(res.success).toBe(true);
      expect(res.data).toEqual([]);
    });

    it('full status returns complete game state', async () => {
      const res = await api.statusFull();
      expect(res.success).toBe(true);
      const state = res.data as any;
      expect(state.character).toBeDefined();
      expect(state.garden).toBeDefined();
      expect(state.backpack).toBeDefined();
      expect(state.friends).toBeDefined();
      expect(state.titles).toBeDefined();
    });
  });

  // ─── Travel ───
  describe('Travel Commands', () => {
    it('travel plan creates a plan', async () => {
      const res = await api.travelPlan('Tokyo');
      expect(res.success).toBe(true);
      const plan = res.data as any;
      expect(plan.destination.city).toBe('Tokyo');
      expect(plan.status).toBe('planning');
    });

    it('travel start begins the trip', async () => {
      const res = await api.travelStart();
      expect(res.success).toBe(true);
      const plan = res.data as any;
      expect(plan.status).toBe('arrived');
      expect(plan.destination.city).toBe('Tokyo');
    });

    it('travel location shows Tokyo', async () => {
      const res = await api.travelLocation();
      expect(res.success).toBe(true);
      expect((res.data as any).city).toBe('Tokyo');
    });

    it('history records the trip', async () => {
      const res = await api.statusHistory();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBe(1);
      expect((res.data as any[])[0].location.city).toBe('Tokyo');
    });

    it('travel stop clears plan', async () => {
      const res = await api.travelStop();
      expect(res.success).toBe(true);
    });
  });

  // ─── Photo ───
  describe('Photo Commands', () => {
    it('photo take captures a photo', async () => {
      const res = await api.photoTake();
      expect(res.success).toBe(true);
      const photo = res.data as any;
      expect(photo.location.city).toBe('Tokyo');
      expect(photo.imageUrl).toBeTruthy();
    });

    it('photo album shows photos', async () => {
      const res = await api.photoAlbum();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBe(1);
    });
  });

  // ─── Postcard ───
  describe('Postcard Commands', () => {
    it('postcard send sends a postcard', async () => {
      const res = await api.postcardSend('Mom', 'Hello from Tokyo!');
      expect(res.success).toBe(true);
      expect((res.data as any).to).toBe('Mom');
    });

    it('postcard inbox lists postcards', async () => {
      const res = await api.postcardInbox();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBe(1);
    });
  });

  // ─── Interact ───
  describe('Interact Commands', () => {
    it('interact triggers scene interaction', async () => {
      const res = await api.interact();
      expect(res.success).toBe(true);
      expect((res.data as any).description).toBeTruthy();
    });

    it('look around shows current scene', async () => {
      const res = await api.interactLook();
      expect(res.success).toBe(true);
      expect((res.data as any).description).toContain('Snappy');
    });
  });

  // ─── Message ───
  describe('Message Commands', () => {
    it('leave message at location', async () => {
      const res = await api.messageLeave('Hello Tokyo!');
      expect(res.success).toBe(true);
      expect((res.data as any).content).toBe('Hello Tokyo!');
    });

    it('read messages', async () => {
      const res = await api.messageRead();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBe(1);
    });
  });

  // ─── Poetry ───
  describe('Poetry Commands', () => {
    it('write poem', async () => {
      const res = await api.poetryWrite();
      expect(res.success).toBe(true);
      expect((res.data as any).title).toBeTruthy();
    });

    it('poetry collection', async () => {
      const res = await api.poetryCollection();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBe(1);
    });
  });

  // ─── Art ───
  describe('Art Commands', () => {
    it('create artwork', async () => {
      const res = await api.artCreate('watercolor');
      expect(res.success).toBe(true);
      expect((res.data as any).style).toBe('watercolor');
    });

    it('art gallery', async () => {
      const res = await api.artGallery();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBe(1);
    });
  });

  // ─── Souvenir ───
  describe('Souvenir Commands', () => {
    it('buy souvenir', async () => {
      const res = await api.souvenirBuy();
      expect(res.success).toBe(true);
      expect((res.data as any).name).toBeTruthy();
    });

    it('souvenir inventory', async () => {
      const res = await api.souvenirInventory();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBe(1);
    });
  });

  // ─── Tour ───
  describe('Tour Commands', () => {
    it('start tour', async () => {
      const res = await api.tourStart();
      expect(res.success).toBe(true);
    });

    it('list landmarks', async () => {
      const res = await api.tourLandmarks();
      expect(res.success).toBe(true);
    });
  });

  // ─── Rest & Eat ───
  describe('Rest & Eat Commands', () => {
    it('rest reduces fatigue', async () => {
      const res = await api.rest();
      expect(res.success).toBe(true);
      expect((res.data as any).stats).toBeDefined();
    });

    it('eat reduces hunger', async () => {
      const res = await api.eat();
      expect(res.success).toBe(true);
      expect((res.data as any).stats).toBeDefined();
    });
  });

  // ─── Agent ───
  describe('Agent Commands', () => {
    it('start agent', async () => {
      const res = await api.agentStart();
      expect(res.success).toBe(true);
    });

    it('agent status shows running', async () => {
      const res = await api.agentStatus();
      expect(res.success).toBe(true);
      expect((res.data as any).status).toBe('running');
    });

    it('run agent step', async () => {
      const res = await api.agentStep();
      expect(res.success).toBe(true);
      expect((res.data as any).action).toBeTruthy();
    });

    it('agent log shows activity', async () => {
      const res = await api.agentLog();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBeGreaterThanOrEqual(1);
    });

    it('stop agent', async () => {
      const res = await api.agentStop();
      expect(res.success).toBe(true);
    });
  });

  // ─── Map ───
  describe('Map Commands', () => {
    it('list providers', async () => {
      const res = await api.mapProviders();
      expect(res.success).toBe(true);
      expect(res.data).toContain('google');
      expect(res.data).toContain('mapbox');
    });

    it('switch provider', async () => {
      const res = await api.mapSetProvider('mapbox');
      expect(res.success).toBe(true);
    });
  });

  // ─── Garden (NEW) ───
  describe('Garden Commands', () => {
    it('view garden', async () => {
      const res = await api.garden();
      expect(res.success).toBe(true);
      const garden = res.data as any;
      expect(garden.clovers).toBeDefined();
      expect(garden.fourLeafClovers).toBeDefined();
      expect(garden.growthRate).toBe(10);
    });

    it('harvest garden', async () => {
      const res = await api.gardenHarvest();
      expect(res.success).toBe(true);
      expect((res.data as any).lastHarvestAt).toBeTruthy();
    });
  });

  // ─── Shop (NEW) ───
  describe('Shop Commands', () => {
    it('list shop items', async () => {
      const res = await api.shopList();
      expect(res.success).toBe(true);
      const items = res.data as any[];
      expect(items.length).toBeGreaterThan(0);
      const categories = new Set(items.map(i => i.category));
      expect(categories.has('food')).toBe(true);
      expect(categories.has('tool')).toBe(true);
      expect(categories.has('amulet')).toBe(true);
    });

    it('buy item', async () => {
      const res = await api.shopBuy('onigiri');
      expect(res.success).toBe(true);
      const bp = res.data as any[];
      expect(bp.some(s => s.item.id === 'onigiri')).toBe(true);
    });

    it('reject invalid item', async () => {
      const res = await api.shopBuy('nonexistent');
      expect(res.success).toBe(false);
    });
  });

  // ─── Backpack (NEW) ───
  describe('Backpack Commands', () => {
    it('view backpack', async () => {
      const res = await api.backpack();
      expect(res.success).toBe(true);
      const bp = res.data as any[];
      expect(bp.some(s => s.item.id === 'onigiri')).toBe(true);
    });

    it('use item', async () => {
      const res = await api.backpackUse('onigiri');
      expect(res.success).toBe(true);
      expect((res.data as any).used).toBe(true);
    });

    it('reject using item not in backpack', async () => {
      const res = await api.backpackUse('nonexistent');
      expect(res.success).toBe(false);
    });
  });

  // ─── Friends (NEW) ───
  describe('Friends Commands', () => {
    it('list friends (initially empty)', async () => {
      const res = await api.friends();
      expect(res.success).toBe(true);
      expect(res.data).toBeInstanceOf(Array);
    });

    it('check for visitors', async () => {
      const res = await api.friendsCheck();
      expect(res.success).toBe(true);
      // Random, might or might not have visitor
    });
  });

  // ─── Lottery (NEW) ───
  describe('Lottery Commands', () => {
    it('reject lottery without ticket', async () => {
      const garden = (await api.garden()).data as any;
      if (garden.fourLeafClovers <= 0) {
        const res = await api.lotteryPlay();
        expect(res.success).toBe(false);
      }
    });

    it('lottery history initially empty', async () => {
      const res = await api.lotteryHistory();
      expect(res.success).toBe(true);
      expect(res.data).toBeInstanceOf(Array);
    });
  });

  // ─── Titles (NEW) ───
  describe('Titles Commands', () => {
    it('check for new titles', async () => {
      const res = await api.titlesCheck();
      expect(res.success).toBe(true);
      // Returns only newly earned titles (may be 0 if already checked)
      expect(res.data).toBeInstanceOf(Array);
    });

    it('list earned titles', async () => {
      const res = await api.titles();
      expect(res.success).toBe(true);
      const titles = res.data as any[];
      // Should have at least Hatchling (earned on register)
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(titles.some((t: any) => t.name.includes('Hatchling'))).toBe(true);
    });
  });

  // ─── Home (NEW) ───
  describe('Home Commands', () => {
    it('do random home activity', async () => {
      const res = await api.homeActivity();
      expect(res.success).toBe(true);
      const event = res.data as any;
      expect(event.activity).toBeTruthy();
      expect(event.description).toBeTruthy();
    });

    it('do specific home activity', async () => {
      const res = await api.homeActivity('reading');
      expect(res.success).toBe(true);
      expect((res.data as any).activity).toBe('reading');
    });

    it('view home events', async () => {
      const res = await api.homeEvents();
      expect(res.success).toBe(true);
      expect((res.data as any[]).length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Album (NEW) ───
  describe('Album Commands', () => {
    it('view album stats', async () => {
      const res = await api.albumStats();
      expect(res.success).toBe(true);
      const stats = res.data as any;
      expect(stats.photos).toBeGreaterThanOrEqual(1);
      expect(stats.souvenirs).toBeGreaterThanOrEqual(1);
      expect(stats.cities).toBeGreaterThanOrEqual(1);
      expect(stats.completionPct).toBeDefined();
    });
  });

  // ─── Full Gameplay Flow ───
  describe('Full Gameplay Flow', () => {
    it('completes a full gameplay session', async () => {
      // 1. Buy items from shop
      await api.shopBuy('sandwich');
      await api.shopBuy('lantern');

      // Reset fatigue from previous scenario steps so this flow is deterministic
      await api.rest();

      // 2. Check backpack
      let bpRes = await api.backpack();
      const bp = bpRes.data as any[];
      expect(bp.length).toBeGreaterThanOrEqual(2);

      // 3. Travel to a new city
      await api.travelPlan('Rome');
      const travelRes = await api.travelStart();
      expect((travelRes.data as any).status).toBe('arrived');

      // 4. Do activities at destination
      await api.photoTake();
      await api.interact();
      await api.poetryWrite();
      await api.souvenirBuy();

      // 5. Use items from backpack
      const useRes = await api.backpackUse('sandwich');
      expect((useRes.data as any).used).toBe(true);

      // 6. Go home and do activities
      await api.rest();
      const homeRes = await api.homeActivity('crafting');
      expect((homeRes.data as any).activity).toBe('crafting');

      // 7. Harvest garden
      await api.gardenHarvest();

      // 8. Check album stats
      const albumRes = await api.albumStats();
      expect((albumRes.data as any).cities).toBeGreaterThanOrEqual(2);

      // 9. Check titles
      const titlesRes = await api.titlesCheck();
      expect(titlesRes.success).toBe(true);
    });
  });
});
