export const c = { navy: "#14204A", navyDark: "#090F24", cream: "#FDF9F1", cream100: "#F8F0E0", sand: "#EEE2C9", gold: "#DFB460", goldDark: "#845F15", ink: "#121A30", muted: "#535D74", paid: "#2E7D5B", due: "#8E3B5E" };
export const ksh = (cents: number) => `KSh ${Math.round(cents / 100).toLocaleString("en-KE")}`;
export const short = (cents: number) => {
  const s = cents / 100;
  return s >= 1e6 ? `${(s / 1e6).toFixed(1)}m` : s >= 1e3 ? `${Math.round(s / 1e3)}k` : `${Math.round(s)}`;
};
