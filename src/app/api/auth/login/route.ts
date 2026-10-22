import { isAllowedOrigin } from "@/lib/auth/origin";
import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth/handlers";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 16384) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  try {
    const result = await login({ error: "" }, await request.formData());
    return NextResponse.json(result, { status: "error" in result ? 400 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to complete your request. Please try again later." }, { status: 503 });
  }
}
