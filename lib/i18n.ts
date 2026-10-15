import { messages } from "./translations";
import { messagesPt } from "./translations-pt";

export const LANGUAGES = [
  { code: "tet", label: "Tetum", locale: "pt-TL" },
  { code: "en", label: "English", locale: "en-GB" },
  { code: "id", label: "Bahasa Indonesia", locale: "id-ID" },
  { code: "pt", label: "Português", locale: "pt-PT" },
] as const;
export type Language = (typeof LANGUAGES)[number]["code"];
export function isLanguage(value: unknown): value is Language { return LANGUAGES.some((l) => l.code === value); }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = Object.keys(messages).filter((key) => /\{\d+\}/.test(key)).map((key) => {
  const slots = [...key.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
  return { key, slots, re: new RegExp(`^${key.split(/\{\d+\}/).map(escape).join("([\\s\\S]*?)")}$`) };
}).sort((a, b) => b.key.replace(/\{\d+\}/g, "").length - a.key.replace(/\{\d+\}/g, "").length);

/** The translated template for `source` in a language, or undefined when the catalogue has none. */
function template(source: string, language: Exclude<Language, "en">): string | undefined {
  if (language === "pt") return messagesPt[source];
  return messages[source]?.[language === "tet" ? 0 : 1];
}

/** Translate application copy; interpolation values remain as provided. */
export function translate(source: string, language: Language, values: readonly unknown[] = []): string {
  const render = (text: string, args: readonly unknown[]) => text.replace(/\{(\d+)\}/g, (_, n) => String(args[Number(n)] ?? ""));
  if (language === "en") return values.length ? render(source, values) : source;
  const exact = template(source, language);
  if (exact !== undefined) return render(exact, values);
  // Stored system events and validation errors also use the shared catalogue.
  for (const { key, slots, re } of patterns) {
    const match = source.match(re);
    if (!match) continue;
    const text = template(key, language);
    if (text === undefined) continue;
    const args: string[] = [];
    slots.forEach((slot, i) => { const value = match[i + 1]; args[slot] = template(value, language) ?? value; });
    return render(text, args);
  }
  return values.length ? render(source, values) : source;
}
