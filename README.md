# LLM Connector for Obsidian

Centralized LLM provider management for Obsidian. Configure AI providers once, let all your plugins use them through a simple, standardized API.

## Phase 1 MVP Status

**Current Version:** 0.1.0 (Ollama-Only MVP)

This is a working MVP focused on **Ollama** (local-first AI). Additional cloud providers (OpenRouter, OpenAI, Anthropic) will be added in Phase 2.

**What Works:**
- ✅ Ollama provider integration
- ✅ Performance tier system (6 tiers with automatic fallback)
- ✅ Full settings UI for tier configuration
- ✅ Public API for other plugins
- ✅ LLM Tester reference plugin included

---

## Features

### For Users
- **Local-First AI**: Run models locally with Ollama (privacy-focused, no API keys)
- **Performance Tiers**: Configure 6 performance tiers (fast, balanced, advanced, thinking, code, embedding)
- **Automatic Fallback**: If a tier isn't configured, automatically falls back to the next best option
- **Simple Setup**: Enable provider, assign models to tiers, done

### For Plugin Developers
- **Unified API**: One API for all LLM providers - no need to implement provider-specific code
- **Tier-Based Requests**: Request "balanced" tier instead of hardcoding model names
- **Graceful Degradation**: Plugin works even if LLM Connector isn't installed
- **Reference Implementation**: LLM Tester plugin shows exactly how to integrate

---

## Getting Started

### Prerequisites

1. **Install Ollama** (free, local AI runtime)
   ```bash
   # Linux/Mac
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Or download from: https://ollama.com/download
   ```

2. **Pull a Model**
   ```bash
   # Start Ollama server
   ollama serve
   
   # Pull a model (in another terminal)
   ollama pull llama3.2      # Recommended: 3B model, good balance
   ollama pull phi4          # Alternative: 14B model, higher quality
   ollama pull granite3.2:2b # Alternative: 2.5B model, faster
   ```

3. **Verify Ollama is Running**
   ```bash
   curl http://localhost:11434/api/tags
   # Should return JSON with your installed models
   ```

### Plugin Installation

1. This plugin is located at: `.obsidian/plugins/llm-connector/`
2. Open Obsidian Settings → **Community plugins**
3. Turn **OFF** "Safe mode" (if needed)
4. Find **LLM Connector** in the list
5. Toggle it **ON**

### Configuration

1. Open **Settings → LLM Connector**

2. **Enable Ollama Provider:**
   - Toggle "Enable Ollama" ON
   - Base URL: `http://localhost:11434` (default)
   - Click "Test connection"
   - Should show: ✓ Connected - X models available

3. **Assign Models to Tiers:**
   - **Balanced** (recommended): Select your preferred general-purpose model (e.g., `llama3.2`)
   - **Fast** (optional): Select a smaller model for quick tasks (e.g., `granite3.2:2b`)
   - **Advanced** (optional): Select a larger model for complex tasks (e.g., `phi4`)
   - **Thinking** (optional): For reasoning tasks (can use same as Advanced)
   - **Code** (optional): For code generation (can use same as Balanced)
   - **Embedding** (optional): For vector embeddings (e.g., `nomic-embed-text`)

4. **Fallback Preferences:**
   - Default tier: **Balanced** (used when plugin doesn't specify)
   - Notification mode: **Console** (or "Notice" to show Obsidian notifications)
   - Show once per session: **ON** (reduce notification spam)

5. Click outside settings to save (auto-saves)

### Verify It Works

1. Open **Settings → Community plugins**
2. Find **LLM Tester** in the list
3. Toggle it **ON**
4. Open any note
5. Run command (Ctrl/Cmd + P): `Prompt and insert`
6. Select tier: **Balanced**
7. Enter prompt: `Write a haiku about productivity`
8. Click **Generate**
9. Response should be inserted at cursor!

---

## Performance Tiers

The tier system lets you configure different models for different use cases:

| Tier | Use Case | Example Models | Fallback Chain |
|------|----------|----------------|----------------|
| **Fast** | Quick responses, simple tasks | granite3.2:2b (2.5B) | fast → balanced → advanced |
| **Balanced** | General-purpose, most tasks | llama3.2 (3B), gemma3 (4.3B) | balanced → advanced → fast |
| **Advanced** | Complex reasoning, long context | phi4 (14.7B), deepseek-r1 | advanced → balanced → fast |
| **Thinking** | Deep reasoning, problem-solving | deepseek-r1, phi4 | thinking → advanced → balanced → fast |
| **Code** | Code generation, review | deepseek-coder, codellama | code → advanced → balanced → fast |
| **Embedding** | Vector embeddings, semantic search | nomic-embed-text | embedding ONLY (no fallback) |

**How Fallback Works:**
- If you request "advanced" tier but haven't configured it, the system automatically falls back to "balanced"
- If "balanced" also isn't configured, it falls back to "fast"
- Notifications show which tier was actually used
- Embedding tier NEVER falls back (incompatible with chat models)

---

## API for Plugin Developers

### Basic Usage

```typescript
import { Plugin, Notice } from 'obsidian';

export default class YourPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'example-command',
			name: 'Example LLM Command',
			callback: async () => {
				// Get LLM Connector API
				const llm = this.app.plugins.plugins['llm-connector']?.api;
				
				if (!llm) {
					new Notice('LLM Connector plugin not installed');
					return;
				}
				
				try {
					// Request completion using tier system
					const result = await llm.complete({
						prompt: "Summarize this in 3 bullets: ...",
						tier: 'balanced'  // or 'fast', 'advanced', 'thinking', 'code'
					});
					
					// Use the response
					console.log(result.text);
					new Notice(`Response: ${result.text}`);
					
				} catch (error) {
					new Notice(`Error: ${error.message}`);
				}
			}
		});
	}
}
```

### API Reference

#### `complete(options: CompletionOptions): Promise<CompletionResult>`

Generate a completion with the LLM.

**Options:**
```typescript
interface CompletionOptions {
	prompt: string;                 // Required: the prompt text
	tier?: PerformanceTier;         // Optional: 'fast' | 'balanced' | 'advanced' | 'thinking' | 'code' | 'embedding'
	model?: string;                 // Optional: override tier with specific model name
	provider?: string;              // Optional: force specific provider
	systemPrompt?: string;          // Optional: system message (for supported models)
	temperature?: number;           // Optional: 0.0-2.0, controls randomness
	maxTokens?: number;            // Optional: max tokens to generate
	topP?: number;                 // Optional: nucleus sampling
	stop?: string[];               // Optional: stop sequences
}
```

**Result:**
```typescript
interface CompletionResult {
	text: string;                  // Generated text
	model: string;                 // Model that was used
	provider: string;              // Provider that was used
	tokens: {
		prompt: number;            // Tokens in prompt
		completion: number;        // Tokens in completion
		total: number;             // Total tokens
	};
	requestedTier?: string;        // Tier you requested
	actualTier?: string;           // Tier that was actually used
	fallbackOccurred?: boolean;    // Whether fallback happened
	fallbackReason?: string;       // Why fallback occurred
}
```

#### `isReady(): boolean`

Check if at least one provider is configured and ready.

```typescript
const llm = this.app.plugins.plugins['llm-connector']?.api;
if (llm?.isReady()) {
	// Safe to call complete()
}
```

### Best Practices

1. **Always check if API exists:**
   ```typescript
   const llm = this.app.plugins.plugins['llm-connector']?.api;
   if (!llm) {
   	// Gracefully degrade or show helpful message
   	return;
   }
   ```

2. **Use tiers, not hardcoded models:**
   ```typescript
   // ✅ Good - tier-based
   await llm.complete({ prompt: "...", tier: 'balanced' });
   
   // ❌ Avoid - hardcoded model
   await llm.complete({ prompt: "...", model: 'llama3.2' });
   ```

3. **Handle errors gracefully:**
   ```typescript
   try {
   	const result = await llm.complete({ prompt: "...", tier: 'balanced' });
   } catch (error) {
   	new Notice('LLM request failed. Check settings.');
   	console.error('LLM error:', error);
   }
   ```

4. **Respect fallback metadata:**
   ```typescript
   const result = await llm.complete({ prompt: "...", tier: 'advanced' });
   if (result.fallbackOccurred) {
   	console.log(`Fell back from ${result.requestedTier} to ${result.actualTier}`);
   }
   ```

### Reference Implementation

See `.obsidian/plugins/llm-tester/` for a complete working example:
- **Files:** `src/main.ts`, `src/PromptModal.ts`
- **Total code:** ~198 lines
- **Features:** Tier selection, prompt input, response insertion, error handling

---

## Troubleshooting

### Plugin doesn't appear in settings
- Ensure `manifest.json` exists in `.obsidian/plugins/llm-connector/`
- Restart Obsidian completely
- Check console (Ctrl+Shift+I) for errors

### "Test connection" fails
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- If Ollama isn't running: `ollama serve` (in terminal)
- Check base URL in settings (default: `http://localhost:11434`)
- Check firewall isn't blocking localhost:11434

### No models available
- Pull at least one model: `ollama pull llama3.2`
- Click "Test connection" again to refresh model list
- Check models are installed: `ollama list`

### LLM request fails with "No tier configured"
- Go to Settings → LLM Connector
- Assign at least one model to the "Balanced" tier
- This is the default tier used when plugins don't specify one

### Fallback keeps happening
- Check which tier is being requested in console
- Assign a model to that tier in settings
- Or let fallback work automatically (that's the design!)

### Response is slow
- Use "Fast" tier instead of "Balanced" or "Advanced"
- Smaller models (2B-3B params) are faster than larger models (14B+)
- Ollama performance depends on your hardware (CPU/GPU)

### Consumer plugin can't find API
```typescript
const llm = this.app.plugins.plugins['llm-connector']?.api;
if (!llm) {
	console.log('LLM Connector not found');
	// Check: Is LLM Connector enabled in settings?
	// Check: Is it loaded before your plugin?
}
```

---

## Current Limitations (Phase 1 MVP)

- **Ollama only**: Cloud providers (OpenRouter, OpenAI, Anthropic) coming in Phase 2
- **No streaming**: Responses arrive all at once (due to Obsidian API limitations)
- **No cost tracking**: Only needed for cloud providers (Phase 2)
- **No vision tier**: Multimodal support planned for Phase 3

---

## Roadmap

### Phase 2: Multi-Provider Support
- OpenRouter provider (unified cloud API)
- OpenAI provider (GPT models)
- Anthropic provider (Claude models)
- Cost tracking and limits for paid providers
- True streaming support (if Obsidian API permits)

### Phase 3: Advanced Features
- Vision tier (image understanding)
- Conversation history (multi-turn chats)
- Usage analytics dashboard
- Custom provider SDK

---

## Development

### Build Commands
```bash
npm install          # Install dependencies
npm run dev          # Watch mode (auto-rebuild on changes)
npm run build        # Production build (with type checking)
npm run lint         # Run ESLint
```

### Testing
1. Build: `npm run build`
2. Reload Obsidian: **Ctrl+R** (or Cmd+R)
3. Check console: **Ctrl+Shift+I** (or Cmd+Opt+I)
4. Use LLM Tester plugin to validate

### File Structure
```
llm-connector/
├── src/
│   ├── main.ts                      # Plugin entry point
│   ├── api.ts                       # Public API interface
│   ├── settings.ts                  # Settings structure
│   ├── types.ts                     # TypeScript types
│   ├── models/
│   │   ├── ProviderManager.ts       # Provider lifecycle
│   │   ├── ModelRegistry.ts         # Model management
│   │   └── TierResolver.ts          # Tier → model resolution
│   ├── providers/
│   │   ├── LLMProvider.ts           # Abstract provider base
│   │   └── OllamaProvider.ts        # Ollama implementation
│   ├── ui/
│   │   └── LLMConnectorSettingTab.ts # Settings UI
│   └── utils/
│       └── NotificationManager.ts   # Fallback notifications
├── manifest.json
├── main.js                          # Compiled output (22KB)
└── README.md
```

---

## License

MIT

---

## Credits

Built with ❤️ for the Obsidian community.

**Philosophy:** Local-first, privacy-focused AI that respects user control.
