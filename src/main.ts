import { Plugin, Notice } from 'obsidian';
import { ProviderManager } from './models/ProviderManager';
import { ModelRegistry } from './models/ModelRegistry';
import { TierResolver } from './models/TierResolver';
import { NotificationManager } from './utils/NotificationManager';
import { OllamaProvider } from './providers/OllamaProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { LLMConnectorSettingTab } from './ui/LLMConnectorSettingTab';
import type { LLMConnectorAPI } from './api';
import type { LLMConnectorSettings } from './settings';
import { DEFAULT_SETTINGS, DEFAULT_PROVIDER_CONFIGS } from './settings';
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
	private tierResolver: TierResolver;
	private notificationManager: NotificationManager;

	async onload(): Promise<void> {
		console.debug('Loading LLM Connector Plugin');

		// Load settings
		await this.loadSettings();

		// Initialize managers
		this.providerManager = new ProviderManager();
		this.modelRegistry = new ModelRegistry();
		this.tierResolver = new TierResolver(this.settings);
		this.notificationManager = new NotificationManager(
			this.settings.fallbackNotification,
			this.settings.showOncePerSession
		);

		// Load provider configurations into manager
		this.providerManager.loadConfigs(this.settings.providers);

		// Register providers
		this.registerProviders();

		// Load models from cache immediately (synchronous, instant startup)
		if (this.settings.modelCache && this.settings.modelCache.models.length > 0) {
			this.modelRegistry.updateModels(this.settings.modelCache.models);
			console.debug(`Loaded ${this.settings.modelCache.models.length} models from cache`);
		}

		// Expose public API
		this.api = this.createAPI();

		// Add settings tab
		this.addSettingTab(new LLMConnectorSettingTab(this.app, this));

		console.debug('LLM Connector Plugin loaded successfully');

		// Refresh models from providers in background (non-blocking)
		this.refreshModelsWithTimeout(5000).catch(() => {
			// Error already handled inside refreshModelsWithTimeout
		});
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
		
		// Update managers with new settings
		this.tierResolver.updateSettings(this.settings);
		this.notificationManager.updatePreferences(
			this.settings.fallbackNotification,
			this.settings.showOncePerSession
		);
	}

	/**
	 * Refresh models from all providers with timeout (for background refresh)
	 */
	async refreshModelsWithTimeout(timeoutMs: number): Promise<void> {
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('Network timeout')), timeoutMs);
		});

		try {
			await Promise.race([this.refreshModels(), timeoutPromise]);
			// Success - models refreshed from providers
		} catch (error: unknown) {
			// Get list of enabled providers that couldn't be reached
			const enabledProviders: string[] = [];
			for (const [id, config] of Object.entries(this.settings.providers)) {
				if (config.enabled) {
					enabledProviders.push(id.charAt(0).toUpperCase() + id.slice(1));
				}
			}

			// Check if we already loaded from cache at startup
			const hasModels = this.modelRegistry.list().length > 0;
			
			if (hasModels) {
				// Already using cache, just show info about offline status
				console.debug('Using cached models - providers unreachable');
				if (enabledProviders.length > 0) {
					new Notice(`Offline: ${enabledProviders.join(', ')} unreachable. Using cached models.`, 6000);
				}
			} else {
				// No cache available at all
				console.error('Failed to load models from providers:', error);
				if (enabledProviders.length > 0) {
					new Notice(`Offline: ${enabledProviders.join(', ')} unavailable. No cached models.`, 8000);
				} else {
					new Notice('No internet connection. Providers unavailable.', 6000);
				}
			}
		}
	}

	/**
	 * Refresh models from all providers
	 */
	async refreshModels(): Promise<void> {
		try {
			const models = await this.providerManager.getAllModels();
			this.modelRegistry.updateModels(models);
			console.debug(`Loaded ${models.length} models from providers`);
			
			// Cache models for offline use
			this.settings.modelCache = {
				models,
				timestamp: Date.now(),
			};
			await this.saveSettings();
		} catch (error: unknown) {
			console.error('Error refreshing models:', error);
			throw error;
		}
	}

	/**
	 * Register provider instances with the provider manager
	 * Exposed as public for settings UI to refresh providers
	 */
	registerProviders(): void {
		// Initialize Ollama provider config if not present
		if (!this.settings.providers['ollama']) {
			const defaultConfig = DEFAULT_PROVIDER_CONFIGS['ollama'];
			if (defaultConfig) {
				this.settings.providers['ollama'] = {
					id: 'ollama',
					enabled: false,
					baseUrl: defaultConfig.baseUrl ?? 'http://localhost:11434',
					timeout: defaultConfig.timeout ?? 30000,
					maxRetries: defaultConfig.maxRetries ?? 3,
				};
			}
		}

		// Initialize OpenRouter provider config if not present
		if (!this.settings.providers['openrouter']) {
			const defaultConfig = DEFAULT_PROVIDER_CONFIGS['openrouter'];
			if (defaultConfig) {
				this.settings.providers['openrouter'] = {
					id: 'openrouter',
					enabled: false,
					baseUrl: defaultConfig.baseUrl ?? 'https://openrouter.ai/api/v1',
					timeout: defaultConfig.timeout ?? 30000,
					maxRetries: defaultConfig.maxRetries ?? 3,
				};
			}
		}

		// Initialize OpenAI provider config if not present
		if (!this.settings.providers['openai']) {
			const defaultConfig = DEFAULT_PROVIDER_CONFIGS['openai'];
			if (defaultConfig) {
				this.settings.providers['openai'] = {
					id: 'openai',
					enabled: false,
					baseUrl: defaultConfig.baseUrl ?? 'https://api.openai.com/v1',
					timeout: defaultConfig.timeout ?? 30000,
					maxRetries: defaultConfig.maxRetries ?? 3,
				};
			}
		}

		// Initialize Anthropic provider config if not present
		if (!this.settings.providers['anthropic']) {
			const defaultConfig = DEFAULT_PROVIDER_CONFIGS['anthropic'];
			if (defaultConfig) {
				this.settings.providers['anthropic'] = {
					id: 'anthropic',
					enabled: false,
					baseUrl: defaultConfig.baseUrl ?? 'https://api.anthropic.com/v1',
					timeout: defaultConfig.timeout ?? 30000,
					maxRetries: defaultConfig.maxRetries ?? 3,
				};
			}
		}

		// Register Ollama provider
		const ollamaConfig = this.settings.providers['ollama'];
		if (ollamaConfig) {
			const ollamaProvider = new OllamaProvider(ollamaConfig);
			this.providerManager.register(ollamaProvider);
			console.debug('Registered Ollama provider');
		}

		// Register OpenRouter provider
		const openrouterConfig = this.settings.providers['openrouter'];
		if (openrouterConfig) {
			const openrouterProvider = new OpenRouterProvider(openrouterConfig);
			this.providerManager.register(openrouterProvider);
			console.debug('Registered OpenRouter provider');
		}

		// Register OpenAI provider
		const openaiConfig = this.settings.providers['openai'];
		if (openaiConfig) {
			const openaiProvider = new OpenAIProvider(openaiConfig);
			this.providerManager.register(openaiProvider);
			console.debug('Registered OpenAI provider');
		}

		// Register Anthropic provider
		const anthropicConfig = this.settings.providers['anthropic'];
		if (anthropicConfig) {
			const anthropicProvider = new AnthropicProvider(anthropicConfig);
			this.providerManager.register(anthropicProvider);
			console.debug('Registered Anthropic provider');
		}
	}

	/**
	 * Create the public API for other plugins
	 */
	private createAPI(): LLMConnectorAPI {
		return {
			version: '1.0.0',

			complete: async (options: CompletionOptions): Promise<CompletionResult> => {
				// Validate options
				if (!options.prompt) {
					throw new Error('Prompt is required');
				}

				// Determine which model to use
				let modelToUse: Model | null = null;
				let tierResolution = null;

				// Priority: explicit model > tier > default tier
				if (options.model) {
					// Explicit model specified
					modelToUse = this.modelRegistry.getByNameOrTag(options.model);
					if (!modelToUse) {
						throw new Error(`Model not found: ${options.model}`);
					}
				} else {
					// Use tier system
					const tier = options.tier ?? this.settings.defaultTier;
					
					try {
						tierResolution = this.tierResolver.resolve(tier);
						const { provider, model } = tierResolution.assignment;
						
						// Find the model in the registry
						const models = this.modelRegistry.list({ provider });
						modelToUse = models.find(m => m.id === model) ?? null;
						
						if (!modelToUse) {
							throw new Error(
								`Model "${model}" from provider "${provider}" not found. ` +
								`Is the provider connected?`
							);
						}

						// Notify if fallback occurred
						if (tierResolution.fallbackOccurred && tierResolution.fallbackReason) {
							this.notificationManager.notifyFallback(
								tierResolution.requestedTier,
								tierResolution.tier,
								tierResolution.fallbackReason
							);
						}
					} catch (error: unknown) {
						if (error instanceof Error) {
							throw new Error(
								`Tier resolution failed: ${error.message}. ` +
								`Please configure tiers in LLM Connector settings.`
							);
						}
						throw error;
					}
				}

				// Get provider
				const provider = this.providerManager.getProvider(
					options.provider ?? modelToUse.provider
				);

				if (!provider) {
					throw new Error(`Provider not found: ${modelToUse.provider}`);
				}

				if (!provider.isConfigured()) {
					throw new Error(`Provider ${modelToUse.provider} is not configured`);
				}

				// Execute completion
				try {
					const result = await provider.complete({
						...options,
						model: modelToUse.id,
					});

					// Add tier metadata if tier was used
					if (tierResolution) {
						result.requestedTier = tierResolution.requestedTier;
						result.actualTier = tierResolution.tier;
						result.fallbackOccurred = tierResolution.fallbackOccurred;
						result.fallbackReason = tierResolution.fallbackReason;
					}

					return result;
				} catch (error: unknown) {
					// Provider error - could trigger fallback in future
					if (error instanceof Error) {
						this.notificationManager.notifyProviderError(
							modelToUse.provider,
							modelToUse.id,
							error.message
						);
					}
					throw error;
				}
			},

			stream: async function* (this: LLMConnectorPlugin, options: StreamOptions): AsyncGenerator<string, void, unknown> {
				// Determine which model to use (same logic as complete)
				let modelToUse: Model | null = null;

				if (options.model) {
					modelToUse = this.modelRegistry.getByNameOrTag(options.model);
					if (!modelToUse) {
						throw new Error(`Model not found: ${options.model}`);
					}
				} else {
					const tier = options.tier ?? this.settings.defaultTier;
					const tierResolution = this.tierResolver.resolve(tier);
					const { provider, model } = tierResolution.assignment;
					
					const models = this.modelRegistry.list({ provider });
					modelToUse = models.find(m => m.id === model) ?? null;
					
					if (!modelToUse) {
						throw new Error(
							`Model "${model}" from provider "${provider}" not found`
						);
					}

					if (tierResolution.fallbackOccurred && tierResolution.fallbackReason) {
						this.notificationManager.notifyFallback(
							tierResolution.requestedTier,
							tierResolution.tier,
							tierResolution.fallbackReason
						);
					}
				}

				// Get provider
				const provider = this.providerManager.getProvider(
					options.provider ?? modelToUse.provider
				);

				if (!provider) {
					throw new Error(`Provider not found: ${modelToUse.provider}`);
				}

				// Execute streaming
				yield* provider.stream({
					...options,
					model: modelToUse.id,
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
