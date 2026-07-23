import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { apiErrorMessage } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export default function Register() {
  const { register: doRegister } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await doRegister(data.name, data.email, data.password);
      navigate('/');
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Could not create your account.'));
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
          <h1 className="font-display text-xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-muted mb-6">Starter groups, categories and accounts are set up for you.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" placeholder="Jane Doe" {...register('name')} />
              {errors.name && <p className="text-xs text-expense mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-expense mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="At least 8 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-expense mt-1">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">{serverError}</p>}
            <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
