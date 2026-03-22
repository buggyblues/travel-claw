export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  coordinates: Coordinates;
  name: string;
  city: string;
  country: string;
  description?: string;
}

export interface CharacterStats {
  fatigue: number;
  money: number;
  mood: number;
  experience: number;
  hunger: number;
  health: number;
}

export interface Character {
  id: string;
  name: string;
  stats: CharacterStats;
  currentLocation: Location;
  createdAt: string;
  updatedAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objective: string;
  targetCount: number;
  currentCount: number;
  reward?: { money?: number; xp?: number };
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  completedAt?: string;
}

export interface Weather {
  type: string;
  description: string;
  statModifiers?: Partial<Record<keyof CharacterStats, number>>;
}

export interface RandomEvent {
  id: string;
  category: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface NPCEncounter {
  id: string;
  dialogue: string;
  outcome: string;
  timestamp: string;
  npc?: { name: string; role: string };
}

export interface LocationMessage {
  id: string;
  author: string;
  content: string;
  leftAt: string;
  location: Location;
}

export interface TravelHistoryEntry {
  id: string;
  arrivedAt: string;
  location: Location;
}

export interface Friend {
  id: string;
  type: string;
  name: string;
  friendship: number;
  visitCount: number;
}

export interface Garden {
  clovers: number;
  fourLeafClovers: number;
}

export interface BackpackSlot {
  quantity: number;
  item: { id: string; name: string; description: string; category: string };
}

export interface Title {
  id: string;
  name: string;
  description: string;
}

export interface Photo { id: string; takenAt: string; location: Location; caption?: string; }
export interface Poem { id: string; title: string; content: string; writtenAt: string; location: Location; }
export interface Artwork { id: string; title: string; style?: string; createdAt: string; location: Location; }
export interface Souvenir { id: string; name: string; description: string; boughtAt: string; location: Location; }
export interface LotteryResult { id: string; prize: string; moneyWon: number; timestamp: string; }

export interface GameState {
  character: Character;
  photos: Photo[];
  poems: Poem[];
  artworks: Artwork[];
  souvenirs: Souvenir[];
  messages: LocationMessage[];
  travelHistory: TravelHistoryEntry[];
  friends: Friend[];
  titles: Title[];
  lotteryHistory: LotteryResult[];
  garden: Garden;
  backpack: BackpackSlot[];
  randomEvents: RandomEvent[];
  npcEncounters: NPCEncounter[];
  quests: Quest[];
  weather: Weather;
  travelPlan?: { route?: Coordinates[]; status: string } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
