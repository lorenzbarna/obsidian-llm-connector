import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type LLMConnectorPlugin from '../main';
import type { PerformanceTier, NotificationMode } from '../types';
import { ModelSelectorModal, getProviderDisplayName } from './ModelSelectorModal';

/**
 * Settings tab for LLM Connector plugin
 */
export class LLMConnectorSettingTab extends PluginSettingTab {
	plugin: LLMConnectorPlugin;

	constructor(app: App, plugin: LLMConnectorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Provider Configuration Section
		this.displayProviderSection(containerEl);

		// Tier Assignment Section
		this.displayTierSection(containerEl);

		// Fallback Preferences Section
		this.displayFallbackSection(containerEl);
	}

	/**
	 * Provider Configuration Section
	 */
	private displayProviderSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Provider configuration')
			.setHeading();

		// Add "Refresh All Providers" button at the top
		new Setting(containerEl)
			.setName('Refresh all providers')
			.setDesc('Reload models from all enabled providers')
			.addButton(button => button
				.setButtonText('Refresh all')
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('Refreshing...');

					try {
						// Re-register all providers with current configs
						this.plugin['providerManager']?.loadConfigs(this.plugin.settings.providers);
						this.plugin.registerProviders();

						// Refresh models
						await this.plugin.refreshModels();

						const modelCount = this.plugin.api.listModels().length;
						new Notice(`Refreshed all providers. Found ${modelCount} models total.`);

						// Refresh display
						this.display();
					} catch (error: unknown) {
						if (error instanceof Error) {
							new Notice(`Error refreshing providers: ${error.message}`);
						} else {
							new Notice('Unknown error occurred while refreshing');
						}
					} finally {
						button.setDisabled(false);
						button.setButtonText('Refresh all');
					}
				}));

		// Ollama Provider
		this.displayProvider(containerEl, {
			id: 'ollama',
			name: 'Ollama',
			description: 'Local or remote Ollama server',
			fields: [
				{
					type: 'text',
					key: 'baseUrl',
					name: 'Base URL',
					placeholder: 'http://localhost:11434',
				},
			],
		});

		// OpenRouter Provider
		this.displayProvider(containerEl, {
			id: 'openrouter',
			name: 'OpenRouter',
			description: 'Cloud AI models via OpenRouter',
			fields: [
				{
					type: 'password',
					key: 'apiKey',
					name: 'API key',
					placeholder: 'sk-or-...',
				},
				{
					type: 'text',
					key: 'baseUrl',
					name: 'Base URL',
					placeholder: 'https://openrouter.ai/api/v1',
				},
			],
		});

		// OpenAI Provider
		this.displayProvider(containerEl, {
			id: 'openai',
			name: 'OpenAI',
			description: 'GPT models from OpenAI',
			fields: [
				{
					type: 'password',
					key: 'apiKey',
					name: 'API key',
					placeholder: 'sk-...',
				},
				{
					type: 'text',
					key: 'baseUrl',
					name: 'Base URL',
					placeholder: 'https://api.openai.com/v1',
				},
			],
		});

		// Anthropic Provider
		this.displayProvider(containerEl, {
			id: 'anthropic',
			name: 'Anthropic',
			description: 'Claude models from Anthropic',
			fields: [
				{
					type: 'password',
					key: 'apiKey',
					name: 'API key',
					placeholder: 'sk-ant-...',
				},
				{
					type: 'text',
					key: 'baseUrl',
					name: 'Base URL',
					placeholder: 'https://api.anthropic.com/v1',
				},
			],
		});
	}

	/**
	 * Display a single provider with collapsible settings
	 */
	private displayProvider(
		containerEl: HTMLElement,
		config: {
			id: string;
			name: string;
			description: string;
			fields: Array<{
				type: 'text' | 'password';
				key: string;
				name: string;
				placeholder: string;
			}>;
		}
	): void {
		const providerConfig = this.plugin.settings.providers[config.id];
		const isEnabled = providerConfig?.enabled ?? false;

		// Get connection status
		const modelCount = this.plugin.api.listModels({ provider: config.id }).length;
		const isConnected = isEnabled && modelCount > 0;

		// Create provider group (uses native setting items with separators)
		const providerGroup = containerEl.createDiv({ cls: 'llm-provider-group' });

		// Main toggle setting with status indicator
		const toggleSetting = new Setting(providerGroup)
			.setName(config.name)
			.setDesc(config.description)
			.addToggle(toggle => toggle
				.setValue(isEnabled)
				.onChange(async (value) => {
					// Initialize or update provider config
					if (!this.plugin.settings.providers[config.id]) {
						this.plugin.settings.providers[config.id] = {
							id: config.id,
							enabled: value,
							timeout: 30000,
							maxRetries: 3,
						};
					} else {
						const provider = this.plugin.settings.providers[config.id];
						if (provider) {
							provider.enabled = value;
						}
					}
					await this.plugin.saveSettings();

					// Update provider manager configs
					this.plugin['providerManager']?.loadConfigs(this.plugin.settings.providers);

					// Re-register providers with updated config
					this.plugin.registerProviders();

					// Refresh models from all enabled providers
					await this.plugin.refreshModels();

					// Refresh display to show/hide settings
					this.display();

					new Notice(`${config.name} ${value ? 'enabled' : 'disabled'}`);
				}));

		// Add success indicator to toggle line if connected
		if (isConnected) {
			const statusSpan = toggleSetting.nameEl.createSpan({
				text: ' ✓',
				cls: 'llm-provider-status-success',
			});
			statusSpan.setCssProps({
				color: 'var(--text-success)',
				marginLeft: '8px',
			});
		}

		// Only show additional settings if enabled
		if (isEnabled) {
			// Render configuration fields
			for (const field of config.fields) {
				const fieldValue = providerConfig ? ((providerConfig as unknown as Record<string, string>)[field.key] ?? '') : '';

				new Setting(providerGroup)
					.setName(field.name)
					.addText(text => {
						if (field.type === 'password') {
							text.inputEl.type = 'password';
						}
						text
							.setPlaceholder(field.placeholder)
							.setValue(fieldValue)
							.onChange(async (value) => {
								if (!this.plugin.settings.providers[config.id]) {
									this.plugin.settings.providers[config.id] = {
										id: config.id,
										enabled: false,
										timeout: 30000,
										maxRetries: 3,
									};
								}
								(this.plugin.settings.providers[config.id] as unknown as Record<string, string>)[field.key] = value;
								await this.plugin.saveSettings();

								// Update provider manager config
								this.plugin['providerManager']?.loadConfigs(this.plugin.settings.providers);
							});
					});
			}

			// Action buttons (Test connection + Reload models)
			const actionsSetting = new Setting(providerGroup)
				.setName('Actions')
				.addButton(button => button
					.setButtonText('Test connection')
					.onClick(async () => {
						button.setDisabled(true);
						button.setButtonText('Testing...');

						// Clear previous status
						const existingStatus = actionsSetting.descEl.querySelector('.llm-connection-status');
						if (existingStatus) {
							existingStatus.remove();
						}

						try {
							const provider = this.plugin['providerManager']?.getProvider(config.id);
							if (!provider) {
								throw new Error(`${config.name} provider not registered`);
							}

							const result = await provider.connect();

							// Create inline status element
							const statusEl = actionsSetting.descEl.createDiv({ cls: 'llm-connection-status' });

							if (result.success) {
								statusEl.setText(`✓ Connected: ${result.models?.length ?? 0} models loaded`);
								statusEl.setCssProps({ color: 'var(--text-success)' });

								// Refresh models
								await this.plugin.refreshModels();

								// Refresh display to update tier dropdowns and status indicator
								this.display();
							} else {
								statusEl.setText(`❌ Failed to connect: ${result.message ?? 'Unknown error'}`);
								statusEl.setCssProps({ color: 'var(--text-error)' });
							}
						} catch (error: unknown) {
							const statusEl = actionsSetting.descEl.createDiv({ cls: 'llm-connection-status' });
							if (error instanceof Error) {
								statusEl.setText(`❌ error: ${error.message}`);
							} else {
								statusEl.setText('❌ unknown error');
							}
							statusEl.setCssProps({ color: 'var(--text-error)' });
						} finally {
							button.setDisabled(false);
							button.setButtonText('Test connection');
						}
					}))
				.addButton(button => button
					.setButtonText('Reload models')
					.onClick(async () => {
						button.setDisabled(true);
						button.setButtonText('Reloading...');

						// Clear previous status
						const existingStatus = actionsSetting.descEl.querySelector('.llm-connection-status');
						if (existingStatus) {
							existingStatus.remove();
						}

						try {
							// Re-register provider with current config
							this.plugin['providerManager']?.loadConfigs(this.plugin.settings.providers);
							this.plugin.registerProviders();

							// Refresh models
							await this.plugin.refreshModels();

							const modelCount = this.plugin.api.listModels({ provider: config.id }).length;
							
							// Create inline status element
							const statusEl = actionsSetting.descEl.createDiv({ cls: 'llm-connection-status' });
							statusEl.setText(`✓ Reloaded: ${modelCount} models found`);
							statusEl.setCssProps({ color: 'var(--text-success)' });

							// Refresh display
							this.display();
						} catch (error: unknown) {
							const statusEl = actionsSetting.descEl.createDiv({ cls: 'llm-connection-status' });
							if (error instanceof Error) {
								statusEl.setText(`❌ error reloading: ${error.message}`);
							} else {
								statusEl.setText('❌ unknown error');
							}
							statusEl.setCssProps({ color: 'var(--text-error)' });
						} finally {
							button.setDisabled(false);
							button.setButtonText('Reload models');
						}
					}));
		}
	}

	/**
	 * Tier Assignment Section
	 */
	private displayTierSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Performance tiers')
			.setHeading();

		containerEl.createEl('p', {
			text: 'Assign models to performance tiers. Plugins request tiers, and you control which models are used.',
			cls: 'setting-item-description',
		});

		// Get available models from ENABLED providers only
		const availableModels = this.plugin.api.listModels();

		// Group models by provider
		const modelsByProvider = new Map<string, typeof availableModels>();
		for (const model of availableModels) {
			if (!modelsByProvider.has(model.provider)) {
				modelsByProvider.set(model.provider, []);
			}
			modelsByProvider.get(model.provider)?.push(model);
		}

		// Tier definitions with descriptions
		const tierDefs: Array<{
			tier: PerformanceTier;
			name: string;
			desc: string;
			fallback?: string;
		}> = [
			{
				tier: 'fast',
				name: 'Fast tier',
				desc: 'Quick responses for simple tasks (autocomplete, titles, formatting)',
			},
			{
				tier: 'balanced',
				name: 'Balanced tier (default)',
				desc: 'Best for most tasks - good quality and speed (summarization, Q&A)',
			},
			{
				tier: 'advanced',
				name: 'Advanced tier',
				desc: 'Maximum quality for important tasks (analysis, long-form content)',
			},
			{
				tier: 'thinking',
				name: 'Thinking tier',
				desc: 'Complex reasoning with step-by-step logic (problem-solving, debugging)',
				fallback: 'Falls back to: advanced → balanced → fast',
			},
			{
				tier: 'code',
				name: 'Code tier',
				desc: 'Code generation, review, and analysis (programming tasks)',
				fallback: 'Falls back to: advanced → balanced → fast',
			},
			{
				tier: 'embedding',
				name: 'Embedding tier',
				desc: 'Vector embeddings for semantic search (similarity, RAG systems)',
				fallback: 'No fallback - will error if not configured',
			},
		];

		// Create searchable selector for each tier
		for (const tierDef of tierDefs) {
			const currentAssignment = this.plugin.settings.tiers[tierDef.tier];

			// Determine button text
			let buttonText = 'Not configured';
			
			if (currentAssignment) {
				// Check if model still exists in enabled providers
				const modelStillExists = availableModels.find(
					m => m.provider === currentAssignment.provider && m.id === currentAssignment.model
				);
				
				if (modelStillExists) {
					// Model is available - show with new format
					const providerDisplay = getProviderDisplayName(currentAssignment.provider);
					buttonText = `${providerDisplay}: ${modelStillExists.name}`;
				} else {
					// Model not available (provider likely disabled) - persist assignment but show warning
					const providerDisplay = getProviderDisplayName(currentAssignment.provider);
					buttonText = `${providerDisplay}: ${currentAssignment.model}`;
				}
			}

			const setting = new Setting(containerEl)
				.setName(tierDef.name)
				.setDesc(tierDef.desc)
				.addButton(button => button
					.setButtonText(buttonText)
					.setClass('llm-tier-selector-button')
					.onClick(() => {
						// Open searchable modal (only shows models from ENABLED providers)
						const modal = new ModelSelectorModal(
							this.app,
							availableModels,
							tierDef.tier,
							(value: string) => {
								if (value === '') {
									// Unassign tier
									this.plugin.settings.tiers[tierDef.tier] = undefined;
								} else {
									// Parse provider:model
									const parts = value.split(':');
									const provider = parts[0];
									const modelParts = parts.slice(1);
									const model = modelParts.join(':'); // Handle model IDs with colons

									if (!provider || !model) {
										console.error('Invalid tier assignment format:', value);
										return;
									}

									this.plugin.settings.tiers[tierDef.tier] = {
										provider,
										model,
									};
								}

								void this.plugin.saveSettings();

								// Refresh display to update button text and status indicators
								this.display();
							}
						);
						modal.open();
					}));

			// Add fallback info if applicable
			if (tierDef.fallback) {
				const fallbackDesc = setting.descEl.createDiv();
				fallbackDesc.setText(tierDef.fallback);
				fallbackDesc.addClass('setting-item-description');
			}

			// Add status indicator
			const statusDesc = setting.descEl.createDiv();
			statusDesc.addClass('setting-item-description');

			// Determine status message and style
			if (currentAssignment) {
				// Check if the assigned provider is enabled
				const providerConfig = this.plugin.settings.providers[currentAssignment.provider];
				const isProviderEnabled = providerConfig?.enabled ?? false;

				if (!isProviderEnabled) {
					// Provider exists in assignment but is disabled - show as unconfigured
					statusDesc.setText('Not configured - will fall back');
					statusDesc.setCssProps({ color: 'var(--text-error)' });
				} else {
					// Provider is enabled - check if model is reachable
					const modelStillExists = availableModels.find(
						m => m.provider === currentAssignment.provider && m.id === currentAssignment.model
					);

					if (modelStillExists) {
						// Model is available and configured (green)
						statusDesc.setText(`✓ Configured: ${currentAssignment.model}`);
						statusDesc.setCssProps({ color: 'var(--text-success)' });
					} else {
						// Provider enabled but unreachable (yellow/orange)
						statusDesc.setText(`⚠ provider unreachable - will fall back`);
						statusDesc.setCssProps({ color: 'var(--text-warning)' });
					}
				}
			} else if (tierDef.tier === 'embedding') {
				// Embedding tier not configured - will error (red)
				statusDesc.setText('Not configured - will error if requested');
				statusDesc.setCssProps({ color: 'var(--text-error)' });
			} else {
				// Other tiers not configured - will fall back (red)
				statusDesc.setText('Not configured - will fall back');
				statusDesc.setCssProps({ color: 'var(--text-error)' });
			}
		}

		// Warning if no models available
		if (availableModels.length === 0) {
			const warning = new Setting(containerEl)
				.setName('No models available')
				.setDesc('Enable a provider above and test connection to fetch models.');
			warning.settingEl.addClass('mod-warning');
		}
	}

	/**
	 * Fallback Preferences Section
	 */
	private displayFallbackSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Fallback preferences')
			.setHeading();

		// Default Tier
		new Setting(containerEl)
			.setName('Default tier')
			.setDesc('Tier to use when a plugin doesn\'t specify one')
			.addDropdown(dropdown => dropdown
				.addOption('fast', 'Fast')
				.addOption('balanced', 'Balanced (recommended)')
				.addOption('advanced', 'Advanced')
				.setValue(this.plugin.settings.defaultTier)
				.onChange(async (value) => {
					this.plugin.settings.defaultTier = value as PerformanceTier;
					await this.plugin.saveSettings();
				}));

		// Fallback Notification Mode
		new Setting(containerEl)
			.setName('Fallback notifications')
			.setDesc('How to notify when a tier fallback occurs')
			.addDropdown(dropdown => dropdown
				.addOption('none', 'None (silent)')
				.addOption('console', 'Console warnings only')
				.addOption('notice', 'Obsidian notices only')
				.addOption('both', 'Both console and notices')
				.setValue(this.plugin.settings.fallbackNotification)
				.onChange(async (value) => {
					this.plugin.settings.fallbackNotification = value as NotificationMode;
					await this.plugin.saveSettings();
				}));

		// Show Once Per Session
		new Setting(containerEl)
			.setName('Show once per session')
			.setDesc('Only show fallback notices once per session (avoid spam)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showOncePerSession)
				.onChange(async (value) => {
					this.plugin.settings.showOncePerSession = value;
					await this.plugin.saveSettings();
				}));
	}
}
