---
name: crawl
description: Crawl multiple pages of a website with Scrapeless, controlling page limits, traversal depth, path filters, and output formats. Use for site-wide documentation collection or checking an existing crawl task.
license: MIT
metadata:
  runtime: Requires Node.js 22+, the scrapeless CLI, a Scrapeless API token, and network access.
---

# Crawl

Use `scrapeless crawl` for multi-page collection. Preserve the user's scope; for a small trial without a specified limit, explicitly use a modest page limit such as 10 and keep external links disabled.

## Setup

Check `scrapeless --version`; install with `npm install -g scrapeless` if missing, or use `npx --package scrapeless scrapeless`. Credentials resolve from `~/.scrapeless/config.json` (`apiKey`, legacy `api_token`), then `SCRAPELESS_API_TOKEN`, then `SCRAPELESS_API_KEY`. `SCRAPELESS_CONFIG_PATH` overrides the config path. `.env` is not auto-loaded. Use `scrapeless auth status` for authentication diagnostics without displaying the key.

## Run and retrieve

```bash
scrapeless crawl https://example.com --limit 10 --max-depth 2 --allow-external-links false --formats markdown --json -o crawl.json
scrapeless crawl https://example.com --limit 10 --include-paths 'docs/.*' --exclude-paths 'private/.*' --no-wait
scrapeless crawl result TASK_ID --wait --timeout 300 --interval 5 --json
```

Read [crawl options](references/options.md) for filtering, page extraction, browser/proxy settings, or JSON bodies. Boolean options require explicit values except `--no-wait` and result's `--wait`. Polling durations are seconds; `--wait-for` and `--scrape-timeout` are milliseconds.

Creation polls every 5 seconds for up to 300 seconds by default. `--no-wait` returns the new task ID immediately. `crawl result TASK_ID` performs one read unless `--wait` is supplied. `completed` and `failed` are terminal statuses. Timeout can exit zero with partial data and a pending status: retain the ID and resume the existing task instead of creating a duplicate. Report partial results as partial; only claim completion after `completed`. On failure, show the returned reason and task ID. Task IDs/progress use stderr; JSON results use stdout or `-o`.
