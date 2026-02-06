import type {
	PerformanceTier,
	ModelAssignment,
	LLMConnectorSettings,
	FallbackReason,
} from '../types';

/**
 * Result of tier resolution
 */
export interface TierResolution {
	assignment: ModelAssignment;
	tier: PerformanceTier;
	fallbackOccurred: boolean;
	fallbackReason?: FallbackReason;
	requestedTier: PerformanceTier;
}

/**
 * Fallback chain definitions
 * Embedding has NO fallback - incompatible with chat models
 */
const FALLBACK_CHAINS: Record<PerformanceTier, PerformanceTier[]> = {
	fast: ['fast', 'balanced', 'advanced'],
	balanced: ['balanced', 'advanced', 'fast'],
	advanced: ['advanced', 'balanced', 'fast'],
	thinking: ['thinking', 'advanced', 'balanced', 'fast'],
	code: ['code', 'advanced', 'balanced', 'fast'],
	embedding: ['embedding'],  // NO FALLBACK
};

/**
 * Resolves performance tiers to model assignments with automatic fallback
 */
export class TierResolver {
	constructor(private settings: LLMConnectorSettings) {}

	/**
	 * Resolve a tier to a model assignment, with fallback if needed
	 * @throws Error if no fallback is available (e.g., embedding tier not configured)
	 */
	resolve(tier: PerformanceTier): TierResolution {
		const chain = FALLBACK_CHAINS[tier];
		
		if (!chain || chain.length === 0) {
			throw new Error(`Invalid tier: ${tier}`);
		}

		// Try each tier in the fallback chain
		for (let i = 0; i < chain.length; i++) {
			const currentTier = chain[i];
			if (!currentTier) {
				continue; // Skip undefined array elements (shouldn't happen, but strict mode)
			}
			
			const assignment = this.settings.tiers[currentTier];

			if (assignment) {
				// Found a configured tier
				return {
					assignment,
					tier: currentTier,
					fallbackOccurred: i > 0,
					fallbackReason: i > 0 ? 'tier_not_configured' : undefined,
					requestedTier: tier,
				};
			}
		}

		// No tier in the chain is configured
		throw new Error(
			`No model configured for tier "${tier}" or any fallback tier. ` +
			`Please configure at least one of: ${chain.join(', ')}`
		);
	}

	/**
	 * Check if a specific tier is configured
	 */
	isTierConfigured(tier: PerformanceTier): boolean {
		return this.settings.tiers[tier] !== undefined;
	}

	/**
	 * Get the fallback chain for a tier
	 */
	getFallbackChain(tier: PerformanceTier): PerformanceTier[] {
		return FALLBACK_CHAINS[tier] ?? [];
	}

	/**
	 * Get all configured tiers
	 */
	getConfiguredTiers(): PerformanceTier[] {
		const tiers: PerformanceTier[] = [];
		const tierKeys: PerformanceTier[] = ['fast', 'balanced', 'advanced', 'thinking', 'code', 'embedding'];
		
		for (const tier of tierKeys) {
			if (this.settings.tiers[tier]) {
				tiers.push(tier);
			}
		}
		
		return tiers;
	}

	/**
	 * Get all unconfigured tiers
	 */
	getUnconfiguredTiers(): PerformanceTier[] {
		const tiers: PerformanceTier[] = [];
		const tierKeys: PerformanceTier[] = ['fast', 'balanced', 'advanced', 'thinking', 'code', 'embedding'];
		
		for (const tier of tierKeys) {
			if (!this.settings.tiers[tier]) {
				tiers.push(tier);
			}
		}
		
		return tiers;
	}

	/**
	 * Update the settings reference (e.g., after settings reload)
	 */
	updateSettings(settings: LLMConnectorSettings): void {
		this.settings = settings;
	}
}
