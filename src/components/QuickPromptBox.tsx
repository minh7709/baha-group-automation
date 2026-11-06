'use client';

import React, { useState } from 'react';
import { Sparkles, Play, ListFilter, SlidersHorizontal, ArrowRight } from 'lucide-react';

interface QuickPromptBoxProps {
  onStartCampaign: (promptText: string) => void;
  onResumeDraft: () => void;
  onViewCampaigns: () => void;
  onAdvancedSetup: () => void;
}

export const QuickPromptBox: React.FC<QuickPromptBoxProps> = ({
  onStartCampaign,
  onResumeDraft,
  onViewCampaigns,
  onAdvancedSetup,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCampaign(prompt);
  };

  return (
    <div className="w-full bg-[#141822] border border-[#232a3b] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-100 mb-3 tracking-tight">
        Bạn muốn quảng cáo điều gì hôm nay?
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Tôi muốn có khách hỏi giá dịch vụ chăm sóc sắc đẹp ở TP.HCM, 200 nghìn mỗi ngày trong 7 ngày, khách bấm vào thì gửi tin nhắn tư vấn cho tôi."
            rows={3}
            className="w-full bg-[#0c0f17] border border-[#273042] rounded-xl p-4 text-sm md:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none leading-relaxed"
          />
        </div>

        {/* Action Buttons Row - Chuẩn theo thiết kế ảnh BaHa */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onStartCampaign(prompt)}
            className="px-4 py-2.5 rounded-lg bg-[#2e7d58] hover:bg-[#256647] text-white font-medium text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-950/60 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>THIẾT LẬP QUẢNG CÁO</span>
          </button>

          <button
            type="button"
            onClick={onResumeDraft}
            className="px-4 py-2.5 rounded-lg bg-[#1a202c] hover:bg-[#242c3d] text-gray-200 border border-[#2e384e] font-medium text-sm flex items-center space-x-2 transition active:scale-95"
          >
            <span>TIẾP TỤC BẢN NHÁP</span>
          </button>

          <button
            type="button"
            onClick={onViewCampaigns}
            className="px-4 py-2.5 rounded-lg bg-[#1a202c] hover:bg-[#242c3d] text-gray-200 border border-[#2e384e] font-medium text-sm flex items-center space-x-2 transition active:scale-95"
          >
            <span>XEM CHIẾN DỊCH CỦA TÔI</span>
          </button>

          <button
            type="button"
            onClick={onAdvancedSetup}
            className="px-4 py-2.5 rounded-lg bg-[#1a202c] hover:bg-[#242c3d] text-gray-200 border border-[#2e384e] font-medium text-sm flex items-center space-x-2 transition active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <span>THIẾT LẬP CHUYÊN SÂU</span>
          </button>
        </div>

        {/* Note / Disclaimer */}
        <p className="text-xs text-gray-400 leading-normal pt-1">
          Chỉ tạo <strong className="text-gray-300">BẢN NHÁP</strong> để bạn xem lại. Tạo trên Meta (luôn <strong className="text-amber-400">TẠM DỪNG</strong>) và bật chạy là các bước riêng bạn tự xác nhận ở cuối. Bấm «Thiết lập quảng cáo» sẽ mở một bản nháp MỚI; bản đang làm vẫn được giữ.
        </p>
      </form>
    </div>
  );
};

