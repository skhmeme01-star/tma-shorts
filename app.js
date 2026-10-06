(function () {
  "use strict";

  const feed = document.getElementById("feed");
  const browserShare = document.getElementById("browser-share");
  const closeButton = document.getElementById("close-button");
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTelegram = Boolean(tg && tg.initData);
  const players = new Map();
  const playerReady = new Set();
  const likedVideos = readLikes();
  let currentIndex = 0;
  let youtubeApiReady = false;
  let navigationLocked = false;

  function readLikes() {
    try {
      return JSON.parse(localStorage.getItem("shorts-liked-videos")) || {};
    } catch (_error) {
      return {};
    }
  }

  function saveLikes() {
    try {
      localStorage.setItem("shorts-liked-videos", JSON.stringify(likedVideos));
    } catch (_error) {
      // Storage may be unavailable in a privacy-restricted browser.
    }
  }

  function iconHeart(className) {
    return `<svg class="${className || ""}" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>`;
  }

  function iconMute() {
    return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path class="sound-wave" d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10"/><path class="mute-line" d="m16 10 5 5m0-5-5 5"/></svg>`;
  }

  function renderFeed() {
    feed.innerHTML = VIDEOS.map((video, index) => {
      const count = likedVideos[video.id] ? 1 : 0;
      return `
        <section class="slide" data-index="${index}" data-video-id="${video.id}">
          <div class="player" id="player-${index}" aria-label="${escapeHtml(video.title)}"></div>
          <button class="tap-layer" type="button" aria-label="Toggle sound for ${escapeHtml(video.title)}"></button>
          <div class="video-info">
            <h1 class="video-title">${escapeHtml(video.title)}</h1>
            <span class="video-counter">${index + 1} / ${VIDEOS.length}</span>
          </div>
          <div class="actions">
            <button class="action-button like-button${count ? " is-liked" : ""}" type="button" aria-label="Like ${escapeHtml(video.title)}" aria-pressed="${Boolean(count)}">
              ${iconHeart()}
              <span class="action-label like-count">${count}</span>
            </button>
            <button class="action-button mute-button" type="button" aria-label="Unmute video" aria-pressed="true">
              ${iconMute()}
              <span class="action-label mute-label">Muted</span>
            </button>
          </div>
          ${iconHeart("heart-burst")}
        </section>`;
    }).join("");
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
    })[character]);
  }

  function embedUrl(video, autoplay) {
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      controls: "0",
      disablekb: "1",
      enablejsapi: "1",
      fs: "0",
      loop: "1",
      modestbranding: "1",
      mute: "1",
      playsinline: "1",
      playlist: video.youtubeId,
      rel: "0",
      origin: window.location.origin === "null" ? "" : window.location.origin
    });
    return `https://www.youtube.com/embed/${video.youtubeId}?${params.toString()}`;
  }

  function wantedPlayerIndexes() {
    return [currentIndex - 1, currentIndex, currentIndex + 1]
      .filter((index) => index >= 0 && index < VIDEOS.length);
  }

  function createPlayer(index) {
    if (players.has(index) || !window.YT || !window.YT.Player) return;
    const video = VIDEOS[index];
    const player = new window.YT.Player(`player-${index}`, {
      videoId: video.youtubeId,
      playerVars: {
        autoplay: index === currentIndex ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        modestbranding: 1,
        mute: 1,
        playsinline: 1,
        playlist: video.youtubeId,
        rel: 0
      },
      events: {
        onReady(event) {
          players.set(index, event.target);
          playerReady.add(index);
          event.target.mute();
          if (index === currentIndex) event.target.playVideo();
          else event.target.pauseVideo();
        },
        onStateChange(event) {
          if (event.data === window.YT.PlayerState.ENDED && index === currentIndex) {
            event.target.playVideo();
          }
        },
        onError() {
          // Keep the card usable; YouTube displays its own unavailable-video UI.
        }
      }
    });
    players.set(index, player);
  }

  function createAdjacentPlayers() {
    if (!window.YT || !window.YT.Player) return;
    youtubeApiReady = true;
    wantedPlayerIndexes().forEach(createPlayer);
  }

  function installIframeFallback() {
    if (youtubeApiReady) return;
    wantedPlayerIndexes().forEach(installFallbackAt);
  }

  function installFallbackAt(index) {
      const container = document.getElementById(`player-${index}`);
      if (container.querySelector("iframe")) return;
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl(VIDEOS[index], index === currentIndex);
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.title = VIDEOS[index].title;
      container.appendChild(iframe);
  }

  function iframeCommand(index, command) {
    const iframe = document.querySelector(`[data-index="${index}"] iframe`);
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({
      event: "command",
      func: command,
      args: []
    }), "https://www.youtube.com");
  }

  function fallbackPlayback(index, play) {
    const iframe = document.querySelector(`[data-index="${index}"] iframe`);
    if (!iframe) return;
    const desired = embedUrl(VIDEOS[index], play);
    if (iframe.src !== desired) iframe.src = desired;
  }

  function setCurrent(index) {
    if (index < 0 || index >= VIDEOS.length) return;
    const changed = index !== currentIndex;
    currentIndex = index;
    if (youtubeApiReady) createAdjacentPlayers();
    players.forEach((player, playerIndex) => {
      if (!playerReady.has(playerIndex)) return;
      if (playerIndex === index) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    });
    if (!youtubeApiReady) {
      wantedPlayerIndexes().forEach(installFallbackAt);
      VIDEOS.forEach((_video, playerIndex) => fallbackPlayback(playerIndex, playerIndex === index));
    }
    if (changed) {
      updateMainButton();
      history.replaceState(null, "", `#${VIDEOS[index].id}`);
    }
  }

  function setupObserver() {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && visible.intersectionRatio >= 0.6) {
        setCurrent(Number(visible.target.dataset.index));
      }
    }, { root: feed, threshold: [0.25, 0.6, 0.85] });

    document.querySelectorAll(".slide").forEach((slide) => observer.observe(slide));
  }

  function toggleMute(index) {
    const slide = document.querySelector(`[data-index="${index}"]`);
    const button = slide.querySelector(".mute-button");
    const player = players.get(index);
    const sounding = button.classList.toggle("is-sounding");
    button.setAttribute("aria-label", sounding ? "Mute video" : "Unmute video");
    button.setAttribute("aria-pressed", String(!sounding));
    button.querySelector(".mute-label").textContent = sounding ? "Sound" : "Muted";
    if (playerReady.has(index)) {
      if (sounding) player.unMute(); else player.mute();
    } else {
      iframeCommand(index, sounding ? "unMute" : "mute");
    }
  }

  function likeVideo(index, forceLike) {
    const video = VIDEOS[index];
    const slide = document.querySelector(`[data-index="${index}"]`);
    const button = slide.querySelector(".like-button");
    const isLiked = forceLike ? true : !likedVideos[video.id];
    likedVideos[video.id] = isLiked ? 1 : 0;
    button.classList.toggle("is-liked", isLiked);
    button.setAttribute("aria-pressed", String(isLiked));
    button.querySelector(".like-count").textContent = isLiked ? "1" : "0";
    saveLikes();

    if (isLiked) {
      const heart = slide.querySelector(".heart-burst");
      heart.classList.remove("animate");
      void heart.offsetWidth;
      heart.classList.add("animate");
      if (inTelegram && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    }
  }

  function setupGestures() {
    document.querySelectorAll(".slide").forEach((slide, index) => {
      const tapLayer = slide.querySelector(".tap-layer");
      const muteButton = slide.querySelector(".mute-button");
      let lastTap = 0;
      let singleTapTimer;

      tapLayer.addEventListener("click", () => {
        const now = Date.now();
        if (now - lastTap < 300) {
          clearTimeout(singleTapTimer);
          lastTap = 0;
          likeVideo(index, true);
        } else {
          lastTap = now;
          singleTapTimer = window.setTimeout(() => toggleMute(index), 300);
        }
      });

      muteButton.addEventListener("click", () => toggleMute(index));
      slide.querySelector(".like-button").addEventListener("click", () => likeVideo(index, false));
    });
  }

  function goTo(index) {
    if (navigationLocked || index < 0 || index >= VIDEOS.length) return;
    navigationLocked = true;
    document.querySelector(`[data-index="${index}"]`).scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
    window.setTimeout(() => { navigationLocked = false; }, 420);
  }

  function setupNavigation() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        goTo(currentIndex + 1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
    });

    feed.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      goTo(currentIndex + Math.sign(event.deltaY));
    }, { passive: false });
  }

  function shareCurrent() {
    const video = VIDEOS[currentIndex];
    const videoUrl = `https://www.youtube.com/shorts/${video.youtubeId}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`;
    if (inTelegram && typeof tg.openTelegramLink === "function") {
      tg.openTelegramLink(shareUrl);
    } else if (navigator.share) {
      navigator.share({ title: video.title, url: videoUrl }).catch(() => {});
    } else {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  }

  function updateMainButton() {
    if (!inTelegram || !tg.MainButton) return;
    tg.MainButton.setText("Share");
    tg.MainButton.show();
  }

  function setupTelegram() {
    if (!inTelegram) return;
    document.body.classList.add("in-telegram");
    closeButton.hidden = false;
    tg.ready();
    tg.expand();
    updateMainButton();
    tg.MainButton.onClick(shareCurrent);
    closeButton.addEventListener("click", () => tg.close());

    function applyTelegramViewport() {
      const height = tg.viewportStableHeight || tg.viewportHeight;
      if (height) document.documentElement.style.setProperty("--app-height", `${height}px`);
    }

    function applyTelegramTheme() {
      const theme = tg.themeParams || {};
      const root = document.documentElement;
      Object.entries(theme).forEach(([name, value]) => {
        if (/^#[0-9a-f]{6}$/i.test(value)) {
          root.style.setProperty(`--tg-theme-${name.replace(/_/g, "-")}`, value);
        }
      });
      const background = theme.bg_color || "#000000";
      const header = theme.header_bg_color || background;
      if (typeof tg.setBackgroundColor === "function") tg.setBackgroundColor(background);
      if (typeof tg.setHeaderColor === "function") tg.setHeaderColor(header);
      document.querySelector('meta[name="theme-color"]').content = header;
    }

    applyTelegramViewport();
    applyTelegramTheme();
    tg.onEvent("viewportChanged", applyTelegramViewport);
    tg.onEvent("themeChanged", applyTelegramTheme);
  }

  function restoreHashPosition() {
    const id = location.hash.slice(1);
    const index = VIDEOS.findIndex((video) => video.id === id);
    if (index > 0) {
      currentIndex = index;
      document.querySelector(`[data-index="${index}"]`).scrollIntoView();
    }
  }

  renderFeed();
  restoreHashPosition();
  setupGestures();
  setupNavigation();
  setupObserver();
  setupTelegram();
  browserShare.addEventListener("click", shareCurrent);

  const previousYouTubeReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (typeof previousYouTubeReady === "function") previousYouTubeReady();
    createAdjacentPlayers();
  };

  if (window.YT && window.YT.Player) createAdjacentPlayers();
  window.setTimeout(installIframeFallback, 5000);
})();
