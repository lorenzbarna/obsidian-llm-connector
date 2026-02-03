import { Notice } from 'obsidian';
import type { NotificationMode, PerformanceTier, FallbackReason } from '../types';

/**
 * Manages fallback notifications with once-per-session tracking
 */
export class NotificationManager {
	private notifiedFallbacks: Set<string> = new Set();
	
	constructor(
		private mode: NotificationMode,
		private oncePerSession: boolean
	) {}

	/**
	 * Notify about a tier fallback
	 */
	notifyFallback(
		requestedTier: PerformanceTier,
		actualTier: PerformanceTier,
		reason: FallbackReason
	): void {
		// Generate a unique key for this fallback scenario
		const key = `${requestedTier}->${actualTier}:${reason}`;
		
		// Check if we should skip (once-per-session)
		if (this.oncePerSession && this.notifiedFallbacks.has(key)) {
			return;
		}

		// Mark as notified
		this.notifiedFallbacks.add(key);

		// Format the message
		const message = this.formatFallbackMessage(requestedTier, actualTier, reason);

		// Send notification based on mode
		switch (this.mode) {
			case 'console':
				console.warn('[LLM Connector]', message);
				break;
			case 'notice':
				new Notice(message, 5000);
				break;
			case 'both':
				console.warn('[LLM Connector]', message);
				new Notice(message, 5000);
				break;
			case 'none':
				// Silent
				break;
		}
	}

	/**
	 * Notify about a provider error
	 */
	notifyProviderError(
		provider: string,
		model: string,
		error: string
	): void {
		const key = `provider-error:${provider}:${model}`;
		
		if (this.oncePerSession && this.notifiedFallbacks.has(key)) {
			return;
		}

		this.notifiedFallbacks.add(key);
		
		const message = `Provider error: ${provider}/${model} - ${error}`;

		switch (this.mode) {
			case 'console':
				console.error('[LLM Connector]', message);
				break;
			case 'notice':
				new Notice(`LLM Connector: ${message}`, 5000);
				break;
			case 'both':
				console.error('[LLM Connector]', message);
				new Notice(`LLM Connector: ${message}`, 5000);
				break;
			case 'none':
				// Silent
				break;
		}
	}

	/**
	 * Format a fallback message
	 */
	private formatFallbackMessage(
		requestedTier: PerformanceTier,
		actualTier: PerformanceTier,
		reason: FallbackReason
	): string {
		const reasonText = this.formatFallbackReason(reason);
		return `Tier fallback: "${requestedTier}" → "${actualTier}" (${reasonText})`;
	}

	/**
	 * Format a fallback reason for display
	 */
	private formatFallbackReason(reason: FallbackReason): string {
		switch (reason) {
			case 'tier_not_configured':
				return 'tier not configured';
			case 'provider_error':
				return 'provider error';
			case 'rate_limit':
				return 'rate limited';
			case 'timeout':
				return 'timeout';
			case 'model_unavailable':
				return 'model unavailable';
			default:
				return 'unknown reason';
		}
	}

	/**
	 * Clear the notification cache (e.g., when settings change)
	 */
	clearCache(): void {
		this.notifiedFallbacks.clear();
	}

	/**
	 * Update notification preferences
	 */
	updatePreferences(mode: NotificationMode, oncePerSession: boolean): void {
		this.mode = mode;
		this.oncePerSession = oncePerSession;
	}
}
