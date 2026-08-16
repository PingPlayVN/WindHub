import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, X } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/services/firebase';

const getLoginErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/operation-not-allowed':
      return 'Firebase chua bat phuong thuc dang nhap Email/Password.';
    case 'auth/invalid-email':
      return 'Dia chi email khong hop le.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị vô hiệu hóa.';
    case 'auth/too-many-requests':
      return 'Đã có quá nhiều lần thử. Vui lòng thử lại sau.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối Firebase. Vui lòng kiểm tra mạng.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email/mật khẩu sai, hoặc tài khoản admin chưa được tạo trong Firebase.';
    default:
      return 'Đăng nhập thất bại. Vui lòng kiểm tra cấu hình Firebase Authentication.';
  }
};

export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
      onClose();
      toast.success('Đã đăng nhập');
    } catch (error) {
      console.error('Firebase login error:', error.code);
      toast.error(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.button aria-label="Dong dang nhap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
          <motion.section initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-black">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Đăng nhập quản trị</h2><p className="mt-1 text-sm text-slate-500">Chỉ tài khoản admin mới có quyền quản lý file.</p></div>
              <button aria-label="Dong" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-900"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Mat khau<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><LogIn size={18} />{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            </form>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
