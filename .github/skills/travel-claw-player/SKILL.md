---
name: travel-claw-player
description: "Play the Travel Claw CLI game. Use when: playing Travel Claw, managing the lobster, planning trips, harvesting garden, buying items, checking friends, running lottery, exploring, meeting NPCs, checking weather, managing quests, or performing any Travel Claw game action via CLI."
argument-hint: "Describe what you want to do in the game (e.g., 'plan a trip to Tokyo', 'explore and meet NPCs', 'check quests')"
---

# Travel Claw Player

Play and manage your traveling lobster through the Travel Claw CLI game.

## Setup

### Install from npm

```bash
npm install -g @shadowob/travel-claw
# or
pnpm add -g @shadowob/travel-claw
```

### Server Configuration

The game uses a remote server API. Set the server URL:

```bash
# Option 1: environment variable
export CLAW_SERVER_URL=https://shadowob.com/event/travel-claw/api

# Option 2: set it via CLI
travel-claw auth key <your-auth-key>
```

The default server URL is `https://shadowob.com/event/travel-claw/api`.

If running a local development server, use `http://localhost:3210` instead.

### Register Your Lobster

```bash
travel-claw auth register "<name>"
```

## Interactive Mode

The fastest way to play. Enters a REPL with all commands available:

```bash
travel-claw play
```

Available interactive commands: `status`, `travel <dest>`, `photo`, `poem`, `art`, `postcard <to> <msg>`, `souvenir`, `interact`, `look`, `explore`, `rest`, `eat`, `shop`, `buy <id>`, `backpack`, `use <id>`, `garden`, `harvest`, `friends`, `visitors`, `weather`, `quest`, `quest new`, `npc`, `lottery`, `titles`, `home`, `album`, `history`, `help`, `quit`

## Core Gameplay Loop

### 1. Check Status & Weather

```bash
travel-claw status
travel-claw weather check
```

### 2. Garden & Economy

```bash
travel-claw garden status       # Check clover growth
travel-claw garden harvest      # Harvest for money
```

### 3. Shop & Backpack

```bash
travel-claw shop list           # Browse items
travel-claw shop buy <itemId>   # Buy an item
travel-claw backpack list       # View backpack
travel-claw backpack use <id>   # Use an item
```

### 4. Travel

```bash
travel-claw travel plan "<destination>"
travel-claw travel start        # Costs money, may trigger random events
travel-claw travel location
```

**Before traveling**: Use `rest` if fatigued, `eat` if hungry.

### 5. Explore (Random Events & NPCs)

```bash
travel-claw explore             # Combined: random events + NPC encounters + weather
travel-claw npc meet            # Meet a specific NPC
travel-claw events history      # View past events
travel-claw npc history         # View past NPC encounters
```

Exploring may trigger:
- **Random events**: treasure finds, mishaps, discoveries, festivals
- **NPC encounters**: merchants, guides, bards, fishermen, chefs, sailors, photographers, mysterious strangers
- **Weather changes**: sunny, rainy, stormy, snowy, foggy, windy

### 6. Quests

```bash
travel-claw quest new           # Generate a new quest (max 3 active)
travel-claw quest list          # View active quests
travel-claw quest all           # View all quests including completed
```

Quests auto-progress as you play (take photos, travel, write poems, etc.)

### 7. Activities at a Location

```bash
travel-claw photo take          # Take a photo
travel-claw poetry write        # Write a poem
travel-claw art create [-s style]  # Create artwork ($50)
travel-claw postcard send "<to>" "<message>"  # Send postcard ($20)
travel-claw souvenir buy        # Buy souvenir
travel-claw interact do         # Interact with scene (may trigger NPC)
travel-claw tour start
```

### 8. Social

```bash
travel-claw friends list
travel-claw friends check       # Check for visitors
travel-claw friends entertain <friendId> <itemId>
```

### 9. Extras

```bash
travel-claw lottery play        # Use four-leaf clover
travel-claw titles list / check
travel-claw home do [-a activity]
travel-claw album stats
```

### 10. Agent Mode

```bash
travel-claw agent start
travel-claw agent step -n 5
travel-claw agent log
```

## Recommended Session

1. `status` + `weather check` — See current state
2. `garden harvest` — Collect money
3. `quest new` — Get a quest
4. `friends check` — Visitors?
5. `shop buy` → `rest` / `eat` — Prepare
6. `travel plan <dest>` → `travel start` — Go somewhere
7. `explore` — Random encounters!
8. `photo` / `poem` / `interact` — Activities
9. `npc meet` — Meet locals
10. `quest list` — Check quest progress
11. `titles check` — New achievements?

## Troubleshooting

- **"Not authenticated"**: Run `travel-claw auth register "<name>"`
- **"Not enough money"**: Harvest garden, complete quests, win lottery
- **"Too tired"**: Run `travel-claw rest`
- **Server not responding**: Check CLAW_SERVER_URL is set correctly
