import type { IAnalysisPlugin } from '../types/flow';

class PluginRegistry {
  private plugins: Map<string, IAnalysisPlugin> = new Map();

  register(plugin: IAnalysisPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): IAnalysisPlugin | undefined {
    return this.plugins.get(id);
  }

  getByType(type: string): IAnalysisPlugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.type === type);
  }

  getAll(): IAnalysisPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
