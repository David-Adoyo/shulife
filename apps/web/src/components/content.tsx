import { Icon } from "./icons";
import type { Feature } from "./shared";

export const pillars: Feature[] = [
  { t: "Automatic matching", d: "Uses admission numbers, phones and names. Payments it isn’t sure about go to a review queue.", icon: Icon.Match },
  { t: "Sibling splits", d: "One payment shared between children by your rule, confirmed to the parent.", icon: Icon.Split },
  { t: "Itemised statements", d: "Each child and fee item listed, with last term’s balance brought forward.", icon: Icon.Receipt },
  { t: "Balance on WhatsApp", d: "Parents send BALANCE or SALIO and get an answer in seconds.", icon: Icon.Chat },
  { t: "Payment plans and Ratiba", d: "Agreed instalments with reminders, and M-PESA Ratiba standing orders if the parent wants them.", icon: Icon.Calendar },
  { t: "Clearance before exams", d: "Parents are told privately a week ahead. Teachers see who is cleared, never amounts.", icon: Icon.Heart },
  { t: "Director’s dashboard", d: "Collection by grade and stream as it happens, and cash expected over the next 30 days.", icon: Icon.Chart },
  { t: "Notices with read receipts", d: "Send to one class or route in English or Kiswahili, and see who opened it.", icon: Icon.Bell },
];

export const securityPromises: Feature[] = [
  { t: "Your money never touches us", d: "Fees go straight to the school’s own M-Pesa Paybill or bank. Shulife only reads the confirmation.", icon: Icon.Bank },
  { t: "Little data about children", d: "We store what’s needed for fees and nothing else, never message learners, and keep learner data out of analytics.", icon: Icon.Shield },
  { t: "Teachers see status, not amounts", d: "Class teachers see cleared or not cleared, never what a family owes.", icon: Icon.Eye },
  { t: "Every entry audited", d: "Payments are never edited or deleted. Corrections are new, approved entries with a full trail.", icon: Icon.Lock },
];

export const faqSchools = [
  ["Do we need a new Paybill?", "No. Shulife works with your school’s existing M-Pesa Paybill or Till and your bank account. Parents keep paying exactly where they pay today."],
  ["Does it replace our school system?", "No. Shulife does fees and parents only, and works alongside Zeraki, spreadsheets or any other system through simple import and export."],
  ["What about cash and bank payments?", "Record cash, cheques and bank slips with a photo, import bank statements, and reconcile everything with a daily cash-up report."],
  ["Can teachers see fees?", "No. Class teachers only see whether a learner is cleared or not cleared for an exam or trip. They never see amounts."],
  ["What if a parent pays the wrong number?", "Shulife checks the guardian’s phone, phones it has learned, and names in the reference. Anything uncertain goes to a review queue with ranked suggestions."],
  ["Is our data safe?", "Yes. Every school’s data is isolated, staff use two-factor sign-in, every manual entry is audited, and we collect the minimum about children."],
  ["Do parents need an app?", "No. Parents use M-Pesa, SMS and WhatsApp, plus a small web page opened from a link or an SMS code. There’s no password."],
  ["How long does setup take?", "Most schools are set up in an afternoon: import learners from Excel, enter the fee structure, connect the Paybill and send the first statements. We can do it with you, or for you."],
  ["What happens to receipts if we stop using Shulife?", "Your receipts and statements remain yours. You can export your learners, families, balances and payment history at any time."],
] as const;

export const faqParents = [
  ["How do I pay school fees?", "Use M-Pesa Paybill with your school’s business number. For the account number, enter your child’s admission number, or your family code to pay for all your children at once."],
  ["I paid the wrong account number. What now?", "Don’t worry. Shulife also looks at your registered phone number and the name in the reference. If it still isn’t sure, the bursar checks it and you get your receipt once it is matched."],
  ["How do I check my balance?", "Send BALANCE (or SALIO) on WhatsApp to your school’s number from your registered phone. You can also open the link in any message from the school."],
  ["Do I need to download an app or create a password?", "No. Everything works with M-Pesa, SMS and WhatsApp. The parent portal opens from a link or a code sent by SMS."],
  ["Can I pay in instalments?", "Yes, if your school offers payment plans. Reply PLAN (or MPANGO) on WhatsApp, or contact the bursar, to agree instalments. You get a reminder before each one."],
  ["Who can see my family’s balance?", "Only you, and the school’s bursar and director. Teachers never see amounts, and other parents never see anything about your family."],
] as const;

export const faqBilling = [
  ["How is Shulife priced?", "Per enrolled learner, per term. Shulife is free until your first payment is matched automatically."],
  ["What if our subscription is overdue?", "Your account becomes read-only after a grace period, but payment matching, receipts and parent balances never stop. Parents are never affected."],
  ["Can we export our data?", "Yes, at any time: learners, families, balances, payments and receipts, as CSV or PDF."],
] as const;
