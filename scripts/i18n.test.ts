import assert from "node:assert/strict";
import { test } from "node:test";
import { translate, isLanguage } from "../lib/i18n";
import { messages } from "../lib/translations";
import { dashboardFormatters } from "../lib/dashboard-format";
import { answerFromManual } from "../lib/manual";

test("translations preserve the complete placeholder set", () => {
  const slots = (s: string) => [...s.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort();
  for (const [source, translations] of Object.entries(messages)) {
    for (const text of translations) assert.deepEqual(slots(text), slots(source), source);
  }
});

test("navigation and dynamic system copy translate while inserted farm names remain unchanged", () => {
  assert.equal(translate("Overview", "id"), "Ringkasan");
  assert.notEqual(translate("Overview", "tet"), "Overview");
  const name = "Farm {2} · Água";
  assert.ok(translate("Helping {0}", "id", [name]).includes(name));
  assert.equal(translate(name, "id"), name);
  assert.equal(translate("Reference ABC-123.", "id"), "Referensi ABC-123.");
  assert.equal(translate("Reference {0}.", "en", ["ABC-123"]), "Reference ABC-123.");
  assert.equal(isLanguage("id"), true);
  assert.equal(isLanguage("es"), false);
});

test("localized amounts keep USD and relative dates use the selected language", () => {
  assert.equal(dashboardFormatters("id").usd(12.34, 2), "US$12,34");
  assert.equal(dashboardFormatters("en").usd(12.34, 2), "US$12.34");
  assert.notEqual(dashboardFormatters("tet").fmtRelative(0, 120000), "2 min ago");
});

test("Indonesian assistant questions route to manual answers and retain guardrails", () => {
  const answer = answerFromManual("Ikan megap megap di permukaan, oksigen rendah");
  assert.equal(answer.kind, "answer");
  if (answer.kind === "answer") assert.equal(answer.entry.id, "fish-gasping");
  assert.equal(answerFromManual("Boleh pakai obat atau bahan kimia?").kind, "blocked");
  assert.equal(answerFromManual("Berapa kali memberi pakan?").kind, "answer");
});
