# Focus JM

A small Pomodoro timer: **25 minutes of focus, 5 minutes of break**, switching on its own.
Runs in any browser and inside Notion as an embed.

**Live:** coming soon at `focus.jm.dev.br`

## What it does (v1.0)

- 25 min focus / 5 min break, alternating automatically
- Start, pause and reset
- A short sound when a phase ends (generated in code, no audio file)
- Count of Pomodoros completed today, kept in `localStorage`
- Works on desktop and phone, with keyboard and screen readers

No login, no backend, no dependencies. The scope of v1.0 is frozen on purpose: new features
only after using it for a few weeks.

## How it keeps time

The timer stores **when the current phase ends** and computes what is left from the clock,
instead of subtracting one second per tick. Browsers slow down timers in background tabs
(Chrome can run them once per minute) and inside embeds; counting from the end time keeps
the Pomodoro right anyway. If a tab sat idle for an hour, the phases that passed are counted
when you come back.

## Use it in Notion

- As a link: paste `https://focus.jm.dev.br` on a page.
- Embedded: type `/embed` and paste the same URL. The page does not block framing.

## Run locally

Any static server works:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Tests

The timer logic lives in `assets/js/timer.js`, with no DOM, and is tested with Node's built-in runner:

```bash
npm test
```

## Structure

```text
focus-jm/
├── index.html
├── favicon.ico              # pixel-art tomato, 16–256 px (root: browsers ask for /favicon.ico)
├── manifest.webmanifest     # name and icons for "add to home screen"
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── script.js        # screen, sound, localStorage
│   │   └── timer.js         # timer rules (pure functions, no DOM)
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png   # 180 px, opaque, for iOS
└── tests/timer.test.js
```

## Stack

HTML · CSS · JavaScript · localStorage · Vercel
