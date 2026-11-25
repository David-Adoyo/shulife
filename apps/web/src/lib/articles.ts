import type { PhotoName } from "@/components/shared";

export type Article = {
  slug: string;
  title: string;
  audience: "Bursars" | "Directors" | "Parents";
  summary: string;
  photo: PhotoName;
  alt: string;
  readMins: number;
  sections: { h: string; p?: string[]; list?: string[] }[];
};

/* Each guide answers one bursar or director question (§9.4). No statistics,
 * customer names or claims that need a source. */
export const articles: Article[] = [
  {
    slug: "reconcile-mpesa-school-fees",
    title: "How to reconcile M-Pesa school fee payments without losing a week",
    audience: "Bursars",
    summary: "A practical routine for matching Paybill payments to learners — and what to do with the ones that don’t match.",
    photo: "bursar",
    alt: "A bursar working at her laptop",
    readMins: 6,
    sections: [
      {
        h: "Why start-of-term reconciliation takes so long",
        p: [
          "When parents pay school fees through M-Pesa Paybill, every payment carries an account reference typed by the parent. Some type the admission number exactly. Many type it with “ADM” in front, add the grade, use a child’s name, or leave it blank. Others pay from a grandparent’s or an employer’s phone.",
          "Matching those payments to the right learner by hand — especially in the first weeks of term — is slow, and every mistake becomes a disputed balance later.",
        ],
      },
      {
        h: "A simple daily routine",
        list: [
          "Export the day’s Paybill statement at the same time every day.",
          "Clean up references first: remove “ADM”, “NO”, spaces, dashes and leading zeros, then look for exact admission numbers.",
          "Match the rest by the payer’s phone number against the guardian phone numbers you hold.",
          "Look for names and grades in the reference (“KAMAU GRADE 4”) and check them against the class list.",
          "Park anything still uncertain in a separate list — never guess — and call the parent the same day.",
          "Send a receipt for every matched payment before you close for the day.",
        ],
      },
      {
        h: "Handle families, not just learners",
        p: [
          "One payment often covers several children. Agree a written rule for sharing family payments — for example, oldest balance first, or in proportion to each child’s balance — and apply it every time. Tell parents how their payment was shared so they can ask for a change early, not at the end of term.",
        ],
      },
      {
        h: "Prevent the problem next term",
        list: [
          "Print clear payment instructions — Paybill number and “account number = admission number” — on the fee statement and the school notice board.",
          "Offer a family code so parents with several children can pay once.",
          "Keep guardian phone numbers up to date at admission and at the start of every term.",
        ],
      },
      {
        h: "How Shulife helps",
        p: [
          "Shulife does this routine automatically as each payment arrives: it cleans the reference, checks admission numbers, family codes, guardian phones and phones it has learned, splits family payments by your rule and sends the receipt. Only the payments it isn’t sure about reach your review queue — with the three most likely families and the reasons.",
        ],
      },
    ],
  },
  {
    slug: "school-fee-statement-template",
    title: "What a good school fee statement should include",
    audience: "Bursars",
    summary: "The parts of a clear, itemised fee statement that parents trust — and that cut down on “what is this charge?” questions.",
    photo: "classroom",
    alt: "A teacher with happy pupils in a classroom",
    readMins: 5,
    sections: [
      {
        h: "Why statements matter",
        p: [
          "A fee statement is often the only document a parent sees that explains what they owe and why. When it is clear and itemised, parents pay with confidence. When it isn’t, the front office fields the questions.",
        ],
      },
      {
        h: "The essentials",
        list: [
          "The school’s name and crest, the term and the date the statement was produced.",
          "The learner’s name, admission number, grade and stream.",
          "Balance brought forward from last term, on its own line.",
          "Each fee item for this term — tuition, boarding, lunch, transport and so on — with optional items clearly marked.",
          "Any discounts, bursaries or sponsor contributions, shown as separate lines.",
          "Every payment received, with its date and receipt number.",
          "The balance now due, and the date it is due.",
          "How to pay: the Paybill number, the account number to use and any bank details.",
        ],
      },
      {
        h: "For families with several children",
        p: [
          "Give each child their own statement, and add a short family summary showing every child’s balance and one total. Parents with several children in the school will thank you.",
        ],
      },
      {
        h: "Make it verifiable",
        p: [
          "Parents increasingly need proof of fees paid for employers, sponsors or loans. A reference number or QR code that anyone can check against the school’s records makes your statements and receipts far more useful — and harder to fake.",
        ],
      },
      {
        h: "How Shulife helps",
        p: [
          "Shulife produces itemised statements per child and per family every term, with balance brought forward, optional items marked and your payment instructions — and parents can get the latest one any time by sending STATEMENT or TAARIFA on WhatsApp.",
        ],
      },
    ],
  },
  {
    slug: "collect-fees-without-sending-children-home",
    title: "How to collect school fees without sending children home",
    audience: "Directors",
    summary: "A kinder, more effective approach to outstanding fees that protects your school’s reputation and your learners’ dignity.",
    photo: "director",
    alt: "A school director walking with smiling students",
    readMins: 6,
    sections: [
      {
        h: "The cost of the gate conversation",
        p: [
          "Sending children home over fees is stressful for families, hurts learners who have done nothing wrong and is noticed by every parent at the gate. It also rarely brings money in faster than a clear, private conversation with the parent would.",
        ],
      },
      {
        h: "Talk to parents first — privately",
        list: [
          "Publish fee statements before the term starts, with a gentle “pay early” note.",
          "Send a friendly reminder before opening day, and on the due date.",
          "A week after the due date, follow up politely and offer an instalment plan.",
          "Before exams or trips, contact families who haven’t cleared — privately — with clear options: pay, agree a plan, or talk to the bursar.",
          "Never send reminders late at night, and stop the moment a family has paid.",
        ],
      },
      {
        h: "Make paying easy",
        p: [
          "Most late payments are not refusals — they are families managing cash flow. Payment plans agreed in advance, with a reminder before each instalment, turn an uncomfortable conversation into a routine one. Standing orders such as M-PESA Ratiba make it automatic.",
        ],
      },
      {
        h: "Keep amounts private",
        p: [
          "Teachers need to know whether a learner is cleared for an exam or trip — not how much a family owes. Share status lists, never balances, and never with learners or other parents.",
        ],
      },
      {
        h: "How Shulife helps",
        p: [
          "Shulife’s clearance feature sends families a private, polite message a week before an event, accepts plans by a one-time code and gives teachers a list that shows only Cleared, On plan, Not cleared or Overridden. Directors see who is on track without anyone being sent home.",
        ],
      },
    ],
  },
];
