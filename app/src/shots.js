// Fixed scenes for screenshots: ?shot=editor shows the studio with sample photos loaded;
// ?shot=cover shows the cover alone at an export size. window.__shotReady is set once painted.
// Query knobs: photo (sample name), photo2, layout, grade, title, tagline, titlePos,
// size (WxH), single, and per-panel overrides panels / oys / zooms (comma lists).
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const size = (query.get('size') || '').split('x');
  const w = Number(size[0]) || 1920;
  const h = Number(size[1]) || 1080;
  await setup({
    photo: query.get('photo') ?? 'boulevard',
    photo2: query.get('photo2') ?? 'pier',
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('title') ?? 'VICE CITY',
    tagline: query.get('tagline') ?? 'EVERY SUNSET HAS A PRICE',
    titlePos: query.get('titlePos') ?? 'band',
    single: query.get('single') === '1',
    panels: query.get('panels') ?? null,
    oys: query.get('oys') ?? null,
    zooms: query.get('zooms') ?? null,
    size: { w, h },
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
