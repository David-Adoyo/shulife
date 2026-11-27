import type { Metadata } from "next";
import { ParentsHelp } from "@/components/parents-help";
import { CtaBand } from "@/components/shared";

export const metadata: Metadata = {
  title: "For parents · Msaada kwa wazazi",
  description: "How to pay school fees with M-Pesa, check your balance on WhatsApp (BALANCE / SALIO), read your statement and agree a payment plan. In English and Kiswahili.",
};

export default function ForParentsPage() {
  return (
    <>
      <ParentsHelp />
      <CtaBand
        title={
          <>
            Is your school on Shulife yet?
          </>
        }
        body="If not, mention it to the bursar or director. You’d get a receipt for every payment and your balance on WhatsApp, with nothing to download."
      />
    </>
  );
}
