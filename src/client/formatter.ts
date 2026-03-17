import { Character, CharacterStats } from '../shared/types';

// ANSI color helpers (no dependency on chalk for formatting functions)
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';

function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

export function formatBar(value: number, max: number, width = 20): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  const color = value > 60 ? GREEN : value > 30 ? YELLOW : RED;
  return `${color}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET} ${value}/${max}`;
}

export function formatStats(stats: CharacterStats): string {
  return [
    `  ❤️  Health:     ${formatBar(stats.health, 100)}`,
    `  😊 Mood:       ${formatBar(stats.mood, 100)}`,
    `  😴 Fatigue:    ${formatBar(stats.fatigue, 100)}`,
    `  🍖 Hunger:     ${formatBar(stats.hunger, 100)}`,
    `  💰 Money:      ${colorize(`$${stats.money}`, YELLOW)}`,
    `  ⭐ Experience: ${colorize(stats.experience.toString(), CYAN)}`,
  ].join('\n');
}

export function formatCharacter(character: Character): string {
  const loc = character.currentLocation;
  return [
    '',
    `${BOLD}🦞 ${colorize(character.name, MAGENTA)}${RESET}`,
    `${DIM}─────────────────────────────────${RESET}`,
    formatStats(character.stats),
    `${DIM}─────────────────────────────────${RESET}`,
    `  📍 Location:   ${colorize(loc.name, BLUE)}`,
    `  🏙️  City:       ${loc.city}, ${loc.country}`,
    `  🌐 Coords:     ${loc.coordinates.lat.toFixed(4)}, ${loc.coordinates.lng.toFixed(4)}`,
    '',
  ].join('\n');
}

export function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] || '').length))
  );

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join(' │ ');
  const separator = colWidths.map(w => '─'.repeat(w)).join('─┼─');
  const dataLines = rows.map(row =>
    row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' │ ')
  );

  return [headerLine, separator, ...dataLines].join('\n');
}

export function formatBox(title: string, content: string): string {
  const lines = content.split('\n');
  const maxLen = Math.max(title.length + 4, ...lines.map(l => stripAnsi(l).length + 4));
  const top = `╭${'─'.repeat(maxLen)}╮`;
  const titleLine = `│ ${BOLD}${title}${RESET}${' '.repeat(maxLen - title.length - 2)} │`;
  const sep = `├${'─'.repeat(maxLen)}┤`;
  const body = lines.map(l => `│ ${l}${' '.repeat(Math.max(0, maxLen - stripAnsi(l).length - 2))} │`);
  const bottom = `╰${'─'.repeat(maxLen)}╯`;
  return [top, titleLine, sep, ...body, bottom].join('\n');
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function success(msg: string): void {
  console.log(colorize(`✓ ${msg}`, GREEN));
}

export function error(msg: string): void {
  console.error(colorize(`✗ ${msg}`, RED));
}

export function info(msg: string): void {
  console.log(colorize(`ℹ ${msg}`, BLUE));
}

export function warn(msg: string): void {
  console.log(colorize(`⚠ ${msg}`, YELLOW));
}
