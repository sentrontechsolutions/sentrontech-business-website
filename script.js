// Page loader
const pageLoader = document.querySelector(".page-loader");

window.addEventListener("load", () => {
  if (!pageLoader) return;

  window.setTimeout(() => {
    pageLoader.classList.add("loaded");
    pageLoader.addEventListener("transitionend", () => pageLoader.remove(), { once: true });
  }, 350);
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

// Dev tools background motion
const devToolIcons = Array.from(document.querySelectorAll(".dev-tool-icon"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (devToolIcons.length && !reducedMotion.matches) {
  const pointer = {
    x: -9999,
    y: -9999,
    active: false
  };

  let iconStates = [];
  let lastScrollY = window.scrollY;
  let scrollBoost = 0;
  let targetScrollBoost = 0;
  let scrollDrift = 0;
  let targetScrollDrift = 0;
  let measureQueued = false;

  function measureDevTools() {
    iconStates = devToolIcons.map((icon, index) => {
      icon.style.transform = "";
      const rect = icon.getBoundingClientRect();

      return {
        icon,
        baseX: rect.left,
        baseY: rect.top,
        width: rect.width,
        height: rect.height,
        depth: Number(icon.dataset.depth) || 0.2,
        phase: index * 1.37,
        repelX: 0,
        repelY: 0
      };
    });
  }

  function queueMeasureDevTools() {
    if (measureQueued) return;

    measureQueued = true;
    window.requestAnimationFrame(() => {
      measureQueued = false;
      measureDevTools();
    });
  }

  function animateDevTools(time) {
    const scrollY = window.scrollY;

    targetScrollBoost *= 0.9;
    scrollBoost += (targetScrollBoost - scrollBoost) * 0.14;
    targetScrollDrift *= 0.88;
    scrollDrift += (targetScrollDrift - scrollDrift) * 0.16;

    const candidates = iconStates.map((state) => {
      const idleX = Math.sin(time * 0.00042 + state.phase) * (8 + state.depth * 18);
      const idleY = Math.cos(time * 0.00038 + state.phase) * (9 + state.depth * 20);
      const scrollX = Math.sin(time * 0.00028 + scrollY * 0.001 + state.phase) * state.depth * 10;
      const scrollYMove = scrollDrift * (0.78 + state.depth);

      const centerX = state.baseX + state.width / 2 + idleX + scrollX;
      const centerY = state.baseY + state.height / 2 + idleY + scrollYMove;
      const deltaX = centerX - pointer.x;
      const deltaY = centerY - pointer.y;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const repelRadius = 190;
      const repelPower = pointer.active && distance < repelRadius
        ? Math.pow(1 - distance / repelRadius, 2)
        : 0;
      const push = 170 * repelPower;
      const targetRepelX = (deltaX / distance) * push;
      const targetRepelY = (deltaY / distance) * push;

      state.repelX += (targetRepelX - state.repelX) * 0.22;
      state.repelY += (targetRepelY - state.repelY) * 0.22;

      const scale = 1 + scrollBoost + repelPower * 0.18;
      const rotation = Math.sin(time * 0.00036 + state.phase) * 5 + scrollBoost * 7;
      const moveX = idleX + scrollX + state.repelX;
      const moveY = idleY + scrollYMove + state.repelY;

      return {
        state,
        centerX: state.baseX + state.width / 2 + moveX,
        centerY: state.baseY + state.height / 2 + moveY,
        moveX,
        moveY,
        scale,
        rotation,
        radius: Math.max(state.width, state.height) * scale * 0.5
      };
    });

    const gap = window.innerWidth < 768 ? 22 : 36;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    for (let pass = 0; pass < 8; pass += 1) {
      for (let i = 0; i < candidates.length; i += 1) {
        for (let j = i + 1; j < candidates.length; j += 1) {
          const first = candidates[i];
          const second = candidates[j];

          if (!first.state.width || !second.state.width) continue;

          let deltaX = first.centerX - second.centerX;
          let deltaY = first.centerY - second.centerY;
          let distance = Math.hypot(deltaX, deltaY);
          const minDistance = first.radius + second.radius + gap;

          if (distance >= minDistance) continue;

          if (distance < 0.01) {
            deltaX = Math.cos(i + j);
            deltaY = Math.sin(i + j);
            distance = 1;
          }

          const push = (minDistance - distance) * 0.5;
          const shiftX = (deltaX / distance) * push;
          const shiftY = (deltaY / distance) * push;

          first.centerX += shiftX;
          first.centerY += shiftY;
          first.moveX += shiftX;
          first.moveY += shiftY;
          second.centerX -= shiftX;
          second.centerY -= shiftY;
          second.moveX -= shiftX;
          second.moveY -= shiftY;
        }
      }

      candidates.forEach((item) => {
        if (!item.state.width) return;

        const margin = window.innerWidth < 768 ? 10 : 16;
        const minX = item.radius + margin;
        const maxX = viewportWidth - item.radius - margin;
        const minY = item.radius + margin;
        const maxY = viewportHeight - item.radius - margin;
        const clampedX = Math.min(maxX, Math.max(minX, item.centerX));
        const clampedY = Math.min(maxY, Math.max(minY, item.centerY));
        const adjustX = clampedX - item.centerX;
        const adjustY = clampedY - item.centerY;

        item.centerX = clampedX;
        item.centerY = clampedY;
        item.moveX += adjustX;
        item.moveY += adjustY;
      });
    }

    candidates.forEach((item) => {
      item.state.icon.style.transform = `translate3d(${item.moveX.toFixed(2)}px, ${item.moveY.toFixed(2)}px, 0) scale(${item.scale.toFixed(3)}) rotate(${item.rotation.toFixed(2)}deg)`;
    });

    window.requestAnimationFrame(animateDevTools);
  }

  measureDevTools();

  window.addEventListener("resize", queueMeasureDevTools);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  document.addEventListener("mouseleave", () => {
    pointer.active = false;
  });
  window.addEventListener("scroll", () => {
    const scrollDelta = window.scrollY - lastScrollY;
    const scrollDirection = Math.sign(scrollDelta);
    const scrollDistance = Math.abs(scrollDelta);

    targetScrollBoost = Math.min(0.24, targetScrollBoost + scrollDistance * 0.0009);
    if (scrollDirection !== 0) {
      targetScrollDrift = Math.max(-26, Math.min(26, scrollDirection * Math.min(26, scrollDistance * 0.35)));
    }

    lastScrollY = window.scrollY;
  }, { passive: true });

  window.requestAnimationFrame(animateDevTools);
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
