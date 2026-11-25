import "server-only";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { formatDate, formatKes, gradeName } from "@shulife/core";
import type { StatementSection } from "@shulife/core";

/* PDF documents (§8.6 items 11–12, §7.8). Built-in fonts keep files small and reliable. */

const C = { navy: "#14204A", cream: "#FDF9F1", sand: "#EEE2C9", gold: "#C99A3B", ink: "#121A30", muted: "#535D74", paid: "#2E7D5B", coral: "#FF6A45" };
const s = StyleSheet.create({
  page: { backgroundColor: C.cream, fontFamily: "Helvetica", fontSize: 9, color: C.ink, paddingBottom: 40 },
  band: { backgroundColor: C.navy, color: C.cream, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  crest: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.cream, color: C.navy, fontFamily: "Times-Bold", fontSize: 18, textAlign: "center", paddingTop: 7 },
  school: { fontFamily: "Times-Bold", fontSize: 15 },
  small: { fontSize: 8, color: C.muted },
  body: { padding: 20 },
  label: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 1 },
  big: { fontFamily: "Times-Bold", fontSize: 30, color: C.navy, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: `0.5pt solid ${C.sand}` },
  th: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: `1pt solid ${C.navy}`, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 14, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: C.muted },
  h2: { fontFamily: "Times-Bold", fontSize: 13, color: C.navy, marginTop: 14, marginBottom: 4 },
  pill: { fontFamily: "Helvetica-Bold", fontSize: 8 },
});

// Built-in PDF fonts lack U+2212, so use an ASCII hyphen for negatives.
const k = (cents: number) => formatKes(Math.round(cents / 100) * 100).replace("−", "-");

function Header({ school, campus, title }: { school: string; campus: string; title: string }) {
  return (
    <View style={s.band}>
      <Text style={s.crest}>{school[0]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.school}>{school}</Text>
        <Text style={{ fontSize: 8, color: "#E3E8F4" }}>{campus.replace(`${school}, `, "")} campus</Text>
      </View>
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#EBCB87" }}>{title}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>
        Powered by shul<Text style={{ color: C.coral }}>i</Text>fe
      </Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

export async function receiptPdf(r: {
  school: string;
  campus: string;
  number: string;
  paidAt: string;
  amount: number;
  channel: string;
  payer: string;
  family: string;
  split: { name: string; amount: number }[];
  credit: number;
  balanceAfter: number;
  verifyUrl: string;
  reversed?: boolean;
}) {
  const qr = await QRCode.toDataURL(r.verifyUrl, { margin: 0, width: 220, color: { dark: C.navy, light: "#FFFFFF" } });
  return renderToBuffer(
    <Document title={`Receipt ${r.number}`} author={r.school}>
      <Page size="A5" style={s.page}>
        <Header school={r.school} campus={r.campus} title="RECEIPT" />
        <View style={s.body}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={s.label}>Amount received</Text>
              <Text style={s.big}>{k(r.amount)}</Text>
              <Text style={s.small}>
                {formatDate(new Date(r.paidAt))} · {r.channel}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.label}>Receipt no.</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 3 }}>{r.number}</Text>
              <Text style={{ ...s.pill, color: r.reversed ? "#8E3B5E" : C.paid, marginTop: 6 }}>{r.reversed ? "REVERSED" : "VERIFIED"}</Text>
            </View>
          </View>
          <Text style={{ marginTop: 12 }}>
            Received from {r.payer} for {r.family}.
          </Text>
          <Text style={s.h2}>Allocation</Text>
          <View style={s.th}>
            <Text>Learner</Text>
            <Text>Amount</Text>
          </View>
          {r.split.map((x) => (
            <View key={x.name} style={s.row}>
              <Text>{x.name}</Text>
              <Text>{k(x.amount)}</Text>
            </View>
          ))}
          {r.credit > 0 && (
            <View style={s.row}>
              <Text>Credit to next invoice</Text>
              <Text>{k(r.credit)}</Text>
            </View>
          )}
          <View style={{ ...s.row, borderBottom: "none", marginTop: 4 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Family balance after this payment</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{k(Math.max(0, r.balanceAfter))}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 }}>
            <Image src={qr} style={{ width: 70, height: 70 }} />
            <Text style={{ ...s.small, flex: 1 }}>Scan to check this receipt is genuine. The check page shows only the school, receipt number, amount, date and status.</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>,
  );
}

export async function statementPdf(st: {
  school: string;
  campus: string;
  family: string;
  familyCode: string;
  paybill: string;
  term: string;
  children: { name: string; admission: string; grade: string; sections: StatementSection[]; balance: number }[];
  familyBalance: number;
}) {
  return renderToBuffer(
    <Document title={`Fee statement — ${st.family}`} author={st.school}>
      <Page size="A4" style={s.page}>
        <Header school={st.school} campus={st.campus} title="FEE STATEMENT" />
        <View style={s.body}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={s.label}>Family</Text>
              <Text style={{ fontFamily: "Times-Bold", fontSize: 16, color: C.navy }}>{st.family}</Text>
              <Text style={s.small}>
                {st.familyCode} · {st.term}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.label}>Family balance</Text>
              <Text style={{ ...s.big, fontSize: 24 }}>{k(Math.max(0, st.familyBalance))}</Text>
            </View>
          </View>
          <Text style={s.h2}>Summary</Text>
          {st.children.map((c) => (
            <View key={c.admission} style={s.row}>
              <Text>
                {c.name} · {c.grade} · ADM {c.admission}
              </Text>
              <Text>{k(c.balance)}</Text>
            </View>
          ))}
          {st.children.map((c) => (
            <View key={c.admission} wrap>
              <Text style={s.h2}>{c.name}</Text>
              {c.sections.map((sec) => (
                <View key={sec.termKey} style={{ marginBottom: 6 }}>
                  <Text style={{ ...s.label, color: C.gold, marginTop: 4 }}>{sec.termKey.replace(/(\d+)-(\d)/, "Term $2 $1")}</Text>
                  {sec.broughtForward !== 0 && (
                    <View style={s.row}>
                      <Text>Balance brought forward</Text>
                      <Text>{k(sec.broughtForward)}</Text>
                    </View>
                  )}
                  {sec.lines.map((l) => (
                    <View key={l.id} style={s.row}>
                      <Text style={{ flex: 1 }}>
                        {formatDate(new Date(l.at))} · {l.description}
                        {l.ref ? ` · ${l.ref}` : ""}
                      </Text>
                      <Text style={{ color: l.amount < 0 ? C.paid : C.ink }}>{l.amount < 0 ? `- ${k(-l.amount)}` : k(l.amount)}</Text>
                    </View>
                  ))}
                  <View style={{ ...s.row, borderBottom: "none" }}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>Closing balance</Text>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{k(sec.closing)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
          <View style={{ marginTop: 14, padding: 10, backgroundColor: "#F8F0E0", borderRadius: 6 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: C.navy }}>How to pay</Text>
            <Text style={{ marginTop: 3 }}>
              M-Pesa Paybill {st.paybill}. Account: your child’s admission number, or {st.familyCode} to pay for all your children. Balance any time: send BALANCE or SALIO on WhatsApp.
            </Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>,
  );
}

/** Clearance list for the head and class teachers (§7.8): names and status only — never amounts. */
export async function clearancePdf(c: { school: string; campus: string; className: string; event: string; date: string; rows: { name: string; status: string }[] }) {
  const label: Record<string, string> = { cleared: "Cleared", on_plan: "On plan", not_cleared: "Not cleared", overridden: "Override" };
  return renderToBuffer(
    <Document title={`Clearance — ${c.className}`} author={c.school}>
      <Page size="A4" style={s.page}>
        <Header school={c.school} campus={c.campus} title="CLEARANCE LIST" />
        <View style={s.body}>
          <Text style={{ fontFamily: "Times-Bold", fontSize: 16, color: C.navy }}>{c.className}</Text>
          <Text style={s.small}>
            {c.event} · {formatDate(new Date(c.date))}
          </Text>
          <View style={{ ...s.th, marginTop: 12 }}>
            <Text>Learner</Text>
            <Text>Status</Text>
          </View>
          {c.rows.map((r) => (
            <View key={r.name} style={s.row}>
              <Text>{r.name}</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", color: r.status === "not_cleared" ? "#8E3B5E" : r.status === "cleared" ? C.paid : C.navy }}>{label[r.status]}</Text>
            </View>
          ))}
          <Text style={{ ...s.small, marginTop: 14 }}>Confidential. Shows status only. Please speak privately with the bursar about any learner who is not cleared.</Text>
        </View>
        <Footer />
      </Page>
    </Document>,
  );
}

export { gradeName };
