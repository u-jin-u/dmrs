/**
 * Credentials API Routes
 * POST /api/credentials - Create/update credentials
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { encrypt, isEncryptionConfigured } from "@/lib/utils/crypto";

export async function POST(request: NextRequest) {
  try {
    // Check encryption is configured
    if (!isEncryptionConfigured()) {
      console.error("ENCRYPTION_KEY not configured - cannot store credentials securely");
      return NextResponse.json(
        { error: "Server configuration error: encryption not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { clientId, platform, credentials } = body;

    if (!clientId || !platform || !credentials) {
      return NextResponse.json(
        { error: "clientId, platform, and credentials are required" },
        { status: 400 }
      );
    }

    // Encrypt credentials using AES-256-GCM
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
