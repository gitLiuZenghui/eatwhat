const normalizeOption = (value) => value.trim().replace(/\s+/g, ' ');

const toOptionKey = (value) => normalizeOption(value).toLocaleLowerCase('zh-CN');

const normalizeHistoryEntry = (entry) => {
  if (typeof entry === 'string') {
    const primary = normalizeOption(entry);
    return primary ? primary : null;
  }

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const primary = typeof entry.primary === 'string' ? normalizeOption(entry.primary) : '';

  if (!primary) {
    return null;
  }

  const secondary = typeof entry.secondary === 'string' ? normalizeOption(entry.secondary) || null : null;
  const ts = typeof entry.ts === 'string' ? entry.ts : new Date(0).toISOString();

  return {
    primary,
    secondary,
    ts,
  };
};

const toHistoryKey = (entry) => toOptionKey(typeof entry === 'string' ? entry : entry.primary);

const createHistoryList = (entries) => {
  const seen = new Set();

  return entries.reduce((history, entry) => {
    const normalized = normalizeHistoryEntry(entry);

    if (!normalized) {
      return history;
    }

    const key = toHistoryKey(normalized);

    if (seen.has(key)) {
      return history;
    }

    seen.add(key);
    return [...history, normalized];
  }, []);
};

const createOptionList = (values) => {
  const seen = new Set();

  return values.reduce((options, value) => {
    const normalized = normalizeOption(value);

    if (!normalized) {
      return options;
    }

    const key = toOptionKey(normalized);

    if (seen.has(key)) {
      return options;
    }

    seen.add(key);
    return [...options, normalized];
  }, []);
};

const addOption = (options, value) => {
  const normalized = normalizeOption(value);

  if (!normalized) {
    return {
      error: 'empty',
      options,
    };
  }

  const normalizedKey = toOptionKey(normalized);
  const exists = options.some((option) => toOptionKey(option) === normalizedKey);

  if (exists) {
    return {
      error: 'duplicate',
      options,
    };
  }

  return {
    error: null,
    options: [...options, normalized],
  };
};

const removeOption = (options, value) => {
  const normalizedKey = toOptionKey(value);
  return options.filter((option) => toOptionKey(option) !== normalizedKey);
};

const pickRandom = (options, random) => {
  const index = Math.min(options.length - 1, Math.floor(random() * options.length));
  return options[index];
};

const normalizePickContext = (context) => {
  if (typeof context === 'string' || context == null) {
    return {
      lastPrimary: context ?? null,
      recentPrimaries: [],
    };
  }

  const recentPrimaries = createOptionList(Array.isArray(context.recentPrimaries) ? context.recentPrimaries : []);
  const excludeRecentCount = Number.isInteger(context.excludeRecentCount) ? context.excludeRecentCount : recentPrimaries.length;

  return {
    lastPrimary: typeof context.lastPrimary === 'string' ? context.lastPrimary : null,
    recentPrimaries: recentPrimaries.slice(0, Math.max(0, excludeRecentCount)),
  };
};

const filterOutRecentPrimaries = (options, recentPrimaries) => {
  if (recentPrimaries.length === 0) {
    return options;
  }

  const recentKeys = new Set(recentPrimaries.map((option) => toOptionKey(option)));
  return options.filter((option) => !recentKeys.has(toOptionKey(option)));
};

const addHistoryEntry = (history, value, limit = 5) => {
  const normalized = normalizeHistoryEntry(value);

  if (!normalized) {
    return createHistoryList(history).slice(0, limit);
  }

  return createHistoryList([normalized, ...history]).slice(0, limit);
};

const pickLunchPair = (options, context, random = Math.random) => {
  const normalizedOptions = createOptionList(options);
  const { lastPrimary, recentPrimaries } = normalizePickContext(context);

  if (normalizedOptions.length === 0) {
    return {
      primary: null,
      secondary: null,
    };
  }

  if (normalizedOptions.length === 1) {
    return {
      primary: normalizedOptions[0],
      secondary: null,
    };
  }

  const previousKey = lastPrimary ? toOptionKey(lastPrimary) : null;
  const withoutPrevious = normalizedOptions.some((option) => toOptionKey(option) === previousKey)
    ? normalizedOptions.filter((option) => toOptionKey(option) !== previousKey)
    : normalizedOptions;
  const withoutRecent = filterOutRecentPrimaries(withoutPrevious, recentPrimaries);
  const primaryPool = withoutRecent.length > 0 ? withoutRecent : withoutPrevious;
  const primary = pickRandom(primaryPool, random);
  const secondaryPool = normalizedOptions.filter((option) => option !== primary);
  const secondary = secondaryPool.length > 0 ? pickRandom(secondaryPool, random) : null;

  return {
    primary,
    secondary,
  };
};

export {
  addHistoryEntry,
  addOption,
  createHistoryList,
  createOptionList,
  pickLunchPair,
  removeOption,
};
