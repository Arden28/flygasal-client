import React, { useState } from 'react';

export default function Headbar({ T, rootUrl, user }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <section className="container-fluid" style={{ paddingTop: '80px', paddingLeft: '0px', paddingRight: '0px' }}>
            <div className="rounded-bottom">
                {/* Hamburger Button for Mobile */}
                <button
                    className="d-md-none btn p-2 ms-3"
                    type="button"
                    onClick={toggleMenu}
                    aria-expanded={isMenuOpen}
                    aria-label="Toggle navigation"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                {/* Menu */}
                <ul
                    className={`sidebar-menu list-items w-100 gap-3 p-2 user_menu d-flex flex-column flex-md-row ${isMenuOpen ? 'd-block' : 'd-none'} d-md-flex`}
                    style={{ backgroundColor: '#EEF4FB' }}
                >
                    <li className="rounded-3 border">
                        <a
                            className="py-2 justify-content-center w-auto d-block bg-transparent hover:bg-gray rounded-3 p-2"
                            href={`${rootUrl}/dashboard`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#000"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            </svg>{' '}
                            {T.dashboard}
                        </a>
                    </li>
                    <li className="rounded-3 border">
                        <a
                            className="py-2 justify-content-center w-auto d-block bg-transparent hover:bg-gray rounded-3 p-2"
                            href={`${rootUrl}/bookings`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#000"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5" />
                                <path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 002-2v-6l-3.4-6.9A2 2 0 0016.8 4H7.2a2 2 0 00-1.8 1.1z" />
                            </svg>{' '}
                            {T.mybookings}
                        </a>
                    </li>
                    {user.user_type === 'Agent' && (
                        <li className="rounded-3 border">
                            <a
                                className="py-2 justify-content-center w-auto d-block bg-transparent hover:bg-gray rounded-3 p-2"
                                href={`${rootUrl}/reports/${new Date().getFullYear()}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#000"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V9l-7-7z" />
                                    <path d="M13 3v6h6" />
                                </svg>{' '}
                                {T.reports}
                            </a>
                        </li>
                    )}
                    <li className="rounded-3 border">
                        <a
                            className="py-2 justify-content-center w-auto d-block bg-transparent hover:bg-gray rounded-3 p-2"
                            href={`${rootUrl}/markups`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#000"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>{' '}
                            {T.markups}
                        </a>
                    </li>
                    <li className="rounded-3 border">
                        <a
                            className="py-2 justify-content-center w-auto d-block bg-transparent hover:bg-gray rounded-3 p-2"
                            href={`${rootUrl}/deposits`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#000"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>{' '}
                            {T.deposits}
                        </a>
                    </li>
                    <li className="rounded-3 border">
                        <a
                            className="py-2 justify-content-center w-auto d-block bg-transparent hover:bg-gray rounded-3 p-2"
                            href={`${rootUrl}/agency`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#000"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 3v18h18"></path>
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                            </svg>{' '}
                            {T.agency}
                        </a>
                    </li>
                    <li className="rounded-3 border">
                        <a
                            className="py-2 justify-content-center w-auto d-block bg-transparent hover:bg-gray rounded-3 p-2"
                            href={`${rootUrl}/profile`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="d-none d-lg-block"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#000"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3" />
                                <circle cx="12" cy="10" r="3" />
                                <circle cx="12" cy="12" r="10" />
                            </svg>{' '}
                            {T.myprofile}
                        </a>
                    </li>
                </ul>
            </div>
            <style jsx>{`
                .hover\\:bg-gray:hover {
                    background-color: #e5e7eb;
                }
                @media (max-width: 767px) {
                    .sidebar-menu {
                        position: absolute;
                        top: 120px;
                        left: 0;
                        right: 0;
                        z-index: 1000;
                        background-color: #EEF4FB;
                        border-top: 1px solid #dee2e6;
                    }
                    .sidebar-menu.d-block {
                        display: block !important;
                    }
                }
            `}</style>
        </section>
    );
}
