# ⬡ Narratrix AI — Speculative Fiction Engine

A lightweight, production-grade, zero-backend creative writing platform powered directly by [Groq Cloud's](https://console.groq.com/) ultra-low latency inference API. Built entirely with **Vanilla HTML5, CSS3, and ES6+ JavaScript** with zero dependencies, zero build steps, and native GitHub Pages compatibility.

---

## ✨ Key Features

- **Bring-Your-Own-Key (BYOK) Security**:
  API keys are held strictly in browser `sessionStorage`. Keys are never written to disk, never sent to third-party backends, and automatically vanish when the tab closes.
- **Strictly Stateless Scene Synthesis**:
  Complies with strict single-turn memoryless prompts (`system` + `user`). Every generated scene is self-contained with no prompt bleed or conversational drift.
- **Dynamic Ensemble Cast Management**:
  Add multiple characters with custom names, archetypal roles (Protagonist, Antagonist, Foil, Companion, etc.), and character traits. Supports zero-character mode for pure atmospheric narrative.
- **Plot Twists & Turning Points**:
  Add sequenced narrative beats and twists with re-ordering and delete capabilities.
- **Target Story Length Profiles**:
  - **Flash Fiction**: ~300 – 500 words (~1,024 tokens)
  - **Full Scene**: ~800 – 1,200 words (~2,500 tokens)
  - **Extended Epic**: ~1,500+ words (~4,096 tokens)
- **30+ Curated Fiction Presets**:
  Includes Bedtime Stories, Key & Peele Absurdist Satire, Real-Life "What If" historical divergence, Twilight Zone psychological parables, Cyberpunk Noir, Cosmic Horror, and Solarpunk.
- **Dual Mode**:
  - **Story Mode**: Parameter-driven scene generation.
  - **Chat Mode**: Stateless creative writing and worldbuilding consultant.
- **Local Persistence & Privacy**:
  High-capacity IndexedDB history with LocalStorage fallback. Export sessions to `.json` or download stories as `.md` (Markdown).
- **Modern Responsive Interface**:
  Dark/Light theme switcher, collapsible sidebar with memory, high-contrast toast notifications, and on-screen error diagnostics.

---

## 📂 Project Architecture

The application is modularized into cleanly separated layers:

```
├── index.html        # Clean semantic markup with modal overlays and toast container
├── style.css         # Modern design system (tokens, CSS variables, dark/light themes)
├── presets.js        # Static data dictionaries (Genres, Roles, Presets, Lengths)
├── app.js            # Core AI Engine (BYOK security, model discovery, prompt compiler, Groq API call)
├── ui.js             # UI Controller (DOM events, IndexedDB storage, toast & error handling)
├── .gitignore        # Standard ignore rules
└── README.md         # Documentation
```

### Explaining the Engine in Class (`app.js`):
- **Section 1 (Lines 20–95)**: `getApiKey()`, `saveApiKey()`, `removeApiKey()`, `hasApiKey()`. Manages ephemeral keys in `sessionStorage`.
- **Section 2 (Lines 100–150)**: `fetchGroqModels()`. Queries Groq `/models` to dynamically populate available LLMs (`llama-3.3-70b-versatile`, `qwen-2.5-32b`, `mixtral-8x7b-32768`, etc.).
- **Section 3 (Lines 155–290)**: `buildStorySystemPrompt(config)`. Dynamically compiles persona, word count limits, genre directives, characters, twists, and formatting rules into one immutable prompt.
- **Section 4 (Lines 300–415)**: `callGroqChat()`. Pure 2-message stateless API call to `https://api.groq.com/openai/v1/chat/completions` with 65s timeout safeguard.

---

## 🚀 Deployment to GitHub Pages (Step-by-Step)

Because Narratrix AI is 100% static (no build step, no npm packages), it deploys in under 2 minutes:

### 1. Initialize Git & Commit
Open a terminal in the project directory:
```bash
git init
git add .
git commit -m "Initial commit: Narratrix AI speculative fiction engine"
```

### 2. Push to GitHub
Create a new public repository on GitHub (e.g., `narratrix-ai`), then run:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/narratrix-ai.git
git push -u origin main
```

### 3. Enable GitHub Pages
1. On GitHub, navigate to your repository.
2. Click **Settings** (gear icon in the top tab bar).
3. In the left navigation menu, click **Pages**.
4. Under **Build and deployment > Source**, select **Deploy from a branch**.
5. Under **Branch**, select `main` and folder `/ (root)`.
6. Click **Save**.

Your app will be live at:
```
https://uday2kranth.github.io/narratrix-ai/

```

---

## 💻 Local Development

No Node.js or build tools required. You can:
1. Double-click `index.html` to run directly via `file://` in any browser.
2. Or serve locally with Python:
   ```bash
   python -m http.server 3000
   ```
   and visit `http://localhost:3000`.

---

## 🔑 Requirements
- A free [Groq Cloud API Key](https://console.groq.com/keys).
- Modern web browser (Chrome, Edge, Firefox, Safari).

---

## 📜 License
MIT License. Open for educational and creative use.
