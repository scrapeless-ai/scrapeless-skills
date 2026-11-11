# TikTok

| Actor | Required input | Result |
| --- | --- | --- |
| scraper.tiktok.user.detail | unique_id (string) | Account profile and statistics |
| scraper.tiktok.user.work | sec_uid (string) | Account posts, including items |
| scraper.tiktok.shop.page | product_id and region (strings) | Shop product details |

For user.work, `cursor` is a string (default `"0"`); `count` is an integer greater than zero (default 35). Use the returned pagination cursor for later pages; do not invent it or confuse `unique_id` with `sec_uid`. If only a handle is known, request user.detail and inspect its actual response for the secondary ID before requesting posts.

For shop.page, regions include GB, SG, JP, US. The returned region reflects the actual product page and can differ from the request. Keep product IDs as strings to avoid loss of precision.

```json
{"actor":"scraper.tiktok.user.detail","input":{"unique_id":"tiktok"}}
```

```json
{"actor":"scraper.tiktok.user.work","input":{"sec_uid":"ACCOUNT_SEC_UID","cursor":"0","count":35}}
```

```json
{"actor":"scraper.tiktok.shop.page","input":{"product_id":"PRODUCT_ID","region":"US"}}
```

The supplied response example is `{}`; there is no fixed response schema to enforce. Return the real JSON and inspect it before relying on field names for follow-up work.
