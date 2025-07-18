// src/contexts/ClientContext.jsx
import { useState, useEffect, createContext } from 'react';
import { translations } from '../data/translation';
import { conversionRates, currencySymbols } from '../data/currencyRates';
import { useLocation } from 'react-router-dom';

export const ClientContext = createContext(); // ✅ Don't overwrite this

export const ClientProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage && ['en', 'fr', 'ar'].includes(savedLanguage) ? savedLanguage : 'en';
  });

  const [currency, setCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem('currency');
    return savedCurrency && ['USD', 'EUR', 'KES'].includes(savedCurrency) ? savedCurrency : 'USD';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const t = (key) => translations[language][key] || key;

  const convertCurrency = (amount, fromCurrency = 'USD') => {
    if (typeof amount !== 'number' || !fromCurrency || !conversionRates[fromCurrency]) return 0;
    const rate = conversionRates[fromCurrency][currency];
    return Number((amount * rate).toFixed(2));
  };

  const formatCurrency = (amount, fromCurrency = 'USD') => {
    const converted = convertCurrency(amount, fromCurrency);
    return `${currencySymbols[currency]}${converted.toLocaleString()}`;
  };

  const location = useLocation();
  const currentPath = location.pathname;

  const meta = {
    dashboard_active: currentPath === '/dashboard',
    bookings_active: currentPath === '/bookings',
    markups_active: currentPath === '/markups',
    deposit_active: currentPath === '/deposit',
    agency_active: currentPath === '/agency',
    profile_active: currentPath === '/profile',
  };

  return (
    <ClientContext.Provider value={{ language, setLanguage, currency, setCurrency, t, formatCurrency, meta }}>
      {children}
    </ClientContext.Provider>
  );
};
