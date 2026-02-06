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
 * OpenRouter API response interfaces
 */
interface OpenRouterModel {
	id: string;
	name: string;
	created: number;
	description: string;
	pricing: {
		prompt: string;
		completion: string;
		request?: string;
		image?: string;
	};
	context_length: number;
	architecture: {
		tokenizer: string;
		instruct_type?: string | null;
		modality?: string | null;
		input_modalities?: string[];
		output_modalities?: string[];
	};
	top_provider: {
		context_length?: number | null;
		max_completion_tokens?: number | null;
		is_moderated: boolean;
	};
}

interface OpenRouterMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenRouterChatRequest {
	model: string;
	messages: OpenRouterMessage[];
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	stop?: string[];
}

interface OpenRouterChatResponse {
	id: string;
	model: string;
	created: number;
	object: string;
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
 * OpenRouter provider implementation
 * Unified API for 200+ AI models from various providers
 * Requires API key from https://openrouter.ai/
 */
export class OpenRouterProvider extends LLMProvider {
	get id(): string {
		return 'openrouter';
	}

	get name(): string {
		return 'OpenRouter';
	}

	protected validateConfig(): boolean {
		// OpenRouter requires an API key
		return !!this.config.apiKey;
	}

	/**
	 * Test connection to OpenRouter and list available models
	 */
	async connect(): Promise<ConnectionResult> {
		try {
			const models = await this.listModels();
			return {
				success: true,
				message: `Connected to OpenRouter. Found ${models.length} models.`,
				models,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				return {
					success: false,
					message: `Failed to connect to OpenRouter: ${error.message}`,
				};
			}
			return {
				success: false,
				message: 'Failed to connect to OpenRouter: Unknown error',
			};
		}
	}

	/**
	 * List available models from OpenRouter
	 */
	async listModels(): Promise<Model[]> {
		const baseUrl = this.config.baseUrl ?? 'https://openrouter.ai/api/v1';
		const apiKey = this.config.apiKey;

		if (!apiKey) {
			throw new Error('OpenRouter API key is required');
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

			const data = response.json as { data: OpenRouterModel[] };
			
			return data.data.map((model) => this.convertToModel(model));
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(`Failed to list models: ${error.message}`);
			}
			throw new Error('Failed to list models: Unknown error');
		}
	}

	/**
	 * Convert OpenRouter model format to our Model interface
	 */
	private convertToModel(orModel: OpenRouterModel): Model {
		const tags: ModelTag[] = [];

		// Infer tags from model ID and architecture
		const modelId = orModel.id.toLowerCase();
		const architecture = orModel.architecture;

		// Check for embedding models
		if (architecture.output_modalities?.includes('embeddings')) {
			tags.push('embedding');
		}

		// Check for chat/text models
		if (architecture.output_modalities?.includes('text')) {
			tags.push('chat');
		}

		// Check for vision/multimodal
		if (architecture.input_modalities?.includes('image') || modelId.includes('vision')) {
			tags.push('multimodal');
		}

		// Check for code models
		if (modelId.includes('code') || modelId.includes('deepseek-coder') || modelId.includes('codellama')) {
			tags.push('code');
		}

		// Infer speed tier from pricing (lower cost = usually faster/smaller model)
		const promptPrice = parseFloat(orModel.pricing.prompt);
		if (promptPrice < 0.10) {
			tags.push('fast');
		} else if (promptPrice > 5.0) {
			tags.push('smart');
		}

		return {
			id: orModel.id,
			name: orModel.name || orModel.id,
			provider: this.id,
			contextWindow: orModel.context_length || orModel.top_provider.context_length || 4096,
			tags,
			capabilities: architecture.output_modalities || ['text'],
			costPerToken: {
				prompt: parseFloat(orModel.pricing.prompt),
				completion: parseFloat(orModel.pricing.completion),
			},
		};
	}

	/**
	 * Generate completion using OpenRouter
	 */
	async complete(options: CompletionOptions): Promise<CompletionResult> {
		const baseUrl = this.config.baseUrl ?? 'https://openrouter.ai/api/v1';
		const apiKey = this.config.apiKey;

		if (!apiKey) {
			throw new Error('OpenRouter API key is required');
		}

		// Build messages array
		const messages: OpenRouterMessage[] = [];
		
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
		const requestBody: OpenRouterChatRequest = {
			model: options.model ?? this.config.defaultModel ?? 'openai/gpt-3.5-turbo',
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
					'HTTP-Referer': 'https://obsidian.md', // Optional: for OpenRouter analytics
					'X-Title': 'Obsidian LLM Connector', // Optional: for OpenRouter analytics
				},
				body: JSON.stringify(requestBody),
			});

			const data = response.json as OpenRouterChatResponse;
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
				`OpenRouter completion: ${usage.completion_tokens} tokens in ${durationMs}ms (${tokensPerSecond.toFixed(1)} tok/s)`
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
					throw new Error('Invalid API key. Please check your OpenRouter API key.');
				} else if (error.message.includes('429')) {
					throw new Error('Rate limit exceeded. Please try again later.');
				} else if (error.message.includes('402')) {
					throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
				} else if (error.message.includes('503')) {
					throw new Error('Service unavailable. The model provider may be down.');
				}
				throw new Error(`OpenRouter request failed: ${error.message}`);
			}
			throw new Error('OpenRouter request failed: Unknown error');
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
	 * NOTE: OpenRouter supports embeddings through specific embedding models
	 */
	async embeddings(text: string, options?: { model?: string }): Promise<number[]> {
		const baseUrl = this.config.baseUrl ?? 'https://openrouter.ai/api/v1';
		const apiKey = this.config.apiKey;

		if (!apiKey) {
			throw new Error('OpenRouter API key is required');
		}

		// Use specified model or default embedding model
		const model = options?.model ?? 'openai/text-embedding-ada-002';

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
