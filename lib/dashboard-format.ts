import { translate, type Language } from "./i18n";

const locale = (language: Language) => language === "id" ? "id-ID" : language === "tet" ? "pt-TL" : "en-GB";
export function dashboardFormatters(language: Language) {
  const date = (value: Date | number | string, time = false) => {
    const d = new Date(value);
    if (language === "tet") {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dili", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
      const months = ["Janeiru", "Fevereiru", "Marsu", "Abril", "Maiu", "Juñu", "Jullu", "Agostu", "Setembru", "Outubru", "Novembru", "Dezembru"];
      return `${part("day")} ${months[Number(part("month")) - 1]}${time ? `, ${part("hour")}:${part("minute")}` : ""}`;
    }
    return new Intl.DateTimeFormat(locale(language), { timeZone: "Asia/Dili", day: "numeric", month: "short", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(d);
  };
  const relative = (from: Date | number | string, now: number) => {
    const seconds = Math.max(0, Math.round((now - new Date(from).getTime()) / 1000));
    if (seconds < 45) return translate("just now", language);
    if (seconds < 3600) return translate("{0} min ago", language, [Math.round(seconds / 60)]);
    if (seconds < 86400) return translate("{0} h ago", language, [Math.round(seconds / 3600)]);
    return translate("{0} days ago", language, [Math.round(seconds / 86400)]);
  };
  const money = (n: number, digits = 0) => `US$${n.toLocaleString(locale(language), { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  return { fmtDate: (value: Date | number | string) => date(value), fmtDateTime: (value: Date | number | string) => date(value, true), fmtRelative: relative, usd: money, kg: (n: number) => `${n.toLocaleString(locale(language), { maximumFractionDigits: 1 })} kg` };
}
