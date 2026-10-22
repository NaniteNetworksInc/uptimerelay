import { NextRequest } from "next/server";
import { saveIncident } from "@/lib/incidents/api";
export async function POST(request: NextRequest) { return saveIncident(request); }
