// Renders the cover onto a canvas: multi-panel photo poster above a drawn caption
// band (retro sun, palms, skyline), with a colour grade, halftone and grain.
import { gradeFor } from './grades.js';
import { drawRetroSun, drawPalmRow, drawSkyline, drawHalftone, drawGrain, drawVignette } from './art.js';

export const BAND_FRACTION = 0.185;
export const GAP_FRACTION = 0.012;

/** Panel rects (fractions of the photo region) for each layout. */
export const LAYOUTS = {
  hero: {
    label: 'Hero + 2',
    panels: [
      { x: 0, y: 0, w: 0.598, h: 1 },
      { x: 0.61, y: 0, w: 0.39, h: 0.488 },
      { x: 0.61, y: 0.512, w: 0.39, h: 0.488 },
    ],
  },
  quad: {
    label: 'Four panels',
    panels: [
      { x: 0, y: 0, w: 0.494, h: 0.488 },
      { x: 0.506, y: 0, w: 0.494, h: 0.488 },
      { x: 0, y: 0.512, w: 0.494, h: 0.488 },
      { x: 0.506, y: 0.512, w: 0.494, h: 0.488 },
    ],
  },
  full: {
    label: 'Full bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

/** Layout names in menu order. */
export function layoutKeys() {
  return Object.keys(LAYOUTS);
}

/** Default per-panel settings for a layout: photo index, zoom and offsets. */
export function defaultPanels(layoutKey) {
  return LAYOUTS[layoutKey].panels.map((_, i) => ({ photo: i % 3, zoom: 1, ox: 0, oy: 0 }));
}

/** Draws one photo into a rect, cover-fit, with zoom and drag offsets.
 *  Offsets are clamped so the photo always covers the rect — dragging can never
 *  pull it out and leave a gap. */
export function drawPhotoInto(ctx, photo, rect, zoom, ox, oy, filter = 'none') {
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const rawDx = rect.x + (rect.w - pw) / 2 + ox * rect.w;
  const rawDy = rect.y + (rect.h - ph) / 2 + oy * rect.h;
  const dx = Math.min(rect.x, Math.max(rect.x + rect.w - pw, rawDx));
  const dy = Math.min(rect.y, Math.max(rect.y + rect.h - ph, rawDy));
  ctx.save();
  try { ctx.filter = filter; } catch { /* older canvas */ }
  ctx.drawImage(photo, dx, dy, pw, ph);
  ctx.restore();
}

/** Washes a panel with the grade colour so photos share one sunset/neon look. */
export function applyGradeWash(ctx, rect, grade) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.deep;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const shade = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Draws the photo region: panels with white gaps, or one photo sliced across them. */
export function drawPhotoRegion(ctx, state, region, grade) {
  const layout = LAYOUTS[state.layout];
  const panels = layout.panels.map((p) => ({
    x: region.x + p.x * region.w,
    y: region.y + p.y * region.h,
    w: p.w * region.w,
    h: p.h * region.h,
  }));
  const settings = state.panels[state.layout] ?? defaultPanels(state.layout);
  const border = Math.max(2, region.w * 0.004);
  if (state.singlePhoto) {
    const photo = state.photos[0];
    const shared = settings[0] ?? { zoom: 1, ox: 0, oy: 0 };
    panels.forEach((rect) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      if (photo) drawPhotoInto(ctx, photo, region, shared.zoom, shared.ox, shared.oy, grade.filter);
      else paintEmptyPanel(ctx, rect, grade);
      applyGradeWash(ctx, rect, grade);
      ctx.restore();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = border;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });
    return;
  }
  panels.forEach((rect, i) => {
    const set = settings[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[set.photo] ?? state.photos.find(Boolean) ?? null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (photo) drawPhotoInto(ctx, photo, rect, set.zoom, set.ox, set.oy, grade.filter);
    else paintEmptyPanel(ctx, rect, grade);
    applyGradeWash(ctx, rect, grade);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = border;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
}

/** Fills a photo-less panel with a drawn sunset so the poster never looks empty. */
export function paintEmptyPanel(ctx, rect, grade) {
  const sky = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.6, grade.skyMid);
  sky.addColorStop(1, grade.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawRetroSun(ctx, rect.x + rect.w * 0.5, rect.y + rect.h * 0.62, rect.h * 0.26, grade);
  drawSkyline(ctx, rect.x, rect.y + rect.h * 0.98, rect.w, rect.h * 0.16, grade.ink, grade.accent);
}

/** Draws the caption band: sunset sky, retro sun, palms, skyline, big title, tagline. */
export function drawCaptionBand(ctx, state, band, grade) {
  const { x, y, w, h } = band;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.55, grade.skyMid);
  sky.addColorStop(1, grade.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // White poster gap separating the photos from the band, like the panel gaps.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, Math.max(2, h * 0.03));
  drawHalftone(ctx, x, y, w, h * 0.5, grade.sunCore, Math.max(2, h * 0.02));
  // Retro sun peeking out to the right of the title, not hidden behind it.
  const sunR = h * 0.58;
  drawRetroSun(ctx, x + w * 0.84, y + h * 0.85, sunR, grade);
  drawSkyline(ctx, x, y + h * 0.99, w, h * 0.16, grade.ink, grade.accent);
  drawPalmRow(ctx, w, y + h * 1.0, h * 0.62, grade.ink, 1);
  const title = (state.title || 'VICE CITY').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const size = fitTitleSize(ctx, title, w * 0.9, h * 0.56 * (state.titleSize ?? 1));
  const cx = x + w / 2;
  const titleY = y + h * (tagline ? 0.40 : 0.55);
  ctx.save();
  ctx.translate(cx, titleY);
  ctx.transform(1, 0, -0.07, 1, 0, 0);
  ctx.font = `900 ${size}px "Arial Black", "Archivo Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`; } catch { /* older canvas */ }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = size * 0.09;
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  const titleWidth = ctx.measureText(title).width;
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  ctx.restore();
  // Slanted accent bar under the title, poster-style.
  const barW = Math.min(w * 0.5, titleWidth * 0.62);
  const barH = Math.max(4, h * 0.055);
  const barY = y + h * (tagline ? 0.72 : 0.86);
  ctx.save();
  ctx.translate(cx, barY);
  ctx.transform(1, 0, -0.35, 1, 0, 0);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(-barW / 2, -barH / 2, barW, barH);
  ctx.restore();
  if (tagline) {
    // White tagline with a hard shadow so it reads over the skyline.
    const tagSize = Math.max(10, h * 0.13);
    ctx.save();
    ctx.font = `700 ${tagSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${tagSize * 0.42}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = tagSize * 0.35;
    ctx.fillText(tagline, cx, y + h * 0.89);
    ctx.restore();
  }
}

/** Shrinks the title until it fits the band width. */
export function fitTitleSize(ctx, title, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "Archivo Black", "Helvetica Neue", Arial, sans-serif`;
  while (ctx.measureText(title).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", "Archivo Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

/** Draws the whole cover onto the canvas at its own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeFor(state.grade);
  const bandH = Math.round(h * BAND_FRACTION);
  const region = { x: 0, y: 0, w, h: h - bandH };
  const band = { x: 0, y: h - bandH, w, h: bandH };
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, 0, w, h);
  drawPhotoRegion(ctx, state, region, grade);
  if ((state.titlePos ?? 'band') === 'top') {
    drawTitleOverlay(ctx, state, region, grade);
  }
  drawCaptionBand(ctx, state, band, grade);
  drawGrain(ctx, w, h, 0.10);
  drawVignette(ctx, w, h, 0.28);
}

/** Draws the title over the top of the photo region instead of in the band. */
export function drawTitleOverlay(ctx, state, region, grade) {
  const scrim = ctx.createLinearGradient(0, region.y, 0, region.y + region.h * 0.3);
  scrim.addColorStop(0, 'rgba(0,0,0,0.5)');
  scrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(region.x, region.y, region.w, region.h * 0.3);
  const title = (state.title || 'VICE CITY').trim().toUpperCase();
  const size = fitTitleSize(ctx, title, region.w * 0.9, region.h * 0.14 * (state.titleSize ?? 1));
  ctx.save();
  ctx.font = `900 ${size}px "Arial Black", "Archivo Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = size * 0.09;
  ctx.strokeText(title, region.w / 2, region.y + region.h * 0.11);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, region.w / 2, region.y + region.h * 0.11);
  ctx.restore();
}
