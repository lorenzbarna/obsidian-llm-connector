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
 * Ollama API response interfaces
 */
interface OllamaModel {
	name: string;
	model: string;
	modified_at: string;
	size: number;
	digest: string;
	details: {
		parent_model: string;
		format: string;
		family: string;
		families?: string[];
		parameter_size: string;
		quantization_level: string;
	};
}

interface OllamaChatResponse {
	model: string;
	created_at: string;
	message: {
		role: string;
		content: string;
	};
	done: boolean;
	total_duration?: number;
	load_duration?: number;
	prompt_eval_count?: number;
	prompt_eval_duration?: number;
	eval_count?: number;
	eval_duration?: number;
}

interface OllamaEmbeddingResponse {
	model: string;
	embeddings: number[][];
	total_duration?: number;
	load_duration?: number;
	prompt_eval_count?: number;
}

/**
 * Ollama provider implementation
 * Supports local Ollama instances (default: http://localhost:11434)
 */
export class OllamaProvider extends LLMProvider {
	get id(): string {
		return 'ollama';
	}

	get name(): string {
		return 'Ollama';
	}

	protected validateConfig(): boolean {
		// Ollama doesn't require an API key, just a base URL
		return !!this.config.baseUrl;
	}

	/**
	 * Test connection to Ollama server
	 */
	async connect(): Promise<ConnectionResult> {
		try {
			const models = await this.listModels();
			return {
				success: true,
				message: `Connected to Ollama. Found ${models.length} models.`,
				models,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				return {
					success: false,
					message: `Failed to connect to Ollama: ${error.message}`,
				};
			}
			return {
				success: false,
				message: 'Failed to connect to Ollama: Unknown error',
			};
		}
	}

	/**
	 * List available models from Ollama
	 */
	async listModels(): Promise<Model[]> {
		const url = `${this.config.baseUrl}/api/tags`;

		try {
			const response = await requestUrl({
				url,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = response.json as { models: OllamaModel[] };

			return data.models.map((model): Model => {
				const tags = this.inferModelTags(model.name, model.details.family);
				
				return {
					id: model.name,
					name: model.name,
					provider: this.id,
					tags,
					capabilities: this.inferCapabilities(model.name),
					contextWindow: this.inferContextWindow(model.name),
				};
			});
		} catch (error: unknown) {
			console.error('Failed to list Ollama models:', error);
			throw new Error(
				error instanceof Error
					? `Failed to list models: ${error.message}`
					: 'Failed to list models'
			);
		}
	}

	/**
	 * Generate a completion using Ollama's /api/chat endpoint
	 */
	async complete(options: CompletionOptions): Promise<CompletionResult> {
		const url = `${this.config.baseUrl}/api/chat`;

		// Build request body
		const requestBody = {
			model: options.model,
			messages: [
				...(options.systemPrompt ? [{
					role: 'system',
					content: options.systemPrompt,
				}] : []),
				{
					role: 'user',
					content: options.prompt,
				},
			],
			stream: false,
			options: {
				...(options.temperature !== undefined && { temperature: options.temperature }),
				...(options.maxTokens !== undefined && { num_predict: options.maxTokens }),
				...(options.topP !== undefined && { top_p: options.topP }),
				...(options.frequencyPenalty !== undefined && { frequency_penalty: options.frequencyPenalty }),
				...(options.presencePenalty !== undefined && { presence_penalty: options.presencePenalty }),
				...(options.stop !== undefined && { stop: options.stop }),
			},
		};

		try {
			const response = await requestUrl({
				url,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const data = response.json as OllamaChatResponse;

			// Calculate tokens per second if duration data available
			const tokensPerSecond =
				data.eval_count && data.eval_duration
					? (data.eval_count / data.eval_duration) * 1e9
					: 0;

			console.debug(`Ollama completion: ${tokensPerSecond.toFixed(2)} tokens/s`);

			return {
				text: data.message.content,
				model: options.model ?? data.model,
				provider: this.id,
				tokens: {
					prompt: data.prompt_eval_count ?? 0,
					completion: data.eval_count ?? 0,
					total: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
				},
				finishReason: data.done ? 'stop' : 'error',
			};
		} catch (error: unknown) {
			console.error('Ollama completion error:', error);
			throw new Error(
				error instanceof Error
					? `Ollama completion failed: ${error.message}`
					: 'Ollama completion failed'
			);
		}
	}

	/**
	 * Stream a completion using Ollama's streaming API
	 * Note: Streaming requires direct fetch API which is restricted in Obsidian.
	 * This is a known limitation - consider implementing via requestUrl polling
	 * or waiting for Obsidian API improvements.
	 */
	async *stream(options: StreamOptions): AsyncGenerator<string, void, unknown> {
		// TODO: Implement streaming without fetch API
		// Obsidian's requestUrl doesn't support streaming responses
		// Possible solutions:
		// 1. Poll the API repeatedly with short max_tokens
		// 2. Use non-streaming API and yield in chunks
		// 3. Request Obsidian API enhancement
		
		// For now, fall back to non-streaming and yield in chunks
		const result = await this.complete(options);
		const words = result.text.split(' ');
		
		for (const word of words) {
			const chunk = word + ' ';
			yield chunk;
			if (options.onChunk) {
				options.onChunk(chunk);
			}
			// Small delay to simulate streaming
			await new Promise(resolve => setTimeout(resolve, 10));
		}

		if (options.onComplete) {
			options.onComplete(result);
		}
	}

	/**
	 * Generate embeddings using Ollama's /api/embed endpoint
	 */
	async embeddings(text: string): Promise<number[]> {
		const url = `${this.config.baseUrl}/api/embed`;

		// Use the configured default model or a known embedding model
		const model = this.config.defaultModel ?? 'nomic-embed-text';

		try {
			const response = await requestUrl({
				url,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model,
					input: text,
				}),
			});

			const data = response.json as OllamaEmbeddingResponse;

			// Return the first embedding (Ollama returns an array)
			if (data.embeddings && data.embeddings.length > 0 && data.embeddings[0]) {
				return data.embeddings[0];
			}

			throw new Error('No embeddings returned from Ollama');
		} catch (error: unknown) {
			console.error('Ollama embeddings error:', error);
			throw new Error(
				error instanceof Error
					? `Ollama embeddings failed: ${error.message}`
					: 'Ollama embeddings failed'
			);
		}
	}

	/**
	 * Infer model tags based on model name and family
	 */
	private inferModelTags(modelName: string, family: string): ModelTag[] {
		const tags: ModelTag[] = [];
		const nameLower = modelName.toLowerCase();

		// Check for embedding models
		if (nameLower.includes('embed') || nameLower.includes('nomic')) {
			tags.push('embedding');
			return tags; // Embedding models don't have chat capabilities
		}

		// Always add chat capability for non-embedding models
		tags.push('chat');

		// Check for code-specific models
		if (nameLower.includes('code') || nameLower.includes('coder')) {
			tags.push('code');
		}

		// Check for vision/multimodal models
		if (nameLower.includes('llava') || nameLower.includes('vision') || nameLower.includes('bakllava')) {
			tags.push('multimodal');
		}

		// Infer speed tier based on parameter size
		if (nameLower.includes(':3b') || nameLower.includes('mini') || nameLower.includes('small')) {
			tags.push('fast');
		} else if (nameLower.includes(':70b') || nameLower.includes(':72b') || nameLower.includes('large')) {
			tags.push('smart');
		}

		return tags;
	}

	/**
	 * Infer model capabilities
	 */
	private inferCapabilities(modelName: string): string[] {
		const capabilities: string[] = ['completion'];
		const nameLower = modelName.toLowerCase();

		if (nameLower.includes('llava') || nameLower.includes('vision') || nameLower.includes('bakllava')) {
			capabilities.push('vision');
		}

		if (nameLower.includes('embed')) {
			capabilities.push('embeddings');
		}

		return capabilities;
	}

	/**
	 * Infer context window size based on model name
	 */
	private inferContextWindow(modelName: string): number {
		const nameLower = modelName.toLowerCase();

		// Some models have known context windows
		if (nameLower.includes('llama3.1') || nameLower.includes('llama3.2')) {
			return 128000; // Llama 3.1/3.2 has 128k context
		}

		if (nameLower.includes('mistral')) {
			return 32000; // Mistral typically 32k
		}

		// Default to common size
		return 8192;
	}
}
