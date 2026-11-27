import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of service", robots: { index: false } };

export default function TermsPage() {
  return (
    <LegalPage
      current="/legal/terms/"
      title="Terms of service"
      intro="The agreement between Shulife and the schools that use it."
      covers={[
        "Who can use Shulife and how accounts are set up",
        "Subscription, billing per learner per term and the free period",
        "What happens if a subscription is overdue, and why payment matching, receipts and parent balances never stop",
        "Your school’s data, exports and what happens if you leave",
        "Acceptable use, support and service availability",
      ]}
    />
  );
}
