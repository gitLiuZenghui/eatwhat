import assert from 'node:assert/strict';
import test from 'node:test';

import { loadState, saveState, STORAGE_KEY } from '../../src/storage.js';

const createStorage = (seed = {}) => {
  const data = new Map(Object.entries(seed));

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
  };
};

test('loadState 在没有缓存时返回默认状态', () => {
  const storage = createStorage();

  assert.deepEqual(loadState(storage), {
    options: [],
    lastPrimary: null,
    recentPrimaries: [],
    history: [],
    excludeRecentCount: 3,
  });
});

test('loadState 在非字符串主选时返回空主选', () => {
  const storage = createStorage({
    [STORAGE_KEY]: JSON.stringify({
      options: ['麻辣烫'],
      lastPrimary: 123,
      recentPrimaries: [' 麻辣烫 ', '黄焖鸡', '麻辣烫'],
      history: [
        { primary: ' 黄焖鸡 ', secondary: '煲仔饭', ts: '2026-05-24T11:00:00.000Z' },
        { primary: '', secondary: '米线', ts: '2026-05-24T10:00:00.000Z' },
      ],
      excludeRecentCount: 2,
    }),
  });

  assert.deepEqual(loadState(storage), {
    options: ['麻辣烫'],
    lastPrimary: null,
    recentPrimaries: ['麻辣烫', '黄焖鸡'],
    history: [
      { primary: '黄焖鸡', secondary: '煲仔饭', ts: '2026-05-24T11:00:00.000Z' },
    ],
    excludeRecentCount: 2,
  });
});

test('loadState 会标准化缓存中的选项和上次主选', () => {
  const storage = createStorage({
    [STORAGE_KEY]: JSON.stringify({
      options: [' 麻辣烫 ', '', '黄焖鸡', '麻辣烫'],
      lastPrimary: ' 黄焖鸡 ',
      recentPrimaries: [' 麻辣烫 ', '黄焖鸡'],
      history: [
        { primary: ' 黄焖鸡 ', secondary: ' 麻辣烫 ', ts: '2026-05-24T11:00:00.000Z' },
        { primary: '麻辣烫', secondary: null, ts: '2026-05-24T10:00:00.000Z' },
      ],
      excludeRecentCount: 4,
    }),
  });

  assert.deepEqual(loadState(storage), {
    options: ['麻辣烫', '黄焖鸡'],
    lastPrimary: '黄焖鸡',
    recentPrimaries: ['麻辣烫', '黄焖鸡'],
    history: [
      { primary: '黄焖鸡', secondary: '麻辣烫', ts: '2026-05-24T11:00:00.000Z' },
      { primary: '麻辣烫', secondary: null, ts: '2026-05-24T10:00:00.000Z' },
    ],
    excludeRecentCount: 4,
  });
});

test('loadState 在缓存损坏时回退到默认状态', () => {
  const storage = createStorage({
    [STORAGE_KEY]: '{bad json}',
  });

  assert.deepEqual(loadState(storage), {
    options: [],
    lastPrimary: null,
    recentPrimaries: [],
    history: [],
    excludeRecentCount: 3,
  });
});

test('saveState 会写入标准化后的状态', () => {
  const storage = createStorage();

  saveState(storage, {
    options: [' 麻辣烫 ', '黄焖鸡', '麻辣烫'],
    lastPrimary: ' 黄焖鸡 ',
    recentPrimaries: [' 麻辣烫 ', '黄焖鸡', '麻辣烫'],
    history: [
      { primary: ' 黄焖鸡 ', secondary: ' 麻辣烫 ', ts: '2026-05-24T11:00:00.000Z' },
      { primary: '麻辣烫', secondary: null, ts: '2026-05-24T10:00:00.000Z' },
    ],
    excludeRecentCount: 2,
  });

  assert.equal(
    storage.getItem(STORAGE_KEY),
    JSON.stringify({
      options: ['麻辣烫', '黄焖鸡'],
      lastPrimary: '黄焖鸡',
      recentPrimaries: ['麻辣烫', '黄焖鸡'],
      history: [
        { primary: '黄焖鸡', secondary: '麻辣烫', ts: '2026-05-24T11:00:00.000Z' },
        { primary: '麻辣烫', secondary: null, ts: '2026-05-24T10:00:00.000Z' },
      ],
      excludeRecentCount: 2,
    }),
  );
});
