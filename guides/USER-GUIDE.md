# User Guide for LLM Connector

## Provider-Specific Setup

**LLM Connector** supports multiple providers, even at once. This way you can choose the
best model for each task and optimize costs. Below are setup instructions for all current
Providers. More are to come in future updates.

### Self-hosted Ollama Server ("free" option)

1. **Install Ollama** (free, local AI runtime)
   - **Linux/Mac:**
     ```bash
     curl -fsSL https://ollama.com/install.sh | sh
     ```
   - **Windows:**
     Download installer from [ollama.com/download](https://ollama.com/download)

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

4. **Configure LLM Connector**
   - Open Obsidian Settings → LLM Connector
   - Activate Ollama provider and set API URL to `http://localhost:11434`
   - Assign models to tiers (e.g., "balanced" → llama3.2)


### OpenRouter (Unified Cloud API)

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

- Pay-per-use pricing (~$0.002-0.06 per 1M tokens)
- More information at [OpenAI Pricing](https://openai.com/api/pricing/)
- Best for: GPT-specific features, enterprise reliability

**Setup:**
1. Create account at [platform.openai.com](https://platform.openai.com/)
2. Add payment method under Billing
3. Generate API key from
   [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
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

- Pay-per-use pricing ($0.003-0.08 per 1M tokens)
- More information at
  [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Best for: Long context, complex reasoning, ethical AI

**Setup:**
1. Create account at [console.anthropic.com](https://console.anthropic.com/)
2. Add payment method under Settings
3. Generate API key from
   [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
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

---

## Troubleshooting

Error Logs can be found in the console (Ctrl+Shift+I) under the "Console" tab. Look for
messages tagged with "LLM Connector" to filter relevant logs. Common issues and their
solutions are listed below.

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
- Verify your API key is correct
  (copy-paste from [openrouter.ai/keys](https://openrouter.ai/keys))
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
- Verify your API key is correct
  (from [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
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
- Verify your API key is correct
  (from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys))
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


## Support

- **GitHub Issues**: Report bugs or request features at the GitHub repository

