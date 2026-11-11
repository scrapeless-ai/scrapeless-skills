# Scrapeless Skills

An open-source collection of Scrapeless Agent Skills that lets AI coding assistants with Agent Skills support unlock webpages, crawl websites, query AI platforms, automate cloud browsers, generate proxy URLs, and retrieve structured data.

| Skill | Purpose | Implementation |
| --- | --- | --- |
| [ai-scraper](ai-scraper/SKILL.md) | Get answers from ChatGPT, Gemini, Copilot, Perplexity, Grok, Alexa, and Google AI Mode / Overview | `scrapeless ai` |
| [web-unlocker](web-unlocker/SKILL.md) | Extract HTML, Markdown, text, screenshots, or network responses from a single page | `scrapeless unlock` |
| [agent-browser](agent-browser/SKILL.md) | Navigate, click, fill forms, and take screenshots in a cloud browser | `scrapeless browser` |
| [crawl](crawl/SKILL.md) | Crawl multiple pages with depth and path controls | `scrapeless crawl` |
| [proxy](proxy/SKILL.md) | Generate residential, IPv6, and datacenter proxy URLs | `scrapeless proxy` |
| [scraping-api](scraping-api/SKILL.md) | Retrieve structured Google Search, Amazon, and TikTok data | Bundled Node.js script calling the v1 API |

The first five skills use the [Scrapeless CLI](https://github.com/scrapeless-ai/scrapeless-cli). `scraping-api` uses a standalone script with no npm dependencies because `scrapeless api` is still an unimplemented placeholder in the baseline CLI.

## Quick start

### 1. Install the runtime and CLI

The CLI and bundled scripts require Node.js 22+. The latest `skills` installer requires Node.js **22.20+**, so use a version that meets both requirements.

```bash
node --version
npm install -g scrapeless
scrapeless --version
```

To run without a global CLI installation, replace `scrapeless` in the commands below with `npx --package scrapeless scrapeless`. The standalone `scraping-api` script does not require the CLI.

### 2. Install skills

Run the following command in the project where you want to use the skills, then select skills and target assistants interactively:

```bash
npx skills add scrapeless-ai/scrapeless-skills
```

Install individual skills, install globally, or check installed skills:

```bash
# Install a single skill
npx skills add scrapeless-ai/scrapeless-skills --skill web-unlocker

# Install globally for use across projects
npx skills add scrapeless-ai/scrapeless-skills -g

# List installed skills
npx skills list
```

You can also install from a local checkout:

```bash
git clone https://github.com/scrapeless-ai/scrapeless-skills.git
cd scrapeless-skills
npx skills add .
```

If you have already downloaded this repository, run `npx skills add .` from its root. Alternatively, copy each skill's **entire directory** into a skills directory supported by your assistant, including its `scripts/`, `references/`, and `agents/` subdirectories. Copying only `SKILL.md` leaves out references or scripts. See the [skills installer documentation](https://github.com/vercel-labs/skills) for installation options and assistant selection.

### 3. Get and configure an API token

Get an API token from the [Scrapeless dashboard](https://app.scrapeless.com/), then set it in the terminal where you run your assistant:

```bash
export SCRAPELESS_API_KEY='YOUR_API_TOKEN'
scrapeless auth status
```

Replace `YOUR_API_TOKEN` with your token. Environment variables apply only to the current shell and its child processes. Assistants launched from another terminal or a desktop application need their own environment configuration, or the persistent configuration described below.

### 4. Start using the skills

Describe your task directly to the assistant, or use `$skill-name` if your assistant supports explicit skill invocation:

```text
Use $web-unlocker to extract https://example.com as Markdown.
Use $crawl to crawl up to 10 pages of https://example.com, keeping only the main content.
Use $ai-scraper to ask ChatGPT "What is web scraping?" and preserve citations.
Use $agent-browser to open https://example.com and save a screenshot.
Use $proxy to generate a US residential proxy URL through the Asia-Pacific gateway.
Use $scraping-api to search Google for coffee and return the full JSON response.
```

You can also verify your setup by running commands directly:

```bash
scrapeless unlock https://example.com --type markdown
scrapeless ai chatgpt "Explain web scraping" --json
scrapeless crawl https://example.com --limit 10 --formats markdown --json
```

## Authentication and configuration

### Persistent configuration

```bash
scrapeless config set api_token YOUR_API_TOKEN
scrapeless config path
scrapeless config list
scrapeless auth status
scrapeless config remove api_token
```

Configuration is stored in `~/.scrapeless/config.json` by default, with the token in the `apiKey` field. The CLI configuration commands accept `api_token`, `apiToken`, `api_key`, and `apiKey` as aliases. On Unix, the configuration file uses `0600` permissions. `config list` masks secret fields; `config get apiKey` prints the full token and should not be used in logs or troubleshooting screenshots.

The CLI and Scraping API script use the same token precedence:

1. `apiKey` in the configuration file, with support for the legacy `api_token` field.
2. The `SCRAPELESS_API_TOKEN` environment variable.
3. The `SCRAPELESS_API_KEY` environment variable.

Setting a new environment variable therefore does not override a token already stored in configuration. Update or remove the old configuration when switching accounts.

| Environment variable | Purpose |
| --- | --- |
| `SCRAPELESS_API_KEY` | Recommended token environment variable; also supported by the browser |
| `SCRAPELESS_API_TOKEN` | Alternative token variable supported by the CLI and bundled script |
| `SCRAPELESS_CONFIG_PATH` | Override the configuration path for the CLI and bundled script |
| `SCRAPELESS_API_BASE_URL` | API base URL for CLI HTTP commands and the bundled script; defaults to `https://api.scrapeless.com`; intended for testing or trusted gateways |
| `SCRAPELESS_CACHE_DIR` | Browser cache root; defaults to `~/.cache/scrapeless` |
| `SCRAPELESS_BROWSER_BIN` | Absolute path to an existing browser executable, skipping automatic installation |

The cloud browser still reads the default `~/.scrapeless/config.json` and gives its configuration file priority over environment variables. `SCRAPELESS_CONFIG_PATH` does not change the browser's own configuration path. Use the default shared configuration or keep credentials consistent between the two configurations.

### Using `.env`

The CLI and bundled script **do not load `.env` automatically**. Copy the [environment variable template](.env.example), fill in your token, and load it explicitly. The following works in Bash and Zsh:

```bash
cp .env.example .env
# Edit .env to set your token, then load it
set -a
. ./.env
set +a
scrapeless auth status
```

Only load environment files you maintain. `.env` is included in `.gitignore`; do not put real tokens in skills, request examples, or committed files. Generated proxy URLs also contain full credentials.

## Usage examples

### AI Scraper

```bash
scrapeless ai platforms
scrapeless ai chatgpt "Recommend museums in Tokyo" --country JP --web-search true --shopping false --json
scrapeless ai gemini "Explain quantum computing" -o answer.md
scrapeless ai google-ai-mode "Coffee shops in Paris" --location 'Paris,France' --json
scrapeless ai result TASK_ID --platform chatgpt --wait --json
```

The default output is Markdown; `--json` preserves the full response. See the [platform reference](ai-scraper/references/platforms.md) for platform-specific options.

### Web Unlocker

```bash
scrapeless unlock https://example.com --type markdown -o page.md
scrapeless unlock https://example.com --type content --outputs headings,links,favicon --json
scrapeless unlock https://example.com --country US --js-render false --type html
```

JavaScript rendering is enabled by default. See [Web Unlocker options](web-unlocker/references/options.md) for additional options and JSON request bodies.

### Agent Browser

```bash
scrapeless browser new-session --name demo --ttl 300 --json
# Replace SESSION_ID with the actual ID returned by the previous command
scrapeless browser --session-id SESSION_ID open https://example.com
scrapeless browser --session-id SESSION_ID snapshot -i
scrapeless browser --session-id SESSION_ID screenshot page.png
scrapeless browser --session-id SESSION_ID close
```

The first invocation, including `--help`, automatically installs browser and daemon dependencies and requires access to npm and GitHub Releases. Use element references from the current snapshot for interactive actions. See the [browser skill](agent-browser/SKILL.md) for details.

### Crawl

```bash
scrapeless crawl https://example.com --limit 10 --max-depth 2 --allow-external-links false --json
scrapeless crawl https://example.com --limit 10 --include-paths 'docs/.*' --no-wait
scrapeless crawl result TASK_ID --wait --timeout 300 --interval 5 --json
```

See [Crawl options](crawl/references/options.md) for path filtering, page extraction, and browser settings.

### Proxy

```bash
scrapeless proxy gateways
scrapeless proxy create --type residential --country US --gateway ap
scrapeless proxy create --type datacenter --country DE --gateway eu --json
```

URLs are generated locally; this does not verify the token or network connectivity. See the [Proxy skill](proxy/SKILL.md) for complete usage instructions.

### Scraping API

Run the following commands from the repository root. After installation, assistants should use the absolute path to the script inside the installed skill:

```bash
node scraping-api/scripts/scrape.mjs --data '{"actor":"scraper.google.search","input":{"q":"coffee","hl":"en","gl":"us"}}'

node scraping-api/scripts/scrape.mjs --data '{"actor":"scraper.amazon","input":{"type":"keywords","keywords":"coffee","domain":"www.amazon.com","page":1}}'

node scraping-api/scripts/scrape.mjs --data '{"actor":"scraper.tiktok.user.detail","input":{"unique_id":"tiktok"}}'

# Read a complete request from a file or standard input
node scraping-api/scripts/scrape.mjs --data @request.json
node scraping-api/scripts/scrape.mjs --data - < request.json

# Resume an existing task without creating a new one
node scraping-api/scripts/scrape.mjs --task-id TASK_ID --max-polls 20 --timeout 180
```

Example `request.json` (`proxy` must be an object):

```json
{
  "actor": "scraper.google.search",
  "input": { "q": "coffee", "hl": "en", "gl": "us" },
  "proxy": { "country": "US", "url": "" }
}
```

A nonempty `proxy.url` takes precedence over `proxy.country`. See the field references for [Google](scraping-api/references/google.md), [Amazon](scraping-api/references/amazon.md), and [TikTok](scraping-api/references/tiktok.md). For Amazon, provide the required `type` field from the parameter table. The `locale: "rufus"` example in the original requirements is ambiguous and is not used as a substitute for `type`.

The script handles HTTP statuses explicitly:

| Status | Behavior |
| --- | --- |
| 200 | Return successful JSON on stdout and exit with code 0 |
| 201 | Poll the existing task with GET using its `taskId`; do not resubmit the creation request |
| 4xx / 5xx | Stop immediately, return the API error JSON on stderr, and exit with code 1 |
| Timeout, polling limit, protocol error, or network error | Return diagnostic JSON on stderr and exit with code 1; preserve the task ID and last response when available |

Defaults are 10 result polls, 3 seconds between pending responses, a total timeout of 120 seconds, and a per-request timeout of 60 seconds. Adjust these with `--max-polls`, `--interval`, `--timeout`, and `--request-timeout`. Successful responses have no additional envelope, and tokens echoed in errors are masked. A client timeout does not mean the server task has been canceled.

## Output, task status, and troubleshooting

CLI HTTP commands support `--json` and `-o <file>`. Results go to stdout; progress, task ID messages, and errors go to stderr. AI and Crawl creation commands poll for up to 300 seconds at 5-second intervals by default. A polling timeout can return an unfinished result with exit code 0, so inspect `status`: AI success is `success`, and Crawl completion is `completed`. Save the task ID and resume polling instead of treating a timeout as success or creating a duplicate task.

Boolean options generally require explicit `true` / `false` values. `--no-wait` and the result command's `--wait` are switches. Polling options use seconds; Crawl's `--wait-for` and `--scrape-timeout` use milliseconds.

| Problem | What to check |
| --- | --- |
| `scrapeless` command not found | Ensure the global npm binary directory is on PATH, or use npx |
| Missing token / 401 / 403 | Run `auth status` and check whether the configuration file overrides a new environment variable |
| Authentication fails despite a populated `.env` | Load the environment explicitly and launch the assistant from that environment |
| Browser fails on first use | Check npm/GitHub Releases access, platform support, and cache; use `SCRAPELESS_BROWSER_BIN` to specify an existing binary |
| AI / Crawl returns only a task ID or pending status | Continue retrieving the result with `result TASK_ID --wait` |
| Scraping API returns 429 or 5xx | Preserve the server error details and check quotas or service status; the script does not automatically resubmit requests |
| `scrapeless api` reports that it is not implemented | Use `scraping-api/scripts/scrape.mjs` from this repository |
