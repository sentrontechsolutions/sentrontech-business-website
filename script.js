// Navbar shadow on scroll
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
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