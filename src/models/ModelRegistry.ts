import type { Model, ModelCriteria, ModelFilter } from '../types';

/**
 * Manages model registry and selection
 * Handles model tagging, filtering, and smart selection
 */
export class ModelRegistry {
	private models: Model[] = [];
	private defaultModelId: string | null = null;

	/**
	 * Update the registry with models from providers
	 * @param models Array of models to register
	 */
	updateModels(models: Model[]): void {
		this.models = models;
	}

	/**
	 * Add models to the registry
	 * @param models Models to add
	 */
	addModels(models: Model[]): void {
		this.models.push(...models);
	}

	/**
	 * Clear all models
	 */
	clear(): void {
		this.models = [];
	}

	/**
	 * Find a model by criteria
	 * @param criteria Search criteria
	 * @returns First matching model or null
	 */
	find(criteria: ModelCriteria): Model | null {
		for (const model of this.models) {
			if (this.matchesCriteria(model, criteria)) {
				return model;
			}
		}
		return null;
	}

	/**
	 * List models matching filter
	 * @param filter Optional filter
	 * @returns Array of matching models
	 */
	list(filter?: ModelFilter): Model[] {
		if (!filter) {
			return [...this.models];
		}

		return this.models.filter(model => {
			if (filter.provider && model.provider !== filter.provider) {
				return false;
			}
			if (filter.tag && !model.tags.includes(filter.tag)) {
				return false;
			}
			// available filter not implemented yet - would check provider status
			return true;
		});
	}

	/**
	 * Get model by exact ID or name, or by tag
	 * @param nameOrTag Model ID, name, or tag
	 * @returns Model or null
	 */
	getByNameOrTag(nameOrTag: string): Model | null {
		// Try exact ID match first
		let model = this.models.find(m => m.id === nameOrTag);
		if (model) {
			return model;
		}

		// Try name match
		model = this.models.find(m => m.name === nameOrTag);
		if (model) {
			return model;
		}

		// Try tag match
		const tag = nameOrTag as ModelCriteria['tag'];
		return this.find({ tag });
	}

	/**
	 * Get the default model
	 * @returns Default model or first available model
	 */
	getDefault(): Model | null {
		if (this.defaultModelId) {
			const model = this.models.find(m => m.id === this.defaultModelId);
			if (model) {
				return model;
			}
		}

		// Fallback to first available model
		return this.models[0] ?? null;
	}

	/**
	 * Set the default model
	 * @param modelId Model ID
	 */
	setDefault(modelId: string): void {
		this.defaultModelId = modelId;
	}

	/**
	 * Get all models from a specific provider
	 * @param providerId Provider ID
	 * @returns Array of models
	 */
	getByProvider(providerId: string): Model[] {
		return this.models.filter(m => m.provider === providerId);
	}

	/**
	 * Check if a model matches criteria
	 * @param model Model to check
	 * @param criteria Criteria to match
	 * @returns True if model matches
	 */
	private matchesCriteria(model: Model, criteria: ModelCriteria): boolean {
		if (criteria.tag && !model.tags.includes(criteria.tag)) {
			return false;
		}

		if (criteria.provider && model.provider !== criteria.provider) {
			return false;
		}

		if (criteria.capability) {
			const hasAllCapabilities = criteria.capability.every(cap =>
				model.capabilities.includes(cap)
			);
			if (!hasAllCapabilities) {
				return false;
			}
		}

		if (criteria.minContextWindow !== undefined) {
			if (!model.contextWindow || model.contextWindow < criteria.minContextWindow) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get count of registered models
	 * @returns Number of models
	 */
	get count(): number {
		return this.models.length;
	}
}
