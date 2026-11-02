window.__ModuleLoader__.load({
  id: '@jiangsuyuan/dsh-theme-550c',
  factory() {
    // One palette, day and night. The presenter writes theme tokens onto
    // document.body, so a skin layer re-applies its values there.
    const TOKENS = {
      '--dsw-alias-bg-base': '#0A1B18',
      '--dsw-alias-bg-layer-1': '#0D211E',
      '--dsw-alias-bg-layer-2': '#102623',
      '--dsw-alias-bg-overlay': '#142A27',
      '--dsw-alias-border-l1': '#5F7B74',
      '--dsw-alias-border-l2': '#8CA39C',
      '--dsw-alias-brand-primary': '#C9A45A',
      '--dsw-alias-label-primary': '#BCCBC5',
      '--dsw-alias-label-secondary': '#84988F',
      '--dsw-alias-state-error-primary': '#B96A63',
      '--dsw-alias-state-warn-primary': '#C08A86',
      '--dsw-alias-state-success-primary': '#8FB49B',
      '--dsw-alias-state-idle-primary': '#5A6E68',
      '--dsw-specific-sidebar-fill': '#0A1B18',
      // Not in the alias directory, but the blue family lives here.
      '--dsw-alias-state-business-primary': '#C9A45A',
      '--dsw-focus-ring-color': '#C9A45A',
      '--dsw-alias-label-link': '#C9A45A',
      // Labels that sit on the accent fill.
      '--dsw-alias-label-inverse': '#07100D',
      '--dsw-alias-label-on-brand': '#07100D',
      '--dsw-alias-label-on-accent': '#07100D',
      '--dsw-alias-label-on-primary': '#07100D',
    };

    const paint = () => {
      const body = document.body;
      if (!body) return;
      for (const name of Object.keys(TOKENS)) {
        body.style.setProperty(name, TOKENS[name]);
      }
      if (!body.hasAttribute('data-ds-dark-theme')) {
        body.setAttribute('data-ds-dark-theme', '');
      }
      document.documentElement.style.colorScheme = 'dark';
    };

    // Accent fills carry dark text.
    const BRAND = [201, 164, 90];
    const isBrand = (bg) => {
      const m = /rgba?\(([^)]+)\)/.exec(bg);
      if (!m) return false;
      const p = m[1].split(',').map((v) => parseFloat(v));
      if (p.length < 3) return false;
      const a = p.length > 3 ? p[3] : 1;
      return (
        a > 0.5 &&
        Math.abs(p[0] - BRAND[0]) < 12 &&
        Math.abs(p[1] - BRAND[1]) < 12 &&
        Math.abs(p[2] - BRAND[2]) < 12
      );
    };

    const inked = new Set();

    const guard = () => {
      // Anything we inked but which is no longer on an accent fill loses the ink.
      for (const el of Array.from(inked)) {
        if (!el.isConnected || !isBrand(getComputedStyle(el).backgroundColor)) {
          el.style.removeProperty('color');
          for (const svg of el.querySelectorAll('svg')) svg.style.removeProperty('color');
          inked.delete(el);
        }
      }
      const nodes = document.querySelectorAll(
        'button, a, [role="button"], [role="tab"], [aria-selected="true"]',
      );
      for (const el of nodes) {
        if (!isBrand(getComputedStyle(el).backgroundColor)) continue;
        inked.add(el);
        if (el.style.color !== 'rgb(7, 16, 13)') el.style.color = '#07100D';
        for (const svg of el.querySelectorAll('svg')) {
          if (svg.style.color !== 'rgb(7, 16, 13)') svg.style.color = '#07100D';
        }
      }
    };

    let lastGrey = 0;

    // No neutral grey fills anywhere: surfaces either carry the palette or none.
    const deGrey = () => {
      const now = Date.now();
      if (now - lastGrey < 2500) return;
      lastGrey = now;
      for (const el of document.querySelectorAll('body *')) {
        const bg = getComputedStyle(el).backgroundColor;
        const m = /rgba?\(([^)]+)\)/.exec(bg);
        if (!m) continue;
        const p = m[1].split(',').map(Number);
        if (p.length < 3) continue;
        if (p.length > 3 && p[3] < 0.4) continue;
        if (Math.abs(p[0] - p[1]) > 6 || Math.abs(p[1] - p[2]) > 6) continue;
        if (p[0] < 22 || p[0] > 86) continue;
        const r = el.getBoundingClientRect();
        if (r.width * r.height < 900) continue;
        el.style.background = 'transparent';
      }
    };

    // Raised surfaces get a visible hairline, like a framed instrument panel.
    const RING = '2px solid #8CA39C';
    const frame = (root) => {
      if (!(root instanceof Element)) return;
      const list = [root, ...root.querySelectorAll('*')];
      for (const el of list) {
        if (!(el instanceof HTMLElement)) continue;
        if (el.dataset.dsh550cFramed) continue;
        const cs = getComputedStyle(el);
        const cls = typeof el.className === 'string' ? el.className : '';
        const named = /card|panel|modal|dialog|composer|menu|popover|sheet|surface/i.test(cls);
        if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') continue;
        // The composer already draws its own border; a second outline reads as a box in a box.
        if (el.querySelector('textarea, [contenteditable="true"]')) continue;
        const r = el.getBoundingClientRect();
        // Small chrome (logo, tabs, pills, title) stays unframed; only real surfaces.
        const surface =
          (named && r.width >= 420 && r.height >= 70) ||
          (cs.boxShadow !== 'none' && r.width >= 300 && r.height >= 110);
        if (!surface) continue;
        if (r.width < 120 || r.height < 36) continue;
        el.dataset.dsh550cFramed = '1';
        el.style.outline = RING;
        el.style.outlineOffset = '-2px';
      }
    };

    // Column seams: the session column gets a right edge, the title row a
    // bottom edge. Geometry only, so it survives class renames.
    const seam = () => {
      let side = null;
      let head = null;
      let bar = null;
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (
          r.left <= 12 && r.width >= 200 && r.width <= 470 && r.height >= 420 &&
          (!side || r.width > side.r.width)
        ) {
          side = { el, r };
        }
        if (
          r.top >= 36 && r.top <= 130 && r.width > 900 && r.height >= 30 && r.height <= 80 &&
          (!head || r.top < head.r.top)
        ) {
          head = { el, r };
        }
        if (
          r.top <= 6 && r.height >= 28 && r.height <= 60 && r.width > 1200 &&
          (!bar || r.width > bar.r.width)
        ) {
          bar = { el, r };
        }
      }
      if (side && !side.el.style.borderRight) side.el.style.borderRight = '2px solid #8CA39C';
      if (head && !head.el.style.borderBottom) head.el.style.borderBottom = '2px solid #8CA39C';
      // The caption row shares the conversation surface.
      if (bar) bar.el.style.background = '#0A1B18';
      return (side ? 'S1' : 'S0') + ' ' + (head ? 'H1' : 'H0');
    };

    // Header pills (mode, background tasks) get a hairline like the mockup.
    // They are plain divs with no class or role, so the icon inside is the tell.
    const headerBits = () => {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.top < 36 || r.top > 106 || r.height < 18 || r.height > 30) continue;
        if (r.width < 40 || r.width > 240) continue;
        if (r.left < 300) continue;
        if (el.closest('[role="tab"], [role="tablist"]')) continue;
        const text = (el.textContent || '').trim();
        if (text.length === 0 || text.length > 14) continue;
        if (parseFloat(getComputedStyle(el).fontSize) > 12) continue;
        const d = getComputedStyle(el).display;
        if (!el.querySelector('svg') && d !== 'flex' && d !== 'inline-flex') continue;
        if (el.style.border) continue;
        el.style.border = '1px solid #8CA39C';
      }
    };

    // Composer: no separate fill, and the send/stop control carries the accent.
    const composer = () => {
      const field = document.querySelector('textarea, [contenteditable="true"]');
      if (!field) return;
      let box = null;
      let el = field.parentElement;
      for (let i = 0; i < 6 && el; i += 1, el = el.parentElement) {
        const r = el.getBoundingClientRect();
        if (r.width >= 400 && r.height >= 60 && r.height <= 240) box = el;
        if (r.width > 300 && r.height > 50) {
          const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
          if (m) {
            const p = m[1].split(',').map(Number);
            if (
              Math.abs(p[0] - p[1]) < 14 &&
              Math.abs(p[1] - p[2]) < 14 &&
              p[0] > 18 &&
              p[0] < 82
            ) {
              el.style.background = '#0A1B18';
            }
          }
        }
      }
      if (!box) return;
      box.style.background = '#0A1B18';
      for (const inner of box.querySelectorAll('*')) {
        const ir = inner.getBoundingClientRect();
        if (ir.width < 300 || ir.height < 24) continue;
        const im = /rgba?\(([^)]+)\)/.exec(getComputedStyle(inner).backgroundColor);
        if (!im) continue;
        const ip = im[1].split(',').map(Number);
        if (
          Math.abs(ip[0] - ip[1]) < 20 &&
          Math.abs(ip[1] - ip[2]) < 20 &&
          ip[0] > 14 &&
          ip[0] < 95
        ) {
          inner.style.background = '#0A1B18';
        }
      }
      const buttons = Array.from(box.querySelectorAll('button, [role="button"]'));
      if (!buttons.length) return;
      buttons.sort(
        (a, b) => a.getBoundingClientRect().right - b.getBoundingClientRect().right,
      );
      const send = buttons[buttons.length - 1];
      const sr = send.getBoundingClientRect();
      if (sr.width < 20 || sr.width > 64 || sr.height < 20 || sr.height > 64) return;
      send.style.background = '#C9A45A';
      send.style.borderColor = '#C9A45A';
      send.style.color = '#07100D';
      for (const svg of send.querySelectorAll('svg')) svg.style.color = '#07100D';
    };

    // Frames inside the transcript follow the dim table rule, not the bright frame token.
    const dimFlow = () => {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width < 80 || r.height < 24) continue;
        if (r.left < 330 || r.top < 110) continue;
        if (r.top > window.innerHeight - 220) continue;
        if (el.querySelector('textarea, [contenteditable="true"]')) continue;
        if (el.tagName === 'BUTTON' || el.tagName === 'svg') continue;
        const cs = getComputedStyle(el);
        const widths = [
          parseFloat(cs.borderTopWidth),
          parseFloat(cs.borderRightWidth),
          parseFloat(cs.borderBottomWidth),
          parseFloat(cs.borderLeftWidth),
        ];
        if (!widths.some((v) => v > 0)) continue;
        el.style.border = '1px solid #31403D';
      }
    };

    // New chat keeps one frame; the logo block keeps none.
    const sidebarTrim = () => {
      // Strip every frame in the logo band first, so the button pass below wins.
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.left > 330 || r.bottom < 44 || r.top > 100) continue;
        if (r.width > 330 || r.height > 62) continue;
        el.style.border = 'none';
        el.style.boxShadow = 'none';
        el.style.outline = 'none';
        el.style.backgroundImage = 'none';
      }

      const btn = Array.from(document.querySelectorAll('button, a')).find(
        (el) => (el.textContent || '').includes('新会话'),
      );
      if (!btn) return;
      btn.style.border = '2px solid #8CA39C';
      let outer = btn.parentElement;
      for (let i = 0; i < 2 && outer; i += 1, outer = outer.parentElement) {
        const r = outer.getBoundingClientRect();
        if (r.height > 90) break;
        if (r.height >= 30) {
          outer.style.border = '2px solid #8CA39C';
          break;
        }
      }
    };

    return {
      inject: ['theme'],
      apply(ctx) {
        paint();

        ctx.effect(() => {
          const style = document.createElement('style');
          style.textContent = [
            'html,body{background:#0A1B18 !important;color-scheme:dark !important}',
            '*,*::before,*::after{border-radius:0 !important}',
            'input,textarea,select,[contenteditable="true"]{color-scheme:dark !important}',
            'textarea,[contenteditable="true"]{background:transparent !important}',
            '[class*="composer"]{background:#0A1B18 !important}',
            '[data-composer-card="true"]{border:2px solid #8CA39C !important}',
            'pre{border:1px solid #31403D !important;box-sizing:border-box}',
            // Table rules: match the dim header rule (#31403D), not the frame token.
            'table th,table td{border-color:#31403D !important}',
            '[data-role="user"],[data-message-role="user"],[data-author="user"],[class*="userMessage"],[class*="user-message"],[class*="userBubble"]{border:1px solid #31403D !important}',
            '[role="tab"][aria-selected="true"],[aria-selected="true"]{background:#C9A45A !important;color:#07100D !important}',
            '[role="tab"][aria-selected="true"] *,[aria-selected="true"] *{color:#07100D !important}',
            '[role="tab"][aria-selected="true"]{align-self:stretch !important;display:flex !important;align-items:center !important;margin:0 -9px !important;padding:0 9px !important;border-bottom:2px solid #C9A45A !important;position:relative !important;z-index:2 !important}',
            '[role="radio"][aria-checked="true"],button[aria-checked="true"],[aria-checked="true"],[aria-pressed="true"],[data-state="checked"],[data-state="on"],[data-selected="true"],[aria-current="page"],[aria-current="true"]{background:#C9A45A !important;color:#07100D !important;border-color:#C9A45A !important}',
            '[role="radio"][aria-checked="true"] *,[aria-checked="true"] *,[aria-pressed="true"] *,[data-state="checked"] *,[data-state="on"] *,[aria-current="page"] *,[aria-current="true"] *{color:#07100D !important}',
          ].join('\n');
          document.head.appendChild(style);
          return () => style.remove();
        });

        // A palette flip rewrites the same variables; keep ours last.
        ctx.effect(() => {
          const timer = setInterval(paint, 1500);
          return () => clearInterval(timer);
        });

        // The caption row is painted by the frame, not by a DOM header, so the
        // seam under it is a fixed rule at the published titlebar height.
        ctx.effect(() => {
          const rule = document.createElement('div');
          rule.id = 'dsh-550c-topline';
          rule.style.cssText = [
            'position:fixed',
            'left:0',
            'right:0',
            'top:var(--dsh-windows-titlebar-height, 40px)',
            'height:2px',
            'background:#8CA39C',
            'z-index:2147483000',
            'pointer-events:none',
          ].join(';');
          document.body.appendChild(rule);
          return () => rule.remove();
        });

        let queued = 0;
        const queuePass = () => {
          if (queued) return;
          queued = setTimeout(() => {
            queued = 0;
            guard();
            seam();
            deGrey();
            composer();
            sidebarTrim();
            dimFlow();
          }, 180);
        };

        ctx.on('theme/change', () => {
          paint();
          queuePass();
        });

        if (document.body) {
          queuePass();
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              for (const node of record.addedNodes) {
              }
            }
            queuePass();
          });
          observer.observe(document.body, {
            attributes: true,
            subtree: true,
            childList: true,
            attributeFilter: ['data-ds-dark-theme', 'class', 'style'],
          });
          ctx.effect(() => () => {
            observer.disconnect();
            if (queued) clearTimeout(queued);
          });
        }
      },
    };
  },
});


















