/**
 * Credential Detail API Routes
 * DELETE /api/credentials/:clientId - Delete credentials
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;

    const credential = await prisma.credential.findUnique({
      where: { clientId },
    });

    if (!credential) {
      return NextResponse.json(
        { error: "Credentials not found" },
        { status: 404 }
      );
    }

    await prisma.credential.delete({
      where: { clientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting credentials:", error);
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 }
    );
  }
}
