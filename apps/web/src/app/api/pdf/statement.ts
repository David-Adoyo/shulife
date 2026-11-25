import { buildStatement, gradeName } from "@shulife/core";
import { currentTerm, familyBalance, termPosition, type School } from "@shulife/demo";
import { statementPdf } from "@/lib/pdf";

export async function familyStatement(s: School, familyId: string) {
  const fam = s.families.find((f) => f.id === familyId);
  if (!fam) return null;
  const campus = s.campuses.find((c) => c.id === fam.campusId)!;
  const kids = s.learners.filter((l) => l.familyId === familyId);
  const pdf = await statementPdf({
    school: s.org.name,
    campus: campus.name,
    family: fam.displayName,
    familyCode: fam.code,
    paybill: campus.paybill,
    term: currentTerm(s).name,
    familyBalance: familyBalance(s, familyId),
    children: kids.map((l) => ({ name: `${l.firstName} ${l.lastName}`, admission: l.admissionNumber, grade: `${gradeName(l.gradeCode)} ${s.streams.find((x) => x.id === l.streamId)?.name ?? ""}`, sections: buildStatement(s.ledger, l.id).sections, balance: termPosition(s, l.id).balance })),
  });
  return new Response(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="statement-${fam.code}.pdf"` } });
}
