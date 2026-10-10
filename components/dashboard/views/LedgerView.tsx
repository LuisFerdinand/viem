"use client";

import { ArrowDownLeft, ArrowUpRight, BookOpen, Download, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CROP_BY_ID } from "@/lib/domain";
import { csvCell, ledgerRows } from "@/lib/ledger";
import { selectUnit } from "@/lib/sim/store";
import { LEDGER_CATEGORIES, type LedgerDTO } from "@/lib/types";
import { cn, fmtDate, todayInDili, usd } from "@/lib/utils";
import { useSnapshot, useStore } from "../DashboardProvider";
import { Card, EmptyState, Field, Input, PageHeader, Pill, Select } from "../ui";

function TransactionForm({ unitId, entry, onClose }: { unitId: string; entry?: LedgerDTO; onClose: () => void }) {
  const store = useStore();
  const snap = useSnapshot();
  const [type, setType] = useState<LedgerDTO["type"]>(entry?.type ?? "expense");
  const [category, setCategory] = useState(entry?.category ?? "Seeds & seedlings");
  const [amount, setAmount] = useState(entry ? (entry.amountCents / 100).toFixed(2) : "");
  const [date, setDate] = useState(entry?.date ?? todayInDili());
  const [description, setDescription] = useState(entry?.description ?? "");
  const [counterparty, setCounterparty] = useState(entry?.counterparty ?? "");
  const [reference, setReference] = useState(entry?.reference ?? "");
  const [error, setError] = useState<string | null>(null);
  return <Card id="ledger-editor" className="scroll-mt-24" title={entry ? "Edit transaction" : "New transaction"} description="Record farm expenses and income outside harvest buy-backs. Currency: US dollars.">
    <form className="grid gap-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) return setError("Enter a positive amount with up to two decimal places.");
      const err = await store.saveLedger({ id: entry?.id, unitId, type, category, amountCents: Math.round(Number(amount) * 100), date, description, counterparty, reference });
      setError(err);
      if (!err) onClose();
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Transaction type">{(p) => <Select {...p} value={type} onChange={(e) => { const next = e.target.value as LedgerDTO["type"]; setType(next); setCategory(next === "income" ? "Other income" : "Seeds & seedlings"); }}><option value="expense">Expense · Pengeluaran</option><option value="income">Income · Pemasukan</option></Select>}</Field>
        <Field label="Category">{(p) => <Select {...p} value={category} onChange={(e) => setCategory(e.target.value)}>{LEDGER_CATEGORIES.filter((c) => type === "income" ? c === "Other income" : c !== "Other income").map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
        <Field label="Amount (USD)">{(p) => <Input {...p} inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />}</Field>
        <Field label="Transaction date">{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />}</Field>
      </div>
      <Field label="Description / Catatan">{(p) => <Input {...p} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was purchased or received?" required maxLength={240} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier or payer (optional)">{(p) => <Input {...p} value={counterparty} onChange={(e) => setCounterparty(e.target.value)} maxLength={120} />}</Field>
        <Field label="Receipt / reference (optional)">{(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} />}</Field>
      </div>
      {error && <p role="alert" className="text-sm text-crit-700">{error}</p>}
      <div className="flex gap-2"><button className="dash-primary" disabled={!!snap.pending["ledger:save"]}>{snap.pending["ledger:save"] ? "Saving…" : "Save transaction"}</button><button type="button" className="dash-secondary" onClick={onClose}>Cancel</button></div>
    </form>
  </Card>;
}

export function LedgerView() {
  const snap = useSnapshot();
  const store = useStore();
  const unit = selectUnit(snap);
  const [form, setForm] = useState<"new" | LedgerDTO | null>(null);
  const [from, setFrom] = useState(`${todayInDili().slice(0, 7)}-01`);
  const [to, setTo] = useState(todayInDili());
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  useEffect(() => {
    if (form) document.getElementById("ledger-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form]);
  const all = ledgerRows(snap.data, unit.id);
  const invalidDates = !!from && !!to && from > to;
  const period = invalidDates ? [] : all.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
  const visible = period.filter((r) => (type === "all" || r.type === type) && `${r.description} ${r.category} ${r.counterparty} ${r.reference}`.toLowerCase().includes(query.toLowerCase())).reverse();
  const income = period.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amountCents, 0);
  const expense = period.filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amountCents, 0);
  const opening = from ? all.filter((r) => r.date < from).at(-1)?.balanceCents ?? 0 : 0;
  const unpaid = snap.data.harvests.filter((h) => h.unitId === unit.id && h.status !== "paid");
  const outstanding = unpaid.reduce((sum, h) => sum + Math.round(h.weightKg * h.pricePerKg * 100), 0);
  function exportCsv() {
    const rows: (string | number)[][] = [["Date", "Type", "Category", "Description", "Counterparty", "Reference", "Income USD", "Expense USD", "Running balance USD"], ...[...visible].reverse().map((r) => [r.date, r.type, r.category, r.description, r.counterparty, r.reference, r.type === "income" ? (r.amountCents / 100).toFixed(2) : "", r.type === "expense" ? (r.amountCents / 100).toFixed(2) : "", (r.balanceCents / 100).toFixed(2)])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `viem-buku-besar-${unit.id}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="grid gap-6">
    <PageHeader title="Buku Besar" description={`${unit.name} · Farm income, expenses and buy-back payments in one place.`} actions={<><button className="dash-secondary" onClick={exportCsv} disabled={!visible.length}><Download className="size-4" />Export CSV</button><button className="dash-primary" onClick={() => setForm("new")}><Plus className="size-4" />Add transaction</button></>} />
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[{ label: "Income · Pemasukan", value: income, icon: ArrowDownLeft, tone: "text-ok-700", note: "Paid buy-backs + other income" }, { label: "Expenses · Pengeluaran", value: expense, icon: ArrowUpRight, tone: "text-crit-700", note: "Recorded farm operating costs" }, { label: "Net cash movement", value: income - expense, icon: Wallet, tone: "text-forest-900", note: "Income less expenses for this period" }, { label: "Outstanding buy-back", value: outstanding, icon: BookOpen, tone: "text-water-700", note: `${unpaid.length} unpaid harvests · all dates` }].map(({ label, value, icon: Icon, tone, note }) => <div key={label} className="rounded-2xl border border-forest-100 bg-white p-4 sm:p-5"><div className="flex items-start justify-between gap-2 text-xs text-muted"><span>{label}</span><Icon className={cn("size-4 shrink-0", tone)} /></div><p className={cn("mt-3 break-words text-xl font-semibold tracking-tight tabular sm:text-2xl", tone)}>{usd(value / 100, 2)}</p><p className="mt-2 text-xs leading-relaxed text-muted">{note}</p></div>)}
    </div>
    {form && <TransactionForm key={`${unit.id}-${form === "new" ? "new" : form.id}`} unitId={unit.id} entry={form === "new" || form.unitId !== unit.id ? undefined : form} onClose={() => setForm(null)} />}
    <Card title="Transactions" description="Paid harvests appear automatically. Update their payment status in Harvest & buy-back.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="From">{(p) => <Input {...p} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
        <Field label="To">{(p) => <Input {...p} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
        <Field label="Type">{(p) => <Select {...p} value={type} onChange={(e) => setType(e.target.value)}><option value="all">All transactions</option><option value="income">Income</option><option value="expense">Expenses</option></Select>}</Field>
        <Field label="Search">{(p) => <div className="relative"><Search className="absolute top-3.5 left-3 size-4 text-muted" /><Input {...p} className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Notes, category, supplier…" /></div>}</Field>
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><span>{visible.length} transactions · Opening balance {usd(opening / 100, 2)} · Closing balance {usd((opening + income - expense) / 100, 2)}</span><button className="min-h-9 font-semibold text-forest-700" onClick={() => { setFrom(""); setTo(""); setType("all"); setQuery(""); }}>Show all dates</button></div>
      {invalidDates && <p role="alert" className="mb-3 text-sm text-crit-700">The end date must be on or after the start date.</p>}
      {visible.length ? <ul className="divide-y divide-forest-100">
        {visible.map((r) => <li key={r.key} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-3"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", r.type === "income" ? "bg-ok-50 text-ok-700" : "bg-crit-50 text-crit-700")}>{r.type === "income" ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}</span><div className="min-w-0"><p className="break-words text-sm font-semibold text-forest-900">{r.description}</p><p className="mt-1 break-words text-xs text-muted">{fmtDate(`${r.date}T00:00:00Z`)} · {r.category}{r.counterparty ? ` · ${r.counterparty}` : ""}</p><div className="mt-2 flex flex-wrap items-center gap-2"><Pill tone={r.harvestId !== undefined ? "water" : "neutral"}>{r.harvestId !== undefined ? "Linked buy-back" : "Manual entry"}</Pill>{r.reference && <span className="break-all text-xs text-muted">{r.reference}</span>}</div></div></div>
          <div className="flex flex-wrap items-center justify-between gap-3 pl-13 sm:justify-end sm:pl-0"><div className="sm:text-right"><p className={cn("text-base font-semibold tabular", r.type === "income" ? "text-ok-700" : "text-crit-700")}>{r.type === "income" ? "+" : "−"}{usd(r.amountCents / 100, 2)}</p><p className="mt-1 text-xs text-muted tabular">Balance {usd(r.balanceCents / 100, 2)}</p></div>
            {r.manualId !== undefined ? <div className="flex gap-1">{confirm === r.key ? <><button className="dash-secondary text-crit-700" disabled={!!snap.pending[`ledger:${r.manualId}`]} onClick={async () => { const entry = snap.data.ledger.find((e) => e.id === r.manualId); if (entry) await store.deleteLedger(entry); setConfirm(null); }}>Delete</button><button className="dash-secondary" onClick={() => setConfirm(null)}>Keep</button></> : <><button className="flex size-11 items-center justify-center rounded-xl text-forest-600 hover:bg-forest-50" aria-label={`Edit ${r.description}`} onClick={() => { const entry = snap.data.ledger.find((e) => e.id === r.manualId); if (entry) setForm(entry); }}><Pencil className="size-4" /></button><button className="flex size-11 items-center justify-center rounded-xl text-crit-700 hover:bg-crit-50" aria-label={`Delete ${r.description}`} onClick={() => setConfirm(r.key)}><Trash2 className="size-4" /></button></>}</div> : <Link className="dash-secondary text-xs" href="/dashboard/harvest">View harvest</Link>}
          </div>
        </li>)}
      </ul> : <EmptyState icon={BookOpen} title="No transactions in this view">Add a transaction, mark a harvest as paid, or adjust the filters.</EmptyState>}
      <p className="mt-4 border-t border-forest-100 pt-3 text-xs leading-relaxed text-muted">Running balances include all recorded transactions through each row's date. Totals use the selected date period. Outstanding harvests are excluded from cash income.</p>
    </Card>
    <Card title="Buy-back payments to receive" description="All unpaid harvests for this unit, independent of the transaction filters." action={<Link className="dash-secondary" href="/dashboard/harvest">Harvest & buy-back</Link>}>
      {unpaid.length ? <ul className="grid gap-3">{unpaid.slice(0, 12).map((h) => <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-forest-50 p-3"><div><p className="text-sm font-semibold text-forest-900">{h.weightKg} kg {CROP_BY_ID[h.crop]?.label ?? h.crop}</p><p className="text-xs text-muted">{h.buyer} · {h.harvestedAt} · {h.status}</p></div><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-semibold tabular">{usd(h.weightKg * h.pricePerKg, 2)}</span>{h.status === "collected" ? <button className="dash-primary text-xs" disabled={!!snap.pending[`harvest:${h.id}`]} onClick={() => void store.setHarvestStatus(h.id, "paid")}>Record payment</button> : <Link className="dash-secondary text-xs" href="/dashboard/harvest">Awaiting collection</Link>}</div></li>)}</ul> : <EmptyState icon={Wallet} title="All buy-backs are paid" />}
      {unpaid.length > 12 && <p className="mt-3 text-xs text-muted">Showing 12 of {unpaid.length} unpaid harvests. View all in Harvest & buy-back.</p>}
    </Card>
  </div>;
}
