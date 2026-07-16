import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCachedImageBlob,
  removeCachedImage,
} from '../src/services/imageCache.js';

test('image data is downloaded once, reused, and evicted on delete', async (t) => {
  const originalCaches = globalThis.caches;
  const originalFetch = globalThis.fetch;
  const stored = new Map();
  let fetchCount = 0;

  globalThis.caches = {
    async open() {
      return {
        async match(key) {
          return stored.get(key)?.clone();
        },
        async put(key, response) {
          stored.set(key, response.clone());
        },
        async delete(key) {
          return stored.delete(key);
        },
      };
    },
  };
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response('cached-image', {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    });
  };

  t.after(() => {
    globalThis.caches = originalCaches;
    globalThis.fetch = originalFetch;
  });

  const first = await getCachedImageBlob('image-1');
  const second = await getCachedImageBlob('image-1');
  assert.equal(await first.text(), 'cached-image');
  assert.equal(await second.text(), 'cached-image');
  assert.equal(fetchCount, 1);

  assert.equal(await removeCachedImage('image-1'), true);
  await getCachedImageBlob('image-1');
  assert.equal(fetchCount, 2);
});

test('concurrent reads share one download', async (t) => {
  const originalCaches = globalThis.caches;
  const originalFetch = globalThis.fetch;
  const stored = new Map();
  let fetchCount = 0;

  globalThis.caches = {
    async open() {
      return {
        async match(key) {
          return stored.get(key)?.clone();
        },
        async put(key, response) {
          stored.set(key, response.clone());
        },
        async delete(key) {
          return stored.delete(key);
        },
      };
    },
  };
  globalThis.fetch = async () => {
    fetchCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return new Response('shared-image', { status: 200 });
  };

  t.after(() => {
    globalThis.caches = originalCaches;
    globalThis.fetch = originalFetch;
  });

  const [first, second] = await Promise.all([
    getCachedImageBlob('image-2'),
    getCachedImageBlob('image-2'),
  ]);
  assert.equal(await first.text(), 'shared-image');
  assert.equal(await second.text(), 'shared-image');
  assert.equal(fetchCount, 1);
});
