import { ApiResponse } from '../shared/types';

const DEFAULT_BASE_URL = 'http://localhost:3210';

export class ApiClient {
  private baseUrl: string;
  private authKey: string | null;

  constructor(baseUrl?: string, authKey?: string | null) {
    this.baseUrl = baseUrl || process.env.CLAW_SERVER_URL || DEFAULT_BASE_URL;
    this.authKey = authKey || null;
  }

  setAuthKey(key: string) {
    this.authKey = key;
  }

  getAuthKey(): string | null {
    return this.authKey;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authKey) {
      headers['x-auth-key'] = this.authKey;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return res.json() as Promise<ApiResponse<T>>;
  }

  // Auth
  register(name: string) { return this.request('POST', '/api/auth/register', { name }); }
  health() { return this.request('GET', '/api/health'); }

  // Status
  status() { return this.request('GET', '/api/status'); }
  statusHistory() { return this.request('GET', '/api/status/history'); }
  statusFull() { return this.request('GET', '/api/status/full'); }

  // Travel
  travelPlan(destination: string) { return this.request('POST', '/api/travel/plan', { destination }); }
  travelStart() { return this.request('POST', '/api/travel/start'); }
  travelStop() { return this.request('POST', '/api/travel/stop'); }
  travelLocation() { return this.request('GET', '/api/travel/location'); }

  // Photo
  photoTake(heading?: number, pitch?: number) { return this.request('POST', '/api/photo/take', { heading, pitch }); }
  photoAlbum() { return this.request('GET', '/api/photo/album'); }

  // Postcard
  postcardSend(to: string, message: string) { return this.request('POST', '/api/postcard/send', { to, message }); }
  postcardInbox() { return this.request('GET', '/api/postcard/inbox'); }

  // Interact
  interact() { return this.request('POST', '/api/interact'); }
  interactLook() { return this.request('GET', '/api/interact/look'); }

  // Message
  messageLeave(content: string) { return this.request('POST', '/api/message/leave', { content }); }
  messageRead() { return this.request('GET', '/api/message/read'); }

  // Poetry
  poetryWrite() { return this.request('POST', '/api/poetry/write'); }
  poetryCollection() { return this.request('GET', '/api/poetry/collection'); }

  // Art
  artCreate(style?: string) { return this.request('POST', '/api/art/create', { style }); }
  artGallery() { return this.request('GET', '/api/art/gallery'); }

  // Souvenir
  souvenirBuy() { return this.request('POST', '/api/souvenir/buy'); }
  souvenirInventory() { return this.request('GET', '/api/souvenir/inventory'); }

  // Tour
  tourStart() { return this.request('POST', '/api/tour/start'); }
  tourLandmarks() { return this.request('GET', '/api/tour/landmarks'); }

  // Rest & Eat
  rest() { return this.request('POST', '/api/rest'); }
  eat() { return this.request('POST', '/api/eat'); }

  // Agent
  agentStart() { return this.request('POST', '/api/agent/start'); }
  agentStop() { return this.request('POST', '/api/agent/stop'); }
  agentStatus() { return this.request('GET', '/api/agent/status'); }
  agentLog() { return this.request('GET', '/api/agent/log'); }
  agentStep() { return this.request('POST', '/api/agent/step'); }

  // Map
  mapProviders() { return this.request('GET', '/api/map/providers'); }
  mapSetProvider(provider: string) { return this.request('POST', '/api/map/provider', { provider }); }

  // Garden
  garden() { return this.request('GET', '/api/garden'); }
  gardenHarvest() { return this.request('POST', '/api/garden/harvest'); }

  // Shop
  shopList() { return this.request('GET', '/api/shop'); }
  shopBuy(itemId: string) { return this.request('POST', '/api/shop/buy', { itemId }); }

  // Backpack
  backpack() { return this.request('GET', '/api/backpack'); }
  backpackUse(itemId: string) { return this.request('POST', '/api/backpack/use', { itemId }); }

  // Friends
  friends() { return this.request('GET', '/api/friends'); }
  friendsCheck() { return this.request('POST', '/api/friends/check'); }
  friendsEntertain(friendId: string, itemId: string) { return this.request('POST', '/api/friends/entertain', { friendId, itemId }); }

  // Lottery
  lotteryPlay() { return this.request('POST', '/api/lottery/play'); }
  lotteryHistory() { return this.request('GET', '/api/lottery/history'); }

  // Titles
  titles() { return this.request('GET', '/api/titles'); }
  titlesCheck() { return this.request('POST', '/api/titles/check'); }

  // Home
  homeActivity(activity?: string) { return this.request('POST', '/api/home/activity', activity ? { activity } : {}); }
  homeEvents() { return this.request('GET', '/api/home/events'); }

  // Album
  albumStats() { return this.request('GET', '/api/album/stats'); }

  // Random Events
  eventsTrigger() { return this.request('POST', '/api/events/trigger'); }
  eventsHistory() { return this.request('GET', '/api/events'); }

  // NPC
  npcEncounter() { return this.request('POST', '/api/npc/encounter'); }
  npcHistory() { return this.request('GET', '/api/npc/history'); }

  // Weather
  weather() { return this.request('GET', '/api/weather'); }
  weatherChange() { return this.request('POST', '/api/weather/change'); }

  // Quests
  quests() { return this.request('GET', '/api/quests'); }
  questsAll() { return this.request('GET', '/api/quests/all'); }
  questsGenerate() { return this.request('POST', '/api/quests/generate'); }

  // Explore
  explore() { return this.request('POST', '/api/explore'); }
}
