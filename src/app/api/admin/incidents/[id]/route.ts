import { NextRequest } from "next/server";
import { saveIncident } from "@/lib/incidents/api";
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return saveIncident(request, (await context.params).id);
}
