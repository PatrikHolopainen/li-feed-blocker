(() => {
  const FEED_PATHS = [/^\/feed\/?$/, /^\/$/];
  const STYLE_ID = "li-blocker-style";
  const PLACEHOLDER_ID = "li-blocker-placeholder";
  const FEED_BLOCKED_CLASS = "li-blocker-feed-blocked";
  const FEED_SELECTORS = [
    ".feed-outlet",
    ".scaffold-finite-scroll",
    ".scaffold-finite-scroll__content",
    "div[data-test-id='feed-updates']",
    "div[data-test-id='feed-content']",
    "div[data-urn^='urn:li:activity']"
  ];
  const MAIN_SELECTORS = ["main", "#main", "div[role='main']"];

  const isFeedPage = () => FEED_PATHS.some((re) => re.test(location.pathname));

  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const scopedFeedSelectors = FEED_SELECTORS.map(
      (selector) => `html.${FEED_BLOCKED_CLASS} ${selector}`
    );
    const scopedMainChildrenSelectors = MAIN_SELECTORS.map(
      (selector) =>
        `html.${FEED_BLOCKED_CLASS} ${selector} > *:not(#${PLACEHOLDER_ID})`
    );
    style.textContent = `
      ${scopedFeedSelectors.join(",")} {
        display: none !important;
      }
      ${scopedMainChildrenSelectors.join(",")} {
        display: none !important;
      }
      #${PLACEHOLDER_ID} {
        margin: 24px auto;
        max-width: 680px;
        padding: 24px;
        border: 1px solid #d0d7de;
        border-radius: 12px;
        background: #f8f9fb;
        color: #24292f;
        font-size: 16px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        display: block !important;
        height: auto !important;
        min-height: 0 !important;
        align-self: flex-start;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  const placePlaceholder = () => {
    const main = document.querySelector(MAIN_SELECTORS.join(","));
    if (!main) return;
    const existing = document.getElementById(PLACEHOLDER_ID);
    if (existing) {
      if (existing.parentElement !== main) {
        main.prepend(existing);
      }
      return;
    }
    const placeholder = document.createElement("div");
    placeholder.id = PLACEHOLDER_ID;
    placeholder.setAttribute("role", "status");
    placeholder.textContent = "Feed blocked by Linkedin Feed Blocker.";
    main.prepend(placeholder);
  };

  const removePlaceholder = () => {
    const placeholder = document.getElementById(PLACEHOLDER_ID);
    if (placeholder) placeholder.remove();
  };

  const hideFeedNodes = () => {
    const nodes = document.querySelectorAll(FEED_SELECTORS.join(","));
    nodes.forEach((node) => {
      node.dataset.liBlockerHidden = "true";
      node.style.setProperty("display", "none", "important");
      node.setAttribute("aria-hidden", "true");
    });
  };

  const restoreHiddenNodes = () => {
    const nodes = document.querySelectorAll("[data-li-blocker-hidden='true']");
    nodes.forEach((node) => {
      node.style.removeProperty("display");
      node.removeAttribute("aria-hidden");
      node.removeAttribute("data-li-blocker-hidden");
    });
  };

  const setFeedBlockedState = (enabled) => {
    document.documentElement.classList.toggle(FEED_BLOCKED_CLASS, enabled);
  };

  let observer = null;
  const startObserver = () => {
    if (observer) return;
    observer = new MutationObserver(() => {
      if (!isFeedPage()) return;
      hideFeedNodes();
      placePlaceholder();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  const stopObserver = () => {
    if (!observer) return;
    observer.disconnect();
    observer = null;
  };

  const init = () => {
    const onFeedPage = isFeedPage();
    setFeedBlockedState(onFeedPage);
    if (!onFeedPage) {
      stopObserver();
      restoreHiddenNodes();
      removePlaceholder();
      return;
    }
    ensureStyles();
    hideFeedNodes();
    placePlaceholder();
    startObserver();
  };

  let lastPath = location.pathname;
  const watchRouteChanges = () => {
    const scheduleInit = (() => {
      let queued = false;
      return () => {
        if (queued) return;
        queued = true;
        setTimeout(() => {
          queued = false;
          if (location.pathname !== lastPath) {
            lastPath = location.pathname;
          }
          init();
        }, 0);
      };
    })();

    const originalPushState = history.pushState.bind(history);
    history.pushState = (...args) => {
      originalPushState(...args);
      scheduleInit();
    };
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = (...args) => {
      originalReplaceState(...args);
      scheduleInit();
    };

    window.addEventListener("popstate", scheduleInit);
    window.addEventListener("hashchange", scheduleInit);

    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        init();
      }
    }, 1000);
  };

  init();
  watchRouteChanges();
})();
