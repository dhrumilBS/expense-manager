import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { apiErrorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Could not log in.'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-display text-xl font-semibold">₹</div>
          <span className="font-display text-2xl font-semibold tracking-tight">Ledger</span>
        </div>
        <div className="card">
          <h1 className="font-display text-xl font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Log in to manage your money.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-expense mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-expense mt-1">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">{serverError}</p>}
            <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
