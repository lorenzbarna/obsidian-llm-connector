# Changelog

All notable changes to LLM Connector will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-06

### 🎉 Initial Public Release

First stable release of LLM Connector - a centralized LLM provider management plugin for Obsidian.

### Added

#### Core Features
- **Multi-Provider Support**: Integration with 4 LLM providers
  - Ollama (local, privacy-focused)
  - OpenRouter (unified cloud API, 200+ models)
  - OpenAI (GPT models)
  - Anthropic (Claude models)
- **Performance Tier System**: 6 configurable tiers with automatic fallback
  - `fast` - Quick responses, simple tasks
  - `balanced` - General-purpose, most tasks (default)
  - `advanced` - Complex reasoning, long context
  - `thinking` - Deep reasoning, problem-solving
  - `code` - Code generation and review
  - `embedding` - Vector embeddings (no fallback)
- **Automatic Fallback**: Smart tier fallback chains (e.g., advanced → balanced → fast)
- **Public API**: Clean TypeScript API for other Obsidian plugins to consume

#### Provider Features
- **Ollama Provider**:
  - Local model support (no API key needed)
  - Automatic model discovery
  - Token counting and performance metrics
  - Embedding support with nomic-embed-text
- **OpenRouter Provider**:
  - Access to 200+ AI models through single API
  - Model pricing metadata
  - Support for GPT, Claude, Llama, Mistral, and more
- **OpenAI Provider**:
  - GPT-4o, GPT-4-turbo, GPT-4o-mini support
  - O1 reasoning models (o1-preview)
  - Text embeddings (ada-002)
- **Anthropic Provider**:
  - Claude Opus 4.5, Sonnet 4.5, Haiku 4.5
  - Claude 3.5 Sonnet and Claude 3 series
  - 200k context window support

#### UI & Settings
- **Comprehensive Settings UI**:
  - Provider configuration (enable/disable, API keys, base URLs)
  - Test connection functionality per provider
  - Tier assignment with model dropdowns
  - Fallback notification preferences
  - Model filtering (embedding vs non-embedding)
- **Notification System**:
  - Configurable fallback notifications (console, Notice, both, none)
  - Once-per-session option to reduce spam
  - Clear fallback reason reporting

#### Developer Experience
- **Complete API Documentation** (API.md):
  - All 7 API methods documented
  - TypeScript type definitions
  - 8+ working code examples
  - Best practices guide
  - Error handling patterns
- **Reference Implementation**:
  - LLM Tester plugin included as working example
  - Demonstrates tier selection, prompt input, response insertion
- **Type Safety**:
  - Full TypeScript support with strict mode
  - Exported types for consumer plugins
  - No implicit `any` types

#### Architecture
- **Provider Abstraction**: Clean `LLMProvider` base class
- **Model Registry**: Centralized model management with filtering
- **Tier Resolver**: Smart tier-to-model resolution with fallback logic
- **Notification Manager**: Deduplication and session tracking

#### Documentation
- **README.md**: Comprehensive user guide
  - Getting started with Ollama (local)
  - Cloud provider setup (OpenRouter, OpenAI, Anthropic)
  - Cost comparison table
  - Privacy & security explanations
  - Troubleshooting per provider
  - API quick start guide
- **API.md**: Complete API reference for plugin developers
- **LICENSE**: MIT License

### Technical Details

- **Build System**: esbuild for fast compilation
- **Code Quality**:
  - TypeScript strict mode (all flags enabled)
  - ESLint with Obsidian plugin rules (0 errors, 0 warnings)
  - Tab-based indentation (4-space display)
- **Bundle Size**: 37KB compiled
- **Minimum Obsidian Version**: 0.15.0
- **Dependencies**: Obsidian API only (no external runtime dependencies)

### Known Limitations

- **Streaming**: Simulated streaming only (Obsidian API limitation with `requestUrl`)
- **Mobile**: Desktop-only for now (mobile testing planned for 1.1.0)
- **Vision Models**: Not yet supported (planned for future release)
- **Conversation History**: Each request is independent (multi-turn chat not implemented)

### Security & Privacy

- ✅ No telemetry or analytics
- ✅ No hardcoded API keys or secrets
- ✅ API keys stored locally in Obsidian settings (encrypted by Obsidian)
- ✅ No data logging or external transmission by plugin
- ✅ Open source - full code audit available

### Breaking Changes

None (initial release)

---

## Future Roadmap

See [README.md](README.md#roadmap) for planned features:
- Mobile support (iOS/Android testing)
- True streaming (if Obsidian API permits)
- Vision tier for multimodal models
- Conversation history / multi-turn chat
- Cost tracking and usage analytics
- Custom provider SDK

---

## Links

- **GitHub Repository**: https://github.com/lorenzbarna/obsidian-llm-connector
- **Issue Tracker**: https://github.com/lorenzbarna/obsidian-llm-connector/issues
- **Documentation**: See [README.md](README.md) and [API.md](API.md)

---

**Note:** Version 1.0.0 represents the first stable, production-ready release. The plugin has been thoroughly tested and is ready for use in production vaults. All 4 providers are fully functional, and the API is considered stable.
