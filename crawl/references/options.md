# Crawl options

| Options | Purpose |
| --- | --- |
| --limit, --max-depth, --max-discovery-depth | Page count, URL depth, discovery depth |
| --include-paths, --exclude-paths | Comma-separated path patterns |
| --ignore-sitemap, --ignore-query-parameters | Boolean discovery controls |
| --deduplicate-similar-urls, --regex-on-full-url | Boolean matching controls |
| --allow-backward-links, --allow-external-links | Boolean traversal controls |
| --delay | Seconds between scrapes |
| --formats | CSV: markdown, html, json, links, rawHtml, screenshot, screenshot@fullPage |
| --only-main-content | Boolean content selection |
| --include-tags, --exclude-tags | CSV tag lists |
| --headers | Target-page headers as JSON |
| --wait-for, --scrape-timeout | Milliseconds |
| --scrape-options, --browser-options | Nested JSON objects |
| --data | Complete JSON body or @file |
| --json, -o | Full JSON and output file |

```bash
scrapeless crawl --data @crawl-request.json --json
```

`crawl-request.json`:

```json
{
  "url": "https://example.com",
  "limit": 10,
  "maxDepth": 2,
  "maxDiscoveryDepth": 2,
  "ignoreSitemap": false,
  "ignoreQueryParameters": true,
  "deduplicateSimilarURLs": true,
  "regexOnFullURL": false,
  "allowBackwardLinks": false,
  "allowExternalLinks": false,
  "delay": 0.5,
  "includePaths": ["docs/.*"],
  "excludePaths": ["private/.*"],
  "scrapeOptions": {
    "formats": ["markdown", "links"],
    "onlyMainContent": true,
    "waitFor": 1000,
    "timeout": 30000
  },
  "browserOptions": {
    "sessionName": "docs-crawl",
    "sessionTTL": "300",
    "sessionRecording": "false",
    "proxyCountry": "US"
  }
}
```

Custom proxies belong in `browserOptions.proxyURL`. Explicit flags override JSON values; unspecified service settings use server defaults. This API uses `/api/v2/crawler/crawl` and `/api/v2/crawler/crawl/{id}`; it does not use the scraping-api v1 polling protocol.
