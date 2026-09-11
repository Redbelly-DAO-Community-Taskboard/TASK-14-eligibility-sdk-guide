// middleware.ts  ·  Guards /api/sdk by verifying the session JWT cookie.
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
  }
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
  }
}

// Only protect the SDK proxy route.
export const config = { matcher: ["/api/sdk"] };
