export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface UserSettings {
  user: User;
  ai_config?: AIConfig;
}

export interface AIConfig {
  id: number;
  provider: 'openai' | 'anthropic' | 'custom';
  api_key?: string;
  api_base_url?: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  is_default: boolean;
}