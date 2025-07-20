import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCardIcon, DocumentArrowDownIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('dateRange');
  const [reportMonth, setReportMonth] = useState('');
  const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data
  useEffect(() => {
    const mockTransactions = [
      {
        id: 'TXN001',
        date: '2025-07-20',
        type: 'Booking',
        amount: 310,
        currency: 'USD',
        status: 'Completed',
        traveller: 'John Doe',
        email: 'john.doe@example.com',
        bookingId: 'AT9002',
        paymentMethod: 'Visa',
      },
      {
        id: 'TXN002',
        date: '2025-07-19',
        type: 'Refund',
        amount: 150,
        currency: 'USD',
        status: 'Pending',
        traveller: 'Jane Smith',
        email: 'jane.smith@example.com',
        bookingId: 'BKG67890',
        paymentMethod: 'PayPal',
      },
      {
        id: 'TXN003',
        date: '2025-07-18',
        type: 'Wallet Deposit',
        amount: 500,
        currency: 'USD',
        status: 'Completed',
        traveller: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        bookingId: null,
        paymentMethod: 'MasterCard',
      },
    ];
    setTransactions(mockTransactions);
    setLoading(false);
    // Future API call: GET /api/transactions
    // fetch('https://your-laravel-api.com/api/transactions')
    //   .then(res => res.json())
    //   .then(data => setTransactions(data.data))
    //   .catch(err => setError('Failed to fetch transactions'))
    //   .finally(() => setLoading(false));
  }, []);

  // Sorting logic
  const sortedTransactions = useMemo(() => {
    let sortableTransactions = [...transactions];
    if (sortConfig.key) {
      sortableTransactions.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableTransactions;
  }, [transactions, sortConfig]);

  // Filtering logic
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(transaction => {
      const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.traveller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || transaction.type === typeFilter;
      const matchesStatus = !statusFilter || transaction.status === statusFilter;
      const matchesDate = (!dateFilter.start || transaction.date >= dateFilter.start) &&
                         (!dateFilter.end || transaction.date <= dateFilter.end);
      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [sortedTransactions, searchTerm, typeFilter, statusFilter, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredTransactions.map(transaction => ({
      'Transaction ID': transaction.id,
      'Date': transaction.date,
      'Type': transaction.type,
      'Amount': `${transaction.currency} ${transaction.amount.toFixed(2)}`,
      'Status': transaction.status,
      'Traveller': transaction.traveller,
      'Email': transaction.email,
      'Booking ID': transaction.bookingId || 'N/A',
      'Payment Method': transaction.paymentMethod,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.sheet_add_aoa(worksheet, [['Transaction ID', 'Date', 'Type', 'Amount', 'Status', 'Traveller', 'Email', 'Booking ID', 'Payment Method']], { origin: 'A1' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'transactions_export.xlsx');
    toast.success('Exported to Excel successfully!');
  };

  // Generate PDF Invoice
  const generateInvoicePDF = (transaction) => {
    const latexContent = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{tabularx}
\\usepackage{fancyhdr}
\\usepackage{colortbl}
\\usepackage{xcolor}
\\usepackage{noto}
\\definecolor{headerblue}{RGB}{0, 102, 204}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\textbf{Travel Agency}}
\\fancyhead[R]{\\includegraphics[height=1cm]{/assets/img/logo.png}}
\\fancyfoot[C]{\\small Contact: support@travelagency.com | +1-800-123-4567}
\\renewcommand{\\headrulewidth}{0.4pt}
\\begin{document}
\\begin{center}
  \\vspace*{1cm}
  \\textbf{\\Large Transaction Invoice} \\\\
  \\vspace{0.5cm}
  \\color{headerblue}\\rule{\\textwidth}{2pt}
\\end{center}
\\vspace{0.5cm}
\\begin{tabularx}{\\textwidth}{|>{\\raggedright\\arraybackslash}X|>{\\raggedright\\arraybackslash}X|}
  \\hline
  \\rowcolor{headerblue!20} \\textbf{Field} & \\textbf{Details} \\\\
  \\hline
  Transaction ID & ${transaction.id} \\\\
  \\hline
  Date & ${transaction.date} \\\\
  \\hline
  Type & ${transaction.type} \\\\
  \\hline
  Amount & ${transaction.currency} ${transaction.amount.toFixed(2)} \\\\
  \\hline
  Status & ${transaction.status} \\\\
  \\hline
  Traveller & ${transaction.traveller} \\\\
  \\hline
  Email & ${transaction.email} \\\\
  \\hline
  Booking ID & ${transaction.bookingId || 'N/A'} \\\\
  \\hline
  Payment Method & ${transaction.paymentMethod} \\\\
  \\hline
\\end{tabularx}
\\vspace{1cm}
\\begin{center}
  \\small Issued on: July 20, 2025
\\end{center}
\\end{document}
`;
    // Simulate PDF compilation (mock PDF blob)
    // In production, send LaTeX to backend for compilation with latexmk
    const mockPdfContent = `PDF content for invoice ${transaction.id}`; // Placeholder for compiled PDF
    const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${transaction.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice PDF downloaded successfully!');
    // Future API call: POST /api/transactions/:id/invoice
    // fetch('https://your-laravel-api.com/api/transactions/invoice', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ latexContent })
    // })
    //   .then(res => res.blob())
    //   .then(blob => {
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `invoice_${transaction.id}.pdf`;
    //     a.click();
    //     URL.revokeObjectURL(url);
    //     toast.success('Invoice PDF downloaded successfully!');
    //   })
    //   .catch(err => toast.error('Failed to generate invoice PDF'));
  };

  // Generate Report
  const generateReport = (format) => {
    if (reportType === 'dateRange' && (!reportDateRange.start || !reportDateRange.end)) {
      toast.error('Please select both start and end dates for date range report.');
      return;
    }
    if (reportType === 'monthly' && !reportMonth) {
      toast.error('Please select a month for monthly report.');
      return;
    }

    const filteredReportData = reportType === 'dateRange'
      ? transactions.filter(t => (!reportDateRange.start || t.date >= reportDateRange.start) && (!reportDateRange.end || t.date <= reportDateRange.end))
      : transactions.filter(t => t.date.startsWith(reportMonth));
    
    if (format === 'excel') {
      const exportData = filteredReportData.map(t => ({
        'Transaction ID': t.id,
        'Date': t.date,
        'Type': t.type,
        'Amount': `${t.currency} ${t.amount.toFixed(2)}`,
        'Status': t.status,
        'Traveller': t.traveller,
        'Email': t.email,
        'Booking ID': t.bookingId || 'N/A',
        'Payment Method': t.paymentMethod,
      }));
      const summary = {
        'Total Transactions': filteredReportData.length,
        'Total Amount': `${filteredReportData[0]?.currency || 'USD'} ${filteredReportData.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`,
        'Bookings': filteredReportData.filter(t => t.type === 'Booking').length,
        'Refunds': filteredReportData.filter(t => t.type === 'Refund').length,
        'Wallet Deposits': filteredReportData.filter(t => t.type === 'Wallet Deposit').length,
        'Completed': filteredReportData.filter(t => t.status === 'Completed').length,
        'Pending': filteredReportData.filter(t => t.status === 'Pending').length,
        'Failed': filteredReportData.filter(t => t.status === 'Failed').length,
      };
      const worksheet = XLSX.utils.json_to_sheet([summary, {}, ...exportData]);
      XLSX.utils.sheet_add_aoa(worksheet, [['Report Summary'], Object.keys(summary), Object.values(summary), [''], ['Transaction ID', 'Date', 'Type', 'Amount', 'Status', 'Traveller', 'Email', 'Booking ID', 'Payment Method']], { origin: 'A1' });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `transactions_report_${reportType === 'dateRange' ? 'date_range' : reportMonth}.xlsx`);
      toast.success('Report exported to Excel successfully!');
    } else {
      const summary = {
        total: filteredReportData.length,
        totalAmount: filteredReportData.reduce((sum, t) => sum + t.amount, 0).toFixed(2),
        currency: filteredReportData[0]?.currency || 'USD',
        bookings: filteredReportData.filter(t => t.type === 'Booking').length,
        refunds: filteredReportData.filter(t => t.type === 'Refund').length,
        walletDeposits: filteredReportData.filter(t => t.type === 'Wallet Deposit').length,
        completed: filteredReportData.filter(t => t.status === 'Completed').length,
        pending: filteredReportData.filter(t => t.status === 'Pending').length,
        failed: filteredReportData.filter(t => t.status === 'Failed').length,
      };
      const latexContent = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{tabularx}
\\usepackage{fancyhdr}
\\usepackage{colortbl}
\\usepackage{xcolor}
\\usepackage{noto}
\\definecolor{headerblue}{RGB}{0, 102, 204}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\textbf{Travel Agency}}
\\fancyhead[R]{\\includegraphics[height=1cm]{/assets/img/logo.png}}
\\fancyfoot[C]{\\small Contact: support@travelagency.com | +1-800-123-4567}
\\renewcommand{\\headrulewidth}{0.4pt}
\\begin{document}
\\begin{center}
  \\vspace*{1cm}
  \\textbf{\\Large Transaction Report} \\\\
  \\vspace{0.5cm}
  \\color{headerblue}\\rule{\\textwidth}{2pt}
\\end{center}
\\vspace{0.5cm}
\\section*{Summary}
\\begin{tabularx}{\\textwidth}{|>{\\raggedright\\arraybackslash}X|>{\\raggedright\\arraybackslash}X|}
  \\hline
  \\rowcolor{headerblue!20} \\textbf{Metric} & \\textbf{Value} \\\\
  \\hline
  Total Transactions & ${summary.total} \\\\
  \\hline
  Total Amount & ${summary.currency} ${summary.totalAmount} \\\\
  \\hline
  Bookings & ${summary.bookings} \\\\
  \\hline
  Refunds & ${summary.refunds} \\\\
  \\hline
  Wallet Deposits & ${summary.walletDeposits} \\\\
  \\hline
  Completed & ${summary.completed} \\\\
  \\hline
  Pending & ${summary.pending} \\\\
  \\hline
  Failed & ${summary.failed} \\\\
  \\hline
\\end{tabularx}
\\vspace{0.5cm}
\\section*{Transactions}
\\begin{tabularx}{\\textwidth}{|>{\\raggedright\\arraybackslash}X|>{\\raggedright\\arraybackslash}X|>{\\raggedright\\arraybackslash}X|>{\\raggedright\\arraybackslash}X|>{\\raggedright\\arraybackslash}X|}
  \\hline
  \\rowcolor{headerblue!20} \\textbf{ID} & \\textbf{Date} & \\textbf{Type} & \\textbf{Amount} & \\textbf{Status} \\\\
  \\hline
${filteredReportData.map(t => `${t.id} & ${t.date} & ${t.type} & ${t.currency} ${t.amount.toFixed(2)} & ${t.status} \\\\ \\hline`).join('\n')}
\\end{tabularx}
\\vspace{1cm}
\\begin{center}
  \\small Generated on: July 20, 2025
\\end{center}
\\end{document}
`;
      // Simulate PDF compilation (mock PDF blob)
      // In production, send LaTeX to backend for compilation with latexmk
      const mockPdfContent = `PDF content for report ${reportType === 'dateRange' ? 'date_range' : reportMonth}`; // Placeholder for compiled PDF
      const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_report_${reportType === 'dateRange' ? 'date_range' : reportMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report PDF downloaded successfully!');
      // Future API call: POST /api/transactions/report
      // fetch('https://your-laravel-api.com/api/transactions/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ latexContent, reportType, reportDateRange, reportMonth })
      // })
      //   .then(res => res.blob())
      //   .then(blob => {
      //     const url = URL.createObjectURL(blob);
      //     const a = document.createElement('a');
      //     a.href = url;
      //     a.download = `transactions_report_${reportType === 'dateRange' ? 'date_range' : reportMonth}.pdf`;
      //     a.click();
      //     URL.revokeObjectURL(url);
      //     toast.success('Report PDF downloaded successfully!');
      //   })
      //   .catch(err => toast.error('Failed to generate report PDF'));
    }
    setShowReportModal(false);
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle transaction selection
  const handleSelectTransaction = (id) => {
    setSelectedTransactions(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    setTransactions(transactions.map(t =>
      selectedTransactions.includes(t.id) ? { ...t, status: action === 'complete' ? 'Completed' : 'Failed' } : t
    ));
    setAuditLog([...auditLog, { action: `Bulk ${action} for ${selectedTransactions.length} transactions`, timestamp: new Date().toISOString() }]);
    toast.success(`Bulk ${action} completed for ${selectedTransactions.length} transactions!`);
    setSelectedTransactions([]);
    // Future API call: POST /api/transactions/bulk
  };

  // Handle delete
  const handleDelete = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setAuditLog([...auditLog, { action: `Deleted transaction ${id}`, timestamp: new Date().toISOString() }]);
    toast.success('Transaction deleted successfully!');
    setShowDeleteModal(null);
    // Future API call: DELETE /api/transactions/:id
  };

  // Handle edit
  const handleEdit = (transaction) => {
    setEditTransaction({ ...transaction });
  };

  // Handle save edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTransaction.amount || editTransaction.amount < 0) {
      toast.error('Please fill all fields correctly.');
      return;
    }
    setTransactions(transactions.map(t =>
      t.id === editTransaction.id ? editTransaction : t
    ));
    setAuditLog([...auditLog, { action: `Edited transaction ${editTransaction.id}`, timestamp: new Date().toISOString() }]);
    toast.success('Transaction updated successfully!');
    setEditTransaction(null);
    // Future API call: PUT /api/transactions/:id
  };

  return (
    <div className="relative max-w-7xl mx-auto p-2 sm:p-2">
        
      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow p-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Transactions Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 text-xs"
            aria-label="Generate report"
          >
            Generate Report
          </button>
          <Link to="/" className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 text-xs" aria-label="Back to dashboard">
            Back
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              placeholder="Transaction ID, Traveller, or Email"
              aria-label="Search by transaction ID, traveller, or email"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Search</label>
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Filter by type"
            >
              <option value="">All Types</option>
              <option value="Booking">Booking</option>
              <option value="Refund">Refund</option>
              <option value="Wallet Deposit">Wallet Deposit</option>
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Type</label>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Status</label>
          </div>
          <div className="relative">
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Filter by start date"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">Start Date</label>
          </div>
          <div className="relative">
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Filter by end date"
            />
            <label className="absolute top-0 left-2 -translate-y-1/2 bg-white px-1 text-xs text-gray-600">End Date</label>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportToExcel}
            className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 text-xs"
            aria-label="Export transactions to Excel"
          >
            <DocumentArrowDownIcon className="w-4 h-4 inline-block mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="flex overflow-x-auto mb-6 gap-2 py-2">
        {[
          { label: 'All', value: '', count: filteredTransactions.length },
          { label: 'Completed', value: 'Completed', count: filteredTransactions.filter(t => t.status === 'Completed').length },
          { label: 'Pending', value: 'Pending', count: filteredTransactions.filter(t => t.status === 'Pending').length },
          { label: 'Failed', value: 'Failed', count: filteredTransactions.filter(t => t.status === 'Failed').length },
        ].map(({ label, value, count }) => (
          <div
            key={label}
            onClick={() => setStatusFilter(value)}
            className={`p-3 border rounded-lg cursor-pointer min-w-[100px] flex-shrink-0 ${
              statusFilter === value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white'
            }`}
            aria-label={`Filter by ${label} status`}
          >
            <span className="text-xs">{label}</span>
            <strong className={`text-sm ${statusFilter === value ? 'text-indigo-600' : 'text-gray-800'}`}>{count}</strong>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => handleBulkAction('complete')}
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs"
            aria-label="Mark selected transactions as completed"
          >
            Complete Selected
          </button>
          <button
            onClick={() => handleBulkAction('fail')}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
            aria-label="Mark selected transactions as failed"
          >
            Fail Selected
          </button>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && <div className="flex justify-center p-6"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}
      {error && <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

      {/* Desktop Table */}
      {!loading && !error && (
        <div className="hidden md:block bg-white shadow rounded-lg max-w-full overflow-x-auto">
          <table className="min-w-[1200px] divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={() => setSelectedTransactions(
                      selectedTransactions.length === filteredTransactions.length ? [] : filteredTransactions.map(t => t.id)
                    )}
                    aria-label="Select all transactions"
                  />
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                  Transaction ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                  Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>
                  Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                  Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Traveller</th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Booking ID</th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Payment Method</th>
                <th className="p-2 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      aria-label={`Select transaction ${transaction.id}`}
                    />
                  </td>
                  <td className="p-2 truncate">{transaction.id}</td>
                  <td className="p-2 truncate">{transaction.date}</td>
                  <td className="p-2 truncate">{transaction.type}</td>
                  <td className="p-2"><strong>{transaction.currency} {transaction.amount.toFixed(2)}</strong></td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                        transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.status === 'Completed' && <CheckIcon className="w-4 h-4 mr-1" />}
                      {transaction.status === 'Pending' && <CheckIcon className="w-4 h-4 mr-1" />}
                      {transaction.status === 'Failed' && <XMarkIcon className="w-4 h-4 mr-1" />}
                      {transaction.status}
                    </span>
                  </td>
                  <td className="p-2 truncate">{transaction.traveller}</td>
                  <td className="p-2 truncate">{transaction.email}</td>
                  <td className="p-2 truncate">{transaction.bookingId || 'N/A'}</td>
                  <td className="p-2 truncate">{transaction.paymentMethod}</td>
                  <td className="p-2 flex flex-col gap-2">
                    <button
                      onClick={() => generateInvoicePDF(transaction)}
                      className="flex items-center px-2 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-xs"
                      aria-label={`Download invoice for transaction ${transaction.id}`}
                    >
                      <DocumentTextIcon className="w-4 h-4 mr-1" />
                      Invoice
                    </button>
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                      aria-label={`Edit transaction ${transaction.id}`}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(transaction.id)}
                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                      aria-label={`Delete transaction ${transaction.id}`}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedTransactions.length === 0 && (
            <div className="p-4 text-center text-gray-500">No transactions found.</div>
          )}
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="md:hidden space-y-4">
          {paginatedTransactions.map((transaction) => (
            <div key={transaction.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedTransactions.includes(transaction.id)}
                  onChange={() => handleSelectTransaction(transaction.id)}
                  className="mr-2"
                  aria-label={`Select transaction ${transaction.id}`}
                />
                <CreditCardIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="font-medium text-sm">{transaction.id}</span>
              </div>
              <p className="text-xs text-gray-600">Date: {transaction.date}</p>
              <p className="text-xs text-gray-600">Type: {transaction.type}</p>
              <p className="text-xs text-gray-600">Amount: {transaction.currency} {transaction.amount.toFixed(2)}</p>
              <p className="text-xs text-gray-600">
                Status: <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                    transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  {transaction.status === 'Completed' && <CheckIcon className="w-3 h-3 mr-1" />}
                  {transaction.status === 'Pending' && <CheckIcon className="w-3 h-3 mr-1" />}
                  {transaction.status === 'Failed' && <XMarkIcon className="w-3 h-3 mr-1" />}
                  {transaction.status}
                </span>
              </p>
              <p className="text-xs text-gray-600">Traveller: {transaction.traveller}</p>
              <p className="text-xs text-gray-600">Email: {transaction.email}</p>
              <p className="text-xs text-gray-600">Booking ID: {transaction.bookingId || 'N/A'}</p>
              <p className="text-xs text-gray-600">Payment Method: {transaction.paymentMethod}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => generateInvoicePDF(transaction)}
                  className="flex items-center px-2 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-xs"
                  aria-label={`Download invoice for transaction ${transaction.id}`}
                >
                  <DocumentTextIcon className="w-3 h-3 mr-1" />
                  Invoice
                </button>
                <button
                  onClick={() => handleEdit(transaction)}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label={`Edit transaction ${transaction.id}`}
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(transaction.id)}
                  className="flex items-center px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                  aria-label={`Delete transaction ${transaction.id}`}
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {paginatedTransactions.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">No transactions found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Show</span>
            <select
              value={transactionsPerPage}
              onChange={(e) => setTransactionsPerPage(parseInt(e.target.value))}
              className="p-2 border rounded-lg text-xs"
              aria-label="Select number of transactions per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-gray-600">per page</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 text-xs"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 text-xs"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {!loading && !error && auditLog.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-semibold mb-4">Audit Log</h2>
          <ul className="space-y-2">
            {auditLog.map((log, index) => (
              <li key={index} className="text-xs text-gray-600">
                {log.timestamp}: {log.action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Modal */}
      {editTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">Edit Transaction</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editTransaction.amount}
                  onChange={(e) => setEditTransaction({ ...editTransaction, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                  min="0"
                  aria-label="Transaction amount"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Currency</label>
                <select
                  value={editTransaction.currency}
                  onChange={(e) => setEditTransaction({ ...editTransaction, currency: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                  aria-label="Currency"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <select
                  value={editTransaction.status}
                  onChange={(e) => setEditTransaction({ ...editTransaction, status: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                  aria-label="Transaction status"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Payment Method</label>
                <select
                  value={editTransaction.paymentMethod}
                  onChange={(e) => setEditTransaction({ ...editTransaction, paymentMethod: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                  aria-label="Payment method"
                >
                  <option value="Visa">Visa</option>
                  <option value="PayPal">PayPal</option>
                  <option value="MasterCard">MasterCard</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTransaction(null)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                  aria-label="Cancel edit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label="Save transaction changes"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-sm font-semibold mb-4">Delete Transaction</h3>
            <p className="text-xs text-gray-600 mb-4">Are you sure you want to delete this transaction?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                aria-label="Confirm deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">Generate Report</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  aria-label="Report type"
                >
                  <option value="dateRange">Date Range</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {reportType === 'dateRange' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={reportDateRange.start}
                      onChange={(e) => setReportDateRange({ ...reportDateRange, start: e.target.value })}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      required
                      aria-label="Report start date"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={reportDateRange.end}
                      onChange={(e) => setReportDateRange({ ...reportDateRange, end: e.target.value })}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      required
                      aria-label="Report end date"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700">Month</label>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    required
                    aria-label="Report month"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                  aria-label="Cancel report generation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => generateReport('excel')}
                  className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs"
                  aria-label="Generate Excel report"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => generateReport('pdf')}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                  aria-label="Generate PDF report"
                >
                  PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}