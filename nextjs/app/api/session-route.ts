// app/api/session/route.ts  ·  SIWE login -> httpOnly JWT cookie.
// Verifies a Sign-In-With-Ethereum message against Redbelly Testnet (chain 153),
// then issues a short-lived JWT into a `session-token` cookie that middleware checks.
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { parseSiweMessage } from "viem/siwe";
import { SignJWT } from "jose";
import { redbellyTestnet } from "../../../lib/redbelly-chain"; // the defineChain from react/redbelly-chain.js

const client = createPublicClient({ chain: redbellyTestnet, transport: http() });
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    const ok = await client.verifySiweMessage({ message, signature });
    if (!ok) {
      throw new Error("SIWE message verification failed");
    }
    const { address } = parseSiweMessage(message);

    const token = await new SignJWT({ sub: address })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    const res = NextResponse.json({ ok: true, address });
    res.cookies.set("session-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized", detail: err.message }, { status: 401 });
  }
}
