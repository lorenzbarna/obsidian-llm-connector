# LLM Connector for Obsidian

Centralized LLM provider management for Obsidian. Configure AI providers once, let other plugins use them through a simple, standardized API. Be provider-agnostic by using the tier system (Fast, Balanced, Advanced, Thinking, Code, Embedding) instead of hardcoding model names. Currently Supports Ollama, OpenRouter, OpenAI, and Anthropic. More to come!

**How it works:**
1. Providers are connected once in the settings and supply available models to the connector
2. You assign models to performance tiers (Fast, Balanced, Advanced, Thinking, Code, Embedding)
3. Other Plugins request completions via tier-based API

## Features

### For Users
- **4 Provider Integrations**: Ollama, OpenRouter, OpenAI, Anthropic
- **Performance Tier System**: Select models for 6 Tiers (Fast, Balanced, Advanced, Thinking, Code and Embedding)
- **Automatic Fallbacks**: If a tier isn't configured, it automatically falls back to the next best tier
- **Unified Settings**: Configure all providers in one place

### For Plugin Developers
- **Unified API**: One API for all LLM providers - no need to implement provider-specific code
- **Tier-Based Requests**: Request "balanced" tier instead of hardcoding model names
- **Reference Implementation**: LLM Tester plugin shows exactly how to integrate

---

## Getting Started

### Plugin Installation

1. Open Obsidian Settings → **Community plugins**
3. Click "Browse" and search for **LLM Connector**
4. Click "Install" and then toggle it **ON**

### Configuration

1. Open **Settings → LLM Connector**

2. Enable Providers (e.g. Ollama) 
   - Configure API settings
   - Press **Test connection** to verify connection and fetch model list
   - Should show "✓" next to Provider name

3. Assign Models to Tiers:
   - **Fast**: Select a smaller model for quick tasks (e.g., `granite3.2:2b`)
   - **Balanced**: Select your preferred general-purpose model (e.g., `llama3.2`)
   - **Advanced**: Select a larger model for complex tasks (e.g., `claude-sonnet-4.5` or `gpt-5`)
   - **Thinking**: For reasoning tasks (e.g., `deepseek-r1`)
   - **Code**: For code generation (e.g., `qwen2.5-coder` or `gpt-5.2-codex`)
   - **Embedding**: For vector embeddings (e.g., `nomic-embed-text`)

4. Miscellaneous Settings:
   - Default tier: **Balanced** (used when plugin doesn't specify)
   - Notification mode: **Console** (or "Notice" to show Obsidian notifications)
   - Show once per session: **ON** (reduce notification spam)

### Provider-Specific Setup

Find more information on setting up each provider in the **[User Guide](./guides/USER-GUIDE.md#provider-specific-setup)**. 

---

## Privacy & Data Handling

**What data is sent where:**

- **Ollama (Local)**: All data stays on your machine. No external servers contacted.
- **OpenRouter**: Your prompts and responses are sent to OpenRouter, which forwards to the selected model provider. Data is not stored by OpenRouter (see their [privacy policy](https://openrouter.ai/privacy)).
- **OpenAI**: Your prompts and responses are sent to OpenAI servers. By default, API data is not used for training (see [data usage policies](https://platform.openai.com/docs/data-usage-policies)).
- **Anthropic**: Your prompts and responses are sent to Anthropic servers. API data is not used for training (see [privacy policy](https://www.anthropic.com/privacy)).

**This plugin:**
- Does NOT store, log, or transmit any of your data
- Does NOT collect telemetry or analytics
- Stores API keys locally in Obsidian settings (encrypted by Obsidian)
- Only sends data when you explicitly trigger an LLM request
- Open source - you can audit the code yourself

---

## Performance Tiers

The tier system lets you configure different models for different use cases:

| Tier | Use Case | Example Models | Fallback Chain |
|------|----------|----------------|----------------|
| **Fast** | Quick responses, simple tasks | granite3.2:2b, gpt-4o-mini, claude-haiku | fast → balanced → advanced |
| **Balanced** | General-purpose, most tasks | llama3.2, gpt-4o, Phi4 | balanced → advanced → fast |
| **Advanced** | Complex reasoning, long context | phi4, gpt-4-turbo, claude-sonnet | advanced → balanced → fast |
| **Thinking** | Deep reasoning, problem-solving | deepseek-r1, o1-preview, claude-opus | thinking → advanced → balanced → fast |
| **Code** | Code generation, review | deepseek-coder, gpt-4o, claude-sonnet, qwen2.5-coder | code → advanced → balanced → fast |
| **Embedding** | Vector embeddings, semantic search | nomic-embed-text, text-embedding-ada-002 | embedding ONLY (no fallback) |

Examples are only current suggestions based on popular models. Do your own research and testing as the AI landscape evolves rapidly!

**How Fallback Works:**
- If you request "advanced" tier but haven't configured it, the system automatically falls back to "balanced"
- If "balanced" also isn't configured, it falls back to "fast"
- Notifications show which tier was actually used
- Embedding tier NEVER falls back (incompatible with chat models)

---

## API for Plugin Developers

LLM Connector exposes a clean, typed API for other Obsidian plugins to consume. This allows plugins to access AI capabilities without implementing provider-specific code and forcing the user to reconfigure providers for each plugin.

Find the Complete API documentation in the **[Dev Guide](./guides/DEV-GUIDE.md)**. An example usecase can be found in the **[LLM Tester plugin](https://github.com/lorenzodonini/obsidian-llm-tester)**.

---

## Troubleshooting

Find common issues and solutions in the **[Troubleshooting Part of the User Guide](./guides/USER-GUIDE.md#troubleshooting)**.

---

## Plugins using LLM Connector

- [Dynamic Contacts](https://github.com/lorenzbarna/dynamic-contacts) - Generate contact summaries, action items, and follow-ups using LLMs


---

## Roadmap

### Planned Features

- [ ] **Mobile support**: Test and optimize for iOS/Android
- [ ] **True streaming**: Real-time token streaming (if Obsidian API permits)
- [ ] **Vision tier**: Image understanding with multimodal models (GPT-4 Vision, Claude 3 Opus)
- [ ] **Conversation history**: Multi-turn chat support with context management
- [ ] **Cost tracking**: Usage analytics and spending limits for cloud providers
- [ ] **Custom providers**: SDK for adding your own provider implementations
- [ ] **Model caching**: Cache model lists to reduce API calls
- [ ] **Retry logic**: Automatic retry for generation tasks

---

## About AI use in Development

LLM Connector is an experiment in semi-automated development using AI. Big parts of the codebase and documentation were generated with the help of [OpenCode](https://opencode.ai/) using models like Claude Sonnet 4.5 and others. For me this is an attempt to find out what is currently possible with AI-assisted development and what its limitations are. I believe this to be a successful experiment and am happy with the results and especially think this plugin has potential to be useful, which is why I decided to release it as a community plugin. 

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

For bugs and feature requests, open an issue on GitHub.
