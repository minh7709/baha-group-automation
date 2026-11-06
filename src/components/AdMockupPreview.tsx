'use client';

import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, Smartphone, Monitor } from 'lucide-react';
import { CampaignData } from '@/lib/types';

interface AdMockupPreviewProps {
  campaign: Partial<CampaignData>;
}

export const AdMockupPreview: React.FC<AdMockupPreviewProps> = ({ campaign }) => {
  const [viewMode, setViewMode] = useState<'feed' | 'story'>('feed');

  const pageName = campaign.pageName || 'Diệu BaHa - Quản Trị Thực Chiến';
  const headline = campaign.headline || 'Ưu Đãi Đặc Biệt Hôm Nay';
  const primaryText = campaign.primaryText || 'Đăng ký ngay để nhận ưu đãi và tư vấn trực tiếp từ chuyên gia.';
  const imageUrl = campaign.imageUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80';
  
  const getCtaLabel = (cta?: string) => {
    switch (cta) {
      case 'SEND_MESSAGE': return 'Gửi tin nhắn';
      case 'GET_OFFER': return 'Nhận báo giá';
      case 'LEARN_MORE': return 'Tìm hiểu thêm';
      case 'SHOP_NOW': return 'Mua ngay';
      default: return 'Gửi tin nhắn';
    }
  };

  return (
    <div className="w-full bg-[#131722] border border-[#232b3d] rounded-2xl p-4 md:p-5 shadow-xl">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between border-b border-[#212838] pb-3 mb-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BƯỚC 6: XEM TRƯỚC THỰC TẾ</span>
          <h4 className="text-sm font-semibold text-gray-200">Định dạng hiển thị Meta Ads</h4>
        </div>

        <div className="flex items-center bg-[#0d1017] p-1 rounded-lg border border-[#212838] text-xs">
          <button
            type="button"
            onClick={() => setViewMode('feed')}
            className={`px-3 py-1 rounded font-medium flex items-center space-x-1 transition ${
              viewMode === 'feed' ? 'bg-[#212a3d] text-emerald-300' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Bảng tin Feed</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('story')}
            className={`px-3 py-1 rounded font-medium flex items-center space-x-1 transition ${
              viewMode === 'story' ? 'bg-[#212a3d] text-emerald-300' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Story / Reels</span>
          </button>
        </div>
      </div>

      {/* Mockup Container */}
      <div className="max-w-[420px] mx-auto bg-[#18191a] text-[#e4e6eb] rounded-xl border border-[#3a3b3c] overflow-hidden shadow-2xl font-sans text-sm">
        {viewMode === 'feed' ? (
          <>
            {/* Header Facebook Post */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center font-bold text-white shadow">
                  {pageName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#e4e6eb] leading-tight flex items-center gap-1">
                    <span>{pageName}</span>
                  </div>
                  <div className="text-[11px] text-[#b0b3b8] flex items-center space-x-1 mt-0.5">
                    <span>Được tài trợ</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-[#b0b3b8]" />
                  </div>
                </div>
              </div>
              <button className="text-[#b0b3b8] hover:text-white p-1">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-3.5 pb-3 text-xs md:text-sm text-[#e4e6eb] whitespace-pre-line leading-relaxed">
              {primaryText}
            </div>

            {/* Post Image */}
            <div className="relative aspect-video w-full bg-[#242526] overflow-hidden border-t border-b border-[#3a3b3c]">
              <img
                src={imageUrl}
                alt="Ad Creative"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as any).src = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* CTA & Headline Bar */}
            <div className="p-3 bg-[#242526] flex items-center justify-between gap-3 border-b border-[#3a3b3c]">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-[#b0b3b8] truncate font-medium">
                  {campaign.objectiveText || 'FACEBOOK.COM'}
                </div>
                <div className="text-sm font-bold text-[#e4e6eb] truncate mt-0.5">
                  {headline}
                </div>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-md bg-[#3a3b3c] hover:bg-[#4e4f50] text-[#e4e6eb] font-semibold text-xs border border-[#4e4f50] transition shadow"
                >
                  {getCtaLabel(campaign.callToAction)}
                </button>
              </div>
            </div>

            {/* Likes, Comments, Shares */}
            <div className="px-3 py-2 flex items-center justify-between text-[#b0b3b8] text-xs">
              <button className="flex items-center space-x-1.5 hover:text-white py-1">
                <ThumbsUp className="w-4 h-4 text-sky-400" />
                <span>Thích</span>
              </button>
              <button className="flex items-center space-x-1.5 hover:text-white py-1">
                <MessageCircle className="w-4 h-4" />
                <span>Bình luận</span>
              </button>
              <button className="flex items-center space-x-1.5 hover:text-white py-1">
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </>
        ) : (
          /* Story / Reels View */
          <div className="relative aspect-[9/16] max-h-[500px] w-full bg-black overflow-hidden flex flex-col justify-between p-4">
            <img
              src={imageUrl}
              alt="Story"
              className="absolute inset-0 w-full h-full object-cover opacity-75"
            />
            {/* Top Bar */}
            <div className="relative z-10 flex items-center space-x-2 pt-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 border border-white flex items-center justify-center font-bold text-white text-xs">
                {pageName.charAt(0)}
              </div>
              <div className="text-white text-xs font-semibold drop-shadow">
                {pageName} <span className="text-[10px] opacity-80">• Được tài trợ</span>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="relative z-10 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center">
              <div className="text-xs font-bold text-white mb-1">{headline}</div>
              <button className="w-full py-2 bg-emerald-600 rounded-lg text-white font-bold text-xs shadow-lg">
                {getCtaLabel(campaign.callToAction)}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-xs text-gray-400">
        Mô phỏng hiển thị trên Meta Ads (Không có watermark quảng cáo giả mạo)
      </div>
    </div>
  );
};

