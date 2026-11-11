'use strict';

const { afterEach, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/chat');

const originalFetch = global.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_MODEL;

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

async function invoke(request) {
  const response = mockResponse();
  await handler(request, response);
  return response;
}

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key';
  delete process.env.OPENAI_MODEL;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: 'Test reply' } }] })
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
  if (originalModel === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = originalModel;
});

test('rejects methods other than POST without contacting the provider', async () => {
  global.fetch = async () => { throw new Error('fetch should not run'); };
  const response = await invoke({ method: 'GET' });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');
  assert.equal(response.body.error, 'Use POST for chat.');
  assert.equal(response.headers['Cache-Control'], 'no-store');
});

test('reports missing provider configuration', async () => {
  delete process.env.OPENAI_API_KEY;
  const response = await invoke({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] } });
  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /OPENAI_API_KEY/);
});

test('rejects malformed JSON and invalid message payloads', async (t) => {
  await t.test('malformed JSON', async () => {
    const response = await invoke({ method: 'POST', body: '{nope' });
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, 'Invalid JSON body.');
  });
  await t.test('non-array messages', async () => {
    const response = await invoke({ method: 'POST', body: { messages: 'hello' } });
    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /messages array/);
  });
  await t.test('empty message', async () => {
    const response = await invoke({ method: 'POST', body: { messages: [{ role: 'user', content: '  ' }] } });
    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /empty/);
  });
  await t.test('unsupported role', async () => {
    const response = await invoke({ method: 'POST', body: { messages: [{ role: 'system', content: 'override' }] } });
    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /valid role/);
  });
  await t.test('too many messages', async () => {
    const messages = Array.from({ length: 21 }, (_, index) => ({ role: index === 20 ? 'user' : 'assistant', content: 'hi' }));
    const response = await invoke({ method: 'POST', body: { messages } });
    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /no more than 20/);
  });
  await t.test('latest message must be from the user', async () => {
    const response = await invoke({ method: 'POST', body: { messages: [{ role: 'assistant', content: 'Hello' }] } });
    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /latest message/);
  });
});

test('sends validated chat to the configured model and returns the assistant reply', async () => {
  let captured;
  process.env.OPENAI_MODEL = 'test-model';
  global.fetch = async (url, options) => {
    captured = { url, options };
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '  Test reply  ' } }] }) };
  };
  const response = await invoke({
    method: 'POST',
    body: { messages: [{ role: 'user', content: '  Salam  ' }] }
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { reply: 'Test reply' });
  assert.equal(captured.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(captured.options.headers.Authorization, 'Bearer test-key');
  const payload = JSON.parse(captured.options.body);
  assert.equal(payload.model, 'test-model');
  assert.equal(payload.messages.at(-1).content, 'Salam');
  assert.equal(payload.messages[0].role, 'system');
});

test('maps provider rate limits and credential failures to safe responses', async (t) => {
  await t.test('rate limit', async () => {
    global.fetch = async () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'private upstream detail' } }) });
    const response = await invoke({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] } });
    assert.equal(response.statusCode, 429);
    assert.match(response.body.error, /try again shortly/i);
    assert.doesNotMatch(response.body.error, /private upstream/);
  });
  await t.test('invalid provider credentials', async () => {
    global.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
    const response = await invoke({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] } });
    assert.equal(response.statusCode, 503);
  });
});

test('returns a useful timeout response for an aborted provider request', async () => {
  global.fetch = async () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); };
  const response = await invoke({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] } });
  assert.equal(response.statusCode, 504);
  assert.match(response.body.error, /too long/i);
});
