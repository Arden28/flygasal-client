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
    // Simulate async action
    setTimeout(() => {
      setLoading(false);
      setNewsletter({ name: "", email: "" });
      // Add your newsletter signup logic here
    }, 1500);
  };

  return (
    <footer className="bg-light footer-area">
      <div className="container">
        <hr className="pt-5 m-0" />
      </div>
      <div className="container">
        <div className="row g-0">
          <div className="col-lg-12 responsive-column">
            <ul className="foot_menu w-100">
              <li className="footm row w-100">
                <ul className="dropdown-menu-item row">
                  <li className="col-md-3">
                    <a href="/page/about" className="fadeout waves-effect">
                      About Us
                    </a>
                  </li>
                  <li className="col-md-3">
                    <a href="/page/privacy" className="fadeout waves-effect">
                      Privacy Policy
                    </a>
                  </li>
                  <li className="col-md-3">
                    <a href="/page/terms" className="fadeout waves-effect">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
      </div>
        <div className="row my-3">
          <div className="section-block mt-4"></div>
        </div>
        <div className="row align-items-center g-0 mt-4 rounded-4">
          <div className="col-md-12 mb-4">
            <div className="row">
              <div className="col-md-1 col-4">
                <a href="/" className="foot__logo">
                  <img
                    className="w-100 logo"
                    style={{ background: "transparent", borderRadius: "4px" }}
                    src="/assets/uploads/global/favicon.png"
                    alt="logo"
                  />
                </a>
              </div>
              <div className="col-md-2 col-8">
                <div className="d-block d-lg-none">
                  <div className="py-2"></div>
                </div>
                <ul className="list-items" style={{ lineHeight: "20px" }}>
                  <li>
                    <strong>+1-800-123-4567</strong>
                  </li>
                  <li>
                    <strong>
                      <a
                        href="mailto:support@travelplatform.com"
                        className="waves-effect"
                      >
                        support@travelplatform.com
                      </a>
                    </strong>
                  </li>
                  <li>
                    <a href="/page/contact" className="waves-effect">
                      <strong>Contact Us</strong>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-md-9">
                <form className="rounded-2" onSubmit={handleSubmit}>
                  <div className="row g-2">
                    <div className="col-12 col-md-4">
                      <div className="form-floating">
                        <input
                          type="text"
                          placeholder=" "
                          name="name"
                          value={newsletter.name}
                          onChange={handleChange}
                          className="newsletter_name form-control"
                          required
                        />
                        <label>Name</label>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="form-floating">
                        <input
                          type="email"
                          placeholder=" "
                          name="email"
                          value={newsletter.email}
                          onChange={handleChange}
                          className="newsletter_email form-control"
                          required
                        />
                        <label>Email</label>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <button
                        className="subscribe btn btn-primary w-100 h-100"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          "Signup Newsletter"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <hr />
          <div className="col-lg-4">
            <div className="term-box footer-item">
              <ul className="list-items list--items align-items-center text-start text-lg-start text-md-center text-center text-dark">
                © {new Date().getFullYear()} FlyGasal. All rights reserved.
              </ul>
            </div>
          </div>
          <div className="col-lg-4"></div>
          <div className="col-lg-4">
            <div className="footer-social-box float-center float-lg-end">
              <ul className="social-profile align-items-center text-start text-lg-start text-md-center text-center" style={{ display: "flex", gap: "12px", padding: 0, listStyle: "none" }}>
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-5"
                    style={{
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      transition: "background 0.2s",
                    }}
                  >
                    <i className="bi bi-facebook"></i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-5"
                    style={{
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      transition: "background 0.2s",
                    }}
                  >
                    <i className="bi bi-twitter"></i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-5"
                    style={{
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      transition: "background 0.2s",
                    }}
                  >
                    <i className="bi bi-linkedin"></i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-5"
                    style={{
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      transition: "background 0.2s",
                    }}
                  >
                    <i className="bi bi-instagram"></i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-5"
                    style={{
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      transition: "background 0.2s",
                    }}
                  >
                    <i className="bi bi-youtube"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
