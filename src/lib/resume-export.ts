"use client";

// Converts the generated Markdown (resume / cover letter) into downloadable
// DOCX and PDF files. The "Tailoring notes" section is stripped automatically:
// it's reviewer-facing rationale that should never reach a recruiter.

interface Block {
  type: "h1" | "h2" | "h3" | "bullet" | "p";
  text: string;
}

interface Run {
  text: string;
  bold: boolean;
}

function boldRuns(text: string): Run[] {
  const runs: Run[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push({ text: part.slice(2, -2), bold: true });
    } else {
      // strip stray single-asterisk emphasis markers
      runs.push({ text: part.replace(/\*([^*]+)\*/g, "$1"), bold: false });
    }
  }
  return runs.length ? runs : [{ text, bold: false }];
}

function plain(text: string): string {
  return boldRuns(text)
    .map((r) => r.text)
    .join("");
}

export function parseResumeMarkdown(md: string): Block[] {
  // Cut everything from "Tailoring notes" onward
  const cut = md.search(/^#{1,3}\s*Tailoring notes/im);
  let body = cut >= 0 ? md.slice(0, cut) : md;
  body = body.replace(/^\s*---\s*$/gm, "");

  const blocks: Block[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("### ")) blocks.push({ type: "h3", text: line.slice(4) });
    else if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3) });
    else if (line.startsWith("# ")) blocks.push({ type: "h1", text: line.slice(2) });
    else if (/^[-*•]\s+/.test(line))
      blocks.push({ type: "bullet", text: line.replace(/^[-*•]\s+/, "") });
    else blocks.push({ type: "p", text: line });
  }
  return blocks;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function safeFilename(base: string): string {
  return base
    .replace(/[^a-z0-9\- ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export async function downloadDocx(md: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
    "docx"
  );
  const blocks = parseResumeMarkdown(md);

  const children = blocks.map((b) => {
    const runs = boldRuns(b.text).map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold || b.type === "h1" || b.type === "h2" || b.type === "h3",
        })
    );
    switch (b.type) {
      case "h1":
        return new Paragraph({
          children: runs,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 120 },
        });
      case "h2":
        return new Paragraph({
          children: runs,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        });
      case "h3":
        return new Paragraph({
          children: runs,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 140, after: 60 },
        });
      case "bullet":
        return new Paragraph({
          children: runs,
          bullet: { level: 0 },
          spacing: { after: 40 },
        });
      default:
        return new Paragraph({ children: runs, spacing: { after: 80 } });
    }
  });

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 21 } }, // 10.5pt
        heading1: { run: { font: "Calibri", size: 32, bold: true, color: "000000" } },
        heading2: { run: { font: "Calibri", size: 24, bold: true, color: "000000" } },
        heading3: { run: { font: "Calibri", size: 22, bold: true, color: "000000" } },
      },
    },
    sections: [{ children }],
  });

  saveBlob(await Packer.toBlob(doc), `${filename}.docx`);
}

export async function downloadPdf(md: string, filename: string) {
  const { jsPDF } = await import("jspdf");
  const blocks = parseResumeMarkdown(md);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 54;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = pageWidth - margin * 2;
  let y = margin;

  const ensureRoom = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  for (const b of blocks) {
    const text = plain(b.text);
    let size = 10.5;
    let style: "normal" | "bold" = "normal";
    let spaceBefore = 2;
    let spaceAfter = 4;
    let indent = 0;
    let prefix = "";

    if (b.type === "h1") {
      size = 17;
      style = "bold";
      spaceBefore = 0;
      spaceAfter = 8;
    } else if (b.type === "h2") {
      size = 12.5;
      style = "bold";
      spaceBefore = 12;
      spaceAfter = 5;
    } else if (b.type === "h3") {
      size = 11;
      style = "bold";
      spaceBefore = 8;
      spaceAfter = 3;
    } else if (b.type === "bullet") {
      indent = 14;
      prefix = "•  ";
    }

    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(prefix + text, width - indent);
    const lineHeight = size * 1.35;

    y += spaceBefore;
    for (let i = 0; i < lines.length; i++) {
      ensureRoom(lineHeight);
      // hanging indent for wrapped bullet lines
      const x =
        margin + indent + (b.type === "bullet" && i > 0 ? doc.getTextWidth("•  ") : 0);
      doc.text(lines[i], x, y + lineHeight * 0.8);
      y += lineHeight;
    }
    y += spaceAfter;

    if (b.type === "h2") {
      ensureRoom(4);
      doc.setDrawColor(120);
      doc.setLineWidth(0.6);
      doc.line(margin, y - 2, margin + width, y - 2);
      y += 4;
    }
  }

  doc.save(`${filename}.pdf`);
}
