'use client';

import React, { useState, useEffect } from 'react';
import { HeaderStats } from '@/components/HeaderStats';
import { QuickPromptBox } from '@/components/QuickPromptBox';
import { NextActionCard } from '@/components/NextActionCard';
import { CampaignWizard } from '@/components/CampaignWizard';
import { CampaignList } from '@/components/CampaignList';
import { TelegramSettingsModal } from '@/components/TelegramSettingsModal';
import { PilotLaunchCenter } from '@/components/PilotLaunchCenter';
import { AuthModal } from '@/components/AuthModal';
import { FacebookPublishModal } from '@/components/FacebookPublishModal';
import { ConnectedPagesModal } from '@/components/ConnectedPagesModal';
import { CampaignData } from '@/lib/types';
import { MANDATORY_DEMO_SCENARIO } from '@/lib/default-scenarios';
import { Sparkles, Layers, List, CheckCircle2, AlertOctagon, UserCheck, Globe, Link2 } from 'lucide-react';

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [stats, setStats] = useState({
    running: 0,
    drafts: 0,
    pending: 0,
    needsFix: 0,
    created: 0,
  });

  const [view, setView] = useState<'dashboard' | 'wizard' | 'campaigns'>('dashboard');
  const [selectedCampaign, setSelectedCampaign] = useState<Partial<CampaignData> | null>(null);
  const [pilotCampaign, setPilotCampaign] = useState<CampaignData | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isPilotOpen, setIsPilotOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isPagesModalOpen, setIsPagesModalOpen] = useState(false);
  const [facebookTargetCampaign, setFacebookTargetCampaign] = useState<Partial<CampaignData> | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [metaMode, setMetaMode] = useState<'MOCK' | 'REAL'>('MOCK');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Tải danh sách chiến dịch và tài khoản người dùng
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Lỗi fetch campaigns:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    if (typeof window !== 'undefined') {
      // Kiểm tra tham số OAuth chuyển hướng về
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('oauth') === 'success') {
        const count = urlParams.get('count') || 'các';
        showToast(`Liên kết Facebook OAuth thành công! Đã đồng bộ ${count} Fanpage vào tài khoản.`);
        window.history.replaceState({}, '', window.location.pathname);
      }

      const savedUser = localStorage.getItem('baha_current_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Mặc định tài khoản Founder BaHa cho trải nghiệm tiện lợi ngay lập tức
        const defaultUser = {
          id: 'usr-founder-baha',
          email: 'founder@bahagroup.vn',
          name: 'Diệu BaHa (Founder)',
          role: 'FOUNDER',
          emailVerified: true,
        };
        setCurrentUser(defaultUser);
        localStorage.setItem('baha_current_user', JSON.stringify(defaultUser));
      }
    }
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('baha_current_user', JSON.stringify(user));
    }
    showToast(`Chào mừng bạn quay lại, ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('baha_current_user');
    }
    showToast("Đã đăng xuất thành công.");
  };

  // Bắt đầu chiến dịch từ ô nhập ngôn ngữ tự nhiên
  const handleStartFromPrompt = (promptText: string) => {
    const text = promptText.toLowerCase();
    
    // Phân tích ý định cơ bản (Intent Extraction)
    let location = 'TP.Hồ Chí Minh';
    if (text.includes('hà nội')) location = 'TP.Hà Nội';
    if (text.includes('đà nẵng')) location = 'TP.Đà Nẵng';

    let dailyBudget = 200000;
    const budgetMatch = text.match(/(\d+)\s*(nghìn|k|000)/);
    if (budgetMatch) {
      const val = parseInt(budgetMatch[1], 10);
      dailyBudget = val >= 1000 ? val : val * 1000;
    }

    let durationDays = 7;
    const daysMatch = text.match(/(\d+)\s*ngày/);
    if (daysMatch) {
      durationDays = parseInt(daysMatch[1], 10);
    }

    let objective: any = 'MESSAGES';
    let objectiveText = 'Có thêm khách hàng liên hệ tư vấn';
    if (text.includes('web') || text.includes('truy cập')) {
      objective = 'TRAFFIC';
      objectiveText = 'Khách bấm vào tới trang web';
    } else if (text.includes('thông tin') || text.includes('hỏi giá')) {
      objective = 'LEAD';
      objectiveText = 'Khách để lại thông tin';
    }

    const newCamp: Partial<CampaignData> = {
      name: promptText ? promptText.slice(0, 50) : 'Chiến dịch mới',
      description: promptText,
      location,
      dailyBudget,
      durationDays,
      totalBudget: dailyBudget * durationDays,
      maxEstimatedSpend: dailyBudget * durationDays * 1.25,
      objective,
      objectiveText,
      status: 'DRAFT',
      version: 1,
    };

    setSelectedCampaign(newCamp);
    setView('wizard');
  };

  // Nạp kịch bản demo mẫu bắt buộc (Mục 09 đề bài BAHA)
  const handleLoadDemoScenario = () => {
    setSelectedCampaign(MANDATORY_DEMO_SCENARIO);
    setView('wizard');
    showToast("Đã nạp kịch bản mẫu bắt buộc: Tiệm làm đẹp TP.HCM (200k/ngày, 7 ngày)!");
  };

  // Lưu bản nháp vào backend
  const handleSaveDraft = async (campData: Partial<CampaignData>): Promise<CampaignData> => {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campData),
    });
    const data = await res.json();
    if (data.success) {
      await fetchCampaigns();
      return data.campaign;
    }
    throw new Error(data.error || 'Lỗi lưu bản nháp');
  };

  // Xóa chiến dịch
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản nháp/chiến dịch này không?")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast("Đã xóa chiến dịch thành công.");
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Gửi thông báo Telegram thật
  const handleSendTelegram = async (camp: CampaignData) => {
    const botToken = typeof window !== 'undefined' ? localStorage.getItem('baha_telegram_token') || undefined : undefined;
    const chatId = typeof window !== 'undefined' ? localStorage.getItem('baha_telegram_chat_id') || undefined : undefined;

    try {
      showToast("Đang gửi thông báo tới Telegram...");
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: camp.id,
          campaignData: camp,
          botToken,
          chatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã gửi tin nhắn THẬT tới Telegram thành công!");
        await fetchCampaigns();
      } else {
        alert(data.error || "Gửi thất bại. Hãy bấm 'Cấu hình Telegram' để kiểm tra Token và Chat ID.");
      }
    } catch (err: any) {
      alert("Lỗi kết nối Telegram: " + err.message);
    }
  };

  // Dừng khẩn cấp
  const handleStopEmergency = async (camp: CampaignData) => {
    if (!confirm(`XÁC NHẬN DỪNG KHẨN CẤP CHIẾN DỊCH: ${camp.code}?`)) return;
    try {
      const res = await fetch('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          campaignId: camp.id,
          metaCampaignId: camp.metaCampaignId,
          mode: metaMode,
        }),
      });
      const data = await res.json();
      showToast(data.message || "Đã kích hoạt ngắt mạch dừng khẩn cấp!");
      await fetchCampaigns();
      setIsPilotOpen(false);
    } catch (err: any) {
      alert("Lỗi dừng chiến dịch: " + err.message);
    }
  };

  // Bật chạy Pilot: Gọi Meta API kiểm tra và kích hoạt thật hoặc qua Adapter
  const handleStartPilot = async (camp: CampaignData) => {
    try {
      showToast("Đang gửi lệnh kích hoạt tới Meta...");
      const botToken = localStorage.getItem('baha_telegram_token') || undefined;
      const chatId = localStorage.getItem('baha_telegram_chat_id') || undefined;

      const res = await fetch('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          campaignId: camp.id,
          mode: metaMode,
          botToken,
          chatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Đã kích hoạt thành công! Trạng thái: ${data.status}`);
        await fetchCampaigns();
        setIsPilotOpen(false);
      } else {
        alert(data.error || "Meta từ chối kích hoạt chiến dịch.");
        await fetchCampaigns();
      }
    } catch (err: any) {
      alert("Lỗi kết nối Meta khi kích hoạt: " + err.message);
    }
  };

  const handleSyncInsights = async (camp: CampaignData) => {
    try {
      const res = await fetch('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insights',
          campaignId: camp.id,
          mode: camp.isMock ? 'MOCK' : 'REAL',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể đọc chi phí từ Meta');
      }
      showToast(camp.isMock ? 'Đã đồng bộ số liệu mô phỏng.' : 'Đã đồng bộ chi phí và số liệu từ Meta.');
      await fetchCampaigns();
    } catch (err: any) {
      alert(`Lỗi đồng bộ số liệu: ${err.message}`);
    }
  };

  const activeDraft = campaigns.find((c) => c.status === 'DRAFT');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#dfe2f1] flex flex-col font-sans selection:bg-[#38bdf8] selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] border border-[#10b981] text-[#10b981] px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <HeaderStats
        stats={stats}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onLoadDemoScenario={handleLoadDemoScenario}
        metaMode={metaMode}
        onToggleMetaMode={() => {
          const next = metaMode === 'MOCK' ? 'REAL' : 'MOCK';
          setMetaMode(next);
          showToast(`Đã chuyển chế độ Meta sang: ${next}`);
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Sub Navigation Bar - Stitch Cyber Theme */}
      <div className="bg-[#0b0f19] border-b border-[#1e293b] px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                view === 'dashboard' ? 'bg-[#1e293b] text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Màn hình chính
            </button>
            <button
              onClick={() => {
                setSelectedCampaign(null);
                setView('wizard');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                view === 'wizard' ? 'bg-[#1e293b] text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Thiết lập chiến dịch (8 Bước)
            </button>
            <button
              onClick={() => setView('campaigns')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                view === 'campaigns' ? 'bg-[#1e293b] text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Quảng cáo của tôi ({campaigns.length})
            </button>

            {/* Nút Đăng bài Fanpage 0đ nhanh */}
            <button
              onClick={() => {
                setFacebookTargetCampaign(null);
                setIsFacebookModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg font-bold bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/40 transition flex items-center gap-1.5 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Đăng Fanpage (0đ)</span>
            </button>

            {/* Nút Quản lý Fanpage OAuth 2.0 Multi-tenant */}
            <button
              onClick={() => setIsPagesModalOpen(true)}
              className="px-3 py-1.5 rounded-lg font-bold bg-[#1e293b] hover:bg-[#334155] text-[#10b981] border border-[#10b981]/40 transition flex items-center gap-1.5 shadow-sm"
            >
              <Link2 className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Kênh Fanpage (OAuth)</span>
            </button>
          </div>

          <div className="text-[#64748b] hidden lg:flex items-center gap-2">
            <span>Chính sách BaHa: Ngân sách ngày ≤ 500k</span>
            <span>•</span>
            <span>Meta: Luôn TẠM DỪNG</span>
            <span>•</span>
            <span className="text-[#10b981] font-semibold">Báo Telegram thật</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Prompt Input Box matching BaHa screenshot */}
            <QuickPromptBox
              onStartCampaign={handleStartFromPrompt}
              onResumeDraft={() => {
                if (activeDraft) {
                  setSelectedCampaign(activeDraft);
                  setView('wizard');
                } else {
                  showToast("Hiện không có bản nháp nào, tạo bản nháp mới.");
                  setSelectedCampaign(null);
                  setView('wizard');
                }
              }}
              onViewCampaigns={() => setView('campaigns')}
              onAdvancedSetup={() => {
                setSelectedCampaign(null);
                setView('wizard');
              }}
            />

            {/* Next Action Card matching BaHa screenshot */}
            <NextActionCard
              activeDraft={activeDraft}
              onContinue={() => {
                if (activeDraft) {
                  setSelectedCampaign(activeDraft);
                  setView('wizard');
                }
              }}
              otherDraftsCount={Math.max(0, campaigns.filter((c) => c.status === 'DRAFT').length - 1)}
            />

            {/* Recent Campaigns Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#f8fafc]">Chiến dịch gần đây</h3>
                <button
                  onClick={() => setView('campaigns')}
                  className="text-xs text-[#38bdf8] hover:underline font-bold"
                >
                  Xem tất cả ({campaigns.length}) ➔
                </button>
              </div>

              <CampaignList
                campaigns={campaigns.slice(0, 3)}
                onSelectCampaign={(c) => {
                  setSelectedCampaign(c);
                  setView('wizard');
                }}
                onDeleteCampaign={handleDeleteCampaign}
                onSendTelegram={handleSendTelegram}
                onStopEmergency={handleStopEmergency}
                onOpenPilot={(c) => {
                  setPilotCampaign(c);
                  setIsPilotOpen(true);
                }}
                onPublishFacebook={(c) => {
                  setFacebookTargetCampaign(c);
                  setIsFacebookModalOpen(true);
                }}
                onSyncInsights={handleSyncInsights}
              />
            </div>
          </div>
        )}

        {view === 'wizard' && (
          <CampaignWizard
            initialCampaign={selectedCampaign || undefined}
            onSaveDraft={handleSaveDraft}
            onComplete={(c) => {
              showToast("Đã hoàn thành thiết lập chiến dịch!");
              fetchCampaigns();
            }}
            onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
            onOpenPilot={(c) => {
              setPilotCampaign(c);
              setIsPilotOpen(true);
            }}
            metaMode={metaMode}
          />
        )}

        {view === 'campaigns' && (
          <CampaignList
            campaigns={campaigns}
            onSelectCampaign={(c) => {
              setSelectedCampaign(c);
              setView('wizard');
            }}
            onDeleteCampaign={handleDeleteCampaign}
            onSendTelegram={handleSendTelegram}
            onStopEmergency={handleStopEmergency}
            onOpenPilot={(c) => {
              setPilotCampaign(c);
              setIsPilotOpen(true);
            }}
            onPublishFacebook={(c) => {
              setFacebookTargetCampaign(c);
              setIsFacebookModalOpen(true);
            }}
            onSyncInsights={handleSyncInsights}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0b0f19] border-t border-[#1e293b] py-5 px-6 text-center text-xs text-[#64748b]">
        <p className="font-semibold text-[#94a3b8]">BAHA GROUP — Hệ thống Đánh giá Năng lực Thực chiến Tuyển dụng</p>
        <p className="mt-1 text-[11px] text-[#475569]">
          Giao diện theo chuẩn Stitch Design System: Autonomous Kinetic Pulse. Thiết lập quảng cáo trả phí an toàn tài chính.
        </p>
      </footer>

      {/* Telegram Configuration Modal */}
      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />

      {/* Pilot Launch Gate Modal */}
      {pilotCampaign && (
        <PilotLaunchCenter
          campaign={pilotCampaign}
          isOpen={isPilotOpen}
          onClose={() => setIsPilotOpen(false)}
          onStartPilot={handleStartPilot}
          onStopEmergency={handleStopEmergency}
        />
      )}

      {/* Auth Modal with Email OTP Verification */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Facebook Publish Modal (Meta Graph API 0đ) */}
      <FacebookPublishModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
        campaign={facebookTargetCampaign}
        onPublishedSuccess={() => {
          showToast("Đã đăng bài lên Fanpage thành công!");
          fetchCampaigns();
        }}
        onOpenConnectedPages={() => setIsPagesModalOpen(true)}
      />

      {/* Multi-Tenant Facebook Connected Pages Modal */}
      <ConnectedPagesModal
        isOpen={isPagesModalOpen}
        onClose={() => setIsPagesModalOpen(false)}
        onSelectPage={(page) => {
          showToast(`Đã chọn Fanpage: ${page.pageName}`);
        }}
      />
    </div>
  );
}
