import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const { register, handleSubmit, setValue } = useForm<{ username: string; password: string }>();
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const quickAccounts = [
    { label: 'Admin', username: 'admin', password: 'Admin@123' },
    { label: 'Manager', username: 'manager', password: 'Manager@123' },
    { label: 'Accountant', username: 'accountant', password: 'Acc@123' },
    { label: 'Staff', username: 'staff', password: 'Staff@123' },
    { label: 'Viewer', username: 'viewer', password: 'Viewer@123' },
  ];

  async function onSubmit(values: { username: string; password: string }) {
    try {
      await loginMutation.mutateAsync(values);
      navigate('/dashboard');
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Dang nhap that bai');
    }
  }

  async function onQuickLogin(username: string, password: string) {
    setValue('username', username);
    setValue('password', password);
    await onSubmit({ username, password });
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black">
            WM
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#e6edf3]">WarehousePro</h1>
            <p className="text-xs text-[#6e7681]">He thong quan ly kho</p>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-bold text-[#e6edf3] mb-5">Dang nhap</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1">Ten dang nhap</label>
              <input
                {...register('username')}
                placeholder="admin"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2.5 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1">Mat khau</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2.5 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-2.5 rounded-md text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors mt-2"
            >
              {loginMutation.isPending ? 'Dang dang nhap...' : 'Dang nhap'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#30363d]">
            <p className="text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-2">Tai khoan test</p>
            <div className="grid grid-cols-2 gap-2">
              {quickAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  disabled={loginMutation.isPending}
                  onClick={() => onQuickLogin(acc.username, acc.password)}
                  className="px-2.5 py-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-xs text-[#e6edf3] hover:bg-[#2b3242] disabled:opacity-50"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
