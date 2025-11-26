import React from 'react';
import { Mail, Check, ArrowRight, Plane } from 'lucide-react';

// Mock translation object
const T = {
    your_account_has_been_created: 'Account Created Successfully',
    please_check_your_mailbox_for_activation: 'We have sent an activation link to your email. Please verify your account to start booking.',
    go_to_dashboard: 'Continue to Dashboard',
    didnt_receive: "Didn't receive the email?",
    resend: "Click to resend",
    check_spam: "Check your spam folder"
};

const SignupSuccessPage = () => {
    const handleDashboardRedirect = () => {
        // Keeping your logic: Full page refresh redirect
        window.location.assign('/dashboard'); 
    };

    return (
        <>
            <style>{`
                :root {
                    --brand-primary: #F68221;
                    --brand-hover: #e06d0e;
                    --brand-light: #FFF7ED;
                }

                .success-bg {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    /* Sky-like gradient for travel theme */
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #fff7ed 100%);
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }

                /* Decorative Background Plane Path */
                .flight-path {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239CA3AF' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
                    z-index: 0;
                }

                .success-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid white;
                    border-radius: 24px;
                    padding: 3rem;
                    width: 100%;
                    max-width: 480px;
                    text-align: center;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);
                    position: relative;
                    z-index: 10;
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .icon-pulse-wrapper {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 2rem auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-bg {
                    width: 80px;
                    height: 80px;
                    background: var(--brand-light);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--brand-primary);
                    position: relative;
                    z-index: 2;
                }

                .pulse-ring {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    border-radius: 50%;
                    border: 2px solid var(--brand-primary);
                    opacity: 0;
                    animation: pulse 2s infinite;
                }
                .pulse-ring:nth-child(2) { animation-delay: 0.3s; }

                .success-badge {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    background: #10B981;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    z-index: 3;
                }

                .btn-success-action {
                    background: var(--brand-primary);
                    color: white;
                    border: none;
                    padding: 0 2rem;
                    height: 52px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    transition: all 0.2s;
                    cursor: pointer;
                    margin-top: 2rem;
                    box-shadow: 0 4px 6px -1px rgba(246, 130, 33, 0.2);
                }
                .btn-success-action:hover {
                    background: var(--brand-hover);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(246, 130, 33, 0.3);
                }

                .help-text {
                    font-size: 0.85rem;
                    color: #6B7280;
                    margin-top: 1.5rem;
                }
                .help-link {
                    color: var(--brand-primary);
                    text-decoration: none;
                    font-weight: 600;
                    cursor: pointer;
                }
                .help-link:hover { text-decoration: underline; }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.4; }
                    70% { transform: scale(1.6); opacity: 0; }
                    100% { transform: scale(1.6); opacity: 0; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="success-bg">
                {/* Decorative Background Pattern */}
                <div className="flight-path"></div>

                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-auto">
                            <div className="success-card">
                                
                                {/* Animated Icon */}
                                <div className="icon-pulse-wrapper">
                                    <div className="pulse-ring"></div>
                                    <div className="pulse-ring"></div>
                                    <div className="icon-bg">
                                        <Mail size={36} strokeWidth={1.5} />
                                    </div>
                                    <div className="success-badge">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                </div>

                                {/* Text Content */}
                                <h2 className="h3 fw-bold mb-3 text-dark">
                                    {T.your_account_has_been_created}
                                </h2>
                                
                                <p className="text-muted mb-0" style={{ lineHeight: 1.6, fontSize: '1.05rem' }}>
                                    {T.please_check_your_mailbox_for_activation}
                                </p>

                                {/* Action Button */}
                                <button
                                    className="btn-success-action"
                                    onClick={handleDashboardRedirect}
                                >
                                    <span>{T.go_to_dashboard}</span>
                                    <ArrowRight size={18} />
                                </button>

                                {/* Footer Help Text */}
                                <div className="help-text">
                                    <Plane size={14} className="me-2 inline-block text-muted" style={{transform: 'rotate(-45deg)'}} />
                                    {T.didnt_receive} <span className="help-link">{T.resend}</span>
                                    <div className="mt-1 small opacity-75">{T.check_spam}</div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignupSuccessPage;