import { NextResponse } from "next/server";
import {
  authCookieName,
  authEnabled,
  expectedSessionToken,
  verifyPassword
} from "@/lib/auth";

export const runtime = "nodejs";

type LoginRequest = {
  password?: string;
};

export async function POST(request: Request) {
  if (!authEnabled()) {
    return NextResponse.json({ error: "APP_PASSWORD is not set" }, { status: 500 });
  }

  const body = (await request.json()) as LoginRequest;
  const ok = await verifyPassword(body.password ?? "");

  if (!ok) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: authCookieName(),
    value: await expectedSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
