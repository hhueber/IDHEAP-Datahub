export function normalizeName(s: string): string {
  return (s || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "");
}
export const normalizeEmail = (e: string) => (e || "").trim().toLowerCase();
