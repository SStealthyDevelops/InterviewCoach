# AI Interview Coach

A free, self-hosted interview practice tool: pick a question, record yourself answering
it on webcam, and get an instant AI-driven feedback report on content, delivery, and
presence — powered by your own OpenAI API key.

See `InterviewCoach_MVP_Application_Spec.md` for the product spec and
`docs/superpowers/specs/2026-08-31-interview-coach-mvp-design.md` for the implementation
design this app follows.

## What this is (and isn't)

- **No accounts, no login, no cloud backend.** This is a fully static Next.js app
  (`output: 'export'`) — there is no server. Every OpenAI call is made directly from
  your browser using your own API key.
- **Bring your own key (BYOK).** You provide an OpenAI API key on first run. It's
  stored only in your browser's `localStorage` and is never sent anywhere except
  directly to OpenAI.
- **Local-first.** Your recorded video, filler-word detection, and eye-contact tracking
  never leave your machine. Only your recorded audio (for transcription) and your
  transcript + the interview question (for scoring) are sent to OpenAI. All practice
  session data (transcripts, scores, optionally video) is stored locally in your
  browser's IndexedDB.

## Setup guide

### What you need

- **Node.js 20.9 or newer.** This is the only thing you install yourself — everything
  else (dependencies) is fetched automatically the first time you run the app.
  Download it from [nodejs.org](https://nodejs.org) (choose the **LTS** version) if
  you don't already have it. To check what you have: open a terminal and run
  `node -v`.
- **An OpenAI API key.** See [Getting an OpenAI API key](#getting-an-openai-api-key)
  below if you don't have one yet.
- **A webcam and microphone**, and a recent Chrome, Edge, or Firefox. (Camera/mic
  recording support varies on Safari; Chrome/Edge/Firefox are the tested path.)

### Quick start (recommended)

1. Download this project (green **Code → Download ZIP** button on GitHub, or
   `git clone`) and unzip it somewhere.
2. Double-click the setup script for your operating system, in the project's top
   folder:
   - **Windows:** `setup.bat`
   - **macOS:** `setup.command` (first time only: if macOS blocks it as being from an
     unidentified developer, right-click it → **Open** → **Open** to approve it once)
   - **Linux:** run `./setup.command` from a terminal in the project folder
3. The script checks your Node.js version, installs dependencies and builds the app
   on first run (this can take a minute or two), starts it, and opens your browser
   to it automatically.
4. Leave the terminal/command window open while you use the app — closing it stops
   the app. To stop it yourself, press `Ctrl+C` in that window (or just close it).
5. On the app's first screen, paste in your OpenAI API key to finish setup (see
   below if you need one).

Re-running the script later (after the first time) skips straight to starting the
app — it only reinstalls dependencies or rebuilds if the `node_modules` or `out`
folders are missing. This is a real production build (`npm run build`), not the
developer-facing `npm run dev` — no dev-only error overlay, no React dev warnings,
just the app. If you've pulled newer code and want to pick up the changes, delete
the `out` folder and re-run the script (see [Troubleshooting](#troubleshooting)).

### Manual setup

If you'd rather use the terminal directly (or the quick-start script doesn't fit
your setup, e.g. you're on WSL):

```bash
npm install
npm run build
npx serve@latest out -l 3000
```

Then open [http://localhost:3000](http://localhost:3000) yourself. On first run
you'll be asked for an OpenAI API key — it's validated with a trivial request before
being saved locally.

If you're actively editing the code, use `npm run dev` instead (after `npm
install`) for hot reload — see [Testing](#testing). It also shows Next.js's dev-only
error overlay and React warnings, which is exactly what you want while developing
but not what an end user should see, which is why the setup scripts and the
instructions above use a production build instead.

### Getting an OpenAI API key

1. Create an account (or sign in) at [platform.openai.com](https://platform.openai.com).
2. Add a small amount of billing credit under **Settings → Billing** — this app is
   pay-as-you-go on your own key, and a practice session typically costs a few cents
   (the app shows a cost estimate before every recording).
3. Go to **[API keys](https://platform.openai.com/api-keys)** and click **Create new
   secret key**. Copy it immediately — OpenAI only shows it once.
4. Paste that key into the app's first-run screen (or **Settings** later). It's
   stored only in your browser and is sent only to OpenAI — see
   [Privacy](#privacy) below.

### Deploying the static bundle elsewhere

`npm run build` produces a fully static `out/` folder with no server-side code —
you can serve it with any static file server or host (Nginx, S3, GitHub Pages,
etc.), not just `npx serve` on your own machine. Camera/microphone access requires
a secure context, so serve it over HTTPS (or `http://localhost` for local use).

### Troubleshooting

- **"Node.js was not found" / version error from the setup script** — install or
  update Node.js from [nodejs.org](https://nodejs.org) (LTS version), then re-run the
  script.
- **Windows says the script "cannot be loaded because running scripts is disabled"**
  — this shouldn't happen via `setup.bat` (it bypasses that restriction just for
  itself), but if you run `setup.ps1` directly instead, right-click it in File
  Explorer and choose **Run with PowerShell**, or use `setup.bat` instead.
- **macOS says the app "cannot be opened because it is from an unidentified
  developer"** — right-click `setup.command` → **Open** → **Open** once; macOS will
  remember your choice after that.
- **Browser opens before the app is ready** — the script opens your browser a few
  seconds after starting the server; if it's blank, just refresh.
- **"Port 3000 is already in use"** — you already have the app (or something else)
  running. Close the other terminal/window running it, or stop whatever else is using
  port 3000, then re-run the script.
- **Camera/microphone permission denied** — the app shows an inline message when this
  happens. Re-allow camera/mic access for `localhost:3000` in your browser's site
  settings, then reload the page.
- **Not seeing recent code changes** — the setup scripts only rebuild when the `out`
  folder is missing, so a fresh `git pull` won't show up until you delete `out` (or
  run `npm run build` yourself) and re-run the script.

## Project layout

- `setup.bat` / `setup.ps1` (Windows) and `setup.command` (macOS/Linux) — double-click
  setup + launch scripts; see [Quick start](#quick-start-recommended).
- `app/` — pages (App Router): home (question picker), `/record`, `/report`,
  `/history`, `/settings`, plus `error.tsx`/`global-error.tsx` friendly error
  fallbacks (only shown in a production build — `npm run dev` uses Next's own
  dev-only error overlay instead).
- `components/` — UI components, including the recording flow and the scorecard
  report.
- `lib/analysis/` — local, deterministic analysis: filler-word detection, pace
  calculation, vocabulary scanning, and eye-contact aggregation. No AI calls, no
  network — see `InterviewCoach_MVP_Application_Spec.md` §5.3/§5.4/§5.7 for why these
  run locally instead of through an LLM.
- `lib/openai/` — the OpenAI integration: transcription, the single structured
  content/quality/vocabulary analysis call (with a quote-grounding retry), and API key
  validation.
- `lib/feedback/composeScorecard.ts` — merges every signal into the rendered report.
- `lib/storage/` — IndexedDB (session history) and localStorage (API key, settings)
  wrappers.
- `lib/config/models.ts` — OpenAI model names and pricing constants, kept in one place
  so they're easy to update as OpenAI's lineup changes.

## Testing

Unit tests cover every pure-logic module (filler detection, pace calculation,
vocabulary scanning, cost estimation, eye-contact aggregation, quote grounding, and
scorecard composition):

```bash
npm test
```

Camera/microphone capture, on-device face tracking, and live OpenAI calls are
hardware- and network-dependent and aren't meaningfully unit-testable. Verify these
manually:

1. `npm run dev`, open the app, and complete first-run setup with a real OpenAI API key.
2. Pick a question, allow camera/mic access, and confirm the live preview and cost
   estimate render.
3. Record a short answer (a few sentences with an "um" or two) and let it process.
4. Confirm the report shows: the five scored pillars each with a concrete
   explanation, top-3 worked/fix lists with real quotes, and an annotated transcript
   with fillers/weak/strong phrases highlighted.
5. Check `/history` lists the session and `/report` re-opens it.
6. In `/settings`, confirm the video-save toggle, key replacement, and "delete all
   local data" work as expected.
7. Deny camera/mic permission once to confirm the inline error message (not a blank
   screen).

## Privacy

Disclosed in full on first run, and always available from `/settings`:

- Audio is sent to OpenAI to be transcribed.
- The transcript and the interview question are sent to OpenAI to be scored.
- Video, filler-word detection, and eye-contact tracking never leave your machine.
- Your API key lives only in this browser's local storage.
- Eye-contact tracking downloads a small public face-tracking model from a CDN the
  first time you use it (cached afterward) — no recording or personal data is part of
  that download.
