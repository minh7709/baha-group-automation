'use client';

import React from 'react';
import { ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { CampaignData } from '@/lib/types';

interface NextActionCardProps {
  activeDraft?: CampaignData | null;
  onContinue: () => void;
  otherDraftsCount: number;
}

export const NextActionCard: React.FC<NextActionCardProps> = ({
  activeDraft,
  onContinue,
  otherDraftsCount,
}) => {
  if (!activeDraft) return null;

  // Xác định các trường còn thiếu
  const missingFields: string[] = [];
  if (!activeDraft.objective) missingFields.push('Mục tiêu chiến dịch Meta (chọn một đường đi)');
  if (!activeDraft.name || activeDraft.name === 'Chiến dịch chưa đặt tên') missingFields.push('Sản phẩm/dịch vụ');
  if (!activeDraft.location) missingFields.push('Khu vực');
  if (!activeDraft.startDate) missingFields.push('Ngày bắt đầu (bạn xác nhận)');

  return (
    <div className="w-full bg-[#131720] border border-[#212836] rounded-2xl p-5 shadow-lg">
      <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
        <Clock className="w-3.5 h-3.5" />
        <span>VIỆC TIẾP THEO</span>
      </div>

      <h3 className="text-base md:text-lg font-semibold text-gray-100 mb-2">
        Bạn đang có một bản nháp chưa hoàn thành.
      </h3>

      <p className="text-xs md:text-sm text-gray-300 mb-3 leading-relaxed">
        {missingFields.length > 0 ? (
          <>
            <span className="text-gray-400">Thiếu: </span>
            <span className="text-gray-200">{missingFields.join(', ')}.</span>
          </>
        ) : (
          <span>Bản nháp đã sẵn sàng để kiểm tra và duyệt nội bộ.</span>
        )}
      </p>

      <div className="text-xs text-gray-400 mb-4 flex flex-wrap items-center gap-1.5">
        <span>Bản nháp: </span>
        <code className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/60 font-mono">
          {activeDraft.code}
        </code>
        <span>· cập nhật {new Date(activeDraft.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        {otherDraftsCount > 0 && (
          <span>· còn {otherDraftsCount}+ bản nháp khác trong «Quảng cáo của tôi»</span>
        )}
      </div>

      <div>
        <button
          onClick={onContinue}
          className="px-5 py-2.5 rounded-lg bg-[#3da472] hover:bg-[#328e62] text-gray-900 font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-950/50 active:scale-95"
        >
          <span>TIẾP TỤC THIẾT LẬP</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

