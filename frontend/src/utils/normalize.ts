export function normalizeFullName(first: string, last: string): string {
  return `${(first || "").trim()} ${(last || "").trim()}`
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[<>]/g, ""); // on retire < >
}
export const normalizeEmail = (e: string) => (e || "").trim().toLowerCase();
