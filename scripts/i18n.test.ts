import assert from "node:assert/strict";
import { test } from "node:test";
import { translate, isLanguage } from "../lib/i18n";
import { messages } from "../lib/translations";
import { messagesPt } from "../lib/translations-pt";
import { dashboardFormatters } from "../lib/dashboard-format";
import { answerFromManual } from "../lib/manual";

test("translations preserve the complete placeholder set", () => {
  const slots = (s: string) => [...s.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort();
  for (const [source, translations] of Object.entries(messages)) {
    for (const text of translations) assert.deepEqual(slots(text), slots(source), source);
  }
});

test("every catalogue entry has a Portuguese translation with the same placeholders", () => {
  const slots = (s: string) => [...s.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort();
  for (const source of Object.keys(messages)) {
    assert.ok(messagesPt[source], `missing Portuguese for: ${source}`);
    assert.deepEqual(slots(messagesPt[source]), slots(source), source);
  }
  for (const source of Object.keys(messagesPt)) assert.ok(source in messages, `orphan Portuguese entry: ${source}`);
});

test("Portuguese is a selectable language with localized formatting and event messages", () => {
  assert.equal(isLanguage("pt"), true);
  assert.equal(translate("Overview", "pt"), "Visão geral");
  assert.equal(translate("Hubs & sets", "pt"), "Hubs e sets");
  assert.equal(translate("Hub added: {0} ({1}) with {2}", "pt", ["Suku Unit 03", "Baucau", "Set 1"]), "Hub adicionado: Suku Unit 03 (Baucau) com Set 1");
  // Stored English event text is matched by pattern and its inserted names are left alone.
  assert.equal(translate("Set removed from VIEM Hub: Set 2", "pt"), "Set removido de VIEM Hub: Set 2");
  assert.equal(translate("Not in the catalogue", "pt"), "Not in the catalogue");
  assert.equal(dashboardFormatters("pt").usd(12.34, 2), "US$12,34");
  assert.equal(dashboardFormatters("pt").fmtRelative(0, 120000), "há 2 min");
});

test("Portuguese questions route to manual answers and retain guardrails", () => {
  const answer = answerFromManual("Os peixes estão a ofegar à superfície, falta oxigénio");
  assert.equal(answer.kind, "answer");
  if (answer.kind === "answer") assert.equal(answer.entry.id, "fish-gasping");
  assert.equal(answerFromManual("Posso usar pesticida ou medicamento?").kind, "blocked");
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
