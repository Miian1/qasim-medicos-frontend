import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, HeartPulse, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate('/dashboard');
    } else {
      toast.error(res.message || 'Login failed');
    }
  };

  const fillDemo = (role) => {
    if (role === 'owner') {
      setEmail('owner@qasimmedicos.com');
      setPassword('Owner@123');
    } else if (role === 'manager') {
      setEmail('manager@qasimmedicos.com');
      setPassword('Manager@123');
    } else {
      setEmail('cashier@qasimmedicos.com');
      setPassword('Cashier@123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-bg">
      {/* Left: Brand */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary to-secondary p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <HeartPulse size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Qasim Medicos</h1>
            <p className="text-xs text-white/80 uppercase tracking-wider">Pharmacy Management SaaS</p>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold leading-tight mb-4"
          >
            Run your pharmacy<br/>smarter, not harder.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg max-w-md"
          >
            Inventory, POS, customers, sales, and reports — all in one beautiful, mobile-first platform.
          </motion.p>

          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: 'Inventory', value: 'Real-time' },
              { label: 'POS', value: 'Lightning fast' },
              { label: 'Reports', value: 'Insightful' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-lg p-4"
              >
                <p className="text-sm font-semibold">{stat.value}</p>
                <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} Qasim Medicos. All rights reserved.</p>
      </div>

      {/* Right: Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
              <HeartPulse size={20} />
            </div>
            <div>
              <h1 className="font-bold text-ink leading-tight">Qasim Medicos</h1>
              <p className="text-[10px] text-muted uppercase tracking-wider">Pharmacy SaaS</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-ink">Welcome back</h2>
          <p className="text-sm text-muted mt-1">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[34px] text-muted hover:text-ink"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input type="checkbox" className="rounded border-line text-primary focus:ring-primary" />
                Remember me
              </label>
              <Link to="/login" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              {!submitting && <ArrowRight size={18} />}
              Sign in
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-bg rounded-lg border border-line">
            <p className="text-xs font-medium text-muted mb-3">Demo credentials — click to fill:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('owner')}
                className="text-xs px-3 py-2 bg-white border border-line rounded-md hover:border-primary hover:text-primary"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => fillDemo('manager')}
                className="text-xs px-3 py-2 bg-white border border-line rounded-md hover:border-primary hover:text-primary"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => fillDemo('cashier')}
                className="text-xs px-3 py-2 bg-white border border-line rounded-md hover:border-primary hover:text-primary"
              >
                Cashier
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
