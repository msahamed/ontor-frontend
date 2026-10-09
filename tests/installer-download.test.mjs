import assert from 'node:assert/strict';
import test from 'node:test';
import { installerDownload } from '../lib/installer-download.ts';
const request = (body) => new Request('https://ontor.ai/api/download/', { method: 'POST', body: JSON.stringify(body) });
const human = { verify: async () => ({ isBot: false }), limit: async () => ({ ok: true, retryAfterSec: 0 }) };
for (const [platform, path] of [['macos', '/mac/Ontor.dmg'], ['windows', '/mac/windows/Ontor.exe']]) {
  test(`verified ${platform} download preserves acquisition attribution`, async () => {
    const id = 'ec3f0b9a-1111-4222-8333-444455556666';
    const response = await installerDownload(request({ platform, acquisitionId: id }), human);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).url, `https://ontor-releases.s3.us-east-2.amazonaws.com${path}?acquisition_id=${id}`);
  });
}
test('bots receive no installer URL and do not reach downstream work', async () => {
  const response = await installerDownload(request({ platform: 'macos' }), {
    verify: async () => ({ isBot: true }), limit: async () => { throw new Error('must not run'); },
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).url, undefined);
});
test('rate-limited visitor receives retry-after and no URL', async () => {
  const response = await installerDownload(request({ platform: 'windows' }), { ...human, limit: async () => ({ ok: false, retryAfterSec: 42 }) });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '42');
  assert.equal((await response.json()).url, undefined);
});
test('verification outage fails closed', async () => {
  const response = await installerDownload(request({ platform: 'macos' }), { ...human, verify: async () => { throw new Error('offline'); } });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).url, undefined);
});
for (const body of [null, {}, {platform:'__proto__'}, {platform:'https://evil.example'}]) {
  test(`rejects invalid platform: ${JSON.stringify(body)}`, async () => {
    assert.equal((await installerDownload(request(body), human)).status, 400);
  });
}
test('invalid attribution is discarded', async () => {
  const response = await installerDownload(request({ platform: 'macos', acquisitionId: '../secret?x=1' }), human);
  assert.equal((await response.json()).url, 'https://ontor-releases.s3.us-east-2.amazonaws.com/mac/Ontor.dmg');
});
test('malformed JSON is rejected', async () => {
  const response = await installerDownload(new Request('https://ontor.ai/api/download/', { method: 'POST', body: '{' }), human);
  assert.equal(response.status, 400);
});

test('verified crawlers cannot request installers', async () => {
  const response = await installerDownload(request({ platform: 'macos' }), { ...human, verify: async () => ({ isBot: false, isVerifiedBot: true }) });
  assert.equal(response.status, 403);
});
