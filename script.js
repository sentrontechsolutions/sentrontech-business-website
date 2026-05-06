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
    return window.innerWidth >= 768;
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
