import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy notice", robots: { index: false } };

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/legal/privacy/"
      title="Privacy notice"
      intro="How personal data is handled for schools, parents and guardians under the Kenya Data Protection Act, 2019."
      covers={[
        "The roles: each school is the data controller, Shulife is the data processor",
        "What we collect about learners and guardians, and what we never collect",
        "How children’s data is protected, with guardian consent and in the child’s best interests",
        "WhatsApp, SMS and email messages, opt-ins and how to stop them",
        "How long records are kept, and how to ask for access or correction through your school",
        "Our registration with the Office of the Data Protection Commissioner",
      ]}
    />
  );
}
