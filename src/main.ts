import { Plugin } from 'obsidian';
import { ProviderManager } from './models/ProviderManager';
import { ModelRegistry } from './models/ModelRegistry';
import type { LLMConnectorAPI } from './api';
import type { LLMConnectorSettings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import type {
	CompletionOptions,
	CompletionResult,
	StreamOptions,
	ModelCriteria,
	ModelFilter,
	Model,
	Provider,
} from './types';

export default class LLMConnectorPlugin extends Plugin {
	settings: LLMConnectorSettings;
	public api: LLMConnectorAPI;
	private providerManager: ProviderManager;
	private modelRegistry: ModelRegistry;

	async onload(): Promise<void> {
		console.debug('Loading LLM Connector Plugin');

		// Initialize managers
		this.providerManager = new ProviderManager();
		this.modelRegistry = new ModelRegistry();

		// Load settings
		await this.loadSettings();

		// Load provider configurations into manager
		this.providerManager.loadConfigs(this.settings.providers);

		// Register providers (will be done in next task)
		// TODO: Register Ollama provider
		// TODO: Register OpenRouter provider

		// Load models from providers
		await this.refreshModels();

		// Expose public API
		this.api = this.createAPI();

		// Add settings tab
		// TODO: Create and add settings tab

		console.debug('LLM Connector Plugin loaded successfully');
	}

	onunload(): void {
		console.debug('Unloading LLM Connector Plugin');
	}

	/**
	 * Load settings from storage
	 */
	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<LLMConnectorSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	/**
	 * Save settings to storage
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Refresh models from all providers
	 */
	async refreshModels(): Promise<void> {
		try {
			const models = await this.providerManager.getAllModels();
			this.modelRegistry.updateModels(models);
			console.debug(`Loaded ${models.length} models from providers`);

			// Set default model if configured
			if (this.settings.defaultModel) {
				this.modelRegistry.setDefault(this.settings.defaultModel);
			}
		} catch (error: unknown) {
			console.error('Error refreshing models:', error);
		}
	}

	/**
	 * Create the public API for other plugins
	 */
	private createAPI(): LLMConnectorAPI {
		return {
			version: '0.1.0',

			complete: async (options: CompletionOptions): Promise<CompletionResult> => {
				// Validate options
				if (!options.prompt) {
					throw new Error('Prompt is required');
				}

				// Resolve model
				const model = options.model
					? this.modelRegistry.getByNameOrTag(options.model)
					: this.modelRegistry.getDefault();

				if (!model) {
					throw new Error(
						options.model
							? `Model not found: ${options.model}`
							: 'No default model configured'
					);
				}

				// Get provider
				const provider = this.providerManager.getProvider(
					options.provider ?? model.provider
				);

				if (!provider) {
					throw new Error(`Provider not found: ${model.provider}`);
				}

				if (!provider.isConfigured()) {
					throw new Error(`Provider ${model.provider} is not configured`);
				}

				// Execute completion
				return await provider.complete({
					...options,
					model: model.id,
				});
			},

			stream: async function* (this: LLMConnectorPlugin, options: StreamOptions): AsyncGenerator<string, void, unknown> {
				// Resolve model
				const model = options.model
					? this.modelRegistry.getByNameOrTag(options.model)
					: this.modelRegistry.getDefault();

				if (!model) {
					throw new Error(
						options.model
							? `Model not found: ${options.model}`
							: 'No default model configured'
					);
				}

				// Get provider
				const provider = this.providerManager.getProvider(
					options.provider ?? model.provider
				);

				if (!provider) {
					throw new Error(`Provider not found: ${model.provider}`);
				}

				// Execute streaming
				yield* provider.stream({
					...options,
					model: model.id,
				});
			}.bind(this),

			getModel: (criteria: ModelCriteria): Model | null => {
				return this.modelRegistry.find(criteria);
			},

			listModels: (filter?: ModelFilter): Model[] => {
				return this.modelRegistry.list(filter);
			},

			getProviders: async (): Promise<Provider[]> => {
				return await this.providerManager.list();
			},

			getActiveProvider: async (): Promise<Provider | null> => {
				const provider = this.providerManager.getActive();
				if (!provider) {
					return null;
				}

				const providers = await this.providerManager.list();
				return providers.find(p => p.id === provider.id) ?? null;
			},

			isReady: (): boolean => {
				return this.providerManager.getActive() !== null;
			},
		};
	}
}
