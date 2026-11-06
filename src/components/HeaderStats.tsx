'use client';

import React from 'react';
import { Send, Shield, Zap, User as UserIcon, CheckCircle2 } from 'lucide-react';

interface HeaderStatsProps {
  stats: {
    running: number;
    drafts: number;
    pending: number;
    needsFix: number;
    created: number;
  };
  onOpenTelegramModal: () => void;
  onLoadDemoScenario: () => void;
  metaMode: 'MOCK' | 'REAL';
  onToggleMetaMode: () => void;
  currentUser: any | null;
  onOpenAuthModal: () => void;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  stats,
  onOpenTelegramModal,
  onLoadDemoScenario,
  metaMode,
  onToggleMetaMode,
  currentUser,
  onOpenAuthModal,
}) => {
  return (
      <div className="w-full bg-[#111827] border-b border-[#1e293b] sticky top-0 z-40 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Brand - Stitch Cyber styling */}
          <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#38bdf8] flex items-center justify-center font-extrabold text-white shadow-lg shadow-[#38bdf8]/20 tracking-wider">
                BH
              </div>
              <div>
                <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-lg text-[#f8fafc] tracking-wide font-sans">BAHA ADS</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-semibold">
                      PRO v2.0
                    </span>
                </div>
                <p className="text-xs text-[#94a3b8]">Hệ thống Thiết Lập Quảng Cáo Trả Phí Tự Động</p>
              </div>
            </div>

            {/* 5 Stats Columns - Theo đúng screenshot BAHA */}
              <div className="grid grid-cols-5 gap-2 md:gap-4 bg-[#0b0f19] p-2 rounded-xl border border-[#1e293b] text-center shadow-inner">
                <div className="px-2 py-1">
                    <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">ĐANG CHẠY</div>
                    <div className="text-xs md:text-sm font-bold text-[#f59e0b]">
                      {stats.running > 0 ? stats.running : 'CHƯA XÁC MINH'}
                    </div>
                  </div>

                    <div className="px-2 py-1 border-l border-[#1e293b]">
                      <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">BẢN NHÁP</div>
                      <div className="text-sm md:text-base font-extrabold text-[#f8fafc]">{stats.drafts}</div>
                    </div>

                      <div className="px-2 py-1 border-l border-[#1e293b]">
                        <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">CHỜ DUYỆT</div>
                        <div className="text-sm md:text-base font-extrabold text-[#10b981]">{stats.pending}</div>
                      </div>

                        <div className="px-2 py-1 border-l border-[#1e293b]">
                          <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">CẦN SỬA</div>
                          <div className="text-sm md:text-base font-bold text-[#64748b]">{stats.needsFix}</div>
                        </div>

                          <div className="px-2 py-1 border-l border-[#1e293b]">
                            <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">ĐÃ TẠO</div>
                            <div className="text-sm md:text-base font-extrabold text-[#38bdf8]">{stats.created}</div>
                          </div>
                        </div>

                          {/* Quick Tools, Auth & Toggles */}
                          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                            {/* User Auth Button */}
                            <button
                              onClick={onOpenAuthModal}
                              className={`text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 border transition ${currentUser
                                  ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/40 hover:bg-[#10b981]/20 font-bold'
                                  : 'bg-[#1e293b] text-[#f8fafc] border-[#334155] hover:bg-[#334155]'
                                }`}
                            >
                              <UserIcon className="w-3.5 h-3.5" />
                              <span>{currentUser ? currentUser.name : 'Đăng Nhập'}</span>
                            </button>

                            {/* Mode Badge */}
                            <button
                              onClick={onToggleMetaMode}
                              title="Bấm để đổi chế độ API Meta"
                                      ? 'bg-[#1e293b] text-[#38bdf8] border-[#38bdf8]/40 hover:bg-[#38bdf8]/10'
                                      : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/50 hover:bg-[#10b981]/25'
                                  }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Meta: {metaMode}</span>
          </button>

          {/* Telegram Settings */}
          <button
            onClick={onOpenTelegramModal}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1e293b] text-[#f8fafc] border border-[#334155] hover:bg-[#334155] flex items-center space-x-1.5 transition"
          >
            <Send className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">Cấu hình</span> Telegram
          </button>

          {/* Demo Scenario Button */}
          <button
            onClick={onLoadDemoScenario}
            title="Nạp nhanh kịch bản Tiệm sắc đẹp TP.HCM (Mục 09 đề bài)"
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40 hover:bg-[#f59e0b]/25 flex items-center space-x-1.5 font-bold transition shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Demo TP.HCM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
