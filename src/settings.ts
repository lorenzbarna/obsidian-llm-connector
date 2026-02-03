import type { LLMConnectorSettings, ProviderConfig } from './types';

// Re-export for convenience
export type { LLMConnectorSettings };

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: LLMConnectorSettings = {
	providers: {},
	tiers: {
		// All tiers start unconfigured
		fast: undefined,
		balanced: undefined,
		advanced: undefined,
		thinking: undefined,
		code: undefined,
		embedding: undefined,
	},
	defaultTier: 'balanced',
	fallbackNotification: 'console',
	showOncePerSession: true,
};

/**
 * Default provider configurations
 */
export const DEFAULT_PROVIDER_CONFIGS: Record<string, Partial<ProviderConfig>> = {
	ollama: {
		id: 'ollama',
		enabled: false,
		baseUrl: 'http://localhost:11434',
		timeout: 30000,
		maxRetries: 3,
	},
	openrouter: {
		id: 'openrouter',
		enabled: false,
		baseUrl: 'https://openrouter.ai/api/v1',
		timeout: 30000,
		maxRetries: 3,
	},
	openai: {
		id: 'openai',
		enabled: false,
		baseUrl: 'https://api.openai.com/v1',
		timeout: 30000,
		maxRetries: 3,
	},
	anthropic: {
		id: 'anthropic',
		enabled: false,
		baseUrl: 'https://api.anthropic.com/v1',
		timeout: 30000,
		maxRetries: 3,
	},
};
