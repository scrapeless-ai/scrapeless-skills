---
name: ai-scraper
description: Query AI platforms through Scrapeless and collect their answers, citations, and shopping results. Use for ChatGPT, Gemini, Copilot, Perplexity, Grok, Alexa, Google AI Mode, or AI Overview scraping and comparisons.
license: MIT
metadata:
  runtime: Requires Node.js 22+, the scrapeless CLI, a Scrapeless API token, and network access.
---

# AI Scraper

Use `scrapeless ai` to submit prompts to the requested platform. Preserve the user's platform, prompt, country, and requested output. This queries platform answers; ordinary Google search results use the separate scraping-api skill.

## Setup

Check `scrapeless --version`; if missing, install with `npm install -g scrapeless` or use `npx --package scrapeless scrapeless` in place of `scrapeless`. Authentication uses `~/.scrapeless/config.json` (`apiKey`, legacy `api_token`), then `SCRAPELESS_API_TOKEN`, then `SCRAPELESS_API_KEY`. `SCRAPELESS_CONFIG_PATH` overrides the config path. A `.env` file is not loaded automatically. Use `scrapeless auth status` to diagnose authentication; never print `config get apiKey` into logs.

## Execute

```bash
scrapeless ai platforms
scrapeless ai chatgpt "Explain web scraping" --web-search true --shopping false --json
scrapeless ai google-ai-mode "Coffee shops in Paris" --location 'Paris,France' --json
scrapeless ai gemini "Explain quantum computing" -o answer.md
```

Read [platform options](references/platforms.md) when selecting platform-specific flags or submitting a complete JSON request. Boolean options require `true` or `false`. `--json` retains citations and other structured fields; default output extracts Markdown only. Use `-o <file>` for file output.

Creation polls every 5 seconds for up to 300 seconds. For long-running work:

```bash
scrapeless ai chatgpt "Explain web scraping" --no-wait
scrapeless ai result TASK_ID --platform chatgpt --wait --timeout 300 --interval 5 --json
```

`success` and `failed` are terminal statuses. A polling timeout can exit zero with a pending response: inspect the status, retain the task ID, and continue reading that task when appropriate. Never report a pending response as a completed answer or submit a duplicate merely because polling timed out. Report the returned failure reason on errors. An empty Google AI Overview `content` can be a successful result with no overview.
