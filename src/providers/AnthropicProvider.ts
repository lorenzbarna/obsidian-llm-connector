import { LLMProvider } from './LLMProvider';
import { requestUrl } from 'obsidian';
import type {
	CompletionOptions,
	CompletionResult,
	StreamOptions,
	Model,
	ModelTag,
	ConnectionResult,
} from '../types';

/**
 * Anthropic API interfaces
 * Based on https://docs.anthropic.com/en/api/messages
 */
interface AnthropicMessage {
	role: 'user' | 'assistant';
	content: string | Array<{ type: 'text'; text: string }>;
}

interface AnthropicRequest {
	model: string;
	messages: AnthropicMessage[];
	max_tokens: number;
	system?: string;
	temperature?: number;
	top_p?: number;
	stop_sequences?: string[];
}

interface AnthropicResponse {
	id: string;
	type: 'message';
	role: 'assistant';
	content: Array<{
		type: 'text';
		text: string;
	}>;
	model: string;
	stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
	usage: {
		input_tokens: number;
		output_tokens: number;
	};
}

interface AnthropicErrorResponse {
	type: 'error';
	error: {
		type: string;
		message: string;
	};
}

/**
 * Anthropic provider implementation
 * Supports Claude models from Anthropic
 * Requires API key from https://console.anthropic.com/
 */
export class AnthropicProvider extends LLMProvider {
	// Claude model list - hardcoded since Anthropic doesn't have a models endpoint
	private static readonly CLAUDE_MODELS = [
		{
			id: 'claude-opus-4-5',
			name: 'Claude Opus 4.5',
			contextWindow: 200000,
			maxTokens: 16384,
			tags: ['smart', 'chat', 'multimodal'] as ModelTag[],
			pricing: { prompt: 15.0, completion: 75.0 },
		},
		{
			id: 'claude-sonnet-4-5',
			name: 'Claude Sonnet 4.5',
			contextWindow: 200000,
			maxTokens: 16384,
			tags: ['smart', 'chat', 'code', 'multimodal'] as ModelTag[],
			pricing: { prompt: 3.0, completion: 15.0 },
		},
		{
			id: 'claude-haiku-4-5',
			name: 'Claude Haiku 4.5',
			contextWindow: 200000,
			maxTokens: 16384,
			tags: ['fast', 'chat'] as ModelTag[],
			pricing: { prompt: 0.80, completion: 4.0 },
		},
		{
			id: 'claude-3-5-haiku-latest',
			name: 'Claude 3.5 Haiku',
			contextWindow: 200000,
			maxTokens: 8192,
			tags: ['fast', 'chat'] as ModelTag[],
			pricing: { prompt: 0.80, completion: 4.0 },
		},
		{
			id: 'claude-3-opus-latest',
			name: 'Claude 3 Opus',
			contextWindow: 200000,
			maxTokens: 4096,
			tags: ['smart', 'chat', 'multimodal'] as ModelTag[],
			pricing: { prompt: 15.0, completion: 75.0 },
		},
	];

	get id(): string {
		return 'anthropic';
	}

	get name(): string {
		return 'Anthropic';
	}

	protected validateConfig(): boolean {
		// Anthropic requires an API key
		return !!this.config.apiKey;
	}

	/**
	 * Test connection to Anthropic
	 */
	async connect(): Promise<ConnectionResult> {
		try {
			const models = await this.listModels();
			return {
				success: true,
				message: `Connected to Anthropic. ${models.length} Claude models available.`,
				models,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				return {
					success: false,
					message: `Failed to connect to Anthropic: ${error.message}`,
				};
			}
			return {
				success: false,
				message: 'Failed to connect to Anthropic: Unknown error',
			};
		}
	}

	/**
	 * List available Claude models
	 * Note: Anthropic doesn't have a models endpoint, so we return a hardcoded list
	 */
	async listModels(): Promise<Model[]> {
		// Validate API key is present
		if (!this.config.apiKey) {
			throw new Error('Anthropic API key is required');
		}

		// Return hardcoded list of Claude models
		return AnthropicProvider.CLAUDE_MODELS.map((model) => ({
			id: model.id,
			name: model.name,
			provider: this.id,
			contextWindow: model.contextWindow,
			maxTokens: model.maxTokens,
			tags: model.tags,
			capabilities: ['text'],
			costPerToken: model.pricing,
		}));
	}

	/**
	 * Generate completion using Anthropic Claude API
	 */
	async complete(options: CompletionOptions): Promise<CompletionResult> {
		const baseUrl = this.config.baseUrl ?? 'https://api.anthropic.com/v1';
		const apiKey = this.config.apiKey;

		if (!apiKey) {
			throw new Error('Anthropic API key is required');
		}

		// Build messages array
		const messages: AnthropicMessage[] = [
			{
				role: 'user',
				content: options.prompt,
			},
		];

		// Build request body
		const requestBody: AnthropicRequest = {
			model: options.model ?? this.config.defaultModel ?? 'claude-sonnet-4-5',
			messages,
			max_tokens: options.maxTokens ?? 4096,
		};

		// Add system prompt if provided
		if (options.systemPrompt) {
			requestBody.system = options.systemPrompt;
		}

		// Add optional parameters
		if (options.temperature !== undefined) {
			requestBody.temperature = options.temperature;
		}
		if (options.topP !== undefined) {
			requestBody.top_p = options.topP;
		}
		if (options.stop) {
			requestBody.stop_sequences = options.stop;
		}

		try {
			const startTime = Date.now();
			
			const response = await requestUrl({
				url: `${baseUrl}/messages`,
				method: 'POST',
				headers: {
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const endTime = Date.now();
			const durationMs = endTime - startTime;

			// Check for error response
			if (response.status !== 200) {
				const errorData = response.json as AnthropicErrorResponse;
				throw new Error(errorData.error.message);
			}

			const data = response.json as AnthropicResponse;

			// Extract text from content blocks
			const text = data.content
				.filter(block => block.type === 'text')
				.map(block => block.text)
				.join('\n');

			const usage = data.usage;

			// Calculate tokens/second for performance logging
			const tokensPerSecond = usage.output_tokens / (durationMs / 1000);

			console.debug(
				`Anthropic completion: ${usage.output_tokens} tokens in ${durationMs}ms (${tokensPerSecond.toFixed(1)} tok/s)`
			);

			return {
				text,
				model: data.model,
				provider: this.id,
				tokens: {
					prompt: usage.input_tokens,
					completion: usage.output_tokens,
					total: usage.input_tokens + usage.output_tokens,
				},
				finishReason: data.stop_reason === 'end_turn' ? 'stop' : 
				             data.stop_reason === 'max_tokens' ? 'length' : undefined,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				// Check for specific error patterns
				if (error.message.includes('401') || error.message.includes('authentication')) {
					throw new Error('Invalid API key. Please check your Anthropic API key.');
				} else if (error.message.includes('429')) {
					throw new Error('Rate limit exceeded. Please try again later.');
				} else if (error.message.includes('insufficient_quota') || error.message.includes('402')) {
					throw new Error('Insufficient credits. Please add credits to your Anthropic account.');
				} else if (error.message.includes('529') || error.message.includes('overloaded')) {
					throw new Error('Anthropic is temporarily overloaded. Please try again.');
				}
				throw new Error(`Anthropic request failed: ${error.message}`);
			}
			throw new Error('Anthropic request failed: Unknown error');
		}
	}

	/**
	 * Stream completion (simulated)
	 * NOTE: Obsidian's requestUrl doesn't support streaming responses
	 * Falls back to non-streaming complete() and simulates streaming by yielding words
	 */
	async *stream(options: StreamOptions): AsyncGenerator<string, void, unknown> {
		// Fall back to non-streaming and simulate streaming
		// This is a limitation of Obsidian's requestUrl API
		const result = await this.complete(options);
		
		// Simulate streaming by yielding word by word
		const words = result.text.split(/\s+/);
		for (const word of words) {
			yield word + ' ';
		}
		
		// Call onComplete callback if provided
		if (options.onComplete) {
			options.onComplete(result);
		}
	}

	/**
	 * Generate embeddings
	 * NOTE: Anthropic doesn't offer embedding models as of now
	 * This method throws an error
	 */
	async embeddings(_text: string, _options?: { model?: string }): Promise<number[]> {
		throw new Error('Anthropic does not currently provide embedding models. Please use OpenAI or OpenRouter for embeddings.');
	}
}
