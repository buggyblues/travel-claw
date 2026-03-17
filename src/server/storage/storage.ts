import Database from 'better-sqlite3';
import path from 'path';
import {
  GameState, Character, TravelPlan, Photo, Postcard, Poem,
  Artwork, Souvenir, LocationMessage, TravelHistoryEntry,
  SceneInteraction, AgentLogEntry, AuthSession, AgentStatus,
  CharacterStats, Location, FAMOUS_LOCATIONS,
  Garden, BackpackSlot, Friend, VisitorEvent,
  LotteryResult, Title, HomeEvent,
  RandomEvent, NPCEncounter, Quest, Weather, WEATHER_DATA,
} from '../../shared/types';
import { nanoid } from 'nanoid';

const DEFAULT_LOCATION = FAMOUS_LOCATIONS[0]; // Paris

const DEFAULT_STATS: CharacterStats = {
  fatigue: 0,
  money: 5000,
  mood: 80,
  experience: 0,
  hunger: 0,
  health: 100,
};

export class Storage {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'data', 'travel-claw.db');
    const dir = path.dirname(resolvedPath);
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        auth_key TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        stats TEXT NOT NULL,
        current_location TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS travel_plans (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS postcards (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS poems (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS artworks (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS souvenirs (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS travel_history (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS agent_log (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS agent_state (
        character_id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'idle',
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS garden (
        character_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS backpack (
        character_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS visitor_events (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS lottery_results (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS titles (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS home_events (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS random_events (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS npc_encounters (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      CREATE TABLE IF NOT EXISTS weather_state (
        character_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );
    `);
  }

  // ─── Auth ───
  createSession(characterId: string): AuthSession {
    const session: AuthSession = {
      authKey: nanoid(32),
      characterId,
      createdAt: new Date().toISOString(),
    };
    this.db.prepare('INSERT INTO auth_sessions (auth_key, character_id, created_at) VALUES (?, ?, ?)')
      .run(session.authKey, session.characterId, session.createdAt);
    return session;
  }

  getSession(authKey: string): AuthSession | null {
    const row = this.db.prepare('SELECT * FROM auth_sessions WHERE auth_key = ?').get(authKey) as any;
    if (!row) return null;
    return { authKey: row.auth_key, characterId: row.character_id, createdAt: row.created_at };
  }

  // ─── Character ───
  createCharacter(name: string): Character {
    const character: Character = {
      id: nanoid(),
      name,
      stats: { ...DEFAULT_STATS },
      currentLocation: DEFAULT_LOCATION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.prepare('INSERT INTO characters (id, name, stats, current_location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(character.id, character.name, JSON.stringify(character.stats), JSON.stringify(character.currentLocation), character.createdAt, character.updatedAt);
    // init agent state
    this.db.prepare('INSERT INTO agent_state (character_id, status) VALUES (?, ?)').run(character.id, 'idle');
    // init garden
    const garden: Garden = { clovers: 0, fourLeafClovers: 0, lastHarvestAt: new Date().toISOString(), growthRate: 10 };
    this.db.prepare('INSERT INTO garden (character_id, data) VALUES (?, ?)').run(character.id, JSON.stringify(garden));
    // init backpack
    this.db.prepare('INSERT INTO backpack (character_id, data) VALUES (?, ?)').run(character.id, JSON.stringify([]));
    // init weather
    this.db.prepare('INSERT INTO weather_state (character_id, data) VALUES (?, ?)').run(character.id, JSON.stringify(WEATHER_DATA.sunny));
    return character;
  }

  getCharacter(id: string): Character | null {
    const row = this.db.prepare('SELECT * FROM characters WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      stats: JSON.parse(row.stats),
      currentLocation: JSON.parse(row.current_location),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  getAllCharacters(): Character[] {
    const rows = this.db.prepare('SELECT * FROM characters ORDER BY updated_at DESC').all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      stats: JSON.parse(row.stats),
      currentLocation: JSON.parse(row.current_location),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  updateCharacter(character: Character): void {
    character.updatedAt = new Date().toISOString();
    this.db.prepare('UPDATE characters SET name = ?, stats = ?, current_location = ?, updated_at = ? WHERE id = ?')
      .run(character.name, JSON.stringify(character.stats), JSON.stringify(character.currentLocation), character.updatedAt, character.id);
  }

  // ─── Travel Plan ───
  saveTravelPlan(characterId: string, plan: TravelPlan): void {
    const existing = this.db.prepare('SELECT id FROM travel_plans WHERE character_id = ?').get(characterId);
    if (existing) {
      this.db.prepare('UPDATE travel_plans SET id = ?, data = ? WHERE character_id = ?')
        .run(plan.id, JSON.stringify(plan), characterId);
    } else {
      this.db.prepare('INSERT INTO travel_plans (id, character_id, data) VALUES (?, ?, ?)')
        .run(plan.id, characterId, JSON.stringify(plan));
    }
  }

  getTravelPlan(characterId: string): TravelPlan | null {
    const row = this.db.prepare('SELECT data FROM travel_plans WHERE character_id = ?').get(characterId) as any;
    if (!row) return null;
    return JSON.parse(row.data);
  }

  deleteTravelPlan(characterId: string): void {
    this.db.prepare('DELETE FROM travel_plans WHERE character_id = ?').run(characterId);
  }

  // ─── Generic Collection Methods ───
  private addItem(table: string, characterId: string, id: string, data: unknown): void {
    this.db.prepare(`INSERT INTO ${table} (id, character_id, data, created_at) VALUES (?, ?, ?, ?)`)
      .run(id, characterId, JSON.stringify(data), new Date().toISOString());
  }

  private getItems<T>(table: string, characterId: string): T[] {
    const rows = this.db.prepare(`SELECT data FROM ${table} WHERE character_id = ? ORDER BY created_at DESC`).all(characterId) as any[];
    return rows.map(r => JSON.parse(r.data));
  }

  // ─── Photos ───
  addPhoto(characterId: string, photo: Photo): void { this.addItem('photos', characterId, photo.id, photo); }
  getPhotos(characterId: string): Photo[] { return this.getItems('photos', characterId); }

  // ─── Postcards ───
  addPostcard(characterId: string, postcard: Postcard): void { this.addItem('postcards', characterId, postcard.id, postcard); }
  getPostcards(characterId: string): Postcard[] { return this.getItems('postcards', characterId); }

  // ─── Poems ───
  addPoem(characterId: string, poem: Poem): void { this.addItem('poems', characterId, poem.id, poem); }
  getPoems(characterId: string): Poem[] { return this.getItems('poems', characterId); }

  // ─── Artworks ───
  addArtwork(characterId: string, artwork: Artwork): void { this.addItem('artworks', characterId, artwork.id, artwork); }
  getArtworks(characterId: string): Artwork[] { return this.getItems('artworks', characterId); }

  // ─── Souvenirs ───
  addSouvenir(characterId: string, souvenir: Souvenir): void { this.addItem('souvenirs', characterId, souvenir.id, souvenir); }
  getSouvenirs(characterId: string): Souvenir[] { return this.getItems('souvenirs', characterId); }

  // ─── Messages ───
  addMessage(characterId: string, message: LocationMessage): void { this.addItem('messages', characterId, message.id, message); }
  getMessages(characterId: string): LocationMessage[] { return this.getItems('messages', characterId); }

  // ─── Travel History ───
  addHistory(characterId: string, entry: TravelHistoryEntry): void { this.addItem('travel_history', characterId, entry.id, entry); }
  getHistory(characterId: string): TravelHistoryEntry[] { return this.getItems('travel_history', characterId); }

  // ─── Interactions ───
  addInteraction(characterId: string, interaction: SceneInteraction): void { this.addItem('interactions', characterId, interaction.id, interaction); }
  getInteractions(characterId: string): SceneInteraction[] { return this.getItems('interactions', characterId); }

  // ─── Agent Log ───
  addAgentLog(characterId: string, entry: AgentLogEntry): void { this.addItem('agent_log', characterId, entry.id, entry); }
  getAgentLog(characterId: string): AgentLogEntry[] { return this.getItems('agent_log', characterId); }

  // ─── Agent State ───
  getAgentStatus(characterId: string): AgentStatus {
    const row = this.db.prepare('SELECT status FROM agent_state WHERE character_id = ?').get(characterId) as any;
    return row?.status || 'idle';
  }

  setAgentStatus(characterId: string, status: AgentStatus): void {
    this.db.prepare('UPDATE agent_state SET status = ? WHERE character_id = ?').run(status, characterId);
  }

  // ─── Garden ───
  getGarden(characterId: string): Garden {
    const row = this.db.prepare('SELECT data FROM garden WHERE character_id = ?').get(characterId) as any;
    if (!row) return { clovers: 0, fourLeafClovers: 0, lastHarvestAt: new Date().toISOString(), growthRate: 10 };
    return JSON.parse(row.data);
  }

  saveGarden(characterId: string, garden: Garden): void {
    this.db.prepare('UPDATE garden SET data = ? WHERE character_id = ?').run(JSON.stringify(garden), characterId);
  }

  // ─── Backpack ───
  getBackpack(characterId: string): BackpackSlot[] {
    const row = this.db.prepare('SELECT data FROM backpack WHERE character_id = ?').get(characterId) as any;
    if (!row) return [];
    return JSON.parse(row.data);
  }

  saveBackpack(characterId: string, backpack: BackpackSlot[]): void {
    this.db.prepare('UPDATE backpack SET data = ? WHERE character_id = ?').run(JSON.stringify(backpack), characterId);
  }

  // ─── Friends ───
  addFriend(characterId: string, friend: Friend): void {
    this.db.prepare('INSERT OR REPLACE INTO friends (id, character_id, data) VALUES (?, ?, ?)')
      .run(friend.id, characterId, JSON.stringify(friend));
  }

  getFriends(characterId: string): Friend[] {
    const rows = this.db.prepare('SELECT data FROM friends WHERE character_id = ?').all(characterId) as any[];
    return rows.map(r => JSON.parse(r.data));
  }

  updateFriend(characterId: string, friend: Friend): void {
    this.db.prepare('UPDATE friends SET data = ? WHERE id = ? AND character_id = ?')
      .run(JSON.stringify(friend), friend.id, characterId);
  }

  // ─── Visitor Events ───
  addVisitorEvent(characterId: string, event: VisitorEvent): void { this.addItem('visitor_events', characterId, event.id, event); }
  getVisitorEvents(characterId: string): VisitorEvent[] { return this.getItems('visitor_events', characterId); }

  // ─── Lottery Results ───
  addLotteryResult(characterId: string, result: LotteryResult): void { this.addItem('lottery_results', characterId, result.id, result); }
  getLotteryResults(characterId: string): LotteryResult[] { return this.getItems('lottery_results', characterId); }

  // ─── Titles ───
  addTitle(characterId: string, title: Title): void { this.addItem('titles', characterId, title.id, title); }
  getTitles(characterId: string): Title[] { return this.getItems('titles', characterId); }

  // ─── Home Events ───
  addHomeEvent(characterId: string, event: HomeEvent): void { this.addItem('home_events', characterId, event.id, event); }
  getHomeEvents(characterId: string): HomeEvent[] { return this.getItems('home_events', characterId); }

  // ─── Random Events ───
  addRandomEvent(characterId: string, event: RandomEvent): void { this.addItem('random_events', characterId, event.id, event); }
  getRandomEvents(characterId: string): RandomEvent[] { return this.getItems('random_events', characterId); }

  // ─── NPC Encounters ───
  addNPCEncounter(characterId: string, encounter: NPCEncounter): void { this.addItem('npc_encounters', characterId, encounter.id, encounter); }
  getNPCEncounters(characterId: string): NPCEncounter[] { return this.getItems('npc_encounters', characterId); }

  // ─── Quests ───
  addQuest(characterId: string, quest: Quest): void { this.addItem('quests', characterId, quest.id, quest); }
  getQuests(characterId: string): Quest[] { return this.getItems('quests', characterId); }
  updateQuest(characterId: string, quest: Quest): void {
    this.db.prepare('UPDATE quests SET data = ? WHERE id = ? AND character_id = ?')
      .run(JSON.stringify(quest), quest.id, characterId);
  }

  // ─── Weather ───
  getWeather(characterId: string): Weather {
    const row = this.db.prepare('SELECT data FROM weather_state WHERE character_id = ?').get(characterId) as any;
    if (!row) return WEATHER_DATA.sunny;
    return JSON.parse(row.data);
  }

  saveWeather(characterId: string, weather: Weather): void {
    const existing = this.db.prepare('SELECT character_id FROM weather_state WHERE character_id = ?').get(characterId);
    if (existing) {
      this.db.prepare('UPDATE weather_state SET data = ? WHERE character_id = ?').run(JSON.stringify(weather), characterId);
    } else {
      this.db.prepare('INSERT INTO weather_state (character_id, data) VALUES (?, ?)').run(characterId, JSON.stringify(weather));
    }
  }

  // ─── Full Game State ───
  getGameState(characterId: string): GameState | null {
    const character = this.getCharacter(characterId);
    if (!character) return null;
    return {
      character,
      travelPlan: this.getTravelPlan(characterId),
      travelStatus: this.getTravelPlan(characterId)?.status || 'idle',
      agentStatus: this.getAgentStatus(characterId),
      agentLog: this.getAgentLog(characterId),
      photos: this.getPhotos(characterId),
      postcards: this.getPostcards(characterId),
      poems: this.getPoems(characterId),
      artworks: this.getArtworks(characterId),
      souvenirs: this.getSouvenirs(characterId),
      messages: this.getMessages(characterId),
      travelHistory: this.getHistory(characterId),
      interactions: this.getInteractions(characterId),
      garden: this.getGarden(characterId),
      backpack: this.getBackpack(characterId),
      friends: this.getFriends(characterId),
      titles: this.getTitles(characterId),
      lotteryHistory: this.getLotteryResults(characterId),
      homeEvents: this.getHomeEvents(characterId),
      visitors: this.getVisitorEvents(characterId),
      randomEvents: this.getRandomEvents(characterId),
      npcEncounters: this.getNPCEncounters(characterId),
      quests: this.getQuests(characterId),
      weather: this.getWeather(characterId),
    };
  }

  close(): void {
    this.db.close();
  }
}
