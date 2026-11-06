'use client';

import React, { useState } from 'react';
import { 
  FolderOpen, Send, AlertOctagon, CheckCircle2, Clock, Trash2, 
  ExternalLink, PlayCircle, Eye, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { CampaignData, CampaignStatus } from '@/lib/types';

interface CampaignListProps {
  campaigns: CampaignData[];
  onSelectCampaign: (campaign: CampaignData) => void;
  onDeleteCampaign: (id: string) => void;
  onSendTelegram: (campaign: CampaignData) => void;
  onStopEmergency: (campaign: CampaignData) => void;
  onOpenPilot: (campaign: CampaignData) => void;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  onSelectCampaign,
  onDeleteCampaign,
  onSendTelegram,
  onStopEmergency,
  onOpenPilot,
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesFilter = 
      filter === 'ALL' ||
      (filter === 'DRAFT' && c.status === 'DRAFT') ||
      (filter === 'APPROVED' && (c.status === 'APPROVED_INTERNAL' || c.approvalCode)) ||
      (filter === 'META' && (c.status === 'CREATED_PAUSED' || c.metaCampaignId)) ||
      (filter === 'ACTIVE' && c.status === 'ACTIVE') ||
      (filter === 'STOPPED' && c.status === 'STOPPED');

    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700">Bản nháp</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">Chờ duyệt</span>;
      case 'APPROVED_INTERNAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">Đã duyệt nội bộ</span>;
      case 'CREATED_PAUSED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">Meta: CREATED_PAUSED</span>;
      case 'ACTIVE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-950 text-green-300 border border-green-700 animate-pulse">ĐANG CHẠY (ACTIVE)</span>;
      case 'STOPPED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800">ĐÃ DỪNG (STOPPED)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-[#131722] border border-[#232b3d] rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#212838] pb-4">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">BƯỚC 8: QUẢN TRỊ CHIẾN DỊCH QUẢNG CÁO</span>
          <h3 className="text-lg md:text-xl font-bold text-gray-100 mt-0.5">
            Danh Sách Chiến Dịch Của Tôi ({filteredCampaigns.length})
          </h3>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã hoặc tên chiến dịch..."
          className="bg-[#0c0f17] border border-[#273248] rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-full md:w-64"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'DRAFT', label: 'Bản nháp' },
          { key: 'APPROVED', label: 'Đã duyệt nội bộ' },
          { key: 'META', label: 'Tạo trên Meta' },
          { key: 'ACTIVE', label: 'Đang chạy' },
          { key: 'STOPPED', label: 'Đã dừng' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === tab.key
                ? 'bg-[#202a3d] text-emerald-300 border border-emerald-800/80'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a2130]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          Không tìm thấy chiến dịch nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-[#0e121a] border border-[#212b3e] hover:border-[#313f5c] rounded-xl p-4 transition shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Column: Info */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                    {camp.code}
                  </span>
                  {getStatusBadge(camp.status)}
                  {camp.telegramSent && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-sky-400" />
                      <span>Telegram Đã Bắn</span>
                    </span>
                  )}
                  {camp.approvalCode && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-900">
                      Mã duyệt: {camp.approvalCode}
                    </span>
                  )}
                </div>

                <h4 className="text-sm md:text-base font-bold text-gray-100 truncate">
                  {camp.name}
                </h4>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>🎯 {camp.objectiveText}</span>
                  <span>📍 {camp.location}</span>
                  <span>💰 {Number(camp.dailyBudget).toLocaleString('vi-VN')} ₫/ngày ({camp.durationDays} ngày)</span>
                  <span className="font-semibold text-gray-300">Tổng: {Number(camp.totalBudget).toLocaleString('vi-VN')} ₫</span>
                </div>

                {camp.metaCampaignId && (
                  <div className="text-[11px] font-mono text-blue-400 pt-0.5">
                    Meta ID: {camp.metaCampaignId} ({camp.isMock ? 'Mô phỏng' : 'Thật'})
                  </div>
                )}
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCampaign(camp)}
                  className="px-3 py-1.5 bg-[#1b2333] hover:bg-[#253046] text-gray-200 border border-[#2d3a54] rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chi tiết</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSendTelegram(camp)}
                  title="Gửi thông báo thật tới Telegram"
                  className="px-3 py-1.5 bg-[#142338] hover:bg-[#1d3352] text-sky-300 border border-sky-900 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Bắn Telegram</span>
                </button>

                {camp.status === 'ACTIVE' || camp.status === 'CREATED_PAUSED' ? (
                  <button
                    type="button"
                    onClick={() => onStopEmergency(camp)}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    <span>DỪNG NGAY</span>
                  </button>
                ) : null}

                {camp.status === 'CREATED_PAUSED' && (
                  <button
                    type="button"
                    onClick={() => onOpenPilot(camp)}
                    className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>Pilot Gate</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteCampaign(camp.id)}
                  title="Xóa bản nháp"
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
  );
};

