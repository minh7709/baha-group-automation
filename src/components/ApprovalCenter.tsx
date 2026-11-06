'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Lock, Send, RefreshCw, PlayCircle, ExternalLink } from 'lucide-react';
import { CampaignData } from '@/lib/types';

interface ApprovalCenterProps {
  campaign: CampaignData;
  onApproveInternal: (campaign: CampaignData) => Promise<void>;
  onCreateOnMeta: (campaign: CampaignData) => Promise<void>;
  onOpenPilot: (campaign: CampaignData) => void;
  isLoading: boolean;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  campaign,
  onApproveInternal,
  onCreateOnMeta,
  onOpenPilot,
  isLoading,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dailyBudget = campaign.dailyBudget || 200000;
  const duration = campaign.durationDays || 7;
  const total = dailyBudget * duration;
  const maxSpend = total * 1.25;

  const isSafeDaily = dailyBudget <= 500000;
  const isSafeTotal = maxSpend <= 2000000;
  const isSafeDuration = duration <= 14;

  const isApproved = !!campaign.approvalCode;
  const isCreatedOnMeta = campaign.status === 'CREATED_PAUSED' || campaign.status === 'ACTIVE';

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApproveInternal(campaign);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMeta = async () => {
    setIsSubmitting(true);
    try {
      await onCreateOnMeta(campaign);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#131722] border border-[#232b3d] rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Title & Stage */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#212838] pb-4 gap-2">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>BƯỚC 7: XEM TRƯỚC, PHÊ DUYỆT & TẠO TRÊN META</span>
          </span>
          <h3 className="text-lg md:text-xl font-bold text-gray-100 mt-1">
            Trung Tâm Phê Duyệt An Toàn Tài Chính
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {isApproved ? (
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ĐÃ DUYỆT NỘI BỘ</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-950/80 text-amber-400 border border-amber-800 rounded-lg text-xs font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>CHƯA DUYỆT NỘI BỘ</span>
            </span>
          )}

          {isCreatedOnMeta && (
            <span className="px-3 py-1 bg-blue-950/80 text-blue-400 border border-blue-800 rounded-lg text-xs font-bold">
              Meta: CREATED_PAUSED
            </span>
          )}
        </div>
      </div>

      {/* Safety Policy Box (Chuẩn theo văn bản của BaHa Founder) */}
      <div className="bg-[#0e121a] border border-[#273248] rounded-xl p-4 text-xs md:text-sm text-gray-300 space-y-2">
        <div className="font-semibold text-gray-200 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Giới hạn chính sách an toàn hiện tại của BAHA GROUP:</span>
        </div>
        <p className="text-gray-400 leading-relaxed">
          Ngân sách ngày <strong className={isSafeDaily ? 'text-emerald-400' : 'text-rose-400'}>≤ 500.000 ₫</strong> (Hiện tại: {Number(dailyBudget).toLocaleString('vi-VN')} ₫) · 
          Ước tính mức chi cần dự phòng <strong className={isSafeTotal ? 'text-emerald-400' : 'text-rose-400'}>≤ 2.000.000 ₫</strong> (Hiện tại: {Number(maxSpend).toLocaleString('vi-VN')} ₫) · 
          Lịch <strong className={isSafeDuration ? 'text-emerald-400' : 'text-rose-400'}>≤ 14 ngày</strong> (Hiện tại: {duration} ngày) và có ngày kết thúc · 
          Khóa ghi toàn cục: <strong className="text-emerald-400">ON</strong>. Mọi đối tượng tạo ra ở trạng thái <strong className="text-amber-400">TẠM DỪNG (PAUSED)</strong>.
        </p>

        {campaign.specialCategory !== 'NONE' && (
          <div className="bg-amber-950/40 border border-amber-800/80 p-2.5 rounded-lg text-amber-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Có dấu hiệu quảng cáo đặc biệt ({campaign.specialCategory}) — Đã khai báo theo chính sách Meta.</span>
          </div>
        )}
      </div>

      {/* Approval Info Details */}
      {isApproved && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#171d2b] p-4 rounded-xl border border-[#26334a] text-xs">
          <div>
            <div className="text-gray-400">Mã duyệt nội bộ</div>
            <div className="font-mono text-emerald-400 font-bold text-sm mt-0.5">{campaign.approvalCode}</div>
          </div>
          <div>
            <div className="text-gray-400">Người phê duyệt</div>
            <div className="text-gray-200 font-semibold mt-0.5">{campaign.approvedBy || 'founder (Founder)'}</div>
          </div>
          <div>
            <div className="text-gray-400">Mã vân tay dữ liệu (Checksum)</div>
            <div className="font-mono text-gray-300 text-xs mt-0.5 truncate">{campaign.fingerprint || 'a651ab1de86479ab'}</div>
          </div>
        </div>
      )}

      {/* Meta Created Objects */}
      {isCreatedOnMeta && (
        <div className="bg-[#101a2b] border border-blue-900/60 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-blue-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>ĐÃ TẠO TRÊN META — TẠM DỪNG (Chưa chạy, chưa tiêu tiền)</span>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              {campaign.isMock ? 'CHẾ ĐỘ MÔ PHỎNG MOCK' : 'META MARKETING API THẬT'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
            <div className="bg-[#0b101c] p-2 rounded border border-blue-900/40">
              <div className="text-gray-400">Chiến dịch ID</div>
              <div className="text-blue-300 truncate font-semibold">{campaign.metaCampaignId}</div>
            </div>
            <div className="bg-[#0b101c] p-2 rounded border border-blue-900/40">
              <div className="text-gray-400">Nhóm quảng cáo ID</div>
              <div className="text-blue-300 truncate font-semibold">{campaign.metaAdSetId}</div>
            </div>
            <div className="bg-[#0b101c] p-2 rounded border border-blue-900/40">
              <div className="text-gray-400">Creative ID</div>
              <div className="text-blue-300 truncate font-semibold">{campaign.metaCreativeId}</div>
            </div>
            <div className="bg-[#0b101c] p-2 rounded border border-blue-900/40">
              <div className="text-gray-400">Quảng cáo ID</div>
              <div className="text-blue-300 truncate font-semibold">{campaign.metaAdId}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {!isApproved ? (
          <button
            type="button"
            disabled={isSubmitting || isLoading || !isSafeDaily || !isSafeTotal}
            onClick={handleApprove}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-950/60 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>PHÊ DUYỆT NỘI BỘ CHIẾN DỊCH</span>
          </button>
        ) : !isCreatedOnMeta ? (
          <button
            type="button"
            disabled={isSubmitting || isLoading}
            onClick={handleCreateMeta}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-blue-950/60 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>TẠO TRÊN META (TẠM DỪNG) & BẮN TELEGRAM THẬT</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenPilot(campaign)}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-purple-950/60 active:scale-95"
          >
            <PlayCircle className="w-4 h-4" />
            <span>MỞ TRUNG TÂM BẮT ĐẦU CHẠY (PILOT GATE)</span>
          </button>
        )}

        <div className="text-xs text-gray-400">
          Không có bước nào tự động gửi lệnh trừ tiền. Founder hoàn toàn kiểm soát quyết định.
        </div>
      </div>
    </div>
  );
};

