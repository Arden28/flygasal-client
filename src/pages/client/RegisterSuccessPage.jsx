
import React from 'react';

// Mock translation object to replace PHP T::
const T = {
    your_account_has_been_created: 'Your account has been created',
    please_check_your_mailbox_for_activation: 'Please check your mailbox for activation',
};

const SignupSuccessPage = () => {
    return (
        <div className="container mt-[130px] mb-5">
            <div className="col-md-4 mx-auto">
                <div className="rounded border p-3 text-center pt-5 pb-5 bg-light">
                    <svg
                        className="mb-3"
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#000000"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <p>
                        <strong>{T.your_account_has_been_created}</strong>
                        <br />
                        {T.please_check_your_mailbox_for_activation}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupSuccessPage;