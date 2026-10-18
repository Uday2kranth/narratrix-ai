/**
 * ══════════════════════════════════════════════════════════════════
 * NARRATRIX AI — UI & APPLICATION CONTROLLER (ui.js)
 * ══════════════════════════════════════════════════════════════════
 *
 * This file handles all user interactions, DOM wiring, and local persistence:
 * - Sidebar collapse/expand toggle (Universal hamburger on desktop & mobile)
 * - Dynamic Cast of Characters (Add, minus button to delete, 0-item empty state)
 * - Dynamic Plot Twists (Add, minus button to delete, 0-item empty state)
 * - Story Presets & categorized dropdown selection
 * - Genre Combobox & Story Length selection
 * - IndexedDB + LocalStorage client history & backups
 * - Theme Switcher (Dark Mode ↔ Light Mode)
 * - API Key & Groq Model configuration dialogs
 * - Word Count & Reading Time stats
 * - Keyboard shortcuts (Ctrl+Enter / Cmd+Enter)
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════
  // DOM ELEMENT REFERENCES
  // ══════════════════════════════════════════════
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

  // Sidebar & Layout
  const sidebar          = $('#sidebar');
  const sidebarCollapse  = $('#sidebarCollapse');
  const sidebarOpen      = $('#sidebarOpen');
  const sidebarOverlay   = $('#sidebarOverlay');
  const newSessionBtn    = $('#newSessionBtn');
  const sessionsList     = $('#sessionsList');
  const themeToggle      = $('#themeToggle');
  const themeIcon        = $('#themeIcon');
  const themeLabel       = $('#themeLabel');
  const exportHistoryBtn = $('#exportHistoryBtn');
  const clearHistoryBtn  = $('#clearHistoryBtn');

  // Header
  const modelSelect      = $('#modelSelect');
  const statusDot        = $('#statusDot');
  const statusText       = $('#statusText');
  const btnApiKey        = $('#btnApiKey');
  const modeStoryBtn     = $('#modeStory');
  const modeChatBtn      = $('#modeChat');
  const modeSlider       = $('#modeSlider');

  // Views
  const storyConfigView  = $('#storyConfigView');
  const storyResultView  = $('#storyResultView');
  const chatView         = $('#chatView');

  // Presets & Parameters
  const presetDropdownWrap = $('#presetDropdownWrap');
  const presetSelectBtn    = $('#presetSelectBtn');
  const presetSelectedIcon = $('#presetSelectedIcon');
  const presetSelectedTitle= $('#presetSelectedTitle');
  const presetSelectedDesc = $('#presetSelectedDesc');
  const presetArrow        = $('#presetArrow');
  const presetDropdownMenu = $('#presetDropdownMenu');
  const presetClearBtn     = $('#presetClearBtn');
  const genreInput         = $('#genreInput');
  const genreToggle        = $('#genreToggle');
  const genreDropdown      = $('#genreDropdown');
  const lengthSelector     = $('#lengthSelector');

  // Dynamic Characters & Twists
  const charactersContainer= $('#charactersContainer');
  const addCharacterBtn    = $('#addCharacterBtn');
  const clearCharactersBtn = $('#clearCharactersBtn');
  const twistsContainer    = $('#twistsContainer');
  const addTwistBtn        = $('#addTwistBtn');
  const clearTwistsBtn     = $('#clearTwistsBtn');

  // Story Input & Execution
  const storyPromptInput   = $('#storyPromptInput');
  const generateBtn        = $('#generateStoryBtn');

  // Story Result
  const resultPromptBody   = $('#resultPromptBody');
  const resultStoryEl      = $('#resultStoryContent');
  const resultStoryStats   = $('#resultStoryStats');
  const editPromptBtn      = $('#editPromptBtn');
  const regenerateBtn      = $('#regenerateBtn');
  const copyStoryBtn       = $('#copyStoryBtn');
  const downloadStoryBtn   = $('#downloadStoryBtn');
  const newStoryBtn        = $('#newStoryBtn');

  // Chat
  const chatScroll         = $('#chatScroll');
  const chatWelcome        = $('#chatWelcome');
  const chatMessages       = $('#chatMessages');
  const chatInput          = $('#chatInput');
  const chatSendBtn        = $('#chatSendBtn');

  // Overlay & Modal
  const generatingOverlay  = $('#generatingOverlay');
  const modalOverlay       = $('#modalOverlay') || $('#modalBackdrop');
  const modalClose         = $('#modalClose');
  const apiKeyInput        = $('#apiKeyInput');
  const toggleKeyVis       = $('#toggleKeyVis');
  const fetchModelsBtn     = $('#fetchModelsBtn');
  const modalModelList     = $('#modalModelList');
  const btnRemoveKey       = $('#btnRemoveKey');
  const btnSaveKey         = $('#btnSaveKey');
  const toastContainer     = $('#toastContainer');


  // ── Safe accessors for presets.js data ──
  const getRoles = () => (typeof window !== 'undefined' && window.CHARACTER_ROLES) || (typeof CHARACTER_ROLES !== 'undefined' ? CHARACTER_ROLES : []);
  const getPresets = () => (typeof window !== 'undefined' && window.PRESETS) || (typeof PRESETS !== 'undefined' ? PRESETS : []);
  const getGenres = () => (typeof window !== 'undefined' && window.GENRES) || (typeof GENRES !== 'undefined' ? GENRES : []);
  const getLengthDict = () => (typeof window !== 'undefined' && window.LENGTH_PRESETS) || (typeof LENGTH_PRESETS !== 'undefined' ? LENGTH_PRESETS : {});

  // ══════════════════════════════════════════════
  // UI STATE
  // ══════════════════════════════════════════════
  let state = {
    mode: 'story',            // 'story' | 'chat'
    currentSessionId: null,
    isGenerating: false,
    activePresetId: null,
    selectedLength: 'standard',
    storyConfig: {
      genre: '',
      length: 'standard',
      characters: [],
      twists: [],
      prompt: '',
    },
    lastStoryRaw: '',
  };


  // ══════════════════════════════════════════════
  // INDEXEDDB CLIENT STORAGE (Pure Frontend Backups)
  // ══════════════════════════════════════════════
  const DB_NAME = 'NarratrixDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'sessions';
  let dbInstance = null;

  function initIndexedDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => {
          dbInstance = e.target.result;
          resolve(dbInstance);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  function getLocalSessions() {
    try {
      const raw = localStorage.getItem('narratrix_sessions');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveLocalSessions(sessions) {
    try {
      localStorage.setItem('narratrix_sessions', JSON.stringify(sessions));
    } catch {
      // quota safeguard
    }
  }

  async function persistSession(session) {
    // 1. Sync to LocalStorage (fast cache)
    const sessions = getLocalSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.unshift(session);
    saveLocalSessions(sessions);

    // 2. High-capacity IndexedDB storage
    if (dbInstance) {
      try {
        const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(session);
      } catch (e) {
        console.warn('IndexedDB write error:', e);
      }
    }
  }

  async function removePersistedSession(id) {
    const sessions = getLocalSessions().filter(s => s.id !== id);
    saveLocalSessions(sessions);

    if (dbInstance) {
      try {
        const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
      } catch (e) {
        console.warn('IndexedDB delete error:', e);
      }
    }
  }

  async function clearAllPersistedSessions() {
    saveLocalSessions([]);
    if (dbInstance) {
      try {
        const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
      } catch (e) {
        console.warn('IndexedDB clear error:', e);
      }
    }
  }


  // ══════════════════════════════════════════════
  // TOAST NOTIFICATIONS & ON-SCREEN ALERTS
  // ══════════════════════════════════════════════
  function getToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = 'info', duration = 3500) {
    if (!message) return;
    try {
      const container = getToastContainer();
      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;

      const iconChar = type === 'success' ? '✓' : (type === 'error' ? '⚠️' : 'ℹ️');
      toast.innerHTML = `
        <span class="toast-icon">${iconChar}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
      `;

      container.appendChild(toast);

      // Trigger animation
      requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
      });

      setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 250);
      }, duration);
    } catch (e) {
      console.warn('Toast rendering fallback:', message, e);
    }
  }

  function showErrorBanner(message, hint = '') {
    const banner = document.getElementById('generationErrorBanner');
    if (!banner) return;
    banner.style.display = 'block';
    banner.innerHTML = `
      <div class="error-banner__header">
        <i class="lucide lucide-alert-triangle"></i>
        <span>Story Generation Failed</span>
      </div>
      <div class="error-banner__msg">${escapeHtml(message)}</div>
      <div class="error-banner__hint">
        ${hint ? escapeHtml(hint) : '💡 <strong>Fix:</strong> Switch to <strong>llama-3.3-70b-versatile</strong> in the Model dropdown at the top, or verify your Groq API key via the "API Key" button.'}
      </div>
    `;
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearErrorBanner() {
    const banner = document.getElementById('generationErrorBanner');
    if (banner) {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function timeAgo(dateOrTs) {
    const ms = Date.now() - new Date(dateOrTs).getTime();
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateOrTs).toLocaleDateString();
  }


  // ══════════════════════════════════════════════
  // MARKDOWN RENDERING
  // ══════════════════════════════════════════════
  function renderMarkdown(text) {
    if (window.marked && typeof window.marked.parse === 'function') {
      try {
        return window.marked.parse(text);
      } catch {
        // fallback
      }
    }
    // High-fidelity fallback parser
    let h = escapeHtml(text)
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br />');
    return `<p>${h}</p>`;
  }


  // ══════════════════════════════════════════════
  // UNIVERSAL SIDEBAR & HAMBURGER CONTROLLER
  // ══════════════════════════════════════════════
  const STORAGE_SIDEBAR_COLLAPSED = 'narratrix_sidebar_collapsed';

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function toggleSidebar() {
    if (isMobile()) {
      const isOpen = sidebar.classList.contains('sidebar--open');
      if (isOpen) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    } else {
      const isCollapsed = sidebar.classList.contains('sidebar--collapsed');
      if (isCollapsed) {
        expandDesktopSidebar();
      } else {
        collapseDesktopSidebar();
      }
    }
  }

  function collapseDesktopSidebar() {
    sidebar.classList.add('sidebar--collapsed');
    localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED, 'true');
    sidebarOpen.setAttribute('title', 'Expand sidebar');
    sidebarOpen.setAttribute('aria-expanded', 'false');
  }

  function expandDesktopSidebar() {
    sidebar.classList.remove('sidebar--collapsed');
    localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED, 'false');
    sidebarOpen.setAttribute('title', 'Collapse sidebar');
    sidebarOpen.setAttribute('aria-expanded', 'true');
  }

  function openMobileSidebar() {
    sidebar.classList.add('sidebar--open');
    sidebarOverlay.classList.add('sidebar-overlay--visible');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('sidebar--open');
    sidebarOverlay.classList.remove('sidebar-overlay--visible');
  }

  function initSidebarState() {
    const saved = localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED);
    if (!isMobile() && saved === 'true') {
      collapseDesktopSidebar();
    }
  }

  sidebarOpen.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  sidebarCollapse.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMobile()) {
      closeMobileSidebar();
    } else {
      collapseDesktopSidebar();
    }
  });

  sidebarOverlay.addEventListener('click', closeMobileSidebar);


  // ══════════════════════════════════════════════
  // THEME SWITCHER (Dark ↔ Light)
  // ══════════════════════════════════════════════
  const STORAGE_THEME = 'narratrix_theme';

  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
    const isDark = theme === 'dark';
    themeIcon.className = isDark ? 'lucide lucide-moon' : 'lucide lucide-sun';
    themeLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
  }

  function toggleTheme() {
    const cur = document.body.getAttribute('data-theme') || 'dark';
    setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  themeToggle.addEventListener('click', toggleTheme);

  const initialTheme = localStorage.getItem(STORAGE_THEME) ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  setTheme(initialTheme);


  // ══════════════════════════════════════════════
  // API KEY & MODEL CONTROLS
  // ══════════════════════════════════════════════
  function updateApiStatusIndicator() {
    const hasKey = window.NarratrixAI.hasApiKey();
    if (hasKey) {
      statusDot.className = 'status-dot status-dot--connected';
      statusText.textContent = 'Groq Connected';
    } else {
      statusDot.className = 'status-dot status-dot--disconnected';
      statusText.textContent = 'No Key';
    }
    modelSelect.disabled = false;
  }

  function openApiKeyModal() {
    apiKeyInput.value = window.NarratrixAI.getApiKey();
    if (modalOverlay) modalOverlay.classList.add('modal-overlay--visible');
    apiKeyInput.focus();
    if (window.NarratrixAI.hasApiKey()) {
      populateModalModels();
    }
  }

  function closeApiKeyModal() {
    if (modalOverlay) modalOverlay.classList.remove('modal-overlay--visible');
  }

  async function populateModalModels() {
    modalModelList.innerHTML = '<p class="text-muted"><i class="lucide lucide-loader"></i> Fetching models from Groq…</p>';
    try {
      const models = await window.NarratrixAI.fetchGroqModels();
      renderModelSelectors(models);
      modalModelList.innerHTML = `
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:var(--sp-2);">
          ✓ Loaded ${models.length} active models from Groq
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:4px;">
          ${models.slice(0, 8).map(m => `
            <span class="model-tag" style="padding:2px 8px; border-radius:12px; background:var(--bg-card); border:1px solid var(--border-subtle); font-size:0.7rem; font-family:var(--font-mono);">
              ${escapeHtml(m.id)}
            </span>
          `).join('')}
        </div>
      `;
    } catch (err) {
      modalModelList.innerHTML = `<p class="text-danger" style="font-size:0.78rem;">⚠️ ${escapeHtml(err.message)}</p>`;
    }
  }

  function renderModelSelectors(models) {
    if (!models || models.length === 0) return;
    const current = window.NarratrixAI.getSelectedModel();

    modelSelect.innerHTML = models.map(m => {
      const isSelected = (m.id === current) || (m.name === current);
      return `<option value="${escapeAttr(m.id)}" ${isSelected ? 'selected' : ''}>${escapeHtml(m.name || m.id)}</option>`;
    }).join('');

    modelSelect.disabled = false;
  }

  btnApiKey.addEventListener('click', openApiKeyModal);
  if (modalClose) modalClose.addEventListener('click', closeApiKeyModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeApiKeyModal();
    });
  }

  toggleKeyVis.addEventListener('click', () => {
    const isPw = apiKeyInput.type === 'password';
    apiKeyInput.type = isPw ? 'text' : 'password';
    toggleKeyVis.querySelector('i').className = isPw ? 'lucide lucide-eye-off' : 'lucide lucide-eye';
  });

  btnSaveKey.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showToast('Please enter a valid Groq API key.', 'error');
      return;
    }
    window.NarratrixAI.saveApiKey(key);
    updateApiStatusIndicator();
    closeApiKeyModal();
    clearErrorBanner();
    showToast('API key connected for this session.', 'success');

    try {
      const models = await window.NarratrixAI.fetchGroqModels();
      renderModelSelectors(models);
    } catch (err) {
      console.warn('Groq model refresh error:', err.message);
    }
  });

  btnRemoveKey.addEventListener('click', () => {
    window.NarratrixAI.removeApiKey();
    apiKeyInput.value = '';
    updateApiStatusIndicator();
    modalModelList.innerHTML = '<p class="text-muted">Save your API key to fetch available models.</p>';
    closeApiKeyModal();
    showToast('API key removed from session.', 'info');
  });

  fetchModelsBtn.addEventListener('click', () => {
    const tempKey = apiKeyInput.value.trim();
    if (tempKey) window.NarratrixAI.saveApiKey(tempKey);
    populateModalModels();
  });

  modelSelect.addEventListener('change', () => {
    window.NarratrixAI.setSelectedModel(modelSelect.value);
    showToast(`Model set to ${modelSelect.value}`, 'info');
  });


  // ══════════════════════════════════════════════
  // DYNAMIC CAST OF CHARACTERS (ALLOWS TRUE ZERO)
  // ══════════════════════════════════════════════
  function updateCharacterRosterView() {
    const count = charactersContainer.children.length;
    let placeholder = $('#charEmptyState');

    if (count === 0) {
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'charEmptyState';
        placeholder.className = 'empty-roster-placeholder';
        placeholder.innerHTML = `
          <i class="lucide lucide-users"></i>
          <span>No custom characters defined. The AI will freely invent an ensemble based on your prompt.</span>
          <button type="button" class="btn btn--ghost btn--small" id="charAddFirstBtn">
            <i class="lucide lucide-plus"></i> Add Character
          </button>
        `;
        charactersContainer.appendChild(placeholder);
        $('#charAddFirstBtn', placeholder).addEventListener('click', () => addCharacterCard());
      }
    } else {
      if (placeholder) placeholder.remove();
    }
  }

  function createCharacterCard(data = {}) {
    const card = document.createElement('div');
    card.className = 'character-card';

    const selectedRole = data.role || 'Protagonist';

    card.innerHTML = `
      <div class="character-card__top">
        <input type="text" class="field__input char-name-input" placeholder="Character Name (e.g. Maya Chen)" value="${escapeAttr(data.name || '')}" />
        <select class="character-card__role-select char-role-select">
          ${getRoles().map(r => `<option value="${escapeAttr(r)}" ${r === selectedRole ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
        </select>
        <button type="button" class="character-card__remove-btn" title="Delete character" aria-label="Delete character">
          <span class="remove-btn-icon">−</span>
        </button>
      </div>
      <input type="text" class="field__input char-traits-input" placeholder="Traits (e.g. Cynical book restorer, photographic memory)" value="${escapeAttr(data.traits || '')}" />
    `;

    card.querySelector('.character-card__remove-btn').addEventListener('click', () => {
      card.remove();
      updateCharacterRosterView();
    });

    return card;
  }

  function addCharacterCard(data = {}) {
    const placeholder = $('#charEmptyState');
    if (placeholder) placeholder.remove();

    const card = createCharacterCard(data);
    charactersContainer.appendChild(card);
    updateCharacterRosterView();

    const nameInput = $('.char-name-input', card);
    if (nameInput) nameInput.focus();
  }

  function getCharacters() {
    const cards = $$('.character-card', charactersContainer);
    return cards.map(c => {
      const name = $('.char-name-input', c).value.trim();
      const role = $('.char-role-select', c).value;
      const traits = $('.char-traits-input', c).value.trim();
      return { name, role, traits };
    }).filter(c => c.name || c.traits);
  }

  function setCharacters(list = []) {
    charactersContainer.innerHTML = '';
    if (list && Array.isArray(list) && list.length > 0) {
      list.forEach(c => charactersContainer.appendChild(createCharacterCard(c)));
    }
    updateCharacterRosterView();
  }

  addCharacterBtn.addEventListener('click', () => addCharacterCard());

  if (clearCharactersBtn) {
    clearCharactersBtn.addEventListener('click', () => {
      setCharacters([]);
      showToast('Cleared character ensemble.', 'info');
    });
  }


  // ══════════════════════════════════════════════
  // DYNAMIC PLOT TWISTS (ALLOWS TRUE ZERO)
  // ══════════════════════════════════════════════
  function updateTwistListView() {
    const items = $$('.twist-item', twistsContainer);
    let placeholder = $('#twistEmptyState');

    if (items.length === 0) {
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'twistEmptyState';
        placeholder.className = 'empty-roster-placeholder';
        placeholder.innerHTML = `
          <i class="lucide lucide-sparkles"></i>
          <span>No plot twists defined. The narrative will flow organically from your scene prompt.</span>
          <button type="button" class="btn btn--ghost btn--small" id="twistAddFirstBtn">
            <i class="lucide lucide-plus"></i> Add Twist / Beat
          </button>
        `;
        twistsContainer.appendChild(placeholder);
        $('#twistAddFirstBtn', placeholder).addEventListener('click', () => addTwistRow());
      }
    } else {
      if (placeholder) placeholder.remove();
      items.forEach((el, i) => {
        const numEl = el.querySelector('.twist-item__num');
        if (numEl) numEl.textContent = `#${i + 1}`;
      });
    }
  }

  function createTwistRow(text = '', index = 1) {
    const row = document.createElement('div');
    row.className = 'twist-item';
    row.innerHTML = `
      <span class="twist-item__num">#${index}</span>
      <input type="text" class="field__input twist-input" placeholder="Describe turning point, complication, or revelation…" value="${escapeAttr(text)}" />
      <button type="button" class="twist-item__remove-btn" title="Delete twist" aria-label="Delete twist">
        <span class="remove-btn-icon">−</span>
      </button>
    `;

    row.querySelector('.twist-item__remove-btn').addEventListener('click', () => {
      row.remove();
      updateTwistListView();
    });

    return row;
  }

  function addTwistRow(text = '') {
    const placeholder = $('#twistEmptyState');
    if (placeholder) placeholder.remove();

    const idx = $$('.twist-item', twistsContainer).length + 1;
    const row = createTwistRow(text, idx);
    twistsContainer.appendChild(row);
    updateTwistListView();

    const input = $('.twist-input', row);
    if (input) input.focus();
  }

  function getTwists() {
    const rows = $$('.twist-input', twistsContainer);
    return rows.map(r => r.value.trim()).filter(Boolean);
  }

  function setTwists(list = []) {
    twistsContainer.innerHTML = '';
    if (list && Array.isArray(list) && list.length > 0) {
      list.forEach((t, i) => {
        twistsContainer.appendChild(createTwistRow(t, i + 1));
      });
    }
    updateTwistListView();
  }

  addTwistBtn.addEventListener('click', () => addTwistRow());

  if (clearTwistsBtn) {
    clearTwistsBtn.addEventListener('click', () => {
      setTwists([]);
      showToast('Cleared plot twists.', 'info');
    });
  }


  // ══════════════════════════════════════════════
  // STORY PRESETS & CATEGORIZED DROPDOWN
  // ══════════════════════════════════════════════
  function renderPresets() {
    const categories = {};
    const presetsList = getPresets();
    presetsList.forEach(p => {
      const cat = p.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(p);
    });

    let html = '';
    for (const [catName, list] of Object.entries(categories)) {
      html += `<div class="preset-category-header">${escapeHtml(catName)}</div>`;
      list.forEach(p => {
        const active = p.id === state.activePresetId ? ' preset-option-item--active' : '';
        html += `
          <div class="preset-option-item${active}" data-preset="${escapeAttr(p.id)}" role="option">
            <span class="preset-option-item__icon">${p.icon}</span>
            <div class="preset-option-item__text">
              <div class="preset-option-item__name">${escapeHtml(p.name)}</div>
              <div class="preset-option-item__desc">${escapeHtml(p.desc)}</div>
            </div>
          </div>
        `;
      });
    }

    presetDropdownMenu.innerHTML = html;

    $$('.preset-option-item', presetDropdownMenu).forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const preset = presetsList.find(p => p.id === el.dataset.preset);
        if (preset) selectPreset(preset);
      });
    });
  }

  function openPresetDropdown() {
    presetDropdownMenu.classList.add('preset-dropdown-menu--open');
    presetSelectBtn.classList.add('preset-select-btn--open');
    presetSelectBtn.setAttribute('aria-expanded', 'true');
  }

  function closePresetDropdown() {
    presetDropdownMenu.classList.remove('preset-dropdown-menu--open');
    presetSelectBtn.classList.remove('preset-select-btn--open');
    presetSelectBtn.setAttribute('aria-expanded', 'false');
  }

  presetSelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (presetDropdownMenu.classList.contains('preset-dropdown-menu--open')) {
      closePresetDropdown();
    } else {
      openPresetDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#presetDropdownWrap')) {
      closePresetDropdown();
    }
  });

  function selectPreset(preset) {
    state.activePresetId = preset.id;
    fillStoryConfig(preset);

    presetSelectedIcon.textContent = preset.icon;
    presetSelectedTitle.textContent = preset.name;
    presetSelectedDesc.textContent = preset.desc;
    presetSelectBtn.classList.add('preset-select-btn--active');
    presetClearBtn.style.display = 'inline-flex';

    closePresetDropdown();
    renderPresets();
  }

  presetClearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearStoryConfig();
  });

  function fillStoryConfig(config) {
    genreInput.value = config.genre || '';
    storyPromptInput.value = config.prompt || '';
    setStoryLength(config.length || 'standard');

    if (config.characters && Array.isArray(config.characters)) {
      setCharacters(config.characters);
    } else {
      setCharacters([]);
    }

    if (config.twists && Array.isArray(config.twists)) {
      setTwists(config.twists);
    } else {
      setTwists([]);
    }
  }

  function clearStoryConfig() {
    genreInput.value = '';
    storyPromptInput.value = '';
    setStoryLength('standard');
    setCharacters([]);
    setTwists([]);
    state.activePresetId = null;

    presetSelectedIcon.textContent = '✨';
    presetSelectedTitle.textContent = 'Choose a Preset Template (Optional)';
    presetSelectedDesc.textContent = 'Explore bedtime stories, satire, What-If divergence, Twilight Zone parables…';
    presetSelectBtn.classList.remove('preset-select-btn--active');
    presetClearBtn.style.display = 'none';

    renderPresets();
  }

  function getStoryConfig() {
    return {
      genre: genreInput.value.trim(),
      length: state.selectedLength || 'standard',
      characters: getCharacters(),
      twists: getTwists(),
      prompt: storyPromptInput.value.trim(),
    };
  }


  // ══════════════════════════════════════════════
  // GENRE COMBOBOX & STORY LENGTH
  // ══════════════════════════════════════════════
  function renderGenreOptions(filter = '') {
    const lower = filter.toLowerCase();
    const filtered = getGenres().filter(g => g.toLowerCase().includes(lower));

    if (filtered.length === 0) {
      genreDropdown.innerHTML = '<div class="combobox__empty">No matches — your custom genre will be used</div>';
    } else {
      genreDropdown.innerHTML = filtered.map(g => {
        const active = genreInput.value === g ? ' combobox__option--active' : '';
        return `<div class="combobox__option${active}" data-value="${escapeAttr(g)}">${escapeHtml(g)}</div>`;
      }).join('');
    }
  }

  function openGenreDropdown() {
    renderGenreOptions(genreInput.value);
    genreDropdown.classList.add('combobox__dropdown--open');
    genreToggle.classList.add('combobox__toggle--open');
  }

  function closeGenreDropdown() {
    genreDropdown.classList.remove('combobox__dropdown--open');
    genreToggle.classList.remove('combobox__toggle--open');
  }

  genreInput.addEventListener('focus', openGenreDropdown);
  genreInput.addEventListener('input', () => {
    renderGenreOptions(genreInput.value);
    if (!genreDropdown.classList.contains('combobox__dropdown--open')) {
      openGenreDropdown();
    }
  });

  genreToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (genreDropdown.classList.contains('combobox__dropdown--open')) closeGenreDropdown();
    else {
      openGenreDropdown();
      genreInput.focus();
    }
  });

  genreDropdown.addEventListener('click', (e) => {
    const opt = e.target.closest('.combobox__option');
    if (!opt) return;
    genreInput.value = opt.dataset.value;
    closeGenreDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#genreCombobox')) closeGenreDropdown();
  });

  function setStoryLength(lengthKey) {
    state.selectedLength = lengthKey || 'standard';
    $$('.length-btn', lengthSelector).forEach(btn => {
      const active = btn.dataset.length === state.selectedLength;
      btn.classList.toggle('length-btn--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  $$('.length-btn', lengthSelector).forEach(btn => {
    btn.addEventListener('click', () => setStoryLength(btn.dataset.length));
  });


  // ══════════════════════════════════════════════
  // VIEW MANAGEMENT & MODE SWITCHING
  // ══════════════════════════════════════════════
  function showView(viewName) {
    [storyConfigView, storyResultView, chatView].forEach(v => v.classList.remove('view--active'));
    if (viewName === 'storyConfig') storyConfigView.classList.add('view--active');
    else if (viewName === 'storyResult') storyResultView.classList.add('view--active');
    else if (viewName === 'chat') chatView.classList.add('view--active');
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode === 'story') {
      modeStoryBtn.classList.add('mode-btn--active');
      modeChatBtn.classList.remove('mode-btn--active');
      modeSlider.classList.remove('mode-slider--right');
    } else {
      modeChatBtn.classList.add('mode-btn--active');
      modeStoryBtn.classList.remove('mode-btn--active');
      modeSlider.classList.add('mode-slider--right');
    }
  }

  modeStoryBtn.addEventListener('click', () => {
    if (state.mode === 'story') return;
    setMode('story');
    startNewSession();
  });

  modeChatBtn.addEventListener('click', () => {
    if (state.mode === 'chat') return;
    setMode('chat');
    startNewSession();
  });


  // ══════════════════════════════════════════════
  // STORY GENERATION & RESULT VIEW
  // ══════════════════════════════════════════════
  generateBtn.addEventListener('click', () => generateStory());
  regenerateBtn.addEventListener('click', () => generateStory(state.storyConfig));

  editPromptBtn.addEventListener('click', () => {
    fillStoryConfig(state.storyConfig);
    showView('storyConfig');
  });

  newStoryBtn.addEventListener('click', () => startNewSession());

  copyStoryBtn.addEventListener('click', () => {
    if (!state.lastStoryRaw) return;
    navigator.clipboard.writeText(state.lastStoryRaw).then(() => {
      copyStoryBtn.innerHTML = '<i class="lucide lucide-check"></i> Copied';
      setTimeout(() => {
        copyStoryBtn.innerHTML = '<i class="lucide lucide-copy"></i> Copy Story';
      }, 2000);
    }).catch(() => showToast('Failed to copy.', 'error'));
  });

  // Keyboard Shortcut: Ctrl+Enter / Cmd+Enter
  storyPromptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateStory();
    }
  });

  async function generateStory(configOverride) {
    clearErrorBanner();
    const config = configOverride || getStoryConfig();

    if (!config.prompt) {
      const msg = 'Please describe your scene or prompt first.';
      showToast(msg, 'error');
      showErrorBanner(msg, 'Pick a preset template from the dropdown above, or type your scene prompt into the text box below.');
      storyPromptInput.focus();
      return;
    }

    if (!window.NarratrixAI.hasApiKey()) {
      const msg = 'Groq API Key is not set.';
      showToast(msg, 'error');
      showErrorBanner(msg, 'Click the "API Key" button in the top header and enter your Groq API key (starts with gsk_).');
      openApiKeyModal();
      return;
    }

    const currentModel = (modelSelect && modelSelect.value)
      ? modelSelect.value
      : window.NarratrixAI.getSelectedModel();

    state.isGenerating = true;
    generatingOverlay.classList.add('generating-overlay--active');

    try {
      // 1. Build immutable system prompt using the explainable AI engine
      const systemPrompt = window.NarratrixAI.buildStorySystemPrompt(config);
      const lengthProfile = getLengthDict()[config.length || 'standard'] || { tokens: 2500 };

      // 2. Execute stateless Groq API call
      const storyText = await window.NarratrixAI.callGroqChat({
        systemPrompt,
        userPrompt: config.prompt,
        model: currentModel,
        maxTokens: lengthProfile.tokens,
      });

      state.storyConfig = { ...config };
      state.lastStoryRaw = storyText;

      renderResultView(config, storyText);
      showView('storyResult');

      // 3. Save to client storage history
      if (!state.currentSessionId) {
        state.currentSessionId = 'sess_' + Date.now();
      }
      await persistSession({
        id: state.currentSessionId,
        mode: 'story',
        title: config.genre || config.prompt.slice(0, 32) + '…',
        config,
        storyResult: storyText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      renderSessions();
      showToast('Scene generated successfully!', 'success');
    } catch (err) {
      console.error('Narratrix Story Generation Error:', err);
      showToast(err.message, 'error', 7000);
      showErrorBanner(err.message);
    } finally {
      state.isGenerating = false;
      generatingOverlay.classList.remove('generating-overlay--active');
    }
  }

  function renderResultView(config, storyText) {
    // 1. Parameter chips
    let chipsHtml = '';
    if (config.genre) {
      chipsHtml += `<span class="result-param-chip"><strong>Genre:</strong> ${escapeHtml(config.genre)}</span>`;
    }
    const lenLabel = getLengthDict()[config.length]?.label || config.length;
    chipsHtml += `<span class="result-param-chip"><strong>Length:</strong> ${escapeHtml(lenLabel)}</span>`;

    if (config.characters && config.characters.length > 0) {
      const castStr = config.characters.map(c => `${c.name || 'Unnamed'} (${c.role})`).join(', ');
      chipsHtml += `<span class="result-param-chip"><strong>Cast:</strong> ${escapeHtml(castStr)}</span>`;
    }

    if (config.twists && config.twists.length > 0) {
      chipsHtml += `<span class="result-param-chip"><strong>Twists:</strong> ${config.twists.length} defined</span>`;
    }

    resultPromptBody.innerHTML = `
      <div class="result-prompt-chips">${chipsHtml}</div>
      <div class="result-prompt-quote">${escapeHtml(config.prompt)}</div>
    `;

    // 2. Word count & reading time badge
    const stats = window.NarratrixAI.calculateStoryStats(storyText);
    if (resultStoryStats) {
      resultStoryStats.textContent = stats.badge;
      resultStoryStats.style.display = 'inline-flex';
    }

    // 3. Render markdown prose
    resultStoryEl.innerHTML = renderMarkdown(storyText);
  }


  // ══════════════════════════════════════════════
  // CHAT MODE (Speculative Fiction Consultant)
  // ══════════════════════════════════════════════
  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text || state.isGenerating) return;

    if (!window.NarratrixAI.hasApiKey()) {
      showToast('Please configure your Groq API key.', 'error');
      openApiKeyModal();
      return;
    }

    chatInput.value = '';
    chatWelcome.style.display = 'none';

    appendChatMessage('user', text, true);

    state.isGenerating = true;
    chatSendBtn.disabled = true;

    const botMsgEl = appendChatMessage('assistant', '', true, true);

    try {
      const currentModel = (modelSelect && modelSelect.value)
        ? modelSelect.value
        : window.NarratrixAI.getSelectedModel();

      const reply = await window.NarratrixAI.callGroqChat({
        systemPrompt: window.NarratrixAI.CHAT_SYSTEM_PROMPT,
        userPrompt: text,
        model: currentModel,
        maxTokens: 2048,
      });

      botMsgEl.classList.remove('chat-bubble--loading');
      botMsgEl.innerHTML = renderMarkdown(reply);

      // Save to session history
      if (!state.currentSessionId) state.currentSessionId = 'sess_' + Date.now();
      const existing = getLocalSessions().find(s => s.id === state.currentSessionId);
      const messages = existing?.messages || [];
      messages.push({ role: 'user', content: text });
      messages.push({ role: 'assistant', content: reply });

      await persistSession({
        id: state.currentSessionId,
        mode: 'chat',
        title: text.slice(0, 32) + '…',
        messages,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      renderSessions();
    } catch (err) {
      botMsgEl.classList.remove('chat-bubble--loading');
      botMsgEl.innerHTML = `<p class="text-danger">⚠️ ${escapeHtml(err.message)}</p>`;
      showToast(err.message, 'error');
    } finally {
      state.isGenerating = false;
      chatSendBtn.disabled = false;
      chatScroll.scrollTop = chatScroll.scrollHeight;
    }
  }

  function appendChatMessage(role, content, autoScroll = true, isLoading = false) {
    const msg = document.createElement('div');
    msg.className = `chat-message chat-message--${role}`;

    const avatar = role === 'user' ? '👤' : '⬡';
    const author = role === 'user' ? 'You' : 'Narratrix';

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble--${role}${isLoading ? ' chat-bubble--loading' : ''}`;

    if (isLoading) {
      bubble.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
    } else {
      bubble.innerHTML = renderMarkdown(content);
    }

    msg.innerHTML = `
      <div class="chat-message__avatar">${avatar}</div>
      <div class="chat-message__content">
        <div class="chat-message__author">${author}</div>
      </div>
    `;
    msg.querySelector('.chat-message__content').appendChild(bubble);

    chatMessages.appendChild(msg);
    if (autoScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
    return bubble;
  }


  // ══════════════════════════════════════════════
  // SESSION HISTORY MANAGEMENT
  // ══════════════════════════════════════════════
  function startNewSession() {
    state.currentSessionId = 'sess_' + Date.now();
    state.activePresetId = null;
    state.lastStoryRaw = '';
    clearStoryConfig();

    if (state.mode === 'story') {
      showView('storyConfig');
    } else {
      chatMessages.innerHTML = '';
      chatWelcome.style.display = '';
      showView('chat');
    }
    renderSessions();
  }

  function renderSessions() {
    const sessions = getLocalSessions();
    const current = state.currentSessionId;

    if (sessions.length === 0) {
      sessionsList.innerHTML = '<p class="text-muted" style="padding:var(--sp-3);text-align:center;font-size:0.75rem;">No sessions yet</p>';
      return;
    }

    sessionsList.innerHTML = sessions.map(s => {
      const icon = s.mode === 'story' ? '📖' : '💬';
      const time = timeAgo(s.updatedAt || s.createdAt);
      const active = s.id === current ? ' session-item--active' : '';
      return `
        <div class="session-item${active}" data-sid="${s.id}">
          <div class="session-item__icon">${icon}</div>
          <div class="session-item__meta">
            <div class="session-item__title">${escapeHtml(s.title || 'Untitled')}</div>
            <div class="session-item__time">${time}</div>
          </div>
          <button class="session-item__delete" data-delete="${s.id}" title="Delete session" aria-label="Delete session">
            <span class="session-delete-icon">×</span>
          </button>
        </div>
      `;
    }).join('');

    $$('.session-item', sessionsList).forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.session-item__delete')) return;
        loadSession(el.dataset.sid);
        if (isMobile()) closeMobileSidebar();
      });
    });

    $$('.session-item__delete', sessionsList).forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const sid = btn.dataset.delete;
        await removePersistedSession(sid);
        if (state.currentSessionId === sid) {
          startNewSession();
        } else {
          renderSessions();
        }
        showToast('Session removed.', 'info');
      });
    });
  }

  function loadSession(id) {
    const session = getLocalSessions().find(s => s.id === id);
    if (!session) return;

    state.currentSessionId = id;

    if (session.mode === 'story') {
      setMode('story');
      if (session.storyResult) {
        state.storyConfig = { ...session.config };
        state.lastStoryRaw = session.storyResult;
        renderResultView(session.config, session.storyResult);
        showView('storyResult');
      } else {
        if (session.config) fillStoryConfig(session.config);
        showView('storyConfig');
      }
    } else {
      setMode('chat');
      chatMessages.innerHTML = '';
      chatWelcome.style.display = (session.messages && session.messages.length > 0) ? 'none' : '';
      if (session.messages) {
        session.messages.forEach(m => appendChatMessage(m.role, m.content, false));
      }
      showView('chat');
    }
    renderSessions();
  }

  newSessionBtn.addEventListener('click', startNewSession);

  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Clear all story and chat history?')) {
      await clearAllPersistedSessions();
      startNewSession();
      showToast('All session history cleared.', 'info');
    }
  });


  // ══════════════════════════════════════════════
  // EXPORT & DOWNLOAD (Local Backups)
  // ══════════════════════════════════════════════
  function exportAllSessions() {
    const sessions = getLocalSessions();
    if (sessions.length === 0) {
      showToast('No sessions to export.', 'error');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `narratrix-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Exported all stories as JSON backup.', 'success');
  }

  function downloadCurrentStory() {
    if (!state.lastStoryRaw) {
      showToast('No story content to download.', 'error');
      return;
    }
    const config = state.storyConfig || {};
    let md = `# ${config.genre || 'Story'} — Draft\n\n`;
    if (config.length) md += `> **Length:** ${getLengthDict()[config.length]?.label || config.length}\n`;
    if (config.characters && config.characters.length > 0) {
      md += `> **Cast:** ${config.characters.map(c => `${c.name} [${c.role}]`).join(', ')}\n`;
    }
    if (config.twists && config.twists.length > 0) {
      md += `> **Twists:** ${config.twists.join(' | ')}\n`;
    }
    md += `\n---\n\n${state.lastStoryRaw}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = (config.genre || 'narratrix-story').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${slug}-${Date.now().toString().slice(-4)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Story downloaded as Markdown (.md).', 'success');
  }

  exportHistoryBtn.addEventListener('click', exportAllSessions);
  downloadStoryBtn.addEventListener('click', downloadCurrentStory);


  // ══════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════
  async function init() {
    await initIndexedDB();
    initSidebarState();

    // 1. Immediately pre-populate model selector with curated popular models
    const initialModels = (window.NarratrixAI && window.NarratrixAI.getPopularModels)
      ? window.NarratrixAI.getPopularModels()
      : [
          { id: 'qwen/qwen3.8-27b',        name: 'Qwen 3.8 27B (Story & Creative Prose)' },
          { id: 'openai/gpt-oss-120b',     name: 'GPT OSS 120B (High Capability Fiction)' },
          { id: 'openai/gpt-oss-20b',      name: 'GPT OSS 20B (Fast Narrative)' },
          { id: 'allan-2-7b',              name: 'Allan 2 7B (Lightweight Story)' },
          { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B Versatile (Class Reference)' },
          { id: 'llama-3.1-8b-instant',    name: 'LLaMA 3.1 8B Instant (Fast)' },
        ];
    renderModelSelectors(initialModels);

    updateApiStatusIndicator();
    renderPresets();
    renderSessions();
    updateCharacterRosterView();
    updateTwistListView();

    // 2. If a valid key already exists in session, asynchronously fetch full live list
    if (window.NarratrixAI.hasApiKey()) {
      try {
        const liveModels = await window.NarratrixAI.fetchGroqModels();
        renderModelSelectors(liveModels);
      } catch (err) {
        console.warn('Initial live models refresh:', err.message);
      }
    }
  }

  let initialized = false;
  function safeInit() {
    if (initialized) return;
    initialized = true;
    init();
  }

  document.addEventListener('DOMContentLoaded', safeInit);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    safeInit();
  }

})();
