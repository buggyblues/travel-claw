import fs from 'fs';
import path from 'path';

const CONFIG_DIR = process.env.CLAW_CONFIG_PATH
  ? path.dirname(process.env.CLAW_CONFIG_PATH)
  : path.join(process.env.HOME || '~', '.travel-claw');
const CONFIG_FILE = process.env.CLAW_CONFIG_PATH
  || path.join(CONFIG_DIR, 'config.json');

interface Config {
  authKey?: string;
  serverUrl?: string;
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getAuthKey(): string | undefined {
  return loadConfig().authKey;
}

export function setAuthKey(key: string): void {
  const config = loadConfig();
  config.authKey = key;
  saveConfig(config);
}

export function getServerUrl(): string {
  return loadConfig().serverUrl || process.env.CLAW_SERVER_URL || 'https://shadowob.com/event/travel-claw/api';
}
