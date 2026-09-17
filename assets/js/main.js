/**
 * SENTRON TECH SOLUTIONS — INTERACTIVE CORE & REGIONAL PACKAGE SWITCHER
 * Minimalist, ultra-smooth static architecture (Zero-PHP, zero external geo APIs)
 */

document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------------------
   * 1. REGION & PACKAGE SHOWCASE MANAGER
   * -------------------------------------------------------------------------- */
  const REGION_DATA = {
    sri_lanka: {
      id: 'sri_lanka',
      label: 'Sri Lanka — LKR',
      shortLabel: 'Sri Lanka',
      flag: '🇱🇰',
      currency: 'LKR',
      folder: 'assets/packages/sri_lanka'
    },
    asia: {
      id: 'asia',
      label: 'Asia — USD',
      shortLabel: 'Asia',
      flag: '🌏',
      currency: 'USD',
      folder: 'assets/packages/asia_africa'
    },
    europe: {
      id: 'europe',
      label: 'Europe — EUR',
      shortLabel: 'Europe',
      flag: '🇪🇺',
      currency: 'EUR',
      folder: 'assets/packages/europe'
    },
    america: {
      id: 'america',
      label: 'North & South America — USD',
      shortLabel: 'America',
      flag: '🌎',
      currency: 'USD',
      folder: 'assets/packages/america'
    },
    africa: {
      id: 'africa',
      label: 'Africa — USD',
      shortLabel: 'Africa',
      flag: '🌍',
      currency: 'USD',
      folder: 'assets/packages/asia_africa'
    },
    australia: {
      id: 'australia',
      label: 'Australia — AUD',
      shortLabel: 'Australia',
      flag: '🇦🇺',
      currency: 'AUD',
      folder: 'assets/packages/australia'
    }
  };

  const STORAGE_KEY = 'sentron_selected_region';
  const DEFAULT_REGION = 'sri_lanka';

  // Elements
  const regionSelectWrap = document.getElementById('navbarRegionSelector');
  const regionTriggerBtn = document.getElementById('navbarRegionTrigger');
  const regionDropdownMenu = document.getElementById('navbarRegionDropdown');
  const navTriggerFlag = document.getElementById('navTriggerFlag');
  const navTriggerText = document.getElementById('navTriggerText');

  const inPagePills = document.querySelectorAll('.region-pill');
  const activeRegionBannerText = document.getElementById('currentRegionLabel');
  const packageImages = document.querySelectorAll('.package-dynamic-img');
  const packageCards = document.querySelectorAll('.package-card');
  const packageInquireBtns = document.querySelectorAll('.btn-package-inquire');

  // Contact form elements
  const contactServiceSelect = document.getElementById('contactService');
  const contactMessageInput = document.getElementById('contactMessage');

  let currentRegion = DEFAULT_REGION;

  // Retrieve saved preference or use default
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && REGION_DATA[saved]) {
      currentRegion = saved;
    }
  } catch (e) {
    // localStorage might be unavailable in private browsing
  }

  /**
   * Preload an array of image URLs
   */
  function preloadImages(urls) {
    return Promise.all(
      urls.map((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = () => resolve(url); // fallback so promise resolves
          img.src = url;
        });
      })
    );
  }

  /**
   * Switch the current region with ultra-smooth image transitions
   */
  async function selectRegion(regionId, animate = true) {
    const target = REGION_DATA[regionId] || REGION_DATA[DEFAULT_REGION];
    currentRegion = target.id;

    // 1. Update Navbar Trigger Button UI
    if (navTriggerFlag && navTriggerText) {
      navTriggerFlag.textContent = target.flag;
      navTriggerText.textContent = `${target.shortLabel} (${target.currency})`;
    }

    // 2. Update Navbar Dropdown Option Items
    if (regionDropdownMenu) {
      const options = regionDropdownMenu.querySelectorAll('.region-option-item');
      options.forEach((opt) => {
        const isMatch = opt.getAttribute('data-region') === target.id;
        opt.classList.toggle('selected', isMatch);
        opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    }

    // 3. Update In-Page Pills in Packages Section
    if (inPagePills.length > 0) {
      inPagePills.forEach((pill) => {
        const isMatch = pill.getAttribute('data-region') === target.id;
        pill.classList.toggle('active', isMatch);
        pill.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    }

    // 4. Update In-Page Current Region Banner
    if (activeRegionBannerText) {
      activeRegionBannerText.innerHTML = `${target.flag} Currently showing packages for <strong>${target.label}</strong>`;
    }

    // 5. Preload all 4 package images concurrently before swapping
    const targetImages = [
      `${target.folder}/1.png`,
      `${target.folder}/2.png`,
      `${target.folder}/3.png`,
      `${target.folder}/4.png`
    ];

    if (animate) {
      packageCards.forEach(c => c.classList.add('loading'));
      packageImages.forEach(img => img.classList.add('is-swapping'));
    }

    // Preload all 4 in parallel
    await preloadImages(targetImages);

    // Apply the newly preloaded images smoothly
    packageImages.forEach((img) => {
      const packageIndex = img.getAttribute('data-package-index'); // 1, 2, 3, 4
      const targetSrc = `${target.folder}/${packageIndex}.png`;
      img.src = targetSrc;
    });

    if (animate) {
      // Short delay for visual polish and transition removal
      setTimeout(() => {
        packageImages.forEach(img => img.classList.remove('is-swapping'));
        packageCards.forEach(c => c.classList.remove('loading'));
      }, 120);
    } else {
      packageImages.forEach(img => img.classList.remove('is-swapping'));
      packageCards.forEach(c => c.classList.remove('loading'));
    }

    // 6. Save preference to storage
    try {
      localStorage.setItem(STORAGE_KEY, target.id);
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Handle Navbar Trigger Toggle
  if (regionTriggerBtn && regionSelectWrap) {
    regionTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = regionSelectWrap.classList.contains('active');
      regionSelectWrap.classList.toggle('active', !isOpen);
      regionTriggerBtn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });

    // Close when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (!regionSelectWrap.contains(e.target)) {
        regionSelectWrap.classList.remove('active');
        regionTriggerBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && regionSelectWrap.classList.contains('active')) {
        regionSelectWrap.classList.remove('active');
        regionTriggerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Handle Option Click inside Navbar Dropdown
  if (regionDropdownMenu) {
    const options = regionDropdownMenu.querySelectorAll('.region-option-item');
    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        const regionId = opt.getAttribute('data-region');
        selectRegion(regionId, true);
        if (regionSelectWrap) {
          regionSelectWrap.classList.remove('active');
          if (regionTriggerBtn) {
            regionTriggerBtn.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }

  // Handle In-Page Pill Buttons
  inPagePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const regionId = pill.getAttribute('data-region');
      selectRegion(regionId, true);
    });
  });

  // Handle Package Inquire Buttons (Auto-select & prefill contact)
  packageInquireBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const packageName = btn.getAttribute('data-package-name');
      const targetRegion = REGION_DATA[currentRegion];

      if (contactServiceSelect) {
        if (packageName.includes('Web')) {
          contactServiceSelect.value = 'Business Website';
        } else if (packageName.includes('Visual') || packageName.includes('Poster')) {
          contactServiceSelect.value = 'Visual Content';
        } else if (packageName.includes('Combo')) {
          contactServiceSelect.value = 'Full Brand Launch';
        }
      }

      if (contactMessageInput) {
        contactMessageInput.value = `Hello Sentron Tech Solutions,\nI am inquiring about the "${packageName}" for the ${targetRegion.label} region. Please contact me with delivery details and onboarding.`;
      }
    });
  });

  // Initialize display without flash
  selectRegion(currentRegion, false);

  /* --------------------------------------------------------------------------
   * 2. HEADER SCROLL & MOBILE NAVIGATION
   * -------------------------------------------------------------------------- */
  const siteHeader = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navWrapper = document.querySelector('.nav-wrapper');
  const navLinks = document.querySelectorAll('.main-nav a');

  function handleHeaderScroll() {
    if (!siteHeader) return;
    if (window.scrollY > 40) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  if (menuToggle && navWrapper) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navWrapper.classList.contains('open');
      navWrapper.classList.toggle('open', !isOpen);
      menuToggle.classList.toggle('open', !isOpen);
      menuToggle.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });

    // Handle smooth and precise navigation for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetHref = link.getAttribute('href');
        if (!targetHref || targetHref === '#') return;

        const targetEl = document.querySelector(targetHref);
        if (targetEl) {
          e.preventDefault();

          // Close mobile menu if open
          if (navWrapper && navWrapper.classList.contains('open')) {
            navWrapper.classList.remove('open');
            if (menuToggle) {
              menuToggle.classList.remove('open');
              menuToggle.setAttribute('aria-expanded', 'false');
            }
          }

          // Calculate exact header height and scroll target with breathing room
          const headerHeight = siteHeader ? siteHeader.offsetHeight : 76;
          const elementTop = targetEl.getBoundingClientRect().top + window.pageYOffset;
          const destination = elementTop - headerHeight - 16;

          window.scrollTo({
            top: destination,
            behavior: 'smooth'
          });

          // Highlight active link
          navLinks.forEach((nl) => {
            nl.classList.toggle('active', nl.getAttribute('href') === targetHref);
          });

          // Update URL without harsh jump
          if (history.pushState) {
            history.pushState(null, null, targetHref);
          }
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 3. SCROLL REVEAL ANIMATIONS
   * -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: make all visible immediately
    revealElements.forEach((el) => el.classList.add('active'));
  }

  /* --------------------------------------------------------------------------
   * 4. FOOTER CURRENT YEAR
   * -------------------------------------------------------------------------- */
  const yearEls = document.querySelectorAll('[data-current-year]');
  const currentYear = new Date().getFullYear();
  yearEls.forEach((el) => {
    el.textContent = currentYear;
  });

  /* --------------------------------------------------------------------------
   * 5. DYNAMIC SCROLL-REACTIVE LIGHT BLUISH MESH STRUCTURES
   * -------------------------------------------------------------------------- */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let targetScrollY = window.scrollY || 0;
    let smoothedScrollY = targetScrollY;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      targetScrollY = window.scrollY || 0;
    }, { passive: true });

    // Dynamic Undulating Mesh Grid Parameters
    const cols = 18;
    const rows = 12;
    let time = 0;
    let animId;

    function renderDynamicMesh() {
      time += 0.016;
      // Smooth lerp scroll for silky inertia on the mesh structures
      smoothedScrollY += (targetScrollY - smoothedScrollY) * 0.08;
      const scrollVelocity = targetScrollY - smoothedScrollY;

      ctx.clearRect(0, 0, width, height);

      // Compute mesh node matrix
      const points = [];
      const cellWidth = (width + 200) / cols;
      const cellHeight = (height + 200) / rows;
      const startX = -100;
      const startY = -100;

      for (let r = 0; r <= rows; r++) {
        points[r] = [];
        for (let c = 0; c <= cols; c++) {
          const baseX = startX + c * cellWidth;
          const baseY = startY + r * cellHeight;

          // Wave equation driven by time and scroll
          const wave1 = Math.sin(time * 0.8 + c * 0.38 + r * 0.3);
          const wave2 = Math.cos(time * 0.6 - c * 0.25 + r * 0.45);
          const scrollDisplacement = Math.sin(smoothedScrollY * 0.003 + c * 0.35 + r * 0.2) * 28;
          const velocityPush = Math.sin(c * 0.5) * (scrollVelocity * 0.15);

          const offsetX = wave2 * 14 + (scrollVelocity * 0.05);
          const offsetY = (wave1 * 18) + scrollDisplacement + velocityPush;

          points[r][c] = {
            x: baseX + offsetX,
            y: baseY + offsetY,
            depth: (wave1 + wave2 + 2) / 4
          };
        }
      }

      // 1. Draw Mesh Connecting Lines (Light Bluish Cyber Matrix)
      ctx.lineWidth = 0.75;

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const p = points[r][c];

          // Horizontal wireframe lines
          if (c < cols) {
            const nextP = points[r][c + 1];
            const avgDepth = (p.depth + nextP.depth) / 2;
            const alpha = 0.04 + avgDepth * 0.08 + Math.min(Math.abs(scrollVelocity) * 0.003, 0.08);

            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(nextP.x, nextP.y);
            ctx.stroke();
          }

          // Vertical wireframe lines
          if (r < rows) {
            const nextP = points[r + 1][c];
            const avgDepth = (p.depth + nextP.depth) / 2;
            const alpha = 0.035 + avgDepth * 0.07 + Math.min(Math.abs(scrollVelocity) * 0.003, 0.07);

            ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(nextP.x, nextP.y);
            ctx.stroke();
          }

          // Diagonal structural cross-ties (for organic tech mesh look)
          if (c < cols && r < rows && (r + c) % 2 === 0) {
            const diagP = points[r + 1][c + 1];
            const avgDepth = (p.depth + diagP.depth) / 2;
            const alpha = 0.02 + avgDepth * 0.05;

            ctx.strokeStyle = `rgba(203, 213, 225, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(diagP.x, diagP.y);
            ctx.stroke();
          }
        }
      }

      // 2. Draw Floating Curved Parallax Mesh Ribbons (Fluid Bluish Structures)
      const ribbonCount = 2;
      for (let i = 0; i < ribbonCount; i++) {
        const ribbonY = (height * 0.35 * (i + 1)) - (smoothedScrollY * 0.18 * (i === 0 ? 1 : -0.8)) % (height + 200);
        ctx.beginPath();
        ctx.strokeStyle = i === 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(96, 165, 250, 0.1)';
        ctx.lineWidth = 1.2;

        ctx.moveTo(-50, ribbonY + Math.sin(time + i) * 40);
        for (let x = 0; x <= width + 60; x += 60) {
          const wave = Math.sin((x * 0.004) + time + (smoothedScrollY * 0.002)) * 55;
          ctx.lineTo(x, ribbonY + wave);
        }
        ctx.stroke();
      }

      // 3. Draw Subtle Vertex Light Nodes at key intersections
      for (let r = 0; r <= rows; r += 2) {
        for (let c = 0; c <= cols; c += 2) {
          const p = points[r][c];
          if (p.x > 0 && p.x < width && p.y > 0 && p.y < height) {
            const glowAlpha = 0.15 + p.depth * 0.25;
            ctx.fillStyle = `rgba(147, 197, 253, ${glowAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(renderDynamicMesh);
    }

    // Pause when tab is not active to save battery
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(renderDynamicMesh);
      }
    });

    animId = requestAnimationFrame(renderDynamicMesh);
  }
});
