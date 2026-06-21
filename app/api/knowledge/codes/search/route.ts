import { NextResponse } from "next/server";
import { searchCodes } from "@/lib/ai/knowledge/code-database";
import { searchTerms } from "@/lib/ai/knowledge/term-dictionary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "all";

  if (!q.trim()) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const codeResults = type === "terms" ? [] : searchCodes(q);
  const termResults = type === "codes" ? [] : searchTerms(q);

  return NextResponse.json({
    query: q,
    codes: codeResults.map(({ code, requirement }) => ({
      codeId: code.id,
      codeName: code.name,
      codeNameZh: code.nameZh,
      standard: code.code,
      category: code.category,
      section: requirement.section,
      title: requirement.title,
      titleZh: requirement.titleZh,
      description: requirement.description,
      descriptionZh: requirement.descriptionZh,
    })),
    terms: termResults.map((t) => ({
      id: t.id,
      en: t.en,
      zh: t.zh,
      category: t.category,
    })),
  });
}
