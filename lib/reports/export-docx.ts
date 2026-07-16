import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
} from "docx";
import { downloadBlob, sanitizeReportFilename } from "@/lib/reports/report-filename";

const COPPER = "B87333";
const MUTED = "666666";
const LIGHT_BORDER = "DDDDDD";

export function parseInlineTextRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], bold: true }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], italics: true }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], font: "Consolas" }));
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

function paragraphFromText(text: string, options?: Omit<IParagraphOptions, "children">): Paragraph {
  return new Paragraph({
    ...options,
    children: parseInlineTextRuns(text),
  });
}

function tableFromMarkdownRows(rows: string[]): Table | null {
  const parsedRows = rows
    .map((row) =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0)
    )
    .filter((cells) => !cells.every((cell) => /^[-:]+$/.test(cell)));

  if (parsedRows.length === 0) return null;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: parsedRows.map((cells, rowIndex) =>
      new TableRow({
        children: cells.map(
          (cell) =>
            new TableCell({
              shading:
                rowIndex === 0
                  ? { fill: "F5F5F5" }
                  : undefined,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: LIGHT_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: LIGHT_BORDER },
                left: { style: BorderStyle.SINGLE, size: 1, color: LIGHT_BORDER },
                right: { style: BorderStyle.SINGLE, size: 1, color: LIGHT_BORDER },
              },
              children: [
                paragraphFromText(cell, {
                  spacing: { before: 80, after: 80 },
                }),
              ],
            })
        ),
      })
    ),
  });
}

export function markdownToDocxBlocks(markdown: string): Array<Paragraph | Table> {
  const blocks: Array<Paragraph | Table> = [];
  const lines = markdown.split("\n");
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (!inTable) return;
    const table = tableFromMarkdownRows(tableRows);
    if (table) blocks.push(table);
    inTable = false;
    tableRows = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("|")) {
      inTable = true;
      tableRows.push(trimmed);
      continue;
    }
    if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(
        paragraphFromText(trimmed.slice(4), {
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(
        paragraphFromText(trimmed.slice(3), {
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 320, after: 160 },
        })
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(
        paragraphFromText(trimmed.slice(2), {
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 180 },
        })
      );
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push(
        paragraphFromText(trimmed.slice(2), {
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
      continue;
    }
    if (trimmed === "---") {
      blocks.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: LIGHT_BORDER },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      continue;
    }
    if (trimmed === "") {
      blocks.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    blocks.push(
      paragraphFromText(trimmed, {
        spacing: { after: 120 },
      })
    );
  }

  flushTable();
  return blocks;
}

function buildReportHeader(title: string, projectName?: string): Paragraph[] {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Recrete · 砼憶",
          size: 18,
          color: "888888",
          allCaps: true,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 40, color: "1A1A1A" })],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: COPPER },
      },
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: projectName ? `${projectName} · ${date}` : date,
          size: 20,
          color: MUTED,
        }),
      ],
      spacing: { after: 360 },
    }),
  ];
}

function buildReportFooter(): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: "Generated by Recrete — Reimagine. Renew. Recreate.",
        size: 16,
        color: "999999",
        italics: true,
      }),
    ],
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: LIGHT_BORDER },
    },
    spacing: { before: 480, after: 120 },
    alignment: AlignmentType.LEFT,
  });
}

export async function exportReportToDocx(
  title: string,
  markdown: string,
  projectName?: string
): Promise<void> {
  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          ...buildReportHeader(title, projectName),
          ...markdownToDocxBlocks(markdown),
          buildReportFooter(),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `${sanitizeReportFilename(title)}.docx`);
}
