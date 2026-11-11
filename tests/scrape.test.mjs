import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runTask, validateRequest, resolveToken, ScrapeError } from '../scraping-api/scripts/scrape.mjs';

const body = { actor: 'scraper.google.search', input: { q: 'coffee' } };
const defaults = { body, token: 'test-token', interval: 0.001 };
function mockResponses(responses) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, ...options });
    assert.ok(responses.length, 'Unexpected extra API call');
    const [status, data] = responses.shift();
    return new Response(JSON.stringify(data), { status });
  };
  return { calls, fetch };
}

test('200 returns all result JSON with no added envelope; token only in header', async () => {
  const expected = { organic_results: [{ title: 'Coffee' }], metadata: {} };
  const mock = mockResponses([[200, expected]]);
  assert.deepEqual(await runTask(defaults, mock.fetch), expected);
  assert.equal(mock.calls.length, 1);
  assert.equal(mock.calls[0].url, 'https://api.scrapeless.com/api/v1/scraper/request');
  assert.equal(mock.calls[0].method, 'POST');
  assert.equal(mock.calls[0].headers['x-api-token'], 'test-token');
  assert.equal(mock.calls[0].redirect, 'error');
  assert.deepEqual(JSON.parse(mock.calls[0].body), body);
});

test('201 polls the original task until 200; IDs are URL encoded', async () => {
  const mock = mockResponses([[201, { taskId: 'id/a b' }], [201, { pending: true }], [200, { items: [1] }]]);
  assert.deepEqual(await runTask(defaults, mock.fetch), { items: [1] });
  assert.deepEqual(mock.calls.map(x => x.method), ['POST', 'GET', 'GET']);
  assert.ok(mock.calls[1].url.endsWith('/api/v1/scraper/result/id%2Fa%20b'));
  assert.equal(mock.calls[1].body, undefined);
});

test('resume starts with GET and never submits', async () => {
  const mock = mockResponses([[200, {}]]);
  assert.deepEqual(await runTask({ token: 'test', taskId: 'existing' }, mock.fetch), {});
  assert.equal(mock.calls[0].method, 'GET');
});

for (const status of [400, 401, 403, 429, 500, 503]) {
  test(`HTTP ${status} returns original API JSON without retry`, async () => {
    const error = { code: status, message: 'service error', detail: { reason: 'test' } };
    const mock = mockResponses([[status, error]]);
    await assert.rejects(runTask(defaults, mock.fetch), e => e instanceof ScrapeError && assert.deepEqual(e.payload, error) === undefined);
    assert.equal(mock.calls.length, 1);
  });
}

test('poll failure is terminal and retains API error JSON', async () => {
  const mock = mockResponses([[201, { taskId: 'id' }], [500, { error: 'poll failed' }]]);
  await assert.rejects(runTask(defaults, mock.fetch), e => e.payload.error === 'poll failed');
  assert.equal(mock.calls.length, 2);
});

test('poll limit fails with task ID and last response', async () => {
  const mock = mockResponses([[201, { taskId: 'id' }], [201, { state: 'running' }], [201, { state: 'running' }]]);
  await assert.rejects(runTask({ ...defaults, maxPolls: 2 }, mock.fetch), e =>
    e.payload.taskId === 'id' && e.payload.polls === 2 && e.payload.lastResponse.state === 'running');
  assert.equal(mock.calls.length, 3);
});

test('201 without a task ID fails before polling', async () => {
  const mock = mockResponses([[201, { id: 'wrong-field' }]]);
  await assert.rejects(runTask(defaults, mock.fetch), /missing taskId/);
  assert.equal(mock.calls.length, 1);
});

test('non-JSON and unexpected status responses fail explicitly', async () => {
  await assert.rejects(runTask(defaults, async () => new Response('<html>Bad gateway</html>', { status: 502 })),
    e => e.payload.status === 502 && e.payload.body.includes('Bad gateway'));
  await assert.rejects(runTask(defaults, async () => new Response('invalid', { status: 200 })), /non-JSON/);
  const mock = mockResponses([[202, { queued: true }]]);
  await assert.rejects(runTask(defaults, mock.fetch), /Unexpected HTTP status/);
});

test('network failures never retry the POST or leak transport messages', async () => {
  let calls = 0;
  await assert.rejects(runTask(defaults, async () => { calls++; throw new Error('test-token internal transport'); }),
    e => e.payload.error.includes('HTTP request failed') && !JSON.stringify(e.payload).includes('test-token'));
  assert.equal(calls, 1);
});

test('total deadline interrupts polling delay', async () => {
  const mock = mockResponses([[201, { taskId: 'id' }], [201, { pending: true }]]);
  await assert.rejects(runTask({ ...defaults, timeout: 0.02, interval: 1 }, mock.fetch),
    e => e.payload.error === 'Task timed out' && e.payload.taskId === 'id');
});

test('per-request timeout interrupts an in-flight fetch', async () => {
  const stalled = (_url, { signal }) => new Promise((_resolve, reject) => {
    const keeper = setTimeout(() => reject(new Error('test guard')), 1000);
    signal.addEventListener('abort', () => { clearTimeout(keeper); reject(signal.reason); }, { once: true });
  });
  await assert.rejects(runTask({ ...defaults, requestTimeout: 0.01 }, stalled), /HTTP request timed out/);
});

test('all actors accept valid inputs and preserve optional fields', () => {
  for (const request of [
    { ...body, proxy: { country: 'US', url: 'http://proxy.example:8080' } },
    { actor: 'scraper.amazon', input: { type: 'product', url: 'https://www.amazon.com/dp/example', return_html: false } },
    { actor: 'scraper.amazon', input: { type: 'seller', url: 'https://www.amazon.com/sp?seller=example' } },
    { actor: 'scraper.amazon', input: { type: 'keywords', keywords: 'coffee', page: 2 } },
    { actor: 'scraper.amazon', input: { type: 'rufus', keywords: 'coffee', domain: 'www.amazon.es' } },
    { actor: 'scraper.tiktok.user.detail', input: { unique_id: 'tiktok' } },
    { actor: 'scraper.tiktok.user.work', input: { sec_uid: 'sec', cursor: '0', count: 35 } },
    { actor: 'scraper.tiktok.shop.page', input: { product_id: '12345678901234567890', region: 'US' } },
  ]) assert.equal(validateRequest(request), request);
});

test('invalid actor inputs fail locally before calling fetch', async () => {
  const invalid = [
    null, [], { actor: 'unknown', input: {} }, { ...body, input: [] },
    { ...body, input: {} }, { ...body, proxy: 'US' },
    { ...body, input: { q: 'coffee', location: 'Paris', uule: 'encoded' } },
    { ...body, input: { q: 'coffee', device: 'mobile' } },
    { actor: 'scraper.amazon', input: { locale: 'rufus' } },
    { actor: 'scraper.amazon', input: { type: 'product' } },
    { actor: 'scraper.tiktok.user.detail', input: {} },
    { actor: 'scraper.tiktok.user.work', input: { sec_uid: 'sec', count: 0 } },
    { actor: 'scraper.tiktok.user.work', input: { sec_uid: 'sec', cursor: 0 } },
    { actor: 'scraper.tiktok.shop.page', input: { product_id: 123, region: 'US' } },
  ];
  for (const request of invalid) {
    await assert.rejects(runTask({ ...defaults, body: request }, () => assert.fail('must not call fetch')), ScrapeError);
  }
});

test('invalid timing and base URL options are rejected before network use', async () => {
  for (const extra of [{ maxPolls: 0 }, { interval: -1 }, { timeout: NaN }, { requestTimeout: Infinity },
    { baseUrl: 'file:///tmp/example' }, { baseUrl: 'https://user:secret@example.com' }]) {
    await assert.rejects(runTask({ ...defaults, ...extra }, () => assert.fail('must not call fetch')), ScrapeError);
  }
});

test('authentication follows CLI config and environment precedence', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'scrapeless-auth-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'config.json');
  const env = { SCRAPELESS_CONFIG_PATH: path, SCRAPELESS_API_TOKEN: 'env-token', SCRAPELESS_API_KEY: 'env-key' };
  assert.equal(await resolveToken(env), 'env-token');
  assert.equal(await resolveToken({ SCRAPELESS_API_KEY: 'env-key' }, path), 'env-key');
  await writeFile(path, JSON.stringify({ apiKey: 'config-key', api_token: 'legacy' }));
  assert.equal(await resolveToken(env), 'config-key');
  await writeFile(path, JSON.stringify({ api_token: 'legacy' }));
  assert.equal(await resolveToken(env), 'legacy');
  await writeFile(path, '{invalid');
  await assert.rejects(resolveToken(env), /Cannot read/);
  await assert.rejects(resolveToken({}, join(dir, 'missing')), /API token/);
});

// Real CLI parsing/I/O in a child process with only the network transport stubbed.
function cli(args, { input, response = { result: 'ok' }, status = 200, env = {} } = {}) {
  const moduleUrl = new URL('../scraping-api/scripts/scrape.mjs', import.meta.url).href;
  const source = `import { main } from ${JSON.stringify(moduleUrl)};
    globalThis.fetch = async () => new Response(${JSON.stringify(JSON.stringify(response))}, {status: ${status}});
    process.exitCode = await main(process.argv.slice(1));`;
  return spawnSync(process.execPath, ['--input-type=module', '-e', source, '--', ...args], {
    encoding: 'utf8', input,
    env: { ...process.env, SCRAPELESS_API_TOKEN: 'cli-test-token', SCRAPELESS_API_KEY: '',
      SCRAPELESS_CONFIG_PATH: join(tmpdir(), 'scrapeless-skills-missing-config', 'config.json'), ...env },
  });
}

test('CLI JSON, file and stdin inputs produce clean stdout', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'scrapeless-data-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'request.json');
  await writeFile(file, JSON.stringify(body));
  for (const [arg, input] of [[JSON.stringify(body), undefined], [`@${file}`, undefined], ['-', JSON.stringify(body)]]) {
    const result = cli(['--data', arg], { input });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { result: 'ok' });
    assert.equal(result.stderr, '');
  }
});

test('CLI failures use only stderr JSON and exit 1', () => {
  for (const args of [[], ['--data', 'bad'], ['--data', JSON.stringify(body), '--task-id', 'id'], ['--unknown']]) {
    const result = cli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(JSON.parse(result.stderr).error);
  }
});

test('CLI preserves API errors and redacts echoed credentials', () => {
  const result = cli(['--data', JSON.stringify(body)], { status: 403, response: { code: 403, message: 'Rejected cli-test-token', details: { token: 'cli-test-token' } } });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.deepEqual(JSON.parse(result.stderr), { code: 403, message: 'Rejected ********', details: { token: '********' } });
});

test('CLI help works without credentials', () => {
  const result = cli(['--help'], { env: { SCRAPELESS_API_TOKEN: '', SCRAPELESS_API_KEY: '' } });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.equal(result.stderr, '');
});

test('direct CLI invocation through a symlink still executes main', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'scrapeless-link-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const link = join(dir, 'installed-skill.mjs');
  await symlink(fileURLToPath(new URL('../scraping-api/scripts/scrape.mjs', import.meta.url)), link);
  const result = spawnSync(process.execPath, [link, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage:/);
});
