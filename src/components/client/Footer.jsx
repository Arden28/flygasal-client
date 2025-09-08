import React, { useState } from "react";

export default function Footer() {
  const [newsletter, setNewsletter] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setNewsletter({ ...newsletter, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setNewsletter({ name: "", email: "" });
    }, 1500);
  };

 

  return (
    <footer className="bg-gray-50 text-gray-700 pt-16 pb-8">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      {/* Logo and Contact Info */}
      <div className="space-y-6">
        <a href="/" className="inline-block">
          <img
            className="h-12 w-auto"
            src="/assets/img/logo/flygasal.png"
            alt="FlyGasal Logo"
          />
        </a>
        <ul className="space-y-2 text-sm">
          <li className="font-semibold text-gray-900">+1-800-123-4567</li>
          <li>
            <a
              href="mailto:support@travelplatform.com"
              className="hover:text-blue-600 transition-colors"
            >
              support@travelplatform.com
            </a>
          </li>
          <li>
            <a
              href="/page/contact"
              className="hover:text-blue-600 transition-colors"
            >
              Contact Us
            </a>
          </li>
        </ul>
      </div>

      {/* Navigation Links */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Company</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="/about" className="hover:text-blue-600 transition-colors">
              About Us
            </a>
          </li>
          <li>
            <a href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="/page/terms" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </a>
          </li>
        </ul>
      </div>

      {/* Newsletter Signup */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Newsletter</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              name="name"
              value={newsletter.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={newsletter.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 mr-2"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      </div>
    </div>

    {/* Divider */}
    <hr className="my-12 border-gray-200" />

    {/* Bottom Section */}
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm text-gray-500">
        © {new Date().getFullYear()} <span className="font-semibold">FlyGasal</span>. All rights reserved.
      </p>
      <ul className="flex gap-3">
        {[
          { href: "https://facebook.com", icon: "bi bi-facebook" },
          { href: "https://twitter.com", icon: "bi bi-twitter" },
          { href: "https://linkedin.com", icon: "bi bi-linkedin" },
          { href: "https://instagram.com", icon: "bi bi-instagram" },
          { href: "https://youtube.com", icon: "bi bi-youtube" },
        ].map((social, index) => (
          <li key={index}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
            >
              <i className={social.icon}></i>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </div>
</footer>

  );
}