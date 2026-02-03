import type { ProviderConfig } from './types';

/**
 * Plugin settings interface
 */
export interface LLMConnectorSettings {
	// Provider configurations
	providers: Record<string, ProviderConfig>;
	
	// Global preferences
	defaultProvider: string | null;
	defaultModel: string | null;
	
	// Fallback chain - try these providers in order if primary fails
	fallbackChain: string[];
	
	// Usage limits
	enableCostWarnings: boolean;
	monthlyCostLimit: number;  // in USD
	
	// Rate limiting
	enableRateLimiting: boolean;
	requestsPerMinute: number;
	
	// Timeouts
	defaultTimeout: number;  // in milliseconds
	maxRetries: number;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: LLMConnectorSettings = {
	providers: {},
	defaultProvider: null,
	defaultModel: null,
	fallbackChain: [],
	enableCostWarnings: true,
	monthlyCostLimit: 10.0,
	enableRateLimiting: false,
	requestsPerMinute: 60,
	defaultTimeout: 30000,  // 30 seconds
	maxRetries: 3,
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
