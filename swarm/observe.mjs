// Turns the current page into a short text snapshot the model can read, and
// labels every interactive element so the model can point at it. Payment fields
// live in iframes, so every frame on the page is included.

function collectInFrame({ fi, limit }) {
  const SELECTOR = [
    'a[href]', 'button', 'input:not([type=hidden])', 'textarea', 'select', '[contenteditable="true"]',
    '[role=button]', '[role=link]', '[role=combobox]', '[role=option]', '[role=radio]', '[role=checkbox]',
    '[role=tab]', '[role=menuitem]', '[role=switch]',
  ].join(',');

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  };
  const clean = (s, n = 70) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

  const seen = new Set();
  const els = [...document.querySelectorAll(SELECTOR)].filter((el) => {
    if (seen.has(el) || !visible(el)) return false;
    seen.add(el);
    return true;
  }).slice(0, limit);

  const items = els.map((el, i) => {
    const id = `${fi}:${i}`;
    el.setAttribute('data-sw', id);
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || '';
    const type = el.getAttribute('type') || '';
    const label = clean(
      el.getAttribute('aria-label')
      || (el.labels && el.labels[0] && el.labels[0].innerText)
      || el.innerText
      || el.getAttribute('placeholder')
      || el.getAttribute('title')
      || el.getAttribute('name')
      || el.getAttribute('autocomplete')
      || '',
    );
    let state = '';
    if (tag === 'input' || tag === 'textarea') {
      if (type === 'checkbox' || type === 'radio') state = el.checked ? ' (checked)' : '';
      else if (type === 'password') state = el.value ? ' = "••••"' : ' (empty)';
      else if (!el.value) state = ' (empty)';
      else {
        const v = el.value;
        state = ` = "${clean(v, 160)}"${v.length > 160 ? ` (${v.length} characters in total)` : ''}`;
      }
    }
    if (tag === 'select') {
      state = ` options: ${[...el.options].map((o) => clean(o.text, 20)).join(' | ')}`;
    }
    const aria = el.getAttribute('aria-checked') || el.getAttribute('aria-selected') || el.getAttribute('aria-expanded');
    if (aria === 'true') state += ' (selected)';
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') state += ' (disabled)';
    const kind = role || (type && tag === 'input' ? `input:${type}` : tag);
    return `[${id}] ${kind} "${label}"${state}`;
  });

  const text = fi === 0 ? clean((document.querySelector('main') || document.body).innerText, 900) : '';
  const toasts = fi === 0
    ? [...document.querySelectorAll('[data-sonner-toast]')].map((t) => clean(t.innerText, 140)).join(' | ')
    : '';
  const dialog = fi === 0
    ? clean([...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' | '), 500)
    : '';
  const errors = fi === 0
    ? [...document.querySelectorAll('.text-destructive, [role=alert]')].map((e) => clean(e.innerText, 120)).filter(Boolean).join(' | ')
    : '';
  const openList = fi === 0 ? [...document.querySelectorAll('[role=listbox]')].some(visible) : false;

  return { items, text, toasts, dialog, errors, openList };
}

export async function observe(page) {
  const frames = page.frames();
  const out = {
    url: '',
    title: '',
    text: '',
    toasts: '',
    dialog: '',
    errors: '',
    openList: false,
    items: [],
    frames,
  };
  try {
    const u = new URL(page.url());
    out.url = u.pathname + u.search;
  } catch { out.url = page.url(); }
  out.title = await page.title().catch(() => '');

  for (let fi = 0; fi < frames.length; fi++) {
    let res;
    try {
      res = await frames[fi].evaluate(collectInFrame, { fi, limit: fi === 0 ? 60 : 15 });
    } catch {
      continue; // detached or unreachable frame
    }
    if (fi === 0) {
      out.text = res.text;
      out.toasts = res.toasts;
      out.dialog = res.dialog;
      out.errors = res.errors;
      out.openList = res.openList;
    }
    if (res.items.length) {
      if (fi > 0) out.items.push(`-- inside frame ${fi} (for example a payment form) --`);
      out.items.push(...res.items);
    }
  }
  return out;
}

async function openListbox(frame) {
  return (await frame.locator('[role="listbox"]').filter({ visible: true }).count()) > 0;
}

// While a shadcn/Radix dropdown is open, an invisible layer covers the page and the
// next click only closes the dropdown. People close dropdowns without thinking, so
// the harness does too, unless the click is on something inside the open list.
async function closeDropdownUnlessInside(page, frame, el) {
  if (!(await openListbox(frame))) return;
  const inside = await el.evaluate((n) => Boolean(n.closest('[role="listbox"]'))).catch(() => false);
  if (!inside) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
}

export async function act(page, frames, a) {
  const timeout = 8000;
  switch (a.action) {
    case 'back': await page.goBack({ timeout }).catch(() => {}); break;
    case 'keyboard': await page.keyboard.type(String(a.text ?? ''), { delay: 25 }); break;
    case 'press_enter': await page.keyboard.press('Enter'); break;
    case 'scroll': await page.mouse.wheel(0, 700); break;
    case 'wait': await page.waitForTimeout(2000); break;
    case 'click':
    case 'type':
    case 'select': {
      const fi = Number(String(a.target || '').split(':')[0]);
      const frame = frames[fi];
      if (!frame) throw new Error(`no frame for ${a.target}`);
      const el = frame.locator(`[data-sw="${a.target}"]`).first();
      const text = String(a.text ?? '');
      if (a.action === 'click') {
        await closeDropdownUnlessInside(page, frame, el);
        await el.click({ timeout });
      } else if (a.action === 'type') {
        // "type" always replaces the field's content, never adds to it.
        try {
          await el.fill(text, { timeout });
        } catch {
          await el.click({ timeout });
          await page.keyboard.press('ControlOrMeta+A');
          await page.keyboard.press('Backspace');
          await page.keyboard.type(text, { delay: 15 });
        }
      } else {
        const tag = await el.evaluate((n) => n.tagName.toLowerCase()).catch(() => '');
        if (tag === 'select') {
          await el.selectOption({ label: text }, { timeout })
            .catch(() => el.selectOption(text, { timeout }));
        } else {
          // Custom dropdowns (shadcn/Radix Select). Open it only if it isn't open already:
          // clicking the trigger of an open dropdown closes it again.
          if (!(await openListbox(frame))) await el.click({ timeout });
          // Only visible options: Radix also renders a hidden native <select> with the same options.
          const option = frame.getByRole('option', { name: text, exact: true }).filter({ visible: true }).first();
          await option.click({ timeout }).catch(async () => {
            await frame.getByRole('option', { name: text }).filter({ visible: true }).first().click({ timeout });
          });
          // Never leave a dropdown open: its overlay would swallow the next click.
          if (await openListbox(frame)) await page.keyboard.press('Escape');
        }
      }
      break;
    }
    default:
      throw new Error(`unknown action ${a.action}`);
  }
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
}
