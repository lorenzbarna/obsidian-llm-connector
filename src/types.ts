// Core type definitions for LLM Connector

/**
 * Performance tier for model selection
 * - fast: Quick responses, lower quality
 * - balanced: DEFAULT, best for most tasks
 * - advanced: Maximum quality, slower
 * - thinking: Complex reasoning tasks
 * - code: Code generation/review
 * - embedding: Vector embeddings (no fallback)
 */
export type PerformanceTier = 'fast' | 'balanced' | 'advanced' | 'thinking' | 'code' | 'embedding';

/**
 * Completion request options
 */
export interface CompletionOptions {
	prompt: string;
	tier?: PerformanceTier;  // Performance tier (preferred over model)
	model?: string;  // Specific model name (overrides tier)
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
 * Reason for tier fallback
 */
export type FallbackReason = 'tier_not_configured' | 'provider_error' | 'rate_limit' | 'timeout' | 'model_unavailable';

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
	// Tier fallback metadata
	requestedTier?: PerformanceTier;
	actualTier?: PerformanceTier;
	fallbackOccurred?: boolean;
	fallbackReason?: FallbackReason;
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

/**
 * Model assignment for a tier
 */
export interface ModelAssignment {
	provider: string;
	model: string;
}

/**
 * Tier configuration with optional model assignment
 */
export interface TierConfig {
	tier: PerformanceTier;
	assignment?: ModelAssignment;  // undefined = not configured
}

/**
 * Fallback notification preference
 */
export type NotificationMode = 'console' | 'notice' | 'both' | 'none';

/**
 * Settings for the LLM Connector plugin
 */
export interface LLMConnectorSettings {
	// Provider configurations
	providers: Record<string, ProviderConfig>;
	
	// Tier assignments
	tiers: {
		fast?: ModelAssignment;
		balanced?: ModelAssignment;
		advanced?: ModelAssignment;
		thinking?: ModelAssignment;
		code?: ModelAssignment;
		embedding?: ModelAssignment;
	};
	
	// Default tier when none specified
	defaultTier: PerformanceTier;
	
	// Fallback notification preferences
	fallbackNotification: NotificationMode;
	
	// Show once-per-session notifications
	showOncePerSession: boolean;
}
