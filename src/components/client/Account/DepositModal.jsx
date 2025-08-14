import React, { useContext, useState } from 'react';
import Swal from 'sweetalert2';
import 'toastr/build/toastr.min.css';
import toastr from 'toastr';
import apiService from '../../../api/apiService';
import { AuthContext } from '../../../context/AuthContext';

const DepositModal = ({ bankTransfer, onSuccess }) => {
    const { user, loading } = useContext(AuthContext);
    const [formState, setFormState] = useState({
        amount: '',
        currency: 'USD',
        payment_gateway_reference: '',
        payment_gateway: 'bank',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = {
            'type': 'wallet_topup',
            'payment_gateway': formState.payment_gateway,
            'payment_gateway_reference': formState.payment_gateway_reference,
            'amount': formState.amount,
            'currency': formState.currency,
            'user_id': user.id
            // 'attachement': formState.attachement,
        };

        try {
            const response = await apiService.post('/transactions/add', formData);
            console.log('Deposit Response:', response.data);
            if (response.data.status === 'true') {
                Swal.fire({
                    title: 'Success!',
                    text: 'Your deposit request has been submitted and is waiting for approval.',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                }).then(() => {
                    document.getElementById('depositModal').classList.remove('show');
                    document.body.classList.remove('modal-open');
                    document.querySelector('.modal-backdrop')?.remove();
                    onSuccess();
                });
            } else {
                toastr.error(response.data.message || 'Failed to submit deposit request');
            }
        } catch (error) {
            toastr.error('Error submitting deposit request');
            console.error('Submit deposit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="modal fade"
            id="depositModal"
            tabIndex="-1"
            aria-labelledby="depositModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="depositModalLabel">
                            Request Deposit
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>
                    <form id="depositForm" onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="modal-body">
                            {bankTransfer && (
                                <div className="alert alert-primary">
                                    <h6><strong>{bankTransfer.name}</strong></h6>
                                    <p className="m-0" style={{ lineHeight: '18px', fontSize: '14px' }}>
                                        {bankTransfer.c1}<br />
                                        {bankTransfer.c2}<br />
                                        {bankTransfer.c3}<br />
                                        {bankTransfer.c4}
                                    </p>
                                </div>
                            )}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Amount</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="amount"
                                        value={formState.amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Currency</label>
                                    <select
                                        className="form-select"
                                        name="currency"
                                        value={formState.currency}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="USD">USD</option>
                                        <option value="KES">KES</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Transaction Reference</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="payment_gateway_reference"
                                    value={formState.payment_gateway_reference}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Payment Gateway</label>
                                <select
                                    className="form-select"
                                    name="payment_gateway"
                                    value={formState.payment_gateway}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="bank">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Payment Proof</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    name="attachment"
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin me-2"></i>Processing...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DepositModal;