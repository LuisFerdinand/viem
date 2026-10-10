import { messages } from "./translations";

export const LANGUAGES = [
  { code: "tet", label: "Tetum", locale: "pt-TL" },
  { code: "en", label: "English", locale: "en-GB" },
  { code: "id", label: "Bahasa Indonesia", locale: "id-ID" },
] as const;
export type Language = (typeof LANGUAGES)[number]["code"];
export function isLanguage(value: unknown): value is Language { return value === "tet" || value === "en" || value === "id"; }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = Object.keys(messages).filter((key) => /\{\d+\}/.test(key)).map((key) => {
  const slots = [...key.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
  return { key, slots, re: new RegExp(`^${key.split(/\{\d+\}/).map(escape).join("([\\s\\S]*?)")}$`) };
}).sort((a, b) => b.key.replace(/\{\d+\}/g, "").length - a.key.replace(/\{\d+\}/g, "").length);

/** Translate application copy; interpolation values remain as provided. */
export function translate(source: string, language: Language, values: readonly unknown[] = []): string {
  const index = language === "tet" ? 0 : 1;
  const render = (text: string, args: readonly unknown[]) => text.replace(/\{(\d+)\}/g, (_, n) => String(args[Number(n)] ?? ""));
  if (language === "en") return values.length ? render(source, values) : source;
  const exact = messages[source];
  if (exact) return render(exact[index], values);
  // Stored system events and validation errors also use the shared catalogue.
  for (const { key, slots, re } of patterns) {
    const match = source.match(re);
    if (!match) continue;
    const args: string[] = [];
    slots.forEach((slot, i) => { const value = match[i + 1]; args[slot] = messages[value]?.[index] ?? value; });
    return render(messages[key][index], args);
  }
  return values.length ? render(source, values) : source;
}
