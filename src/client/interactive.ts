import * as readline from 'readline';
import { ApiClient } from './api.client';
import {
  formatCharacter, formatTable, formatBox,
  success, error, info, warn,
} from './formatter';
import type {
  Character, TravelPlan, Photo, Postcard, Poem, Artwork,
  Souvenir, SceneInteraction, Landmark, AgentLogEntry,
  Garden, BackpackSlot, Friend, VisitorEvent, LotteryResult,
  Title, HomeEvent, ShopItem,
  RandomEvent, NPCEncounter, Quest, Weather,
} from '../shared/types';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const MAGENTA = '\x1b[35m';

function miniBar(value: number, max: number, width = 8): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  const color = value > 60 ? GREEN : value > 30 ? YELLOW : '\x1b[31m';
  return `${color}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET}`;
}

async function getStatusLine(api: ApiClient): Promise<string> {
  const res = await api.status();
  if (!res.success) return '(unable to fetch status)';
  const c = res.data as Character;
  const s = c.stats;
  const loc = c.currentLocation;
  return `${DIM}📍${RESET} ${CYAN}${loc.city}${RESET} | ` +
    `❤️ ${miniBar(s.health, 100)} ` +
    `😊${miniBar(s.mood, 100)} ` +
    `💤${miniBar(100 - s.fatigue, 100)} ` +
    `🍖${miniBar(100 - s.hunger, 100)} ` +
    `${YELLOW}$${s.money}${RESET} ` +
    `⭐${s.experience}`;
}

const COMMANDS: Record<string, { desc: string; usage?: string }> = {
  status:    { desc: 'View lobster status' },
  travel:    { desc: 'Travel to destination', usage: 'travel <destination>' },
  photo:     { desc: 'Take a photo' },
  poem:      { desc: 'Write a poem' },
  art:       { desc: 'Create artwork', usage: 'art [style]' },
  postcard:  { desc: 'Send postcard', usage: 'postcard <to> <message>' },
  souvenir:  { desc: 'Buy souvenir' },
  interact:  { desc: 'Interact with scene' },
  look:      { desc: 'Look around' },
  message:   { desc: 'Leave message', usage: 'message <content>' },
  explore:   { desc: 'Explore (random events & NPCs)' },
  rest:      { desc: 'Rest to recover fatigue' },
  eat:       { desc: 'Eat local food ($15)' },
  shop:      { desc: 'Browse the shop' },
  buy:       { desc: 'Buy from shop', usage: 'buy <itemId>' },
  backpack:  { desc: 'View backpack' },
  use:       { desc: 'Use an item', usage: 'use <itemId>' },
  garden:    { desc: 'View garden' },
  harvest:   { desc: 'Harvest clovers' },
  friends:   { desc: 'View friends' },
  visitors:  { desc: 'Check for visitors' },
  weather:   { desc: 'Check weather' },
  quest:     { desc: 'View active quests' },
  'quest new': { desc: 'Generate new quest' },
  npc:       { desc: 'Meet an NPC' },
  lottery:   { desc: 'Play lottery' },
  titles:    { desc: 'View titles' },
  home:      { desc: 'Do home activity', usage: 'home [activity]' },
  album:     { desc: 'Collection stats' },
  history:   { desc: 'Travel history' },
  help:      { desc: 'Show commands' },
  quit:      { desc: 'Exit interactive mode' },
};

export async function startInteractiveMode(api: ApiClient): Promise<void> {
  console.log(`\n${BOLD}${MAGENTA}🦞 Travel Claw — Interactive Mode${RESET}`);
  console.log(`${DIM}Type "help" for commands. Type "quit" to exit.${RESET}\n`);

  const statusLine = await getStatusLine(api);
  console.log(statusLine);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\n${BOLD}🦞 > ${RESET}`,
    completer: (line: string) => {
      const completions = Object.keys(COMMANDS);
      const hits = completions.filter(c => c.startsWith(line.trim()));
      return [hits.length ? hits : completions, line];
    },
  });

  rl.prompt();

  rl.on('line', async (input: string) => {
    const line = input.trim();
    if (!line) { rl.prompt(); return; }

    const [cmd, ...args] = line.split(/\s+/);
    const argStr = args.join(' ');

    try {
      switch (cmd) {
        case 'quit':
        case 'exit':
          info('Goodbye! 🦞');
          rl.close();
          return;

        case 'help':
          console.log(`\n${BOLD}Available Commands:${RESET}`);
          for (const [name, { desc, usage }] of Object.entries(COMMANDS)) {
            console.log(`  ${CYAN}${(usage || name).padEnd(30)}${RESET} ${desc}`);
          }
          break;

        case 'status': {
          const res = await api.status();
          if (!res.success) { error(res.error!); break; }
          console.log(formatCharacter(res.data as Character));
          break;
        }

        case 'travel': {
          if (!argStr) { warn('Usage: travel <destination>'); break; }
          const plan = await api.travelPlan(argStr);
          if (!plan.success) { error(plan.error!); break; }
          const p = plan.data as TravelPlan;
          info(`📍 ${p.origin.city} → ${p.destination.city} (${p.distanceKm}km)`);
          const start = await api.travelStart();
          if (!start.success) { error(start.error!); break; }
          const sp = start.data as TravelPlan;
          success(`Arrived at ${sp.destination.name}, ${sp.destination.city}! 🎉`);
          break;
        }

        case 'photo': {
          const res = await api.photoTake();
          if (!res.success) { error(res.error!); break; }
          const p = res.data as Photo;
          success(`📸 Photo at ${p.location.name}: ${p.caption}`);
          break;
        }

        case 'poem': {
          const res = await api.poetryWrite();
          if (!res.success) { error(res.error!); break; }
          const p = res.data as Poem;
          console.log(formatBox(`📜 ${p.title}`, p.content));
          break;
        }

        case 'art': {
          const res = await api.artCreate(argStr || undefined);
          if (!res.success) { error(res.error!); break; }
          const a = res.data as Artwork;
          success(`🎨 Created: ${a.title} (${a.style})`);
          break;
        }

        case 'postcard': {
          const parts = argStr.split(/\s+/);
          const to = parts[0];
          const msg = parts.slice(1).join(' ');
          if (!to || !msg) { warn('Usage: postcard <to> <message>'); break; }
          const res = await api.postcardSend(to, msg);
          if (!res.success) { error(res.error!); break; }
          success(`💌 Postcard sent to ${to}!`);
          break;
        }

        case 'souvenir': {
          const res = await api.souvenirBuy();
          if (!res.success) { error(res.error!); break; }
          const s = res.data as Souvenir;
          success(`🛍️ Bought "${s.name}" ($${s.price})`);
          break;
        }

        case 'interact': {
          const res = await api.interact();
          if (!res.success) { error(res.error!); break; }
          const si = res.data as SceneInteraction;
          console.log(`\n  ${si.description}`);
          info(`Mood: +${si.moodChange} | XP: +${si.experienceGain}`);
          break;
        }

        case 'look': {
          const res = await api.interactLook();
          if (!res.success) { error(res.error!); break; }
          const d = res.data as { description: string; mapUrl: string };
          console.log(`\n  ${d.description}`);
          break;
        }

        case 'message': {
          if (!argStr) { warn('Usage: message <content>'); break; }
          const res = await api.messageLeave(argStr);
          if (!res.success) { error(res.error!); break; }
          success('📝 Message left!');
          break;
        }

        case 'explore': {
          const res = await api.explore();
          if (!res.success) { error(res.error!); break; }
          const data = res.data as { event?: RandomEvent; npc?: NPCEncounter; weather: Weather | null };
          if (data.weather) info(`🌤️ ${data.weather.description}`);
          if (data.event) {
            console.log(formatBox(`⚡ ${data.event.title}`, [
              data.event.description,
              data.event.moneyChange !== 0 ? `💰 ${data.event.moneyChange > 0 ? '+' : ''}$${data.event.moneyChange}` : '',
            ].filter(Boolean).join('\n')));
          }
          if (data.npc) {
            console.log(formatBox(`🧑 ${data.npc.npc.name}`, [
              `"${data.npc.npc.greeting}"`,
              `💬 ${data.npc.dialogue}`,
              `📋 ${data.npc.outcome}`,
            ].join('\n')));
          }
          if (!data.event && !data.npc) info('A quiet stroll. Nothing unusual.');
          break;
        }

        case 'rest': {
          const res = await api.rest();
          if (!res.success) { error(res.error!); break; }
          success('😴 Rested.');
          break;
        }

        case 'eat': {
          const res = await api.eat();
          if (!res.success) { error(res.error!); break; }
          success('🍖 Ate local food!');
          break;
        }

        case 'shop': {
          const res = await api.shopList();
          if (!res.success) { error(res.error!); break; }
          const items = res.data as ShopItem[];
          console.log(formatTable(
            ['ID', 'Name', 'Price'],
            items.map(i => [i.id, i.name, `$${i.price}`])
          ));
          break;
        }

        case 'buy': {
          if (!argStr) { warn('Usage: buy <itemId>'); break; }
          const res = await api.shopBuy(argStr);
          if (!res.success) { error(res.error!); break; }
          success(`Bought ${argStr}!`);
          break;
        }

        case 'backpack': {
          const res = await api.backpack();
          if (!res.success) { error(res.error!); break; }
          const bp = res.data as BackpackSlot[];
          if (bp.length === 0) { info('Backpack is empty.'); break; }
          console.log(formatTable(
            ['Item', 'Qty'],
            bp.map(s => [s.item.name, s.quantity.toString()])
          ));
          break;
        }

        case 'use': {
          if (!argStr) { warn('Usage: use <itemId>'); break; }
          const res = await api.backpackUse(argStr);
          if (!res.success) { error(res.error!); break; }
          success((res.data as any).message);
          break;
        }

        case 'garden': {
          const res = await api.garden();
          if (!res.success) { error(res.error!); break; }
          const g = res.data as Garden;
          info(`🌿 Clovers: ${g.clovers} | 🍀 Four-leaf: ${g.fourLeafClovers} | Rate: ${g.growthRate}/hr`);
          break;
        }

        case 'harvest': {
          const res = await api.gardenHarvest();
          if (!res.success) { error(res.error!); break; }
          const g = res.data as Garden;
          success(`🌿 Harvested! Clovers: ${g.clovers} | 🍀: ${g.fourLeafClovers}`);
          break;
        }

        case 'friends': {
          const res = await api.friends();
          if (!res.success) { error(res.error!); break; }
          const fl = res.data as Friend[];
          if (fl.length === 0) { info('No friends yet.'); break; }
          console.log(formatTable(
            ['Name', 'Type', 'Friendship', 'Visits'],
            fl.map(f => [f.name, f.type, `${f.friendship}/100`, f.visitCount.toString()])
          ));
          break;
        }

        case 'visitors': {
          const res = await api.friendsCheck();
          if (!res.success) { error(res.error!); break; }
          const event = res.data as VisitorEvent | null;
          if (!event) { info('No visitors right now.'); break; }
          success(`🐾 ${event.message}`);
          if (event.gift) info(`Gift: ${event.gift}`);
          if (event.cloverReward) info(`+${event.cloverReward} 🍀`);
          break;
        }

        case 'weather': {
          const res = await api.weather();
          if (!res.success) { error(res.error!); break; }
          const w = res.data as Weather;
          info(`🌤️ ${w.type}: ${w.description}`);
          break;
        }

        case 'quest': {
          if (argStr === 'new') {
            const res = await api.questsGenerate();
            if (!res.success) { error(res.error!); break; }
            const q = res.data as Quest;
            success(`📋 New quest: "${q.title}" — ${q.description}`);
            break;
          }
          const res = await api.quests();
          if (!res.success) { error(res.error!); break; }
          const quests = res.data as Quest[];
          if (quests.length === 0) { info('No active quests. Type "quest new"!'); break; }
          quests.forEach(q => {
            const pct = Math.floor((q.currentCount / q.targetCount) * 100);
            info(`📋 ${q.title}: ${q.currentCount}/${q.targetCount} (${pct}%) — $${q.reward.money}+${q.reward.experience}XP`);
          });
          break;
        }

        case 'npc': {
          const res = await api.npcEncounter();
          if (!res.success) { error(res.error!); break; }
          const enc = res.data as NPCEncounter;
          if (!enc) { info('No NPCs around.'); break; }
          console.log(formatBox(`🧑 ${enc.npc.name}`, [
            `"${enc.npc.greeting}"`,
            `💬 ${enc.dialogue}`,
            `📋 ${enc.outcome}`,
          ].join('\n')));
          break;
        }

        case 'lottery': {
          const res = await api.lotteryPlay();
          if (!res.success) { error(res.error!); break; }
          const r = res.data as LotteryResult;
          console.log(formatBox('🎰 Lottery!', `${r.prize.toUpperCase()}: ${r.reward} (+$${r.moneyWon})`));
          break;
        }

        case 'titles': {
          const res = await api.titles();
          if (!res.success) { error(res.error!); break; }
          const tl = res.data as Title[];
          if (tl.length === 0) { info('No titles yet.'); break; }
          tl.forEach(t => info(`🏆 ${t.name} — ${t.description}`));
          break;
        }

        case 'home': {
          const res = await api.homeActivity(argStr || undefined);
          if (!res.success) { error(res.error!); break; }
          const e = res.data as HomeEvent;
          console.log(`\n  🏠 ${e.description}`);
          break;
        }

        case 'album': {
          const res = await api.albumStats();
          if (!res.success) { error(res.error!); break; }
          const s = res.data as any;
          info(`📚 Photos: ${s.photos} | Souvenirs: ${s.souvenirs} | Cities: ${s.cities}/${s.totalCities} | ${s.completionPct}%`);
          break;
        }

        case 'history': {
          const res = await api.statusHistory();
          if (!res.success) { error(res.error!); break; }
          const hist = res.data as any[];
          if (hist.length === 0) { info('No travel history.'); break; }
          console.log(formatTable(
            ['Location', 'City', 'Date'],
            hist.slice(0, 10).map(h => [h.location.name, h.location.city, new Date(h.arrivedAt).toLocaleDateString()])
          ));
          break;
        }

        default:
          warn(`Unknown command: ${cmd}. Type "help" for available commands.`);
      }
    } catch (err: any) {
      error(err.message || 'Command failed');
    }

    // Show status line after each command
    try {
      console.log(await getStatusLine(api));
    } catch { /* ignore */ }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}
