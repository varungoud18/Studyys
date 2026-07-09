import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth, UserRole } from '../../context/AuthContext';
import { GraduationCap, Lock, Mail, User, AlertCircle, ArrowRight, BookOpen, Building, Hash } from 'lucide-react';

const registerSchema = zod.object({
  fullName: zod.string().min(2, 'Name must be at least 2 characters long'),
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters long'),
  role: zod.enum(['student', 'moderator', 'admin'] as const),
  college: zod.string().min(2, 'College name is required'),
  branch: zod.string().min(2, 'Branch/Major is required'),
  semester: zod.coerce.number().min(1).max(8),
});

type RegisterFormInput = zod.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
      semester: 1,
    },
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setError(null);
    setLoading(true);
    try {
      await signup(data.email, data.password, data.fullName, data.role);
      // For mock or supabase, we save extended details directly using updateProfile if needed or context handles it
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-brand text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/10 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">Studyys</span>
        </div>

        <div className="my-auto space-y-6 relative z-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Learn Smarter, Not Harder.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Create an account to join the collaborative academic hub. Chat with Gemini to summarize PDFs, generate questions instantly, and study using interactive tools.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; 2026 Studyys. Crafted for future engineers.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:w-1/2 bg-white overflow-y-auto scrollbar-thin my-6">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Get Started</h2>
            <p className="mt-2 text-slate-500 text-sm">
              Create your student or teacher account
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-normal">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('fullName')}
                  className={`w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition ${
                    errors.fullName ? 'border-red-300 ring-2 ring-red-500/10' : ''
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@university.edu"
                  {...register('email')}
                  className={`w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition ${
                    errors.email ? 'border-red-300 ring-2 ring-red-500/10' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition ${
                    errors.password ? 'border-red-300 ring-2 ring-red-500/10' : ''
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  University / College
                </label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="IIT Delhi"
                    {...register('college')}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Branch / Major
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Computer Science"
                    {...register('branch')}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Semester
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    {...register('semester')}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition bg-white"
                >
                  <option value="student">Student</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-brand-500/10 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
