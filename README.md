# LLM Connector

Centralized LLM provider management for Obsidian. One plugin to connect AI providers, all other plugins consume through a standardized internal API.

## Features

- **Unified Provider Management**: Configure multiple AI providers (Ollama, OpenRouter, OpenAI, Anthropic) in one place
- **Plugin API**: Expose a simple, consistent API for other Obsidian plugins to consume
- **Model Management**: Tag models by capability (fast, smart, multimodal) for easy selection
- **Local-First**: Supports local providers like Ollama for privacy-conscious users
- **Secure**: API keys stored in Obsidian's encrypted storage

## For Plugin Developers

Other plugins can integrate with LLM Connector to add AI features without implementing provider-specific code:

```typescript
const llm = this.app.plugins.plugins['llm-connector']?.api;
if (llm) {
	const response = await llm.complete({
		prompt: "Organize this contact info...",
		model: "smart"  // or specific model name
	});
}
```

See [API Documentation](./docs/API.md) for full details.

## Development

```bash
npm install
npm run dev  # Watch mode
npm run build  # Production build
npm run lint  # Run ESLint
```

## License

MIT
