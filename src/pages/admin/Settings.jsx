import { useState, useEffect } from 'react';
import { CogIcon, EnvelopeIcon, PaperAirplaneIcon, CreditCardIcon, BellIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiService from '../../api/apiService';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'FlyGasal',
    defaultCurrency: 'usd',
    maintenanceMode: false,
    timezone: 'UTC',
    language: 'en',
    maxLoginAttempts: 5,
  });
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpKey: '',
    encryption: 'tls',
    senderEmail: '',
  });
  const [pkfareSettings, setPkfareSettings] = useState({
    baseUrl: 'https://api.pkfare.com',
    partnerId: '',
    partnerKey: '',
    environment: 'production',
    timeout: 30,
  });
  const [paymentSettings, setPaymentSettings] = useState({
    stripeApiKey: '',
    paypalClientId: '',
    stripeTestMode: false,
    paypalTestMode: false,
    supportedCurrencies: ['USD'],
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    emailBookingConfirmation: true,
    smsBookingConfirmation: false,
  });

  const tabs = [
    { id: 'system', name: 'System Settings', icon: CogIcon },
    { id: 'email', name: 'Email API', icon: EnvelopeIcon },
    { id: 'pkfare', name: 'PKfare API', icon: PaperAirplaneIcon },
    // { id: 'payment', name: 'Payment APIs', icon: CreditCardIcon },
    { id: 'notification', name: 'Notification Settings', icon: BellIcon },
  ];

  // Fetch System settings from backend API
  useEffect(() => {
    const fetchSystemSettings = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/admin/settings');
        const data = response.data;
        setSystemSettings({
          siteName: data.site_name || 'FlyGasal',
          defaultCurrency: data.default_currency || 'usd',
          maintenanceMode: !!data.maintenance_mode,
          timezone: data.timezone || 'UTC',
          language: data.language || 'en',
          maxLoginAttempts: data.max_login_attempts || 5,
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to load system settings');
        setLoading(false);
      }
    };

    fetchSystemSettings();
  }, []);

  // Fetch email settings from backend API
  useEffect(() => {
    const fetchEmailSettings = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/admin/email-settings');
        // if (!response.ok) throw new Error('Failed to load email settings');
        const data = response.data;
        setEmailSettings({
          smtpHost: data.MAIL_HOST || '',
          smtpPort: data.MAIL_PORT || '',
          smtpKey: data.MAIL_PASSWORD || '',
          encryption: data.MAIL_ENCRYPTION || 'tls',
          senderEmail: data.MAIL_FROM_ADDRESS || '',
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to load email settings');
        setLoading(false);
      }
    };

    fetchEmailSettings();
  }, []);

  // Handle form submissions
  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    if (!systemSettings.siteName || systemSettings.maxLoginAttempts < 1) {
      toast.error('Please fill all required fields correctly.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiService.post('/admin/settings', {
        site_name: systemSettings.siteName,
        default_currency: systemSettings.defaultCurrency,
        timezone: systemSettings.timezone,
        language: systemSettings.language,
        login_attemps: systemSettings.maxLoginAttempts,
        maintenance_mode: systemSettings.maintenanceMode,
      });
      toast.success('System settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save system settings');
      setError('Failed to save system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (
      !emailSettings.smtpHost ||
      !emailSettings.smtpPort ||
      !emailSettings.senderEmail.includes('@')
    ) {
      toast.error('Please fill all required fields correctly.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiService.post('/admin/email-settings', {
        MAIL_MAILER: 'smtp',
        MAIL_HOST: emailSettings.smtpHost,
        MAIL_PORT: emailSettings.smtpPort,
        MAIL_USERNAME: emailSettings.senderEmail,
        MAIL_PASSWORD: emailSettings.smtpKey,
        MAIL_ENCRYPTION: emailSettings.encryption,
        MAIL_FROM_ADDRESS: emailSettings.senderEmail,
        MAIL_FROM_NAME: 'FlyGasal',
      });
      toast.success('Email settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save email settings');
      setError('Failed to save email settings');
    } finally {
      setLoading(false);
    }
  };

    // Fetch PKfare settings from backend API
  useEffect(() => {
    const fetchPkfareSettings = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/admin/pkfare-settings');
        const data = response.data;
        // console.info(data);
        setPkfareSettings({
          baseUrl: data.PKFARE_API_BASE_URL || 'https://api.pkfare.com',
          partnerId: data.PKFARE_PARTNER_ID || '',
          partnerKey: data.PKFARE_PARTNER_KEY || '',
          environment: data.PKFARE_ENVIRONMENT || 'production',
          timeout: data.PKFARE_TIMEOUT || 30,
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to load PKfare settings');
        setLoading(false);
      }
    };

    fetchPkfareSettings();
  }, []);

  const handlePkfareSubmit = async (e) => {
    e.preventDefault();
    if (!pkfareSettings.baseUrl || !pkfareSettings.partnerId || !pkfareSettings.partnerKey || pkfareSettings.timeout < 1) {
      toast.error('Please fill all required fields correctly.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiService.post('/admin/email-settings', {
        PKFARE_API_BASE_URL: pkfareSettings.baseUrl,
        PKFARE_PARTNER_ID: pkfareSettings.partnerId,
        PKFARE_PARTNER_KEY: pkfareSettings.partnerKey,
      });
      toast.success('PKFare settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save PKFare settings');
      setError('Failed to save PKFare settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentSettings.stripeApiKey || !paymentSettings.paypalClientId || paymentSettings.supportedCurrencies.length === 0) {
      toast.error('Please fill all required fields correctly.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success('Payment settings saved successfully!');
      setLoading(false);
    }, 500);
    // Future API call: PUT /api/settings/payment
    // fetch('https://your-laravel-api.com/api/settings/payment', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(paymentSettings),
    // })
    //   .then(() => toast.success('Payment settings saved successfully!'))
    //   .catch(() => toast.error('Failed to save payment settings'))
    //   .finally(() => setLoading(false));
  };

    // Fetch Notification settings from backend API
    useEffect(() => {
      const fetchNotificationSettings = async () => {
        setLoading(true);
        try {
          const response = await apiService.get('/admin/settings');
          const data = response.data;
          setNotificationSettings({
            emailNotifications: !!data.email_notification,
            smsNotifications: !!data.sms_notification,
            emailBookingConfirmation: !!data.booking_confirmation_email,
            smsBookingConfirmation: !!data.booking_confirmation_sms,
          });
          setLoading(false);
        } catch (error) {
          setError('Failed to load notification settings');
          setLoading(false);
        }
      };

      fetchNotificationSettings();
    }, []);

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiService.post('/admin/settings/notification', {
        email_notification: notificationSettings.emailNotifications,
        sms_notification: notificationSettings.smsNotifications,
        booking_confirmation_email: notificationSettings.emailBookingConfirmation,
        booking_confirmation_sms: notificationSettings.smsBookingConfirmation,
      });
      toast.success('Notification settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save notification settings');
      setError('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center p-6">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>
      )}

      {/* Tab Navigation */}
      {!loading && !error && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex flex-wrap gap-2" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                aria-label={`Switch to ${tab.name}`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      {!loading && !error && (
        <div className="space-y-6">
          {activeTab === 'system' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CogIcon className="w-6 h-6 mr-2 text-gray-500" />
                System Settings
              </h2>
              <form onSubmit={handleSystemSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Name</label>
                  <input
                    type="text"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Site name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                  <select
                    value={systemSettings.defaultCurrency}
                    onChange={(e) => setSystemSettings({ ...systemSettings, defaultCurrency: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Default currency"
                  >
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    value={systemSettings.timezone}
                    onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Timezone"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Language</label>
                  <select
                    value={systemSettings.language}
                    onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Language"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                  <input
                    type="number"
                    value={systemSettings.maxLoginAttempts}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maxLoginAttempts: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                    aria-label="Maximum login attempts"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Enable maintenance mode"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable Maintenance Mode</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Save system settings"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <EnvelopeIcon className="w-6 h-6 mr-2 text-gray-500" />
                Email API
              </h2>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="SMTP host"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                  <input
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    placeholder="587"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="SMTP port"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Key</label>
                  <input
                    type="text"
                    value={emailSettings.smtpKey}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpKey: e.target.value })}
                    placeholder="your-smtp-key"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="SMTP key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Encryption</label>
                  <select
                    value={emailSettings.encryption}
                    onChange={(e) => setEmailSettings({ ...emailSettings, encryption: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="SMTP encryption"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sender Email</label>
                  <input
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                    placeholder="sender@example.com"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Sender email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Save email settings"
                >
                  {loading ? 'Saving...' : 'Save Email Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'pkfare' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <PaperAirplaneIcon className="w-6 h-6 mr-2 text-gray-500" />
                PKfare API (Flight Booking)
              </h2>
              <form onSubmit={handlePkfareSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PKfare API Base Url</label>
                  <input
                    type="text"
                    value={pkfareSettings.baseUrl}
                    onChange={(e) => setPkfareSettings({ ...pkfareSettings, baseUrl: e.target.value })}
                    placeholder="PKfare API Base Url"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="PKfare API Base Url"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PKfare Partner ID</label>
                  <input
                    type="text"
                    value={pkfareSettings.partnerId}
                    onChange={(e) => setPkfareSettings({ ...pkfareSettings, partnerId: e.target.value })}
                    placeholder="PKfare Partner ID"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="PKfare Partner ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PKfare Partner Key</label>
                  <input
                    type="text"
                    value={pkfareSettings.partnerKey}
                    onChange={(e) => setPkfareSettings({ ...pkfareSettings, partnerKey: e.target.value })}
                    placeholder="your-pkfare-key"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="PKfare Partner key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Environment</label>
                  <select
                    value={pkfareSettings.environment}
                    onChange={(e) => setPkfareSettings({ ...pkfareSettings, environment: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="PKfare environment"
                  >
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request Timeout (seconds)</label>
                  <input
                    type="number"
                    value={pkfareSettings.timeout}
                    onChange={(e) => setPkfareSettings({ ...pkfareSettings, timeout: parseInt(e.target.value) || 30 })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                    aria-label="PKfare request timeout"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Save PKfare settings"
                >
                  {loading ? 'Saving...' : 'Save PKfare Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCardIcon className="w-6 h-6 mr-2 text-gray-500" />
                Payment APIs
              </h2>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stripe API Key</label>
                  <input
                    type="text"
                    value={paymentSettings.stripeApiKey}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeApiKey: e.target.value })}
                    placeholder="your-stripe-key"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Stripe API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PayPal Client ID</label>
                  <input
                    type="text"
                    value={paymentSettings.paypalClientId}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalClientId: e.target.value })}
                    placeholder="your-paypal-client-id"
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="PayPal client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supported Currencies</label>
                  <select
                    multiple
                    value={paymentSettings.supportedCurrencies}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      supportedCurrencies: Array.from(e.target.selectedOptions, option => option.value),
                    })}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Supported currencies"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={paymentSettings.stripeTestMode}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeTestMode: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Enable Stripe test mode"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable Stripe Test Mode</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={paymentSettings.paypalTestMode}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalTestMode: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Enable PayPal test mode"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable PayPal Test Mode</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Save payment settings"
                >
                  {loading ? 'Saving...' : 'Save Payment Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notification' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <BellIcon className="w-6 h-6 mr-2 text-gray-500" />
                Notification Settings
              </h2>
              <form onSubmit={handleNotificationSubmit} className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Enable email notifications"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable Email Notifications</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Enable SMS notifications"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable SMS Notifications</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailBookingConfirmation}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailBookingConfirmation: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Send booking confirmation via email"
                  />
                  <span className="ml-2 text-sm text-gray-600">Send Booking Confirmation via Email</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsBookingConfirmation}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsBookingConfirmation: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Send booking confirmation via SMS"
                  />
                  <span className="ml-2 text-sm text-gray-600">Send Booking Confirmation via SMS</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Save notification settings"
                >
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}