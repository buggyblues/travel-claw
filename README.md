# 🦞 Travel Claw (旅行龙虾)

> A CLI game inspired by 旅行青蛙 (Travel Frog) — raise a traveling lobster, explore the world, and collect memories!

## Overview

Travel Claw is a cozy CLI game where you nurture a lobster who loves to travel. Prepare supplies, tend your clover garden, entertain visiting friends, and watch as your lobster explores famous landmarks around the world — bringing back photos, poetry, and souvenirs from each journey.

```
┌────────────────────────────────────────────┐
│  🦞  Snappy the Lobster                    │
│  📍  Tokyo Tower, Tokyo, Japan             │
│  ❤️  Health: ████████░░ 80                 │
│  😊  Mood:   █████████░ 90                 │
│  💤  Fatigue:██░░░░░░░░ 20                 │
│  🍖  Hunger: ███░░░░░░░ 30                 │
│  💰  Money:  $4,850                        │
│  ⭐  XP:     1,250                          │
└────────────────────────────────────────────┘
```

## Features

### 🗺️ Core Travel System
- **Plan trips** to 20 famous world landmarks (Eiffel Tower, Taj Mahal, Great Wall, etc.)
- **Two map providers**: Google Maps & Mapbox (switchable at runtime)
- **Travel history** tracking with arrival dates and activities

### 📸 Creative Activities
- **Photography**: Take street-view photos at each location
- **Poetry**: Write location-inspired poems
- **Artwork**: Create digital art in various styles (watercolor, oil, sketch, pixel art)
- **Postcards**: Send postcards home from your travels
- **Souvenirs**: Collect location-specific memorabilia

### 🌿 Garden & Economy (Inspired by Travel Frog)
- **Clover garden**: Passive income — clovers grow over time, harvest for money
- **Four-leaf clovers**: Rare finds used as lottery tickets
- **Shop**: Buy food, tools, and amulets to prepare for trips

### 🎒 Backpack System
- **Pack supplies**: Food for hunger, tools for exploration, amulets for luck
- **Use items**: Consume food, deploy tools, activate amulets
- **Travel bonuses**: Packed items improve travel outcomes

### 🐾 Friends & Visitors
- **5 aquatic friends**: Carlo the Crab, Shelly the Turtle, Gus the Seagull, Stella the Starfish, Sammy the Seahorse
- **Random visits**: Friends appear at your door with gifts and clovers
- **Entertain**: Give friends items to build friendship levels

### 🎰 Lottery
- Use four-leaf clovers as tickets
- Prizes: Jackpot ($1000–2000), Gold, Silver, Bronze, Consolation

### 🏆 Titles & Achievements
- 16 titles to unlock (Hatchling, World Traveler, Shutterbug, Poet Laureate, etc.)
- Automatically checked after key activities

### 🏠 Home Activities
- Reading, crafting, napping, eating, sharpening claws, writing diary
- Each activity provides different stat buffs

### 🌦️ Weather System
- Dynamic weather affecting gameplay stats
- 8 weather types: sunny, rainy, stormy, snowy, foggy, windy, cloudy, hot
- Weather changes during travel and exploration

### ⚡ Random Events
- 20 event types across 6 categories: treasure, encounter, mishap, discovery, weather_event, market
- Events trigger during travel, exploration, and interactions
- Gain or lose money, items, mood, and XP

### 🧑‍🤝‍🧑 NPC Encounters
- 8 unique NPCs: Marco the Merchant, Luna the Guide, Melody the Bard, Old Pete the Fisherman, Iris the Stranger, Flash the Photographer, Chef Bubbles, Captain Barnacle
- Each NPC grants different rewards based on their role
- Encounter NPCs while exploring or interacting

### 📋 Quest System
- 10 quest types linked to game activities (photos, travels, poems, etc.)
- Up to 3 active quests at a time
- Auto-progress as you play — complete quests for money and XP rewards

### 🎮 Interactive Mode
- Full REPL with `travel-claw play`
- Tab completion for all commands
- Status bar after every action
- 30+ commands available in interactive mode

### 📚 Collection Album
- Track completion: photos, souvenirs, cities visited
- Overall completion percentage

### 🤖 Autonomous Agent
- Let your lobster make its own decisions
- Watch it travel, take photos, write poems, and buy souvenirs automatically

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the server
pnpm server

# In another terminal, register your lobster
pnpm claw auth register "Snappy"

# Check status
pnpm claw status

# Plan and take a trip
pnpm claw travel plan "Tokyo"
pnpm claw travel start

# Take a photo
pnpm claw photo take
```

## Architecture

```
travel-claw/
├── src/
│   ├── shared/
│   │   └── types.ts          # Shared interfaces, constants, game data
│   ├── server/
│   │   ├── index.ts          # Server entry point (port 3210)
│   │   ├── app.ts            # Express routes & middleware
│   │   ├── game/
│   │   │   └── engine.ts     # Core game logic
│   │   ├── storage/
│   │   │   └── storage.ts    # SQLite persistence layer
│   │   └── map/
│   │       ├── adapter.ts    # Map adapter manager
│   │       ├── google.adapter.ts
│   │       └── mapbox.adapter.ts
│   └── client/
│       ├── index.ts          # CLI (Commander.js)
│       ├── api.client.ts     # HTTP API client
│       ├── config.ts         # ~/.travel-claw/config.json
│       ├── formatter.ts      # Terminal output formatting
│       └── interactive.ts    # Interactive REPL mode
├── tests/
│   └── e2e/
│       ├── game.e2e.test.ts  # API-level E2E tests (72 tests)
│       └── cli.e2e.test.ts   # CLI client E2E tests (56 tests)
└── data/                     # SQLite database (auto-created)
```

**Design Pattern**: Adapter pattern for map providers — easily switch between Google Maps and Mapbox, or add new providers.

**Tech Stack**: TypeScript, Express 5, SQLite (better-sqlite3), Commander.js, chalk, vitest

## All Commands

### Authentication
| Command | Description |
|---------|-------------|
| `auth register <name>` | Register a new lobster |
| `auth status` | Check auth status |
| `auth key <key>` | Set an existing auth key |

### Status & Travel
| Command | Description |
|---------|-------------|
| `status` | View lobster status & stats |
| `history` | View travel history |
| `travel plan <dest>` | Plan a trip |
| `travel start` | Start the planned trip |
| `travel stop` | Cancel travel plan |
| `travel location` | Show current location |

### Activities
| Command | Description |
|---------|-------------|
| `photo take [-h heading] [-p pitch]` | Take a street-view photo |
| `photo album` | View photo album |
| `postcard send <to> <message>` | Send a postcard ($20) |
| `postcard inbox` | View sent postcards |
| `interact do` | Interact with the scene |
| `interact look` | Look around |
| `message leave <content>` | Leave a message |
| `message read` | Read messages |
| `poetry write` | Write a poem |
| `poetry collection` | View poems |
| `art create [-s style]` | Create artwork ($50) |
| `art gallery` | View art gallery |
| `souvenir buy` | Buy a local souvenir |
| `souvenir inventory` | View souvenirs |
| `tour start` | Start a guided tour |
| `tour landmarks` | List nearby landmarks |

### Garden & Shop
| Command | Description |
|---------|-------------|
| `garden status` | View clover garden |
| `garden harvest` | Harvest clovers (earns money) |
| `shop list` | Browse food, tools & amulets |
| `shop buy <itemId>` | Buy an item |
| `backpack list` | View backpack |
| `backpack use <itemId>` | Use an item |

### Social
| Command | Description |
|---------|-------------|
| `friends list` | View friends & friendship levels |
| `friends check` | Check for visitors |
| `friends entertain <friendId> <itemId>` | Give a friend an item |

### Extras
| Command | Description |
|---------|-------------|
| `lottery play` | Use a 🍀 four-leaf clover ticket |
| `lottery history` | View lottery history |
| `titles list` | View earned titles |
| `titles check` | Check for new title unlocks |
| `home do [-a activity]` | Do a home activity |
| `home log` | View home activity log |
| `album stats` | View collection completion |
| `rest` | Rest to recover fatigue |
| `eat` | Eat local food ($15) |

### Events, NPCs, Weather & Quests
| Command | Description |
|---------|-------------|
| `explore` | Explore (random events + NPC + weather) |
| `weather check` | Check current weather |
| `events history` | View past random events |
| `npc meet` | Encounter a random NPC |
| `npc history` | View past NPC encounters |
| `quest list` | View active quests |
| `quest all` | View all quests (including completed) |
| `quest new` | Generate a new quest (max 3 active) |

### Interactive Mode
| Command | Description |
|---------|-------------|
| `play` | Enter interactive REPL mode |

### Agent & System
| Command | Description |
|---------|-------------|
| `agent start` | Start autonomous agent |
| `agent stop` | Stop agent |
| `agent status` | Check agent status |
| `agent step [-n count]` | Run agent step(s) |
| `agent log [-n limit]` | View agent log |
| `map providers` | List map providers |
| `map set <provider>` | Switch map provider |

## Gameplay Comparison: Travel Claw vs Travel Frog

| Feature | 旅行青蛙 | 🦞 Travel Claw |
|---------|---------|----------------|
| Character | Frog | Lobster |
| Control | Passive (prepare only) | Active CLI + Autonomous Agent |
| Currency | Clovers | Clovers → Money |
| Garden | Tap to harvest | `garden harvest` command |
| Shop | Food, tools, amulets | Same categories, 13 items |
| Backpack | Pack before trip | `backpack` commands |
| Friends | Snail, bee, turtle | Crab, turtle, seagull, starfish, seahorse |
| Lottery | Raffle tickets | Four-leaf clover tickets |
| Photos | Auto from trips | `photo take` with heading/pitch |
| Souvenirs | Auto from trips | `souvenir buy` at locations |
| Titles | Achievement system | 16 unlockable titles |
| Home | Watch frog at home | 6 home activities |
| Map | Japanese locations | 20 world landmarks |
| Art | — | Create artwork in multiple styles |
| Poetry | — | Location-inspired poems |
| Postcards | — | Send postcards home |
| Messages | — | Leave messages at locations |

## Development

```bash
# Install
pnpm install

# Development
pnpm server          # Start API server (port 3210)
pnpm claw <command>  # Run CLI commands

# Testing
pnpm test            # Run all tests (128 tests)
pnpm test:e2e        # Run E2E tests only

# Build
pnpm build           # Compile TypeScript
```

## Configuration

Config file: `~/.travel-claw/config.json`

```json
{
  "authKey": "your-auth-key",
  "serverUrl": "http://localhost:3210"
}
```

Environment variables:
- `CLAW_SERVER_URL` — Override server URL
- `CLAW_CONFIG_PATH` — Override config file path
- `PORT` — Server port (default: 3210)

## Third-Party API Key Configuration

The game uses map providers for geocoding, directions, street view, and nearby landmarks. By default, all providers operate in **simulation mode** — using a built-in database of 20 famous world landmarks and simulated coordinates. To use real map data, configure the following API keys:

### Google Maps API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable these APIs:
   - **Maps Static API** — for static map images
   - **Street View Static API** — for street view photos
   - **Geocoding API** — for converting place names to coordinates
   - **Directions API** — for travel routes and distance calculation
   - **Places API** — for nearby landmark discovery
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. (Recommended) Restrict the key to only the APIs above
6. Set the environment variable:

```bash
export GOOGLE_MAPS_API_KEY=AIzaSy...your-key-here
```

### Mapbox

1. Go to [Mapbox](https://account.mapbox.com/) and create an account
2. Go to your **Account** → **Access Tokens**
3. Copy your default public token, or create a new one
4. Set the environment variable:

```bash
export MAPBOX_ACCESS_TOKEN=pk.eyJ1...your-token-here
```

### What Changes with Real Keys

| Feature | Simulation Mode | With API Key |
|---------|----------------|--------------|
| Geocoding | 20 built-in landmarks + hash-based coords | Real-world geocoding for any place name |
| Street View | URL generated (won't render without key) | Working street view images |
| Static Maps | URL generated (won't render without key) | Working map images |
| Directions | Haversine distance, simulated routes | Real routing with actual roads |
| Landmarks | Filtered from built-in database | Real nearby POI discovery |

### Switching Map Providers

```bash
# List available providers
travel-claw map providers

# Switch provider at runtime
travel-claw map set google
travel-claw map set mapbox
```

### Persisting Keys

Add the environment variables to your shell profile for persistence:

```bash
# ~/.zshrc or ~/.bashrc
export GOOGLE_MAPS_API_KEY=AIzaSy...
export MAPBOX_ACCESS_TOKEN=pk.eyJ1...
export CLAW_SERVER_URL=https://shadowob.com/event/travel-claw/api
```

> **Note:** API keys are read by the **server** process. If you're using the hosted server at `https://shadowob.com/event/travel-claw/api`, the keys are configured on the server side. You only need to set keys when running your own server instance.

## License

ISC
