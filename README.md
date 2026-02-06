# LLM Connector for Obsidian

Centralized LLM provider management for Obsidian. Configure AI providers once, let all your plugins use them through a simple, standardized API.

## Status

**Current Version:** 1.0.0 🎉

A production-ready LLM integration plugin supporting both local and cloud AI providers.

**What Works:**
- ✅ **4 Provider Integrations**: Ollama (local), OpenRouter, OpenAI, Anthropic
- ✅ Performance tier system (6 tiers with automatic fallback)
- ✅ Full settings UI for all providers and tier configuration
- ✅ Public API for other plugins
- ✅ LLM Tester reference plugin included
- ✅ Comprehensive error handling and graceful degradation

---

## Features

### For Users
- **Local-First AI**: Run models locally with Ollama (privacy-focused, no API keys needed)
- **Cloud AI Support**: Connect to OpenRouter, OpenAI, or Anthropic for cloud-based models
- **Performance Tiers**: Configure 6 performance tiers (fast, balanced, advanced, thinking, code, embedding)
- **Automatic Fallback**: If a tier isn't configured, automatically falls back to the next best option
- **Multi-Provider**: Enable multiple providers simultaneously, assign different models per tier
- **Simple Setup**: Enable provider(s), assign models to tiers, done

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

## Cloud Provider Setup

In addition to local Ollama, LLM Connector supports three major cloud AI providers. Each requires an API key.

### OpenRouter (Unified Cloud API)

**What is OpenRouter?**
- Access 200+ AI models through a single API
- Pay-per-use pricing (typically $0.001-0.10 per 1M tokens)
- Supports GPT, Claude, Llama, Mistral, and many more
- Best for: Flexibility and cost optimization

**Setup:**
1. Create account at [openrouter.ai](https://openrouter.ai/)
2. Get API key from [openrouter.ai/keys](https://openrouter.ai/keys)
3. Add credits to your account (minimum $5)
4. In LLM Connector settings:
   - Toggle "Enable OpenRouter" ON
   - Paste your API key
   - Base URL: `https://openrouter.ai/api/v1` (default)
   - Click "Test connection"
5. Assign OpenRouter models to tiers (e.g., `anthropic/claude-3.5-sonnet`)

**Recommended Models:**
- **Fast:** `google/gemini-flash-1.5` (cheap, quick)
- **Balanced:** `anthropic/claude-3.5-sonnet` (best all-around)
- **Advanced:** `anthropic/claude-opus-4.5` (maximum quality)
- **Thinking:** `deepseek/deepseek-r1` (reasoning tasks)
- **Code:** `anthropic/claude-3.5-sonnet` (excellent for code)

### OpenAI (GPT Models)

**What is OpenAI?**
- Original creator of GPT models
- Industry-leading language models
- Pay-per-use pricing ($0.002-0.06 per 1M tokens)
- Best for: GPT-specific features, enterprise reliability

**Setup:**
1. Create account at [platform.openai.com](https://platform.openai.com/)
2. Add payment method under Billing
3. Generate API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. In LLM Connector settings:
   - Toggle "Enable OpenAI" ON
   - Paste your API key
   - Base URL: `https://api.openai.com/v1` (default)
   - Click "Test connection"
5. Assign OpenAI models to tiers (e.g., `gpt-4o`)

**Recommended Models:**
- **Fast:** `gpt-4o-mini` (cheap, quick, smart)
- **Balanced:** `gpt-4o` (best all-around GPT)
- **Advanced:** `gpt-4-turbo` (maximum context window)
- **Thinking:** `o1-preview` (deep reasoning)
- **Code:** `gpt-4o` (excellent for code)
- **Embedding:** `text-embedding-ada-002` (vectors)

### Anthropic (Claude Models)

**What is Anthropic?**
- Creator of Claude models
- Known for safety and helpfulness
- Pay-per-use pricing ($0.003-0.08 per 1M tokens)
- Best for: Long context, complex reasoning, ethical AI

**Setup:**
1. Create account at [console.anthropic.com](https://console.anthropic.com/)
2. Add payment method under Settings
3. Generate API key from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
4. In LLM Connector settings:
   - Toggle "Enable Anthropic" ON
   - Paste your API key
   - Base URL: `https://api.anthropic.com/v1` (default)
   - Click "Test connection"
5. Assign Claude models to tiers (e.g., `claude-3.5-sonnet`)

**Recommended Models:**
- **Fast:** `claude-haiku-4.5` (fastest Claude)
- **Balanced:** `claude-sonnet-4.5` (best all-around)
- **Advanced:** `claude-opus-4.5` (maximum quality)
- **Thinking:** `claude-opus-4.5` (excellent reasoning)
- **Code:** `claude-sonnet-4.5` (best for code)

**Note:** Anthropic does not offer embedding models.

### Cost Comparison

Approximate costs for generating 1 million tokens (completion):

| Provider | Fast | Balanced | Advanced |
|----------|------|----------|----------|
| **Ollama** | Free (local) | Free (local) | Free (local) |
| **OpenRouter** | $0.001-0.01 | $0.01-0.05 | $0.05-0.10 |
| **OpenAI** | $0.002 (mini) | $0.01 (4o) | $0.03 (turbo) |
| **Anthropic** | $0.003 (haiku) | $0.015 (sonnet) | $0.08 (opus) |

**Tip:** Use Ollama for development and prototyping (free), switch to cloud for production or when you need advanced capabilities.

### Privacy & Data Handling

**What data is sent where:**

- **Ollama (Local)**: All data stays on your machine. No external servers contacted.
- **OpenRouter**: Your prompts and responses are sent to OpenRouter, which forwards to the selected model provider. Data is not stored by OpenRouter (see their [privacy policy](https://openrouter.ai/privacy)).
- **OpenAI**: Your prompts and responses are sent to OpenAI servers. By default, API data is not used for training (see [data usage policies](https://platform.openai.com/docs/data-usage-policies)).
- **Anthropic**: Your prompts and responses are sent to Anthropic servers. API data is not used for training (see [privacy policy](https://www.anthropic.com/privacy)).

**This plugin:**
- ✅ Does NOT store, log, or transmit any of your data
- ✅ Does NOT collect telemetry or analytics
- ✅ Stores API keys locally in Obsidian settings (encrypted by Obsidian)
- ✅ Only sends data when you explicitly trigger an LLM request
- ✅ Open source - you can audit the code yourself

**Recommendations:**
- Use Ollama for sensitive/private notes (100% local)
- Use cloud providers for non-sensitive tasks or when you need advanced capabilities
- Review each provider's privacy policy before use
- Never include API keys, passwords, or secrets in your prompts

---

## Performance Tiers

The tier system lets you configure different models for different use cases:

| Tier | Use Case | Example Models | Fallback Chain |
|------|----------|----------------|----------------|
| **Fast** | Quick responses, simple tasks | granite3.2:2b, gpt-4o-mini, claude-haiku | fast → balanced → advanced |
| **Balanced** | General-purpose, most tasks | llama3.2, gpt-4o, claude-sonnet | balanced → advanced → fast |
| **Advanced** | Complex reasoning, long context | phi4, gpt-4-turbo, claude-opus | advanced → balanced → fast |
| **Thinking** | Deep reasoning, problem-solving | deepseek-r1, o1-preview, claude-opus | thinking → advanced → balanced → fast |
| **Code** | Code generation, review | deepseek-coder, gpt-4o, claude-sonnet | code → advanced → balanced → fast |
| **Embedding** | Vector embeddings, semantic search | nomic-embed-text, text-embedding-ada-002 | embedding ONLY (no fallback) |

**How Fallback Works:**
- If you request "advanced" tier but haven't configured it, the system automatically falls back to "balanced"
- If "balanced" also isn't configured, it falls back to "fast"
- Notifications show which tier was actually used
- Embedding tier NEVER falls back (incompatible with chat models)

---

## API for Plugin Developers

LLM Connector exposes a clean, typed API for other Obsidian plugins to consume. This allows plugins to access AI capabilities without implementing provider-specific code.

**📘 Complete API documentation: [API.md](API.md)**

### Quick Start

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

### General Issues

#### Plugin doesn't appear in settings
- Ensure `manifest.json` exists in `.obsidian/plugins/llm-connector/`
- Restart Obsidian completely
- Check console (Ctrl+Shift+I) for errors

#### LLM request fails with "No tier configured"
- Go to Settings → LLM Connector
- Assign at least one model to the "Balanced" tier
- This is the default tier used when plugins don't specify one

#### Fallback keeps happening
- Check which tier is being requested in console
- Assign a model to that tier in settings
- Or let fallback work automatically (that's the design!)

#### Consumer plugin can't find API
```typescript
const llm = this.app.plugins.plugins['llm-connector']?.api;
if (!llm) {
	console.log('LLM Connector not found');
	// Check: Is LLM Connector enabled in settings?
	// Check: Is it loaded before your plugin?
}
```

### Ollama-Specific Issues

#### "Test connection" fails
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- If Ollama isn't running: `ollama serve` (in terminal)
- Check base URL in settings (default: `http://localhost:11434`)
- Check firewall isn't blocking localhost:11434

#### No models available
- Pull at least one model: `ollama pull llama3.2`
- Click "Test connection" again to refresh model list
- Check models are installed: `ollama list`

#### Response is slow
- Use "Fast" tier instead of "Balanced" or "Advanced"
- Smaller models (2B-3B params) are faster than larger models (14B+)
- Ollama performance depends on your hardware (CPU/GPU)
- Consider using cloud providers for faster response times

### Cloud Provider Issues

#### OpenRouter "Test connection" fails with 401 Unauthorized
- Verify your API key is correct (copy-paste from [openrouter.ai/keys](https://openrouter.ai/keys))
- Check you have credits in your account (Settings → Credits)
- API key must start with `sk-or-v1-`

#### OpenRouter "402 Payment Required"
- Add credits to your OpenRouter account
- Minimum is typically $5
- Go to [openrouter.ai/credits](https://openrouter.ai/credits)

#### OpenRouter "429 Rate Limit"
- You're making too many requests too quickly
- Wait a few seconds and try again
- Consider increasing timeout in settings
- Or spread requests over time

#### OpenAI "Test connection" fails with 401 Unauthorized
- Verify your API key is correct (from [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
- Ensure you've added a payment method (even if you have free credits)
- API key must start with `sk-`

#### OpenAI "429 Rate Limit"
- Free tier has strict rate limits
- Upgrade to paid tier for higher limits
- Or wait and retry (limits reset periodically)

#### OpenAI "Quota exceeded"
- You've used all your credits
- Add more credits to your account
- Check usage at [platform.openai.com/usage](https://platform.openai.com/usage)

#### Anthropic "Test connection" fails with 401 Unauthorized
- Verify your API key is correct (from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys))
- Ensure you've added a payment method
- API key must start with `sk-ant-`

#### Anthropic "529 Service Overloaded"
- Anthropic servers are temporarily overloaded
- Wait 30-60 seconds and try again
- Consider configuring a fallback tier

#### Cloud provider request is slow
- Cloud API latency is typically 1-5 seconds
- Faster than local models for complex tasks
- Use "Fast" tier models (mini/haiku/flash) for quicker responses
- Check your internet connection

#### API key security concerns
- API keys are stored in Obsidian's settings file (data.json)
- Obsidian encrypts this file by default
- Never commit `data.json` to version control
- Regenerate keys if you suspect they're compromised
- Use separate API keys for different applications

### Error Messages Explained

**"Provider not found"**
- The requested provider isn't enabled in settings
- Enable the provider and click "Test connection"

**"Model not found"**
- The requested model isn't available from any enabled provider
- Check model name spelling
- Verify the provider that offers this model is enabled

**"Provider is not configured"**
- Provider is enabled but missing required settings (e.g., API key)
- Go to settings and complete the provider configuration

**"Tier resolution failed"**
- No model assigned to the requested tier
- And no fallback tier has a model assigned
- Assign at least one model to the "Balanced" tier

**"Embeddings not supported"**
- You requested embeddings from a provider/model that doesn't support them
- Use Ollama with `nomic-embed-text` or OpenAI with `text-embedding-ada-002`
- Note: Anthropic does not offer embedding models

---

## Current Limitations

- **No true streaming**: Responses arrive all at once (due to Obsidian API limitations with `requestUrl`)
- **No vision tier**: Multimodal support (image understanding) not yet implemented
- **No conversation history**: Each request is independent (multi-turn chat not supported yet)
- **Mobile untested**: Desktop-only for now (mobile testing planned)

---

## Roadmap

### Planned Features

- **Mobile support**: Test and optimize for iOS/Android
- **True streaming**: Real-time token streaming (if Obsidian API permits)
- **Vision tier**: Image understanding with multimodal models (GPT-4 Vision, Claude 3 Opus)
- **Conversation history**: Multi-turn chat support with context management
- **Cost tracking**: Usage analytics and spending limits for cloud providers
- **Custom providers**: SDK for adding your own provider implementations
- **Model caching**: Cache model lists to reduce API calls
- **Retry logic**: Automatic retry with exponential backoff for transient errors

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
│   │   ├── OllamaProvider.ts        # Ollama implementation
│   │   ├── OpenRouterProvider.ts    # OpenRouter implementation
│   │   ├── OpenAIProvider.ts        # OpenAI implementation
│   │   └── AnthropicProvider.ts     # Anthropic implementation
│   ├── ui/
│   │   └── LLMConnectorSettingTab.ts # Settings UI
│   └── utils/
│       └── NotificationManager.ts   # Fallback notifications
├── manifest.json
├── main.js                          # Compiled output (37KB)
├── LICENSE
├── README.md
└── API.md                           # API documentation
```

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**Lorenz Barna**
- GitHub: [@lorenzbarna](https://github.com/lorenzbarna)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

For bugs and feature requests, open an issue on GitHub.

---

## Credits

Built with ❤️ for the Obsidian community.

**Philosophy:** Local-first, privacy-focused AI that respects user control and enables seamless plugin integration.
