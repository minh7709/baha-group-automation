import { CampaignAiSuggestion } from './types';

export interface AIContentSuggestion extends CampaignAiSuggestion {
  specialCategoryCheck: {
    hasHousingSignal: boolean;
    hasCreditSignal: boolean;
    hasEmploymentSignal: boolean;
    recommendedCategory: 'NONE' | 'HOUSING' | 'CREDIT' | 'EMPLOYMENT';
    warningMessage?: string;
  };
  disclaimer: string;
}

/**
 * Làm sạch và giới hạn độ dài input chống Prompt Injection & rò rỉ token
 */
function sanitizeAiInput(text: string, maxLength = 800): string {
  if (!text) return '';
  // Cắt ngắn nếu vượt quá giới hạn
  let sanitized = text.slice(0, maxLength);
  // Loại bỏ các từ khóa nguy cơ tiêm prompt hệ thống
  sanitized = sanitized.replace(/ignore previous instructions/gi, '');
  sanitized = sanitized.replace(/system prompt/gi, '');
  // Loại bỏ các chuỗi token nhạy cảm nếu có
  sanitized = sanitized.replace(/EAAG\w+/g, '[MASKED_TOKEN]');
  sanitized = sanitized.replace(/\d{9,}:[\w-]+/g, '[MASKED_TELE_TOKEN]');
  return sanitized.trim();
}

/**
 * Kiểm tra các rủi ro vi phạm chính sách quảng cáo của Meta
 */
function checkAdvertisingPolicies(text: string): string[] {
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  // 1. Cam kết chữa bệnh / kết quả y tế quá mức
  if (lower.includes('100% khỏi') || lower.includes('chữa dứt điểm') || lower.includes('thuốc trị') || lower.includes('đặc trị')) {
    warnings.push('Chính sách Meta cấm cam kết kết quả y tế/sức khỏe tuyệt đối («chữa dứt điểm», «100% khỏi»). Hãy điều chỉnh sang «hỗ trợ cải thiện».');
  }

  // 2. Cam kết tài chính phi thực tế
  if (lower.includes('làm giàu nhanh') || lower.includes('thu nhập thụ động cam kết') || lower.includes('lãi suất 0% trọn đời')) {
    warnings.push('Phát hiện dấu hiệu cam kết tài chính không thực tế có thể bị Meta từ chối duyệt hoặc khóa tài khoản.');
  }

  // 3. Phân biệt đối xử / từ ngữ nhạy cảm
  if (lower.includes('chỉ dành cho người giàu') || lower.includes('cấm người nghèo')) {
    warnings.push('Chính sách Meta nghiêm cấm nội dung mang tính phân biệt đối xử.');
  }

  return warnings;
}

export async function generateAdContentWithAI(params: {
  productName: string;
  description: string;
  objective: string;
  location: string;
  apiKey?: string;
}): Promise<AIContentSuggestion> {
  const productName = sanitizeAiInput(params.productName, 200);
  const description = sanitizeAiInput(params.description, 800);
  const objective = sanitizeAiInput(params.objective, 100);
  const location = sanitizeAiInput(params.location, 100);
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY;

  // 1. Kiểm tra danh mục đặc biệt (Special Ad Categories)
  const combinedText = `${productName} ${description}`.toLowerCase();
  const hasHousing = combinedText.includes('nhà') || combinedText.includes('nội thất') || combinedText.includes('bất động sản') || combinedText.includes('căn hộ') || combinedText.includes('chung cư');
  const hasCredit = combinedText.includes('vay') || combinedText.includes('tín chấp') || combinedText.includes('thẻ tín dụng') || combinedText.includes('tài chính') || combinedText.includes('trả góp');
  const hasEmployment = combinedText.includes('tuyển dụng') || combinedText.includes('việc làm') || combinedText.includes('thực tập sinh') || combinedText.includes('tìm việc');

  let recommendedCategory: 'NONE' | 'HOUSING' | 'CREDIT' | 'EMPLOYMENT' = 'NONE';
  let warningMessage: string | undefined;

  if (hasHousing) {
    recommendedCategory = 'HOUSING';
    warningMessage = 'Có dấu hiệu quảng cáo nhà ở / nội thất / bất động sản — Founder phải xác nhận Danh mục đặc biệt ở bước Khách hàng.';
  } else if (hasCredit) {
    recommendedCategory = 'CREDIT';
    warningMessage = 'Có dấu hiệu dịch vụ tài chính / cho vay — Bắt buộc khai báo Danh mục đặc biệt (CREDIT) theo chính sách Meta.';
  } else if (hasEmployment) {
    recommendedCategory = 'EMPLOYMENT';
    warningMessage = 'Có dấu hiệu tuyển dụng việc làm — Cần tuân thủ danh mục cơ hội việc làm của Meta (EMPLOYMENT).';
  }

  const initialWarnings = checkAdvertisingPolicies(combinedText);

  // 2. Nếu có Gemini API Key, gọi trực tiếp Gemini API với timeout 8s
  if (apiKey) {
    try {
      const prompt = `
Bạn là Giám đốc Sáng tạo Quảng cáo Facebook Ads thực chiến của BAHA GROUP.
Hãy tạo nội dung quảng cáo có tỷ lệ chuyển đổi cao cho dịch vụ/sản phẩm:
- Tên dịch vụ/sản phẩm: ${productName}
- Mô tả: ${description}
- Mục tiêu: ${objective}
- Khu vực: ${location}

Quy tắc bắt buộc:
1. Tiêu đề (Headlines): Ngắn gọn, hấp dẫn, dưới 45 ký tự.
2. Bài viết (Primary text): Tối ưu cho người Việt, có emoji, chia đoạn rõ ràng, có CTA mạnh mẽ. Tuyệt đối không dùng cam kết quá mức sai sự thật.
3. Trả về DUY NHẤT một chuỗi JSON chuẩn (không kèm markdown \`\`\`json):
{
  "headlines": ["Tiêu đề 1", "Tiêu đề 2", "Tiêu đề 3"],
  "primaryTexts": ["Nội dung bài viết quảng cáo hoàn chỉnh"],
  "callToAction": "SEND_MESSAGE",
  "suggestedTargeting": {
    "ageRange": "25 - 45",
    "gender": "ALL",
    "interests": ["Sở thích 1", "Sở thích 2", "Sở thích 3"]
  }
}
      `.trim();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawText) {
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        // Schema validation an toàn
        const headlines = Array.isArray(parsed.headlines) && parsed.headlines.length > 0 
          ? parsed.headlines.slice(0, 5) 
          : [`${productName} - Ưu Đãi Độc Quyền Hôm Nay`];

        const primaryTexts = Array.isArray(parsed.primaryTexts) && parsed.primaryTexts.length > 0
          ? parsed.primaryTexts.slice(0, 3)
          : [`Chào bạn! Khám phá ngay ${productName} tại ${location}. Để lại tin nhắn để nhận tư vấn chi tiết.`];

        const targeting = parsed.suggestedTargeting || {
          ageRange: '25 - 45',
          gender: 'ALL',
          interests: ['Mua sắm trực tuyến', productName],
        };

        const postGenWarnings = [...initialWarnings];
        primaryTexts.forEach((pt: string) => {
          postGenWarnings.push(...checkAdvertisingPolicies(pt));
        });

        return {
          headlines,
          primaryTexts,
          callToAction: parsed.callToAction || (objective === 'LEAD' ? 'GET_OFFER' : 'SEND_MESSAGE'),
          suggestedTargeting: {
            ageRange: targeting.ageRange || '25 - 45',
            gender: targeting.gender === 'FEMALE' ? 'FEMALE' : targeting.gender === 'MALE' ? 'MALE' : 'ALL',
            interests: Array.isArray(targeting.interests) ? targeting.interests.slice(0, 6) : [productName],
          },
          specialCategoryCheck: {
            hasHousingSignal: hasHousing,
            hasCreditSignal: hasCredit,
            hasEmploymentSignal: hasEmployment,
            recommendedCategory,
            warningMessage,
          },
          policyWarnings: Array.from(new Set(postGenWarnings)),
          disclaimer: 'Nội dung do AI gợi ý. Người dùng cần kiểm tra và chỉnh sửa trước khi lưu và duyệt quảng cáo.',
        };
      }
    } catch (err: any) {
      console.warn('Gemini API call failed or timed out, falling back to smart rule-based engine:', err.message);
    }
  }

  // 3. Smart Rule-based Fallback Generator khi không có API key hoặc API lỗi
  return getSmartRuleBasedSuggestion({
    productName,
    description,
    objective,
    location,
    hasHousing,
    hasCredit,
    hasEmployment,
    recommendedCategory,
    warningMessage,
    initialWarnings,
  });
}

function getSmartRuleBasedSuggestion(ctx: {
  productName: string;
  description: string;
  objective: string;
  location: string;
  hasHousing: boolean;
  hasCredit: boolean;
  hasEmployment: boolean;
  recommendedCategory: 'NONE' | 'HOUSING' | 'CREDIT' | 'EMPLOYMENT';
  warningMessage?: string;
  initialWarnings: string[];
}): AIContentSuggestion {
  const { productName, description, objective, location, hasHousing, hasCredit, hasEmployment, recommendedCategory, warningMessage, initialWarnings } = ctx;

  const isBeauty = productName.toLowerCase().includes('sắc đẹp') || productName.toLowerCase().includes('spa') || productName.toLowerCase().includes('da') || productName.toLowerCase().includes('thẩm mỹ');

  const headlines = isBeauty ? [
    `Tỏa Sáng Làn Da Rạng Rỡ - Ưu Đãi Trải Nghiệm 499K`,
    `Phục Hồi Làn Da Căng Mướt Cùng Chuyên Gia Tại ${location}`,
    `Đăng Ký Hôm Nay: Tặng Gói Trị Liệu Trẻ Hóa Chuyên Sâu`,
  ] : hasHousing ? [
    `${productName} - Thiết Kế Thi Công Trọn Gói Hiện Đại`,
    `Tối Ưu Không Gian Sống Đẳng Cấp Tại ${location}`,
    `Nhận Ngay Bản Vẽ Thiết Kế 3D Miễn Phí Hôm Nay`,
  ] : [
    `${productName} - Giải Pháp Hoàn Hảo Dành Riêng Cho Bạn`,
    `Ưu Đãi Đặc Biệt: Trải Nghiệm Dịch Vụ Đẳng Cấp Tại ${location}`,
    `Đăng Ký Ngay Để Nhận Báo Giá Tốt Nhất Trong Tháng`,
  ];

  const primaryTexts = isBeauty ? [
    `✨ Đánh thức vẻ đẹp tự nhiên của bạn cùng liệu trình Chăm sóc da chuyên sâu tại ${location}!\n\n🌸 ${description || 'Cam kết phục hồi làn da mềm mịn, căng bóng tự nhiên với thảo dược an toàn sinh học.'}\n🎁 ƯU ĐÃI ĐẶC BIỆT: Giảm ngay 50% cho 30 khách hàng đăng ký sớm nhất.\n\n👉 Nhấn "Gửi tin nhắn" ngay để nhận tư vấn phác đồ da miễn phí cùng chuyên gia!`,
  ] : hasHousing ? [
    `🏡 Nâng tầm không gian sống lý tưởng cùng ${productName}!\n\n📐 ${description || 'Thiết kế thi công nội thất chìa khóa trao tay - Cam kết bảo hành 5 năm.'}\n🎁 TẶNG NGAY bản vẽ 3D và miễn 100% phí thiết kế khi ký hợp đồng thi công trong tháng này.\n\n👉 Bấm "Nhận ưu đãi" hoặc để lại thông tin để kiến trúc sư tư vấn tận nơi!`,
  ] : [
    `🎯 Bạn đang tìm kiếm giải pháp tối ưu cho ${productName} tại ${location}?\n\n💡 ${description || 'Đội ngũ chuyên nghiệp của chúng tôi luôn đồng hành để mang đến trải nghiệm chất lượng vượt trội.'}\n🎁 ƯU ĐÃI KHỞI ĐỘNG: Tư vấn miễn phí và chiết khấu hấp dẫn cho khách hàng đầu tiên.\n\n👉 Nhấn nút bên dưới để kết nối trực tiếp với đội ngũ tư vấn!`,
  ];

  return {
    headlines,
    primaryTexts,
    callToAction: objective === 'LEAD' ? 'GET_OFFER' : 'SEND_MESSAGE',
    suggestedTargeting: {
      ageRange: isBeauty ? '25 - 45' : hasHousing ? '28 - 50' : '25 - 45',
      gender: isBeauty ? 'FEMALE' : 'ALL',
      interests: isBeauty
        ? ['Chăm sóc sắc đẹp', 'Spa', 'Thẩm mỹ viện', 'Chăm sóc da mặt']
        : hasHousing
        ? ['Nội thất', 'Thiết kế nhà', 'Bất động sản', 'Kiến trúc']
        : ['Kinh doanh', 'Mua sắm', productName],
    },
    specialCategoryCheck: {
      hasHousingSignal: hasHousing,
      hasCreditSignal: hasCredit,
      hasEmploymentSignal: hasEmployment,
      recommendedCategory,
      warningMessage,
    },
    policyWarnings: initialWarnings,
    disclaimer: 'Nội dung do bộ gợi ý thông minh đề xuất. Bạn có thể tự do chỉnh sửa từng câu chữ trước khi gửi phê duyệt.',
  };
}
