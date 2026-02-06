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
 * OpenAI API response interfaces
 */
interface OpenAIModel {
	id: string;
	object: string;
	created: number;
	owned_by: string;
}

interface OpenAIMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenAIChatRequest {
	model: string;
	messages: OpenAIMessage[];
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	stop?: string[];
}

interface OpenAIChatResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

/**
 * OpenAI provider implementation
 * Supports GPT models from OpenAI
 * Requires API key from https://platform.openai.com/
 */
export class OpenAIProvider extends LLMProvider {
	get id(): string {
		return 'openai';
	}

	get name(): string {
		return 'OpenAI';
	}

	protected validateConfig(): boolean {
		// OpenAI requires an API key
		return !!this.config.apiKey;
	}

	/**
	 * Test connection to OpenAI and list available models
	 */
	async connect(): Promise<ConnectionResult> {
		try {
			const models = await this.listModels();
			return {
				success: true,
				message: `Connected to OpenAI. Found ${models.length} models.`,
				models,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				return {
					success: false,
					message: `Failed to connect to OpenAI: ${error.message}`,
				};
			}
			return {
				success: false,
				message: 'Failed to connect to OpenAI: Unknown error',
			};
		}
	}

	/**
	 * List available models from OpenAI
	 */
	async listModels(): Promise<Model[]> {
		const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
		const apiKey = this.config.apiKey;

		if (!apiKey) {
			throw new Error('OpenAI API key is required');
		}

		try {
			const response = await requestUrl({
				url: `${baseUrl}/models`,
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			const data = response.json as { data: OpenAIModel[] };
			
			return data.data
				.filter(model => model.id.startsWith('gpt-') || model.id.startsWith('o1-') || model.id.includes('embedding'))
				.map((model) => this.convertToModel(model));
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(`Failed to list models: ${error.message}`);
			}
			throw new Error('Failed to list models: Unknown error');
		}
	}

	/**
	 * Convert OpenAI model format to our Model interface
	 */
	private convertToModel(oaiModel: OpenAIModel): Model {
		const tags: ModelTag[] = [];
		const modelId = oaiModel.id.toLowerCase();

		// Classify by model type
		if (modelId.includes('embedding')) {
			tags.push('embedding');
		} else {
			tags.push('chat');
		}

		// GPT-4 models are generally smarter
		if (modelId.includes('gpt-4') || modelId.includes('o1')) {
			tags.push('smart');
		}

		// GPT-3.5 and smaller models are faster
		if (modelId.includes('gpt-3.5') || modelId.includes('gpt-4o-mini')) {
			tags.push('fast');
		}

		// Code models
		if (modelId.includes('code')) {
			tags.push('code');
		}

		// Vision models
		if (modelId.includes('vision') || modelId.includes('gpt-4o') || modelId.includes('gpt-4-turbo')) {
			tags.push('multimodal');
		}

		// Infer context windows
		let contextWindow = 4096; // default
		if (modelId.includes('gpt-4-turbo') || modelId.includes('gpt-4o')) {
			contextWindow = 128000;
		} else if (modelId.includes('gpt-4-32k')) {
			contextWindow = 32768;
		} else if (modelId.includes('gpt-4')) {
			contextWindow = 8192;
		} else if (modelId.includes('gpt-3.5-turbo-16k')) {
			contextWindow = 16384;
		} else if (modelId.includes('gpt-3.5')) {
			contextWindow = 4096;
		}

		// Approximate pricing (as of latest data, may change)
		let promptCost = 0.0;
		let completionCost = 0.0;

		if (modelId.includes('gpt-4o')) {
			promptCost = 5.0;
			completionCost = 15.0;
		} else if (modelId.includes('gpt-4o-mini')) {
			promptCost = 0.15;
			completionCost = 0.60;
		} else if (modelId.includes('gpt-4-turbo')) {
			promptCost = 10.0;
			completionCost = 30.0;
		} else if (modelId.includes('gpt-4')) {
			promptCost = 30.0;
			completionCost = 60.0;
		} else if (modelId.includes('gpt-3.5-turbo')) {
			promptCost = 0.50;
			completionCost = 1.50;
		} else if (modelId.includes('o1-preview')) {
			promptCost = 15.0;
			completionCost = 60.0;
		} else if (modelId.includes('o1-mini')) {
			promptCost = 3.0;
			completionCost = 12.0;
		}

		return {
			id: oaiModel.id,
			name: oaiModel.id,
			provider: this.id,
			contextWindow,
			tags,
			capabilities: modelId.includes('embedding') ? ['embeddings'] : ['text'],
			costPerToken: {
				prompt: promptCost,
				completion: completionCost,
			},
		};
	}

	/**
	 * Generate completion using OpenAI
	 */
	async complete(options: CompletionOptions): Promise<CompletionResult> {
		const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
		const apiKey = this.config.apiKey;

		if (!apiKey) {
			throw new Error('OpenAI API key is required');
		}

		// Build messages array
		const messages: OpenAIMessage[] = [];
		
		if (options.systemPrompt) {
			messages.push({
				role: 'system',
				content: options.systemPrompt,
			});
		}

		messages.push({
			role: 'user',
			content: options.prompt,
		});

		// Build request body
		const requestBody: OpenAIChatRequest = {
			model: options.model ?? this.config.defaultModel ?? 'gpt-3.5-turbo',
			messages,
		};

		// Add optional parameters
		if (options.temperature !== undefined) {
			requestBody.temperature = options.temperature;
		}
		if (options.maxTokens !== undefined) {
			requestBody.max_tokens = options.maxTokens;
		}
		if (options.topP !== undefined) {
			requestBody.top_p = options.topP;
		}
		if (options.frequencyPenalty !== undefined) {
			requestBody.frequency_penalty = options.frequencyPenalty;
		}
		if (options.presencePenalty !== undefined) {
			requestBody.presence_penalty = options.presencePenalty;
		}
		if (options.stop) {
			requestBody.stop = options.stop;
		}

		try {
			const startTime = Date.now();
			
			const response = await requestUrl({
				url: `${baseUrl}/chat/completions`,
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const data = response.json as OpenAIChatResponse;
			const endTime = Date.now();
			const durationMs = endTime - startTime;

			// Extract response
			const choice = data.choices[0];
			if (!choice) {
				throw new Error('No response choices returned');
			}

			const text = choice.message.content;
			const usage = data.usage;

			// Calculate tokens/second for performance logging
			const tokensPerSecond = usage.completion_tokens / (durationMs / 1000);

			console.debug(
				`OpenAI completion: ${usage.completion_tokens} tokens in ${durationMs}ms (${tokensPerSecond.toFixed(1)} tok/s)`
			);

			return {
				text,
				model: data.model,
				provider: this.id,
				tokens: {
					prompt: usage.prompt_tokens,
					completion: usage.completion_tokens,
					total: usage.total_tokens,
				},
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				// Check for specific error codes
				if (error.message.includes('401')) {
					throw new Error('Invalid API key. Please check your OpenAI API key.');
				} else if (error.message.includes('429')) {
					throw new Error('Rate limit exceeded. Please try again later.');
				} else if (error.message.includes('402') || error.message.includes('insufficient_quota')) {
					throw new Error('Insufficient quota. Please add credits to your OpenAI account.');
				} else if (error.message.includes('503')) {
					throw new Error('Service unavailable. OpenAI may be experiencing issues.');
				}
				throw new Error(`OpenAI request failed: ${error.message}`);
			}
			throw new Error('OpenAI request failed: Unknown error');
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
	 * Generate embeddings using OpenAI
	 */
	async embeddings(text: string, options?: { model?: string }): Promise<number[]> {
		const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
		const apiKey = this.config.apiKey;

		if (!apiKey) {
			throw new Error('OpenAI API key is required');
		}

		// Use specified model or default embedding model
		const model = options?.model ?? 'text-embedding-ada-002';

		try {
			const response = await requestUrl({
				url: `${baseUrl}/embeddings`,
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model,
					input: text,
				}),
			});

			const data = response.json as { data: Array<{ embedding: number[] }> };
			
			if (!data.data || !data.data[0]) {
				throw new Error('No embedding returned');
			}

			return data.data[0].embedding;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(`Failed to generate embeddings: ${error.message}`);
			}
			throw new Error('Failed to generate embeddings: Unknown error');
		}
	}
}
