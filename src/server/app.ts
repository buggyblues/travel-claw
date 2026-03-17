import express from 'express';
import { GameEngine } from './game/engine';
import { Storage } from './storage/storage';
import { MapAdapterManager } from './map/adapter';
import { GoogleMapsAdapter } from './map/google.adapter';
import { MapboxAdapter } from './map/mapbox.adapter';
import { ApiResponse } from '../shared/types';

export function createApp(dbPath?: string) {
  const app = express();
  app.use(express.json());

  // Initialize subsystems
  const storage = new Storage(dbPath);
  const mapManager = new MapAdapterManager('google');
  mapManager.register(new GoogleMapsAdapter());
  mapManager.register(new MapboxAdapter());

  const engine = new GameEngine(storage, mapManager);

  // ─── Auth Middleware ───
  function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authKey = req.headers['x-auth-key'] as string;
    if (!authKey) {
      res.status(401).json({ success: false, error: 'Missing x-auth-key header' } satisfies ApiResponse);
      return;
    }
    const character = engine.getCharacterByAuth(authKey);
    if (!character) {
      res.status(401).json({ success: false, error: 'Invalid auth key' } satisfies ApiResponse);
      return;
    }
    (req as any).authKey = authKey;
    next();
  }

  // ─── Public Routes ───
  app.post('/api/auth/register', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Name is required' } satisfies ApiResponse);
      return;
    }
    const result = engine.register(name.trim());
    res.json({ success: true, data: result } satisfies ApiResponse);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', version: '1.0.0' } } satisfies ApiResponse);
  });

  // ─── Protected Routes ───
  app.use('/api', authMiddleware);

  // Status
  app.get('/api/status', (req, res) => {
    const character = engine.getStatus((req as any).authKey);
    res.json({ success: true, data: character } satisfies ApiResponse);
  });

  app.get('/api/status/history', (req, res) => {
    const history = engine.getHistory((req as any).authKey);
    res.json({ success: true, data: history } satisfies ApiResponse);
  });

  app.get('/api/status/full', (req, res) => {
    const state = engine.getGameState((req as any).authKey);
    res.json({ success: true, data: state } satisfies ApiResponse);
  });

  // Travel
  app.post('/api/travel/plan', async (req, res) => {
    const { destination } = req.body;
    if (!destination) {
      res.status(400).json({ success: false, error: 'Destination is required' } satisfies ApiResponse);
      return;
    }
    const plan = await engine.planTravel((req as any).authKey, destination);
    res.json({ success: true, data: plan } satisfies ApiResponse);
  });

  app.post('/api/travel/start', (req, res) => {
    const plan = engine.startTravel((req as any).authKey);
    if (!plan) {
      res.status(400).json({ success: false, error: 'No travel plan found or too tired' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: plan } satisfies ApiResponse);
  });

  app.post('/api/travel/stop', (req, res) => {
    engine.stopTravel((req as any).authKey);
    res.json({ success: true, data: { message: 'Travel stopped' } } satisfies ApiResponse);
  });

  app.get('/api/travel/location', (req, res) => {
    const location = engine.getLocation((req as any).authKey);
    res.json({ success: true, data: location } satisfies ApiResponse);
  });

  // Photo
  app.post('/api/photo/take', (req, res) => {
    const { heading, pitch } = req.body || {};
    const photo = engine.takePhoto((req as any).authKey, heading, pitch);
    res.json({ success: true, data: photo } satisfies ApiResponse);
  });

  app.get('/api/photo/album', (req, res) => {
    const album = engine.getAlbum((req as any).authKey);
    res.json({ success: true, data: album } satisfies ApiResponse);
  });

  // Postcard
  app.post('/api/postcard/send', (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
      res.status(400).json({ success: false, error: '"to" and "message" are required' } satisfies ApiResponse);
      return;
    }
    const postcard = engine.sendPostcard((req as any).authKey, to, message);
    if (!postcard) {
      res.status(400).json({ success: false, error: 'Not enough money' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: postcard } satisfies ApiResponse);
  });

  app.get('/api/postcard/inbox', (req, res) => {
    const postcards = engine.getPostcards((req as any).authKey);
    res.json({ success: true, data: postcards } satisfies ApiResponse);
  });

  // Interact
  app.post('/api/interact', (req, res) => {
    const interaction = engine.interact((req as any).authKey);
    res.json({ success: true, data: interaction } satisfies ApiResponse);
  });

  app.get('/api/interact/look', (req, res) => {
    const result = engine.lookAround((req as any).authKey);
    res.json({ success: true, data: result } satisfies ApiResponse);
  });

  // Message
  app.post('/api/message/leave', (req, res) => {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' } satisfies ApiResponse);
      return;
    }
    const message = engine.leaveMessage((req as any).authKey, content);
    res.json({ success: true, data: message } satisfies ApiResponse);
  });

  app.get('/api/message/read', (req, res) => {
    const messages = engine.readMessages((req as any).authKey);
    res.json({ success: true, data: messages } satisfies ApiResponse);
  });

  // Poetry
  app.post('/api/poetry/write', (req, res) => {
    const poem = engine.writePoem((req as any).authKey);
    res.json({ success: true, data: poem } satisfies ApiResponse);
  });

  app.get('/api/poetry/collection', (req, res) => {
    const poems = engine.getPoems((req as any).authKey);
    res.json({ success: true, data: poems } satisfies ApiResponse);
  });

  // Art
  app.post('/api/art/create', (req, res) => {
    const { style } = req.body || {};
    const artwork = engine.createArt((req as any).authKey, style);
    if (!artwork) {
      res.status(400).json({ success: false, error: 'Not enough money for art' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: artwork } satisfies ApiResponse);
  });

  app.get('/api/art/gallery', (req, res) => {
    const artworks = engine.getArtworks((req as any).authKey);
    res.json({ success: true, data: artworks } satisfies ApiResponse);
  });

  // Souvenir
  app.post('/api/souvenir/buy', (req, res) => {
    const souvenir = engine.buySouvenir((req as any).authKey);
    if (!souvenir) {
      res.status(400).json({ success: false, error: 'Not enough money' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: souvenir } satisfies ApiResponse);
  });

  app.get('/api/souvenir/inventory', (req, res) => {
    const souvenirs = engine.getSouvenirs((req as any).authKey);
    res.json({ success: true, data: souvenirs } satisfies ApiResponse);
  });

  // Tour
  app.post('/api/tour/start', async (req, res) => {
    const interaction = await engine.startTour((req as any).authKey);
    res.json({ success: true, data: interaction } satisfies ApiResponse);
  });

  app.get('/api/tour/landmarks', async (req, res) => {
    const landmarks = await engine.getLandmarks((req as any).authKey);
    res.json({ success: true, data: landmarks } satisfies ApiResponse);
  });

  // Rest & Eat
  app.post('/api/rest', (req, res) => {
    const character = engine.rest((req as any).authKey);
    res.json({ success: true, data: character } satisfies ApiResponse);
  });

  app.post('/api/eat', (req, res) => {
    const character = engine.eat((req as any).authKey);
    if (!character) {
      res.status(400).json({ success: false, error: 'Not enough money to eat' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: character } satisfies ApiResponse);
  });

  // Agent
  app.post('/api/agent/start', (req, res) => {
    engine.startAgent((req as any).authKey);
    res.json({ success: true, data: { message: 'Agent started' } } satisfies ApiResponse);
  });

  app.post('/api/agent/stop', (req, res) => {
    engine.stopAgent((req as any).authKey);
    res.json({ success: true, data: { message: 'Agent stopped' } } satisfies ApiResponse);
  });

  app.get('/api/agent/status', (req, res) => {
    const status = engine.getAgentStatus((req as any).authKey);
    res.json({ success: true, data: status } satisfies ApiResponse);
  });

  app.get('/api/agent/log', (req, res) => {
    const log = engine.getAgentLog((req as any).authKey);
    res.json({ success: true, data: log } satisfies ApiResponse);
  });

  app.post('/api/agent/step', async (req, res) => {
    const entry = await engine.runAgentStep((req as any).authKey);
    res.json({ success: true, data: entry } satisfies ApiResponse);
  });

  // Map provider
  app.get('/api/map/providers', (_req, res) => {
    res.json({ success: true, data: mapManager.listProviders() } satisfies ApiResponse);
  });

  app.post('/api/map/provider', (req, res) => {
    const { provider } = req.body;
    try {
      mapManager.setProvider(provider);
      res.json({ success: true, data: { provider } } satisfies ApiResponse);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message } satisfies ApiResponse);
    }
  });

  // ─── Garden ───
  app.get('/api/garden', (req, res) => {
    const garden = engine.getGarden((req as any).authKey);
    res.json({ success: true, data: garden } satisfies ApiResponse);
  });

  app.post('/api/garden/harvest', (req, res) => {
    const garden = engine.harvestGarden((req as any).authKey);
    res.json({ success: true, data: garden } satisfies ApiResponse);
  });

  // ─── Shop ───
  app.get('/api/shop', (_req, res) => {
    const items = engine.getShopItems();
    res.json({ success: true, data: items } satisfies ApiResponse);
  });

  app.post('/api/shop/buy', (req, res) => {
    const { itemId } = req.body;
    if (!itemId) {
      res.status(400).json({ success: false, error: 'itemId is required' } satisfies ApiResponse);
      return;
    }
    const backpack = engine.buyItem((req as any).authKey, itemId);
    if (!backpack) {
      res.status(400).json({ success: false, error: 'Item not found or not enough money' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: backpack } satisfies ApiResponse);
  });

  // ─── Backpack ───
  app.get('/api/backpack', (req, res) => {
    const backpack = engine.getBackpack((req as any).authKey);
    res.json({ success: true, data: backpack } satisfies ApiResponse);
  });

  app.post('/api/backpack/use', (req, res) => {
    const { itemId } = req.body;
    if (!itemId) {
      res.status(400).json({ success: false, error: 'itemId is required' } satisfies ApiResponse);
      return;
    }
    const result = engine.useItem((req as any).authKey, itemId);
    if (!result.used) {
      res.status(400).json({ success: false, error: result.message } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: result } satisfies ApiResponse);
  });

  // ─── Friends ───
  app.get('/api/friends', (req, res) => {
    const friends = engine.getFriends((req as any).authKey);
    res.json({ success: true, data: friends } satisfies ApiResponse);
  });

  app.post('/api/friends/check', (req, res) => {
    const event = engine.checkVisitors((req as any).authKey);
    res.json({ success: true, data: event } satisfies ApiResponse);
  });

  app.post('/api/friends/entertain', (req, res) => {
    const { friendId, itemId } = req.body;
    if (!friendId || !itemId) {
      res.status(400).json({ success: false, error: 'friendId and itemId are required' } satisfies ApiResponse);
      return;
    }
    const result = engine.entertainFriend((req as any).authKey, friendId, itemId);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.message } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: result } satisfies ApiResponse);
  });

  // ─── Lottery ───
  app.post('/api/lottery/play', (req, res) => {
    const result = engine.playLottery((req as any).authKey);
    if (!result) {
      res.status(400).json({ success: false, error: 'No four-leaf clover tickets available' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: result } satisfies ApiResponse);
  });

  app.get('/api/lottery/history', (req, res) => {
    const history = engine.getLotteryHistory((req as any).authKey);
    res.json({ success: true, data: history } satisfies ApiResponse);
  });

  // ─── Titles ───
  app.get('/api/titles', (req, res) => {
    const titles = engine.getTitles((req as any).authKey);
    res.json({ success: true, data: titles } satisfies ApiResponse);
  });

  app.post('/api/titles/check', (req, res) => {
    const newTitles = engine.checkTitles((req as any).authKey);
    res.json({ success: true, data: newTitles } satisfies ApiResponse);
  });

  // ─── Home ───
  app.post('/api/home/activity', (req, res) => {
    const { activity } = req.body || {};
    const event = engine.doHomeActivity((req as any).authKey, activity);
    res.json({ success: true, data: event } satisfies ApiResponse);
  });

  app.get('/api/home/events', (req, res) => {
    const events = engine.getHomeEvents((req as any).authKey);
    res.json({ success: true, data: events } satisfies ApiResponse);
  });

  // ─── Album ───
  app.get('/api/album/stats', (req, res) => {
    const stats = engine.getAlbumStats((req as any).authKey);
    res.json({ success: true, data: stats } satisfies ApiResponse);
  });

  // ─── Random Events ───
  app.post('/api/events/trigger', (req, res) => {
    const event = engine.triggerRandomEvent((req as any).authKey);
    res.json({ success: true, data: event } satisfies ApiResponse);
  });

  app.get('/api/events', (req, res) => {
    const events = engine.getRandomEvents((req as any).authKey);
    res.json({ success: true, data: events } satisfies ApiResponse);
  });

  // ─── NPC ───
  app.post('/api/npc/encounter', (req, res) => {
    const encounter = engine.encounterNPC((req as any).authKey);
    res.json({ success: true, data: encounter } satisfies ApiResponse);
  });

  app.get('/api/npc/history', (req, res) => {
    const encounters = engine.getNPCEncounters((req as any).authKey);
    res.json({ success: true, data: encounters } satisfies ApiResponse);
  });

  // ─── Weather ───
  app.get('/api/weather', (req, res) => {
    const weather = engine.getWeather((req as any).authKey);
    res.json({ success: true, data: weather } satisfies ApiResponse);
  });

  app.post('/api/weather/change', (req, res) => {
    const weather = engine.rollWeather((req as any).authKey);
    res.json({ success: true, data: weather } satisfies ApiResponse);
  });

  // ─── Quests ───
  app.get('/api/quests', (req, res) => {
    const quests = engine.getQuests((req as any).authKey);
    res.json({ success: true, data: quests } satisfies ApiResponse);
  });

  app.get('/api/quests/all', (req, res) => {
    const quests = engine.getAllQuests((req as any).authKey);
    res.json({ success: true, data: quests } satisfies ApiResponse);
  });

  app.post('/api/quests/generate', (req, res) => {
    const quest = engine.generateQuest((req as any).authKey);
    if (!quest) {
      res.status(400).json({ success: false, error: 'Max 3 active quests or no templates available' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: quest } satisfies ApiResponse);
  });

  // ─── Explore ───
  app.post('/api/explore', (req, res) => {
    const result = engine.explore((req as any).authKey);
    res.json({ success: true, data: result } satisfies ApiResponse);
  });

  return { app, storage, engine, mapManager };
}
