import assert from 'node:assert/strict';
import test from 'node:test';
// Match Next's server bootstrap before loading its routing test utilities.
import 'next/dist/server/node-environment.js';
import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server.js';
import nextConfig from '../next.config.ts';

const bucket = 'https://ontor-releases.s3.us-east-2.amazonaws.com';
const acquisition = 'ec3f0b9a-1111-4222-8333-444455556666';

for (const [path, target] of [
  ['/downloads/mac/Ontor.dmg', '/mac/Ontor.dmg'],
  ['/downloads/windows/Ontor.exe', '/mac/windows/Ontor.exe'],
  ['/downloads/mac/appcast.xml', '/mac/appcast.xml'],
  ['/downloads/windows/appcast.xml', '/mac/windows/appcast.xml'],
  ['/downloads/mac/Ontor-1.0.0-100.dmg', '/mac/Ontor-1.0.0-100.dmg'],
  ['/downloads/mac/update.delta', '/mac/update.delta'],
]) {
  test(`${path} redirects to S3 without proxying file bytes`, async () => {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://ontor.ai${path}?acquisition_id=${acquisition}`,
      nextConfig,
    });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), `${bucket}${target}?acquisition_id=${acquisition}`);
    assert.equal(response.headers.get('x-middleware-rewrite'), null);
  });
}

test('untagged downloads work and install pages are not redirected to S3', async () => {
  const download = await unstable_getResponseFromNextConfig({
    url: 'https://ontor.ai/downloads/mac/Ontor.dmg', nextConfig,
  });
  assert.equal(download.headers.get('location'), `${bucket}/mac/Ontor.dmg`);
  const page = await unstable_getResponseFromNextConfig({
    url: 'https://ontor.ai/install/', nextConfig,
  });
  assert.equal(page.headers.get('location'), null);
});
