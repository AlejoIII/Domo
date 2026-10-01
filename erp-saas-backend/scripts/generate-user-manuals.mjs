/**
 * Genera PDFs de manuales Domo (contenido denso, imágenes por paso, sin páginas en blanco).
 */
import { mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const docsDir = join(backendRoot, 'docs', 'user-manuals');
const assetsDir = join(docsDir, 'assets');
const pdfOutDir = join(docsDir, 'pdf');
const frontendManualsDir = join(backendRoot, '..', 'erp-saas-frontend', 'public', 'manuals');

const contentUrl = pathToFileURL(join(docsDir, 'manuals.content.mjs')).href;
const { USER_MANUALS, MANUALS_META } = await import(contentUrl);

const BRAND = {
  primary: '#438976',
  primaryDark: '#2F6B5A',
  headerBg: '#E8F0EC',
  text: '#333B47',
  muted: '#6B7280',
  border: '#D4DFDA',
  white: '#FFFFFF',
};

const PAGE = { w: 595.28, h: 841.89, margin: 44, footerY: 805 };
const CONTENT_BOTTOM = PAGE.footerY - 12;
const TEXT_W = PAGE.w - PAGE.margin * 2;

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function drawFooter(doc, pageNum) {
  const y = PAGE.footerY;
  doc.save();
  doc.strokeColor(BRAND.border).lineWidth(0.5)
    .moveTo(PAGE.margin, y).lineTo(PAGE.w - PAGE.margin, y).stroke();
  doc.fillColor(BRAND.muted).fontSize(7.5).font('Helvetica')
    .text(`${MANUALS_META.product} · Manual de usuario`, PAGE.margin, y + 6)
    .text(String(pageNum), PAGE.w - PAGE.margin - 30, y + 6, { width: 30, align: 'right' });
  doc.restore();
}

function newPageIfNeeded(doc, state, minHeight) {
  if (doc.y + minHeight <= CONTENT_BOTTOM) return;
  drawFooter(doc, state.page);
  doc.addPage();
  state.page += 1;
  doc.y = PAGE.margin;
  drawRunningHeader(doc, state.manualTitle);
}

function drawRunningHeader(doc, title) {
  doc.save();
  doc.rect(PAGE.margin, doc.y, TEXT_W, 18).fill(BRAND.headerBg);
  doc.fillColor(BRAND.primaryDark).fontSize(9).font('Helvetica-Bold')
    .text(title, PAGE.margin + 8, doc.y + 5, { width: TEXT_W - 16, ellipsis: true });
  doc.restore();
  doc.y += 24;
}

function drawSectionTitle(doc, title, state) {
  newPageIfNeeded(doc, state, 36);
  doc.fillColor(BRAND.primaryDark).fontSize(12).font('Helvetica-Bold')
    .text(title, PAGE.margin, doc.y, { width: TEXT_W });
  doc.y += 16;
}

function drawParagraph(doc, text, state) {
  if (!text?.trim()) return;
  newPageIfNeeded(doc, state, 40);
  doc.fillColor(BRAND.text).fontSize(10).font('Helvetica')
    .text(text, PAGE.margin, doc.y, { width: TEXT_W, lineGap: 3, align: 'justify' });
  doc.y += 8;
}

function drawBulletList(doc, items, state) {
  if (!items?.length) return;
  for (const item of items) {
    const h = doc.heightOfString(`• ${item}`, { width: TEXT_W - 14, lineGap: 2 });
    newPageIfNeeded(doc, state, h + 6);
    doc.fillColor(BRAND.text).fontSize(9.5).font('Helvetica')
      .text(`• ${item}`, PAGE.margin + 10, doc.y, { width: TEXT_W - 14, lineGap: 2 });
    doc.y += 4;
  }
  doc.y += 4;
}

async function resolveScreenshotPath(fileName, manualFallback) {
  const candidates = [fileName, manualFallback, 'dashboard.png'].filter(Boolean);
  for (const name of candidates) {
    const p = join(assetsDir, name);
    if (await fileExists(p)) return p;
  }
  return null;
}

async function drawStepImage(doc, fileName, caption, state, maxH = 150) {
  const imgPath = await resolveScreenshotPath(fileName, state.defaultScreenshot);
  if (!imgPath) {
    newPageIfNeeded(doc, state, 48);
    doc.rect(PAGE.margin, doc.y, TEXT_W, 40).strokeColor(BRAND.border).stroke();
    doc.fillColor(BRAND.muted).fontSize(8).font('Helvetica')
      .text('Ilustración: ejecuta npm run manuals:screenshots en el frontend', PAGE.margin + 8, doc.y + 14, {
        width: TEXT_W - 16,
        align: 'center',
      });
    doc.y += 48;
    return;
  }

  const img = doc.openImage(imgPath);
  const maxW = TEXT_W;
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = img.width * scale;
  const h = img.height * scale;
  newPageIfNeeded(doc, state, h + 22);
  const x = PAGE.margin + (TEXT_W - w) / 2;
  const y0 = doc.y;
  doc.image(imgPath, x, y0, { width: w, height: h });
  doc.y = y0 + h + 4;
  if (caption) {
    doc.fillColor(BRAND.muted).fontSize(7.5).font('Helvetica')
      .text(caption, PAGE.margin, doc.y, { width: TEXT_W, align: 'center' });
    doc.y += 12;
  }
}

function drawStep(doc, index, step, state) {
  const bodyH = doc.heightOfString(step.body ?? '', { width: TEXT_W - 28, lineGap: 2 });
  let bulletsH = 0;
  for (const b of step.bullets ?? []) {
    bulletsH += doc.heightOfString(`• ${b}`, { width: TEXT_W - 38, lineGap: 2 }) + 4;
  }
  const blockH = 28 + bodyH + bulletsH + (step.tip ? 20 : 0) + 8;
  newPageIfNeeded(doc, state, Math.min(blockH, 120));

  const startY = doc.y;
  const cx = PAGE.margin + 11;
  doc.circle(cx, startY + 9, 9).fill(BRAND.primary);
  doc.fillColor(BRAND.white).fontSize(8).font('Helvetica-Bold')
    .text(String(index + 1), cx - 5, startY + 5, { width: 10, align: 'center' });

  const tx = PAGE.margin + 26;
  doc.fillColor(BRAND.text).fontSize(10.5).font('Helvetica-Bold')
    .text(step.title, tx, startY, { width: TEXT_W - 26 });
  doc.fontSize(9.5).font('Helvetica')
    .text(step.body ?? '', tx, doc.y + 2, { width: TEXT_W - 26, lineGap: 2, align: 'justify' });

  if (step.bullets?.length) {
    doc.y += 2;
    for (const b of step.bullets) {
      doc.fillColor(BRAND.text).fontSize(9).font('Helvetica')
        .text(`– ${b}`, tx + 4, doc.y, { width: TEXT_W - 30, lineGap: 1 });
      doc.y += 2;
    }
  }
  if (step.tip) {
    doc.fillColor(BRAND.primaryDark).fontSize(8.5).font('Helvetica-Oblique')
      .text(`Consejo: ${step.tip}`, tx, doc.y + 2, { width: TEXT_W - 26 });
  }
  doc.y += 10;
}

async function buildManualPdf(manual) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const bufferPromise = new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const state = {
    page: 1,
    manualTitle: manual.title,
    defaultScreenshot: manual.screenshot,
  };

  doc.rect(0, 0, PAGE.w, 72).fill(BRAND.primary);
  doc.fillColor(BRAND.white).fontSize(18).font('Helvetica-Bold')
    .text(MANUALS_META.product, PAGE.margin, 22);
  doc.fontSize(9).font('Helvetica').text('Guía de uso paso a paso', PAGE.margin, 44);

  doc.y = 88;
  doc.fillColor(BRAND.text).fontSize(17).font('Helvetica-Bold')
    .text(manual.title, PAGE.margin, doc.y, { width: TEXT_W });
  doc.y += 4;
  doc.fontSize(9).fillColor(BRAND.muted).font('Helvetica')
    .text(`Módulo: ${manual.module}`, PAGE.margin, doc.y);
  doc.y += 14;

  drawParagraph(doc, manual.summary, state);
  if (manual.planNote) {
    doc.fillColor(BRAND.primaryDark).fontSize(9).font('Helvetica-Bold')
      .text(manual.planNote, PAGE.margin, doc.y, { width: TEXT_W });
    doc.y += 10;
  }

  if (manual.objectives?.length) {
    drawSectionTitle(doc, 'Qué aprenderás', state);
    drawBulletList(doc, manual.objectives, state);
  }
  if (manual.prerequisites?.length) {
    drawSectionTitle(doc, 'Antes de empezar', state);
    drawBulletList(doc, manual.prerequisites, state);
  }

  drawSectionTitle(doc, 'Procedimiento detallado', state);
  for (let i = 0; i < manual.steps.length; i += 1) {
    const step = manual.steps[i];
    drawStep(doc, i, step, state);
    if (step.screenshot === false) continue;
    const stepFile = step.screenshot || manual.screenshot;
    const hasModuleCapture = stepFile && (await fileExists(join(assetsDir, stepFile)));
    const showImage = hasModuleCapture && (step.screenshot || i % 2 === 0 || i === 0);
    if (!showImage) continue;
    await drawStepImage(
      doc,
      stepFile || 'dashboard.png',
      step.imageCaption || `Referencia visual — ${step.title}`,
      state,
      hasModuleCapture ? 165 : 140,
    );
  }

  if (manual.faq?.length) {
    drawSectionTitle(doc, 'Preguntas frecuentes', state);
    for (const item of manual.faq) {
      newPageIfNeeded(doc, state, 36);
      doc.fillColor(BRAND.text).fontSize(9.5).font('Helvetica-Bold')
        .text(`P: ${item.q}`, PAGE.margin, doc.y, { width: TEXT_W });
      doc.font('Helvetica').fillColor(BRAND.muted)
        .text(`R: ${item.a}`, PAGE.margin, doc.y + 2, { width: TEXT_W, lineGap: 2 });
      doc.y += 10;
    }
  }

  newPageIfNeeded(doc, state, 24);
  drawParagraph(doc, MANUALS_META.supportHint, state);
  drawFooter(doc, state.page);
  doc.end();
  return /** @type {Promise<Buffer>} */ (bufferPromise);
}

function buildIndexPdf(manifest) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE.margin });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, PAGE.w, 88).fill(BRAND.primary);
    doc.fillColor(BRAND.white).fontSize(18).font('Helvetica-Bold')
      .text('Índice de manuales Domo', PAGE.margin, 32);
    doc.fillColor(BRAND.text).fontSize(10).font('Helvetica')
      .text('Descarga cada guía desde Ayuda → Manuales en la aplicación.', PAGE.margin, 110);

    let y = 132;
    for (const m of manifest) {
      if (y > CONTENT_BOTTOM) {
        doc.addPage();
        y = PAGE.margin;
      }
      doc.fillColor(BRAND.primaryDark).fontSize(10).font('Helvetica-Bold').text(m.title, PAGE.margin, y);
      doc.fillColor(BRAND.muted).fontSize(8).font('Helvetica')
        .text(`${m.module} · ${m.file}`, PAGE.margin, y + 12);
      y += 28;
    }
    doc.end();
  });
}

async function main() {
  await mkdir(pdfOutDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });
  await mkdir(frontendManualsDir, { recursive: true });

  const manifest = [];
  for (const manual of USER_MANUALS) {
    const file = `domo-manual-${manual.id}.pdf`;
    const buffer = await buildManualPdf(manual);
    await writeFile(join(pdfOutDir, file), buffer);
    await copyFile(join(pdfOutDir, file), join(frontendManualsDir, file));
    manifest.push({
      id: manual.id,
      title: manual.title,
      module: manual.module,
      file,
      summary: manual.summary,
      planNote: manual.planNote ?? null,
    });
    console.log(`OK ${file}`);
  }

  const indexFile = 'domo-manual-indice.pdf';
  await writeFile(join(pdfOutDir, indexFile), await buildIndexPdf(manifest));
  await copyFile(join(pdfOutDir, indexFile), join(frontendManualsDir, indexFile));

  const manifestPath = join(frontendManualsDir, 'manifest.json');
  const manifestJson = JSON.stringify(
    { generatedAt: new Date().toISOString(), meta: MANUALS_META, manuals: manifest },
    null,
    2,
  );
  await writeFile(manifestPath, manifestJson);
  await writeFile(join(pdfOutDir, 'manifest.json'), manifestJson);
  console.log(`\n${manifest.length} manuales → ${pdfOutDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
