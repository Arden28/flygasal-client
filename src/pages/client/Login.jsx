import React, { useState } from 'react';

// Mock translation object to replace PHP T::
const T = {
    login: 'Login',
    email: 'Email',
    address: 'Address',
    password: 'Password',
    rememberme: 'Remember Me',
    reset: 'Reset',
    signup: 'Sign Up',
    cancel: 'Cancel',
};

const Login = ({
    loginUrl = '/login',
    signupUrl = '/signup',
    resetPasswordUrl = '/api/forget_password',
    formToken = 'static_form_token',
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isResetLoading, setIsResetLoading] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate form submission (replace with actual API call as needed)
        setTimeout(() => {
            setIsLoading(false);
            console.log('Login form submitted');
        }, 1000);
    };

    const handleResetSubmit = (e) => {
        e.preventDefault();
        setIsResetLoading(true);
        if (!resetEmail) {
            alert('Please add email address to reset password');
            setIsResetLoading(false);
            return;
        }
        fetch(resetPasswordUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `email=${encodeURIComponent(resetEmail)}`,
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data.status === true) {
                    alert('Your password has been reset, please check your mailbox');
                    document.getElementById('reset').querySelector('.btn-close').click();
                } else if (data.status === false) {
                    alert('Invalid or no account found with this email');
                } else if (data.message === 'not_activated') {
                    alert('Your account is not activated, please contact us for activation');
                }
                setIsResetLoading(false);
                setResetEmail('');
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('An error occurred during password reset');
                setIsResetLoading(false);
            });
    };

    const handleTelegramLogin = () => {
        console.log('Telegram login callback triggered');
        // Implement Telegram SDK logic here if needed
    };

    return (
        <div className="py-5 mt-5">
            <form id="login" onSubmit={handleLoginSubmit} className="mb-5">
                <div className="container">
                    <div className="card mt-5 col-md-5 mx-auto rounded-4">
                        <div className="p-3 p-md-4">
                            <h3 className="font-bold text-2xl">{T.login}</h3>
                            <div className="form-floating mb-3">
                                <input
                                    name="email"
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    placeholder="name@example.com"
                                />
                                <label htmlFor="email">{`${T.email} ${T.address}`}</label>
                            </div>
                            <div className="form-floating mb-3">
                                <input
                                    name="password"
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    placeholder="******"
                                />
                                <label htmlFor="password">{T.password}</label>
                            </div>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-3">
                                    <input className="form-check-input m-0" type="checkbox" id="rememberchb" />
                                    <label htmlFor="rememberchb">{T.rememberme}</label>
                                </div>
                                <div>
                                    <label
                                        style={{ cursor: 'pointer' }}
                                        data-bs-toggle="modal"
                                        data-bs-target="#reset"
                                    >
                                        {`${T.reset} ${T.password}`}
                                    </label>
                                </div>
                            </div>
                            <div className="pt-0 pb-2">
                                <div className="login_button" style={{ display: isLoading ? 'none' : 'block' }}>
                                    <button
                                        style={{ height: '44px' }}
                                        type="submit"
                                        className="btn btn-primary w-100 font-bold"
                                    >
                                        <span>{T.login}</span>
                                    </button>
                                </div>
                                <div className="loading_button" style={{ display: isLoading ? 'block' : 'none' }}>
                                    <button
                                        style={{ height: '44px' }}
                                        className="gap-2 w-100 btn btn-primary rounded-sm font-bold uppercase"
                                        type="button"
                                        disabled
                                    >
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    </button>
                                </div>
                                <div className="mt-3 row">
                                    <div className="col-md-12">
                                        <a
                                            className="d-flex align-items-center justify-content-center btn btn-outline-primary"
                                            style={{ height: '44px' }}
                                            href={signupUrl}
                                        >
                                            <span className="ladda-label">{T.signup}</span>
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-3 row text-center">
                                    <hr />
                                    <div className="bg-light p-3 rounded-3 border">
                                        {/* Telegram */}
                                        <div id="fb-root" className="my-2">
                                            <button
                                                className="btn btn-primary w-[400px] h-[44px] d-flex justify-content-center"
                                                onClick={handleTelegramLogin}
                                            >
                                                <i className="bi bi-telegram fs-4"></i>
                                                <span className="p-2">Continue with Telegram</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" name="form_token" value={formToken} />
                </div>
            </form>
            <div className="modal fade" id="reset" tabIndex="-1" aria-labelledby="modal" aria-modal="true" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header bg-light">
                            <h5 className="modal-title" id="modal">{`${T.reset} ${T.password}`}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleResetSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <div className="form-floating mb-3">
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="reset_mail"
                                            placeholder="name@example.com"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                        />
                                        <label htmlFor="reset_mail">{`${T.email} ${T.address}`}</label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button
                                    style={{ height: '44px' }}
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    data-bs-dismiss="modal"
                                >
                                    {T.cancel}
                                </button>
                                <button
                                    style={{ height: '44px' }}
                                    type="submit"
                                    className="submit_buttons btn btn-primary btn-sm"
                                    style={{ display: isResetLoading ? 'none' : 'block' }}
                                >
                                    <span>{`${T.reset} ${T.email}`}</span>
                                </button>
                                <button
                                    style={{ height: '44px', width: '108px', display: isResetLoading ? 'block' : 'none' }}
                                    className="gap-2 btn btn-primary btn-sm rounded-sm"
                                    type="button"
                                    disabled
                                >
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
