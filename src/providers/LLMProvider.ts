import type {
	CompletionOptions,
	CompletionResult,
	StreamOptions,
	Model,
	ConnectionResult,
	ProviderConfig,
} from '../types';

/**
 * Abstract base class for LLM providers
 * All provider adapters (Ollama, OpenRouter, etc.) must extend this
 */
export abstract class LLMProvider {
	protected config: ProviderConfig;

	constructor(config: ProviderConfig) {
		this.config = config;
	}

	/**
	 * Unique identifier for this provider
	 */
	abstract get id(): string;

	/**
	 * Human-readable name for this provider
	 */
	abstract get name(): string;

	/**
	 * Test connection to the provider
	 * @returns Connection result with available models if successful
	 */
	abstract connect(): Promise<ConnectionResult>;

	/**
	 * List all available models from this provider
	 * @returns Array of models
	 */
	abstract listModels(): Promise<Model[]>;

	/**
	 * Generate a text completion
	 * @param options Completion options
	 * @returns Completion result with text and metadata
	 */
	abstract complete(options: CompletionOptions): Promise<CompletionResult>;

	/**
	 * Stream a text completion (optional, Phase 2)
	 * @param options Stream options including callbacks
	 * @returns Async generator yielding text chunks
	 */
	// Default implementation throws error - providers can override
	// eslint-disable-next-line require-yield -- Base class throws error, concrete implementations will use yield
	async *stream(_options: StreamOptions): AsyncGenerator<string, void, unknown> {
		throw new Error(`Streaming not supported by ${this.name}`);
	}

	/**
	 * Generate embeddings for text (optional, Phase 3)
	 * @param text Text to embed
	 * @returns Embedding vector
	 */
	embeddings(text: string): Promise<number[]> {
		// Default implementation throws error - providers can override
		throw new Error(`Embeddings not supported by ${this.name}`);
	}

	/**
	 * Update provider configuration
	 * @param config New configuration
	 */
	updateConfig(config: Partial<ProviderConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration (without sensitive data)
	 */
	getConfig(): Omit<ProviderConfig, 'apiKey'> {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- apiKey destructured to exclude from return value
		const { apiKey, ...safeConfig } = this.config;
		return safeConfig;
	}

	/**
	 * Check if provider is configured with required settings
	 */
	isConfigured(): boolean {
		return this.config.enabled && this.validateConfig();
	}

	/**
	 * Validate provider configuration
	 * Override this to add provider-specific validation
	 */
	protected validateConfig(): boolean {
		// Base validation - providers can override for specific requirements
		return true;
	}
}
