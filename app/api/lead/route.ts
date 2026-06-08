import { NextRequest, NextResponse } from "next/server";
import {
  getCompanyByBotId,
  getCompanyBySlug,
  isDomainAllowed,
  upsertConversation,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      conversationId?: string;
      companySlug?: string;
      botId?: string;
      visitorId?: string;
      sourceUrl?: string;
      lead?: {
        name?: string;
        email?: string;
        phone?: string;
      };
    };

    const company =
      (body.botId ? getCompanyByBotId(body.botId) : undefined) ||
      getCompanyBySlug(body.companySlug || "3beeez");

    if (!company || company.status !== "active") {
      return NextResponse.json({ error: "Unknown or inactive company." }, { status: 400 });
    }

    if (!isDomainAllowed(company.allowedDomain, body.sourceUrl || "")) {
      return NextResponse.json({ error: "Domain not allowed." }, { status: 403 });
    }

    await upsertConversation({
      publicId: body.conversationId,
      companyId: company.id,
      visitorId: body.visitorId,
      sourceUrl: body.sourceUrl,
      lead: body.lead,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[3Beeez] /api/lead error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
  }
}
