import { Notice } from 'obsidian';
import type { LLMProvider } from '../providers/LLMProvider';
import type { Provider, ProviderConfig, Model, ConnectionResult } from '../types';

/**
 * Manages all LLM providers
 * Handles registration, configuration, and lifecycle
 */
export class ProviderManager {
	private providers: Map<string, LLMProvider> = new Map();
	private configs: Map<string, ProviderConfig> = new Map();

	/**
	 * Register a provider
	 * @param provider Provider instance to register
	 */
	register(provider: LLMProvider): void {
		const id = provider.id;
		if (this.providers.has(id)) {
			console.warn(`Provider ${id} is already registered, replacing`);
		}
		this.providers.set(id, provider);
		console.debug(`Registered provider: ${provider.name} (${id})`);
	}

	/**
	 * Unregister a provider
	 * @param id Provider ID
	 */
	unregister(id: string): boolean {
		const removed = this.providers.delete(id);
		if (removed) {
			console.debug(`Unregistered provider: ${id}`);
		}
		return removed;
	}

	/**
	 * Get a provider by ID
	 * @param id Provider ID
	 * @returns Provider instance or undefined
	 */
	getProvider(id: string): LLMProvider | undefined {
		return this.providers.get(id);
	}

	/**
	 * Get all registered providers
	 * @returns Array of provider instances
	 */
	getAllProviders(): LLMProvider[] {
		return Array.from(this.providers.values());
	}

	/**
	 * Get provider information (for UI)
	 * @returns Array of provider info
	 */
	async list(): Promise<Provider[]> {
		const providerList: Provider[] = [];

		for (const provider of this.providers.values()) {
			const config = this.configs.get(provider.id);
			const configured = provider.isConfigured();
			
			let status: Provider['status'] = 'unconfigured';
			let statusMessage: string | undefined;

			if (configured && config?.enabled) {
				try {
					const result = await provider.connect();
					status = result.success ? 'connected' : 'error';
					statusMessage = result.message;
				} catch (error: unknown) {
					status = 'error';
					if (error instanceof Error) {
						statusMessage = error.message;
					}
				}
			} else if (!config?.enabled) {
				status = 'disconnected';
			}

			providerList.push({
				id: provider.id,
				name: provider.name,
				enabled: config?.enabled ?? false,
				configured,
				status,
				statusMessage,
			});
		}

		return providerList;
	}

	/**
	 * Get the first enabled and configured provider
	 * @returns Active provider or null
	 */
	getActive(): LLMProvider | null {
		for (const provider of this.providers.values()) {
			const config = this.configs.get(provider.id);
			if (config?.enabled && provider.isConfigured()) {
				return provider;
			}
		}
		return null;
	}

	/**
	 * Update provider configuration
	 * @param id Provider ID
	 * @param config New configuration
	 */
	updateConfig(id: string, config: ProviderConfig): void {
		this.configs.set(id, config);
		const provider = this.providers.get(id);
		if (provider) {
			provider.updateConfig(config);
		}
	}

	/**
	 * Get provider configuration
	 * @param id Provider ID
	 * @returns Configuration or undefined
	 */
	getConfig(id: string): ProviderConfig | undefined {
		return this.configs.get(id);
	}

	/**
	 * Load configurations from settings
	 * @param configs Map of provider configs
	 */
	loadConfigs(configs: Record<string, ProviderConfig>): void {
		for (const [id, config] of Object.entries(configs)) {
			this.configs.set(id, config);
			const provider = this.providers.get(id);
			if (provider) {
				provider.updateConfig(config);
			}
		}
	}

	/**
	 * Get all configurations for saving
	 * @returns Record of provider configs
	 */
	getConfigs(): Record<string, ProviderConfig> {
		const configs: Record<string, ProviderConfig> = {};
		for (const [id, config] of this.configs.entries()) {
			configs[id] = config;
		}
		return configs;
	}

	/**
	 * Test connection to a provider
	 * @param id Provider ID
	 * @returns Connection result
	 */
	async testConnection(id: string): Promise<ConnectionResult> {
		const provider = this.providers.get(id);
		if (!provider) {
			return {
				success: false,
				message: `Provider ${id} not found`,
			};
		}

		if (!provider.isConfigured()) {
			return {
				success: false,
				message: 'Provider not configured',
			};
		}

		try {
			const result = await provider.connect();
			if (result.success) {
				new Notice(`Connected to ${provider.name}`);
			} else {
				new Notice(`Failed to connect to ${provider.name}: ${result.message}`);
			}
			return result;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error connecting to ${provider.name}: ${message}`);
			return {
				success: false,
				message,
			};
		}
	}

	/**
	 * Get all models from all enabled providers
	 * @returns Array of all available models
	 */
	async getAllModels(): Promise<Model[]> {
		const allModels: Model[] = [];

		for (const provider of this.providers.values()) {
			const config = this.configs.get(provider.id);
			if (config?.enabled && provider.isConfigured()) {
				try {
					const models = await provider.listModels();
					allModels.push(...models);
				} catch (error: unknown) {
					console.error(`Error listing models from ${provider.name}:`, error);
				}
			}
		}

		return allModels;
	}
}
