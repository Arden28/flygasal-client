import React from 'react';
import { motion } from "framer-motion";

export default function PriceBreakdownCard({
    tripDetails,
    totalPrice, 
    isAgent,
    agentMarkupPercent,
    currency
}) {

  const money = (n, c = "USD") =>
    (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: c });
  
  // Calculate total markup
  const base = Number(totalPrice) || 0;
  const markup = +(base * (agentMarkupPercent / 100)).toFixed(2);
  const total = +(base + markup).toFixed(2);

  // Extract passenger breakdown from tripDetails
  const paxBreakdown = tripDetails?.priceBreakdown?.perPassenger || {};
  const hasAdults = paxBreakdown.ADT?.count > 0;
  const hasChildren = paxBreakdown.CHD?.count > 0;
  const hasInfants = paxBreakdown.INF?.count > 0;

  // Extract taxes and fees
  const totalTaxes = tripDetails?.priceBreakdown?.totals?.taxes || 0;
  const totalFees = tripDetails?.priceBreakdown?.totals?.fees || 0;
  const showTaxesAndFees = totalTaxes > 0 || totalFees > 0;

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
            {/* Minimal coin/price mark */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-slate-700"
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
        <section className="bg-white">
          <div className="px-5 py-4 space-y-3">
            
            {/* Passenger Fares */}
            <div className="space-y-2">
              {hasAdults && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Adult x {paxBreakdown.ADT.count}</span>
                  <span className="text-slate-700">{money(paxBreakdown.ADT.subtotal.base, currency)}</span>
                </div>
              )}
              {hasChildren && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Child x {paxBreakdown.CHD.count}</span>
                  <span className="text-slate-700">{money(paxBreakdown.CHD.subtotal.base, currency)}</span>
                </div>
              )}
              {hasInfants && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Infant x {paxBreakdown.INF.count}</span>
                  <span className="text-slate-700">{money(paxBreakdown.INF.subtotal.base, currency)}</span>
                </div>
              )}
            </div>

            {/* Taxes and Fees */}
            {showTaxesAndFees && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-100">
                <span className="text-slate-600 font-medium">Taxes & Airline Fees</span>
                <span className="text-slate-700">{money(totalTaxes + totalFees, currency)}</span>
              </div>
            )}

            {/* Agent Markup */}
            {isAgent === true && markup > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  Agent Markup 
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{agentMarkupPercent}%</span>
                </span>
                <span className="text-slate-700 font-medium">
                  {money(markup, currency)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex justify-between items-center text-base mt-4 pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-[#F68221] text-lg">{money(total, currency)}</span>
            </div>

            {/* Disclaimer */}
            <div className="text-center mt-3">
              <span className="text-[10px] text-slate-400">Total includes all taxes and applicable fees.</span>
            </div>

          </div>
        </section>
      </div>
    </motion.div>
  );
}