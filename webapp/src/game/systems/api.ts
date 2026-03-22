import type { ApiResponse, Character, GameState } from './types';

const API_BASE = window.location.origin;
const AUTH_KEY_STORAGE = 'travel-claw.web.authKey';

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json() as ApiResponse<T>;
    return json.success ? json.data : null;
  } catch (error) {
    console.warn('[webapp] request failed', path, error);
    return null;
  }
}

async function requestWithAuth<T>(path: string, init?: RequestInit): Promise<T | null> {
  const authKey = api.getAuthKey();
  if (!authKey) {
    console.warn('[webapp] missing auth key for', path);
    return null;
  }
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-key': authKey,
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json() as ApiResponse<T>;
    return json.success ? json.data : null;
  } catch (error) {
    console.warn('[webapp] auth request failed', path, error);
    return null;
  }
}

export const api = {
  getAuthKey(): string {
    return localStorage.getItem(AUTH_KEY_STORAGE) ?? '';
  },
  setAuthKey(value: string): void {
    if (!value) {
      localStorage.removeItem(AUTH_KEY_STORAGE);
      return;
    }
    localStorage.setItem(AUTH_KEY_STORAGE, value);
  },
  getCharacters(): Promise<Character[] | null> {
    return request<Character[]>('/api/characters');
  },
  getCharacterState(id: string): Promise<GameState | null> {
    return request<GameState>(`/api/characters/${id}`);
  },
  getHealth(): Promise<{ status: string; version: string } | null> {
    return request<{ status: string; version: string }>('/api/health');
  },
  register(name: string): Promise<{ authKey: string; character: Character } | null> {
    return request<{ authKey: string; character: Character }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  },
  getMyState(): Promise<GameState | null> {
    return requestWithAuth<GameState>('/api/status/full');
  },
  planTravel(destination: string): Promise<unknown> {
    return requestWithAuth('/api/travel/plan', { method: 'POST', body: JSON.stringify({ destination }) });
  },
  startTravel(): Promise<unknown> {
    return requestWithAuth('/api/travel/start', { method: 'POST' });
  },
  explore(): Promise<unknown> {
    return requestWithAuth('/api/explore', { method: 'POST' });
  },
  takePhoto(): Promise<unknown> {
    return requestWithAuth('/api/photo/take', { method: 'POST', body: JSON.stringify({}) });
  },
  writePoem(): Promise<unknown> {
    return requestWithAuth('/api/poetry/write', { method: 'POST' });
  },
  interact(): Promise<unknown> {
    return requestWithAuth('/api/interact', { method: 'POST' });
  },
  rest(): Promise<unknown> {
    return requestWithAuth('/api/rest', { method: 'POST' });
  },
  eat(): Promise<unknown> {
    return requestWithAuth('/api/eat', { method: 'POST' });
  },
  generateQuest(): Promise<unknown> {
    return requestWithAuth('/api/quests/generate', { method: 'POST' });
  },
  encounterNpc(): Promise<unknown> {
    return requestWithAuth('/api/npc/encounter', { method: 'POST' });
  },
  harvestGarden(): Promise<unknown> {
    return requestWithAuth('/api/garden/harvest', { method: 'POST' });
  },
  leaveMessage(content: string): Promise<unknown> {
    return requestWithAuth('/api/message/leave', { method: 'POST', body: JSON.stringify({ content }) });
  },
};
