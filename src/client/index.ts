#!/usr/bin/env node

import { Command } from 'commander';
import { ApiClient } from './api.client';
import { getAuthKey, setAuthKey, getServerUrl } from './config';
import {
  formatCharacter, formatTable, formatBox, formatStats,
  success, error, info, warn,
} from './formatter';
import type {
  Character, TravelPlan, Photo, Postcard, Poem,
  Artwork, Souvenir, LocationMessage, SceneInteraction,
  Landmark, AgentLogEntry, TravelHistoryEntry,
  Garden, BackpackSlot, Friend, VisitorEvent, LotteryResult,
  Title, HomeEvent, ShopItem,
  RandomEvent, NPCEncounter, Quest, Weather,
} from '../shared/types';

const program = new Command();
const api = new ApiClient(getServerUrl(), getAuthKey());

program
  .name('@shadowob/travel-claw')
  .description('🦞 Travel Claw - Raise a traveling lobster!')
  .version('1.0.0');

// ─── Auth ───
const auth = program.command('auth').description('Authentication commands');

auth.command('register')
  .description('Register a new lobster')
  .argument('<name>', 'Name for your lobster')
  .action(async (name: string) => {
    const res = await api.register(name);
    if (!res.success) { error(res.error || 'Registration failed'); return; }
    const data = res.data as { authKey: string; character: Character };
    setAuthKey(data.authKey);
    api.setAuthKey(data.authKey);
    success(`Registered lobster "${data.character.name}"!`);
    info(`Auth key saved. You're ready to play!`);
    console.log(formatCharacter(data.character));
  });

auth.command('status')
  .description('Check authentication status')
  .action(async () => {
    const key = getAuthKey();
    if (!key) { warn('Not logged in. Run: travel-claw auth register <name>'); return; }
    api.setAuthKey(key);
    const res = await api.status();
    if (!res.success) { error('Invalid auth key'); return; }
    success('Authenticated');
    info(`Auth key: ${key.substring(0, 8)}...`);
  });

auth.command('key')
  .description('Set an existing auth key')
  .argument('<key>', 'Auth key')
  .action((key: string) => {
    setAuthKey(key);
    success('Auth key saved');
  });

// ─── Status ───
program.command('status')
  .description('View your lobster\'s current status')
  .action(async () => {
    ensureAuth();
    const res = await api.status();
    if (!res.success) { error(res.error!); return; }
    console.log(formatCharacter(res.data as Character));
  });

program.command('history')
  .description('View travel history')
  .action(async () => {
    ensureAuth();
    const res = await api.statusHistory();
    if (!res.success) { error(res.error!); return; }
    const history = res.data as TravelHistoryEntry[];
    if (history.length === 0) { info('No travel history yet'); return; }
    console.log(formatTable(
      ['#', 'Location', 'City', 'Arrived', 'Activities'],
      history.map((h, i) => [
        (i + 1).toString(),
        h.location.name,
        h.location.city,
        new Date(h.arrivedAt).toLocaleDateString(),
        h.activities.join(', '),
      ])
    ));
  });

// ─── Travel ───
const travel = program.command('travel').description('Travel commands');

travel.command('plan')
  .description('Plan a trip to a destination')
  .argument('<destination>', 'Destination name')
  .action(async (destination: string) => {
    ensureAuth();
    const res = await api.travelPlan(destination);
    if (!res.success) { error(res.error!); return; }
    const plan = res.data as TravelPlan;
    console.log(formatBox('🗺️  Travel Plan', [
      `From: ${plan.origin.name}, ${plan.origin.city}`,
      `To:   ${plan.destination.name}, ${plan.destination.city}`,
      `Distance: ${plan.distanceKm} km`,
      `Est. Time: ${plan.estimatedHours} hours`,
      `Status: ${plan.status}`,
      '',
      'Run "travel-claw travel start" to begin!',
    ].join('\n')));
  });

travel.command('start')
  .description('Start the planned trip')
  .action(async () => {
    ensureAuth();
    const res = await api.travelStart();
    if (!res.success) { error(res.error!); return; }
    const plan = res.data as TravelPlan;
    success(`Arrived at ${plan.destination.name}, ${plan.destination.city}! 🎉`);
    info(`Distance traveled: ${plan.distanceKm} km`);
  });

travel.command('stop')
  .description('Cancel current travel plan')
  .action(async () => {
    ensureAuth();
    await api.travelStop();
    success('Travel plan cancelled');
  });

travel.command('location')
  .description('Show current location')
  .action(async () => {
    ensureAuth();
    const res = await api.travelLocation();
    if (!res.success) { error(res.error!); return; }
    const loc = res.data as any;
    console.log(formatBox('📍 Current Location', [
      `Name: ${loc.name}`,
      `City: ${loc.city}, ${loc.country}`,
      `Coordinates: ${loc.coordinates.lat.toFixed(4)}, ${loc.coordinates.lng.toFixed(4)}`,
    ].join('\n')));
  });

// ─── Photo ───
const photo = program.command('photo').description('Photo commands (Google Street View)');

photo.command('take')
  .description('Take a street view photo')
  .option('-h, --heading <degrees>', 'Camera heading (0-360)')
  .option('-p, --pitch <degrees>', 'Camera pitch (-90 to 90)')
  .action(async (opts: { heading?: string; pitch?: string }) => {
    ensureAuth();
    const heading = opts.heading ? parseInt(opts.heading) : undefined;
    const pitch = opts.pitch ? parseInt(opts.pitch) : undefined;
    const res = await api.photoTake(heading, pitch);
    if (!res.success) { error(res.error!); return; }
    const p = res.data as Photo;
    success(`📸 Photo taken at ${p.location.name}!`);
    info(`Caption: ${p.caption}`);
    info(`Street View: ${p.imageUrl}`);
  });

photo.command('album')
  .description('View photo album')
  .action(async () => {
    ensureAuth();
    const res = await api.photoAlbum();
    if (!res.success) { error(res.error!); return; }
    const photos = res.data as Photo[];
    if (photos.length === 0) { info('Photo album is empty'); return; }
    console.log(formatTable(
      ['#', 'Location', 'Caption', 'Date'],
      photos.map((p, i) => [
        (i + 1).toString(),
        p.location.name,
        p.caption.substring(0, 40),
        new Date(p.takenAt).toLocaleDateString(),
      ])
    ));
  });

// ─── Postcard ───
const postcard = program.command('postcard').description('Postcard commands');

postcard.command('send')
  .description('Send a postcard from current location')
  .argument('<to>', 'Recipient')
  .argument('<message>', 'Message on the postcard')
  .action(async (to: string, message: string) => {
    ensureAuth();
    const res = await api.postcardSend(to, message);
    if (!res.success) { error(res.error!); return; }
    const pc = res.data as Postcard;
    success(`💌 Postcard sent to ${pc.to} from ${pc.from.city}!`);
  });

postcard.command('inbox')
  .description('View sent postcards')
  .action(async () => {
    ensureAuth();
    const res = await api.postcardInbox();
    if (!res.success) { error(res.error!); return; }
    const postcards = res.data as Postcard[];
    if (postcards.length === 0) { info('No postcards sent yet'); return; }
    postcards.forEach((pc, i) => {
      console.log(formatBox(`💌 Postcard #${i + 1}`, [
        `From: ${pc.from.name}, ${pc.from.city}`,
        `To: ${pc.to}`,
        `Message: ${pc.message}`,
        `Sent: ${new Date(pc.sentAt).toLocaleDateString()}`,
      ].join('\n')));
    });
  });

// ─── Interact ───
const interact = program.command('interact').description('Interact with the scene');

interact.command('do')
  .description('Interact with the current scene')
  .action(async () => {
    ensureAuth();
    const res = await api.interact();
    if (!res.success) { error(res.error!); return; }
    const si = res.data as SceneInteraction;
    console.log(formatBox('🎭 Scene Interaction', [
      si.description,
      '',
      `Mood: +${si.moodChange}  |  XP: +${si.experienceGain}`,
    ].join('\n')));
  });

interact.command('look')
  .description('Look around at current location')
  .action(async () => {
    ensureAuth();
    const res = await api.interactLook();
    if (!res.success) { error(res.error!); return; }
    const data = res.data as { description: string; mapUrl: string };
    console.log('\n' + data.description);
    info(`Map: ${data.mapUrl}`);
  });

// ─── Message ───
const message = program.command('message').description('Leave and read messages');

message.command('leave')
  .description('Leave a message at current location')
  .argument('<content>', 'Message to leave')
  .action(async (content: string) => {
    ensureAuth();
    const res = await api.messageLeave(content);
    if (!res.success) { error(res.error!); return; }
    const msg = res.data as LocationMessage;
    success(`📝 Message left at ${msg.location.name}!`);
  });

message.command('read')
  .description('Read messages left at locations')
  .action(async () => {
    ensureAuth();
    const res = await api.messageRead();
    if (!res.success) { error(res.error!); return; }
    const messages = res.data as LocationMessage[];
    if (messages.length === 0) { info('No messages yet'); return; }
    messages.forEach((msg, i) => {
      console.log(formatBox(`📝 Message #${i + 1}`, [
        `Location: ${msg.location.name}`,
        `By: ${msg.author}`,
        `Content: ${msg.content}`,
        `Date: ${new Date(msg.leftAt).toLocaleDateString()}`,
      ].join('\n')));
    });
  });

// ─── Poetry ───
const poetry = program.command('poetry').description('Write and read poetry');

poetry.command('write')
  .description('Write a poem inspired by current location')
  .action(async () => {
    ensureAuth();
    const res = await api.poetryWrite();
    if (!res.success) { error(res.error!); return; }
    const poem = res.data as Poem;
    console.log(formatBox(`📜 ${poem.title}`, [
      poem.content,
      '',
      `— Written at ${poem.location.name}, ${poem.location.city}`,
    ].join('\n')));
  });

poetry.command('collection')
  .description('View poetry collection')
  .action(async () => {
    ensureAuth();
    const res = await api.poetryCollection();
    if (!res.success) { error(res.error!); return; }
    const poems = res.data as Poem[];
    if (poems.length === 0) { info('No poems written yet'); return; }
    poems.forEach((poem, i) => {
      console.log(formatBox(`📜 ${poem.title} (#${i + 1})`, [
        poem.content,
        '',
        `— ${poem.location.name}, ${new Date(poem.writtenAt).toLocaleDateString()}`,
      ].join('\n')));
    });
  });

// ─── Art ───
const art = program.command('art').description('Create and view artwork');

art.command('create')
  .description('Create artwork of current scene')
  .option('-s, --style <style>', 'Art style (watercolor, oil, sketch, digital, impressionist, pixel)')
  .action(async (opts: { style?: string }) => {
    ensureAuth();
    const res = await api.artCreate(opts.style);
    if (!res.success) { error(res.error!); return; }
    const aw = res.data as Artwork;
    console.log(formatBox(`🎨 ${aw.title}`, [
      `Style: ${aw.style}`,
      `Description: ${aw.description}`,
      `Image: ${aw.imageUrl}`,
      `Created at: ${aw.location.name}, ${aw.location.city}`,
    ].join('\n')));
  });

art.command('gallery')
  .description('View art gallery')
  .action(async () => {
    ensureAuth();
    const res = await api.artGallery();
    if (!res.success) { error(res.error!); return; }
    const artworks = res.data as Artwork[];
    if (artworks.length === 0) { info('Art gallery is empty'); return; }
    console.log(formatTable(
      ['#', 'Title', 'Style', 'Location', 'Date'],
      artworks.map((a, i) => [
        (i + 1).toString(),
        a.title,
        a.style,
        a.location.name,
        new Date(a.createdAt).toLocaleDateString(),
      ])
    ));
  });

// ─── Souvenir ───
const souvenir = program.command('souvenir').description('Buy and view souvenirs');

souvenir.command('buy')
  .description('Buy a local souvenir')
  .action(async () => {
    ensureAuth();
    const res = await api.souvenirBuy();
    if (!res.success) { error(res.error!); return; }
    const s = res.data as Souvenir;
    success(`🛍️  Bought "${s.name}" for $${s.price}!`);
    info(s.description);
  });

souvenir.command('inventory')
  .description('View souvenir inventory')
  .action(async () => {
    ensureAuth();
    const res = await api.souvenirInventory();
    if (!res.success) { error(res.error!); return; }
    const souvenirs = res.data as Souvenir[];
    if (souvenirs.length === 0) { info('No souvenirs collected yet'); return; }
    console.log(formatTable(
      ['#', 'Name', 'Price', 'Location', 'Date'],
      souvenirs.map((s, i) => [
        (i + 1).toString(),
        s.name,
        `$${s.price}`,
        s.location.city,
        new Date(s.boughtAt).toLocaleDateString(),
      ])
    ));
  });

// ─── Tour ───
const tour = program.command('tour').description('Tour commands');

tour.command('start')
  .description('Start touring current location')
  .action(async () => {
    ensureAuth();
    const res = await api.tourStart();
    if (!res.success) { error(res.error!); return; }
    const si = res.data as SceneInteraction;
    console.log(formatBox('🏛️  Tour', [
      si.description,
      '',
      `Mood: +${si.moodChange}  |  XP: +${si.experienceGain}`,
    ].join('\n')));
  });

tour.command('landmarks')
  .description('List nearby landmarks')
  .action(async () => {
    ensureAuth();
    const res = await api.tourLandmarks();
    if (!res.success) { error(res.error!); return; }
    const landmarks = res.data as Landmark[];
    if (landmarks.length === 0) { info('No nearby landmarks found'); return; }
    console.log(formatTable(
      ['Name', 'Type', 'City', 'Country', 'Rating'],
      landmarks.map(l => [
        l.name,
        l.type,
        l.location.city,
        l.location.country,
        l.rating ? l.rating.toFixed(1) : 'N/A',
      ])
    ));
  });

// ─── Rest & Eat ───
program.command('rest')
  .description('Rest to recover from fatigue')
  .action(async () => {
    ensureAuth();
    const res = await api.rest();
    if (!res.success) { error(res.error!); return; }
    success('😴 The lobster takes a nice rest...');
    console.log(formatCharacter(res.data as Character));
  });

program.command('eat')
  .description('Eat local food ($15)')
  .action(async () => {
    ensureAuth();
    const res = await api.eat();
    if (!res.success) { error(res.error!); return; }
    success('🍖 The lobster enjoys a local meal!');
    console.log(formatCharacter(res.data as Character));
  });

// ─── Agent ───
const agent = program.command('agent').description('Autonomous travel agent');

agent.command('start')
  .description('Start autonomous agent')
  .action(async () => {
    ensureAuth();
    await api.agentStart();
    success('🤖 Agent started! It will autonomously travel and explore.');
    info('Run "travel-claw agent step" to advance the agent by one step.');
    info('Run "travel-claw agent log" to see what the agent has been doing.');
  });

agent.command('stop')
  .description('Stop autonomous agent')
  .action(async () => {
    ensureAuth();
    await api.agentStop();
    success('🤖 Agent stopped.');
  });

agent.command('status')
  .description('Check agent status')
  .action(async () => {
    ensureAuth();
    const res = await api.agentStatus();
    if (!res.success) { error(res.error!); return; }
    const data = res.data as { status: string; log: AgentLogEntry[] };
    info(`Agent status: ${data.status}`);
    info(`Total actions: ${data.log.length}`);
  });

agent.command('step')
  .description('Run one autonomous agent step')
  .option('-n, --count <count>', 'Number of steps to run', '1')
  .action(async (opts: { count: string }) => {
    ensureAuth();
    const count = parseInt(opts.count) || 1;
    for (let i = 0; i < count; i++) {
      const res = await api.agentStep();
      if (!res.success) { error(res.error!); return; }
      const entry = res.data as AgentLogEntry;
      console.log(`  [${i + 1}/${count}] 🤖 ${entry.action}: ${entry.detail}`);
    }
    success(`Agent completed ${count} step(s)`);
  });

agent.command('log')
  .description('View agent activity log')
  .option('-n, --limit <limit>', 'Number of entries to show', '20')
  .action(async (opts: { limit: string }) => {
    ensureAuth();
    const res = await api.agentLog();
    if (!res.success) { error(res.error!); return; }
    const log = (res.data as AgentLogEntry[]).slice(0, parseInt(opts.limit) || 20);
    if (log.length === 0) { info('No agent activity yet'); return; }
    console.log(formatTable(
      ['Time', 'Action', 'Detail', 'Location'],
      log.map(e => [
        new Date(e.timestamp).toLocaleString(),
        e.action,
        e.detail.substring(0, 50),
        e.location?.name || 'N/A',
      ])
    ));
  });

// ─── Map Provider ───
const map = program.command('map').description('Map provider settings');

map.command('providers')
  .description('List available map providers')
  .action(async () => {
    ensureAuth();
    const res = await api.mapProviders();
    if (!res.success) { error(res.error!); return; }
    info(`Available providers: ${(res.data as string[]).join(', ')}`);
  });

map.command('set')
  .description('Set map provider')
  .argument('<provider>', 'Provider name (google, mapbox)')
  .action(async (provider: string) => {
    ensureAuth();
    const res = await api.mapSetProvider(provider);
    if (!res.success) { error(res.error!); return; }
    success(`Map provider set to: ${provider}`);
  });

// ─── Garden ───
const garden = program.command('garden').description('Clover garden & passive income');

garden.command('status')
  .description('View garden status')
  .action(async () => {
    ensureAuth();
    const res = await api.garden();
    if (!res.success) { error(res.error!); return; }
    const g = res.data as Garden;
    console.log(formatBox('🌿 Garden', [
      `Clovers: ${g.clovers} 🍀`,
      `Four-Leaf Clovers: ${g.fourLeafClovers} 🍀🍀 (lottery tickets!)`,
      `Growth Rate: ${g.growthRate} clovers/hour`,
      `Last Harvest: ${new Date(g.lastHarvestAt).toLocaleString()}`,
    ].join('\n')));
  });

garden.command('harvest')
  .description('Harvest clovers from your garden')
  .action(async () => {
    ensureAuth();
    const res = await api.gardenHarvest();
    if (!res.success) { error(res.error!); return; }
    const g = res.data as Garden;
    success('🌿 Garden harvested!');
    info(`Clovers: ${g.clovers} | Four-Leaf: ${g.fourLeafClovers}`);
  });

// ─── Shop ───
const shop = program.command('shop').description('Buy food, tools & amulets');

shop.command('list')
  .description('Browse the shop')
  .action(async () => {
    ensureAuth();
    const res = await api.shopList();
    if (!res.success) { error(res.error!); return; }
    const items = res.data as ShopItem[];
    const categories = ['food', 'tool', 'amulet'] as const;
    for (const cat of categories) {
      const catItems = items.filter(i => i.category === cat);
      console.log(`\n  ${{ food: '🍽️  Food', tool: '🔧 Tools', amulet: '✨ Amulets' }[cat]}`);
      console.log(formatTable(
        ['ID', 'Name', 'Price', 'Description', 'Travel Bonus'],
        catItems.map(i => [i.id, i.name, `$${i.price}`, i.description, i.travelBonus || '-'])
      ));
    }
  });

shop.command('buy')
  .description('Buy an item from the shop')
  .argument('<itemId>', 'Item ID to buy')
  .action(async (itemId: string) => {
    ensureAuth();
    const res = await api.shopBuy(itemId);
    if (!res.success) { error(res.error!); return; }
    success(`Purchased! Item added to backpack.`);
    const bp = res.data as BackpackSlot[];
    console.log(formatTable(
      ['Item', 'Quantity'],
      bp.map(s => [s.item.name, s.quantity.toString()])
    ));
  });

// ─── Backpack ───
const backpack = program.command('backpack').description('View & use items in your backpack');

backpack.command('list')
  .description('View backpack contents')
  .action(async () => {
    ensureAuth();
    const res = await api.backpack();
    if (!res.success) { error(res.error!); return; }
    const bp = res.data as BackpackSlot[];
    if (bp.length === 0) { info('Backpack is empty. Visit the shop!'); return; }
    console.log(formatTable(
      ['Item', 'Category', 'Qty', 'Effect'],
      bp.map(s => [s.item.name, s.item.category, s.quantity.toString(), s.item.description])
    ));
  });

backpack.command('use')
  .description('Use an item from your backpack')
  .argument('<itemId>', 'Item ID to use')
  .action(async (itemId: string) => {
    ensureAuth();
    const res = await api.backpackUse(itemId);
    if (!res.success) { error(res.error!); return; }
    const data = res.data as { used: boolean; message: string };
    success(data.message);
  });

// ─── Friends ───
const friends = program.command('friends').description('Friends & visitors');

friends.command('list')
  .description('View your friends')
  .action(async () => {
    ensureAuth();
    const res = await api.friends();
    if (!res.success) { error(res.error!); return; }
    const fl = res.data as Friend[];
    if (fl.length === 0) { info('No friends yet. Check for visitors!'); return; }
    console.log(formatTable(
      ['Name', 'Type', 'Friendship', 'Visits', 'Last Visit'],
      fl.map(f => [
        f.name, f.type,
        `${f.friendship}/100`,
        f.visitCount.toString(),
        f.lastVisit ? new Date(f.lastVisit).toLocaleDateString() : 'N/A',
      ])
    ));
  });

friends.command('check')
  .description('Check for visitor at your door')
  .action(async () => {
    ensureAuth();
    const res = await api.friendsCheck();
    if (!res.success) { error(res.error!); return; }
    const event = res.data as VisitorEvent | null;
    if (!event) { info('No visitors right now. Check back later!'); return; }
    console.log(formatBox('🐾 Visitor!', [
      event.message,
      event.gift ? `Gift: ${event.gift}` : '',
      event.cloverReward ? `Clover reward: +${event.cloverReward} 🍀` : '',
    ].filter(Boolean).join('\n')));
  });

friends.command('entertain')
  .description('Give a friend an item from your backpack')
  .argument('<friendId>', 'Friend ID')
  .argument('<itemId>', 'Item ID to give')
  .action(async (friendId: string, itemId: string) => {
    ensureAuth();
    const res = await api.friendsEntertain(friendId, itemId);
    if (!res.success) { error(res.error!); return; }
    const data = res.data as { success: boolean; message: string };
    success(data.message);
  });

// ─── Lottery ───
const lottery = program.command('lottery').description('Try your luck with four-leaf clovers!');

lottery.command('play')
  .description('Use a four-leaf clover as lottery ticket')
  .action(async () => {
    ensureAuth();
    const res = await api.lotteryPlay();
    if (!res.success) { error(res.error!); return; }
    const result = res.data as LotteryResult;
    console.log(formatBox('🎰 Lottery Result!', [
      `Prize: ${result.prize.toUpperCase()}`,
      `${result.reward}`,
      `Money Won: +$${result.moneyWon}`,
    ].join('\n')));
  });

lottery.command('history')
  .description('View lottery history')
  .action(async () => {
    ensureAuth();
    const res = await api.lotteryHistory();
    if (!res.success) { error(res.error!); return; }
    const history = res.data as LotteryResult[];
    if (history.length === 0) { info('No lottery plays yet'); return; }
    console.log(formatTable(
      ['Prize', 'Reward', 'Money', 'Date'],
      history.map(r => [r.prize, r.reward.substring(0, 40), `$${r.moneyWon}`, new Date(r.timestamp).toLocaleDateString()])
    ));
  });

// ─── Titles ───
const titleCmd = program.command('titles').description('View achievements & titles');

titleCmd.command('list')
  .description('View earned titles')
  .action(async () => {
    ensureAuth();
    const res = await api.titles();
    if (!res.success) { error(res.error!); return; }
    const tl = res.data as Title[];
    if (tl.length === 0) { info('No titles earned yet'); return; }
    console.log(formatTable(
      ['Title', 'Description', 'Earned'],
      tl.map(t => [t.name, t.description, t.unlockedAt ? new Date(t.unlockedAt).toLocaleDateString() : ''])
    ));
  });

titleCmd.command('check')
  .description('Check for new title unlocks')
  .action(async () => {
    ensureAuth();
    const res = await api.titlesCheck();
    if (!res.success) { error(res.error!); return; }
    const newTitles = res.data as Title[];
    if (newTitles.length === 0) { info('No new titles unlocked'); return; }
    newTitles.forEach(t => success(`🏆 New title: "${t.name}" — ${t.description}`));
  });

// ─── Home ───
const home = program.command('home').description('Home activities for your lobster');

home.command('do')
  .description('Do an activity at home')
  .option('-a, --activity <activity>', 'Activity: reading, crafting, napping, eating, sharpening_claws, writing_diary')
  .action(async (opts: { activity?: string }) => {
    ensureAuth();
    const res = await api.homeActivity(opts.activity);
    if (!res.success) { error(res.error!); return; }
    const event = res.data as HomeEvent;
    const effects = Object.entries(event.statsEffect)
      .map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`)
      .join(' | ');
    console.log(formatBox(`🏠 ${event.activity}`, [
      event.description,
      '',
      effects,
    ].join('\n')));
  });

home.command('log')
  .description('View past home activities')
  .action(async () => {
    ensureAuth();
    const res = await api.homeEvents();
    if (!res.success) { error(res.error!); return; }
    const events = res.data as HomeEvent[];
    if (events.length === 0) { info('No home activities yet'); return; }
    console.log(formatTable(
      ['Activity', 'Description', 'Date'],
      events.slice(0, 20).map(e => [e.activity, e.description.substring(0, 50), new Date(e.timestamp).toLocaleDateString()])
    ));
  });

// ─── Album (Collection) ───
const album = program.command('album').description('Collection completion tracker');

album.command('stats')
  .description('View collection completion stats')
  .action(async () => {
    ensureAuth();
    const res = await api.albumStats();
    if (!res.success) { error(res.error!); return; }
    const stats = res.data as { photos: number; souvenirs: number; cities: number; totalCities: number; completionPct: number };
    console.log(formatBox('📚 Collection Album', [
      `📸 Photos: ${stats.photos}`,
      `🛍️  Souvenirs: ${stats.souvenirs}`,
      `🏙️  Cities Visited: ${stats.cities} / ${stats.totalCities}`,
      '',
      `Overall Completion: ${stats.completionPct}%`,
    ].join('\n')));
  });

// ─── Explore ───
program.command('explore')
  .description('Explore your surroundings (random events, NPC encounters)')
  .action(async () => {
    ensureAuth();
    const res = await api.explore();
    if (!res.success) { error(res.error!); return; }
    const data = res.data as { event?: RandomEvent; npc?: NPCEncounter; weather: Weather | null };
    if (data.weather) {
      info(`🌤️  Weather: ${data.weather.description}`);
    }
    if (data.event) {
      console.log(formatBox(`⚡ ${data.event.title}`, [
        data.event.description,
        '',
        data.event.moneyChange !== 0 ? `💰 ${data.event.moneyChange > 0 ? '+' : ''}$${data.event.moneyChange}` : '',
        data.event.itemReward ? `🎁 Received item!` : '',
        Object.entries(data.event.statChanges).map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(' | '),
      ].filter(Boolean).join('\n')));
    }
    if (data.npc) {
      console.log(formatBox(`🧑 ${data.npc.npc.name} (${data.npc.npc.role})`, [
        `"${data.npc.npc.greeting}"`,
        '',
        `💬 ${data.npc.dialogue}`,
        '',
        `📋 ${data.npc.outcome}`,
        data.npc.moneyChange !== 0 ? `💰 ${data.npc.moneyChange > 0 ? '+' : ''}$${data.npc.moneyChange}` : '',
        data.npc.itemReward ? `🎁 Received item!` : '',
      ].filter(Boolean).join('\n')));
    }
    if (!data.event && !data.npc) {
      info('Nothing unusual happened. The lobster enjoyed a quiet stroll.');
    }
  });

// ─── Weather ───
const weather = program.command('weather').description('Check or change weather');

weather.command('check')
  .description('Check current weather')
  .action(async () => {
    ensureAuth();
    const res = await api.weather();
    if (!res.success) { error(res.error!); return; }
    const w = res.data as Weather;
    console.log(formatBox('🌤️  Weather', [
      `Condition: ${w.type}`,
      w.description,
      '',
      Object.entries(w.statModifiers).length > 0
        ? 'Effects: ' + Object.entries(w.statModifiers).map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(' | ')
        : 'No stat effects',
    ].join('\n')));
  });

// ─── Events ───
const events = program.command('events').description('Random events log');

events.command('history')
  .description('View past random events')
  .action(async () => {
    ensureAuth();
    const res = await api.eventsHistory();
    if (!res.success) { error(res.error!); return; }
    const evts = res.data as RandomEvent[];
    if (evts.length === 0) { info('No events yet. Try exploring!'); return; }
    console.log(formatTable(
      ['Category', 'Title', 'Money', 'Location', 'Date'],
      evts.slice(0, 20).map(e => [
        e.category,
        e.title.substring(0, 30),
        e.moneyChange !== 0 ? `${e.moneyChange > 0 ? '+' : ''}$${e.moneyChange}` : '-',
        e.location.city,
        new Date(e.timestamp).toLocaleDateString(),
      ])
    ));
  });

// ─── NPC ───
const npc = program.command('npc').description('NPC encounters');

npc.command('meet')
  .description('Try to meet an NPC')
  .action(async () => {
    ensureAuth();
    const res = await api.npcEncounter();
    if (!res.success) { error(res.error!); return; }
    const enc = res.data as NPCEncounter;
    if (!enc) { info('No NPCs around right now.'); return; }
    console.log(formatBox(`🧑 ${enc.npc.name} (${enc.npc.role})`, [
      `"${enc.npc.greeting}"`,
      '',
      `💬 ${enc.dialogue}`,
      '',
      `📋 ${enc.outcome}`,
      enc.moneyChange !== 0 ? `💰 ${enc.moneyChange > 0 ? '+' : ''}$${enc.moneyChange}` : '',
      enc.itemReward ? `🎁 Received item!` : '',
    ].filter(Boolean).join('\n')));
  });

npc.command('history')
  .description('View past NPC encounters')
  .action(async () => {
    ensureAuth();
    const res = await api.npcHistory();
    if (!res.success) { error(res.error!); return; }
    const encounters = res.data as NPCEncounter[];
    if (encounters.length === 0) { info('No NPC encounters yet. Try exploring!'); return; }
    console.log(formatTable(
      ['NPC', 'Role', 'Outcome', 'Location', 'Date'],
      encounters.slice(0, 20).map(e => [
        e.npc.name,
        e.npc.role,
        e.outcome.substring(0, 40),
        e.location.city,
        new Date(e.timestamp).toLocaleDateString(),
      ])
    ));
  });

// ─── Quests ───
const quest = program.command('quest').description('Daily quests & missions');

quest.command('list')
  .description('View active quests')
  .action(async () => {
    ensureAuth();
    const res = await api.quests();
    if (!res.success) { error(res.error!); return; }
    const quests = res.data as Quest[];
    if (quests.length === 0) { info('No active quests. Generate one!'); return; }
    quests.forEach(q => {
      const pct = Math.floor((q.currentCount / q.targetCount) * 100);
      console.log(formatBox(`📋 ${q.title}`, [
        q.description,
        '',
        `Progress: ${q.currentCount}/${q.targetCount} (${pct}%)`,
        `Reward: $${q.reward.money} + ${q.reward.experience} XP`,
      ].join('\n')));
    });
  });

quest.command('all')
  .description('View all quests including completed')
  .action(async () => {
    ensureAuth();
    const res = await api.questsAll();
    if (!res.success) { error(res.error!); return; }
    const quests = res.data as Quest[];
    if (quests.length === 0) { info('No quests yet'); return; }
    console.log(formatTable(
      ['Title', 'Status', 'Progress', 'Reward'],
      quests.map(q => [
        q.title,
        q.status,
        `${q.currentCount}/${q.targetCount}`,
        `$${q.reward.money} + ${q.reward.experience}XP`,
      ])
    ));
  });

quest.command('new')
  .description('Generate a new quest')
  .action(async () => {
    ensureAuth();
    const res = await api.questsGenerate();
    if (!res.success) { error(res.error!); return; }
    const q = res.data as Quest;
    success(`📋 New quest: "${q.title}"`);
    info(q.description);
    info(`Objective: ${q.objective} x${q.targetCount}`);
    info(`Reward: $${q.reward.money} + ${q.reward.experience} XP`);
  });

// ─── Interactive Mode ───
program.command('play')
  .description('Enter interactive mode')
  .action(async () => {
    ensureAuth();
    const { startInteractiveMode } = await import('./interactive');
    await startInteractiveMode(api);
  });

// ─── Helper ───
function ensureAuth() {
  const key = getAuthKey();
  if (!key) {
    error('Not authenticated. Run: travel-claw auth register <name>');
    process.exit(1);
  }
  api.setAuthKey(key);
}

program.parse();
