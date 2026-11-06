'use client';

import React, { useState } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle, 
  ShieldCheck, ArrowRight, KeyRound, Sparkles 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
  currentUser: any | null;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'VERIFY'>('LOGIN');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Status & demo helpers
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  if (!isOpen) return null;

  // Xử lý Đăng ký
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message);
        if (data.otpCode) {
          setDemoOtp(data.otpCode);
        }
        setTab('VERIFY'); // Chuyển sang bước xác thực OTP
      } else {
        setErrorMsg(data.error || 'Đăng ký thất bại.');
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Xác thực Email OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Xác thực email thành công! Đang tự động đăng nhập...');
        setTimeout(() => {
          if (data.user) {
            onLoginSuccess(data.user);
            onClose();
          } else {
            setTab('LOGIN');
          }
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Mã xác thực không hợp lệ.');
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi xác thực: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Đăng nhập thành công!');
        onLoginSuccess(data.user);
        setTimeout(() => onClose(), 800);
      } else {
        if (data.needVerification) {
          setErrorMsg(data.error);
          if (data.otpCode) setDemoOtp(data.otpCode);
          setTab('VERIFY');
        } else {
          setErrorMsg(data.error || 'Đăng nhập không thành công.');
        }
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Điền nhanh tài khoản Founder mẫu
  const handleFillFounderDemo = () => {
    setEmail('founder@bahagroup.vn');
    setPassword('123456');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative font-sans text-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#1e293b] pb-4">
          <div className="flex items-center space-x-2 text-[#38bdf8] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>BAHA SECURITY GATE</span>
          </div>
          <h3 className="text-xl font-bold text-[#f8fafc] mt-1">
            {currentUser
              ? 'Tài Khoản Doanh Chủ'
              : tab === 'LOGIN'
              ? 'Đăng Nhập Hệ Thống'
              : tab === 'REGISTER'
              ? 'Đăng Ký Tài Khoản Mới'
              : 'Xác Thực Email (OTP)'}
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Thiết kế theo chuẩn High-Trust Fintech Instrumentation
          </p>
        </div>

        {/* If already logged in */}
        {currentUser ? (
          <div className="space-y-4 py-2">
            <div className="bg-[#0b0f19] border border-[#1e293b] p-4 rounded-xl space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] font-bold text-lg">
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-bold text-[#f8fafc] text-base">{currentUser.name}</div>
                  <div className="text-xs text-[#94a3b8]">{currentUser.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Email đã xác thực</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-mono font-semibold">
                  Vai trò: {currentUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition active:scale-95"
            >
              Đăng xuất khỏi hệ thống
            </button>
          </div>
        ) : (
          <>
            <a
              href="/api/auth/facebook/login?scope=basic"
              className="w-full py-2.5 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <span className="text-base font-black">f</span>
              Đăng nhập bằng Facebook OAuth 2.0
            </a>
            <p className="text-[11px] text-gray-500 text-center">
              OAuth sẽ tạo phiên đăng nhập Facebook riêng; không dùng tài khoản Founder mặc định.
            </p>
            {/* Tabs */}
            <div className="flex items-center bg-[#0b0f19] p-1 rounded-xl border border-[#1e293b] text-xs">
              <button
                type="button"
                onClick={() => {
                  setTab('LOGIN');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg font-bold transition ${
                  tab === 'LOGIN' ? 'bg-[#1f2937] text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('REGISTER');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg font-bold transition ${
                  tab === 'REGISTER' ? 'bg-[#1f2937] text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Đăng Ký
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('VERIFY');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg font-bold transition ${
                  tab === 'VERIFY' ? 'bg-[#1f2937] text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Xác Thực OTP
              </button>
            </div>

            {/* Notifications / Alerts */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Test Helper Banner if demoOtp available */}
            {demoOtp && tab === 'VERIFY' && (
              <div className="p-3 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-xs text-[#38bdf8] flex items-center justify-between">
                <div>
                  <span className="font-semibold">Mã OTP vừa gửi: </span>
                  <code className="text-white font-mono font-bold text-sm bg-black/40 px-1.5 py-0.5 rounded">{demoOtp}</code>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtp)}
                  className="px-2.5 py-1 bg-[#38bdf8] text-gray-950 rounded font-bold text-[11px] hover:bg-[#7bd0ff] transition"
                >
                  Tự động điền
                </button>
              </div>
            )}

            {/* TAB: LOGIN */}
            {tab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Email doanh nghiệp:</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@bahagroup.vn"
                    className="w-full h-12 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-4 text-sm text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Mật khẩu:</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-4 text-sm text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleFillFounderDemo}
                    className="text-[#38bdf8] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Điền mẫu Founder (Demo 123456)</span>
                  </button>
                  <span className="text-[#64748b]">Bảo mật SSL 256-bit</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#38bdf8] hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#38bdf8]/20 transition active:scale-95"
                >
                  <span>{isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP NGAY'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB: REGISTER */}
            {tab === 'REGISTER' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Họ và tên chủ cửa hàng:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full h-12 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-4 text-sm text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Email nhận mã xác thực:</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenban@gmail.com"
                    className="w-full h-12 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-4 text-sm text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Mật khẩu (Tối thiểu 6 ký tự):</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-4 text-sm text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-gray-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#10b981]/20 transition active:scale-95"
                >
                  <span>{isLoading ? 'Đang tạo tài khoản...' : 'TIẾP TỤC & GỬI MÃ XÁC THỰC'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB: VERIFY EMAIL OTP */}
            {tab === 'VERIFY' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                    Email tài khoản đang xác thực:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full h-11 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-4 text-xs text-[#f8fafc] focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>Nhập mã OTP 6 chữ số:</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full h-14 bg-[#0b0f19] border border-[#1e293b] rounded-xl text-center text-2xl font-bold tracking-[8px] text-[#10b981] focus:outline-none focus:border-[#10b981] font-mono transition"
                  />
                  <p className="text-[11px] text-[#64748b] text-center mt-1.5">
                    Mã xác thực có hiệu lực trong vòng 15 phút.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#10b981] to-[#38bdf8] hover:opacity-90 disabled:opacity-40 text-gray-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#10b981]/20 transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Đang kiểm tra...' : 'XÁC THỰC EMAIL & KÍCH HOẠT'}</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
