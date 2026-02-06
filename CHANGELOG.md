# Changelog

All notable changes to LLM Connector will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-06

Initial stable release of LLM Connector - centralized LLM provider management for Obsidian.

### Added

#### Core Features
- Multi-provider support: Ollama (local), OpenRouter, OpenAI, Anthropic
- Performance tier system with 6 configurable tiers (fast, balanced, advanced, thinking, code, embedding)
- Automatic fallback chains for graceful degradation
- Public API for other Obsidian plugins to consume

#### Providers
- Ollama provider: Local model support with automatic model detection and tagging
- OpenRouter provider: Access to 200+ models through unified API
- OpenAI provider: GPT-3.5, GPT-4, GPT-4o, O1 models
- Anthropic provider: Claude 2.x, Claude 3.x, Claude 4.x models

#### Settings UI
- Provider configuration with enable/disable toggles
- API key management (password fields)
- Test connection functionality per provider
- Tier assignment with model dropdowns
- Model filtering (embedding models shown only for embedding tier)
- Fallback notification preferences
- Configurable notification modes: console, Notice, both, or none
- Once-per-session notification option

#### Developer API
- Complete TypeScript API with strict type checking
- 7 public methods: complete, stream, embeddings, listModels, getProvider, listProviders, refreshModels
- Tier-based request system for provider-agnostic code
- Fallback metadata in completion results
- Exported types for consumer plugins

#### Documentation
- README.md with getting started guide, provider setup, and troubleshooting
- User guide with detailed provider configuration instructions
- Developer guide with API reference and code examples
- Mobile limitations documented
- Privacy and data handling explanations

#### Platform Support
- Desktop: Windows, macOS, Linux
- Mobile: iOS and Android (tested)
  - Cloud providers fully functional
  - Local Ollama does not work (localhost limitation)
  - Remote Ollama works via network/VPN

### Technical Details

- Build system: esbuild with TypeScript compilation
- TypeScript strict mode enabled (all flags)
- ESLint compliance: 0 errors, 0 warnings
- Bundle size: 37KB
- Minimum Obsidian version: 0.15.0
- No external runtime dependencies

### Known Limitations

- Streaming simulated via word-by-word yield (Obsidian requestUrl API limitation)
- Vision models not yet supported
- Conversation history not implemented (each request is independent)
- Embedding tier has no fallback (incompatible with chat models)

### Security

- No telemetry or analytics
- No hardcoded API keys or secrets
- API keys stored locally in Obsidian settings (encrypted)
- No data logging or external transmission by plugin
- Input validation on all user inputs
- Open source code available for audit

---

## Future Roadmap

Planned features for future releases:
- True streaming support (pending Obsidian API improvements)
- Vision tier for multimodal models
- Conversation history and multi-turn chat
- Cost tracking and usage analytics
- Custom provider SDK
- Model caching to reduce API calls
- Retry logic for transient failures

---

## Links

- GitHub Repository: https://github.com/lorenzbarna/obsidian-llm-connector
- Issue Tracker: https://github.com/lorenzbarna/obsidian-llm-connector/issues
- Documentation: See README.md and guides/
