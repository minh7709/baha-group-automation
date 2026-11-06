'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Send, Calendar, Clock, Image as ImageIcon, Link as LinkIcon, 
  CheckCircle2, AlertCircle, Sparkles, ExternalLink, ShieldCheck, Globe, ChevronDown 
} from 'lucide-react';
import { CampaignData } from '@/lib/types';

interface PageItem {
  id: string;
  pageId: string;
  pageName: string;
  pageCategory?: string;
  hasToken?: boolean;
}

interface FacebookPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Partial<CampaignData> | null;
  onPublishedSuccess?: (result: any) => void;
  onOpenConnectedPages?: () => void;
}

export const FacebookPublishModal: React.FC<FacebookPublishModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onPublishedSuccess,
  onOpenConnectedPages,
}) => {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [connectedPages, setConnectedPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string; postUrl?: string; isMock?: boolean }>({
    type: 'idle',
  });

  // Tải danh sách Fanpage đã kết nối qua OAuth
  const loadPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success && data.pages) {
        setConnectedPages(data.pages);
        if (data.pages.length > 0 && !selectedPageId) {
          setSelectedPageId(data.pages[0].pageId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPages();
    }
  }, [isOpen]);

  // Prefill from campaign when opened
  useEffect(() => {
    if (campaign) {
      const fullText = campaign.headline 
        ? `${campaign.headline}\n\n${campaign.primaryText || ''}`
        : campaign.primaryText || campaign.description || '';
      setMessage(fullText);
      setImageUrl(campaign.imageUrl || '');
    } else {
      setMessage('');
      setImageUrl('');
    }
    setStatus({ type: 'idle' });
  }, [campaign, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: 'idle' });

    try {
      const botToken = typeof window !== 'undefined' ? localStorage.getItem('baha_telegram_token') || undefined : undefined;
      const chatId = typeof window !== 'undefined' ? localStorage.getItem('baha_telegram_chat_id') || undefined : undefined;

      const res = await fetch('/api/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          imageUrl: imageUrl || undefined,
          linkUrl: linkUrl || undefined,
          scheduledTime: isScheduled && scheduledTime ? scheduledTime : undefined,
          pageId: selectedPageId || undefined,
          campaignId: campaign?.id,
          botToken,
          chatId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: data.message,
          postUrl: data.postUrl,
          isMock: data.isMock,
        });
        if (onPublishedSuccess) onPublishedSuccess(data);
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Đăng bài thất bại. Vui lòng kiểm tra lại cấu hình.',
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Lỗi kết nối: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPageObj = connectedPages.find((p) => p.pageId === selectedPageId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 relative text-gray-200 my-8">
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
            <span>META GRAPH API v21.0 · TỰ ĐỘNG ĐĂNG BÀI FANPAGE (0 ĐỒNG)</span>
          </div>
          <h3 className="text-xl font-bold text-[#f8fafc] mt-1">
            Đăng & Lên Lịch Bài Viết Lên Facebook Fanpage
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Sử dụng Page Access Token vĩnh viễn thu được qua luồng Facebook OAuth 2.0 Multi-Tenant.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CỘT TRÁI: FORM SOẠN THẢO */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chọn Fanpage đã liên kết */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>CHỌN FANPAGE ĐĂNG BÀI: *</span>
                </label>
                {onOpenConnectedPages && (
                  <button
                    type="button"
                    onClick={onOpenConnectedPages}
                    className="text-[11px] text-[#38bdf8] hover:underline font-bold"
                  >
                    + Quản lý Fanpage OAuth
                  </button>
                )}
              </div>

              {connectedPages.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedPageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="w-full h-11 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 text-xs md:text-sm text-[#f8fafc] focus:outline-none focus:border-[#38bdf8] appearance-none pr-8 cursor-pointer font-medium"
                  >
                    {connectedPages.map((p) => (
                      <option key={p.id} value={p.pageId}>
                        {p.pageName} (ID: {p.pageId})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              ) : (
                <div className="p-2.5 bg-[#0b0f19] border border-[#1e293b] rounded-xl text-xs text-[#94a3b8] flex items-center justify-between">
                  <span>Chưa có Fanpage nào được liên kết.</span>
                  {onOpenConnectedPages && (
                    <button
                      type="button"
                      onClick={onOpenConnectedPages}
                      className="px-2 py-1 bg-[#38bdf8] text-gray-950 font-bold rounded text-[11px]"
                    >
                      Kết nối ngay
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                NỘI DUNG BÀI VIẾT (CAPTION / MESSAGE) *
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung bạn muốn chia sẻ lên Fanpage..."
                className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl p-3.5 text-xs md:text-sm text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] resize-none leading-relaxed transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>URL HÌNH ẢNH (TÙY CHỌN):</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/hinh-anh.jpg"
                className="w-full h-10 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 text-xs text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>LINK TRANG WEB (TÙY CHỌN):</span>
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://website-cua-ban.com"
                className="w-full h-10 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 text-xs text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] font-mono"
              />
            </div>

            {/* Lên lịch hẹn giờ */}
            <div className="pt-2 border-t border-[#1e293b]">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="schedToggleModal"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#38bdf8] bg-[#0b0f19] border-[#1e293b]"
                />
                <label htmlFor="schedToggleModal" className="text-xs text-[#dfe2f1] font-semibold cursor-pointer select-none">
                  ⏰ Hẹn giờ lên lịch đăng bài (Scheduled Post)
                </label>
              </div>

              {isScheduled && (
                <div className="pl-6 pt-1">
                  <label className="block text-[11px] text-[#94a3b8] mb-1">
                    Thời điểm đăng (Tối thiểu sau 10 phút tính từ hiện tại):
                  </label>
                  <input
                    type="datetime-local"
                    required={isScheduled}
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>
              )}
            </div>

            {/* Thông báo trạng thái */}
            {status.type === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}

            {status.type === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs space-y-2">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{status.message}</span>
                </div>
                {status.postUrl && (
                  <div className="pt-1">
                    <a
                      href={status.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#38bdf8] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Xem bài viết trên Facebook</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Nút hành động */}
            <button
              type="submit"
              disabled={isLoading || connectedPages.length === 0}
              className="w-full py-3 bg-gradient-to-r from-[#2563eb] to-[#38bdf8] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs md:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#38bdf8]/20 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'Đang gửi lên Meta...'
                  : isScheduled
                  ? 'XÁC NHẬN HẸN GIỜ ĐĂNG BÀI'
                  : `🚀 ĐĂNG LÊN "${selectedPageObj?.pageName || 'FANPAGE'}" NGAY (0Đ)`}
              </span>
            </button>
          </form>

          {/* CỘT PHẢI: LIVE FACEBOOK FEED MOCKUP */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
                XEM TRƯỚC BÀI ĐĂNG THỜI GIAN THỰC
              </span>
              <span className="text-[11px] text-[#38bdf8] font-mono">Facebook Page Feed</span>
            </div>

            <div className="bg-[#18191a] text-[#e4e6eb] rounded-xl border border-[#3a3b3c] p-4 max-w-sm mx-auto shadow-2xl font-sans text-xs">
              {/* Header Feed */}
              <div className="flex items-center space-x-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#10b981] to-[#38bdf8] flex items-center justify-center font-bold text-white shadow">
                  {selectedPageObj?.pageName ? selectedPageObj.pageName.charAt(0) : 'P'}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#e4e6eb] leading-tight">
                    {selectedPageObj?.pageName || campaign?.pageName || 'Diệu BaHa - Quản Trị Thực Chiến'}
                  </div>
                  <div className="text-[11px] text-[#b0b3b8] flex items-center space-x-1 mt-0.5">
                    <span>{isScheduled ? 'Đã lên lịch hẹn giờ' : 'Vừa xong'}</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-[#b0b3b8]" />
                  </div>
                </div>
              </div>

              {/* Text Body */}
              <div className="text-xs text-[#e4e6eb] whitespace-pre-line leading-relaxed mb-3">
                {message || (
                  <span className="text-gray-500 italic">
                    Nội dung bài viết sẽ hiển thị ở đây thời gian thực...
                  </span>
                )}
              </div>

              {/* Link đính kèm nếu có */}
              {linkUrl && !imageUrl && (
                <div className="mb-3 p-2.5 bg-[#242526] rounded border border-[#3a3b3c] text-[11px]">
                  <div className="text-[#38bdf8] underline truncate">{linkUrl}</div>
                  <div className="text-gray-400 mt-0.5">Nhấp để mở trang web</div>
                </div>
              )}

              {/* Ảnh bài đăng */}
              {imageUrl && (
                <div className="rounded-lg overflow-hidden bg-black mb-3 border border-[#3a3b3c] max-h-56">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Like / Comment / Share */}
              <div className="border-t border-[#3a3b3c] pt-2 flex justify-around text-[11px] text-[#b0b3b8] font-semibold">
                <span className="hover:text-white cursor-pointer">👍 Thích</span>
                <span className="hover:text-white cursor-pointer">💬 Bình luận</span>
                <span className="hover:text-white cursor-pointer">↗️ Chia sẻ</span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748b] text-center mt-3">
              Page Access Token được bảo vệ an toàn trên máy chủ. Bắn thông báo Telegram khi đăng bài.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

