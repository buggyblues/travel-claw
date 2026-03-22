import type { MapProvider } from '../../shared/types';

/**
 * Map adapter interface - implements the Adapter pattern
 * to allow switching between different map providers.
 */
export type { MapProvider };

export class MapAdapterManager {
  private adapters: Map<string, MapProvider> = new Map();
  private currentProvider: string;

  constructor(defaultProvider: string) {
    this.currentProvider = defaultProvider;
  }

  register(adapter: MapProvider): void {
    this.adapters.set(adapter.name, adapter);
  }

  setProvider(name: string): void {
    if (!this.adapters.has(name)) {
      throw new Error(`Map provider '${name}' is not registered. Available: ${Array.from(this.adapters.keys()).join(', ')}`);
    }
    this.currentProvider = name;
  }

  getProvider(): MapProvider {
    const adapter = this.adapters.get(this.currentProvider);
    if (!adapter) {
      throw new Error(`No map provider registered with name '${this.currentProvider}'`);
    }
    return adapter;
  }

  listProviders(): string[] {
    return Array.from(this.adapters.keys());
  }
}
