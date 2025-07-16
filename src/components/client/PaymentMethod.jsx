import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentMethod = ({ formData, handleFormChange, isFormValid }) => {
  const [supportsApplePay, setSupportsApplePay] = useState(false);
  const [supportsGooglePay, setSupportsGooglePay] = useState(false);

  useEffect(() => {
    // Detect Apple Pay support
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
      setSupportsApplePay(true);
    }
    // Detect Google Pay support
    if (window.PaymentRequest) {
      const request = new PaymentRequest(
        [{ supportedMethods: 'https://google.com/pay' }],
        { total: { label: 'Total', amount: { currency: 'USD', value: '0.00' } } }
      );
      request.canMakePayment().then(result => {
        setSupportsGooglePay(result);
      }).catch(() => setSupportsGooglePay(false));
    }
  }, []);

  return (
    <motion.div
      className="payment-methods mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h4 className="fs-5">Payment Method</h4>
      <p className="text-muted text-sm">Please select your payment method.</p>
      <div className="space-y-2">
        {/* Credit Card (Stripe) */}
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="payment_method"
            value="credit_card"
            checked={formData.payment_method === 'credit_card'}
            onChange={handleFormChange}
            className="form-check-input mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-500"
            required
          />
          <span className="flex items-center gap-2 font-mono uppercase">
            <img
              src="/assets/img/gateways/stripe.png"
              alt="Stripe"
              className="h-4"
              style={{ height: '30px' }}
            />
            Credit Card
          </span>
        </label>
        <AnimatePresence>
          {formData.payment_method === 'credit_card' && (
            <motion.div
              className="p-3 border"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Replace with <CardElement> from @stripe/react-stripe-js for actual integration */}
                <div class="mb-6 grid grid-cols-2 gap-4">
                    <div class="col-span-2 sm:col-span-1">
                    <label for="full_name" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> Full name (as displayed on card)* </label>
                    <input type="text" id="full_name" class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="Bonnie Green" required />
                    </div>

                    <div class="col-span-2 sm:col-span-1">
                    <label for="card-number-input" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> Card number* </label>
                    <input type="text" id="card-number-input" class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pe-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="xxxx-xxxx-xxxx-xxxx" pattern="^4[0-9]{12}(?:[0-9]{3})?$" required />
                    </div>

                    <div>
                    <label for="card-expiration-input" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Card expiration* </label>
                    <div class="relative">
                        <div class="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
                        <svg class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path
                            fill-rule="evenodd"
                            d="M5 5a1 1 0 0 0 1-1 1 1 0 1 1 2 0 1 1 0 0 0 1 1h1a1 1 0 0 0 1-1 1 1 0 1 1 2 0 1 1 0 0 0 1 1h1a1 1 0 0 0 1-1 1 1 0 1 1 2 0 1 1 0 0 0 1 1 2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a2 2 0 0 1 2-2ZM3 19v-7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm6.01-6a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm2 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm6 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-10 4a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm6 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm2 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"
                            clip-rule="evenodd"
                            />
                        </svg>
                        </div>
                        <input datepicker datepicker-format="mm/yy" id="card-expiration-input" type="text" class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 ps-9 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500" placeholder="12/23" required />
                    </div>
                    </div>
                    <div>
                    <label for="cvv-input" class="mb-2 flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                        CVV*
                        <button data-tooltip-target="cvv-desc" data-tooltip-trigger="hover" class="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white">
                        <svg class="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                        </svg>
                        </button>
                        <div id="cvv-desc" role="tooltip" class="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700">
                        The last 3 digits on back of card
                        <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                    </label>
                    <input type="number" id="cvv-input" aria-describedby="helper-text-explanation" class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="•••" required />
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PayPal */}
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="payment_method"
            value="paypal"
            checked={formData.payment_method === 'paypal'}
            onChange={handleFormChange}
            className="form-check-input mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-500"
          />
          <span className="flex items-center gap-2 font-mono uppercase">
            <img
              src="/assets/img/gateways/paypal.png"
              alt="PayPal"
              className="h-4"
              style={{ height: '30px' }}
            />
            PayPal
          </span>
        </label>
        <AnimatePresence>
          {formData.payment_method === 'paypal' && (
            <motion.div
              className="ml-7 p-3 bg-gray-700 border-2 border-gray-500 rounded-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-200 text-sm font-mono">PayPal button (placeholder)</p>
              {/* Replace with <PayPalButtons> from @paypal/react-paypal-js for actual integration */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apple Pay */}
        {supportsApplePay && (
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="payment_method"
              value="apple_pay"
              checked={formData.payment_method === 'apple_pay'}
              onChange={handleFormChange}
              className="form-check-input mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-500"
            />
            <span className="flex items-center gap-2 font-mono uppercase">
              <img
                src="https://developer.apple.com/assets/elements/icons/apple-pay/apple-pay-mark.svg"
                alt="Apple Pay"
                className="h-5"
              />
              Apple Pay
            </span>
          </label>
        )}
        {supportsApplePay && formData.payment_method === 'apple_pay' && (
          <motion.div
            className="ml-7 p-3 bg-gray-700 border-2 border-gray-500 rounded-sm"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-200 text-sm font-mono">Apple Pay button (placeholder)</p>
            {/* Requires Apple Pay Session setup */}
          </motion.div>
        )}

        {/* Google Pay */}
        {supportsGooglePay && (
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="payment_method"
              value="google_pay"
              checked={formData.payment_method === 'google_pay'}
              onChange={handleFormChange}
              className="form-check-input mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-500"
            />
            <span className="flex items-center gap-2 font-mono uppercase">
              <img
                src="https://developers.google.com/pay/api/images/brand-guidelines/google-pay-mark.svg"
                alt="Google Pay"
                className="h-5"
              />
              Google Pay
            </span>
          </label>
        )}
        {supportsGooglePay && formData.payment_method === 'google_pay' && (
          <motion.div
            className="ml-7 p-3 bg-gray-700 border-2 border-gray-500 rounded-sm"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-200 text-sm font-mono">Google Pay button (placeholder)</p>
            {/* Requires PaymentRequest API setup */}
          </motion.div>
        )}

        {/* Bank Transfer */}
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="payment_method"
            value="bank_transfer"
            checked={formData.payment_method === 'bank_transfer'}
            onChange={handleFormChange}
            className="form-check-input mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-500"
          />
          <span className="flex items-center gap-2 font-mono uppercase">
            <img
              src="/assets/img/gateways/bank_transfer.png"
              alt="Bank Transfer"
              className="h-4"
              style={{ height: '30px' }}
            />
            Bank Transfer
          </span>
        </label>
        <AnimatePresence>
          {formData.payment_method === 'bank_transfer' && (
            <motion.div
              className="ml-7 p-3 bg-gray-700 border-2 border-gray-500 rounded-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-200 text-sm font-mono">Bank details will be provided after booking</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PaymentMethod;