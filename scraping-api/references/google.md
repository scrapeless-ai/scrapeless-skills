# Google search

Actor: `scraper.google.search`. All fields below go in `input`.

| Field | Required | Meaning |
| --- | --- | --- |
| q | Yes | Query; supports Google operators such as site:, inurl:, intitle: |
| location | No | Search origin; city-level recommended; mutually exclusive with uule |
| uule | No | Google-encoded origin; mutually exclusive with location |
| ludocid | No | Business listing CID |
| lsig | No | Identifier used to force knowledge-graph map views |
| kgmid | No | Knowledge Graph ID; may override other settings except start/num |
| si | No | Cached search parameters, including Knowledge Graph tabs; may override other settings except start/num |
| ibp | No | Layout/expansion settings, e.g. gwp;0,7 |
| uds | No | Google-provided filter string from prior results |
| google_domain | No | Google domain; default google.com |
| gl | No | Country code, e.g. us, uk, fr |
| hl | No | Language code, e.g. en, es, fr |
| cr | No | Country restriction, e.g. countryFR\|countryDE |
| lr | No | Language restriction, e.g. lang_fr\|lang_de |
| tbs | No | Advanced time/content search filters |
| safe | No | active or off; omitted uses Google's default filtering |
| nfpr | No | 1 excludes autocorrected results; 0 includes them (default); Google can still fall back |
| filter | No | 1 enables similar/omitted result filtering (default); 0 disables |
| tbm | No | Omit for regular search; isch images, lcl local, vid videos, nws news, shop shopping, pts patents |
| start | No | Result offset, default 0; local search requires multiples of 20 |
| num | No | Requested maximum result count; omit unless needed, as it can add latency or suppress specialized results |
| device | No | Only desktop is supported |
| as_dt, as_eq | No | Advanced Google query parameters; pass through when requested |

```json
{
  "actor": "scraper.google.search",
  "input": { "q": "coffee", "hl": "en", "gl": "us", "start": 0 },
  "proxy": { "country": "US" }
}
```

Successful JSON may contain `ai_overview`, `inline_videos`, `organic_results`, `pagination`, `perspectives`, `related_questions`, `related_searches`, `search_information`, `short_videos`, and `metadata`. These are not guaranteed to appear for every query. Return the actual response; do not synthesize missing sections.
