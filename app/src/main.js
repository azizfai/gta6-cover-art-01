// Vice City Cover Studio: wires the editor — photos, layouts, grades, caption,
// drag-to-position panels, and PNG export in the three common post sizes.
import { drawCover, layoutKeys, defaultPanels, LAYOUTS } from './cover.js';
import { gradeKeys, gradeFor } from './grades.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleInput = document.getElementById('title');
const taglineInput = document.getElementById('tagline');
const titleSizeInput = document.getElementById('titleSize');
const titlePosSelect = document.getElementById('titlePos');
const singleToggle = document.getElementById('singlePhoto');
const panelSelect = document.getElementById('panel');
const zoomInput = document.getElementById('zoom');
const sampleButton = document.getElementById('samples');
const randomButton = document.getElementById('shuffle');
const resetCropButton = document.getElementById('resetCrop');

export const EXPORT_SIZES = [
  { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export const state = {
  photos: [null, null, null],
  layout: 'hero',
  grade: 'sunset',
  singlePhoto: false,
  title: 'VICE CITY',
  tagline: 'EVERY SUNSET HAS A PRICE',
  titleSize: 1,
  titlePos: 'band',
  panels: {
    hero: defaultPanels('hero'),
    quad: defaultPanels('quad'),
    full: defaultPanels('full'),
  },
};

let exportSize = EXPORT_SIZES[2];
let drag = null;

function redraw() {
  const aspect = exportSize.w / exportSize.h;
  const previewW = 960;
  canvas.width = previewW;
  canvas.height = Math.round(previewW / aspect);
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

function refreshPanelControls() {
  const count = LAYOUTS[state.layout].panels.length;
  panelSelect.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Panel ${i + 1}`;
    panelSelect.appendChild(option);
  }
  syncZoomControl();
}

function syncZoomControl() {
  const set = state.panels[state.layout][Number(panelSelect.value) || 0];
  zoomInput.value = String(set?.zoom ?? 1);
}

/** Renders the cover at full export size and returns a PNG data URL. */
export async function exportCoverPNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  return off.toDataURL('image/png');
}

async function exportSizeNow(size) {
  const url = await exportCoverPNG(size.w, size.h);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-city-cover-${size.w}x${size.h}.png`;
  a.click();
  setStatus(`Saved vice-city-cover-${size.w}x${size.h}.png`);
}
window.__exportCoverPNG = exportCoverPNG;
window.__coverState = state;

function buildLayoutButtons() {
  const wrap = document.getElementById('layouts');
  layoutKeys().forEach((key) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'layout-btn';
    button.dataset.layout = key;
    button.textContent = LAYOUTS[key].label;
    button.setAttribute('aria-pressed', String(key === state.layout));
    button.addEventListener('click', () => {
      state.layout = key;
      wrap.querySelectorAll('.layout-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === key)));
      refreshPanelControls();
      redraw();
    });
    wrap.appendChild(button);
  });
}

function buildGradeButtons() {
  const wrap = document.getElementById('grades');
  gradeKeys().forEach((key) => {
    const preset = gradeFor(key);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grade-btn';
    button.dataset.grade = key;
    button.setAttribute('aria-pressed', String(key === state.grade));
    button.style.setProperty('--sw1', preset.skyMid);
    button.style.setProperty('--sw2', preset.skyLow);
    button.textContent = preset.label;
    button.addEventListener('click', () => {
      state.grade = key;
      wrap.querySelectorAll('.grade-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.grade === key)));
      redraw();
    });
    wrap.appendChild(button);
  });
}

function buildExportButtons() {
  const wrap = document.getElementById('exports');
  EXPORT_SIZES.forEach((size) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'export-btn';
    button.dataset.size = `${size.w}x${size.h}`;
    button.setAttribute('aria-pressed', String(size === exportSize));
    button.textContent = `Export ${size.label} PNG`;
    button.addEventListener('click', async () => {
      exportSize = size;
      wrap.querySelectorAll('.export-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === `${size.w}x${size.h}`)));
      redraw();
      await exportSizeNow(size);
    });
    wrap.appendChild(button);
  });
}

function bindPhotoInputs() {
  for (let i = 0; i < 3; i++) {
    const input = document.getElementById(`photo${i + 1}`);
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      state.photos[i] = await loadImage(URL.createObjectURL(file));
      state.panels[state.layout].forEach((set) => { if (set.photo === i) { set.zoom = 1; set.ox = 0; set.oy = 0; } });
      redraw();
      setStatus(`Photo ${i + 1} loaded — drag it in the preview to position it.`);
    });
  }
}

function panelRects() {
  const bandH = canvas.height * 0.185;
  const region = { x: 0, y: 0, w: canvas.width, h: canvas.height - bandH };
  return LAYOUTS[state.layout].panels.map((p) => ({
    x: region.x + p.x * region.w,
    y: region.y + p.y * region.h,
    w: p.w * region.w,
    h: p.h * region.h,
  }));
}

function bindDrag() {
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const idx = panelRects().findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (idx === -1) return;
    panelSelect.value = String(idx);
    syncZoomControl();
    const set = state.panels[state.layout][state.singlePhoto ? 0 : idx];
    drag = { idx, startX: x, startY: y, ox: set.ox, oy: set.oy };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const panel = panelRects()[drag.idx];
    const set = state.panels[state.layout][state.singlePhoto ? 0 : drag.idx];
    set.ox = drag.ox + (x - drag.startX) / panel.w;
    set.oy = drag.oy + (y - drag.startY) / panel.h;
    redraw();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

function bindControls() {
  titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
  taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });
  titleSizeInput.addEventListener('input', () => { state.titleSize = Number(titleSizeInput.value); redraw(); });
  titlePosSelect.addEventListener('change', () => { state.titlePos = titlePosSelect.value; redraw(); });
  singleToggle.addEventListener('change', () => { state.singlePhoto = singleToggle.checked; redraw(); });
  panelSelect.addEventListener('change', syncZoomControl);
  resetCropButton.addEventListener('click', () => {
    const set = state.panels[state.layout][Number(panelSelect.value) || 0];
    if (set) { set.zoom = 1; set.ox = 0; set.oy = 0; }
    syncZoomControl();
    redraw();
    setStatus('Panel crop reset.');
  });
  zoomInput.addEventListener('input', () => {
    const set = state.panels[state.layout][Number(panelSelect.value) || 0];
    if (set) set.zoom = Number(zoomInput.value);
    redraw();
  });
  sampleButton.addEventListener('click', async () => {
    state.photos[0] = await loadImage('samples/boulevard.jpg');
    state.photos[1] = await loadImage('samples/pier.jpg');
    redraw();
    setStatus('Sample photos loaded — boulevard and pier.');
  });
  randomButton.addEventListener('click', () => {
    const grades = gradeKeys();
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    document.querySelectorAll('.grade-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade)));
    redraw();
    setStatus(`Grade shuffled to ${gradeFor(state.grade).label}.`);
  });
}

buildLayoutButtons();
buildGradeButtons();
buildExportButtons();
bindPhotoInputs();
bindControls();
bindDrag();
refreshPanelControls();
redraw();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (scene) => {
    if (scene.size) {
      exportSize = EXPORT_SIZES.find((s) => s.w === scene.size.w && s.h === scene.size.h) ?? { label: 'Custom', w: scene.size.w, h: scene.size.h };
    }
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.title = scene.title;
    state.tagline = scene.tagline;
    state.singlePhoto = scene.single;
    state.titlePos = scene.titlePos ?? 'band';
    const panelSets = state.panels[state.layout];
    if (scene.panels) scene.panels.split(',').forEach((v, i) => { if (panelSets[i]) panelSets[i].photo = Number(v); });
    if (scene.oys) scene.oys.split(',').forEach((v, i) => { if (panelSets[i]) panelSets[i].oy = Number(v); });
    if (scene.zooms) scene.zooms.split(',').forEach((v, i) => { if (panelSets[i]) panelSets[i].zoom = Number(v); });
    state.photos[0] = await loadImage(`samples/${scene.photo}.jpg`);
    state.photos[1] = await loadImage(`samples/${scene.photo2}.jpg`);
    titleInput.value = state.title;
    taglineInput.value = state.tagline;
    document.querySelectorAll('.grade-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade)));
    document.querySelectorAll('.layout-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout)));
    refreshPanelControls();
    redraw();
  });
}
