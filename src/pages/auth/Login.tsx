import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormInput = zod.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, signInWithGoogle, isMock } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInput) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid email or password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (isMock) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'student' | 'moderator' | 'admin') => {
    setValue('email', `${role}@studyys.edu`);
    setValue('password', 'password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch">
      {/* Left side panel (Brand Promotion) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-brand text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/10 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">Studyys</span>
        </div>

        <div className="my-auto space-y-6 relative z-10 max-w-lg">
          <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/10">
            AI Study Assistant
          </span>
          <h1 className="text-4xl md:text-5xl font-black leading-tight font-display">
            Accelerate Your Engineering Journey.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Upload textbooks, analyze syllabus documents, query complex formulas, generate mock tests, and share vetted notes—powered by Google Gemini.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; 2026 Studyys. Crafted for future engineers.
        </div>
      </div>

      {/* Right side panel (Form) */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:w-1/2 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="p-1.5 bg-gradient-brand rounded-lg text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-800">Studyys</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sign In</h2>
            <p className="mt-2 text-slate-500 text-sm">
              Enter your credentials to access your study portal
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-normal">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@university.edu"
                  {...register('email')}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition ${
                    errors.email ? 'border-red-300 ring-2 ring-red-500/10' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <a href="#forgot" className="text-xs font-semibold text-brand-500 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition ${
                    errors.password ? 'border-red-300 ring-2 ring-red-500/10' : ''
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-brand-500/10 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative px-3 bg-white text-xs text-slate-400 font-medium">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition flex items-center justify-center gap-2.5 text-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </form>

          {isMock && (
            <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Sparkles className="w-4 h-4 text-amber-500" /> Dev Sandbox Mode: Quick Login
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickLogin('student')}
                  className="bg-white hover:bg-slate-50 border border-amber-200 text-xs py-1.5 px-2 rounded-lg font-medium text-slate-700"
                >
                  Student
                </button>
                <button
                  onClick={() => handleQuickLogin('moderator')}
                  className="bg-white hover:bg-slate-50 border border-amber-200 text-xs py-1.5 px-2 rounded-lg font-medium text-slate-700"
                >
                  Moderator
                </button>
                <button
                  onClick={() => handleQuickLogin('admin')}
                  className="bg-white hover:bg-slate-50 border border-amber-200 text-xs py-1.5 px-2 rounded-lg font-medium text-slate-700"
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
