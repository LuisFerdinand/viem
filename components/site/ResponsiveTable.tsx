import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Column<T> = { key: keyof T & string; header: string; className?: string; render?: (row: T) => ReactNode };

/**
 * A real <table> from md upwards; stacked label/value cards on phones so the
 * page never scrolls sideways.
 */
export function ResponsiveTable<T extends Record<string, unknown>>({
  caption,
  columns,
  rows,
  rowKey,
  rowClassName,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
}) {
  const cell = (row: T, c: Column<T>) => (c.render ? c.render(row) : (row[c.key] as ReactNode));
  return (
    <div className="reveal">
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-forest-500">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-4 py-3 text-xs font-bold tracking-[0.12em] text-forest-600 uppercase", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={cn("border-b border-forest-100 align-top", rowClassName?.(row))}>
              {columns.map((c, i) =>
                i === 0 ? (
                  <th key={c.key} scope="row" className={cn("px-4 py-4 font-semibold text-forest-900", c.className)}>
                    {cell(row, c)}
                  </th>
                ) : (
                  <td key={c.key} className={cn("px-4 py-4 text-forest-800", c.className)}>
                    {cell(row, c)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="grid gap-3 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className={cn("rounded-2xl border border-forest-100 bg-white p-4", rowClassName?.(row))}>
            <dl className="grid gap-2">
              {columns.map((c, i) => (
                <div key={c.key}>
                  <dt className="text-[0.7rem] font-bold tracking-wider text-forest-500 uppercase">{c.header}</dt>
                  <dd className={cn("text-sm text-forest-900", i === 0 && "font-semibold")}>{cell(row, c)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
