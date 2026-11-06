'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Globe, Plus, Trash2, CheckCircle2, AlertCircle, ExternalLink, 
  Sparkles, ShieldCheck, RefreshCw, Key, HelpCircle 
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
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Tab: 'oauth' | 'token_import' | 'manual'
  const [activeTab, setActiveTab] = useState<'oauth' | 'token_import' | 'manual'>('token_import');

  // State nhập Token trực tiếp từ Graph API Explorer
  const [explorerToken, setExplorerToken] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // State thêm thủ công
  const [manualPageId, setManualPageId] = useState('');
  const [manualPageName, setManualPageName] = useState('');
  const [manualCategory, setManualCategory] = useState('');

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

  // Nhập trực tiếp Access Token từ Graph API Explorer (Bypass lỗi Invalid Scopes)
  const handleImportToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explorerToken.trim()) return;

    setIsImporting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/pages/import-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: explorerToken.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'ok', text: data.message });
        setExplorerToken('');
        fetchPages();
      } else {
        setStatusMsg({ type: 'err', text: data.error || 'Không thể đồng bộ Fanpage từ Token này.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  // Thêm thủ công
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
            <span>META ADS & FACEBOOK GRAPH API v21.0</span>
          </div>
          <h3 className="text-xl font-bold text-[#f8fafc] mt-1">
            Quản Lý Kênh Fanpage & Xác Thực Meta
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Kết nối Fanpage để đăng bài tự động (0đ) và gắn đối tượng tạo quảng cáo trả phí Meta.
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

        {/* Method Switcher Tabs */}
        <div className="flex items-center space-x-2 border-b border-[#1e293b] pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('token_import')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'token_import'
                ? 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Nhập Token Explorer (Khuyên dùng)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'oauth'
                ? 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>OAuth 2.0 Tự Động</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'manual'
                ? 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Thủ Công</span>
          </button>
        </div>

        {/* TAB 1: NHẬP TOKEN TRỰC TIẾP TỪ GRAPH API EXPLORER */}
        {activeTab === 'token_import' && (
          <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b] space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#f8fafc] flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#38bdf8]" />
                  <span>Đồng bộ từ Meta Graph API Explorer</span>
                </h4>
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1"
                >
                  <span>Mở Graph API Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Dán User Token hoặc Page Token từ tài khoản Meta Developer của bạn vào đây. Hệ thống sẽ tự động gọi Meta Graph API v21.0 để nạp danh sách Fanpage và mã hóa lưu trữ an toàn (AES-256-GCM).
              </p>
            </div>

            <form onSubmit={handleImportToken} className="space-y-2.5">
              <textarea
                value={explorerToken}
                onChange={(e) => setExplorerToken(e.target.value)}
                placeholder="Dán token bắt đầu bằng EAA... vào đây"
                rows={2}
                className="w-full bg-[#111827] border border-[#232b3d] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38bdf8] font-mono resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Hỗ trợ cả User Access Token (tự nạp tất cả trang) và Page Access Token đơn lẻ.
                </span>
                <button
                  type="submit"
                  disabled={isImporting || !explorerToken.trim()}
                  className="px-4 py-2 bg-[#10b981] hover:bg-emerald-600 disabled:opacity-50 text-gray-900 font-bold text-xs rounded-lg transition active:scale-95 shadow-md flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Đang xác thực...' : 'Đồng Bộ Fanpage Thật'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: OAUTH 2.0 DIALOG */}
        {activeTab === 'oauth' && (
          <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b] space-y-3">
            <div>
              <h4 className="font-bold text-sm text-[#f8fafc]">Xác thực đăng nhập Facebook OAuth 2.0</h4>
              <p className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
                Chọn phương thức cấp quyền phù hợp với trạng thái App Meta của bạn:
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {/* OAuth Pages */}
              <a
                href="/api/auth/facebook/login?scope=pages"
                className="px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow transition active:scale-95"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>OAuth Thật (Quyền Fanpage)</span>
              </a>

              {/* OAuth Basic */}
              <a
                href="/api/auth/facebook/login?scope=basic"
                title="Dùng cho App chưa cấu hình Use Case Pages trên Meta Developer"
                className="px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#2e3b52] text-gray-200 border border-[#334155] font-bold text-xs flex items-center space-x-1.5 transition active:scale-95"
              >
                <span>OAuth Cơ Bản (Profile)</span>
              </a>

              {/* Mock OAuth */}
              <a
                href="/api/auth/facebook/login?mode=mock"
                className="px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#2b3952] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-xs flex items-center space-x-1.5 transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Mock OAuth (1-Click Test)</span>
              </a>
            </div>

            {/* Note về Invalid Scopes */}
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/60 text-[11px] text-amber-300 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-200">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tại sao Meta báo lỗi "Invalid Scopes: pages_show_list, pages_manage_posts"?</span>
              </div>
              <p>
                Meta yêu cầu ứng dụng phải bật mục <strong>Facebook Login for Business</strong> trong Meta Developer Dashboard. Nếu App của bạn là App cá nhân thử nghiệm, hãy bấm tab <strong>"Nhập Token Explorer"</strong> ở trên để nạp trang thật ngay lập tức mà không cần xét duyệt App!
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: THÊM THỦ CÔNG */}
        {activeTab === 'manual' && (
          <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b] space-y-3">
            <span className="text-xs font-semibold text-[#94a3b8] block">
              Thêm nhanh Fanpage bằng Page ID và Tên trang:
            </span>
            <form onSubmit={handleAddManual} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                value={manualPageId}
                onChange={(e) => setManualPageId(e.target.value)}
                placeholder="Page ID (VD: 102938...)"
                className="bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8] font-mono"
              />
              <input
                type="text"
                required
                value={manualPageName}
                onChange={(e) => setManualPageName(e.target.value)}
                placeholder="Tên Fanpage"
                className="bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
              />
              <button
                type="submit"
                className="bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-xs rounded-lg px-3 py-2 transition"
              >
                + Thêm Fanpage Này
              </button>
            </form>
          </div>
        )}

        {/* Danh sách Fanpage đã kết nối */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#f8fafc]">
              Danh Sách Fanpage Đã Nạp ({pages.length})
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
              Chưa có Fanpage nào được liên kết. Hãy bấm "Nhập Token Explorer" hoặc "Mock OAuth (Test)" ở trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
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
      </div>
    </div>
  );
};
