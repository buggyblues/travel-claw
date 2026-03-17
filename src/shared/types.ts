// ─── Shared Types for Travel Claw ───

// ─── Location ───
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  coordinates: Coordinates;
  name: string;
  country: string;
  city: string;
  description?: string;
}

// ─── Character Stats ───
export interface CharacterStats {
  fatigue: number;      // 0-100, higher = more tired
  money: number;        // in-game currency
  mood: number;         // 0-100, higher = happier
  experience: number;   // total XP
  hunger: number;       // 0-100, higher = hungrier
  health: number;       // 0-100
}

export interface Character {
  id: string;
  name: string;
  stats: CharacterStats;
  currentLocation: Location;
  createdAt: string;
  updatedAt: string;
}

// ─── Travel ───
export type TravelStatus = 'idle' | 'planning' | 'traveling' | 'arrived' | 'resting';

export interface TravelPlan {
  id: string;
  destination: Location;
  origin: Location;
  distanceKm: number;
  estimatedHours: number;
  status: TravelStatus;
  startedAt?: string;
  arrivedAt?: string;
  route?: Coordinates[];
}

// ─── Photo ───
export interface Photo {
  id: string;
  location: Location;
  imageUrl: string;
  caption: string;
  takenAt: string;
  heading?: number;
  pitch?: number;
}

// ─── Postcard ───
export interface Postcard {
  id: string;
  from: Location;
  to: string;
  message: string;
  photoUrl?: string;
  sentAt: string;
}

// ─── Message ───
export interface LocationMessage {
  id: string;
  location: Location;
  content: string;
  leftAt: string;
  author: string;
}

// ─── Poetry ───
export interface Poem {
  id: string;
  title: string;
  content: string;
  location: Location;
  writtenAt: string;
}

// ─── Artwork ───
export interface Artwork {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  location: Location;
  createdAt: string;
  style: string;
}

// ─── Souvenir ───
export interface Souvenir {
  id: string;
  name: string;
  description: string;
  price: number;
  location: Location;
  boughtAt: string;
}

// ─── Landmark ───
export interface Landmark {
  name: string;
  location: Location;
  type: string;
  description: string;
  rating?: number;
}

// ─── Interaction ───
export interface SceneInteraction {
  id: string;
  location: Location;
  description: string;
  moodChange: number;
  experienceGain: number;
  timestamp: string;
}

// ─── Agent ───
export type AgentStatus = 'idle' | 'running' | 'paused';

export interface AgentLogEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  location?: Location;
}

// ─── Auth ───
export interface AuthSession {
  authKey: string;
  characterId: string;
  createdAt: string;
}

// ─── Travel History ───
export interface TravelHistoryEntry {
  id: string;
  location: Location;
  arrivedAt: string;
  departedAt?: string;
  activities: string[];
}

// ─── API Response ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Shop Item ───
export type ItemCategory = 'food' | 'tool' | 'amulet';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  price: number;
  effect: {
    stat: keyof CharacterStats;
    value: number;
  };
  travelBonus?: string; // bonus description when packed for travel
}

// ─── Backpack ───
export interface BackpackSlot {
  item: ShopItem;
  quantity: number;
}

// ─── Friend / Visitor ───
export type FriendType = 'crab' | 'turtle' | 'seagull' | 'starfish' | 'seahorse';

export interface Friend {
  id: string;
  type: FriendType;
  name: string;
  friendship: number; // 0-100
  visitCount: number;
  lastVisit?: string;
  gifts: string[];
}

export interface VisitorEvent {
  id: string;
  friend: Friend;
  message: string;
  gift?: string;
  cloverReward?: number;
  timestamp: string;
}

// ─── Lottery / Raffle ───
export type LotteryPrize = 'jackpot' | 'gold' | 'silver' | 'bronze' | 'consolation';

export interface LotteryResult {
  id: string;
  prize: LotteryPrize;
  reward: string;
  moneyWon: number;
  timestamp: string;
}

// ─── Title / Achievement ───
export interface Title {
  id: string;
  name: string;
  description: string;
  condition: string;
  unlockedAt?: string;
}

// ─── Clover Garden ───
export interface Garden {
  clovers: number;
  fourLeafClovers: number; // rare, used as lottery tickets
  lastHarvestAt: string;
  growthRate: number; // clovers per hour
}

// ─── Home Activity ───
export type HomeActivity = 'reading' | 'crafting' | 'napping' | 'eating' | 'sharpening_claws' | 'writing_diary';

export interface HomeEvent {
  id: string;
  activity: HomeActivity;
  description: string;
  statsEffect: Partial<CharacterStats>;
  timestamp: string;
}

// ─── Game State ───
export interface GameState {
  character: Character;
  travelPlan: TravelPlan | null;
  travelStatus: TravelStatus;
  agentStatus: AgentStatus;
  agentLog: AgentLogEntry[];
  photos: Photo[];
  postcards: Postcard[];
  poems: Poem[];
  artworks: Artwork[];
  souvenirs: Souvenir[];
  messages: LocationMessage[];
  travelHistory: TravelHistoryEntry[];
  interactions: SceneInteraction[];
  garden: Garden;
  backpack: BackpackSlot[];
  friends: Friend[];
  titles: Title[];
  lotteryHistory: LotteryResult[];
  homeEvents: HomeEvent[];
  visitors: VisitorEvent[];
  randomEvents: RandomEvent[];
  npcEncounters: NPCEncounter[];
  quests: Quest[];
  weather: Weather;
}

// ─── Map Provider ───
export interface MapProvider {
  name: string;
  getStreetViewUrl(coords: Coordinates, heading?: number, pitch?: number): string;
  getStaticMapUrl(coords: Coordinates, zoom?: number): string;
  geocode(query: string): Promise<Location>;
  reverseGeocode(coords: Coordinates): Promise<Location>;
  getDirections(origin: Coordinates, dest: Coordinates): Promise<{ distanceKm: number; durationHours: number; route: Coordinates[] }>;
  getNearbyLandmarks(coords: Coordinates, radiusKm?: number): Promise<Landmark[]>;
}

// ─── Famous Locations Database ───
export const FAMOUS_LOCATIONS: Location[] = [
  { coordinates: { lat: 48.8566, lng: 2.3522 }, name: 'Eiffel Tower', country: 'France', city: 'Paris' },
  { coordinates: { lat: 35.6762, lng: 139.6503 }, name: 'Tokyo Tower', country: 'Japan', city: 'Tokyo' },
  { coordinates: { lat: 40.7484, lng: -73.9857 }, name: 'Empire State Building', country: 'USA', city: 'New York' },
  { coordinates: { lat: 51.5014, lng: -0.1419 }, name: 'Big Ben', country: 'UK', city: 'London' },
  { coordinates: { lat: -33.8568, lng: 151.2153 }, name: 'Sydney Opera House', country: 'Australia', city: 'Sydney' },
  { coordinates: { lat: 27.1751, lng: 78.0421 }, name: 'Taj Mahal', country: 'India', city: 'Agra' },
  { coordinates: { lat: 41.8902, lng: 12.4922 }, name: 'Colosseum', country: 'Italy', city: 'Rome' },
  { coordinates: { lat: 37.9715, lng: 23.7267 }, name: 'Acropolis', country: 'Greece', city: 'Athens' },
  { coordinates: { lat: 13.4125, lng: 103.8670 }, name: 'Angkor Wat', country: 'Cambodia', city: 'Siem Reap' },
  { coordinates: { lat: 29.9792, lng: 31.1342 }, name: 'Great Pyramid of Giza', country: 'Egypt', city: 'Giza' },
  { coordinates: { lat: 40.4319, lng: 116.5704 }, name: 'Great Wall of China', country: 'China', city: 'Beijing' },
  { coordinates: { lat: -22.9519, lng: -43.2105 }, name: 'Christ the Redeemer', country: 'Brazil', city: 'Rio de Janeiro' },
  { coordinates: { lat: 20.6843, lng: -88.5678 }, name: 'Chichen Itza', country: 'Mexico', city: 'Yucatan' },
  { coordinates: { lat: -13.1631, lng: -72.5450 }, name: 'Machu Picchu', country: 'Peru', city: 'Cusco' },
  { coordinates: { lat: 1.2834, lng: 103.8607 }, name: 'Marina Bay Sands', country: 'Singapore', city: 'Singapore' },
  { coordinates: { lat: 25.1972, lng: 55.2744 }, name: 'Burj Khalifa', country: 'UAE', city: 'Dubai' },
  { coordinates: { lat: 59.3293, lng: 18.0686 }, name: 'Gamla Stan', country: 'Sweden', city: 'Stockholm' },
  { coordinates: { lat: 55.7558, lng: 37.6173 }, name: 'Red Square', country: 'Russia', city: 'Moscow' },
  { coordinates: { lat: 37.8199, lng: -122.4783 }, name: 'Golden Gate Bridge', country: 'USA', city: 'San Francisco' },
  { coordinates: { lat: 43.7230, lng: 10.3966 }, name: 'Leaning Tower of Pisa', country: 'Italy', city: 'Pisa' },
];

// ─── Scene Templates ───
export const SCENE_TEMPLATES = [
  'The lobster gazes at {landmark} under the {weather} sky. {detail}',
  'A {adj} breeze carries the scent of {scent} as the lobster explores {place}.',
  'The lobster discovers a hidden {feature} near {landmark}. {reaction}',
  'Locals wave at the traveling lobster near {place}. {interaction}',
  'The {time} light paints {landmark} in shades of {color}.',
];

export const WEATHER_OPTIONS = ['sunny', 'cloudy', 'rainy', 'misty', 'starlit', 'golden', 'snowy'];
export const ADJECTIVES = ['gentle', 'warm', 'cool', 'brisk', 'salty', 'fresh', 'tropical'];
export const SCENTS = ['flowers', 'sea salt', 'fresh bread', 'pine trees', 'spices', 'rain', 'coffee'];
export const COLORS = ['amber', 'crimson', 'sapphire', 'emerald', 'violet', 'gold', 'rose'];
export const REACTIONS = [
  'The lobster clicks its claws with excitement!',
  'A feeling of wonder fills the lobster.',
  'The lobster takes a moment to appreciate the beauty.',
  'The lobster dances a little jig.',
  'This will be a memory to treasure forever.',
];

// ─── Shop Items Catalog ───
export const SHOP_ITEMS: ShopItem[] = [
  // Food
  { id: 'onigiri', name: '🍙 Onigiri', description: 'Simple rice ball. Reduces hunger a bit.', category: 'food', price: 10, effect: { stat: 'hunger', value: -20 }, travelBonus: 'Quick energy on the road' },
  { id: 'sandwich', name: '🥪 Sandwich', description: 'A hearty sandwich with fresh fillings.', category: 'food', price: 20, effect: { stat: 'hunger', value: -40 }, travelBonus: 'Satisfying travel meal' },
  { id: 'baguette', name: '🥖 Baguette', description: 'Crispy French baguette.', category: 'food', price: 30, effect: { stat: 'hunger', value: -50 }, travelBonus: 'Deluxe travel dining' },
  { id: 'sushi_bento', name: '🍱 Sushi Bento', description: 'Premium bento box with assorted sushi.', category: 'food', price: 80, effect: { stat: 'hunger', value: -80 }, travelBonus: 'Gourmet on the go, mood boost' },
  { id: 'seaweed_snack', name: '🌿 Seaweed Snack', description: 'A light, crunchy seaweed treat.', category: 'food', price: 5, effect: { stat: 'hunger', value: -10 }, travelBonus: 'Light nibble' },
  // Tools
  { id: 'lantern', name: '🏮 Lantern', description: 'Lights the way in dark places.', category: 'tool', price: 50, effect: { stat: 'mood', value: 10 }, travelBonus: 'Discover hidden night spots' },
  { id: 'tent', name: '⛺ Tent', description: 'A cozy tent for resting outdoors.', category: 'tool', price: 100, effect: { stat: 'fatigue', value: -30 }, travelBonus: 'Rest anywhere, reduce travel fatigue' },
  { id: 'camera', name: '📷 Camera', description: 'A nice camera for better photos.', category: 'tool', price: 150, effect: { stat: 'experience', value: 10 }, travelBonus: 'Higher quality travel photos' },
  { id: 'compass', name: '🧭 Compass', description: 'Never get lost again.', category: 'tool', price: 80, effect: { stat: 'experience', value: 5 }, travelBonus: 'Find more landmarks' },
  { id: 'fishing_rod', name: '🎣 Fishing Rod', description: 'For catching seaside snacks.', category: 'tool', price: 60, effect: { stat: 'hunger', value: -20 }, travelBonus: 'Fish at coastal destinations' },
  // Amulets
  { id: 'lucky_charm', name: '🍀 Lucky Charm', description: 'Increases chances of good events.', category: 'amulet', price: 200, effect: { stat: 'mood', value: 15 }, travelBonus: 'Lucky encounters on the road' },
  { id: 'speed_shell', name: '🐚 Speed Shell', description: 'Travel a bit faster.', category: 'amulet', price: 150, effect: { stat: 'fatigue', value: -10 }, travelBonus: 'Reduced travel time' },
  { id: 'health_pearl', name: '💎 Health Pearl', description: 'Restores vitality.', category: 'amulet', price: 120, effect: { stat: 'health', value: 20 }, travelBonus: 'Stay healthy on long journeys' },
];

// ─── Friends Database ───
export const FRIEND_TEMPLATES: Omit<Friend, 'id' | 'friendship' | 'visitCount' | 'gifts'>[] = [
  { type: 'crab', name: 'Carlo the Crab', lastVisit: undefined },
  { type: 'turtle', name: 'Shelly the Turtle', lastVisit: undefined },
  { type: 'seagull', name: 'Gus the Seagull', lastVisit: undefined },
  { type: 'starfish', name: 'Stella the Starfish', lastVisit: undefined },
  { type: 'seahorse', name: 'Sammy the Seahorse', lastVisit: undefined },
];

// ─── Visitor Messages ───
export const VISITOR_MESSAGES = [
  '{name} waddles up to your door with a cheerful wave!',
  '{name} brought you a little something from the beach.',
  '{name} is sitting on your porch, enjoying the view.',
  '{name} knocked on your shell and wants to hang out!',
  '{name} left a gift basket at your doorstep.',
];

// ─── Home Activity Templates ───
export const HOME_ACTIVITY_TEMPLATES: Record<HomeActivity, { descriptions: string[]; effects: Partial<CharacterStats> }> = {
  reading: {
    descriptions: [
      'The lobster reads a travel guidebook by the window.',
      'Curled up with a good book about far-off lands.',
      'Flipping through a photo album of past journeys.',
    ],
    effects: { experience: 5, mood: 5 },
  },
  crafting: {
    descriptions: [
      'The lobster crafts a tiny boat from driftwood.',
      'Weaving a friendship bracelet from colorful threads.',
      'Assembling a scrapbook of postcards and tickets.',
    ],
    effects: { experience: 8, mood: 10 },
  },
  napping: {
    descriptions: [
      'The lobster takes a cozy afternoon nap.',
      'Dozing peacefully in a sunbeam by the window.',
      'A refreshing power nap after a long day.',
    ],
    effects: { fatigue: -30, health: 5 },
  },
  eating: {
    descriptions: [
      'The lobster prepares a simple home-cooked meal.',
      'Enjoying a bowl of warm seaweed soup.',
      'Snacking on some dried kelp chips.',
    ],
    effects: { hunger: -30, mood: 5 },
  },
  sharpening_claws: {
    descriptions: [
      'The lobster sharpens its claws on a smooth rock.',
      'Practicing claw exercises — snap snap snap!',
      'Polishing those magnificent claws to a fine shine.',
    ],
    effects: { health: 5, experience: 3 },
  },
  writing_diary: {
    descriptions: [
      'The lobster writes today\'s adventures in a diary.',
      'Jotting down thoughts and dreams for future trips.',
      'Sketching the sunset view from the window.',
    ],
    effects: { experience: 10, mood: 8 },
  },
};

// ─── Title Definitions ───
export const TITLE_DEFINITIONS: Omit<Title, 'id' | 'unlockedAt'>[] = [
  { name: '🐣 Hatchling', description: 'Just starting the journey', condition: 'register' },
  { name: '🗺️ First Steps', description: 'Completed first travel', condition: 'travel_count:1' },
  { name: '🌍 World Traveler', description: 'Visited 5 different cities', condition: 'cities_visited:5' },
  { name: '🌐 Globe Trotter', description: 'Visited 10 different cities', condition: 'cities_visited:10' },
  { name: '📸 Shutterbug', description: 'Took 10 photos', condition: 'photos:10' },
  { name: '📷 Photographer', description: 'Took 25 photos', condition: 'photos:25' },
  { name: '✉️ Pen Pal', description: 'Sent 5 postcards', condition: 'postcards:5' },
  { name: '📝 Poet Laureate', description: 'Wrote 10 poems', condition: 'poems:10' },
  { name: '🎨 Artist', description: 'Created 10 artworks', condition: 'artworks:10' },
  { name: '🛍️ Collector', description: 'Bought 10 souvenirs', condition: 'souvenirs:10' },
  { name: '🤝 Social Butterfly', description: 'Made friends with all visitors', condition: 'friends:5' },
  { name: '🍀 Lucky Lobster', description: 'Won the lottery jackpot', condition: 'lottery_jackpot:1' },
  { name: '🌿 Green Claw', description: 'Harvested 100 clovers', condition: 'clovers_harvested:100' },
  { name: '💰 Wealthy Wanderer', description: 'Accumulated 10000 money', condition: 'money:10000' },
  { name: '🏠 Homebody', description: 'Did 20 home activities', condition: 'home_activities:20' },
  { name: '🎒 Prepared Traveler', description: 'Traveled with a full backpack 5 times', condition: 'packed_travels:5' },
];

// ─── Weather ───
export type WeatherType = 'sunny' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'windy' | 'cloudy' | 'clear';

export interface Weather {
  type: WeatherType;
  description: string;
  statModifiers: Partial<CharacterStats>;
}

// ─── Random Event ───
export type EventCategory = 'treasure' | 'encounter' | 'mishap' | 'discovery' | 'weather_event' | 'market';

export interface RandomEvent {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  statChanges: Partial<CharacterStats>;
  moneyChange: number;
  itemReward?: string;
  timestamp: string;
  location: Location;
}

// ─── NPC ───
export type NPCRole = 'merchant' | 'guide' | 'bard' | 'fisherman' | 'stranger' | 'photographer' | 'chef' | 'sailor';

export interface NPC {
  id: string;
  name: string;
  role: NPCRole;
  greeting: string;
  dialogue: string[];
  location?: Location;
}

export interface NPCEncounter {
  id: string;
  npc: NPC;
  dialogue: string;
  outcome: string;
  statChanges: Partial<CharacterStats>;
  moneyChange: number;
  itemReward?: string;
  timestamp: string;
  location: Location;
}

// ─── Quest ───
export type QuestStatus = 'active' | 'completed' | 'expired';

export interface Quest {
  id: string;
  title: string;
  description: string;
  objective: string;
  targetCount: number;
  currentCount: number;
  reward: { money: number; experience: number };
  status: QuestStatus;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

// ─── Extended Game State ───
// Add to the GameState: randomEvents, npcEncounters, quests, weather

// ─── Lottery Prize Table ───
export const LOTTERY_PRIZES: { prize: LotteryPrize; weight: number; moneyRange: [number, number]; rewards: string[] }[] = [
  { prize: 'jackpot', weight: 1, moneyRange: [1000, 2000], rewards: ['🎉 Grand Prize — a golden seashell trophy!', '🎊 Jackpot — a rare pearl necklace!'] },
  { prize: 'gold', weight: 5, moneyRange: [300, 500], rewards: ['🥇 Gold Prize — a fancy travel hat!', '🥇 Gold Prize — a set of premium tools!'] },
  { prize: 'silver', weight: 15, moneyRange: [100, 200], rewards: ['🥈 Silver Prize — a cozy travel blanket!', '🥈 Silver Prize — a tasty snack basket!'] },
  { prize: 'bronze', weight: 30, moneyRange: [30, 80], rewards: ['🥉 Bronze Prize — a small souvenir!', '🥉 Bronze Prize — a bag of trail mix!'] },
  { prize: 'consolation', weight: 49, moneyRange: [5, 20], rewards: ['Thanks for playing! Have a seaweed chip.', 'Better luck next time! Here\'s a pebble.'] },
];

// ─── Weather Database ───
export const WEATHER_DATA: Record<WeatherType, Weather> = {
  sunny: { type: 'sunny', description: 'Bright sunshine and warm air ☀️', statModifiers: { mood: 5 } },
  rainy: { type: 'rainy', description: 'Gentle rain patters on the cobblestones 🌧️', statModifiers: { mood: -3, fatigue: 5 } },
  stormy: { type: 'stormy', description: 'Thunder rumbles and lightning flashes ⛈️', statModifiers: { mood: -8, fatigue: 10, health: -5 } },
  snowy: { type: 'snowy', description: 'Soft snowflakes drift down from the sky ❄️', statModifiers: { mood: 3, hunger: 5, fatigue: 5 } },
  foggy: { type: 'foggy', description: 'A mysterious fog blankets everything 🌫️', statModifiers: { mood: -2, experience: 3 } },
  windy: { type: 'windy', description: 'Strong gusts whip through the streets 💨', statModifiers: { fatigue: 5, health: -2 } },
  cloudy: { type: 'cloudy', description: 'Overcast skies and a mild temperature ☁️', statModifiers: {} },
  clear: { type: 'clear', description: 'Crystal clear skies and perfect visibility 🌈', statModifiers: { mood: 8, health: 3 } },
};

// ─── Random Event Templates ───
export const RANDOM_EVENT_TEMPLATES: Omit<RandomEvent, 'id' | 'timestamp' | 'location'>[] = [
  // Treasure
  { category: 'treasure', title: '💎 Hidden Treasure!', description: 'While exploring, the lobster noticed a glint in the sand. A small pouch of coins!', statChanges: { mood: 10, experience: 15 }, moneyChange: 50 },
  { category: 'treasure', title: '🗝️ Forgotten Chest', description: 'An old treasure chest washed ashore. Inside: a beautiful gemstone!', statChanges: { mood: 15, experience: 20 }, moneyChange: 100 },
  { category: 'treasure', title: '🐚 Perfect Shell', description: 'The lobster found a perfectly spiraled shell. A collector offers a good price for it.', statChanges: { mood: 5 }, moneyChange: 30 },
  // Encounter
  { category: 'encounter', title: '🐱 Friendly Cat', description: 'A local cat approaches and purrs at the lobster. They share a quiet moment together.', statChanges: { mood: 12, fatigue: -5 }, moneyChange: 0 },
  { category: 'encounter', title: '🎵 Street Musician', description: 'A talented musician plays a beautiful melody. The lobster tosses a coin and hums along.', statChanges: { mood: 15, experience: 5 }, moneyChange: -5 },
  { category: 'encounter', title: '👴 Wise Elder', description: 'An old traveler shares stories of distant lands. The lobster gains insight and wisdom.', statChanges: { experience: 25, mood: 8 }, moneyChange: 0 },
  { category: 'encounter', title: '🦀 Fellow Crustacean', description: 'Another crustacean traveler! They swap stories and travel tips over seaweed tea.', statChanges: { mood: 20, fatigue: -10, experience: 10 }, moneyChange: 0 },
  // Mishap
  { category: 'mishap', title: '🌊 Surprise Wave', description: 'A rogue wave splashes the lobster! Clothes soaked, but spirits still high.', statChanges: { mood: -10, fatigue: 10, health: -5 }, moneyChange: 0 },
  { category: 'mishap', title: '🕳️ Pothole!', description: 'The lobster trips on an unexpected pothole. A bruise, but nothing serious.', statChanges: { health: -8, fatigue: 8, mood: -5 }, moneyChange: 0 },
  { category: 'mishap', title: '🦅 Seagull Raid!', description: 'A cheeky seagull swooped down and stole some snacks! How rude!', statChanges: { hunger: 15, mood: -8 }, moneyChange: -10 },
  { category: 'mishap', title: '💸 Dropped Coins', description: 'Some coins slipped through a hole in the pocket. At least it wasn\'t everything!', statChanges: { mood: -5 }, moneyChange: -20 },
  // Discovery
  { category: 'discovery', title: '🗺️ Secret Path', description: 'The lobster found a hidden trail that leads to a breathtaking overlook!', statChanges: { experience: 30, mood: 20 }, moneyChange: 0 },
  { category: 'discovery', title: '📖 Ancient Inscription', description: 'Strange symbols carved in stone... they seem to tell a story from long ago.', statChanges: { experience: 20, mood: 10 }, moneyChange: 0 },
  { category: 'discovery', title: '🌺 Rare Flower', description: 'A flower so rare it blooms only once a decade! The lobster takes a careful photo.', statChanges: { experience: 15, mood: 15 }, moneyChange: 0 },
  { category: 'discovery', title: '🏚️ Abandoned Hut', description: 'An old fisherman\'s hut with forgotten supplies. Useful finds!', statChanges: { hunger: -20, fatigue: -10, experience: 10 }, moneyChange: 15 },
  // Weather events
  { category: 'weather_event', title: '🌈 Double Rainbow!', description: 'A magnificent double rainbow arcs across the sky. What a sight!', statChanges: { mood: 25, experience: 10 }, moneyChange: 0 },
  { category: 'weather_event', title: '🌅 Perfect Sunset', description: 'The sky is painted in shades of orange, pink, and purple. Breathtaking!', statChanges: { mood: 20, fatigue: -5, experience: 8 }, moneyChange: 0 },
  { category: 'weather_event', title: '⚡ Lightning Show', description: 'Lightning dances across the sky! Scary but beautiful from shelter.', statChanges: { mood: 5, experience: 12 }, moneyChange: 0 },
  // Market
  { category: 'market', title: '🏪 Pop-up Market!', description: 'A surprise market appeared! Great deals on local specialties.', statChanges: { mood: 10, hunger: -15 }, moneyChange: -15, itemReward: 'onigiri' },
  { category: 'market', title: '🎪 Festival!', description: 'The lobster stumbled into a local festival! Music, food, and fun!', statChanges: { mood: 30, hunger: -25, fatigue: 10, experience: 15 }, moneyChange: -25 },
  { category: 'market', title: '🛒 Bargain Hunter', description: 'A merchant is having a clearance sale. The lobster scores an amazing deal!', statChanges: { mood: 8, experience: 5 }, moneyChange: -10, itemReward: 'lucky_charm' },
];

// ─── NPC Templates ───
export const NPC_TEMPLATES: Omit<NPC, 'id' | 'location'>[] = [
  {
    name: 'Marco the Merchant',
    role: 'merchant',
    greeting: 'Ahoy, traveler! Want to see my wares? I have things from all over the world!',
    dialogue: [
      'I once traded a pearl for a map that led me to the Bermuda Triangle... barely made it back!',
      'Business tip: always carry a compass. Never know when you\'ll find uncharted territory.',
      'My best seller? The Lucky Charm. Everyone wants one, but I only have one left...',
    ],
  },
  {
    name: 'Luna the Guide',
    role: 'guide',
    greeting: 'Welcome! I know every secret corner of this place. Shall I show you around?',
    dialogue: [
      'See that building? A famous poet once lived there. They wrote about the sea every night.',
      'If you come back at dawn, you\'ll see the most beautiful light on the water.',
      'The locals say there\'s a hidden cave behind the waterfall. I\'ve been there once — magical!',
    ],
  },
  {
    name: 'Melody the Bard',
    role: 'bard',
    greeting: '🎶 La la la~ Oh! A listener! Sit down, I have a song for you.',
    dialogue: [
      'I wrote this song about a lobster who danced under the moonlight. Sound familiar?',
      'Music heals the weary soul. Here, let me play you something soothing.',
      'Every place has its own melody. Listen carefully and you\'ll hear it too.',
    ],
  },
  {
    name: 'Old Pete the Fisherman',
    role: 'fisherman',
    greeting: 'Hey there, little red one! Don\'t worry, I only catch fish. Have a bite!',
    dialogue: [
      'Biggest fish I ever caught was taller than me. Of course, I threw it back. We fishermen have honor.',
      'The sea gives and the sea takes. Today she gave me enough to share. Here, have some!',
      'I\'ve been fishing these waters for 40 years. Seen mermaids twice. ...Maybe three times.',
    ],
  },
  {
    name: 'Iris the Stranger',
    role: 'stranger',
    greeting: '... *looks up mysteriously* ... Ah, a fellow wanderer. The stars said you\'d come.',
    dialogue: [
      'I see great fortune in your claws. Or was it misfortune? Hard to tell with crustaceans.',
      'Take this. It\'s a token from a place that doesn\'t exist yet. You\'ll understand someday.',
      'We\'ve met before, in another tide. You won\'t remember, but I do.',
    ],
  },
  {
    name: 'Flash the Photographer',
    role: 'photographer',
    greeting: 'Oh perfect! Hold that pose! *click* Sorry, I can\'t help myself. You\'re very photogenic!',
    dialogue: [
      'I\'ve been photographing travelers for years. You have the most interesting look — that shell color!',
      'Want me to take your portrait with the landmark behind you? No charge for fellow travelers!',
      'Photography is about capturing moments that will never come again. This is one of those moments.',
    ],
  },
  {
    name: 'Chef Bubbles',
    role: 'chef',
    greeting: 'Bonjour! Welcome to my outdoor kitchen! Today\'s special: fresh catch of the day!',
    dialogue: [
      'The secret ingredient? Love! ...And also butter. Lots of butter.',
      'I once cooked for a king! He said my soup tasted like the ocean. I took it as a compliment.',
      'Try this! I just invented it — I call it "Lobster\'s Delight." Don\'t worry, no lobster was harmed!',
    ],
  },
  {
    name: 'Captain Barnacle',
    role: 'sailor',
    greeting: 'Yarr! A landlocked lobster! Come aboard my tales, if not my ship!',
    dialogue: [
      'I\'ve sailed every ocean and mapped every coast. But the best treasure? The friends along the way.',
      'See that horizon? Beyond it lies adventure. Beyond THAT lies seasickness. But it\'s worth it.',
      'My ship once got stuck in a field of jellyfish. Glowed like a thousand lanterns. Terrifying. Beautiful.',
    ],
  },
];

// ─── NPC Encounter Outcomes ───
export const NPC_OUTCOMES: Record<NPCRole, { outcomes: string[]; statChanges: Partial<CharacterStats>; moneyChange: number; itemReward?: string }[]> = {
  merchant: [
    { outcomes: ['Marco shows you rare items! He gives you a small discount coupon.'], statChanges: { mood: 5, experience: 5 }, moneyChange: 20 },
    { outcomes: ['Marco shares trade secrets and gives you a free sample!'], statChanges: { mood: 10, experience: 10 }, moneyChange: 0, itemReward: 'seaweed_snack' },
  ],
  guide: [
    { outcomes: ['Luna takes you on a hidden tour! You discover places not on any map.'], statChanges: { experience: 30, mood: 15 }, moneyChange: -20 },
    { outcomes: ['Luna shares local legends that fill you with wonder.'], statChanges: { experience: 20, mood: 10 }, moneyChange: 0 },
  ],
  bard: [
    { outcomes: ['Melody\'s song lifts your spirits sky-high! All tiredness melts away.'], statChanges: { mood: 25, fatigue: -20 }, moneyChange: -5 },
    { outcomes: ['Melody teaches you a sea shanty. You\'ll never forget it!'], statChanges: { mood: 15, experience: 10 }, moneyChange: 0 },
  ],
  fisherman: [
    { outcomes: ['Old Pete shares his catch! A hearty meal by the coast.'], statChanges: { hunger: -40, mood: 10, health: 5 }, moneyChange: 0 },
    { outcomes: ['Pete teaches you to fish! You catch a tiny but adorable fish.'], statChanges: { experience: 15, mood: 10, hunger: -20 }, moneyChange: 0 },
  ],
  stranger: [
    { outcomes: ['Iris reads your fortune and gives you a mysterious coin.'], statChanges: { experience: 10, mood: 5 }, moneyChange: 30 },
    { outcomes: ['Iris whispers a secret: "Check under the third stone." You find a treasure!'], statChanges: { experience: 20, mood: 15 }, moneyChange: 50 },
    { outcomes: ['Iris\'s prediction: "Beware the next storm." You feel uneasy but wiser.'], statChanges: { experience: 15, mood: -5 }, moneyChange: 0 },
  ],
  photographer: [
    { outcomes: ['Flash takes an amazing portrait of you — free of charge!'], statChanges: { mood: 15, experience: 10 }, moneyChange: 0 },
    { outcomes: ['Flash teaches you photography tricks. Your next photos will be even better!'], statChanges: { experience: 20, mood: 10 }, moneyChange: 0 },
  ],
  chef: [
    { outcomes: ['Chef Bubbles serves you a 5-star meal! Absolutely delicious.'], statChanges: { hunger: -60, mood: 20, health: 10 }, moneyChange: -30 },
    { outcomes: ['Chef Bubbles gives you a taste of everything! Your belly and heart are full.'], statChanges: { hunger: -40, mood: 15 }, moneyChange: -15 },
  ],
  sailor: [
    { outcomes: ['Captain Barnacle tells you tales of the sea! Adventure awaits!'], statChanges: { experience: 20, mood: 15 }, moneyChange: 0 },
    { outcomes: ['The Captain gives you a nautical map. It might come in handy!'], statChanges: { experience: 25, mood: 10 }, moneyChange: 0, itemReward: 'compass' },
  ],
};

// ─── Quest Templates ───
export const QUEST_TEMPLATES: Omit<Quest, 'id' | 'currentCount' | 'status' | 'createdAt' | 'completedAt' | 'expiresAt'>[] = [
  { title: '📸 Snapshot Spree', description: 'Capture the beauty of your surroundings!', objective: 'photos', targetCount: 3, reward: { money: 100, experience: 50 } },
  { title: '✈️ Wanderlust', description: 'The world is calling — visit new places!', objective: 'travels', targetCount: 2, reward: { money: 150, experience: 80 } },
  { title: '📝 Poetic Soul', description: 'Let the muse of travel inspire your words.', objective: 'poems', targetCount: 2, reward: { money: 80, experience: 60 } },
  { title: '🛍️ Shopaholic', description: 'Collect souvenirs from your journeys!', objective: 'souvenirs', targetCount: 3, reward: { money: 120, experience: 40 } },
  { title: '💌 Pen Pal Express', description: 'Share your adventures with friends back home!', objective: 'postcards', targetCount: 3, reward: { money: 90, experience: 45 } },
  { title: '🎨 Creative Burst', description: 'Paint what you see on your travels.', objective: 'artworks', targetCount: 2, reward: { money: 200, experience: 70 } },
  { title: '🏡 Homebody Day', description: 'Take some time for yourself at home.', objective: 'home_activities', targetCount: 3, reward: { money: 60, experience: 30 } },
  { title: '🐾 Friendly Faces', description: 'Check on your friends and visitors.', objective: 'visitor_checks', targetCount: 5, reward: { money: 70, experience: 35 } },
  { title: '🌿 Garden Guru', description: 'Tend to your garden and harvest clovers.', objective: 'harvests', targetCount: 3, reward: { money: 50, experience: 25 } },
  { title: '🗣️ People Person', description: 'Interact with the world around you.', objective: 'interactions', targetCount: 5, reward: { money: 80, experience: 55 } },
];
