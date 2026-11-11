---
name: agent-browser
description: Automate interactive websites in Scrapeless cloud browsers. Use for navigation, forms, clicks, DOM snapshots, screenshots, and browser workflows requiring a persistent session.
license: MIT
metadata:
  runtime: Requires Node.js 22+, npm, the scrapeless CLI, a Scrapeless API token, and network access to Scrapeless, npm, and GitHub Releases on first use.
---

# Agent Browser

Use `scrapeless browser` for interactive cloud browsing. It forwards arguments and exit codes to the upstream browser CLI, installing the pinned browser and daemon dependencies on first use. The repository is `scrapeless-agent-browser`; the wrapper's npm package is `scrapeless-scraping-browser`.

## Setup

Check `scrapeless --version`; install with `npm install -g scrapeless` if absent, or use `npx --package scrapeless scrapeless`. Prefer the shared `~/.scrapeless/config.json` token (`apiKey`, set via `scrapeless config set api_token`) or `SCRAPELESS_API_KEY`. `.env` is not automatically loaded. The wrapper resolves config first, then `SCRAPELESS_API_TOKEN`, then `SCRAPELESS_API_KEY`, and passes the token to the browser.

The browser independently prefers its default config over environment credentials. `SCRAPELESS_CONFIG_PATH` only changes the unified CLI's config; it does not change the browser's config location. Diagnose mismatches without printing secrets.

## Session workflow

```bash
scrapeless browser --help
scrapeless browser new-session --name demo --ttl 300 --json
```

Read the returned session ID and substitute it for `SESSION_ID` below; do not assume the display name is the ID. Inspect help for extra session/proxy options rather than assuming flags from another browser tool.

```bash
scrapeless browser --session-id SESSION_ID open https://example.com
scrapeless browser --session-id SESSION_ID snapshot -i
scrapeless browser --session-id SESSION_ID click @e1
scrapeless browser --session-id SESSION_ID snapshot -i
scrapeless browser --session-id SESSION_ID fill @e2 "hello world"
scrapeless browser --session-id SESSION_ID screenshot page.png
scrapeless browser --session-id SESSION_ID close
```

The element refs are illustrative: use refs from the actual current snapshot. Refresh the snapshot after navigation or changes to the page. Keep the same session ID throughout the workflow. Verify the resulting page state after an action. Perform submissions and other external changes only within the user's authorized scope.

Close sessions created for the task when finished, including on errors; preserve a user-supplied session unless closing it is part of the request. Report the observed result, any artifacts, and unfinished steps.

## Installation troubleshooting

Even `browser --help` can trigger a first-use download. The default cache is `~/.cache/scrapeless`; `SCRAPELESS_CACHE_DIR` changes it. `SCRAPELESS_BROWSER_BIN` accepts an absolute executable path and skips auto-installation. If network access or the OS/architecture blocks installation, report the concrete failure. Do not switch to an unrelated local browser or install a differently named npm package without a task-specific reason.
