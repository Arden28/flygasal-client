import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
// If you're using lucide or another icon set, you can swap the inline SVGs.

export default function PaymentSelectionCard({
    formData, 
    handleFormChange, 
    isFormValid, 
    handlePayment, 
    totalPrice, 
    isProcessing, 
    setIsProcessing
}) {
  const [paymentError, setPaymentError] = useState(null);

  return (
          <motion.div
              className="bg-white rounded-2xl w-full max-w-3xl mb-3 overflow-hidden ring-1 ring-slate-200"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              >
              {/* Header */}
              <header className="flex items-center justify-between px-4 py-3">
                  {/* Left: Icon + Title */}
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
                          <path d="M392 176L248 176L210.7 101.5C208.9 97.9 208 93.9 208 89.9C208 75.6 219.6 64 233.9 64L406.1 64C420.4 64 432 75.6 432 89.9C432 93.9 431.1 97.9 429.3 101.5L392 176zM233.6 224L406.4 224L455.1 264.6C521.6 320 560 402 560 488.5C560 536.8 520.8 576 472.5 576L167.4 576C119.2 576 80 536.8 80 488.5C80 402 118.4 320 184.9 264.6L233.6 224zM324 288C313 288 304 297 304 308L304 312C275.2 312.3 252 335.7 252 364.5C252 390.2 270.5 412.1 295.9 416.3L337.6 423.3C343.6 424.3 348 429.5 348 435.6C348 442.5 342.4 448.1 335.5 448.1L280 448C269 448 260 457 260 468C260 479 269 488 280 488L304 488L304 492C304 503 313 512 324 512C335 512 344 503 344 492L344 487.3C369 483.2 388 461.6 388 435.5C388 409.8 369.5 387.9 344.1 383.7L302.4 376.7C296.4 375.7 292 370.5 292 364.4C292 357.5 297.6 351.9 304.5 351.9L352 351.9C363 351.9 372 342.9 372 331.9C372 320.9 363 311.9 352 311.9L344 311.9L344 307.9C344 296.9 335 287.9 324 287.9z"/>
                      </svg>
                      </div>
                      <div className="min-w-0">
                      <h2 className="text-base font-semibold text-slate-900">Payment Method</h2>
                      <p className="text-xs text-slate-600">Please select your payment method.</p>
                      </div>
                  </div>
              </header>
  
              <div className="divide-y divide-slate-200 pb-4">
                  <section className="bg-white">
                      <div className="px-4 py-2 sm:px-6">
  
                        <p className="warning text-xs p-3 rounded-2xl bg-[#F6F6F7]">
                            For now, only <strong>Wallet Balance</strong> and <strong>Pay Later</strong> are available as payment methods
                        </p>
                          
                        {paymentError && (
                            <p className="text-red-500 text-sm mb-2">{paymentError}</p>
                        )}

                        <div className="space-y-2 py-3">
                            
                            {/* Wallet Balance */}
                            <div className="border p-3 rounded-2xl">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                    type="radio"
                                    name="payment_method"
                                    value="wallet"
                                    checked={formData.payment_method === 'wallet'}
                                    onChange={handleFormChange}
                                    className="form-check-input mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-500"
                                    />
                                    <span className="flex items-center gap-2">
                                    <img
                                        src="/assets/img/gateways/wallet_balance.png"
                                        alt="Wallet"
                                        className="h-4"
                                        style={{ height: '20px' }}
                                    />
                                    Wallet Balance
                                    </span>
                                </label>
                            </div>
                            
                            {/* Pay Later */}
                            <div className="border p-3 rounded-2xl">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                    type="radio"
                                    name="payment_method"
                                    value="pay_later"
                                    checked={formData.payment_method === 'pay_later'}
                                    onChange={handleFormChange}
                                    className="form-check-input mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-500"
                                    />
                                    <span className="flex items-center gap-2">
                                    <img
                                        src="/assets/img/gateways/pay_later.png"
                                        alt="Pay Later"
                                        className="h-4"
                                        style={{ height: '20px' }}
                                    />
                                    Pay Later
                                    </span>
                                </label>
                            </div>
                        </div>
                    
                      </div>
                  </section>
  
              </div>
  
  
          </motion.div>
    
  );
}
