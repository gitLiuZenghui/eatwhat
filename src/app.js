import { addHistoryEntry, addOption, pickLunchPair, removeOption } from './core/lunch.js';
import { loadState, saveState } from './storage.js';

let state = loadState();

const historyLimit = 6;
const drawDuration = 900;
let isDrawing = false;

const optionForm = document.querySelector('#option-form');
const optionInput = document.querySelector('#option-input');
const optionList = document.querySelector('#option-list');
const formMessage = document.querySelector('#form-message');
const clearButton = document.querySelector('#clear-button');
const exportButton = document.querySelector('#export-button');
const importButton = document.querySelector('#import-button');
const importFileInput = document.querySelector('#import-file-input');
const pickButton = document.querySelector('#pick-button');
const primaryResult = document.querySelector('#primary-result');
const secondaryResult = document.querySelector('#secondary-result');
const primaryCard = document.querySelector('#primary-card');
const secondaryCard = document.querySelector('#secondary-card');
const recentList = document.querySelector('#recent-list');
const historyList = document.querySelector('#history-list');
const excludeCountInput = document.querySelector('#exclude-count-input');
const clearHistoryButton = document.querySelector('#clear-history-button');

const setMessage = (message, type = 'info') => {
  formMessage.textContent = message;
  formMessage.classList.toggle('error', type === 'error');
};

const persistState = (nextState) => {
  state = nextState;
  saveState(localStorage, state);
};

const formatDateTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const renderResults = (result = null) => {
  const primary = result?.primary ?? null;
  const secondary = result?.secondary ?? null;

  primaryResult.textContent = primary ?? '还没抽';
  primaryResult.classList.toggle('empty', !primary);

  secondaryResult.textContent = secondary ?? '这次没有备选';
  secondaryResult.classList.toggle('empty', !secondary);

  pickButton.textContent = primary ? '换一个' : '帮我决定';
};

const animateResult = () => {
  [primaryCard, secondaryCard].forEach((card) => {
    card.classList.remove('is-picked');
    window.requestAnimationFrame(() => {
      card.classList.add('is-picked');
    });
  });

  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const playDrawBurst = () => new Promise((resolve) => {
  const anchor = primaryCard.getBoundingClientRect();
  const originX = anchor.left + anchor.width / 2;
  const originY = anchor.top + anchor.height * 0.42;
  const colors = ['#FF5E00', '#FF6A00', '#FF8C42', '#FFC857', '#FFFFFF', '#FFB347'];
  const particleCount = Math.min(86, Math.max(54, Math.floor(window.innerWidth / 5)));
  const fragment = document.createDocumentFragment();

  Array.from({ length: particleCount }).forEach((_, index) => {
    const particle = document.createElement('span');
    const anglePool = index % 7 === 0
      ? Math.PI * (0.22 + Math.random() * 0.56)
      : Math.PI * (1.02 + Math.random() * 0.96);
    const distance = 130 + Math.random() * 130;
    const size = 7 + Math.random() * 8;
    const driftY = index % 7 === 0 ? Math.abs(Math.sin(anglePool)) * distance : Math.sin(anglePool) * distance;

    particle.className = 'draw-particle';
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty('--x', `${Math.cos(anglePool) * distance}px`);
    particle.style.setProperty('--y', `${driftY}px`);
    particle.style.animationDelay = `${Math.random() * 90}ms`;
    fragment.append(particle);
  });

  document.body.classList.add('is-drawing');
  document.body.append(fragment);
  window.setTimeout(() => {
    document.querySelectorAll('.draw-particle').forEach((particle) => particle.remove());
    document.body.classList.remove('is-drawing');
    resolve();
  }, drawDuration);
});

const createChip = (text, empty = false) => {
  const item = document.createElement('li');
  item.className = empty ? 'history-empty' : 'history-chip';
  item.textContent = text;
  return item;
};

const getHistoryPrimary = (entry) => (typeof entry === 'string' ? entry : entry.primary);

const createHistoryRecord = (entry) => {
  const item = document.createElement('li');
  item.className = 'history-record';
  const primary = getHistoryPrimary(entry);
  const secondary = typeof entry === 'string' ? null : entry.secondary;

  const title = document.createElement('strong');
  title.textContent = secondary ? `${primary}，备选 ${secondary}` : primary;

  const time = document.createElement('span');
  time.textContent = typeof entry === 'string' ? '旧记录' : formatDateTime(entry.ts);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'history-remove-button';
  removeButton.textContent = '删除';
  removeButton.addEventListener('click', () => {
    persistState({
      ...state,
      history: state.history.filter((item) => item !== entry),
      recentPrimaries: removeOption(state.recentPrimaries, primary),
      lastPrimary: state.lastPrimary === primary ? null : state.lastPrimary,
    });
    renderHistory();
    setMessage(`已删除历史：${primary}`);
  });

  item.append(title, time, removeButton);
  return item;
};

const renderRecentList = () => {
  recentList.replaceChildren();

  if (state.recentPrimaries.length === 0) {
    recentList.append(createChip('最近还没记录', true));
    return;
  }

  state.recentPrimaries.forEach((item) => {
    recentList.append(createChip(item));
  });
};

const renderHistoryRecords = () => {
  historyList.replaceChildren();

  if (state.history.length === 0) {
    historyList.append(createChip('历史还没记录', true));
    return;
  }

  state.history.forEach((entry) => {
    historyList.append(createHistoryRecord(entry));
  });
};

const createOptionItem = (option) => {
  const item = document.createElement('li');
  item.className = 'option-item';

  const name = document.createElement('span');
  name.className = 'option-name';
  name.textContent = option;

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-button';
  removeButton.textContent = '删除';
  removeButton.addEventListener('click', () => {
    const nextOptions = removeOption(state.options, option);
    const nextState = {
      ...state,
      options: nextOptions,
      lastPrimary: state.lastPrimary === option ? null : state.lastPrimary,
      recentPrimaries: removeOption(state.recentPrimaries, option),
      history: state.history.filter((entry) => getHistoryPrimary(entry) !== option),
    };

    persistState(nextState);
    renderOptions();
    renderHistory();
    renderResults();
    setMessage(`已删除：${option}`);
  });

  item.append(name, removeButton);
  return item;
};

const renderOptions = () => {
  optionList.replaceChildren();

  if (state.options.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = '还没有候选项，先加几个你中午可能想吃的吧。';
    optionList.append(empty);
    return;
  }

  state.options.forEach((option) => {
    optionList.append(createOptionItem(option));
  });
};

const renderHistory = () => {
  excludeCountInput.value = String(state.excludeRecentCount);
  renderRecentList();
  renderHistoryRecords();
};

exportButton.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ options: state.options }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'eatwhat-options.json';
  link.click();
  URL.revokeObjectURL(url);
  setMessage('已导出候选列表。');
});

importButton.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files?.[0];

  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    const importedOptions = Array.isArray(parsed) ? parsed : parsed.options;
    const nextOptions = importedOptions.reduce((options, option) => addOption(options, option).options, state.options);

    persistState({
      ...state,
      options: nextOptions,
    });
    renderOptions();
    setMessage('已导入候选列表。');
  } catch {
    setMessage('导入失败，请选择正确的 JSON 文件。', 'error');
  } finally {
    importFileInput.value = '';
  }
});

optionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const result = addOption(state.options, optionInput.value);

  if (result.error === 'empty') {
    setMessage('请输入一个吃饭选项。', 'error');
    optionInput.focus();
    return;
  }

  if (result.error === 'duplicate') {
    setMessage('这个选项已经存在了，换一个吧。', 'error');
    optionInput.focus();
    optionInput.select();
    return;
  }

  persistState({
    ...state,
    options: result.options,
  });
  renderOptions();
  setMessage(`已添加：${result.options.at(-1)}`);
  optionForm.reset();
  optionInput.focus();
});

clearButton.addEventListener('click', () => {
  persistState({
    ...state,
    options: [],
    lastPrimary: null,
    recentPrimaries: [],
    history: [],
  });
  renderOptions();
  renderHistory();
  renderResults();
  setMessage('已清空全部候选项。');
});

clearHistoryButton.addEventListener('click', () => {
  persistState({
    ...state,
    lastPrimary: null,
    recentPrimaries: [],
    history: [],
  });
  renderHistory();
  renderResults();
  setMessage('已清空历史记录。');
});

excludeCountInput.addEventListener('change', () => {
  const nextValue = Math.min(10, Math.max(0, Number(excludeCountInput.value) || 0));
  persistState({
    ...state,
    excludeRecentCount: nextValue,
  });
  renderHistory();
  setMessage(`已设置为排除最近 ${nextValue} 次主选。`);
});

pickButton.addEventListener('click', async () => {
  if (isDrawing) {
    return;
  }

  const result = pickLunchPair(
    state.options,
    {
      lastPrimary: state.lastPrimary,
      recentPrimaries: state.recentPrimaries,
      excludeRecentCount: state.excludeRecentCount,
    },
  );

  if (!result.primary) {
    setMessage('请先添加至少一个吃饭选项。', 'error');
    optionInput.focus();
    return;
  }

  isDrawing = true;
  pickButton.disabled = true;
  pickButton.textContent = '抽签中...';
  setMessage('正在帮你认真抽签。');

  await playDrawBurst().catch(() => {
    document.body.classList.remove('is-drawing');
  });

  const nextState = {
    ...state,
    lastPrimary: result.primary,
    recentPrimaries: addHistoryEntry(state.recentPrimaries, result.primary, state.excludeRecentCount || 1),
    history: addHistoryEntry(
      state.history,
      {
        primary: result.primary,
        secondary: result.secondary,
        ts: new Date().toISOString(),
      },
      historyLimit,
    ),
  };

  persistState(nextState);
  renderHistory();
  renderResults(result);
  animateResult();
  setMessage('已帮你抽出这顿午饭。');
  pickButton.disabled = false;
  isDrawing = false;
});

renderOptions();
renderHistory();
renderResults();
setMessage('候选项会自动保存在当前浏览器中。');
