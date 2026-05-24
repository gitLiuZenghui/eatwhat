import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addHistoryEntry,
  addOption,
  createOptionList,
  pickLunchPair,
  removeOption,
} from '../../src/core/lunch.js';

test('createOptionList 会去掉空值、修剪空白并按标准化结果去重', () => {
  const options = createOptionList([
    '  麻辣烫  ',
    '',
    '黄焖鸡',
    '麻辣烫',
    '  黄焖鸡  ',
    '煲仔饭',
    '煲 仔 饭',
  ]);

  assert.deepEqual(options, ['麻辣烫', '黄焖鸡', '煲仔饭', '煲 仔 饭']);
});

test('addOption 会添加新选项且保持原数组不变', () => {
  const before = ['麻辣烫', '黄焖鸡'];
  const result = addOption(before, ' 煲仔饭 ');

  assert.deepEqual(before, ['麻辣烫', '黄焖鸡']);
  assert.equal(result.error, null);
  assert.deepEqual(result.options, ['麻辣烫', '黄焖鸡', '煲仔饭']);
});

test('addOption 会拒绝空值和重复值', () => {
  assert.equal(addOption(['麻辣烫'], '   ').error, 'empty');
  assert.equal(addOption(['麻辣烫'], ' 麻辣烫 ').error, 'duplicate');
});

test('removeOption 会按标准化值删除匹配项', () => {
  const options = removeOption(['麻辣烫', '黄焖鸡', '煲仔饭'], ' 黄焖鸡 ');

  assert.deepEqual(options, ['麻辣烫', '煲仔饭']);
});

test('pickLunchPair 会优先避免连续两次抽到相同主选，并给出不同的备选', () => {
  const result = pickLunchPair(['麻辣烫', '黄焖鸡', '煲仔饭'], '麻辣烫', () => 0);

  assert.equal(result.primary, '黄焖鸡');
  assert.equal(result.secondary, '麻辣烫');
});

test('pickLunchPair 会按 excludeRecentCount 仅排除最近 N 次主选', () => {
  const result = pickLunchPair(
    ['麻辣烫', '黄焖鸡', '煲仔饭'],
    {
      lastPrimary: '麻辣烫',
      recentPrimaries: ['麻辣烫', '黄焖鸡'],
      excludeRecentCount: 1,
    },
    () => 0,
  );

  assert.equal(result.primary, '黄焖鸡');
  assert.equal(result.secondary, '麻辣烫');
});

test('pickLunchPair 会优先排除最近吃过的主选列表', () => {
  const result = pickLunchPair(
    ['麻辣烫', '黄焖鸡', '煲仔饭'],
    {
      lastPrimary: '麻辣烫',
      recentPrimaries: ['麻辣烫', '黄焖鸡'],
    },
    () => 0,
  );

  assert.equal(result.primary, '煲仔饭');
  assert.equal(result.secondary, '麻辣烫');
});

test('pickLunchPair 在全部都属于最近吃过时回退到仅排除上次主选', () => {
  const result = pickLunchPair(
    ['麻辣烫', '黄焖鸡'],
    {
      lastPrimary: '麻辣烫',
      recentPrimaries: ['麻辣烫', '黄焖鸡'],
    },
    () => 0,
  );

  assert.equal(result.primary, '黄焖鸡');
  assert.equal(result.secondary, '麻辣烫');
});

test('addHistoryEntry 会支持对象历史并保留时间戳', () => {
  const history = addHistoryEntry(
    [
      { primary: '麻辣烫', secondary: '黄焖鸡', ts: '2026-05-24T10:00:00.000Z' },
    ],
    {
      primary: '米线',
      secondary: '煲仔饭',
      ts: '2026-05-24T11:00:00.000Z',
    },
    3,
  );

  assert.deepEqual(history, [
    { primary: '米线', secondary: '煲仔饭', ts: '2026-05-24T11:00:00.000Z' },
    { primary: '麻辣烫', secondary: '黄焖鸡', ts: '2026-05-24T10:00:00.000Z' },
  ]);
});

test('addHistoryEntry 会按主选去重对象历史', () => {
  const history = addHistoryEntry(
    [
      { primary: '麻辣烫', secondary: '黄焖鸡', ts: '2026-05-24T10:00:00.000Z' },
      { primary: '黄焖鸡', secondary: '煲仔饭', ts: '2026-05-24T09:00:00.000Z' },
    ],
    {
      primary: '麻辣烫',
      secondary: '米线',
      ts: '2026-05-24T11:00:00.000Z',
    },
    4,
  );

  assert.deepEqual(history, [
    { primary: '麻辣烫', secondary: '米线', ts: '2026-05-24T11:00:00.000Z' },
    { primary: '黄焖鸡', secondary: '煲仔饭', ts: '2026-05-24T09:00:00.000Z' },
  ]);
});

test('addHistoryEntry 会把最新主选放前面并限制历史长度', () => {
  const history = addHistoryEntry(['麻辣烫', '黄焖鸡', '煲仔饭'], '米线', 3);

  assert.deepEqual(history, ['米线', '麻辣烫', '黄焖鸡']);
});

test('addHistoryEntry 会去重并忽略空值', () => {
  assert.deepEqual(addHistoryEntry(['麻辣烫', '黄焖鸡'], ' 黄焖鸡 ', 4), ['黄焖鸡', '麻辣烫']);
  assert.deepEqual(addHistoryEntry(['麻辣烫'], '   ', 4), ['麻辣烫']);
});

test('pickLunchPair 在上次主选不在当前列表时允许从全部选项中抽取', () => {
  const result = pickLunchPair(['麻辣烫', '黄焖鸡'], '煲仔饭', () => 0.99);

  assert.equal(result.primary, '黄焖鸡');
  assert.equal(result.secondary, '麻辣烫');
});

test('pickLunchPair 在仅有一个选项时只返回主选', () => {
  const result = pickLunchPair(['麻辣烫'], '麻辣烫', () => 0.5);

  assert.deepEqual(result, {
    primary: '麻辣烫',
    secondary: null,
  });
});

test('pickLunchPair 在没有可选项时返回空结果', () => {
  const result = pickLunchPair([], null, () => 0.5);

  assert.deepEqual(result, {
    primary: null,
    secondary: null,
  });
});
