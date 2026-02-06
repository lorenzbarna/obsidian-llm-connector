import type {
	CompletionOptions,
	CompletionResult,
	StreamOptions,
	Model,
	ModelCriteria,
	ModelFilter,
	Provider,
} from './types';

/**
 * Public API exposed to other Obsidian plugins
 * This is the interface other plugins will use to access LLM functionality
 * 
 * Usage in consumer plugins:
 * ```typescript
 * const llm = this.app.plugins.plugins['llm-connector']?.api;
 * if (llm) {
 *   const result = await llm.complete({ prompt: "...", model: "smart" });
 * }
 * ```
 */
export interface LLMConnectorAPI {
	/**
	 * API version (semantic versioning)
	 */
	version: string;

	/**
	 * Generate a text completion
	 * 
	 * @example
	 * ```typescript
	 * const result = await api.complete({
	 *   prompt: "Explain quantum computing",
	 *   model: "smart",  // or specific model name
	 *   systemPrompt: "You are a helpful assistant",
	 *   temperature: 0.7
	 * });
	 * console.log(result.text);
	 * ```
	 */
	complete(options: CompletionOptions): Promise<CompletionResult>;

	/**
	 * Stream a text completion (Phase 2 feature)
	 * 
	 * @example
	 * ```typescript
	 * const stream = api.stream({
	 *   prompt: "Write a story",
	 *   model: "smart",
	 *   onChunk: (text) => console.log(text)
	 * });
	 * 
	 * for await (const chunk of stream) {
	 *   // Process each chunk
	 * }
	 * ```
	 */
	stream(options: StreamOptions): AsyncGenerator<string, void, unknown>;

	/**
	 * Find a model matching criteria
	 * 
	 * @example
	 * ```typescript
	 * const fastModel = api.getModel({ tag: "fast" });
	 * const smartModel = api.getModel({ tag: "smart" });
	 * ```
	 */
	getModel(criteria: ModelCriteria): Model | null;

	/**
	 * List all available models, optionally filtered
	 * 
	 * @example
	 * ```typescript
	 * const allModels = api.listModels();
	 * const ollamaModels = api.listModels({ provider: "ollama" });
	 * const fastModels = api.listModels({ tag: "fast" });
	 * ```
	 */
	listModels(filter?: ModelFilter): Model[];

	/**
	 * Get all registered providers
	 * 
	 * @example
	 * ```typescript
	 * const providers = api.getProviders();
	 * providers.forEach(p => {
	 *   console.log(`${p.name}: ${p.status}`);
	 * });
	 * ```
	 */
	getProviders(): Promise<Provider[]>;

	/**
	 * Get the currently active provider
	 * 
	 * @returns Active provider or null if none configured
	 */
	getActiveProvider(): Promise<Provider | null>;

	/**
	 * Check if LLM Connector is ready to use
	 * 
	 * @returns True if at least one provider is configured and enabled
	 */
	isReady(): boolean;
}
