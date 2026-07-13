import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ACCENT: [number, number, number] = [42, 122, 95];

export interface ReportContext {
  doc: jsPDF;
  y: number;
  language: "en" | "tr";
}

/** Starts a new report with the EVALIS header band, title, and generation timestamp. */
export function createReport(title: string, subtitle: string, language: "en" | "tr"): ReportContext {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFillColor(10, 15, 24);
  doc.rect(0, 0, PAGE_WIDTH, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("EVALIS", MARGIN, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(210, 210, 210);
  doc.text(title, MARGIN, 21);
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 160);
  const generatedLabel = language === "en" ? "Generated" : "Oluşturulma";
  doc.text(`${generatedLabel}: ${new Date().toLocaleString(language === "en" ? "en-US" : "tr-TR")}`, MARGIN, 27);

  const ctx: ReportContext = { doc, y: 40, language };

  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const lines = doc.splitTextToSize(subtitle, CONTENT_WIDTH);
    doc.text(lines, MARGIN, ctx.y);
    ctx.y += lines.length * 4.2 + 4;
  }

  return ctx;
}

export function ensureSpace(ctx: ReportContext, needed: number) {
  if (ctx.y + needed > PAGE_HEIGHT - MARGIN) {
    ctx.doc.addPage();
    ctx.y = MARGIN;
  }
}

export function addSectionTitle(ctx: ReportContext, text: string) {
  ensureSpace(ctx, 14);
  ctx.doc.setDrawColor(...ACCENT);
  ctx.doc.setLineWidth(0.4);
  ctx.doc.line(MARGIN, ctx.y, PAGE_WIDTH - MARGIN, ctx.y);
  ctx.y += 6;
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(20, 20, 20);
  ctx.doc.text(text.toUpperCase(), MARGIN, ctx.y);
  ctx.y += 7;
}

/** A row of small stat boxes (label + value), wrapping to new rows as needed. */
export function addStatGrid(ctx: ReportContext, stats: { label: string; value: string }[], columns = 3) {
  const gap = 4;
  const boxWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const boxHeight = 18;

  stats.forEach((stat, i) => {
    const col = i % columns;
    if (col === 0) ensureSpace(ctx, boxHeight + gap);
    const x = MARGIN + col * (boxWidth + gap);
    const y = ctx.y;

    ctx.doc.setDrawColor(222, 226, 232);
    ctx.doc.setFillColor(248, 250, 252);
    ctx.doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "FD");
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(6.5);
    ctx.doc.setTextColor(120, 120, 120);
    const labelLines = ctx.doc.splitTextToSize(stat.label.toUpperCase(), boxWidth - 6);
    ctx.doc.text(labelLines.slice(0, 2), x + 3, y + 5.5);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(11.5);
    ctx.doc.setTextColor(20, 20, 20);
    ctx.doc.text(stat.value, x + 3, y + 14.5);

    if (col === columns - 1 || i === stats.length - 1) {
      ctx.y += boxHeight + gap;
    }
  });
}

export function addTable(ctx: ReportContext, head: string[], body: (string | number)[][]) {
  autoTable(ctx.doc, {
    startY: ctx.y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 40] },
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  // @ts-expect-error - lastAutoTable is attached by the plugin at runtime
  ctx.y = ctx.doc.lastAutoTable.finalY + 8;
}

export function addKeyValueRow(ctx: ReportContext, pairs: { label: string; value: string }[]) {
  ensureSpace(ctx, 7);
  ctx.doc.setFontSize(8.5);
  const colWidth = CONTENT_WIDTH / pairs.length;
  pairs.forEach((pair, i) => {
    const x = MARGIN + i * colWidth;
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setTextColor(130, 130, 130);
    ctx.doc.text(pair.label.toUpperCase(), x, ctx.y);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setTextColor(30, 30, 30);
    ctx.doc.text(pair.value, x, ctx.y + 5);
  });
  ctx.y += 12;
}

export function addParagraph(ctx: ReportContext, text: string) {
  ensureSpace(ctx, 10);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(8.5);
  ctx.doc.setTextColor(70, 70, 70);
  const lines = ctx.doc.splitTextToSize(text, CONTENT_WIDTH);
  ctx.doc.text(lines, MARGIN, ctx.y);
  ctx.y += lines.length * 4.2 + 4;
}

export function addEmptyNote(ctx: ReportContext, text: string) {
  ensureSpace(ctx, 8);
  ctx.doc.setFont("helvetica", "italic");
  ctx.doc.setFontSize(8);
  ctx.doc.setTextColor(150, 150, 150);
  ctx.doc.text(text, MARGIN, ctx.y);
  ctx.y += 8;
}

/** Stamps page numbers on every page and triggers the download. */
export function finalizeReport(ctx: ReportContext, filename: string) {
  const pageCount = ctx.doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    ctx.doc.setPage(i);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(7);
    ctx.doc.setTextColor(160, 160, 160);
    ctx.doc.text(
      `EVALIS  ·  ${i} / ${pageCount}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 8,
      { align: "right" }
    );
  }
  ctx.doc.save(filename);
}
