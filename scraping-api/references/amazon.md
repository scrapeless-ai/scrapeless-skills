# Amazon

Actor: `scraper.amazon`. Put parameters in `input`.

| Field | Type | Requirement / meaning |
| --- | --- | --- |
| type | string | Required: product, seller, rufus, keywords |
| url | string | Required for product; product or seller URL |
| page | integer | Page number for keywords searches |
| domain | string | Amazon domain; for Rufus use the full domain, e.g. www.amazon.com.au |
| zip_code | string | Postal code for delivery information; preserve leading zeros |
| return_html | boolean | Include original HTML when true |
| department | string | Search URL's i parameter; aliases below |
| keywords | string | Search keywords or Rufus question |

Rufus domains documented in the requirements: ae, au, br, ca, de, es, fr, in, it, mx, se, tr, uk, jp, us. Send the corresponding full Amazon hostname.

```json
{
  "actor": "scraper.amazon",
  "input": {
    "type": "rufus",
    "keywords": "I want a pet indoor surveillance camera",
    "domain": "www.amazon.es"
  }
}
```

```json
{
  "actor": "scraper.amazon",
  "input": { "type": "product", "url": "https://www.amazon.com/dp/B0F8LGB7VR", "return_html": false }
}
```

The supplied requirements contain an inconsistent sample using `locale: "rufus"` without `type`. Follow the explicit required-parameter table: use `type: "rufus"`; do not silently replace it with `locale`.

## Department aliases

```text
arts-crafts-intl-ship
automotive-intl-ship
baby-products-intl-ship
beauty-intl-ship
stripbooks-intl-ship
fashion-boys-intl-ship
computers-intl-ship
deals-intl-ship
digital-music
electronics-intl-ship
fashion-girls-intl-ship
hpc-intl-ship
kitchen-intl-ship
industrial-intl-ship
digital-text
luggage-intl-ship
fashion-mens-intl-ship
movies-tv-intl-ship
music-intl-ship
pets-intl-ship
instant-video
software-intl-ship
sporting-intl-ship
tools-intl-ship
toys-and-games-intl-ship
videogames-intl-ship
fashion-womens-intl-ship
```

Successful JSON can include `html`, `metadata` (e.g. rawUrl/type), and `result`. Keyword results can have pagination, paid/organic products, prices, ASINs, ratings, and shipping information. Shapes vary by type; preserve the complete response, including empty values.
