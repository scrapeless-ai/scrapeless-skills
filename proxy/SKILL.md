---
name: proxy
description: Generate authenticated Scrapeless residential, IPv6, or datacenter proxy URLs with regional gateways, country targeting, and sticky sessions. Use when a user needs a proxy URL or proxy configuration for another scraping tool.
license: MIT
metadata:
  runtime: Requires Node.js 22+, the scrapeless CLI, and a Scrapeless API token. URL generation is local.
---

# Proxy

Use `scrapeless proxy create` to build a proxy URL locally. Generating a URL does not verify the token, connectivity, or available balance.

## Setup

Check `scrapeless --version`; install with `npm install -g scrapeless` if needed, or use `npx --package scrapeless scrapeless`. Token precedence: `apiKey` (legacy `api_token`) in `~/.scrapeless/config.json`, then `SCRAPELESS_API_TOKEN`, then `SCRAPELESS_API_KEY`. `SCRAPELESS_CONFIG_PATH` overrides the file path. `.env` is not automatically loaded. `scrapeless auth status` checks authentication over the network when needed.

## Generate

```bash
scrapeless proxy gateways
scrapeless proxy create --type residential --country US --gateway us
scrapeless proxy create --country US --state AL --city foley --session-duration 10 --session-id demo123 --gateway ap
scrapeless proxy create --type ipv6 --country JP --gateway ap
scrapeless proxy create --type datacenter --country DE --gateway eu --json -o proxy.json
```

Defaults: residential, US, 10 minutes, random session ID, Americas gateway. Supported types are `residential`, `ipv6`, `datacenter`. Session duration is a positive integer in minutes. Country, state, city, and session ID contain letters/digits only; use service-supported location codes. Reuse the same session ID when a sticky session is intended.

| Gateway | Address |
| --- | --- |
| us | gw-us.scrapeless.io:8789 |
| eu | gw-eu.scrapeless.io:8789 |
| ap | gw-ap.scrapeless.io:8789 |

`--gateway` also accepts `hostname:port`. Default output is the URL; `--json` returns `{"url":"..."}`. The URL embeds the full API token as its password. Pass it directly to the intended client or a private output file, and mask the password in logs or summaries. Return the actual URL when explicitly requested, without publishing it elsewhere.

Consumers use different fields: Web Unlocker `--proxy-url`; scraping-api `proxy.url` in an object (a nonempty URL overrides `proxy.country`); Crawl `browserOptions.proxyURL`. Browser proxy options must be checked with `scrapeless browser new-session --help`. Do not infer successful proxy use from URL generation alone.
