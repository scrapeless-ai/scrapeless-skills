---
name: scraping-api
description: Retrieve structured Google search, Amazon product/seller/keyword/Rufus, and TikTok profile/posts/shop data through Scrapeless Scraping API. Use for these site-specific JSON datasets and for resuming their asynchronous tasks.
license: MIT
metadata:
  runtime: Requires Node.js 22+, a Scrapeless API token, and network access. The bundled script has no npm dependencies.
---

# Scraping API

Use the bundled `scripts/scrape.mjs` for the v1 Scraping API. The unified CLI's `scrapeless api` namespace is not implemented in the baseline CLI. This skill is self-contained and does not require other skills or a global CLI installation.

## Select the actor

Read only the relevant reference before building the input:

| Data | Actor | Reference |
| --- | --- | --- |
| Google search results | scraper.google.search | [Google](references/google.md) |
| Amazon | scraper.amazon | [Amazon](references/amazon.md) |
| TikTok profile, posts, shop | scraper.tiktok.user.detail / scraper.tiktok.user.work / scraper.tiktok.shop.page | [TikTok](references/tiktok.md) |

Use JSON objects for `input` and optional `proxy`. A nonempty `proxy.url` takes precedence over `proxy.country`. Preserve additional documented actor fields; do not translate API input keys into CLI flags.

## Authentication and execution

Token precedence matches the unified CLI: `apiKey` (legacy `api_token`) in `~/.scrapeless/config.json`, then `SCRAPELESS_API_TOKEN`, then `SCRAPELESS_API_KEY`. `SCRAPELESS_CONFIG_PATH` overrides the config location. `.env` files are not auto-loaded. Never embed real tokens in request files or command examples.

Resolve the script path relative to this installed `SKILL.md`, not relative to the user's project. The examples below run from the skill directory; otherwise use the script's absolute path.

```bash
node scripts/scrape.mjs --data '{"actor":"scraper.google.search","input":{"q":"coffee","hl":"en","gl":"us"},"proxy":{"country":"US"}}'
node scripts/scrape.mjs --data @request.json
node scripts/scrape.mjs --data - < request.json
node scripts/scrape.mjs --task-id TASK_ID --max-polls 20 --timeout 180
```

## Result contract

The script submits exactly one POST to `https://api.scrapeless.com/api/v1/scraper/request` with `x-api-token`. HTTP 200 returns the response JSON directly. HTTP 201 extracts `taskId` and polls GET `/api/v1/scraper/result/{taskId}`; another 201 means pending. HTTP 4xx/5xx stops immediately and emits the API's error JSON. Other statuses, invalid JSON, missing IDs, network errors, and timeouts are failures with diagnostic JSON.

Defaults: at most 10 result GETs, 3 seconds between pending polls, 120 seconds total, 60 seconds per HTTP request. These can be changed with `--max-polls`, `--interval`, `--timeout`, and `--request-timeout`. Exceeding a limit exits 1 with task ID and last response when available. The server task may still run; resume with `--task-id` rather than resubmitting. A failed POST is not automatically retried because submission may have reached the server.

On success, stdout contains only the resulting JSON and exit status is 0. On failure, stderr contains only error JSON and exit status is 1; preserve it when reporting failure. Return successful JSON without an added envelope or invented schema. Credentials echoed in errors are masked. `SCRAPELESS_API_BASE_URL` is available for a trusted custom gateway or local testing.
