export type PurchasePlan = {
  id: string;
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
};

export const purchasePlans: PurchasePlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    priceLabel: "$70/mo",
    description: "Simple monthly billing for one website chatbot.",
    features: [
      "1 website chatbot",
      "Document and website knowledge upload",
      "Client admin portal access",
      "Embedded widget script",
    ],
  },
  {
    id: "annual",
    name: "Annual",
    priceLabel: "$800 one-time",
    description: "One annual purchase for a full year of chatbot service.",
    features: [
      "1 website chatbot",
      "Knowledge upload and history import",
      "Client admin portal access",
      "Dedicated install script",
    ],
  },
];

export function getPurchaseMode() {
  return process.env.PURCHASE_MODE === "production" ? "production" : "mock";
}

export function buildProductionCheckoutUrl(input: {
  companySlug: string;
  planId: string;
}) {
  const baseUrl = process.env.PURCHASE_PROVIDER_URL;

  if (!baseUrl) {
    return null;
  }

  const url = new URL(baseUrl);
  url.searchParams.set("companySlug", input.companySlug);
  url.searchParams.set("plan", input.planId);

  return url.toString();
}
