import { NextRequest, NextResponse } from "next/server";
import { analyzeKeyword } from "@/lib/analyze-keyword";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";

  if (!keyword) {
    return NextResponse.json(
      { error: "keyword query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeKeyword(keyword);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected analysis error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
