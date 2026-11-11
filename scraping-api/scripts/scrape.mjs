#!/usr/bin/env node
import { readFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';

const actors = new Set([
  'scraper.google.search', 'scraper.amazon', 'scraper.tiktok.user.detail',
  'scraper.tiktok.user.work', 'scraper.tiktok.shop.page',
]);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export class ScrapeError extends Error {
  constructor(payload) {
    super(isObject(payload) ? String(payload.error ?? payload.message ?? 'Scraping API failed') : 'Scraping API failed');
    this.payload = payload;
  }
}

function fail(error, details = {}) {
  throw new ScrapeError({ error, ...details });
}

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} must be a nonempty string`);
}

export function validateRequest(body) {
  if (!isObject(body)) fail('Request must be a JSON object');
  if (!actors.has(body.actor)) fail('Unsupported actor', { supported: [...actors] });
  if (!isObject(body.input)) fail('input must be an object');
  const input = body.input;
  if (body.proxy !== undefined) {
    if (!isObject(body.proxy)) fail('proxy must be an object with country and/or url');
    for (const field of ['country', 'url']) {
      if (body.proxy[field] !== undefined && typeof body.proxy[field] !== 'string') fail(`proxy.${field} must be a string`);
    }
  }
  switch (body.actor) {
    case 'scraper.google.search':
      requireString(input.q, 'input.q');
      if (input.location && input.uule) fail('input.location and input.uule are mutually exclusive');
      if (input.device !== undefined && input.device !== 'desktop') fail('Only device=desktop is supported');
      break;
    case 'scraper.amazon':
      if (!['product', 'seller', 'rufus', 'keywords'].includes(input.type)) fail('input.type must be product, seller, rufus, or keywords');
      if (input.type === 'product') requireString(input.url, 'input.url');
      if (input.return_html !== undefined && typeof input.return_html !== 'boolean') fail('input.return_html must be a boolean');
      if (input.page !== undefined && (!Number.isSafeInteger(input.page) || input.page < 1)) fail('input.page must be a positive integer');
      break;
    case 'scraper.tiktok.user.detail':
      requireString(input.unique_id, 'input.unique_id');
      break;
    case 'scraper.tiktok.user.work':
      requireString(input.sec_uid, 'input.sec_uid');
      if (input.cursor !== undefined && typeof input.cursor !== 'string') fail('input.cursor must be a string');
      if (input.count !== undefined && (!Number.isSafeInteger(input.count) || input.count < 1)) fail('input.count must be a positive integer');
      break;
    case 'scraper.tiktok.shop.page':
      requireString(input.product_id, 'input.product_id');
      requireString(input.region, 'input.region');
      break;
  }
  return body;
}

export async function resolveToken(env = process.env, defaultPath = join(homedir(), '.scrapeless', 'config.json')) {
  let config = {};
  try {
    config = JSON.parse(await readFile(env.SCRAPELESS_CONFIG_PATH || defaultPath, 'utf8'));
    if (!isObject(config)) fail('Configuration must be a JSON object');
  } catch (error) {
    if (error.code !== 'ENOENT') fail('Cannot read Scrapeless configuration; check its path and JSON syntax');
  }
  const token = config.apiKey ?? config.api_token ?? env.SCRAPELESS_API_TOKEN ?? env.SCRAPELESS_API_KEY;
  requireString(token, 'API token (configure api_token or set SCRAPELESS_API_KEY)');
  return token;
}

// POST once. A 201 is a pending task, never a reason to create another task.
export async function runTask({ body, taskId, token, baseUrl = 'https://api.scrapeless.com',
  timeout = 120, requestTimeout = 60, interval = 3, maxPolls = 10 }, fetchImpl = fetch) {
  requireString(token, 'API token');
  if ((body === undefined) === (taskId === undefined)) fail('Provide either a request body or a task ID');
  if (body !== undefined) validateRequest(body);
  if (taskId !== undefined) requireString(taskId, 'taskId');
  for (const [key, value] of Object.entries({ timeout, requestTimeout, interval })) {
    if (!Number.isFinite(value) || value <= 0 || value * 1000 > 2_147_483_647) fail(`${key} must be positive seconds within the timer range`);
  }
  if (!Number.isSafeInteger(maxPolls) || maxPolls < 1) fail('maxPolls must be a positive integer');
  let base;
  try { base = new URL(baseUrl); } catch { fail('Invalid API base URL'); }
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) fail('Invalid API base URL');
  baseUrl = base.href.replace(/\/$/, '');
  const deadline = AbortSignal.timeout(Math.ceil(timeout * 1000));
  let lastResponse;
  let polls = 0;
  const details = () => ({ ...(taskId ? { taskId } : {}), polls, ...(lastResponse === undefined ? {} : { lastResponse }) });

  async function request(path, payload) {
    const perRequest = AbortSignal.timeout(Math.ceil(requestTimeout * 1000));
    let response, text;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: payload === undefined ? 'GET' : 'POST',
        headers: { 'x-api-token': token, 'Content-Type': 'application/json' },
        body: payload === undefined ? undefined : JSON.stringify(payload),
        redirect: 'error',
        signal: AbortSignal.any([deadline, perRequest]),
      });
      text = await response.text();
    } catch {
      fail(deadline.aborted ? 'Task timed out' : perRequest.aborted ? 'HTTP request timed out' : 'HTTP request failed (network or redirect error)', details());
    }
    let data;
    try { data = JSON.parse(text); }
    catch { fail('API returned non-JSON data', { status: response.status, body: text, ...details() }); }
    if (response.status >= 400) throw new ScrapeError(data);
    if (response.status !== 200 && response.status !== 201) fail('Unexpected HTTP status', { status: response.status, response: data, ...details() });
    return { status: response.status, data };
  }

  if (body !== undefined) {
    const submitted = await request('/api/v1/scraper/request', body);
    if (submitted.status === 200) return submitted.data;
    lastResponse = submitted.data;
    taskId = submitted.data?.taskId;
    if (typeof taskId !== 'string' || !taskId.trim()) fail('HTTP 201 response is missing taskId', { response: submitted.data });
  }
  while (polls < maxPolls) {
    if (deadline.aborted) fail('Task timed out', details());
    polls += 1;
    const result = await request(`/api/v1/scraper/result/${encodeURIComponent(taskId)}`);
    if (result.status === 200) return result.data;
    lastResponse = result.data;
    if (polls < maxPolls) {
      try { await sleep(interval * 1000, undefined, { signal: deadline }); }
      catch { fail('Task timed out', details()); }
    }
  }
  fail('Maximum polling attempts reached', details());
}

const help = `Scrapeless Scraping API (Node.js 22+, no dependencies)
Usage:
  node scrape.mjs --data '{"actor":"scraper.google.search","input":{"q":"coffee"}}'
  node scrape.mjs --data @request.json
  node scrape.mjs --data - < request.json
  node scrape.mjs --task-id TASK_ID
Options:
  --timeout SECONDS          Total request/poll deadline (default 120)
  --request-timeout SECONDS  Per-request deadline (default 60)
  --interval SECONDS         Delay between pending polls (default 3)
  --max-polls COUNT          Maximum result GETs (default 10)
  --help                    Show this help
Authentication: config apiKey/api_token, SCRAPELESS_API_TOKEN, SCRAPELESS_API_KEY.
SCRAPELESS_CONFIG_PATH overrides config; SCRAPELESS_API_BASE_URL overrides API host.
Success: result JSON on stdout, exit 0. Failure: error JSON on stderr, exit 1.
No automatic .env loading. Never automatically retries task submission.
`;

export async function main(args = process.argv.slice(2)) {
  let token;
  try {
    const { values } = parseArgs({ args, options: {
      data: { type: 'string' }, 'task-id': { type: 'string' },
      timeout: { type: 'string', default: '120' }, 'request-timeout': { type: 'string', default: '60' },
      interval: { type: 'string', default: '3' }, 'max-polls': { type: 'string', default: '10' },
      help: { type: 'boolean', default: false },
    } });
    if (values.help) { process.stdout.write(help); return 0; }
    if ((values.data === undefined) === (values['task-id'] === undefined)) fail('Provide exactly one of --data or --task-id');
    let body;
    if (values.data !== undefined) {
      let raw = values.data;
      if (raw === '-') {
        const chunks = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        raw = Buffer.concat(chunks).toString('utf8');
      } else if (raw.startsWith('@')) raw = await readFile(raw.slice(1), 'utf8');
      try { body = JSON.parse(raw); } catch { fail('Request data must be valid JSON'); }
      validateRequest(body);
    }
    token = await resolveToken();
    const data = await runTask({ body, taskId: values['task-id'], token,
      baseUrl: process.env.SCRAPELESS_API_BASE_URL,
      timeout: Number(values.timeout), requestTimeout: Number(values['request-timeout']),
      interval: Number(values.interval), maxPolls: Number(values['max-polls']),
    });
    process.stdout.write(`${JSON.stringify(data)}\n`);
    return 0;
  } catch (error) {
    const payload = error instanceof ScrapeError ? error.payload : { error: error.message };
    // Preserve API JSON structure; redact credentials only if the service echoed them.
    const safe = token ? JSON.parse(JSON.stringify(payload), (_key, value) =>
      typeof value === 'string' ? value.split(token).join('********') : value) : payload;
    process.stderr.write(`${JSON.stringify(safe)}\n`);
    return 1;
  }
}

const entryPath = process.argv[1] ? await realpath(process.argv[1]).catch(() => undefined) : undefined;
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  process.exitCode = await main();
}
