// Passed whole to Playwright MCP's `browser_run_code_unsafe`, after editing FIGURE.
// Shoots the figure in every state a reader can put it in, sweeps each slider from end
// to end checking that no two visible names overlap, and returns what it found. It works
// in a page of its own, since the session's page may carry init scripts from earlier runs.
async (session) => {
  const FIGURE = {
    url: 'http://localhost:3000/posts/design-system',
    caption: 'The halftone over a video',
    out: '/tmp/figure',
    accents: ['blue', 'amber'],
  };
  const WIDTHS = [375, 1280];
  const MAX_STEPS = 400;

  const page = await session.context().newPage();
  const errors = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text().slice(0, 300)));
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 300)));

  const open = async ({ theme, accent, width, motion }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: motion });
    await page.addInitScript(([theme, accent]) => {
      localStorage.setItem('theme', theme);
      localStorage.setItem('hue', accent);
    }, [theme, accent]);
    await page.goto(FIGURE.url, { waitUntil: 'load' });
    const figure = page.locator('figure', { hasText: FIGURE.caption }).first();
    await figure.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    return figure;
  };

  const overlaps = (figure) =>
    figure.evaluate((root) => {
      const boxes = [...root.querySelectorAll('text')]
        .filter((text) => {
          const style = getComputedStyle(text);
          return style.visibility !== 'hidden' && Number(style.opacity) > 0;
        })
        .map((text) => ({ name: text.textContent, box: text.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0);
      const hits = [];
      for (const [i, a] of boxes.entries())
        for (const b of boxes.slice(i + 1))
          if (a.box.left < b.box.right && b.box.left < a.box.right && a.box.top < b.box.bottom && b.box.top < a.box.bottom)
            hits.push(`${a.name} / ${b.name}`);
      return hits;
    });

  try {
    const states = [];
    for (const theme of ['light', 'dark'])
      for (const [index, width] of WIDTHS.entries())
        for (const motion of ['no-preference', 'reduce']) {
          const accent = FIGURE.accents[index % FIGURE.accents.length];
          const name = `${theme}-${accent}-${width}-${motion}`;
          const figure = await open({ theme, accent, width, motion });
          await figure.screenshot({ path: `${FIGURE.out}/${name}.png` });
          const image = figure.locator('[role="img"]').first();
          states.push({
            name,
            label: (await image.count()) ? await image.getAttribute('aria-label') : null,
            scrollsSideways: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            overlaps: await overlaps(figure),
          });
        }

    const sweep = [];
    for (const width of WIDTHS) {
      const figure = await open({ theme: 'dark', accent: FIGURE.accents[0], width, motion: 'reduce' });
      const sliders = figure.getByRole('slider');
      for (let i = 0; i < (await sliders.count()); i++) {
        const slider = sliders.nth(i);
        const name = await slider.getAttribute('aria-label');
        await slider.focus();
        await page.keyboard.press('Home');
        let reachedEnd = false;
        for (let step = 0; step < MAX_STEPS && !reachedEnd; step++) {
          const value = await slider.getAttribute('aria-valuenow');
          for (const hit of await overlaps(figure)) sweep.push(`${width}px, ${name} at ${value}: ${hit}`);
          reachedEnd = value === (await slider.getAttribute('aria-valuemax'));
          if (!reachedEnd) await page.keyboard.press('ArrowRight');
        }
        if (!reachedEnd) sweep.push(`${width}px, ${name}: stopped after ${MAX_STEPS} steps, short of its end`);
        await figure.screenshot({ path: `${FIGURE.out}/sweep-${width}-${i}-max.png` });
      }
    }

    return { errors: [...new Set(errors)], states, sweep };
  } finally {
    await page.close();
  }
}
