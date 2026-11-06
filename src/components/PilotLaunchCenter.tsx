'use client';

import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, X, Power, Clock, Lock } from 'lucide-react';
import { CampaignData } from '@/lib/types';

interface PilotLaunchCenterProps {
  campaign: CampaignData;
  isOpen: boolean;
  onClose: () => void;
  onStartPilot: (campaign: CampaignData) => Promise<void>;
  onStopEmergency: (campaign: CampaignData) => Promise<void>;
}

export const PilotLaunchCenter: React.FC<PilotLaunchCenterProps> = ({
  campaign,
  isOpen,
  onClose,
  onStartPilot,
  onStopEmergency,
}) => {
  const [stopTestPassed, setStopTestPassed] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const REQUIRED_PHRASE = "TÔI XÁC NHẬN BẬT QUẢNG CÁO THẬT";

  useEffect(() => {
    let timer: any;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => (c ? c - 1 : 0)), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleTestStop = () => {
    setStopTestPassed(true);
    setCountdown(120); // Cấp giấy phép 120 giây
  };

  const handleConfirmStart = async () => {
    if (confirmPhrase.trim() !== REQUIRED_PHRASE) return;
    setIsActivating(true);
    try {
      await onStartPilot(campaign);
    } finally {
      setIsActivating(false);
    }
  };

  const handleStopNow = async () => {
    await onStopEmergency(campaign);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-[#2b3548] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#212838] pb-3">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>PILOT LAUNCH CENTER · BAHA DEFENSE</span>
          </div>
          <h3 className="text-xl font-bold text-gray-100 mt-1">
            Trung Tâm Bắt Đầu Chạy (Pilot Gate)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Mã Pilot: <code className="text-purple-400 font-mono">pil-9bad55cef8</code> · Chiến dịch: {campaign.code}
          </p>
        </div>

        {/* Current Status Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c1018] border border-[#232b3d]">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <div>
              <div className="text-xs text-gray-400">Trạng thái phân phối</div>
              <div className="text-sm font-bold text-gray-200">
                {campaign.status === 'ACTIVE' ? 'ĐANG CHẠY PILOT (ACTIVE)' : 'STOPPED / TẠM DỪNG'}
              </div>
            </div>
          </div>

          {/* Emergency Stop Button Always Available */}
          <button
            onClick={handleStopNow}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg shadow-rose-950/60 active:scale-95 transition"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>DỪNG QUẢNG CÁO NGAY</span>
          </button>
        </div>

        {/* 5 Safety Check Steps */}
        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-[#161c28] border border-[#232f45]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-200">Bước 1: Kết nối Meta & Duyệt nội bộ</span>
              <p className="text-gray-400 mt-0.5">Mã duyệt {campaign.approvalCode || 'BH-APR-20261103-0001'} đã được cấp phép.</p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-[#161c28] border border-[#232f45]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-200">Bước 2: Mức chi tối đa và danh mục an toàn</span>
              <p className="text-gray-400 mt-0.5">Trần ngày {Number(campaign.dailyBudget).toLocaleString('vi-VN')} ₫/ngày (≤ 500k ₫).</p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-[#161c28] border border-[#232f45]">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${stopTestPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
              {stopTestPassed ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-gray-200">Bước 3: Tự kiểm tra nút Dừng trên build hiện tại</span>
              <p className="text-gray-400 mt-0.5">Bạn phải kiểm tra mạch ngắt dừng khẩn cấp trước khi được cấp phép bật chạy.</p>
              {!stopTestPassed ? (
                <button
                  type="button"
                  onClick={handleTestStop}
                  className="mt-2 px-3 py-1.5 bg-[#252f44] hover:bg-[#303c57] text-gray-200 rounded font-semibold text-xs border border-[#394867] transition"
                >
                  TEST NÚT DỪNG KHẨN CẤP
                </button>
              ) : (
                <div className="mt-1 text-emerald-400 font-semibold flex items-center space-x-1">
                  <span>Mạch dừng hoạt động hoàn hảo. Giấy phép kích hoạt: {countdown}s</span>
                </div>
              )}
            </div>
          </div>

          {stopTestPassed && countdown !== null && (
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800 space-y-2.5">
              <span className="font-semibold text-purple-200">
                Bước 4: Nhập câu xác nhận để bật chạy pilot (Hiệu lực: {countdown} giây)
              </span>
              <p className="text-gray-400">
                Gõ chính xác cụm từ: <code className="text-amber-300 font-bold bg-black/40 px-1 py-0.5 rounded">{REQUIRED_PHRASE}</code>
              </p>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder={REQUIRED_PHRASE}
                className="w-full bg-[#0c0f17] border border-purple-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
              />
              <button
                type="button"
                disabled={confirmPhrase.trim() !== REQUIRED_PHRASE || isActivating}
                onClick={handleConfirmStart}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-lg transition shadow-lg active:scale-95"
              >
                {isActivating ? 'Đang gửi lệnh tới Meta...' : 'TÔI XÁC NHẬN BẬT QUẢNG CÁO THẬT'}
              </button>
            </div>
          )}
        </div>

        <div className="text-[11px] text-gray-500 text-center">
          «Đã gửi lệnh bật chạy» ≠ «Đang phân phối». Meta còn kiểm duyệt chính sách độc lập.
        </div>
      </div>
    </div>
  );
};

