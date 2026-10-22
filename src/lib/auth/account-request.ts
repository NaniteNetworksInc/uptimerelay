import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { currentStaff, authDb } from "./server";
import { isAllowedOrigin } from "./origin";
import { allowLogin } from "./handlers";
export async function accountRequest(request: NextRequest, sensitive = false) {
  if (!isAllowedOrigin(request)) return { error: NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 }) };
  const staff = await currentStaff();
  if (!staff) return { error: NextResponse.json({ error: "Sign in to manage your account." }, { status: 401 }) };
  if (sensitive && !await allowLogin(`account:${staff.id}`)) return { error: NextResponse.json({ error: "Too many security requests. Try again in 15 minutes." }, { status: 429 }) };
  return { staff, db: await authDb() };
}
