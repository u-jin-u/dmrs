/**
 * Credentials API Routes
 * POST /api/credentials - Create/update credentials
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";

// Simple encryption for demo - in production, use proper encryption
function encrypt(data: string): string {
  const key = process.env.ENCRYPTION_KEY || "default-dev-key-32chars!!";
  // In production, use proper AES encryption
  return Buffer.from(JSON.stringify({ data, key: key.slice(0, 8) })).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, platform, credentials } = body;

    if (!clientId || !platform || !credentials) {
      return NextResponse.json(
        { error: "clientId, platform, and credentials are required" },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptedData = encrypt(JSON.stringify(credentials));

    // Upsert credential
    const credential = await prisma.credential.upsert({
      where: { clientId },
      update: {
        platform,
        encryptedData,
        lastUsed: null,
      },
      create: {
        clientId,
        platform,
        encryptedData,
      },
    });

    return NextResponse.json({
      data: {
        id: credential.id,
        platform: credential.platform,
        createdAt: credential.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving credentials:", error);
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}
