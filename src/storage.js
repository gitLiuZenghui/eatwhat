import { createHistoryList, createOptionList } from './core/lunch.js';

const STORAGE_KEY = 'eatwhat:lunch-state';
const defaultExcludeRecentCount = 3;

const normalizeValue = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || null;
};

const normalizeExcludeRecentCount = (value) => {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    return defaultExcludeRecentCount;
  }

  return Math.min(10, Math.max(0, number));
};

const createDefaultState = () => ({
  options: [],
  lastPrimary: null,
  recentPrimaries: [],
  history: [],
  excludeRecentCount: defaultExcludeRecentCount,
});

const loadState = (storage = globalThis.localStorage) => {
  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw);

    return {
      options: createOptionList(Array.isArray(parsed.options) ? parsed.options : []),
      lastPrimary: normalizeValue(parsed.lastPrimary),
      recentPrimaries: createOptionList(Array.isArray(parsed.recentPrimaries) ? parsed.recentPrimaries : []),
      history: createHistoryList(Array.isArray(parsed.history) ? parsed.history : []),
      excludeRecentCount: normalizeExcludeRecentCount(parsed.excludeRecentCount),
    };
  } catch {
    return createDefaultState();
  }
};

const saveState = (storage = globalThis.localStorage, state) => {
  const payload = {
    options: createOptionList(Array.isArray(state.options) ? state.options : []),
    lastPrimary: normalizeValue(state.lastPrimary),
    recentPrimaries: createOptionList(Array.isArray(state.recentPrimaries) ? state.recentPrimaries : []),
    history: createHistoryList(Array.isArray(state.history) ? state.history : []),
    excludeRecentCount: normalizeExcludeRecentCount(state.excludeRecentCount),
  };

  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export {
  STORAGE_KEY,
  loadState,
  saveState,
};
