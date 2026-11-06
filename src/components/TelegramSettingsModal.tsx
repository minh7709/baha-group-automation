'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, X, HelpCircle, Key, UserCheck } from 'lucide-react';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('baha_telegram_token') || '';
      const savedChatId = localStorage.getItem('baha_telegram_chat_id') || '';
      setBotToken(savedToken);
      setChatId(savedChatId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('baha_telegram_token', botToken.trim());
    localStorage.setItem('baha_telegram_chat_id', chatId.trim());
    setStatus({
      type: 'success',
      message: 'Đã lưu cấu hình Telegram thành công vào bộ nhớ trình duyệt!',
    });
  };

  const handleTestSend = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setStatus({
        type: 'error',
        message: 'Vui lòng điền đủ Bot Token và Chat ID trước khi test.',
      });
      return;
    }

    setStatus({ type: 'loading', message: 'Đang gửi tin nhắn test tới Telegram...' });

    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          botToken: botToken.trim(),
          chatId: chatId.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Tự động lưu luôn
        localStorage.setItem('baha_telegram_token', botToken.trim());
        localStorage.setItem('baha_telegram_chat_id', chatId.trim());
        setStatus({
          type: 'success',
          message: `Gửi THÀNH CÔNG! Đã gửi tin nhắn tới Telegram (${data.chatTitle || 'Cá nhân'}). Hãy kiểm tra điện thoại của bạn!`,
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Gửi thất bại. Vui lòng kiểm tra lại Bot Token hoặc Chat ID.',
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Lỗi kết nối: ${err.message}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-[#263246] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#212838] pb-3">
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Send className="w-4 h-4" />
            <span>KẾT NỐI TELEGRAM BOT API (BẮT BUỘC KẾT QUẢ THẬT)</span>
          </div>
          <h3 className="text-xl font-bold text-gray-100 mt-1">
            Cấu hình Thông Báo Telegram Thật
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Đề bài yêu cầu: Khi hoàn tất lưu/xác nhận chiến dịch, một tin nhắn phải xuất hiện trên Telegram thật.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Bot Token:</span>
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="VD: 7123456789:AAFxAbcDeFgHiJkLmNoPqRsTuVwXyZ"
              className="w-full bg-[#0c0f17] border border-[#2b3548] rounded-xl p-3 text-xs md:text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Your Chat ID (hoặc Group ID):</span>
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="VD: 123456789 hoặc -100xxxxxxxx"
              className="w-full bg-[#0c0f17] border border-[#2b3548] rounded-xl p-3 text-xs md:text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Quick instructions accordion/box */}
          <div className="bg-[#0b0e15] border border-[#1d2536] rounded-xl p-3 text-xs text-gray-400 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-gray-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Cách lấy Token & Chat ID trong 1 phút:</span>
            </div>
            <div>1. Tìm bot <strong className="text-sky-300 font-mono">@BotFather</strong> trên Telegram ➔ gửi <code className="text-white">/newbot</code> để tạo và lấy Token.</div>
            <div>2. Tìm bot <strong className="text-sky-300 font-mono">@userinfobot</strong> ➔ gửi <code className="text-white">/start</code> để lấy Chat ID của bạn.</div>
            <div>3. Gửi lệnh <code className="text-white">/start</code> cho bot vừa tạo để cho phép bot gửi tin nhắn tới bạn.</div>
          </div>

          {/* Status Alert */}
          {status.type !== 'idle' && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                status.type === 'loading'
                  ? 'bg-blue-950/50 text-blue-300 border border-blue-800'
                  : status.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : status.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{status.message}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#212838]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-400 hover:text-white"
          >
            Đóng
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#1f283a] hover:bg-[#2b374e] text-gray-200 rounded-lg text-xs font-semibold border border-[#313f5c] transition"
            >
              Lưu cấu hình
            </button>

            <button
              type="button"
              disabled={status.type === 'loading'}
              onClick={handleTestSend}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-sky-950/60 transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TEST GỬI TIN NHẮN THẬT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

