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
    const count = Math.min(190, Math.max(90, Math.round((width * height) / 9800)));
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


// Enterprise additions: typewriter hero, mobile nav closing, active nav state, dynamic year.
(() => {
  const yearTargets = document.querySelectorAll('[data-current-year]');
  yearTargets.forEach((target) => {
    target.textContent = new Date().getFullYear();
  });

  const typewriter = document.querySelector('[data-typewriter]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typewriter && !prefersReducedMotion) {
    let phrases = [];
    try {
      phrases = JSON.parse(typewriter.getAttribute('data-typewriter-phrases') || '[]');
    } catch (error) {
      phrases = [];
    }

    if (phrases.length) {
      let phraseIndex = 0;
      let letterIndex = 0;
      let deleting = false;
      const typeSpeed = 55;
      const deleteSpeed = 32;
      const pauseTime = 1400;

      const typeLoop = () => {
        const phrase = phrases[phraseIndex];
        typewriter.textContent = phrase.slice(0, letterIndex);

        if (!deleting && letterIndex < phrase.length) {
          letterIndex += 1;
          window.setTimeout(typeLoop, typeSpeed);
          return;
        }

        if (!deleting && letterIndex === phrase.length) {
          deleting = true;
          window.setTimeout(typeLoop, pauseTime);
          return;
        }

        if (deleting && letterIndex > 0) {
          letterIndex -= 1;
          window.setTimeout(typeLoop, deleteSpeed);
          return;
        }

        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(typeLoop, 260);
      };

      typeLoop();
    }
  }

  const navCollapse = document.querySelector('.navbar-collapse');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link, .navbar-nav .btn');

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (!navCollapse || !navCollapse.classList.contains('show') || typeof bootstrap === 'undefined') return;
      const collapse = bootstrap.Collapse.getOrCreateInstance(navCollapse);
      collapse.hide();
    });
  });

  const sectionLinks = [...document.querySelectorAll('.navbar-nav .nav-link[href^="#"]')];
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        sectionLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    sections.forEach((section) => observer.observe(section));
  }
})();
