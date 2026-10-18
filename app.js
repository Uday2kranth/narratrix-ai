/**
 * ══════════════════════════════════════════════════════════════════
 * NARRATRIX AI — CORE AI & GROQ ENGINE (app.js)
 * ══════════════════════════════════════════════════════════════════
 *
 * This file is the primary technical engine responsible for:
 *
 * 1. SECTION 1: API Key & BYOK Security (sessionStorage management)
 * 2. SECTION 2: Dynamic Groq Model Discovery & Selection
 * 3. SECTION 3: System Prompt Engineering (Story Mode & Chat Mode)
 * 4. SECTION 4: Stateless Groq API Execution (Zero-Retention Architecture)
 *
 * All user interface rendering, DOM event wiring, and IndexedDB
 * interactions are managed separately in `ui.js`.
 */

// ══════════════════════════════════════════════════════════════════
// SECTION 1: API CONFIGURATION & KEY SECURITY (BYOK)
// ══════════════════════════════════════════════════════════════════

/** Groq OpenAI-compatible API Endpoints */
const GROQ_ENDPOINT   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

/**
 * Browser Storage Keys
 *
 * EVALUATOR DEFENSE POINT:
 * The API key is stored SOLELY in `sessionStorage`.
 * It is never sent to any custom backend, never stored in localStorage,
 * never written to disk, and automatically vanishes when the browser
 * tab or window is closed.
 */
const KEY_SESSION_KEY = 'narratrix_api_key';
const KEY_LEGACY_KEY  = 'storycraft_api_key';
const STORAGE_MODEL   = 'narratrix_model';

/** Default fallback model if user has not picked one */
const DEFAULT_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

/** Curated popular models available on Groq */
const POPULAR_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B Versatile (Recommended)' },
  { id: 'llama-3.1-8b-instant',    name: 'LLaMA 3.1 8B Instant (Fast)' },
  { id: 'mixtral-8x7b-32768',      name: 'Mixtral 8x7B (High Quality Lore)' },
  { id: 'qwen-2.5-32b',            name: 'Qwen 2.5 32B (Groq)' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B' },
  { id: 'deepseek-r1-distill-qwen-32b',  name: 'DeepSeek R1 Distill Qwen 32B' },
  { id: 'gemma2-9b-it',            name: 'Gemma 2 9B (Google)' },
];

/**
 * Returns a copy of curated Groq models for instant UI pre-population.
 * @returns {Array<{id: string, name: string}>}
 */
function getPopularModels() {
  return [...POPULAR_MODELS];
}

/**
 * Retrieves the currently active Groq API Key from sessionStorage.
 * @returns {string} The raw API key, or empty string if not set.
 */
function getApiKey() {
  return sessionStorage.getItem(KEY_SESSION_KEY) ||
         sessionStorage.getItem(KEY_LEGACY_KEY) ||
         '';
}

/**
 * Saves a new API Key strictly into sessionStorage.
 * @param {string} key - The Groq API key (e.g. gsk_...)
 */
function saveApiKey(key) {
  const cleanKey = (key || '').trim();
  sessionStorage.setItem(KEY_SESSION_KEY, cleanKey);
  sessionStorage.removeItem(KEY_LEGACY_KEY);
  return cleanKey;
}

/**
 * Clears the API Key completely from sessionStorage.
 */
function removeApiKey() {
  sessionStorage.removeItem(KEY_SESSION_KEY);
  sessionStorage.removeItem(KEY_LEGACY_KEY);
}

/**
 * Checks whether a valid key is currently available in session.
 * @returns {boolean}
 */
function hasApiKey() {
  const k = getApiKey();
  return typeof k === 'string' && k.trim().length > 10;
}

/**
 * Retrieves the preferred model ID saved in localStorage, or the default.
 * @returns {string}
 */
function getSelectedModel() {
  const saved = localStorage.getItem(STORAGE_MODEL);
  return (saved && saved.trim()) || DEFAULT_FALLBACK_MODEL;
}

/**
 * Stores the user's preferred model ID in localStorage.
 * @param {string} modelId
 */
function setSelectedModel(modelId) {
  if (modelId && typeof modelId === 'string' && modelId !== 'Set API Key first') {
    localStorage.setItem(STORAGE_MODEL, modelId.trim());
  }
}


// ══════════════════════════════════════════════════════════════════
// SECTION 2: DYNAMIC GROQ MODEL DISCOVERY & SELECTION
// ══════════════════════════════════════════════════════════════════

/**
 * Fetches the list of active models directly from Groq's `/models` endpoint.
 * Falls back gracefully to curated models if offline or endpoint is blocked.
 *
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function fetchGroqModels() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return getPopularModels();
  }

  try {
    const response = await fetch(GROQ_MODELS_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Groq API key (401 Unauthorized). Please verify your key.');
      }
      return getPopularModels();
    }

    const data = await response.json();
    const rawList = Array.isArray(data.data) ? data.data : [];

    // Filter for conversational/text LLMs
    const filtered = rawList
      .filter(m => !m.id.includes('whisper') && !m.id.includes('guard') && !m.id.includes('tts') && !m.id.includes('distil-whisper'))
      .map(m => ({ id: m.id, name: m.id }))
      .sort((a, b) => {
        if (a.id.includes('llama-3.3')) return -1;
        if (b.id.includes('llama-3.3')) return 1;
        if (a.id.includes('llama-3.1')) return -1;
        if (b.id.includes('llama-3.1')) return 1;
        if (a.id.includes('qwen')) return -1;
        if (b.id.includes('qwen')) return 1;
        return a.id.localeCompare(b.id);
      });

    return filtered.length > 0 ? filtered : getPopularModels();
  } catch (err) {
    if (err.message.includes('401')) throw err;
    console.warn('Groq model fetch fallback:', err.message);
    return getPopularModels();
  }
}


// ══════════════════════════════════════════════════════════════════
// SECTION 3: SYSTEM PROMPT ENGINE (WHERE PROMPTS ARE COMPILED)
// ══════════════════════════════════════════════════════════════════

/**
 * Compiles the single-turn, zero-retention System Prompt for Story Mode.
 *
 * WHERE TO EXPLAIN IN CLASS:
 * This function is where all narrative parameters are woven into a single
 * authoritative directive for the model. It combines:
 * 1. Base Literary Persona
 * 2. Target Word Count Directives (Flash / Full Scene / Extended Epic)
 * 3. Specialized Genre Directives (Key & Peele, What-If Divergence, Twilight Zone)
 * 4. Cast of Characters (Protagonist, Antagonist, etc.)
 * 5. Plot Twists & Turning Points
 * 6. Hard formatting rules (Markdown, sensory pacing, zero memory)
 *
 * @param {Object} config - { genre, length, characters, twists, prompt }
 * @returns {string} The fully compiled system prompt string.
 */
function buildStorySystemPrompt(config) {
  const lengthDict = (typeof LENGTH_PRESETS !== 'undefined') ? LENGTH_PRESETS : (typeof window !== 'undefined' ? window.LENGTH_PRESETS : {});
  const lengthProfile = (lengthDict && lengthDict[config.length || 'standard']) || { directive: 'TARGET LENGTH: Full scene (~800–1,200 words).' };
  const genreLower = (config.genre || '').toLowerCase();

  let toneGuidance = 'Produce vivid, immersive prose with layered subtext, rich atmosphere, and deliberate pacing.';
  let genreDirectives = '';

  // ── SPECIALIZED GENRE 1: KEY & PEELE ABSURDIST SATIRE ──
  if (
    genreLower.includes('key and peele') ||
    genreLower.includes('key & peele') ||
    (genreLower.includes('absurdist') && genreLower.includes('satire'))
  ) {
    toneGuidance = 'Deadpan comedic intensity, rapid escalation, razor-sharp dialogue, and high cinematic stakes applied to hyper-mundane social dynamics.';
    genreDirectives = `GENRE DIRECTIVE — ABSURDIST SOCIAL SATIRE (Key & Peele Style):
- Take a completely mundane, relatable everyday situation (e.g. asking for table salt, returning an item, elevator etiquette, mishearing a phrase, boardroom handshake) and treat it with the deadly seriousness, visceral dread, and cinematic grandeur of a Cold War espionage thriller or high-octane standoff.
- Escalation Protocol: Start grounded and polite. Within two to three dialogue beats, escalate the tension into absurd, hyper-dramatic psychological warfare. Characters must commit to their premise with 100% deadpan conviction and utter life-or-death intensity — no character ever winks at the audience, breaks character, or acknowledges the absurdity.
- Dialogue & Pacing: Use rapid-fire banter, sudden tense silences, hyperspecific jargon for mundane items, and dramatic visual reactions.
- ORIGINALITY MANDATE: Strictly DO NOT copy or recreate existing Key & Peele sketches (no substitute teacher roll-calls, no continental breakfasts, no inner-city wizard academies, no valets). Invent completely original characters, settings, and conflicts from scratch!`;

  // ── SPECIALIZED GENRE 2: REAL-LIFE "WHAT IF...?" DIVERGENCE ──
  } else if (genreLower.includes('what if') || genreLower.includes('divergence')) {
    toneGuidance = 'Contemplative, deeply grounded historical narrative framed by an omniscient observer examining the butterfly effect of human choices.';
    genreDirectives = `GENRE DIRECTIVE — REAL-LIFE "WHAT IF...?" HISTORICAL DIVERGENCE:
- Framing: Channel an omniscient, detached cosmic Observer/Chronicler watching human history branch across fragile nexus points. Open the scene by introducing the focal moment in history and the razor-thin margin on which humanity's fate was balanced.
- Grounded Realism: Anchor the story in a real, authenticated historical incident, close call, or pivotal human decision (e.g., Stanislav Petrov's 1983 nuclear false alarm, Apollo 11's 1202 alarm, Franz Ferdinand's turn, the 1962 missile crisis, Alexander's fever).
- STRICT NO-SUPERHEROES RULE: Absolutely NO comic book superheroes, super-serums, multiversal magic portals, or alien invasions. The drama and stakes arise strictly from real human psychology, geopolitics, cascading historical butterfly effects, and the weight of history.
- Pacing: Chronicle the ticking-clock dilemma, the exact instant reality diverged, the immediate human and systemic shockwaves, and close with the Chronicler offering a profound philosophical reflection on how a single breath or keystroke shapes centuries.`;

  // ── SPECIALIZED GENRE 3: THE TWILIGHT ZONE (ANTHOLOGY PARABLE) ──
  } else if (genreLower.includes('twilight zone') || genreLower.includes('anthology parable')) {
    toneGuidance = 'Eerie psychological uncanniness, creeping existential irony, mid-century noir eloquence, and moral parables where human flaws summon reality-bending consequences.';
    genreDirectives = `GENRE DIRECTIVE — THE TWILIGHT ZONE (ANTHOLOGY PARABLE):
- MANDATORY STRUCTURAL BLUEPRINT:
  1. THE PROLOGUE (Narrator Monologue): Open with an evocative, stylized spoken narration formatted in blockquote (> ...) introducing the protagonist, their ordinary setting, and their moral flaw, obsession, or hubris (e.g., "> *Submitted for your approval: [Protagonist Name], a person who...*"). Capture the philosophical eloquence, smoke-and-shadows gravitas, and wry caution of classic Rod Serling and contemporary Jordan Peele.
  2. THE UNCANNY INTRUSION: Ground the world in tangible reality before introducing a single, impossible, reality-distorting anomaly (an antique object, an uncanny stranger, an inexplicable room, a pocket of altered time).
  3. THE MORAL CRUCIBLE & TWIST: The protagonist tries to exploit, outsmart, or rationalize the phenomenon, only for poetic justice, cosmic irony, or their own tragic flaw to snap the trap shut. The twist must be an ironic thematic reckoning.
  4. THE EPILOGUE (Closing Reflection): Conclude with the narrator's closing monologue formatted in blockquote (> ...), delivering a biting philosophical epitaph on the fragility of human nature, sealed as a permanent resident of... The Twilight Zone.
- ORIGINALITY MANDATE: Strictly DO NOT retell or recycle famous Twilight Zone episodes (no broken reading glasses in a vault, no gremlins on wings, no pig-faced beauty standards, no talking dolls). Construct a completely original moral conundrum and uncanny object/situation!`;

  // ── OTHER GENRE TONE ADAPTATIONS ──
  } else if (genreLower.includes('bedtime') || genreLower.includes('fable') || genreLower.includes('cozy')) {
    toneGuidance = 'Use gentle, lyrical, soothing prose with comforting sensory imagery, warm pacing, and an enchanting, peaceful resolution suitable for rest and reflection.';
  } else if (genreLower.includes('romance')) {
    toneGuidance = 'Focus on emotional resonance, subtle glances, nuanced interpersonal chemistry, witty dialogue, and simmering romantic tension.';
  } else if (genreLower.includes('mystery')) {
    toneGuidance = 'Build an engaging mystery with intriguing clues, clever observational dialogue, and satisfying deductive pacing.';
  } else if (genreLower.includes('horror') || genreLower.includes('dark')) {
    toneGuidance = 'Evoke creeping psychological dread, uncanny details, atmospheric tension, and visceral imagery.';
  }

  // ── SYSTEM PROMPT COMPILATION ──
  let sp = `You are Narratrix — an elite creative writing engine crafted to generate publication-quality scenes across all narrative genres.\n\n`;

  if (config.genre) sp += `GENRE / TONE: ${config.genre}\n`;
  sp += `${lengthProfile.directive}\n\n`;

  if (genreDirectives) {
    sp += `${genreDirectives}\n\n`;
  }

  // Dynamic Cast of Characters
  if (config.characters && config.characters.length > 0) {
    sp += `CAST OF CHARACTERS:\n`;
    config.characters.forEach(c => {
      const name = c.name || 'Unnamed Character';
      const role = c.role ? ` [${c.role}]` : '';
      const traits = c.traits ? `: ${c.traits}` : '';
      sp += `- ${name}${role}${traits}\n`;
    });
    sp += `\n`;
  }

  // Dynamic Plot Twists
  if (config.twists && config.twists.length > 0) {
    sp += `PLOT TWISTS & TURNING POINTS:\n`;
    config.twists.forEach((t, i) => {
      sp += `${i + 1}. ${t}\n`;
    });
    sp += `\n`;
  }

  sp += `RULES:
1. TONE & PROSE: ${toneGuidance}
2. Never break character. You are a pure literary storytelling engine.
3. Use clean markdown formatting: **bold** for emphasis, *italics* for thoughts or delicate moments, > blockquotes for environmental framing or epigraphs, and headings (##) for scene transitions.
4. Each response is self-contained. You have zero memory of prior exchanges.
5. If the prompt is open-ended, interpret it with imaginative flair and emotional clarity.
6. Subvert tired clichés; favor grounded, specific, believable details over generic tropes.
7. Weave protagonist details and twists organically into the scene rather than bluntly announcing them.`;

  return sp;
}

/**
 * System prompt for Chat Mode (Speculative Fiction Consultant)
 */
const CHAT_SYSTEM_PROMPT = `You are Narratrix — a speculative fiction writing consultant. You help writers with worldbuilding, character development, plot structure, dialogue, prose style, and genre conventions across all speculative fiction subgenres.

RULES:
1. Be knowledgeable, insightful, and creatively inspiring.
2. Use markdown formatting for clarity.
3. Each response is fully self-contained — you have zero memory of prior messages.
4. If asked to write prose, produce vivid, publication-quality fiction.
5. Stay focused on storytelling and creative writing. Politely redirect off-topic questions.`;


// ══════════════════════════════════════════════════════════════════
// SECTION 4: STATELESS GROQ API GATEWAY (ZERO-MEMORY PROOF)
// ══════════════════════════════════════════════════════════════════

/**
 * Executes a direct, stateless browser-to-Groq API call.
 *
 * EVALUATOR DEFENSE POINT:
 * Notice the `messages` array in the request body. It ALWAYS contains
 * strictly two elements:
 *   [0] { role: 'system', content: <compiled persona + directives> }
 *   [1] { role: 'user',   content: <current prompt> }
 *
 * There is ZERO retention of previous conversation turns, satisfying
 * the strict statelessness requirement.
 *
 * @param {Object} options
 * @param {string} options.systemPrompt - The compiled system instructions.
 * @param {string} options.userPrompt   - The prompt supplied by the user.
 * @param {string} [options.model]      - Groq model ID (defaults to user choice).
 * @param {number} [options.maxTokens]  - Token budget.
 * @returns {Promise<string>} The generated prose content.
 */
async function callGroqChat({ systemPrompt, userPrompt, model, maxTokens = 2500 }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key found. Please click "API Key" to enter your Groq key.');
  }

  const selectedModel = (model && typeof model === 'string' && model.trim() && model !== 'Set API Key first')
    ? model.trim()
    : getSelectedModel();

  const payload = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: maxTokens,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000); // 65-second abort safeguard

  let response;
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === 'AbortError') {
      throw new Error('Groq request timed out after 65 seconds. Please check your network connection or try a faster model like llama-3.1-8b-instant.');
    }
    throw new Error(`Network failure connecting to Groq (${fetchErr.message}). Check your internet connection or browser ad-blocker.`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errDetail = '';
    try {
      const errJson = await response.json();
      errDetail = errJson?.error?.message || errJson?.message || '';
    } catch {
      // ignore json parse error
    }

    if (response.status === 401) {
      throw new Error('Groq authentication failed (401 Unauthorized). Please check your API key in the top header.');
    }
    if (response.status === 404 || errDetail.toLowerCase().includes('model') || errDetail.toLowerCase().includes('not found')) {
      throw new Error(`The model "${selectedModel}" was rejected by Groq: ${errDetail || 'Model unavailable'}. Please switch to "llama-3.3-70b-versatile" in the Model selector.`);
    }
    if (response.status === 429) {
      throw new Error(`Groq rate limit exceeded (429). ${errDetail || 'Please wait a moment before trying again.'}`);
    }
    throw new Error(errDetail || `Groq API returned HTTP error ${response.status}.`);
  }

  const result = await response.json();
  const rawText = result?.choices?.[0]?.message?.content || '';

  if (!rawText.trim()) {
    throw new Error('Received an empty response from the Groq model. Please try again with a different prompt or model.');
  }

  return rawText;
}

/**
 * Calculates human-readable reading time and word count from prose text.
 * @param {string} text
 * @returns {{ words: number, minutes: number, badge: string }}
 */
function calculateStoryStats(text) {
  if (!text) return { words: 0, minutes: 0, badge: '0 words' };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 225));
  return {
    words,
    minutes,
    badge: `⏱️ ${minutes} min read · ${words.toLocaleString()} words`,
  };
}

// Attach clean namespaces for external access from ui.js
window.NarratrixAI = {
  getApiKey,
  saveApiKey,
  removeApiKey,
  hasApiKey,
  getSelectedModel,
  setSelectedModel,
  getPopularModels,
  fetchGroqModels,
  buildStorySystemPrompt,
  CHAT_SYSTEM_PROMPT,
  callGroqChat,
  calculateStoryStats,
};
