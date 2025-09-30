import React, { useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import apiService from "../../../api/apiService";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function TopUpWalletModal({
  open,
  onClose,
  userId,
  userName,
  onSuccess, // ({userId, amount, currency, balanceBefore, balanceAfter, trx})
  defaultCurrency = "USD",
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [reference, setReference] = useState("");
  const [gateway, setGateway] = useState("admin");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setCurrency(defaultCurrency);
      setReference("");
      setGateway("admin");
      setNote("");
      setSubmitting(false);
    }
  }, [open, defaultCurrency]);

  const previewAfter = useMemo(() => {
    if (!amount) return null;
    const a = Number(amount);
    if (Number.isNaN(a) || a <= 0) return null;
    return a;
  }, [amount]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!userId) return toast.error("Missing user.");
    const num = Number(amount);
    if (!num || num <= 0) return toast.error("Enter a valid positive amount.");

    setSubmitting(true);
    try {
      const body = {
        amount: num,
        currency: currency.toUpperCase(),
        payment_gateway_reference: reference || undefined,
        payment_gateway: gateway || "admin",
        note: note || undefined,
      };

      const res = await apiService.post(`/admin/users/${userId}/deposit`, body);
      const ok = res?.data?.status === true || res?.data?.message?.toLowerCase?.().includes("deposit");
      if (!ok) {
        throw new Error(res?.data?.message || "Deposit failed.");
      }

      const data = res.data.data || {};
      onSuccess?.({
        userId,
        amount: data.amount ?? num,
        currency: data.currency ?? currency,
        balanceBefore: data.balance_before,
        balanceAfter: data.balance_after,
        trx: data.trx_id,
      });

      toast.success(`Deposited ${data.amount ?? num} ${data.currency ?? currency} to ${userName || "user"}.`);
      onClose?.();
    } catch (err) {
      console.error("Admin deposit error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Deposit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md sm:max-w-lg rounded-2xl bg-white ring-1 ring-gray-200 flex max-h-[90vh] flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900">
            Top up wallet {userName ? `· ${userName}` : ""}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-50" aria-label="Close">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              required
            >
              <option value="USD">USD</option>
              <option value="KES">KES</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Payment Gateway</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
            >
              <option value="admin">Admin</option>
              <option value="bank">Bank</option>
              {/* add mpesa, stripe, etc. when needed */}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Transaction Reference (optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., ADMIN-AB12CD34"
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2 py-2"
              placeholder="Why are you crediting this wallet?"
            />
          </div>

          {previewAfter && (
            <div className="mt-2 rounded-lg bg-blue-50 text-blue-800 ring-1 ring-blue-200 p-3 text-xs">
              This will credit <span className="font-semibold">{Number(amount).toFixed(2)} {currency}</span> to the user’s wallet.
            </div>
          )}

          {/* Footer */}
          <div className="mt-2 flex justify-end gap-2 border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cx(
                "rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white",
                submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
              )}
            >
              {submitting ? "Processing…" : "Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
