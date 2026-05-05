// Page loader and terminal intro sequence
const pageLoader = document.querySelector(".page-loader");
const terminalIntro = document.querySelector("[data-terminal-intro]");
const terminalLines = document.querySelector("[data-terminal-lines]");
const terminalMoveButton = document.querySelector("[data-terminal-move]");
const lightSpeedTransition = document.querySelector("[data-light-speed]");
const lightSpeedVideo = document.querySelector("[data-light-speed-video]");
const backgroundAudio = document.querySelector("#backgroundAudio");
const musicToggle = document.querySelector("[data-music-toggle]");
const introReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const tunnelFadeDuration = 1350;

let tunnelLeaveTimer = null;
let tunnelCompleteTimer = null;
let tunnelRevealStarted = false;
let tunnelRevealStartedAt = 0;
let terminalIntroStarted = false;
let terminalLaunchStarted = false;
let musicFadeFrame = null;
let musicPlayPending = false;
let requestedMusicVolume = 0;
let requestedMusicFadeDuration = 0;
const terminalTypeTimers = new Set();
const musicIntroVolume = 0.12;
const musicHomeVolume = 0.22;

if (backgroundAudio) {
  backgroundAudio.preload = "auto";
  backgroundAudio.load();
}

function unlockIntroContent() {
  document.body.classList.remove("intro-active");
  document.body.classList.remove("intro-revealing");
  document.body.classList.add("intro-complete");
  revealOnScroll();
}

function setTerminalMoveReady(isReady) {
  if (!terminalMoveButton) return;

  terminalMoveButton.disabled = !isReady;
  terminalMoveButton.classList.toggle("is-ready", isReady);

  if (isReady) {
    playBackgroundMusic(musicIntroVolume, 1200);
  }
}

function updateMusicToggle(isPlaying) {
  if (!musicToggle) return;

  const icon = musicToggle.querySelector("i");
  const label = isPlaying
    ? "Pause background music"
    : musicPlayPending
      ? "Start background music"
      : "Play background music";

  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.classList.toggle("needs-action", !isPlaying && musicPlayPending);
  musicToggle.setAttribute("aria-label", label);
  musicToggle.setAttribute("title", label);

  if (icon) {
    icon.className = isPlaying ? "fa-solid fa-volume-high" : "fa-solid fa-play";
  }
}

function fadeBackgroundMusic(targetVolume, duration = 1800) {
  if (!backgroundAudio) return;

  window.cancelAnimationFrame(musicFadeFrame);

  const startVolume = backgroundAudio.volume;
  const startTime = performance.now();

  function step(now) {
    const progress = duration > 0 ? Math.min((now - startTime) / duration, 1) : 1;
    backgroundAudio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress < 1) {
      musicFadeFrame = window.requestAnimationFrame(step);
    }
  }

  musicFadeFrame = window.requestAnimationFrame(step);
}

async function playBackgroundMusic(volume = musicHomeVolume, fadeDuration = 0) {
  if (!backgroundAudio) return;

  requestedMusicVolume = volume;
  requestedMusicFadeDuration = fadeDuration;
  backgroundAudio.muted = false;

  if (fadeDuration > 0) {
    backgroundAudio.volume = Math.min(backgroundAudio.volume, volume);
  } else {
    window.cancelAnimationFrame(musicFadeFrame);
    backgroundAudio.volume = volume;
  }

  try {
    if (backgroundAudio.paused) {
      await backgroundAudio.play();
    }
    musicPlayPending = false;
    if (fadeDuration > 0) {
      fadeBackgroundMusic(volume, fadeDuration);
    }
    updateMusicToggle(true);
  } catch (error) {
    musicPlayPending = true;
    updateMusicToggle(false);
  }
}

function retryPendingBackgroundMusic() {
  if (!musicPlayPending || !backgroundAudio || !backgroundAudio.paused) return;

  playBackgroundMusic(requestedMusicVolume || musicHomeVolume, requestedMusicFadeDuration);
}

function handleBackgroundMusicUnlock(event) {
  if (!musicPlayPending) return;

  const target = event.target;

  if (target instanceof Element && target.closest("[data-music-toggle]")) {
    return;
  }

  retryPendingBackgroundMusic();
}

function scheduleTerminalTask(callback, delay) {
  const timer = window.setTimeout(() => {
    terminalTypeTimers.delete(timer);
    callback();
  }, delay);

  terminalTypeTimers.add(timer);
  return timer;
}

function waitTerminal(delay) {
  return new Promise((resolve) => {
    scheduleTerminalTask(resolve, delay);
  });
}

function clearIntroTimers() {
  window.clearTimeout(tunnelLeaveTimer);
  window.clearTimeout(tunnelCompleteTimer);

  terminalTypeTimers.forEach((timer) => window.clearTimeout(timer));
  terminalTypeTimers.clear();
}

function cleanupTunnelVideoListeners() {
  if (!lightSpeedVideo) return;

  lightSpeedVideo.removeEventListener("timeupdate", handleTunnelTimeUpdate);
  lightSpeedVideo.removeEventListener("ended", handleTunnelEnded);
}

function makeTerminalSpan(className, text) {
  const span = document.createElement("span");

  span.className = className;
  span.textContent = text;

  return span;
}

async function typeTerminalLine({ prefixClass, prefixText, textClass = "terminal-command", text, speed = 12, pause = 120 }) {
  if (!terminalLines || terminalLaunchStarted) return;

  const line = document.createElement("p");
  const textSpan = makeTerminalSpan(textClass, "");
  const cursor = document.createElement("span");

  line.className = "terminal-line";
  cursor.className = "terminal-cursor";
  cursor.setAttribute("aria-hidden", "true");

  if (prefixText) {
    line.appendChild(makeTerminalSpan(prefixClass, prefixText));
    line.appendChild(document.createTextNode(" "));
  }

  line.appendChild(textSpan);
  line.appendChild(cursor);
  terminalLines.appendChild(line);

  window.requestAnimationFrame(() => {
    line.classList.add("is-visible");
  });

  await waitTerminal(90);

  for (const character of text) {
    if (terminalLaunchStarted) return;

    textSpan.textContent += character;
    await waitTerminal(introReducedMotion.matches ? 1 : speed);
  }

  cursor.remove();
  await waitTerminal(introReducedMotion.matches ? 25 : pause);
}

async function typeTerminalSequence() {
  if (!terminalLines) return;

  terminalLines.innerHTML = "";

  await typeTerminalLine({
    prefixClass: "terminal-prompt",
    prefixText: "sentron@tech:~$",
    text: "./launch --digital-presence",
    speed: 12,
    pause: 160
  });
  await typeTerminalLine({
    prefixClass: "terminal-ok",
    prefixText: "[OK]",
    textClass: "terminal-status-text",
    text: "Sentron core modules mounted",
    speed: 8,
    pause: 90
  });
  await typeTerminalLine({
    prefixClass: "terminal-ok",
    prefixText: "[OK]",
    textClass: "terminal-status-text",
    text: "Tunnel media synchronized",
    speed: 8,
    pause: 90
  });
  await typeTerminalLine({
    prefixClass: "terminal-prompt",
    prefixText: "sentron@tech:~$",
    text: "Sentron Tech Exploration Loading...",
    speed: 13,
    pause: 140
  });
}

function getTunnelDurationMs() {
  const fallbackDuration = 5600;

  if (
    lightSpeedVideo &&
    Number.isFinite(lightSpeedVideo.duration) &&
    lightSpeedVideo.duration > 0
  ) {
    return Math.max(lightSpeedVideo.duration * 1000, 4800);
  }

  return fallbackDuration;
}

function startTunnelPageReveal() {
  if (tunnelRevealStarted) return;

  tunnelRevealStarted = true;
  tunnelRevealStartedAt = performance.now();
  document.body.classList.add("intro-revealing");
  lightSpeedTransition?.classList.add("is-landing");
}

function finishTunnelAfterEnd() {
  startTunnelPageReveal();
  window.clearTimeout(tunnelLeaveTimer);
  window.clearTimeout(tunnelCompleteTimer);
  lightSpeedTransition?.classList.add("is-leaving");

  const elapsedFadeTime = performance.now() - tunnelRevealStartedAt;
  const remainingFadeTime = Math.max(920, tunnelFadeDuration - elapsedFadeTime + 260);

  tunnelCompleteTimer = window.setTimeout(completeSentronLaunch, remainingFadeTime);
}

function handleTunnelTimeUpdate() {
  if (
    !lightSpeedVideo ||
    !Number.isFinite(lightSpeedVideo.duration) ||
    lightSpeedVideo.duration <= 0
  ) {
    return;
  }

  const remainingTime = lightSpeedVideo.duration - lightSpeedVideo.currentTime;

  if (remainingTime <= tunnelFadeDuration / 1000) {
    startTunnelPageReveal();
  }
}

function handleTunnelEnded() {
  finishTunnelAfterEnd();
}

function scheduleTunnelReveal({ useVideoEvents = false } = {}) {
  if (introReducedMotion.matches) {
    tunnelCompleteTimer = window.setTimeout(completeSentronLaunch, 450);
    return;
  }

  const tunnelDuration = getTunnelDurationMs();
  const fadeStart = Math.max(1800, tunnelDuration - tunnelFadeDuration);

  if (lightSpeedTransition) {
    lightSpeedTransition.style.setProperty("--tunnel-duration", `${tunnelDuration}ms`);
    lightSpeedTransition.style.setProperty("--tunnel-line-duration", `${Math.max(2800, tunnelDuration - 420)}ms`);
    lightSpeedTransition.style.setProperty("--tunnel-landing-duration", `${tunnelFadeDuration}ms`);
  }

  if (useVideoEvents) {
    tunnelLeaveTimer = window.setTimeout(startTunnelPageReveal, fadeStart);
    tunnelCompleteTimer = window.setTimeout(finishTunnelAfterEnd, tunnelDuration + 1200);
    return;
  }

  tunnelLeaveTimer = window.setTimeout(startTunnelPageReveal, fadeStart);
  tunnelCompleteTimer = window.setTimeout(finishTunnelAfterEnd, tunnelDuration + 180);
}

function completeSentronLaunch() {
  cleanupTunnelVideoListeners();

  if (lightSpeedVideo) {
    lightSpeedVideo.pause();
  }

  if (terminalIntro) {
    terminalIntro.remove();
  }

  if (lightSpeedTransition) {
    lightSpeedTransition.classList.remove("is-active");
    lightSpeedTransition.remove();
  }

  unlockIntroContent();
  playBackgroundMusic(musicHomeVolume, 3200);
}

function launchSentronIntro() {
  if (terminalLaunchStarted) return;

  terminalLaunchStarted = true;
  clearIntroTimers();
  tunnelRevealStarted = false;
  tunnelRevealStartedAt = 0;

  if (terminalMoveButton) {
    terminalMoveButton.disabled = true;
    terminalMoveButton.classList.remove("is-ready");
  }

  if (lightSpeedTransition) {
    lightSpeedTransition.classList.remove("is-landing", "is-leaving");
    lightSpeedTransition.classList.add("is-active");
  }

  playBackgroundMusic(musicIntroVolume, 900);

  if (lightSpeedVideo && !introReducedMotion.matches) {
    cleanupTunnelVideoListeners();
    lightSpeedVideo.addEventListener("timeupdate", handleTunnelTimeUpdate);
    lightSpeedVideo.addEventListener("ended", handleTunnelEnded);

    try {
      lightSpeedVideo.currentTime = 0;
    } catch (error) {
      // Some browsers block seeking before metadata is available; playback can still start.
    }

    lightSpeedVideo.play().catch(() => {
      lightSpeedTransition?.classList.add("video-fallback");
    });
  }

  window.setTimeout(() => {
    if (terminalIntro) {
      terminalIntro.classList.add("is-launching");
    }
  }, introReducedMotion.matches ? 0 : 220);

  if (lightSpeedVideo && !introReducedMotion.matches && !Number.isFinite(lightSpeedVideo.duration)) {
    lightSpeedVideo.addEventListener("loadedmetadata", () => {
      window.clearTimeout(tunnelLeaveTimer);
      window.clearTimeout(tunnelCompleteTimer);
      scheduleTunnelReveal({ useVideoEvents: true });
    }, { once: true });
  }

  scheduleTunnelReveal({ useVideoEvents: Boolean(lightSpeedVideo && !introReducedMotion.matches) });
}

async function startTerminalIntro() {
  if (terminalIntroStarted) return;

  terminalIntroStarted = true;

  if (!terminalIntro) {
    unlockIntroContent();
    return;
  }

  if (lightSpeedVideo && !introReducedMotion.matches) {
    lightSpeedVideo.load();
  }

  setTerminalMoveReady(false);
  await typeTerminalSequence();
  await waitTerminal(introReducedMotion.matches ? 40 : 120);
  setTerminalMoveReady(true);
}

function hidePageLoaderThenStartIntro() {
  if (!pageLoader) {
    startTerminalIntro();
    return;
  }

  let loaderFinished = false;

  function finishLoader() {
    if (loaderFinished) return;

    loaderFinished = true;
    pageLoader.remove();
    startTerminalIntro();
  }

  window.setTimeout(() => {
    pageLoader.classList.add("loaded");
    pageLoader.addEventListener("transitionend", finishLoader, { once: true });
    window.setTimeout(finishLoader, 850);
  }, 350);
}

if (terminalMoveButton) {
  terminalMoveButton.addEventListener("click", launchSentronIntro);
}

if (musicToggle && backgroundAudio) {
  updateMusicToggle(false);

  backgroundAudio.addEventListener("play", () => {
    if (!backgroundAudio.muted && backgroundAudio.volume > 0) {
      musicPlayPending = false;
      updateMusicToggle(true);
    }
  });

  backgroundAudio.addEventListener("pause", () => {
    updateMusicToggle(false);
  });

  backgroundAudio.addEventListener("canplay", retryPendingBackgroundMusic);

  musicToggle.addEventListener("click", () => {
    if (backgroundAudio.paused) {
      playBackgroundMusic(musicHomeVolume, 700);
      return;
    }

    window.cancelAnimationFrame(musicFadeFrame);
    backgroundAudio.pause();
    updateMusicToggle(false);
  });
}

document.addEventListener("pointerdown", handleBackgroundMusicUnlock, { capture: true, passive: true });
document.addEventListener("keydown", handleBackgroundMusicUnlock, { capture: true });

window.addEventListener("load", () => {
  hidePageLoaderThenStartIntro();
});

// Navbar shadow on scroll
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  if (!navbar) return;

  if (window.scrollY > 30) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Scroll reveal animation
const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");

function revealOnScroll() {
  const triggerBottom = window.innerHeight * 0.88;

  revealElements.forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < triggerBottom) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

// Digital dots background motion
const digitalDotsBg = document.querySelector(".digital-dots-bg");
const dotsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (digitalDotsBg) {
  const dotPointer = {
    x: -9999,
    y: -9999,
    active: false
  };

  let dotStates = [];
  let lastDotScrollY = window.scrollY;
  let dotScrollDrift = 0;
  let targetDotScrollDrift = 0;
  let dotResizeTimer = null;

  function shouldShowDots() {
    return window.innerWidth >= 768 && !document.body.classList.contains("intro-active");
  }

  function buildDigitalDots() {
    digitalDotsBg.innerHTML = "";
    dotStates = [];

    if (!shouldShowDots()) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = Math.min(460, Math.max(260, Math.round((width * height) / 3900)));
    const columns = Math.ceil(Math.sqrt(count * (width / height)));
    const rows = Math.ceil(count / columns);
    const cellWidth = width / columns;
    const cellHeight = height / rows;

    for (let index = 0; index < count; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = (column + 0.18 + Math.random() * 0.64) * cellWidth;
      const y = (row + 0.18 + Math.random() * 0.64) * cellHeight;
      const sizeRoll = Math.random();
      let size = 2.4 + Math.random() * 1.4;

      if (sizeRoll > 0.55) {
        size = 4 + Math.random() * 1.8;
      }

      if (sizeRoll > 0.82) {
        size = 6.2 + Math.random() * 2.2;
      }

      if (sizeRoll > 0.95) {
        size = 9 + Math.random() * 2.8;
      }
      const dot = document.createElement("span");

      dot.className = "digital-dot";
      dot.style.left = `${x.toFixed(2)}px`;
      dot.style.top = `${y.toFixed(2)}px`;
      dot.style.setProperty("--dot-size", `${size.toFixed(2)}px`);
      dot.style.setProperty("--dot-alpha", (0.2 + Math.random() * 0.2).toFixed(2));
      dot.style.setProperty("--dot-pulse-duration", `${(3.6 + Math.random() * 3.8).toFixed(2)}s`);
      dot.style.animationDelay = `${(-Math.random() * 6).toFixed(2)}s`;
      digitalDotsBg.appendChild(dot);

      dotStates.push({
        dot,
        baseX: x,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        depth: 0.55 + Math.random() * 0.65,
        repelX: 0,
        repelY: 0
      });
    }
  }

  function animateDigitalDots(time) {
    if (!shouldShowDots()) {
      if (dotStates.length) buildDigitalDots();
      window.requestAnimationFrame(animateDigitalDots);
      return;
    }

    if (!dotStates.length) buildDigitalDots();

    targetDotScrollDrift *= 0.88;
    dotScrollDrift += (targetDotScrollDrift - dotScrollDrift) * 0.22;

    dotStates.forEach((state) => {
      const idleX = Math.sin(time * 0.00058 + state.phase) * (2.8 + state.depth * 3.6);
      const idleY = Math.cos(time * 0.00052 + state.phase) * (3.2 + state.depth * 4.2);
      const driftY = dotScrollDrift * state.depth;
      const centerX = state.baseX + idleX;
      const centerY = state.baseY + idleY + driftY;
      const deltaX = centerX - dotPointer.x;
      const deltaY = centerY - dotPointer.y;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const repelRadius = 92;
      const repelPower = dotPointer.active && distance < repelRadius
        ? Math.pow(1 - distance / repelRadius, 2)
        : 0;
      const push = 62 * repelPower;
      const targetRepelX = (deltaX / distance) * push;
      const targetRepelY = (deltaY / distance) * push;

      state.repelX += (targetRepelX - state.repelX) * 0.32;
      state.repelY += (targetRepelY - state.repelY) * 0.32;

      if (dotsReducedMotion.matches) {
        state.dot.style.transform = "translate3d(0, 0, 0)";
        return;
      }

      const moveX = idleX + state.repelX;
      const moveY = idleY + driftY + state.repelY;

      state.dot.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
    });

    window.requestAnimationFrame(animateDigitalDots);
  }

  buildDigitalDots();

  window.addEventListener("resize", () => {
    window.clearTimeout(dotResizeTimer);
    dotResizeTimer = window.setTimeout(buildDigitalDots, 120);
  });
  window.addEventListener("pointermove", (event) => {
    dotPointer.x = event.clientX;
    dotPointer.y = event.clientY;
    dotPointer.active = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    dotPointer.active = false;
  });
  document.addEventListener("mouseleave", () => {
    dotPointer.active = false;
  });
  window.addEventListener("scroll", () => {
    const delta = window.scrollY - lastDotScrollY;
    const direction = Math.sign(delta);
    const distance = Math.abs(delta);

    if (direction !== 0) {
      targetDotScrollDrift = Math.max(-24, Math.min(24, direction * Math.min(24, distance * 0.28)));
    }

    lastDotScrollY = window.scrollY;
  }, { passive: true });

  window.requestAnimationFrame(animateDigitalDots);
}

// Copy to clipboard functionality
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy');
    try {
      await navigator.clipboard.writeText(text);
      // Temporarily change icon to checkmark
      const icon = btn.querySelector('i');
      icon.className = 'fa-solid fa-check';
      setTimeout(() => {
        icon.className = 'fa-solid fa-copy';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  });
});
