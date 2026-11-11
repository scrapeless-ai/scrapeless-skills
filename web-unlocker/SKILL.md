---
name: web-unlocker
description: Fetch a single webpage through Scrapeless Web Unlocker, including JavaScript-rendered or protected pages. Use for HTML, Markdown, text, content extraction, screenshots, or network responses without an ongoing interactive browser session.
license: MIT
metadata:
  runtime: Requires Node.js 22+, the scrapeless CLI, a Scrapeless API token, and network access.
---

# Web Unlocker

Use `scrapeless unlock <url>` (alias `scrape`) for one-page extraction. For multi-page traversal use crawl; for interactive actions across a session use agent-browser.

## Setup

Check `scrapeless --version`. Install with `npm install -g scrapeless` if needed, or replace `scrapeless` with `npx --package scrapeless scrapeless`. Token resolution: config `apiKey` (legacy `api_token`) in `~/.scrapeless/config.json`, then `SCRAPELESS_API_TOKEN`, then `SCRAPELESS_API_KEY`. `SCRAPELESS_CONFIG_PATH` changes the config path. `.env` is not loaded automatically. Diagnose with `scrapeless auth status`, without printing the token.

## Extract

```bash
scrapeless unlock https://example.com --type markdown -o page.md
scrapeless unlock https://example.com --type content --outputs headings,links,favicon --json
scrapeless unlock https://example.com --country US --js-render false --type html
scrapeless unlock https://example.com --type markdown --selector main --json
```

JavaScript rendering defaults to enabled, proxy country to `ANY`, and response type to `html`. Boolean flags take explicit `true` or `false`. For cookies, rendering instructions, network filters, screenshots, and complete JSON requests, read [request options](references/options.md).

The default output is the API's `data` field; `--json` preserves the complete response including `code`. Check the response before claiming extraction succeeded. Return the requested content or output path; report CLI/API errors with their cause. Image data stays in the API's representation: inspect it before decoding or claiming a saved file is an image. Do not retry a failed request indefinitely.
