// Core type definitions for LLM Connector

/**
 * Completion request options
 */
export interface CompletionOptions {
	prompt: string;
	model?: string;  // Model name or tag like "fast", "smart"
	provider?: string;  // Specific provider to use
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	stop?: string[];
}

/**
 * Completion result with metadata
 */
export interface CompletionResult {
	text: string;
	model: string;
	provider: string;
	tokens: {
		prompt: number;
		completion: number;
		total: number;
	};
	finishReason?: 'stop' | 'length' | 'error';
}

/**
 * Streaming completion options
 */
export interface StreamOptions extends CompletionOptions {
	onChunk?: (text: string) => void;
	onComplete?: (result: CompletionResult) => void;
	onError?: (error: Error) => void;
}

/**
 * Model capability tags
 */
export type ModelTag = 'fast' | 'smart' | 'multimodal' | 'embedding' | 'code' | 'chat';

/**
 * Model information
 */
export interface Model {
	id: string;  // e.g., "llama3.2:3b", "gpt-4o"
	name: string;  // Display name
	provider: string;  // Provider ID
	tags: ModelTag[];
	capabilities: string[];
	contextWindow?: number;
	maxTokens?: number;
	costPerToken?: {
		prompt: number;
		completion: number;
	};
}

/**
 * Criteria for finding models
 */
export interface ModelCriteria {
	tag?: ModelTag;
	provider?: string;
	capability?: string[];
	minContextWindow?: number;
}

/**
 * Filter for listing models
 */
export interface ModelFilter {
	provider?: string;
	available?: boolean;
	tag?: ModelTag;
}

/**
 * Provider status
 */
export type ProviderStatus = 'connected' | 'disconnected' | 'error' | 'unconfigured';

/**
 * Provider information
 */
export interface Provider {
	id: string;  // e.g., "ollama", "openrouter"
	name: string;  // Display name
	enabled: boolean;
	configured: boolean;
	status: ProviderStatus;
	statusMessage?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
	id: string;
	enabled: boolean;
	apiKey?: string;
	baseUrl?: string;
	defaultModel?: string;
	timeout?: number;
	maxRetries?: number;
}

/**
 * Connection test result
 */
export interface ConnectionResult {
	success: boolean;
	message?: string;
	models?: Model[];
}
