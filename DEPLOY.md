# Deploy Shorts

This is a static site. It needs no build command, framework, API key, or server.

## 1. Publish it with Cloudflare Pages

1. Sign in to the owner's [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Open **Workers & Pages**.
3. Select **Create application** (or **Get started**, depending on the current dashboard), then **Pages** and **Drag and drop your files**.
4. Enter a project name such as `tma-shorts`. Cloudflare will assign a URL like `https://tma-shorts.pages.dev` (with extra characters if that name is taken).
5. Drag this project folder into the upload area. The uploaded root must contain `index.html`, `styles.css`, `app.js`, and `videos.js` directly—not inside an extra `tma-shorts` directory.
6. Select **Save and Deploy**.
7. Open the resulting `https://<project>.pages.dev` address on a phone and confirm the feed loads. Keep this HTTPS URL for BotFather.

For a later update, open the same Pages project, choose **Create deployment**, upload the folder again, and deploy it. Cloudflare's official Direct Upload guide is [here](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Important: choose Direct Upload only if manual uploads are acceptable. Cloudflare says a Direct Upload project cannot later be converted to Git integration; automatic Git deployments require a new Pages project.

## 2. Attach it to the Telegram bot

1. In Telegram, open the verified [@BotFather](https://t.me/BotFather) account.
2. Send `/setmenubutton`.
3. Select the owner's bot.
4. Enter the button label, for example `Watch Shorts`.
5. Enter the exact HTTPS Pages URL from step 1, with no local address and no HTTP URL.
6. Open a private chat with the bot, reopen it if necessary, and tap the new menu button.
7. Verify swipe, sound, like persistence, sharing, and the close button inside Telegram on both iOS and Android if available.

The same setting is also available through **/mybots → select the bot → Bot Settings → Menu Button**. Telegram documents both routes in [Launching Mini Apps from the Menu Button](https://core.telegram.org/bots/webapps#launching-mini-apps-from-the-menu-button).

Optional: in BotFather, configure **Main Mini App** if the owner also wants a prominent **Launch app** button on the bot profile. This is separate from the chat menu button requested above.

## Owner checklist

- Cloudflare account access
- An existing Telegram bot owned by that account (create one with `/newbot` if needed)
- The final `https://<project>.pages.dev` URL
- No token or secret added to this folder—neither Cloudflare nor bot tokens belong in these files
