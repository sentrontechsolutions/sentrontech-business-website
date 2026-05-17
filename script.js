// Optional background audio toggle
const pageLoader = document.querySelector(".page-loader");
const backgroundAudio = document.querySelector("#backgroundAudio");
const musicToggle = document.querySelector("[data-music-toggle]");
let musicFadeFrame = null;
const musicHomeVolume = 0.22;

function hidePageLoader() {
  if (!pageLoader) return;

  let loaderFinished = false;

  function removeLoader() {
    if (loaderFinished) return;

    loaderFinished = true;
    pageLoader.remove();
  }

  window.setTimeout(() => {
    pageLoader.classList.add("loaded");
    pageLoader.addEventListener("transitionend", removeLoader, { once: true });
    window.setTimeout(removeLoader, 850);
  }, 250);
}

window.addEventListener("load", hidePageLoader);

function updateMusicToggle(isPlaying) {
  if (!musicToggle) return;

  const icon = musicToggle.querySelector("i");
  const label = isPlaying ? "Pause background music" : "Play background music";

  musicToggle.classList.toggle("is-playing", isPlaying);
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
    if (fadeDuration > 0) {
      fadeBackgroundMusic(volume, fadeDuration);
    }
    updateMusicToggle(true);
  } catch (error) {
    updateMusicToggle(false);
  }
}

if (musicToggle && backgroundAudio) {
  updateMusicToggle(false);

  backgroundAudio.addEventListener("play", () => {
    updateMusicToggle(true);
  });

  backgroundAudio.addEventListener("pause", () => {
    updateMusicToggle(false);
  });

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

// Digital ash background motion
const digitalDotsBg = document.querySelector(".digital-dots-bg");
const dotsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (digitalDotsBg) {
  const ashPointer = {
    x: -9999,
    y: -9999,
    active: false
  };

  let ashStates = [];
  let lastAshScrollY = window.scrollY;
  let ashScrollLift = 0;
  let targetAshScrollLift = 0;
  let ashResizeTimer = null;
  let lastAshFrame = 0;

  function shouldShowDots() {
    return true;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function resetAshPiece(state, width, height, initial = false) {
    state.baseX = randomBetween(-28, width + 28);
    state.baseY = initial ? randomBetween(0, height + 80) : randomBetween(height + 18, height + 130);
    state.phase = Math.random() * Math.PI * 2;
    state.depth = randomBetween(0.62, 1.34);
    state.riseSpeed = randomBetween(18, 54);
    state.sway = randomBetween(7, 24);
    state.swaySpeed = randomBetween(0.0009, 0.0022);
    state.airDrift = randomBetween(-6, 6);
    state.rotation = randomBetween(0, 360);
    state.spinSpeed = randomBetween(-52, 52);
    state.repelX = 0;
    state.repelY = 0;
    state.repelVX = 0;
    state.repelVY = 0;
  }

  function buildDigitalDots() {
    digitalDotsBg.innerHTML = "";
    ashStates = [];
    lastAshFrame = 0;

    if (!shouldShowDots()) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isCompactScreen = width < 768;
    const minCount = isCompactScreen ? 120 : 230;
    const maxCount = isCompactScreen ? 260 : 430;
    const density = isCompactScreen ? 3200 : 4600;
    const count = Math.min(maxCount, Math.max(minCount, Math.round((width * height) / density)));

    for (let index = 0; index < count; index += 1) {
      const isSquare = Math.random() < 0.36;
      const pieceWidth = isSquare ? randomBetween(4, 8.5) : randomBetween(3.5, 7);
      const pieceHeight = isSquare ? pieceWidth : randomBetween(9, 22);
      const ash = document.createElement("span");
      const state = {
        ash,
        width: pieceWidth,
        height: pieceHeight
      };

      ash.className = "digital-ash";
      ash.style.setProperty("--ash-width", `${pieceWidth.toFixed(2)}px`);
      ash.style.setProperty("--ash-height", `${pieceHeight.toFixed(2)}px`);
      ash.style.setProperty("--ash-alpha", randomBetween(0.36, 0.72).toFixed(2));
      ash.style.setProperty("--ash-pulse-duration", `${randomBetween(2.4, 5.8).toFixed(2)}s`);
      ash.style.animationDelay = `${(-Math.random() * 6).toFixed(2)}s`;
      digitalDotsBg.appendChild(ash);

      resetAshPiece(state, width, height, true);
      ashStates.push(state);
    }
  }

  function animateDigitalDots(time) {
    if (!shouldShowDots()) {
      if (ashStates.length) buildDigitalDots();
      window.requestAnimationFrame(animateDigitalDots);
      return;
    }

    if (!ashStates.length) buildDigitalDots();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const elapsed = lastAshFrame ? Math.min(48, time - lastAshFrame) : 16.7;
    const deltaSeconds = elapsed / 1000;

    lastAshFrame = time;

    targetAshScrollLift *= 0.9;
    ashScrollLift += (targetAshScrollLift - ashScrollLift) * 0.18;

    ashStates.forEach((state) => {
      if (!dotsReducedMotion.matches) {
        state.baseY -= (state.riseSpeed * state.depth * deltaSeconds) + Math.max(0, ashScrollLift) * 0.04;
        state.baseX += state.airDrift * deltaSeconds;
      }

      if (
        state.baseY < -150 ||
        state.baseX < -120 ||
        state.baseX > width + 120
      ) {
        resetAshPiece(state, width, height);
      }

      const swayX = Math.sin(time * state.swaySpeed + state.phase) * state.sway;
      const flameX = Math.sin(time * state.swaySpeed * 2.25 + state.phase * 1.7) * state.sway * 0.38;
      const flameY = Math.cos(time * state.swaySpeed * 1.35 + state.phase) * 5 * state.depth;
      const centerX = state.baseX + swayX + flameX + state.repelX + state.width / 2;
      const centerY = state.baseY + flameY - ashScrollLift * state.depth + state.repelY + state.height / 2;
      const deltaX = centerX - ashPointer.x;
      const deltaY = centerY - ashPointer.y;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const repelRadius = 144;
      const repelPower = ashPointer.active && distance < repelRadius
        ? Math.pow(1 - distance / repelRadius, 2)
        : 0;
      const tangentX = -deltaY / distance;
      const tangentY = deltaX / distance;
      const step = Math.sin(time * 0.018 + state.phase) * repelPower;

      if (dotsReducedMotion.matches) {
        state.ash.style.transform = `translate3d(${state.baseX.toFixed(2)}px, ${state.baseY.toFixed(2)}px, 0)`;
        return;
      }

      state.repelVX += ((deltaX / distance) * 1550 + tangentX * step * 760) * repelPower * deltaSeconds;
      state.repelVY += ((deltaY / distance) * 1550 + tangentY * step * 760) * repelPower * deltaSeconds;
      state.repelVX *= Math.pow(0.82, elapsed / 16.7);
      state.repelVY *= Math.pow(0.82, elapsed / 16.7);
      state.repelX += state.repelVX * deltaSeconds;
      state.repelY += state.repelVY * deltaSeconds;
      state.repelX += (0 - state.repelX) * 0.018;
      state.repelY += (0 - state.repelY) * 0.018;

      const repelDistance = Math.hypot(state.repelX, state.repelY);
      const maxRepelDistance = 132;

      if (repelDistance > maxRepelDistance) {
        const clamp = maxRepelDistance / repelDistance;
        state.repelX *= clamp;
        state.repelY *= clamp;
        state.repelVX *= 0.62;
        state.repelVY *= 0.62;
      }

      const moveX = state.baseX + swayX + flameX + state.repelX;
      const moveY = state.baseY + flameY - ashScrollLift * state.depth + state.repelY;
      const rotation = state.rotation + time * 0.001 * state.spinSpeed + state.repelX * 0.34;

      state.ash.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg)`;
    });

    window.requestAnimationFrame(animateDigitalDots);
  }

  buildDigitalDots();

  window.addEventListener("resize", () => {
    window.clearTimeout(ashResizeTimer);
    ashResizeTimer = window.setTimeout(buildDigitalDots, 120);
  });
  window.addEventListener("pointermove", (event) => {
    ashPointer.x = event.clientX;
    ashPointer.y = event.clientY;
    ashPointer.active = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    ashPointer.active = false;
  });
  document.addEventListener("mouseleave", () => {
    ashPointer.active = false;
  });
  window.addEventListener("scroll", () => {
    const delta = window.scrollY - lastAshScrollY;
    const direction = Math.sign(delta);
    const distance = Math.abs(delta);

    if (direction !== 0) {
      targetAshScrollLift = Math.max(-22, Math.min(28, direction * Math.min(28, distance * 0.22)));
    }

    lastAshScrollY = window.scrollY;
  }, { passive: true });

  window.requestAnimationFrame(animateDigitalDots);
}

// Copy to clipboard functionality
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(text);
      const icon = btn.querySelector("i");
      icon.className = "fa-solid fa-check";
      setTimeout(() => {
        icon.className = "fa-solid fa-copy";
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  });
});
