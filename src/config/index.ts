import defaultConfig from './default.json';
import productionConfig from './production.json';

interface Config {
  openai_api_key: string;
}

class AppConfig {
  private config: Config;

  constructor() {
    // Use production config if available, otherwise fallback to default
    const isDevelopment = __DEV__;
    this.config = isDevelopment ? defaultConfig : productionConfig;
  }

  get<T = string>(key: string): T {
    return (this.config as any)[key] as T;
  }
}

const appConfig = new AppConfig();

export default appConfig;
