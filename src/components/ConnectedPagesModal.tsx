'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Globe, Plus, Trash2, CheckCircle2, AlertCircle, ExternalLink, 
  Sparkles, ShieldCheck, RefreshCw, Layers 
} from 'lucide-react';

interface PageItem {
  id: string;
  pageId: string;
  pageName: string;
  pageCategory?: string;
  hasToken?: boolean;
}

interface ConnectedPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage?: (page: PageItem) => void;
}

export const ConnectedPagesModal: React.FC<ConnectedPagesModalProps> = ({
  isOpen,
  onClose,
  onSelectPage,
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [manualPageId, setManualPageId] = useState('');
  const [manualPageName, setManualPageName] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success && data.pages) {
        setPages(data.pages);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPages();
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Xóa / Hủy kết nối Fanpage
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy liên kết Fanpage "${name}"?`)) return;
    try {
      const res = await fetch(`/api/pages?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'ok', text: `Đã hủy kết nối Fanpage "${name}".` });
        fetchPages();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message });
    }
  };

  // Thêm thủ công hoặc mock
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPageId || !manualPageName) return;

    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: manualPageId,
          pageName: manualPageName,
          pageCategory: manualCategory || 'Trang Facebook',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'ok', text: data.message });
        setManualPageId('');
        setManualPageName('');
        setManualCategory('');
        fetchPages();
      } else {
        setStatusMsg({ type: 'err', text: data.error || 'Lỗi kết nối' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative text-gray-200 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#1e293b] pb-3">
          <div className="flex items-center space-x-2 text-[#38bdf8] text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>FACEBOOK OAUTH 2.0 · MULTI-TENANT SAAS</span>
          </div>
          <h3 className="text-xl font-bold text-[#f8fafc] mt-1">
            Quản Lý Kênh Fanpage Đã Kết Nối
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Cho phép nhiều người dùng tự cấp quyền các Fanpage của mình để đăng bài và chạy quảng cáo tự động.
          </p>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              statusMsg.type === 'ok'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800 text-rose-300'
            }`}
          >
            {statusMsg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]">
          <div className="flex-1">
            <h4 className="font-bold text-sm text-[#f8fafc]">Kết nối tài khoản Facebook</h4>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Hệ thống tự động đồng bộ danh sách Fanpage và lấy Page Access Token vĩnh viễn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/auth/facebook/login"
              className="px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-950/50 transition active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>Facebook OAuth Thật</span>
            </a>

            <a
              href="/api/auth/facebook/login?mode=mock"
              title="Test quy trình OAuth mô phỏng nếu chưa có Meta App ID"
              className="px-3.5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2b3952] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-xs flex items-center space-x-1.5 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Mock OAuth (Test)</span>
            </a>
          </div>
        </div>

        {/* Danh sách Fanpage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#f8fafc]">
              Danh Sách Fanpage Của Bạn ({pages.length})
            </h4>
            <button
              onClick={fetchPages}
              className="text-xs text-[#38bdf8] hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {pages.length === 0 ? (
            <div className="text-center py-8 text-[#64748b] text-xs bg-[#0b0f19] rounded-xl border border-[#1e293b]">
              Chưa có Fanpage nào được liên kết. Hãy bấm "Facebook OAuth Thật" hoặc "Mock OAuth (Test)" ở trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#0b0f19] border border-[#1e293b] hover:border-[#38bdf8]/50 p-3.5 rounded-xl flex items-center justify-between transition group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-sm text-[#f8fafc] truncate flex items-center gap-1.5">
                      <span>{p.pageName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5 font-mono truncate">
                      ID: {p.pageId} • {p.pageCategory || 'Trang Facebook'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {onSelectPage && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPage(p);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#38bdf8] hover:text-black text-[#38bdf8] text-[11px] font-bold rounded-lg transition"
                      >
                        Chọn
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.pageName)}
                      title="Hủy liên kết trang này"
                      className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thêm nhanh Fanpage thủ công */}
        <div className="pt-3 border-t border-[#1e293b]">
          <span className="text-xs font-semibold text-[#94a3b8] block mb-2">
            Thêm nhanh Fanpage bằng Page ID (Nếu bạn đã có sẵn Page):
          </span>
          <form onSubmit={handleAddManual} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              value={manualPageId}
              onChange={(e) => setManualPageId(e.target.value)}
              placeholder="Page ID (VD: 102938...)"
              className="bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8] font-mono"
            />
            <input
              type="text"
              required
              value={manualPageName}
              onChange={(e) => setManualPageName(e.target.value)}
              placeholder="Tên Fanpage"
              className="bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
            />
            <button
              type="submit"
              className="bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-xs rounded-lg px-3 py-2 transition"
            >
              + Thêm Fanpage Này
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

