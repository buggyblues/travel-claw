import { nanoid } from 'nanoid';
import {
  Character, TravelPlan, Photo, Postcard, Poem, Artwork,
  Souvenir, LocationMessage, SceneInteraction, TravelHistoryEntry,
  AgentLogEntry, Location, Landmark, GameState,
  SCENE_TEMPLATES, WEATHER_OPTIONS, ADJECTIVES, SCENTS, COLORS, REACTIONS,
  FAMOUS_LOCATIONS, SHOP_ITEMS, FRIEND_TEMPLATES, VISITOR_MESSAGES,
  HOME_ACTIVITY_TEMPLATES, TITLE_DEFINITIONS, LOTTERY_PRIZES,
  ShopItem, BackpackSlot, Friend, VisitorEvent, LotteryResult,
  Title, Garden, HomeEvent, HomeActivity,
  RandomEvent, NPCEncounter, NPC, Quest, Weather, WeatherType,
  RANDOM_EVENT_TEMPLATES, NPC_TEMPLATES, NPC_OUTCOMES,
  WEATHER_DATA, QUEST_TEMPLATES,
} from '../../shared/types';
import { Storage } from '../storage/storage';
import { MapAdapterManager } from '../map/adapter';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class GameEngine {
  constructor(
    private storage: Storage,
    private mapManager: MapAdapterManager,
  ) {}

  private map() {
    return this.mapManager.getProvider();
  }

  // ─── Auth & Character ───
  register(name: string): { authKey: string; character: Character } {
    const character = this.storage.createCharacter(name);
    const session = this.storage.createSession(character.id);
    return { authKey: session.authKey, character };
  }

  getCharacterByAuth(authKey: string): Character | null {
    const session = this.storage.getSession(authKey);
    if (!session) return null;
    return this.storage.getCharacter(session.characterId);
  }

  getCharacterId(authKey: string): string | null {
    const session = this.storage.getSession(authKey);
    return session?.characterId || null;
  }

  getGameState(authKey: string): GameState | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    return this.storage.getGameState(charId);
  }

  // ─── Status ───
  getStatus(authKey: string): Character | null {
    return this.getCharacterByAuth(authKey);
  }

  getHistory(authKey: string): TravelHistoryEntry[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getHistory(charId);
  }

  // ─── Travel ───
  async planTravel(authKey: string, destination: string): Promise<TravelPlan | null> {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    const destLocation = await this.map().geocode(destination);
    const directions = await this.map().getDirections(character.currentLocation.coordinates, destLocation.coordinates);

    const plan: TravelPlan = {
      id: nanoid(),
      origin: character.currentLocation,
      destination: destLocation,
      distanceKm: directions.distanceKm,
      estimatedHours: directions.durationHours,
      status: 'planning',
      route: directions.route,
    };

    this.storage.saveTravelPlan(charId, plan);
    return plan;
  }

  startTravel(authKey: string): TravelPlan | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const plan = this.storage.getTravelPlan(charId);
    if (!plan || plan.status !== 'planning') return null;

    const character = this.storage.getCharacter(charId)!;
    if (character.stats.fatigue > 90) return null; // too tired

    plan.status = 'traveling';
    plan.startedAt = new Date().toISOString();
    this.storage.saveTravelPlan(charId, plan);

    // Simulate instant travel (game time), update location & stats
    character.currentLocation = plan.destination;
    character.stats.fatigue = Math.min(100, character.stats.fatigue + Math.floor(plan.distanceKm / 100));
    character.stats.hunger = Math.min(100, character.stats.hunger + Math.floor(plan.distanceKm / 200));
    character.stats.experience += Math.floor(plan.distanceKm / 10);
    character.stats.mood = Math.max(0, Math.min(100, character.stats.mood + 5));
    character.stats.money -= Math.floor(plan.distanceKm / 500) * 10;
    this.storage.updateCharacter(character);

    plan.status = 'arrived';
    plan.arrivedAt = new Date().toISOString();
    this.storage.saveTravelPlan(charId, plan);

    // Add to travel history
    const historyEntry: TravelHistoryEntry = {
      id: nanoid(),
      location: plan.destination,
      arrivedAt: plan.arrivedAt,
      activities: ['arrived'],
    };
    this.storage.addHistory(charId, historyEntry);

    // Weather changes when traveling
    this.rollWeather(authKey);

    // 40% chance of a random event during travel
    if (Math.random() < 0.4) {
      this.triggerRandomEvent(authKey);
    }

    // Progress quests
    this.progressQuest(authKey, 'travels');

    return plan;
  }

  stopTravel(authKey: string): boolean {
    const charId = this.getCharacterId(authKey);
    if (!charId) return false;
    this.storage.deleteTravelPlan(charId);
    return true;
  }

  getLocation(authKey: string): Location | null {
    const character = this.getCharacterByAuth(authKey);
    return character?.currentLocation || null;
  }

  // ─── Photo (Street View) ───
  takePhoto(authKey: string, heading?: number, pitch?: number): Photo | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;
    const loc = character.currentLocation;

    const h = heading ?? Math.floor(Math.random() * 360);
    const p = pitch ?? Math.floor(Math.random() * 40 - 20);

    const photo: Photo = {
      id: nanoid(),
      location: loc,
      imageUrl: this.map().getStreetViewUrl(loc.coordinates, h, p),
      caption: `${character.name} at ${loc.name}, ${loc.city} - ${pick(WEATHER_OPTIONS)} day`,
      takenAt: new Date().toISOString(),
      heading: h,
      pitch: p,
    };

    this.storage.addPhoto(charId, photo);
    character.stats.experience += 5;
    character.stats.mood = Math.min(100, character.stats.mood + 2);
    this.storage.updateCharacter(character);

    this.progressQuest(authKey, 'photos');

    return photo;
  }

  getAlbum(authKey: string): Photo[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getPhotos(charId);
  }

  // ─── Postcard ───
  sendPostcard(authKey: string, to: string, message: string): Postcard | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    if (character.stats.money < 20) return null; // not enough money

    const postcard: Postcard = {
      id: nanoid(),
      from: character.currentLocation,
      to,
      message,
      photoUrl: this.map().getStaticMapUrl(character.currentLocation.coordinates),
      sentAt: new Date().toISOString(),
    };

    this.storage.addPostcard(charId, postcard);
    character.stats.money -= 20;
    character.stats.mood = Math.min(100, character.stats.mood + 3);
    this.storage.updateCharacter(character);

    this.progressQuest(authKey, 'postcards');

    return postcard;
  }

  getPostcards(authKey: string): Postcard[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getPostcards(charId);
  }

  // ─── Interact with Scene ───
  interact(authKey: string): SceneInteraction | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;
    const loc = character.currentLocation;

    const template = pick(SCENE_TEMPLATES);
    const description = template
      .replace('{landmark}', loc.name)
      .replace('{place}', `${loc.city}, ${loc.country}`)
      .replace('{weather}', pick(WEATHER_OPTIONS))
      .replace('{adj}', pick(ADJECTIVES))
      .replace('{scent}', pick(SCENTS))
      .replace('{color}', pick(COLORS))
      .replace('{detail}', pick(REACTIONS))
      .replace('{reaction}', pick(REACTIONS))
      .replace('{interaction}', pick(REACTIONS))
      .replace('{feature}', pick(['garden', 'fountain', 'market', 'cafe', 'temple', 'museum']))
      .replace('{time}', pick(['morning', 'afternoon', 'evening', 'golden hour']));

    const moodChange = Math.floor(Math.random() * 10) + 1;
    const xpGain = Math.floor(Math.random() * 15) + 5;

    const interaction: SceneInteraction = {
      id: nanoid(),
      location: loc,
      description,
      moodChange,
      experienceGain: xpGain,
      timestamp: new Date().toISOString(),
    };

    this.storage.addInteraction(charId, interaction);
    character.stats.mood = Math.min(100, character.stats.mood + moodChange);
    character.stats.experience += xpGain;
    character.stats.fatigue = Math.min(100, character.stats.fatigue + 2);
    this.storage.updateCharacter(character);

    this.progressQuest(authKey, 'interactions');

    // 20% chance of NPC encounter during interaction
    if (Math.random() < 0.2) {
      this.encounterNPC(authKey);
    }

    return interaction;
  }

  lookAround(authKey: string): { description: string; mapUrl: string } | null {
    const character = this.getCharacterByAuth(authKey);
    if (!character) return null;
    const loc = character.currentLocation;
    const weather = pick(WEATHER_OPTIONS);

    return {
      description: `🦞 ${character.name} looks around at ${loc.name}, ${loc.city}, ${loc.country}.\n` +
        `The sky is ${weather}. ${pick(REACTIONS)}\n` +
        `📍 Coordinates: ${loc.coordinates.lat.toFixed(4)}, ${loc.coordinates.lng.toFixed(4)}`,
      mapUrl: this.map().getStaticMapUrl(loc.coordinates),
    };
  }

  // ─── Messages ───
  leaveMessage(authKey: string, content: string): LocationMessage | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    const message: LocationMessage = {
      id: nanoid(),
      location: character.currentLocation,
      content,
      leftAt: new Date().toISOString(),
      author: character.name,
    };

    this.storage.addMessage(charId, message);
    character.stats.experience += 3;
    this.storage.updateCharacter(character);

    return message;
  }

  readMessages(authKey: string): LocationMessage[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getMessages(charId);
  }

  // ─── Poetry ───
  writePoem(authKey: string): Poem | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;
    const loc = character.currentLocation;

    const titles = [
      `Ode to ${loc.name}`,
      `A ${pick(WEATHER_OPTIONS)} Day in ${loc.city}`,
      `The Lobster's Dream at ${loc.name}`,
      `Whispers of ${loc.city}`,
      `Beneath the Sky of ${loc.country}`,
    ];

    const lines = [
      `In ${loc.city}, where the ${pick(ADJECTIVES)} winds blow,`,
      `A lobster wandered, claws aglow.`,
      `The ${pick(WEATHER_OPTIONS)} sky above, the earth below,`,
      `Past ${loc.name}, through time's gentle flow.`,
      ``,
      `The scent of ${pick(SCENTS)} filled the air,`,
      `With ${pick(COLORS)} hues beyond compare.`,
      `${pick(REACTIONS)}`,
      `A moment treasured, beyond all care.`,
    ];

    const poem: Poem = {
      id: nanoid(),
      title: pick(titles),
      content: lines.join('\n'),
      location: loc,
      writtenAt: new Date().toISOString(),
    };

    this.storage.addPoem(charId, poem);
    character.stats.experience += 15;
    character.stats.mood = Math.min(100, character.stats.mood + 5);
    character.stats.fatigue = Math.min(100, character.stats.fatigue + 5);
    this.storage.updateCharacter(character);

    this.progressQuest(authKey, 'poems');

    return poem;
  }

  getPoems(authKey: string): Poem[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getPoems(charId);
  }

  // ─── Art ───
  createArt(authKey: string, style?: string): Artwork | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    if (character.stats.money < 50) return null;

    const loc = character.currentLocation;
    const artStyle = style || pick(['watercolor', 'oil painting', 'sketch', 'digital', 'impressionist', 'pixel art']);

    // Simulated text-to-image URL (would call a real API like DALL-E or Stable Diffusion)
    const prompt = encodeURIComponent(`${artStyle} of ${loc.name} in ${loc.city}, ${loc.country}, beautiful scenic view`);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=600&height=400`;

    const artwork: Artwork = {
      id: nanoid(),
      title: `${artStyle.charAt(0).toUpperCase() + artStyle.slice(1)} of ${loc.name}`,
      imageUrl,
      description: `A beautiful ${artStyle} depicting ${loc.name} in ${loc.city}, created by ${character.name} the lobster.`,
      location: loc,
      createdAt: new Date().toISOString(),
      style: artStyle,
    };

    this.storage.addArtwork(charId, artwork);
    character.stats.money -= 50;
    character.stats.experience += 20;
    character.stats.mood = Math.min(100, character.stats.mood + 8);
    character.stats.fatigue = Math.min(100, character.stats.fatigue + 10);
    this.storage.updateCharacter(character);

    this.progressQuest(authKey, 'artworks');

    return artwork;
  }

  getArtworks(authKey: string): Artwork[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getArtworks(charId);
  }

  // ─── Souvenirs ───
  buySouvenir(authKey: string): Souvenir | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;
    const loc = character.currentLocation;

    const souvenirTypes = [
      { name: `${loc.city} Snow Globe`, price: 30 },
      { name: `${loc.name} Miniature`, price: 50 },
      { name: `${loc.country} Magnet`, price: 15 },
      { name: `${loc.city} Postcard Set`, price: 10 },
      { name: `${loc.city} T-Shirt`, price: 40 },
      { name: `${loc.country} Traditional Craft`, price: 80 },
      { name: `${loc.city} Keychain`, price: 12 },
      { name: `Local Specialty Food from ${loc.city}`, price: 25 },
    ];

    const item = pick(souvenirTypes);
    if (character.stats.money < item.price) return null;

    const souvenir: Souvenir = {
      id: nanoid(),
      name: item.name,
      description: `A lovely ${item.name} from ${loc.name}, ${loc.city}`,
      price: item.price,
      location: loc,
      boughtAt: new Date().toISOString(),
    };

    this.storage.addSouvenir(charId, souvenir);
    character.stats.money -= item.price;
    character.stats.mood = Math.min(100, character.stats.mood + 3);
    character.stats.experience += 5;
    this.storage.updateCharacter(character);

    this.progressQuest(authKey, 'souvenirs');

    return souvenir;
  }

  getSouvenirs(authKey: string): Souvenir[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getSouvenirs(charId);
  }

  // ─── Tour ───
  async startTour(authKey: string): Promise<SceneInteraction | null> {
    // Tour is essentially an enhanced interaction
    return this.interact(authKey);
  }

  async getLandmarks(authKey: string): Promise<Landmark[]> {
    const character = this.getCharacterByAuth(authKey);
    if (!character) return [];
    return this.map().getNearbyLandmarks(character.currentLocation.coordinates);
  }

  // ─── Rest ───
  rest(authKey: string): Character | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;
    character.stats.fatigue = Math.max(0, character.stats.fatigue - 30);
    character.stats.hunger = Math.min(100, character.stats.hunger + 10);
    character.stats.health = Math.min(100, character.stats.health + 5);
    character.stats.mood = Math.min(100, character.stats.mood + 5);
    this.storage.updateCharacter(character);
    return character;
  }

  // ─── Eat ───
  eat(authKey: string): Character | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;
    if (character.stats.money < 15) return null;
    character.stats.hunger = Math.max(0, character.stats.hunger - 40);
    character.stats.money -= 15;
    character.stats.mood = Math.min(100, character.stats.mood + 3);
    character.stats.health = Math.min(100, character.stats.health + 2);
    this.storage.updateCharacter(character);
    return character;
  }

  // ─── Agent ───
  getAgentStatus(authKey: string): { status: string; log: AgentLogEntry[] } | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    return {
      status: this.storage.getAgentStatus(charId),
      log: this.storage.getAgentLog(charId),
    };
  }

  async runAgentStep(authKey: string): Promise<AgentLogEntry | null> {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    // Autonomous decision-making based on character state
    const actions = this.decideAgentAction(character);
    const action = pick(actions);

    let detail = '';
    switch (action) {
      case 'travel': {
        const dest = pick(FAMOUS_LOCATIONS.filter(l => l.name !== character.currentLocation.name));
        await this.planTravel(authKey, dest.name);
        this.startTravel(authKey);
        detail = `Traveled to ${dest.name}, ${dest.city}`;
        break;
      }
      case 'photo': {
        const photo = this.takePhoto(authKey);
        detail = photo ? `Took a photo at ${photo.location.name}` : 'Failed to take photo';
        break;
      }
      case 'interact': {
        const interaction = this.interact(authKey);
        detail = interaction ? interaction.description : 'No interaction';
        break;
      }
      case 'poem': {
        const poem = this.writePoem(authKey);
        detail = poem ? `Wrote "${poem.title}"` : 'Failed to write poem';
        break;
      }
      case 'art': {
        const art = this.createArt(authKey);
        detail = art ? `Created "${art.title}"` : 'Not enough money for art';
        break;
      }
      case 'souvenir': {
        const s = this.buySouvenir(authKey);
        detail = s ? `Bought "${s.name}" for $${s.price}` : 'Not enough money';
        break;
      }
      case 'postcard': {
        const pc = this.sendPostcard(authKey, 'Home', `Greetings from ${character.currentLocation.city}!`);
        detail = pc ? `Sent postcard from ${pc.from.city}` : 'Not enough money for postcard';
        break;
      }
      case 'message': {
        const msg = this.leaveMessage(authKey, `${character.name} was here! 🦞`);
        detail = msg ? `Left message at ${msg.location.name}` : 'Failed to leave message';
        break;
      }
      case 'rest': {
        this.rest(authKey);
        detail = 'Took a rest to recover energy';
        break;
      }
      case 'eat': {
        const ate = this.eat(authKey);
        detail = ate ? 'Had a delicious local meal' : 'Not enough money to eat';
        break;
      }
    }

    const entry: AgentLogEntry = {
      id: nanoid(),
      action,
      detail,
      timestamp: new Date().toISOString(),
      location: character.currentLocation,
    };

    this.storage.addAgentLog(charId, entry);
    return entry;
  }

  startAgent(authKey: string): boolean {
    const charId = this.getCharacterId(authKey);
    if (!charId) return false;
    this.storage.setAgentStatus(charId, 'running');
    return true;
  }

  stopAgent(authKey: string): boolean {
    const charId = this.getCharacterId(authKey);
    if (!charId) return false;
    this.storage.setAgentStatus(charId, 'idle');
    return true;
  }

  getAgentLog(authKey: string): AgentLogEntry[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getAgentLog(charId);
  }

  // ─── Garden (Clover) ───
  harvestGarden(authKey: string): Garden | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const garden = this.storage.getGarden(charId);

    const now = Date.now();
    const lastHarvest = new Date(garden.lastHarvestAt).getTime();
    const hoursElapsed = (now - lastHarvest) / (1000 * 60 * 60);

    const newClovers = Math.floor(hoursElapsed * garden.growthRate);
    const fourLeafChance = newClovers > 0 ? Math.random() < 0.05 * newClovers : false;

    garden.clovers += newClovers;
    if (fourLeafChance) garden.fourLeafClovers += 1;
    garden.lastHarvestAt = new Date().toISOString();

    // Convert clovers to money (10 clovers = 1 money)
    const moneyEarned = Math.floor(garden.clovers / 10);
    if (moneyEarned > 0) {
      const character = this.storage.getCharacter(charId)!;
      character.stats.money += moneyEarned;
      garden.clovers %= 10;
      this.storage.updateCharacter(character);
    }

    this.storage.saveGarden(charId, garden);
    this.progressQuest(authKey, 'harvests');
    this.checkTitles(authKey);
    return garden;
  }

  getGarden(authKey: string): Garden | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    return this.storage.getGarden(charId);
  }

  // ─── Shop ───
  getShopItems(): ShopItem[] {
    return SHOP_ITEMS;
  }

  buyItem(authKey: string, itemId: string): BackpackSlot[] | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return null;
    if (character.stats.money < item.price) return null;

    character.stats.money -= item.price;
    this.storage.updateCharacter(character);

    const backpack = this.storage.getBackpack(charId);
    const existing = backpack.find(s => s.item.id === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      backpack.push({ item, quantity: 1 });
    }
    this.storage.saveBackpack(charId, backpack);

    return backpack;
  }

  // ─── Backpack ───
  getBackpack(authKey: string): BackpackSlot[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getBackpack(charId);
  }

  useItem(authKey: string, itemId: string): { used: boolean; message: string } {
    const charId = this.getCharacterId(authKey);
    if (!charId) return { used: false, message: 'Not authenticated' };

    const backpack = this.storage.getBackpack(charId);
    const slot = backpack.find(s => s.item.id === itemId);
    if (!slot || slot.quantity <= 0) return { used: false, message: 'Item not in backpack' };

    const character = this.storage.getCharacter(charId)!;
    const item = slot.item;

    // Apply item effect
    const stat = item.effect.stat;
    const newVal = character.stats[stat] + item.effect.value;
    character.stats[stat] = Math.max(0, Math.min(stat === 'money' ? Infinity : 100, newVal));
    this.storage.updateCharacter(character);

    // Reduce quantity
    slot.quantity -= 1;
    const updatedBackpack = backpack.filter(s => s.quantity > 0);
    this.storage.saveBackpack(charId, updatedBackpack);

    return { used: true, message: `Used ${item.name}: ${item.description}` };
  }

  // ─── Friends / Visitors ───
  checkVisitors(authKey: string): VisitorEvent | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;

    // 30% chance a friend visits
    if (Math.random() > 0.3) return null;

    const friends = this.storage.getFriends(charId);
    let friend: Friend;

    if (friends.length < FRIEND_TEMPLATES.length && Math.random() < 0.4) {
      // Introduce new friend
      const existingTypes = friends.map(f => f.type);
      const newTemplate = FRIEND_TEMPLATES.find(t => !existingTypes.includes(t.type));
      if (!newTemplate) return null;
      friend = { id: nanoid(), ...newTemplate, friendship: 10, visitCount: 1, gifts: [] };
      this.storage.addFriend(charId, friend);
    } else if (friends.length > 0) {
      friend = pick(friends);
      friend.visitCount += 1;
      friend.lastVisit = new Date().toISOString();
      this.storage.updateFriend(charId, friend);
    } else {
      return null;
    }

    const message = pick(VISITOR_MESSAGES).replace('{name}', friend.name);
    const cloverReward = Math.floor(Math.random() * 5) + 1;
    const gifts = ['a pretty shell', 'some dried seaweed', 'a smooth pebble', 'a coral piece', 'a sea glass'];

    const event: VisitorEvent = {
      id: nanoid(),
      friend,
      message,
      gift: Math.random() < 0.5 ? pick(gifts) : undefined,
      cloverReward,
      timestamp: new Date().toISOString(),
    };

    this.storage.addVisitorEvent(charId, event);

    // Add clover reward to garden
    const garden = this.storage.getGarden(charId);
    garden.clovers += cloverReward;
    this.storage.saveGarden(charId, garden);

    this.progressQuest(authKey, 'visitor_checks');
    this.checkTitles(authKey);
    return event;
  }

  entertainFriend(authKey: string, friendId: string, itemId: string): { success: boolean; message: string } {
    const charId = this.getCharacterId(authKey);
    if (!charId) return { success: false, message: 'Not authenticated' };

    const friends = this.storage.getFriends(charId);
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return { success: false, message: 'Friend not found' };

    const backpack = this.storage.getBackpack(charId);
    const slot = backpack.find(s => s.item.id === itemId);
    if (!slot || slot.quantity <= 0) return { success: false, message: 'Item not in backpack' };

    // Give item to friend
    slot.quantity -= 1;
    this.storage.saveBackpack(charId, backpack.filter(s => s.quantity > 0));

    friend.friendship = Math.min(100, friend.friendship + 15);
    friend.gifts.push(slot.item.name);
    this.storage.updateFriend(charId, friend);

    this.checkTitles(authKey);
    return { success: true, message: `${friend.name} loved the ${slot.item.name}! Friendship +15 (now ${friend.friendship})` };
  }

  getFriends(authKey: string): Friend[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getFriends(charId);
  }

  // ─── Lottery ───
  playLottery(authKey: string): LotteryResult | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;

    const garden = this.storage.getGarden(charId);
    if (garden.fourLeafClovers <= 0) return null; // need a ticket

    garden.fourLeafClovers -= 1;
    this.storage.saveGarden(charId, garden);

    // Weighted random prize
    const totalWeight = LOTTERY_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    let selected = LOTTERY_PRIZES[LOTTERY_PRIZES.length - 1];
    for (const p of LOTTERY_PRIZES) {
      roll -= p.weight;
      if (roll <= 0) { selected = p; break; }
    }

    const moneyWon = selected.moneyRange[0] + Math.floor(Math.random() * (selected.moneyRange[1] - selected.moneyRange[0]));
    const result: LotteryResult = {
      id: nanoid(),
      prize: selected.prize,
      reward: pick(selected.rewards),
      moneyWon,
      timestamp: new Date().toISOString(),
    };

    const character = this.storage.getCharacter(charId)!;
    character.stats.money += moneyWon;
    character.stats.mood = Math.min(100, character.stats.mood + (selected.prize === 'jackpot' ? 30 : 10));
    this.storage.updateCharacter(character);

    this.storage.addLotteryResult(charId, result);
    this.checkTitles(authKey);
    return result;
  }

  getLotteryHistory(authKey: string): LotteryResult[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getLotteryResults(charId);
  }

  // ─── Titles / Achievements ───
  checkTitles(authKey: string): Title[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];

    const state = this.storage.getGameState(charId);
    if (!state) return [];

    const existing = state.titles.map(t => t.name);
    const newTitles: Title[] = [];

    for (const def of TITLE_DEFINITIONS) {
      if (existing.includes(def.name)) continue;

      const [type, countStr] = def.condition.split(':');
      const count = countStr ? parseInt(countStr) : 0;
      let earned = false;

      switch (type) {
        case 'register': earned = true; break;
        case 'travel_count': earned = state.travelHistory.length >= count; break;
        case 'cities_visited': {
          const cities = new Set(state.travelHistory.map(h => h.location.city));
          earned = cities.size >= count;
          break;
        }
        case 'photos': earned = state.photos.length >= count; break;
        case 'postcards': earned = state.postcards.length >= count; break;
        case 'poems': earned = state.poems.length >= count; break;
        case 'artworks': earned = state.artworks.length >= count; break;
        case 'souvenirs': earned = state.souvenirs.length >= count; break;
        case 'friends': earned = state.friends.filter(f => f.friendship >= 50).length >= count; break;
        case 'lottery_jackpot': earned = state.lotteryHistory.some(l => l.prize === 'jackpot'); break;
        case 'clovers_harvested': earned = state.character.stats.experience >= count * 2; break; // approximation
        case 'money': earned = state.character.stats.money >= count; break;
        case 'home_activities': earned = state.homeEvents.length >= count; break;
        case 'packed_travels': earned = state.travelHistory.length >= count; break; // approximation
      }

      if (earned) {
        const title: Title = { id: nanoid(), ...def, unlockedAt: new Date().toISOString() };
        this.storage.addTitle(charId, title);
        newTitles.push(title);
      }
    }

    return newTitles;
  }

  getTitles(authKey: string): Title[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getTitles(charId);
  }

  // ─── Home Activities ───
  doHomeActivity(authKey: string, activity?: HomeActivity): HomeEvent | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;

    const activities = Object.keys(HOME_ACTIVITY_TEMPLATES) as HomeActivity[];
    const chosen = activity && activities.includes(activity) ? activity : pick(activities);
    const template = HOME_ACTIVITY_TEMPLATES[chosen];

    const event: HomeEvent = {
      id: nanoid(),
      activity: chosen,
      description: pick(template.descriptions),
      statsEffect: template.effects,
      timestamp: new Date().toISOString(),
    };

    this.storage.addHomeEvent(charId, event);

    const character = this.storage.getCharacter(charId)!;
    for (const [stat, value] of Object.entries(template.effects)) {
      const s = stat as keyof typeof character.stats;
      const newVal = character.stats[s] + (value as number);
      character.stats[s] = Math.max(0, Math.min(s === 'money' ? Infinity : 100, newVal));
    }
    this.storage.updateCharacter(character);

    this.progressQuest(authKey, 'home_activities');
    this.checkTitles(authKey);
    return event;
  }

  getHomeEvents(authKey: string): HomeEvent[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getHomeEvents(charId);
  }

  // ─── Collection Album ───
  getAlbumStats(authKey: string): { photos: number; souvenirs: number; cities: number; totalCities: number; completionPct: number } | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const state = this.storage.getGameState(charId);
    if (!state) return null;

    const cities = new Set(state.travelHistory.map(h => h.location.city));
    const totalCities = FAMOUS_LOCATIONS.length;
    const completionPct = Math.floor(
      ((state.photos.length + state.souvenirs.length + cities.size) /
       (totalCities * 3)) * 100
    );

    return {
      photos: state.photos.length,
      souvenirs: state.souvenirs.length,
      cities: cities.size,
      totalCities,
      completionPct: Math.min(100, completionPct),
    };
  }

  // ─── Random Events ───
  triggerRandomEvent(authKey: string): RandomEvent | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    const template = pick(RANDOM_EVENT_TEMPLATES);
    const event: RandomEvent = {
      id: nanoid(),
      ...template,
      timestamp: new Date().toISOString(),
      location: character.currentLocation,
    };

    // Apply stat changes
    for (const [stat, value] of Object.entries(event.statChanges)) {
      const s = stat as keyof typeof character.stats;
      const newVal = character.stats[s] + (value as number);
      character.stats[s] = Math.max(0, Math.min(s === 'money' ? Infinity : 100, newVal));
    }
    character.stats.money = Math.max(0, character.stats.money + event.moneyChange);

    // Give item reward if any
    if (event.itemReward) {
      const item = SHOP_ITEMS.find(i => i.id === event.itemReward);
      if (item) {
        const backpack = this.storage.getBackpack(charId);
        const existing = backpack.find(s => s.item.id === item.id);
        if (existing) existing.quantity += 1;
        else backpack.push({ item, quantity: 1 });
        this.storage.saveBackpack(charId, backpack);
      }
    }

    this.storage.updateCharacter(character);
    this.storage.addRandomEvent(charId, event);
    return event;
  }

  getRandomEvents(authKey: string): RandomEvent[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getRandomEvents(charId);
  }

  // ─── NPC Encounters ───
  encounterNPC(authKey: string): NPCEncounter | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    const npcTemplate = pick(NPC_TEMPLATES);
    const npc: NPC = {
      id: nanoid(),
      ...npcTemplate,
      location: character.currentLocation,
    };

    const outcomes = NPC_OUTCOMES[npc.role];
    const outcomeData = pick(outcomes);
    const outcome = pick(outcomeData.outcomes);
    const dialogue = pick(npc.dialogue);

    const encounter: NPCEncounter = {
      id: nanoid(),
      npc,
      dialogue,
      outcome,
      statChanges: outcomeData.statChanges,
      moneyChange: outcomeData.moneyChange,
      itemReward: outcomeData.itemReward,
      timestamp: new Date().toISOString(),
      location: character.currentLocation,
    };

    // Apply stat changes
    for (const [stat, value] of Object.entries(encounter.statChanges)) {
      const s = stat as keyof typeof character.stats;
      const newVal = character.stats[s] + (value as number);
      character.stats[s] = Math.max(0, Math.min(s === 'money' ? Infinity : 100, newVal));
    }
    character.stats.money = Math.max(0, character.stats.money + encounter.moneyChange);

    // Give item reward if any
    if (encounter.itemReward) {
      const item = SHOP_ITEMS.find(i => i.id === encounter.itemReward);
      if (item) {
        const backpack = this.storage.getBackpack(charId);
        const existing = backpack.find(s => s.item.id === item.id);
        if (existing) existing.quantity += 1;
        else backpack.push({ item, quantity: 1 });
        this.storage.saveBackpack(charId, backpack);
      }
    }

    this.storage.updateCharacter(character);
    this.storage.addNPCEncounter(charId, encounter);
    return encounter;
  }

  getNPCEncounters(authKey: string): NPCEncounter[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getNPCEncounters(charId);
  }

  // ─── Weather ───
  rollWeather(authKey: string): Weather | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;

    const types = Object.keys(WEATHER_DATA) as WeatherType[];
    const newType = pick(types);
    const weather = WEATHER_DATA[newType];

    this.storage.saveWeather(charId, weather);

    // Apply weather modifiers to character
    const character = this.storage.getCharacter(charId)!;
    for (const [stat, value] of Object.entries(weather.statModifiers)) {
      const s = stat as keyof typeof character.stats;
      const newVal = character.stats[s] + (value as number);
      character.stats[s] = Math.max(0, Math.min(s === 'money' ? Infinity : 100, newVal));
    }
    this.storage.updateCharacter(character);

    return weather;
  }

  getWeather(authKey: string): Weather | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    return this.storage.getWeather(charId);
  }

  // ─── Quests ───
  getQuests(authKey: string): Quest[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getQuests(charId).filter(q => q.status === 'active');
  }

  getAllQuests(authKey: string): Quest[] {
    const charId = this.getCharacterId(authKey);
    if (!charId) return [];
    return this.storage.getQuests(charId);
  }

  generateQuest(authKey: string): Quest | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;

    // Max 3 active quests
    const activeQuests = this.storage.getQuests(charId).filter(q => q.status === 'active');
    if (activeQuests.length >= 3) return null;

    // Pick a quest template not already active
    const activeObjectives = activeQuests.map(q => q.objective);
    const available = QUEST_TEMPLATES.filter(qt => !activeObjectives.includes(qt.objective));
    if (available.length === 0) return null;

    const template = pick(available);
    const quest: Quest = {
      id: nanoid(),
      ...template,
      currentCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.storage.addQuest(charId, quest);
    return quest;
  }

  private progressQuest(authKey: string, objective: string): void {
    const charId = this.getCharacterId(authKey);
    if (!charId) return;

    const quests = this.storage.getQuests(charId).filter(q => q.status === 'active' && q.objective === objective);
    for (const quest of quests) {
      quest.currentCount += 1;
      if (quest.currentCount >= quest.targetCount) {
        quest.status = 'completed';
        quest.completedAt = new Date().toISOString();
        // Give rewards
        const character = this.storage.getCharacter(charId)!;
        character.stats.money += quest.reward.money;
        character.stats.experience += quest.reward.experience;
        character.stats.mood = Math.min(100, character.stats.mood + 10);
        this.storage.updateCharacter(character);
      }
      this.storage.updateQuest(charId, quest);
    }
  }

  // ─── Explore (combined random event + NPC) ───
  explore(authKey: string): { event?: RandomEvent; npc?: NPCEncounter; weather: Weather | null } | null {
    const charId = this.getCharacterId(authKey);
    if (!charId) return null;
    const character = this.storage.getCharacter(charId)!;

    // Exploring costs some fatigue
    character.stats.fatigue = Math.min(100, character.stats.fatigue + 5);
    character.stats.experience += 5;
    this.storage.updateCharacter(character);

    const result: { event?: RandomEvent; npc?: NPCEncounter; weather: Weather | null } = {
      weather: this.storage.getWeather(charId),
    };

    // 60% chance random event
    if (Math.random() < 0.6) {
      result.event = this.triggerRandomEvent(authKey) || undefined;
    }

    // 40% chance NPC encounter
    if (Math.random() < 0.4) {
      result.npc = this.encounterNPC(authKey) || undefined;
    }

    // 15% chance weather changes
    if (Math.random() < 0.15) {
      result.weather = this.rollWeather(authKey);
    }

    return result;
  }

  private decideAgentAction(character: Character): string[] {
    const actions: string[] = [];

    if (character.stats.fatigue > 70) {
      actions.push('rest', 'rest', 'rest'); // heavily weighted
    }
    if (character.stats.hunger > 60) {
      actions.push('eat', 'eat');
    }
    if (character.stats.mood < 50) {
      actions.push('interact', 'poem', 'art');
    }
    // Always consider normal activities
    actions.push('travel', 'photo', 'interact', 'poem', 'souvenir', 'postcard', 'message');

    if (character.stats.money > 200) {
      actions.push('art', 'souvenir');
    }
    if (character.stats.money < 50) {
      // Remove expensive actions when low on money
      return actions.filter(a => !['art', 'souvenir'].includes(a));
    }

    return actions;
  }
}
