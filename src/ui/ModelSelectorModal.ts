import { App, FuzzySuggestModal } from 'obsidian';
import type { Model, PerformanceTier } from '../types';

/**
 * Provider display name mapping
 */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
	'ollama': 'Ollama',
	'openrouter': 'OpenRouter',
	'openai': 'OpenAI',
	'anthropic': 'Anthropic',
};

/**
 * Get display name for provider
 */
export function getProviderDisplayName(providerId: string): string {
	return PROVIDER_DISPLAY_NAMES[providerId] ?? providerId.charAt(0).toUpperCase() + providerId.slice(1);
}

/**
 * Model option for the selector
 */
interface ModelOption {
	model: Model;
	displayName: string;
	value: string;  // "provider:modelId"
	isNotConfigured?: boolean;
}

/**
 * Searchable modal for selecting a model for a tier assignment
 */
export class ModelSelectorModal extends FuzzySuggestModal<ModelOption> {
	private availableModels: Model[];
	private tier: PerformanceTier;
	private onSelect: (value: string) => void;

	constructor(
		app: App,
		availableModels: Model[],
		tier: PerformanceTier,
		onSelect: (value: string) => void
	) {
		super(app);
		this.availableModels = availableModels;
		this.tier = tier;
		this.onSelect = onSelect;

		// Configure modal appearance
		this.setPlaceholder('Search for a model...');
		this.emptyStateText = 'No models found';
		this.limit = 50;  // Show up to 50 results at once
	}

	/**
	 * Get all items to search through
	 */
	getItems(): ModelOption[] {
		const items: ModelOption[] = [];

		// Add "Not configured" option at the top
		items.push({
			model: {} as Model,  // Placeholder
			displayName: 'Not configured',
			value: '',
			isNotConfigured: true,
		});

		// Filter models based on tier (embedding vs non-embedding)
		const filteredModels = this.availableModels.filter(model => {
			const isEmbedding = model.tags.includes('embedding');
			if (this.tier === 'embedding') {
				return isEmbedding;
			} else {
				return !isEmbedding;
			}
		});

		// Group models by provider for better organization
		const modelsByProvider = new Map<string, Model[]>();
		for (const model of filteredModels) {
			if (!modelsByProvider.has(model.provider)) {
				modelsByProvider.set(model.provider, []);
			}
			modelsByProvider.get(model.provider)?.push(model);
		}

		// Add models grouped by provider
		for (const [providerName, models] of modelsByProvider.entries()) {
			// Sort models by name within each provider
			models.sort((a, b) => a.name.localeCompare(b.name));

			for (const model of models) {
				const providerDisplay = getProviderDisplayName(providerName);
				items.push({
					model,
					displayName: `${providerDisplay}: ${model.name}`,
					value: `${providerName}:${model.id}`,
				});
			}
		}

		return items;
	}

	/**
	 * Get text representation for fuzzy search
	 */
	getItemText(item: ModelOption): string {
		if (item.isNotConfigured) {
			return 'Not configured';
		}
		// Return the display name for rendering
		return item.displayName;
	}

	/**
	 * Render each suggestion item
	 */
	onChooseItem(item: ModelOption, _evt: MouseEvent | KeyboardEvent): void {
		this.onSelect(item.value);
	}
}
