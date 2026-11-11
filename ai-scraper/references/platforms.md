# Platform options

| Platform | Actor | Markdown field | Extra options |
| --- | --- | --- | --- |
| chatgpt | scraper.chatgpt | result_text | --web-search, --shopping, --should-fetch-share-link |
| gemini | scraper.gemini | result_text | --shopping |
| copilot | scraper.copilot | result_text | --mode, --should-fetch-share-link |
| perplexity | scraper.perplexity | result_text | --web-search, --should-fetch-share-link |
| grok | scraper.grok | full_response | --mode, --should-fetch-share-link |
| alexa | scraper.alexa | md_text | None |
| google-ai-mode (aimode) | scraper.aimode | result_md | --shopping, --location, --uule, --url, --should-fetch-share-link |
| google-ai-overview (overview) | scraper.overview | content | --shopping, --location, --uule, --should-fetch-share-link |

Common options: `--country` (default US), `--webhook <url>`, `--data <JSON|@file>`, `--json`, `-o <file>`, `--no-wait`, `--timeout <seconds>`, `--interval <seconds>`. Do not set a webhook unless requested. Shopping/search booleans use server defaults if omitted.

Copilot modes: `search` (default), `smart`, `chat`, `reasoning`, `study`. Grok modes: `MODEL_MODE_AUTO` (default), `MODEL_MODE_FAST`, `MODEL_MODE_EXPERT`.

`location` and `uule` are mutually exclusive. Google AI Mode's `--url` sends only the URL and discards other input fields, including prompt and country. Other platforms do not accept `--url`.

For a complete body, put snake_case platform fields inside `input`:

```bash
scrapeless ai chatgpt --data '{"input":{"prompt":"Recommend museums in Tokyo","country":"JP","web_search":true,"shopping":false}}' --json
```

Explicit CLI options override JSON fields, which override defaults. The CLI sets the actor. Default text output is extracted from `task_result` using the Markdown field above; `--json` retains the task response.
