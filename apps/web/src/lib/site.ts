/**
 * Site-wide settings. Values that are not yet confirmed stay `null` and map to a
 * {{PLACEHOLDER}} in the masterplan register (§19). The UI hides anything that is
 * still null instead of showing an invented value.
 */
export const site = {
  name: "Shulife",
  tagline: "Every fee. Every parent. On time.",
  description:
    "Shulife matches every M-Pesa payment, splits it between siblings, receipts parents instantly and keeps them informed — school fees collection and parent communication for Kenyan private schools.",
  domain: null as string | null, // {{DOMAIN}}
  supportPhone: null as string | null, // {{SUPPORT_PHONE}}
  supportEmail: null as string | null, // {{SUPPORT_EMAIL}}
  supportWhatsapp: null as string | null, // {{SUPPORT_WHATSAPP}}
  odpcRegNo: null as string | null, // {{ODPC_REG_NO}}
  pricePerLearnerTerm: null as number | null, // {{PRICE_PER_LEARNER_TERM}} in KES
  bookingUrl: null as string | null, // {{BOOKING_URL}}
};

export function formatKes(amount: number) {
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}
