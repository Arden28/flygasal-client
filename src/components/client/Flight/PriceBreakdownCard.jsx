import React from 'react';
import { motion } from "framer-motion";

export default function PriceBreakdownCard({
  formData,
  totalPrice,           // backend totals.grand
  isAgent,
  agentMarkupPercent,
  currency,
  priceBreakdownRaw,    // NEW: pass the raw backend priceBreakdown if available
}) {
  const money = (n, ccy = "USD") =>
    (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: ccy });

  // Use backend raw breakdown without normalization
  const pb = priceBreakdownRaw || {};
  const pbCurrency = pb?.currency || currency || "USD";
  const totals = pb?.totals || {};
  const fees = pb?.fees || {};
  const feeItems = (fees.items && typeof fees.items === "object") ? fees.items : {};
  const perPassenger = (pb?.perPassenger && typeof pb.perPassenger === "object") ? pb.perPassenger : {};

  const backendBase = Number(totals.base || 0);
  const backendTaxes = Number(totals.taxes || 0);
  const backendFees = Number(totals.fees || fees.total || 0);

  // Fallback grand to totalPrice prop if totals.grand not present
  const backendGrand = Number(totals.grand != null ? totals.grand : totalPrice || 0);

  // Agent markup computed ONCE on the backend grand total
  const markup = +(backendGrand * (agentMarkupPercent / 100)).toFixed(2);
  const grandWithMarkup = +((backendGrand || 0) + (isAgent ? markup : 0)).toFixed(2);

  // Order & filter pax types
  const ORDER = ["ADT", "CHD", "INF"];
  const paxEntries = Object.entries(perPassenger)
    .sort(([a], [b]) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .filter(([, v]) => Number(v?.count || 0) > 0);

  return (
    <motion.div
      className="bg-white rounded-2xl w-full mb-3 overflow-hidden ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-300">
            {/* Minimal airplane mark */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 640 640"
              aria-hidden
            >
              <path d="M296 88C296 74.7 306.7 64 320 64C333.3 64 344 74.7 344 88L344 128L400 128C417.7 128 432 142.3 432 160C432 177.7 417.7 192 400 192L285.1 192C260.2 192 240 212.2 240 237.1C240 259.6 256.5 278.6 278.7 281.8L370.3 294.9C424.1 302.6 464 348.6 464 402.9C464 463.2 415.1 512 354.9 512L344 512L344 552C344 565.3 333.3 576 320 576C306.7 576 296 565.3 296 552L296 512L224 512C206.3 512 192 497.7 192 480C192 462.3 206.3 448 224 448L354.9 448C379.8 448 400 427.8 400 402.9C400 380.4 383.5 361.4 361.3 358.2L269.7 345.1C215.9 337.5 176 291.4 176 237.1C176 176.9 224.9 128 285.1 128L296 128L296 88z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Price Breakdown</h2>
          </div>
        </div>
      </header>

      <div className="divide-y divide-slate-200 pb-4">
        {/* Per-passenger type (only shown when present) */}
        {paxEntries.length > 0 && (
          <section className="bg-white">
            <div className="px-4 py-2 sm:px-6">
              <div className="text-xs text-slate-500 mb-2">Per passenger type</div>
              <div className="space-y-2">
                {paxEntries.map(([ptype, data]) => {
                  const count = Number(data?.count || 0);
                  const uFare = Number(data?.unit?.fare || 0);
                  const uTax = Number(data?.unit?.tax || 0);
                  const uTotal = Number(data?.unit?.total || 0);
                  const sBase = Number(data?.subtotal?.base || 0);
                  const sTaxes = Number(data?.subtotal?.taxes || 0);
                  const sTotal = Number(data?.subtotal?.total || 0);
                  return (
                    <div key={`pb-${ptype}`} className="rounded-lg border border-slate-200 p-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">
                          {ptype} <span className="text-slate-500 font-normal">× {count}</span>
                        </span>
                        <span className="font-semibold text-slate-900">{money(sTotal, pbCurrency)}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded border border-slate-200 p-2">
                          <div className="text-[11px] text-slate-500 mb-1">Unit</div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Fare</span>
                            <span className="text-slate-800">{money(uFare, pbCurrency)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Tax</span>
                            <span className="text-slate-800">{money(uTax, pbCurrency)}</span>
                          </div>
                          <div className="mt-1 border-t border-slate-200 pt-1 flex items-center justify-between">
                            <span className="text-slate-600">Total</span>
                            <span className="text-slate-800">{money(uTotal, pbCurrency)}</span>
                          </div>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <div className="text-[11px] text-slate-500 mb-1">Subtotal</div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Base</span>
                            <span className="text-slate-800">{money(sBase, pbCurrency)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Taxes</span>
                            <span className="text-slate-800">{money(sTaxes, pbCurrency)}</span>
                          </div>
                          <div className="mt-1 border-t border-slate-200 pt-1 flex items-center justify-between">
                            <span className="text-slate-600">Total</span>
                            <span className="text-slate-800">{money(sTotal, pbCurrency)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Totals & fees */}
        <section className="bg-white">
          <div className="px-4 py-2 sm:px-6">
            {/* All pax totals from backend */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Base (all pax)</span>
              <span className="text-slate-800">{money(backendBase, pbCurrency)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-slate-600">Taxes (all pax)</span>
              <span className="text-slate-800">{money(backendTaxes, pbCurrency)}</span>
            </div>

            {/* Fee items (only when non-zero / present) */}
            {Object.entries(feeItems).filter(([, v]) => Number(v || 0) > 0).length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-slate-500 mb-1">Fees</div>
                <div className="space-y-1">
                  {Object.entries(feeItems)
                    .filter(([, v]) => Number(v || 0) > 0)
                    .map(([k, v]) => (
                      <div key={`fee-${k}`} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{k}</span>
                        <span className="text-slate-800">{money(v, pbCurrency)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Fees total row (shown if any fees exist) */}
            {backendFees > 0 && (
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-600">Fees total</span>
                <span className="text-slate-800">{money(backendFees, pbCurrency)}</span>
              </div>
            )}

            {/* Agent markup (only for agents) */}
            {isAgent === true && (
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-700 font-medium">Agent markup ({agentMarkupPercent}%)</span>
                <span className="text-slate-800 font-medium">{money(markup, pbCurrency)}</span>
              </div>
            )}

            {/* Final totals */}
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-slate-700">Grand total (source)</span>
              <span className="text-slate-900 font-semibold">{money(backendGrand, pbCurrency)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="font-bold">Total to pay</span>
              <span className="font-bold">{money(grandWithMarkup, pbCurrency)}</span>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
