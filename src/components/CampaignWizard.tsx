'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Check, ArrowRight, ArrowLeft, Shield, AlertTriangle, 
  Send, Eye, DollarSign, MapPin, Users, FileText, Image as ImageIcon,
  CheckCircle2, RefreshCw, Lock
} from 'lucide-react';
import { CampaignData, CampaignObjective } from '@/lib/types';
import { AdMockupPreview } from './AdMockupPreview';
import { ApprovalCenter } from './ApprovalCenter';

interface CampaignWizardProps {
  initialCampaign?: Partial<CampaignData>;
  onSaveDraft: (campaign: Partial<CampaignData>) => Promise<CampaignData>;
  onComplete: (campaign: CampaignData) => void;
  onOpenTelegramModal: () => void;
  onOpenPilot: (campaign: CampaignData) => void;
  metaMode: 'MOCK' | 'REAL';
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({
  initialCampaign,
  onSaveDraft,
  onComplete,
  onOpenTelegramModal,
  onOpenPilot,
  metaMode,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<CampaignData>>({
    name: initialCampaign?.name || '',
    description: initialCampaign?.description || '',
    imageUrl: initialCampaign?.imageUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    objective: initialCampaign?.objective || 'MESSAGES',
    objectiveText: initialCampaign?.objectiveText || 'Có thêm khách hàng liên hệ tư vấn',
    specialCategory: initialCampaign?.specialCategory || 'NONE',
    location: initialCampaign?.location || 'TP.Hồ Chí Minh',
    radiusKm: initialCampaign?.radiusKm || 15,
    targetAge: initialCampaign?.targetAge || '25 - 45',
    targetGender: initialCampaign?.targetGender || 'FEMALE',
    targetInterests: initialCampaign?.targetInterests || ['Chăm sóc sắc đẹp', 'Spa'],
    dailyBudget: initialCampaign?.dailyBudget || 200000,
    durationDays: initialCampaign?.durationDays || 7,
    totalBudget: (initialCampaign?.dailyBudget || 200000) * (initialCampaign?.durationDays || 7),
    maxEstimatedSpend: (initialCampaign?.dailyBudget || 200000) * (initialCampaign?.durationDays || 7) * 1.25,
    startDate: initialCampaign?.startDate || new Date().toISOString().slice(0, 10),
    endDate: initialCampaign?.endDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    headline: initialCampaign?.headline || 'Tỏa Sáng Làn Da Rạng Rỡ - Ưu Đãi 50% Hôm Nay',
    primaryText: initialCampaign?.primaryText || 'Đăng ký ngay để nhận tư vấn và phác đồ chăm sóc sắc đẹp chuẩn y khoa!',
    callToAction: initialCampaign?.callToAction || 'SEND_MESSAGE',
    pageName: initialCampaign?.pageName || 'Diệu BaHa - Spa & Thẩm Mỹ Viện',
    status: initialCampaign?.status || 'DRAFT',
    version: initialCampaign?.version || 1,
    ...initialCampaign,
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [specialWarning, setSpecialWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [connectedPages, setConnectedPages] = useState<Array<{ pageId: string; pageName: string }>>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/pages')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setConnectedPages(data.pages || []);
      })
      .catch((err) => console.error('Lỗi tải Fanpage đã kết nối:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Update budget calculations
  const handleBudgetChange = (daily: number, days: number) => {
    const total = daily * days;
    const maxSpend = total * 1.25;
    setFormData((prev) => ({
      ...prev,
      dailyBudget: daily,
      durationDays: days,
      totalBudget: total,
      maxEstimatedSpend: maxSpend,
    }));
  };

  // AI Content Generator
  const handleGenerateAI = async () => {
    if (!formData.name) {
      alert("Vui lòng nhập tên sản phẩm/dịch vụ ở Bước 1 trước khi gọi AI gợi ý!");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          description: formData.description,
          objective: formData.objectiveText,
          location: formData.location,
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        const s = data.suggestions;
        setAiSuggestions(s);
        setFormData((prev) => ({
          ...prev,
          headline: s.headlines?.[0] || prev.headline,
          primaryText: s.primaryTexts?.[0] || prev.primaryText,
          callToAction: s.callToAction || prev.callToAction,
          targetAge: s.suggestedTargeting?.ageRange || prev.targetAge,
          targetGender: s.suggestedTargeting?.gender || prev.targetGender,
          targetInterests: s.suggestedTargeting?.interests || prev.targetInterests,
          specialCategory: s.specialCategoryCheck?.recommendedCategory || prev.specialCategory,
        }));
        if (s.specialCategoryCheck?.warningMessage) {
          setSpecialWarning(s.specialCategoryCheck.warningMessage);
        }
      }
    } catch (err) {
      console.error("Lỗi tạo AI:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (overrideStatus?: any) => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const toSave = { ...formData };
      if (overrideStatus) toSave.status = overrideStatus;
      const saved = await onSaveDraft(toSave);
      setFormData(saved);
      setSaveSuccessMsg("Đã lưu bản nháp thành công!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return saved;
    } finally {
      setIsSaving(false);
    }
  };

  // Phê duyệt nội bộ (B7)
  const handleApproveInternal = async (camp: CampaignData) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const approvalCode = `BH-APR-${dateStr}-${randDigits}`;
    const fingerprint = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

    const updated = await handleSave({
      ...camp,
      approvalCode,
      fingerprint,
      approvedBy: 'founder (Founder)',
      approvedAt: now.toISOString(),
      status: 'APPROVED_INTERNAL',
    });
  };

  // Tạo trên Meta (TẠM DỪNG) và Bắn Telegram THẬT
  const handleCreateOnMeta = async (camp: CampaignData) => {
    setIsSaving(true);
    try {
      const botToken = localStorage.getItem('baha_telegram_token') || undefined;
      const chatId = localStorage.getItem('baha_telegram_chat_id') || undefined;

      // 1. Gọi API Meta với đầy đủ adapter và kiểm tra kết quả chặt chẽ
      const metaRes = await fetch('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          campaign: camp,
          campaignId: camp.id,
          mode: metaMode,
          botToken,
          chatId,
        }),
      });
      const metaJson = await metaRes.json();

      // Kiểm tra metaJson.success trước khi cập nhật (P0 Requirement)
      if (!metaRes.ok || !metaJson.success) {
        alert(`Không thể tạo trên Meta: ${metaJson.error || 'Lỗi không xác định.'}`);
        const errorCamp: CampaignData = {
          ...camp,
          status: 'INTEGRATION_ERROR',
          lastError: metaJson.error,
          errorStep: metaJson.errorStep,
        };
        setFormData(errorCamp);
        await handleSave(errorCamp);
        return;
      }

      const finalCamp: CampaignData = metaJson.campaign || {
        ...camp,
        status: 'CREATED_PAUSED',
        metaCampaignId: metaJson.metaCampaignId,
        metaAdSetId: metaJson.metaAdSetId,
        metaCreativeId: metaJson.metaCreativeId,
        metaAdId: metaJson.metaAdId,
        isMock: metaJson.isMock,
        telegramSent: true,
        telegramSentAt: new Date().toISOString(),
      };

      setFormData(finalCamp);
      await handleSave(finalCamp);
      onComplete(finalCamp);
      setCurrentStep(8);
    } catch (err: any) {
      console.error(err);
      alert("Lỗi kết nối khi gửi lệnh tạo lên Meta: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { num: 1, label: 'Thông tin' },
    { num: 2, label: 'Mục tiêu' },
    { num: 3, label: 'Khách hàng' },
    { num: 4, label: 'Ngân sách' },
    { num: 5, label: 'Nội dung AI' },
    { num: 6, label: 'Xem trước' },
    { num: 7, label: 'Duyệt & Meta' },
    { num: 8, label: 'Hoàn tất' },
  ];

  return (
    <div className="w-full bg-[#141822] border border-[#232a3b] rounded-2xl shadow-xl overflow-hidden">
      {/* Step Indicator Header */}
      <div className="bg-[#0f131c] border-b border-[#212838] p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto pb-1 gap-2">
          {steps.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <div
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center space-x-2 shrink-0 cursor-pointer select-none transition ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : isCompleted
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/60 ring-2 ring-emerald-500/30'
                      : isCompleted
                      ? 'bg-[#1e2738] text-emerald-400 border border-emerald-800'
                      : 'bg-[#151a24] text-gray-500 border border-[#232b3d]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className="text-xs hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Body */}
      <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* B1: NHẬP THÔNG TIN CƠ BẢN */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BƯỚC 1 / 8</span>
              <h3 className="text-xl font-bold text-gray-100 mt-1">Thông tin Sản phẩm hoặc Dịch vụ</h3>
              <p className="text-xs text-gray-400">
                Hãy cho chúng tôi biết bạn muốn quảng cáo điều gì. Dữ liệu này sẽ được AI sử dụng để viết bài quảng cáo.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tên sản phẩm / Dịch vụ của bạn: *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Dịch vụ Chăm sóc sắc đẹp tại TP.HCM hoặc Thiết kế thi công nội thất"
                  className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Mô tả ngắn, thế mạnh hoặc ưu đãi đặc biệt:
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Ví dụ: Trị liệu trẻ hóa da chuyên sâu chuẩn y khoa, cam kết da mịn màng ngay buổi đầu. Giảm ngay 50% cho khách đăng ký hôm nay."
                  className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Đường dẫn Hình ảnh / Video đại diện:
                </label>
                <input
                  type="text"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-xs text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80' })}
                    className="text-[11px] px-2.5 py-1 rounded bg-[#1c2333] hover:bg-[#253046] text-gray-300 border border-[#2a3852]"
                  >
                    Dùng ảnh Spa & Làm đẹp (Mẫu TP.HCM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80' })}
                    className="text-[11px] px-2.5 py-1 rounded bg-[#1c2333] hover:bg-[#253046] text-gray-300 border border-[#2a3852]"
                  >
                    Dùng ảnh Nội thất BaHa Homes
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tên Fanpage hiển thị trên quảng cáo:
                </label>
                {connectedPages.length > 0 ? (
                  <select
                    value={formData.pageId || ''}
                    onChange={(e) => {
                      const page = connectedPages.find((item) => item.pageId === e.target.value);
                      setFormData({
                        ...formData,
                        pageId: page?.pageId,
                        pageName: page?.pageName || formData.pageName,
                      });
                    }}
                    className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Chọn Fanpage đã kết nối --</option>
                    {connectedPages.map((page) => (
                      <option key={page.pageId} value={page.pageId}>
                        {page.pageName} ({page.pageId})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300">
                    Chưa có Fanpage được kết nối. Hãy kết nối Fanpage trước khi tạo quảng cáo thật.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* B2: CHỌN MỤC TIÊU */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BƯỚC 2 / 8</span>
              <h3 className="text-xl font-bold text-gray-100 mt-1">Chọn kết quả bạn mong muốn đạt được</h3>
              <p className="text-xs text-gray-400">
                Không dùng thuật ngữ phức tạp. Hãy chọn điều bạn muốn quảng cáo này mang lại cho cửa hàng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              {[
                {
                  key: 'MESSAGES',
                  title: 'Khách nhắn tin tư vấn',
                  desc: 'Khách bấm vào quảng cáo sẽ mở ngay cuộc hội thoại Messenger với bạn để hỏi giá và đặt lịch.',
                  badge: 'Đề xuất cho Spa / Làm đẹp',
                },
                {
                  key: 'LEAD',
                  title: 'Khách để lại thông tin',
                  desc: 'Thu thập họ tên, số điện thoại của người quan tâm để nhân viên gọi điện tư vấn chốt đơn.',
                  badge: 'Phù hợp Bất động sản / Nội thất',
                },
                {
                  key: 'TRAFFIC',
                  title: 'Khách bấm vào website',
                  desc: 'Dẫn khách hàng trực tiếp về website hoặc trang bán hàng online của bạn để xem sản phẩm.',
                  badge: 'Phù hợp Shop có website',
                },
              ].map((opt) => (
                <div
                  key={opt.key}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      objective: opt.key as CampaignObjective,
                      objectiveText: opt.title,
                    })
                  }
                  className={`p-4 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                    formData.objective === opt.key
                      ? 'bg-[#182335] border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-[#0f131c] border-[#252f44] hover:border-gray-600'
                  }`}
                >
                  <div>
                    <div className="text-xs text-emerald-400 font-semibold mb-1">{opt.badge}</div>
                    <div className="font-bold text-gray-100 text-sm md:text-base">{opt.title}</div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{opt.desc}</p>
                  </div>
                  <div className="pt-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        formData.objective === opt.key
                          ? 'bg-emerald-500 text-gray-900'
                          : 'bg-[#1e2535] text-gray-400'
                      }`}
                    >
                      {formData.objective === opt.key ? 'Đang chọn' : 'Chọn mục tiêu này'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* B3: CHỌN ĐỐI TƯỢNG & KHU VỰC */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BƯỚC 3 / 8</span>
              <h3 className="text-xl font-bold text-gray-100 mt-1">Khách hàng & Khu vực quảng cáo</h3>
              <p className="text-xs text-gray-400">
                Chọn địa bàn nơi khách hàng của bạn sinh sống và nhóm khách hàng có khả năng mua hàng cao nhất.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Tỉnh / Thành phố muốn quảng cáo:
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="VD: TP.Hồ Chí Minh hoặc Hà Nội"
                    className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Bán kính xung quanh:
                  </label>
                  <select
                    value={formData.radiusKm || 15}
                    onChange={(e) => setFormData({ ...formData, radiusKm: Number(e.target.value) })}
                    className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={5}>Trong vòng 5 km (Rất gần cửa hàng)</option>
                    <option value={10}>Trong vòng 10 km</option>
                    <option value={15}>Trong vòng 15 km (Khuyên dùng)</option>
                    <option value={25}>Trong vòng 25 km (Toàn thành phố)</option>
                    <option value={0}>Toàn quốc (Không giới hạn km)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Độ tuổi phù hợp:
                  </label>
                  <input
                    type="text"
                    value={formData.targetAge || '25 - 45'}
                    onChange={(e) => setFormData({ ...formData, targetAge: e.target.value })}
                    placeholder="25 - 45"
                    className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Giới tính:
                  </label>
                  <div className="flex gap-2">
                    {[
                      { key: 'ALL', label: 'Tất cả' },
                      { key: 'FEMALE', label: 'Nữ' },
                      { key: 'MALE', label: 'Nam' },
                    ].map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, targetGender: g.key as any })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${
                          formData.targetGender === g.key
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-[#0c0f17] border-[#273248] text-gray-400 hover:text-white'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danh mục đặc biệt Meta */}
              <div className="p-4 rounded-xl bg-[#0d121c] border border-[#242f44] space-y-2">
                <div className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>Khai báo Danh mục đặc biệt Meta:</span>
                  <span className="text-amber-400 font-mono text-[11px]">{formData.specialCategory}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { key: 'NONE', label: 'Không có (Thông thường)' },
                    { key: 'HOUSING', label: 'Nhà ở & Bất động sản' },
                    { key: 'CREDIT', label: 'Tài chính & Tín dụng' },
                    { key: 'EMPLOYMENT', label: 'Việc làm & Tuyển dụng' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, specialCategory: cat.key as any })}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        formData.specialCategory === cat.key
                          ? 'bg-amber-950 border-amber-600 text-amber-300 font-bold'
                          : 'bg-[#151a24] border-[#252f44] text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {specialWarning && (
                  <p className="text-xs text-amber-400 pt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{specialWarning}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* B4: NGÂN SÁCH & THỜI GIAN */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BƯỚC 4 / 8</span>
              <h3 className="text-xl font-bold text-gray-100 mt-1">Ngân sách & Thời gian chạy</h3>
              <p className="text-xs text-gray-400">
                Kiểm soát tuyệt đối số tiền chi tiêu. Hệ thống tự động kích hoạt giới hạn an toàn của BAHA GROUP.
              </p>
            </div>

            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Ngân sách mỗi ngày (VNĐ): *
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={formData.dailyBudget || 200000}
                    onChange={(e) =>
                      handleBudgetChange(Number(e.target.value), formData.durationDays || 7)
                    }
                    className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <div className="text-[11px] text-gray-400 mt-1">
                    Đề bài yêu cầu: <strong className="text-emerald-400">200.000 ₫ / ngày</strong>. (Giới hạn an toàn BaHa: ≤ 500.000 ₫).
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Số ngày chạy quảng cáo: *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={formData.durationDays || 7}
                    onChange={(e) =>
                      handleBudgetChange(formData.dailyBudget || 200000, Number(e.target.value))
                    }
                    className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <div className="text-[11px] text-gray-400 mt-1">
                    Đề bài yêu cầu: <strong className="text-emerald-400">07 ngày</strong>. (Giới hạn tối đa BaHa: ≤ 14 ngày).
                  </div>
                </div>
              </div>

              {/* Hộp Tính Toán Chi Phí & Giới Hạn An Toàn */}
              <div className="bg-[#0e1420] border border-[#24334a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-[#1c293c] pb-2">
                  <span className="text-gray-400">Tổng tiền dự kiến (Ngân sách ngày × Số ngày):</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {Number(formData.totalBudget).toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-[#1c293c] pb-2">
                  <span className="text-gray-400">Mức chi cần dự phòng trần an toàn (× 1,25):</span>
                  <span className="text-sm font-bold text-gray-200 font-mono">
                    {Number(formData.maxEstimatedSpend).toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  {(formData.dailyBudget || 0) <= 500000 && (formData.maxEstimatedSpend || 0) <= 2000000 ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đạt chuẩn giới hạn an toàn tài chính của BAHA (≤ 500k/ngày & ≤ 2tr tổng chi).</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>CẢNH BÁO: Vượt ngưỡng ngân sách an toàn của BaHa! Vui lòng giảm số tiền hoặc số ngày.</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* B5: NỘI DUNG SÁNG TẠO & AI COPYWRITING */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BƯỚC 5 / 8</span>
                <h3 className="text-xl font-bold text-gray-100 mt-1">Hoàn thiện nội dung quảng cáo (AI)</h3>
                <p className="text-xs text-gray-400">
                  Sử dụng Trí tuệ nhân tạo (AI) để tạo nội dung giật tít, thu hút khách hàng.
                </p>
              </div>

              <button
                type="button"
                disabled={aiLoading}
                onClick={handleGenerateAI}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-950/60 active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{aiLoading ? 'AI Đang Viết...' : 'AI VIẾT BÀI TỰ ĐỘNG'}</span>
              </button>
            </div>

            {aiSuggestions && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/80 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-emerald-300">Gợi ý từ AI: Bấm vào để chọn nhanh tiêu đề</span>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.headlines?.map((h: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, headline: h })}
                      className="text-left px-2.5 py-1 rounded bg-[#172233] hover:bg-[#223048] text-gray-200 border border-[#2b3d5c] text-[11px]"
                    >
                      {h}
                    </button>
                  ))}
                </div>
                {aiSuggestions.policyWarnings && aiSuggestions.policyWarnings.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    {aiSuggestions.policyWarnings.map((w: string, i: number) => (
                      <p key={i} className="text-[11px] text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
                        <span>{w}</span>
                      </p>
                    ))}
                  </div>
                )}
                {aiSuggestions.disclaimer && (
                  <p className="text-[10px] text-gray-400 italic pt-1 border-t border-emerald-900/40">
                    💡 {aiSuggestions.disclaimer}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tiêu đề quảng cáo (Headline): *
                </label>
                <input
                  type="text"
                  value={formData.headline || ''}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Ví dụ: Tỏa Sáng Làn Da Rạng Rỡ - Ưu Đãi 50% Hôm Nay"
                  className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nội dung bài viết quảng cáo (Primary Text): *
                </label>
                <textarea
                  value={formData.primaryText || ''}
                  onChange={(e) => setFormData({ ...formData, primaryText: e.target.value })}
                  rows={5}
                  placeholder="Nội dung bài viết chi tiết, có emoji, lợi ích khách hàng nhận được..."
                  className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nút Kêu gọi hành động (Call To Action):
                </label>
                <select
                  value={formData.callToAction || 'SEND_MESSAGE'}
                  onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                  className="w-full bg-[#0c0f17] border border-[#273248] rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="SEND_MESSAGE">Gửi tin nhắn (Khuyên dùng cho Fanpage)</option>
                  <option value="GET_OFFER">Nhận báo giá / Nhận ưu đãi</option>
                  <option value="LEARN_MORE">Tìm hiểu thêm</option>
                  <option value="SHOP_NOW">Mua ngay</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* B6: XEM TRƯỚC THỰC TẾ (AD PREVIEW) */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <AdMockupPreview campaign={formData} />
          </div>
        )}

        {/* B7: DUYỆT NỘI BỘ & TẠO TRÊN META */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <ApprovalCenter
              campaign={formData as CampaignData}
              onApproveInternal={handleApproveInternal}
              onCreateOnMeta={handleCreateOnMeta}
              onOpenPilot={onOpenPilot}
              isLoading={isSaving}
            />
          </div>
        )}

        {/* B8: HOÀN TẤT & QUẢN TRỊ */}
        {currentStep === 8 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-bold text-gray-100">
              Chiến dịch đã được thiết lập thành công!
            </h3>

            <p className="text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
              Chiến dịch <code className="text-emerald-400 font-mono font-bold">{formData.code}</code> đã được phê duyệt nội bộ và khởi tạo trên Meta ở trạng thái <strong className="text-amber-400">TẠM DỪNG (PAUSED)</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => onComplete(formData as CampaignData)}
                className="px-5 py-2.5 rounded-xl bg-[#232d3f] hover:bg-[#2d3a52] text-gray-200 border border-[#344463] text-sm font-semibold transition"
              >
                Xem danh sách chiến dịch
              </button>

              <button
                type="button"
                onClick={() => onOpenPilot(formData as CampaignData)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center space-x-1.5 shadow-lg shadow-purple-950/60 transition"
              >
                <Lock className="w-4 h-4" />
                <span>Mở Trung tâm Bắt đầu chạy (Pilot)</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-[#212838] pt-4 mt-6">
          <div>
            {currentStep > 1 && currentStep < 8 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-xl bg-[#171d28] hover:bg-[#21293a] text-gray-300 border border-[#273248] text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-400 font-medium">{saveSuccessMsg}</span>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave()}
              className="px-4 py-2 rounded-xl bg-[#1c2434] hover:bg-[#253046] text-gray-300 border border-[#2f3d56] text-xs font-semibold transition active:scale-95"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu bản nháp'}
            </button>

            {currentStep < 8 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
