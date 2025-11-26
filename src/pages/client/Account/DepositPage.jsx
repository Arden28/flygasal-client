import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import DepositModal from "../../../components/client/Account/DepositModal";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";
import apiService from "../../../api/apiService";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, RefreshCcw, TrendingUp, TrendingDown } from "lucide-react";

const DepositPage = ({ rootUrl = "/", apiUrl = "/api/" }) => {
  const { user } = useContext(AuthContext);
  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bankTransfer, setBankTransfer] = useState(null);

  // Derived Stats
  const stats = useMemo(() => {
    if (!deposits.length) return { lastDeposit: 0, totalSpent: 0 };
    
    const lastDep = deposits.find(d => Number(d.amount) > 0);
    const spent = deposits.reduce((acc, curr) => {
       const amt = Number(curr.amount);
       return amt < 0 ? acc + Math.abs(amt) : acc;
    }, 0);

    return {
       lastDeposit: lastDep ? Number(lastDep.amount) : 0,
       totalSpent: spent
    };
  }, [deposits]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [txRes, gwRes] = await Promise.all([
           apiService.get("/transactions"),
           apiService.post("/payment_gateways", { api_key: "none" })
        ]);
        
        const rows = txRes?.data?.data ?? [];
        setDeposits(Array.isArray(rows) ? rows : []);
        
        if (gwRes?.data?.status === "true") {
           setBankTransfer(gwRes.data.data?.[0] || null);
        }
      } catch (e) { console.error(e); } 
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [user]);

  const handleDepositSuccess = () => { window.location.reload(); };

  const formatAmount = (amt, curr) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: curr || "USD" }).format(amt); }
    catch { return amt; }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           {/* Wallet Summary Card */}
           <div className="md:col-span-2 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#EB7313] via-[#d6620a] to-[#b8560b] text-white shadow-2xl shadow-orange-500/25 p-8 flex flex-col justify-between min-h-[260px]">
              {/* Abstract Shapes */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-sm font-medium mb-4">
                       <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                       <span>Active Wallet</span>
                    </div>
                    <p className="text-orange-100 text-lg">Available Balance</p>
                    <h2 className="text-5xl font-bold tracking-tight mt-1">{formatAmount(user?.wallet_balance || 0, user?.currency)}</h2>
                 </div>
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                    <CreditCard size={24} className="text-white" />
                 </div>
              </div>

              <div className="relative z-10 mt-auto pt-8 flex flex-wrap gap-4">
                 <button 
                    data-bs-toggle="modal" 
                    data-bs-target="#depositModal"
                    className="px-8 py-3.5 bg-white text-[#EB7313] font-bold rounded-2xl shadow-xl hover:bg-orange-50 hover:scale-[1.02] transition-all flex items-center gap-2.5"
                 >
                    <ArrowDownLeft size={20} strokeWidth={2.5} />
                    {T.add_funds || "Add Funds"}
                 </button>
                 <button className="px-8 py-3.5 bg-black/20 backdrop-blur-md border border-white/20 hover:bg-black/30 text-white font-semibold rounded-2xl transition-all">
                    View Reports
                 </button>
              </div>
           </div>

           {/* Real Stats Card */}
           <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                 <Wallet size={120} className="text-[#EB7313]" />
              </div>
              
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Overview</h3>
              
              <div className="space-y-8 relative z-10">
                 <div>
                    <div className="flex items-center gap-2 mb-1 text-green-600">
                       <div className="p-1.5 bg-green-100 rounded-lg"><TrendingUp size={14} /></div>
                       <span className="text-sm font-bold">Last Deposit</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{formatAmount(stats.lastDeposit, user?.currency)}</div>
                 </div>
                 
                 <div className="w-full h-px bg-slate-100"></div>
                 
                 <div>
                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                       <div className="p-1.5 bg-slate-100 rounded-lg"><TrendingDown size={14} /></div>
                       <span className="text-sm font-bold">Total Spent</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{formatAmount(stats.totalSpent, user?.currency)}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <h3 className="font-bold text-lg text-slate-800">Transaction History</h3>
                 <span className="px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">{deposits.length}</span>
              </div>
              <button 
                 onClick={() => window.location.reload()} 
                 className="p-2.5 text-slate-400 hover:text-[#EB7313] hover:bg-orange-50 rounded-xl transition-all"
                 title="Refresh"
              >
                 <RefreshCcw size={18} />
              </button>
           </div>
           
           <div className="divide-y divide-slate-50">
              {isLoading ? (
                 [...Array(5)].map((_,i) => <div key={i} className="p-6 h-20 bg-slate-50/30 animate-pulse"></div>)
              ) : deposits.length === 0 ? (
                 <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                       <RefreshCcw size={24} />
                    </div>
                    <p className="text-slate-500 font-medium">No transactions found yet.</p>
                 </div>
              ) : (
                 deposits.map((d) => {
                    const isPositive = Number(d.amount) > 0;
                    return (
                       <div key={d.id} className="px-8 py-5 flex items-center justify-between hover:bg-[#FFF7ED]/40 transition-colors group cursor-default">
                          <div className="flex items-center gap-5">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-white ${
                                isPositive ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'
                             }`}>
                                {isPositive ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                             </div>
                             <div>
                                <div className="font-bold text-slate-900 text-base mb-0.5">
                                  {d.trx_id || d.id}
                                  {/* 2. The Badge */}
                                  <span className={`
                                    inline-flex items-center ml-2 px-2 py-0.5 rounded-full border 
                                    text-[11px] font-medium uppercase tracking-wide
                                    
                                  `}>
                                    {d.payment_gateway || d.method || (isPositive ? "Wallet Top-up" : "Purchase")}
                                  </span>
                                </div>
                                <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                   <span>{new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                                   <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                   <span className="font-mono">#{d.trx_id}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className={`font-bold text-lg font-mono mb-1 ${isPositive ? 'text-green-600' : 'text-slate-900'}`}>
                                {isPositive ? '+' : ''}{formatAmount(d.amount, d.currency)}
                             </div>
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                d.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                             }`}>
                                {d.status}
                             </span>
                          </div>
                       </div>
                    );
                 })
              )}
           </div>
        </div>

      </div>

      <DepositModal apiUrl={apiUrl} rootUrl={rootUrl} user={user} bankTransfer={bankTransfer} onSuccess={handleDepositSuccess} />
    </div>
  );
};

export default DepositPage;