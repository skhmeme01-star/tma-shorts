# Shorts — Telegram Mini App

A TikTok-style vertical short-video feed for Telegram Mini Apps, showcasing
YouTube Shorts from **Cozy Paws Club** and **History But Fun**.

- Full-screen vertical feed — swipe up/down (touch, mouse wheel, keyboard)
- Tap a video to toggle sound (starts muted)
- Double-tap to like, with heart animation and haptic feedback (likes persist)
- Telegram integration: theme colors, viewport sizing, share + close buttons
- Only the current and adjacent videos load; off-screen players pause

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell |
| `styles.css` | Feed UI, Telegram theme variables |
| `app.js` | Feed logic, gestures, YouTube players, Telegram WebApp |
| `videos.js` | Video list (YouTube Shorts IDs) |
| `DEPLOY.md` | Deploy to Cloudflare Pages + attach via BotFather |

## Run locally

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

## Deploy

Static site, no build step. See [DEPLOY.md](DEPLOY.md) for the Cloudflare
Pages drag-and-drop steps and the BotFather menu-button setup.

To add a video, append an entry to `videos.js`:

```js
{ id: "my-video", title: "My Video Title", youtubeId: "YOUTUBE_SHORTS_ID" },
```
