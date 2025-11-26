import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../context/AuthContext';

export default function Login({ setMessage }) {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // setMessage is optional depending on your parent prop structure, 
        // but we'll use toast for modern feedback
        if(setMessage) setMessage({ text: '', type: '' });

        try {
            await login({ email, password });
            navigate('/admin');
            toast.success("Welcome back!");
        } catch (err) {
            const msg = err.message || 'Login failed';
            if(setMessage) setMessage({ text: msg, type: 'error' });
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            
            {/* Background Decoration (Subtle Brand Mesh) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-orange-100/40 rounded-full blur-3xl -translate-y-1/2 pointer-events-none opacity-60 mix-blend-multiply"></div>
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-slate-100 rounded-full blur-3xl translate-y-1/3 pointer-events-none opacity-60"></div>

            <div className="w-full max-w-md relative z-10">
                
                {/* Logo Header */}
                <div className="flex flex-col items-center mb-8">
                    <Link to="/" className="mb-6 transform transition-transform hover:scale-105">
                        <img
                            src="/assets/img/logo/flygasal.png"
                            alt="FlyGasal"
                            className="h-12 w-auto object-contain drop-shadow-sm"
                        />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
                        <p className="text-slate-500 text-sm mt-2">Enter your credentials to access the admin panel.</p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white p-8 sm:p-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#EB7313] transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    required
                                    className="block w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#EB7313] focus:ring-4 focus:ring-[#EB7313]/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Password
                                </label>
                                <a href="#" className="text-xs font-semibold text-[#EB7313] hover:text-[#d6660f] hover:underline transition-all">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#EB7313] transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="block w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#EB7313] focus:ring-4 focus:ring-[#EB7313]/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <div className="flex items-center h-5">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="w-4 h-4 border-slate-300 rounded text-[#EB7313] focus:ring-[#EB7313]/20 cursor-pointer"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="remember" className="text-slate-600 font-medium cursor-pointer select-none">
                                    Remember this device
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 h-12 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-[0.98] ${
                                loading 
                                    ? 'bg-slate-300 cursor-wait' 
                                    : 'bg-[#EB7313] hover:bg-[#d6660f] hover:shadow-orange-500/30'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>

                        {/* Divider / Footer */}
                        {/* <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-slate-400 font-medium">Or</span>
                            </div>
                        </div> */}

                        {/* <div className="text-center">
                            <p className="text-sm text-slate-600">
                                Don’t have an account?{' '}
                                <a href="/register" className="font-bold text-slate-900 hover:text-[#EB7313] transition-colors">
                                    Contact Support
                                </a>
                            </p>
                        </div> */}
                    </form>
                </div>
                
                {/* Footer text */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} FlyGasal Admin Portal. All rights reserved.
                    </p>
                </div>

            </div>
            
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}