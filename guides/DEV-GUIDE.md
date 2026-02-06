# LLM Connector API Documentation

Complete API reference for Obsidian plugin developers who want to integrate AI capabilities using LLM Connector.

## Table of Contents

- [Getting Started](#getting-started)
- [API Reference](#api-reference)
  - [complete()](#complete)
  - [stream()](#stream)
  - [getModel()](#getmodel)
  - [listModels()](#listmodels)
  - [getProviders()](#getproviders)
  - [getActiveProvider()](#getactiveprovider)
  - [isReady()](#isready)
- [Type Definitions](#type-definitions)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Versioning & Compatibility](#versioning--compatibility)

---

## Getting Started

### Installation Check

Always check if LLM Connector is installed and enabled before using the API:

```typescript
import { Plugin, Notice } from 'obsidian';

export default class YourPlugin extends Plugin {
	async onload() {
		// Check if LLM Connector is available
		const llm = this.app.plugins.plugins['llm-connector']?.api;
		
		if (!llm) {
			console.log('LLM Connector not found - AI features disabled');
			return;
		}
		
		if (!llm.isReady()) {
			new Notice('LLM Connector: No providers configured');
			return;
		}
		
		// Safe to use LLM features
		console.log('LLM Connector available, version:', llm.version);
	}
}
```

### Basic Usage Pattern

```typescript
// 1. Get API reference
const llm = this.app.plugins.plugins['llm-connector']?.api;

// 2. Check availability
if (!llm?.isReady()) {
	new Notice('Please configure LLM Connector first');
	return;
}

// 3. Make request
try {
	const result = await llm.complete({
		prompt: "Your prompt here",
		tier: 'balanced'
	});
	
	console.log('Response:', result.text);
} catch (error) {
	new Notice(`LLM error: ${error.message}`);
}
```

---

## API Reference

### complete()

Generate a text completion using the configured LLM.

**Signature:**
```typescript
complete(options: CompletionOptions): Promise<CompletionResult>
```

**Parameters:**

```typescript
interface CompletionOptions {
	prompt: string;                 // Required: The input prompt
	tier?: PerformanceTier;         // Optional: Performance tier (default: 'balanced')
	model?: string;                 // Optional: Override tier with specific model
	provider?: string;              // Optional: Force specific provider
	systemPrompt?: string;          // Optional: System message/instructions
	temperature?: number;           // Optional: 0.0-2.0, controls randomness (default: 1.0)
	maxTokens?: number;            // Optional: Maximum tokens to generate
	topP?: number;                 // Optional: Nucleus sampling (0.0-1.0)
	frequencyPenalty?: number;     // Optional: Penalize frequent tokens (-2.0 to 2.0)
	presencePenalty?: number;      // Optional: Penalize tokens in prompt (-2.0 to 2.0)
	stop?: string[];               // Optional: Stop sequences
}

type PerformanceTier = 'fast' | 'balanced' | 'advanced' | 'thinking' | 'code' | 'embedding';
```

**Returns:**

```typescript
interface CompletionResult {
	text: string;                  // Generated text
	model: string;                 // Model that was used (e.g., 'llama3.2', 'gpt-4o')
	provider: string;              // Provider that was used (e.g., 'ollama', 'openai')
	tokens: {
		prompt: number;            // Token count of input
		completion: number;        // Token count of output
		total: number;             // Sum of prompt + completion
	};
	finishReason?: 'stop' | 'length' | 'error';  // Why generation stopped
	
	// Tier fallback metadata (if tier was used)
	requestedTier?: PerformanceTier;    // Tier you requested
	actualTier?: PerformanceTier;       // Tier that was actually used
	fallbackOccurred?: boolean;         // True if fallback happened
	fallbackReason?: FallbackReason;    // Why fallback occurred
}

type FallbackReason = 
	| 'tier_not_configured' 
	| 'provider_error' 
	| 'rate_limit' 
	| 'timeout' 
	| 'model_unavailable';
```

**Examples:**

```typescript
// Basic tier-based request
const result = await llm.complete({
	prompt: "Explain quantum computing in simple terms",
	tier: 'balanced'
});

// With system prompt and temperature
const result = await llm.complete({
	prompt: "Write a creative story about a robot",
	tier: 'advanced',
	systemPrompt: "You are a creative science fiction writer",
	temperature: 1.5
});

// Specific model override
const result = await llm.complete({
	prompt: "Generate Python code for...",
	model: 'gpt-4o',
	temperature: 0.2,  // Lower for code generation
	maxTokens: 1000
});

// Check if fallback occurred
const result = await llm.complete({
	prompt: "Complex reasoning task",
	tier: 'thinking'
});

if (result.fallbackOccurred) {
	console.log(`Fell back from ${result.requestedTier} to ${result.actualTier}`);
	console.log(`Reason: ${result.fallbackReason}`);
}
```

**Throws:**
- `Error` if prompt is empty
- `Error` if no providers are configured
- `Error` if tier resolution fails (no configured tiers)
- `Error` if provider request fails

---

### stream()

Stream a text completion token by token (currently simulated due to Obsidian API limitations).

**Signature:**
```typescript
stream(options: StreamOptions): AsyncGenerator<string, void, unknown>
```

**Parameters:**

```typescript
interface StreamOptions extends CompletionOptions {
	onChunk?: (text: string) => void;          // Callback for each chunk
	onComplete?: (result: CompletionResult) => void;  // Callback when done
	onError?: (error: Error) => void;          // Callback on error
}
```

**Returns:** AsyncGenerator that yields string chunks

**Example:**

```typescript
try {
	const stream = llm.stream({
		prompt: "Write a long essay about AI",
		tier: 'balanced',
		onChunk: (chunk) => {
			// Process each chunk as it arrives
			console.log('Chunk:', chunk);
		}
	});
	
	let fullText = '';
	for await (const chunk of stream) {
		fullText += chunk;
		// Update UI with each chunk
		editor.replaceSelection(chunk);
	}
	
	console.log('Streaming complete!');
} catch (error) {
	new Notice(`Streaming error: ${error.message}`);
}
```

**Note:** Due to Obsidian's `requestUrl` API limitations, streaming is currently simulated. The full response is generated first, then yielded word-by-word.

---

### getModel()

Find a model matching specific criteria.

**Signature:**
```typescript
getModel(criteria: ModelCriteria): Model | null
```

**Parameters:**

```typescript
interface ModelCriteria {
	tag?: ModelTag;              // Find by capability tag
	provider?: string;           // Find by provider
	capability?: string[];       // Find by capabilities
	minContextWindow?: number;   // Minimum context window size
}

type ModelTag = 'fast' | 'smart' | 'multimodal' | 'embedding' | 'code' | 'chat';
```

**Returns:** First matching `Model` or `null` if not found

**Examples:**

```typescript
// Find a fast model
const fastModel = llm.getModel({ tag: 'fast' });

// Find an embedding model from Ollama
const embedModel = llm.getModel({ 
	tag: 'embedding', 
	provider: 'ollama' 
});

// Find model with large context window
const longContextModel = llm.getModel({ 
	minContextWindow: 100000 
});
```

---

### listModels()

List all available models, optionally filtered.

**Signature:**
```typescript
listModels(filter?: ModelFilter): Model[]
```

**Parameters:**

```typescript
interface ModelFilter {
	provider?: string;    // Filter by provider ID
	available?: boolean;  // Filter by availability (currently always true)
	tag?: ModelTag;      // Filter by capability tag
}
```

**Returns:** Array of `Model` objects

**Model Object:**

```typescript
interface Model {
	id: string;              // Unique model ID (e.g., 'llama3.2', 'gpt-4o')
	name: string;            // Display name
	provider: string;        // Provider ID ('ollama', 'openai', etc.)
	tags: ModelTag[];        // Capability tags
	capabilities: string[];  // Detailed capabilities
	contextWindow?: number;  // Maximum context window in tokens
	maxTokens?: number;      // Maximum output tokens
	costPerToken?: {         // Pricing (for cloud providers)
		prompt: number;
		completion: number;
	};
}
```

**Examples:**

```typescript
// List all models
const allModels = llm.listModels();
console.log(`Found ${allModels.length} models`);

// List Ollama models only
const ollamaModels = llm.listModels({ provider: 'ollama' });

// List embedding models
const embeddingModels = llm.listModels({ tag: 'embedding' });

// Display in UI
const models = llm.listModels({ provider: 'openai' });
models.forEach(model => {
	console.log(`${model.name} (${model.id})`);
	console.log(`  Context: ${model.contextWindow} tokens`);
	console.log(`  Tags: ${model.tags.join(', ')}`);
});
```

---

### getProviders()

Get information about all registered providers.

**Signature:**
```typescript
getProviders(): Promise<Provider[]>
```

**Returns:** Array of `Provider` objects

**Provider Object:**

```typescript
interface Provider {
	id: string;              // Provider ID ('ollama', 'openai', etc.)
	name: string;            // Display name ('Ollama', 'OpenAI', etc.)
	enabled: boolean;        // Is provider enabled in settings?
	configured: boolean;     // Is provider fully configured?
	status: ProviderStatus;  // Current status
	statusMessage?: string;  // Human-readable status message
}

type ProviderStatus = 'connected' | 'disconnected' | 'error' | 'unconfigured';
```

**Example:**

```typescript
const providers = await llm.getProviders();

providers.forEach(provider => {
	console.log(`${provider.name}: ${provider.status}`);
	if (provider.enabled && !provider.configured) {
		console.log('  ⚠️ Missing configuration (API key?)');
	}
});
```

---

### getActiveProvider()

Get the currently active provider (first enabled and configured provider).

**Signature:**
```typescript
getActiveProvider(): Promise<Provider | null>
```

**Returns:** Active `Provider` or `null` if none configured

**Example:**

```typescript
const active = await llm.getActiveProvider();

if (active) {
	console.log(`Using provider: ${active.name}`);
} else {
	new Notice('No LLM provider configured');
}
```

---

### isReady()

Check if LLM Connector is ready to handle requests.

**Signature:**
```typescript
isReady(): boolean
```

**Returns:** `true` if at least one provider is configured and enabled

**Example:**

```typescript
if (!llm.isReady()) {
	new Notice('Please configure at least one LLM provider');
	return;
}

// Safe to make requests
const result = await llm.complete({ prompt: "...", tier: 'balanced' });
```

---

## Type Definitions

### Complete TypeScript Interface

```typescript
export interface LLMConnectorAPI {
	version: string;
	complete(options: CompletionOptions): Promise<CompletionResult>;
	stream(options: StreamOptions): AsyncGenerator<string, void, unknown>;
	getModel(criteria: ModelCriteria): Model | null;
	listModels(filter?: ModelFilter): Model[];
	getProviders(): Promise<Provider[]>;
	getActiveProvider(): Promise<Provider | null>;
	isReady(): boolean;
}
```

For complete type definitions, see [`src/api.ts`](src/api.ts) and [`src/types.ts`](src/types.ts).

---

## Best Practices

### 1. Always Check API Availability

```typescript
const llm = this.app.plugins.plugins['llm-connector']?.api;
if (!llm) {
	// Gracefully degrade - disable AI features
	console.log('LLM Connector not available');
	return;
}
```

### 2. Use Tiers Instead of Hardcoded Models

**✅ Good:**
```typescript
await llm.complete({ prompt: "...", tier: 'balanced' });
```

**❌ Avoid:**
```typescript
await llm.complete({ prompt: "...", model: 'gpt-4o' });
```

**Why?** Tiers let users control which models are used. Hardcoding models breaks if the user doesn't have that specific provider/model.

### 3. Handle Errors Gracefully

```typescript
try {
	const result = await llm.complete({
		prompt: userInput,
		tier: 'balanced'
	});
	// Success
	processResult(result);
} catch (error) {
	// Error
	console.error('LLM request failed:', error);
	new Notice('Failed to generate response. Check LLM Connector settings.');
}
```

### 4. Respect Fallback Metadata

```typescript
const result = await llm.complete({ prompt: "...", tier: 'advanced' });

if (result.fallbackOccurred) {
	console.warn(
		`Requested ${result.requestedTier} but used ${result.actualTier} ` +
		`(reason: ${result.fallbackReason})`
	);
	
	// Optionally notify user
	if (result.fallbackReason === 'tier_not_configured') {
		new Notice('Advanced tier not configured, using fallback');
	}
}
```

### 5. Provide Helpful Error Messages

```typescript
if (!llm) {
	new Notice(
		'LLM Connector plugin not found. ' +
		'Install it from Community Plugins to enable AI features.'
	);
	return;
}

if (!llm.isReady()) {
	new Notice(
		'No LLM providers configured. ' +
		'Please configure Ollama, OpenAI, or another provider in LLM Connector settings.'
	);
	return;
}
```

### 6. Use Appropriate Tiers for Tasks

| Task Type | Recommended Tier | Reason |
|-----------|-----------------|---------|
| Quick summaries | `fast` | Speed over quality |
| General tasks | `balanced` | Best all-around |
| Complex analysis | `advanced` | Maximum quality |
| Deep reasoning | `thinking` | Optimized for logic |
| Code generation | `code` | Code-specific models |
| Embeddings | `embedding` | Vector generation |

### 7. Set Appropriate Temperature

```typescript
// Code generation (deterministic)
await llm.complete({
	prompt: "Write Python function...",
	tier: 'code',
	temperature: 0.2
});

// Creative writing (more random)
await llm.complete({
	prompt: "Write a story...",
	tier: 'balanced',
	temperature: 1.5
});

// Factual/analytical (default)
await llm.complete({
	prompt: "Analyze this data...",
	tier: 'advanced',
	temperature: 0.7
});
```

### 8. Handle Token Limits

```typescript
const result = await llm.complete({
	prompt: longPrompt,
	tier: 'balanced',
	maxTokens: 2000  // Limit response length
});

if (result.finishReason === 'length') {
	console.warn('Response truncated due to token limit');
	// Consider requesting more tokens or summarizing
}
```

---

## Examples

### Example 1: Simple Text Generation

```typescript
export default class SimplePlugin extends Plugin {
	async generateText() {
		const llm = this.app.plugins.plugins['llm-connector']?.api;
		
		if (!llm?.isReady()) {
			new Notice('LLM Connector not ready');
			return;
		}
		
		try {
			const result = await llm.complete({
				prompt: "Write a haiku about productivity",
				tier: 'fast'
			});
			
			new Notice(`Generated:\n${result.text}`);
		} catch (error) {
			new Notice(`Error: ${error.message}`);
		}
	}
}
```

### Example 2: Text Summarization Command

```typescript
this.addCommand({
	id: 'summarize-selection',
	name: 'Summarize selected text',
	editorCallback: async (editor: Editor) => {
		const llm = this.app.plugins.plugins['llm-connector']?.api;
		if (!llm?.isReady()) {
			new Notice('LLM Connector not configured');
			return;
		}
		
		const selection = editor.getSelection();
		if (!selection) {
			new Notice('No text selected');
			return;
		}
		
		try {
			const result = await llm.complete({
				prompt: `Summarize this in 3 bullet points:\n\n${selection}`,
				tier: 'balanced',
				systemPrompt: 'You are a concise summarization assistant',
				temperature: 0.5
			});
			
			// Insert summary after selection
			const cursor = editor.getCursor('to');
			editor.replaceRange(`\n\n## Summary\n${result.text}\n`, cursor);
			
		} catch (error) {
			new Notice(`Summarization failed: ${error.message}`);
		}
	}
});
```

### Example 3: Smart Note Title Generator

```typescript
async generateNoteTitle(content: string): Promise<string | null> {
	const llm = this.app.plugins.plugins['llm-connector']?.api;
	if (!llm?.isReady()) return null;
	
	try {
		const result = await llm.complete({
			prompt: 
				`Generate a concise, descriptive title (max 8 words) for this note:\n\n` +
				`${content.substring(0, 500)}...`,
			tier: 'fast',
			systemPrompt: 'Generate only the title, no quotes or extra text',
			temperature: 0.7,
			maxTokens: 50
		});
		
		return result.text.trim().replace(/^["']|["']$/g, '');
	} catch (error) {
		console.error('Title generation failed:', error);
		return null;
	}
}
```

### Example 4: Batch Processing with Progress

```typescript
async processNotesWithAI(files: TFile[]) {
	const llm = this.app.plugins.plugins['llm-connector']?.api;
	if (!llm?.isReady()) {
		new Notice('LLM Connector not ready');
		return;
	}
	
	let processed = 0;
	const total = files.length;
	
	for (const file of files) {
		try {
			const content = await this.app.vault.read(file);
			
			const result = await llm.complete({
				prompt: `Extract key topics from:\n\n${content}`,
				tier: 'balanced',
				maxTokens: 100
			});
			
			// Store result as frontmatter
			await this.addFrontmatter(file, 'ai-topics', result.text);
			
			processed++;
			new Notice(`Processed ${processed}/${total} notes`);
			
		} catch (error) {
			console.error(`Failed to process ${file.path}:`, error);
		}
	}
	
	new Notice(`Completed! Processed ${processed} of ${total} notes.`);
}
```

### Example 5: Using Specific Models

```typescript
async useSpecificProvider() {
	const llm = this.app.plugins.plugins['llm-connector']?.api;
	if (!llm?.isReady()) return;
	
	// List available models
	const models = llm.listModels({ provider: 'openai' });
	
	if (models.length === 0) {
		new Notice('OpenAI provider not configured');
		return;
	}
	
	// Use a specific model
	try {
		const result = await llm.complete({
			prompt: "Advanced reasoning task...",
			model: 'gpt-4o',  // Override tier system
			provider: 'openai',
			temperature: 0.3
		});
		
		console.log(`Used ${result.model} from ${result.provider}`);
	} catch (error) {
		new Notice(`Request failed: ${error.message}`);
	}
}
```

---

## Error Handling

### Common Errors and Solutions

#### "Prompt is required"
```typescript
// ❌ Missing prompt
await llm.complete({});

// ✅ Provide prompt
await llm.complete({ prompt: "Your prompt here", tier: 'balanced' });
```

#### "Provider not found"
```typescript
try {
	await llm.complete({ prompt: "...", provider: 'nonexistent' });
} catch (error) {
	// Provider doesn't exist or isn't enabled
	console.error('Provider not available:', error.message);
}
```

#### "Tier resolution failed"
```typescript
try {
	await llm.complete({ prompt: "...", tier: 'advanced' });
} catch (error) {
	// No model assigned to 'advanced' tier (or any fallback tier)
	new Notice('Please configure the Advanced tier in LLM Connector settings');
}
```

#### "Model not found"
```typescript
try {
	await llm.complete({ prompt: "...", model: 'unknown-model' });
} catch (error) {
	// Requested model doesn't exist
	const models = llm.listModels();
	console.log('Available models:', models.map(m => m.id));
}
```

### Error Handling Pattern

```typescript
async safeLLMRequest(prompt: string, tier: PerformanceTier = 'balanced'): Promise<string | null> {
	const llm = this.app.plugins.plugins['llm-connector']?.api;
	
	// Check availability
	if (!llm) {
		console.warn('LLM Connector plugin not installed');
		return null;
	}
	
	if (!llm.isReady()) {
		console.warn('No LLM providers configured');
		return null;
	}
	
	// Make request with error handling
	try {
		const result = await llm.complete({ prompt, tier });
		return result.text;
	} catch (error) {
		console.error('LLM request failed:', error);
		
		// Optionally notify user
		if (error instanceof Error) {
			new Notice(`AI request failed: ${error.message}`);
		}
		
		return null;
	}
}
```

---

## Versioning & Compatibility

### API Version

Check the API version to ensure compatibility:

```typescript
const llm = this.app.plugins.plugins['llm-connector']?.api;
console.log('LLM Connector API version:', llm.version);

// Version format: MAJOR.MINOR.PATCH (semantic versioning)
// Current: 1.0.0
```

### Breaking Changes

LLM Connector follows semantic versioning:
- **MAJOR** version changes indicate breaking API changes
- **MINOR** version changes add backward-compatible features
- **PATCH** version changes are backward-compatible bug fixes

### Checking Features

```typescript
const llm = this.app.plugins.plugins['llm-connector']?.api;

// Check if specific method exists (for future features)
if (typeof llm.stream === 'function') {
	// Streaming is available
}

if (typeof llm.isReady === 'function') {
	// isReady() method is available
}
```

### Minimum Version Recommendation

For production plugins, we recommend requiring LLM Connector **>= 1.0.0** for all features documented here.

---

## Support

- **GitHub Issues**: Report bugs or request features at the GitHub repository
- **Source Code**: Review [`src/api.ts`](src/api.ts) for implementation details

