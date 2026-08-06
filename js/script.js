const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".header nav a");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const currentId = entry.target.id;

        navLinks.forEach((link) => {
          const href = link.getAttribute("href");
          link.classList.toggle("active", href === `#${currentId}`);
        });
      });
    },
    {
      root: null,
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0
    }
  );

  sections.forEach((section) => observer.observe(section));
}

const backToTop = document.querySelector(".back-to-top");

window.addEventListener("scroll", () => {
  if (backToTop) backToTop.classList.toggle("show", window.scrollY > 500);
});

const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
const mobileNav = document.querySelector("#mobile-navigation");
const mobileNavClose = document.querySelector(".mobile-nav-close");
const mobileNavOverlay = document.querySelector(".mobile-nav-overlay");
const mobileNavMedia = window.matchMedia("(max-width: 600px)");

if (mobileNavToggle && mobileNav && mobileNavClose && mobileNavOverlay) {
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let returnFocus = null;

  const setMenuState = (isOpen, restoreFocus = true) => {
    document.body.classList.toggle("mobile-nav-open", isOpen);
    mobileNavToggle.setAttribute("aria-expanded", String(isOpen));
    mobileNavToggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
    mobileNavOverlay.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      returnFocus = document.activeElement;
      window.setTimeout(() => mobileNavClose.focus(), 100);
    } else if (restoreFocus && returnFocus instanceof HTMLElement) {
      returnFocus.focus();
    }
  };

  mobileNavToggle.addEventListener("click", () => {
    setMenuState(mobileNavToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileNavClose.addEventListener("click", () => setMenuState(false));
  mobileNavOverlay.addEventListener("click", () => setMenuState(false));

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(() => setMenuState(false, false), 300);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("mobile-nav-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setMenuState(false);
      return;
    }

    if (event.key !== "Tab") return;

    const focusableItems = Array.from(mobileNav.querySelectorAll(focusableSelector));
    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];

    if (!firstItem || !lastItem) return;

    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  });

  mobileNavMedia.addEventListener("change", (event) => {
    if (!event.matches) setMenuState(false, false);
  });
}
