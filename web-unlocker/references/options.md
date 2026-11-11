# Request options

| CLI options | Request mapping / values |
| --- | --- |
| --country, --proxy-url | proxy.country, proxy.url; a nonempty URL takes precedence over country |
| --method, --redirect | input.method, input.redirect |
| --js-render, --headless | input.jsRender.enabled, headless |
| --wait-until | load, domcontentloaded, networkidle0, networkidle2 |
| --type | html, plaintext, markdown, content, network, png, jpeg |
| --selector, --outputs, --full-page | response.options.selector, outputs (CSV), fullPage (boolean) |
| --response-options | JSON object with network methods, status, urls, or other response options |
| --instructions | JSON array of rendering instructions |
| --cookies | JSON array of cookies |
| --block-resources, --block-urls | CSV lists under input.jsRender.block.resources / urls |

```bash
scrapeless unlock https://example.com --wait-until networkidle2 --instructions '[{"wait":2}]'
scrapeless unlock https://example.com --type network --response-options '{"methods":["GET"],"status":["200"],"urls":["api"]}' --json
scrapeless unlock https://example.com --type png --full-page true --json -o screenshot-response.json
scrapeless unlock --data @request.json --json
```

Complete `request.json` example:

```json
{
  "proxy": { "country": "US" },
  "input": {
    "url": "https://example.com",
    "method": "GET",
    "redirect": false,
    "cookies": [],
    "jsRender": {
      "enabled": true,
      "headless": true,
      "waitUntil": "domcontentloaded",
      "instructions": [{ "wait": 2 }],
      "block": { "resources": ["font"], "urls": [] },
      "response": { "type": "markdown", "options": { "selector": "main" } }
    }
  }
}
```

Explicit CLI flags override body values, then defaults apply. Nested objects merge; arrays replace. The CLI fixes the actor to `unlocker.webunlocker` and posts to `/api/v2/unlocker/request`.
