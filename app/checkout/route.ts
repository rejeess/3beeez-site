import { NextRequest, NextResponse } from "next/server";
import { buildProductionCheckoutUrl, getPurchaseMode } from "@/lib/purchase";

export async function GET(request: NextRequest) {
  const planId = request.nextUrl.searchParams.get("plan") || "starter";
  const companySlug =
    request.nextUrl.searchParams.get("companySlug") || "acme-support";

  if (getPurchaseMode() === "production") {
    const productionUrl = buildProductionCheckoutUrl({
      companySlug,
      planId,
    });

    if (productionUrl) {
      return NextResponse.redirect(productionUrl);
    }
  }

  const mockUrl = new URL(`/purchase-demo/${companySlug}`, request.nextUrl.origin);
  mockUrl.searchParams.set("plan", planId);
  mockUrl.searchParams.set("mode", "mock");

  return NextResponse.redirect(mockUrl);
}
