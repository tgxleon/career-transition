import { NextRequest, NextResponse } from "next/server";
// Import the parser implementation directly — pdf-parse's package entry runs
// a debug block under bundlers that breaks Next.js builds.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data with a 'file' field" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 10 MB)" },
      { status: 413 }
    );
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let text = "";
    if (name.endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".doc")) {
      return NextResponse.json(
        {
          error:
            "Legacy .doc files aren't supported — save your resume as .docx or PDF and upload that.",
        },
        { status: 415 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF, DOCX, TXT or MD file." },
        { status: 415 }
      );
    }

    // Normalise whitespace artifacts from PDF extraction
    text = text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Couldn't find any text in that file. If it's a scanned/image-only PDF, export a text-based version or paste the text manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, filename: file.name, chars: text.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json(
      { error: `Could not read the file: ${message}` },
      { status: 422 }
    );
  }
}
