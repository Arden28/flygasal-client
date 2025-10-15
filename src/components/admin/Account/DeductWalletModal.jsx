import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import apiService from "../../../api/apiService";
import { toast } from "react-toastify";

export default function DeductWalletModal({ open, onClose, userId, userName, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const [ref, setRef] = useState(""); // optional idempotency reference
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e?.preventDefault?.();
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) return toast.error("Enter a valid amount > 0.");

    setLoading(true);
    try {

      const body = {
        amount: amt,
        currency,
        payment_gateway_reference: ref || undefined,
        payment_gateway: "admin",
        note,
      };

      const res = await apiService.post(`/admin/users/${userId}/debit`, body);

      const ok = res?.status === 200 && res?.data?.status;
      if (!ok) throw new Error(res?.data?.message || "Failed");

      const data = res.data.data || {};
      toast.success("Wallet debited.");

      onSuccess?.({
        userId,
        amount: data.amount,
        currency: data.currency,
        balanceAfter: data.balance_after,
        trx: data.trx_id,
      });

      onClose?.();
      // reset
      setAmount("");
      setNote("");
      setRef("");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Action failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white ring-1 ring-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900">Deduct from Wallet</div>
          <button className="p-1 rounded hover:bg-gray-50" onClick={onClose} aria-label="Close">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-3">
          <div className="text-xs text-gray-600">
            User: <span className="font-medium text-gray-900">{userName || userId}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              >
                <option value="USD">USD</option>
                <option value="KES">KES</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Reference (optional)</label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                placeholder="e.g. ADMIN-ABC123"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2 py-2"
              placeholder="Reason for deduction"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700 disabled:opacity-60" disabled={loading}>
              {loading ? "Processing…" : "Deduct"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
