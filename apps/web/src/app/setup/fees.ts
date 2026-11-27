/** The fee columns offered in setup. Blank cells aren't charged. */
export const FEE_COLUMNS = [
  { code: "tuition", name: "Tuition", kind: "mandatory" },
  { code: "activity", name: "Activity fee", kind: "mandatory" },
  { code: "exam", name: "Exam fee", kind: "mandatory" },
  { code: "lunch", name: "Lunch", kind: "optional" },
  { code: "boarding", name: "Boarding", kind: "mandatory" },
] as const;
