import React, { useContext, useState, useEffect } from 'react';
import Headbar from '../../../components/client/Headbar';
import DepositModal from '../../../components/client/Account/DepositModal';
import { AuthContext } from '../../../context/AuthContext';
import { T } from '../../../utils/translation';
import 'toastr/build/toastr.min.css';
import toastr from 'toastr';
import apiService from '../../../api/apiService';

const DepositPage = ({ rootUrl = '/', apiUrl = '/api/' }) => {
    const { user, loading } = useContext(AuthContext);
    const [dashboardDetails, setDashboardDetails] = useState({
        balance: '0.00',
    });
    const [deposits, setDeposits] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [bankTransfer, setBankTransfer] = useState(null);

    // Fetch deposits and payment gateways
    useEffect(() => {
        const fetchDeposits = async () => {
            setIsLoading(true);
            try {

                const response = await apiService.post('/transactions', {user_id: user.id});
                
                if (response.status === 'true') {
                    setDeposits(response.data || []);
                } else {
                    toastr.error(response.message || 'Failed to fetch deposits');
                }
            } catch (error) {
                toastr.error('Error fetching deposits');
                console.error('Fetch deposits error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchPaymentGateways = async () => {
            try {
                const response = await apiService.post('/payment_gateways', { api_key: 'none'});

                const data = await response.json();
                if (response.status === 'true') {
                    const bankGateway = response.data.find((gateway) => gateway.name === 'Bank Transfer') || data.data[0];
                    setBankTransfer(bankGateway);
                } else {
                    toastr.error(response.message || 'Failed to fetch payment gateways');
                }
            } catch (error) {
                toastr.error('Error fetching payment gateways');
                console.error('Fetch payment gateways error:', error);
            }
        };

        fetchDeposits();
        fetchPaymentGateways();
    }, [apiUrl, user]);

    // Handle successful deposit submission
    const handleDepositSuccess = () => {
        window.location.reload();
    };

    return (
        <div>
            <Headbar T={T} rootUrl={rootUrl} user={user} />
            <section className="p-0">
                <div className="p-4 mb-2">
                    <h4>{T.deposits}</h4>
                    <p className="mb-0">Payment Deposits</p>
                </div>
                <div className="container py-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white py-3">
                            <div className="row align-items-center">
                                <div className="col">
                                    <p className="mb-0">Payment Deposits</p>
                                </div>
                                <div className="col text-end">
                                    <button
                                        className="btn btn-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#depositModal"
                                    >
                                        <i className="fas fa-plus me-2"></i>Request Deposit
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {isLoading ? (
                                <div className="text-center">
                                    <i className="fas fa-spinner fa-spin fa-2x"></i>
                                </div>
                            ) : (
                                <table className="display table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Currency</th>
                                            <th>Payment Method</th>
                                            <th>Status</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deposits.map((d) => (
                                            <tr key={d.trx_id}>
                                                <td>#{d.trx_id}</td>
                                                <td>{d.date}</td>
                                                <td>{d.amount}</td>
                                                <td>{d.currency}</td>
                                                <td>{d.payment_gateway}</td>
                                                <td>
                                                    {d.status === 'completed' && (
                                                        <span className="badge bg-success">Completed</span>
                                                    )}
                                                    {d.status === 'pending' && (
                                                        <span className="badge bg-warning">Pending</span>
                                                    )}
                                                    {d.status === 'failed' && (
                                                        <span className="badge bg-danger">Failed</span>
                                                    )}
                                                </td>
                                                <td>{d.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                    <DepositModal
                        apiUrl={apiUrl}
                        rootUrl={rootUrl}
                        user={user}
                        bankTransfer={bankTransfer}
                        onSuccess={handleDepositSuccess}
                    />
                </div>
            </section>
        </div>
    );
};

export default DepositPage;