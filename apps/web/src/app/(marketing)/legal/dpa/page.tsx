import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Data processing agreement", robots: { index: false } };

export default function DpaPage() {
  return (
    <LegalPage
      current="/legal/dpa/"
      title="Data processing agreement"
      intro="The agreement under which Shulife processes personal data on behalf of each school."
      covers={[
        "The purposes and limits of processing on the school’s instructions",
        "Security measures: isolation between schools, encryption, access controls and audit logs",
        "Sub-processors used to send messages, host data and take payments",
        "Breach notification, data subject requests and assistance to the school",
        "Retention, return and deletion of data when the agreement ends",
      ]}
    />
  );
}
