import { NextResponse } from "next/server";
import { skillPresets } from "@/lib/skills";

export function GET() {
  return NextResponse.json({ presets: skillPresets });
}
