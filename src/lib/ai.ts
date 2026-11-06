export interface AIContentSuggestion {
  headlines: string[];
  primaryTexts: string[];
  callToAction: string;
  suggestedTargeting: {
    ageRange: string;
    gender: 'ALL' | 'FEMALE' | 'MALE';
    interests: string[];
  };
  specialCategoryCheck: {
    hasHousingSignal: boolean;
    hasCreditSignal: boolean;
    hasEmploymentSignal: boolean;
    recommendedCategory: 'NONE' | 'HOUSING' | 'CREDIT' | 'EMPLOYMENT';
    warningMessage?: string;
  };
}

export async function generateAdContentWithAI(params: {
  productName: string;
  description: string;
  objective: string;
  location: string;
  apiKey?: string;
}): Promise<AIContentSuggestion> {
  const { productName, description, objective, location } = params;
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY;

  // Kiểm tra danh mục đặc biệt (Theo chuẩn yêu cầu BaHa Founder)
  const descLower = (productName + " " + description).toLowerCase();
  const hasHousing = descLower.includes("nhà") || descLower.includes("nội thất") || descLower.includes("bất động sản") || descLower.includes("căn hộ");
  const hasCredit = descLower.includes("vay") || descLower.includes("tín chấp") || descLower.includes("thẻ tín dụng") || descLower.includes("tài chính");
  const hasEmployment = descLower.includes("tuyển dụng") || descLower.includes("việc làm") || descLower.includes("thực tập");

  let recommendedCategory: 'NONE' | 'HOUSING' | 'CREDIT' | 'EMPLOYMENT' = 'NONE';
  let warningMessage: string | undefined;

  if (hasHousing) {
    recommendedCategory = 'HOUSING';
    warningMessage = 'Có dấu hiệu quảng cáo nhà ở / nội thất — Founder phải quyết định Danh mục đặc biệt ở bước Khách hàng.';
  } else if (hasCredit) {
    recommendedCategory = 'CREDIT';
    warningMessage = 'Có dấu hiệu dịch vụ tài chính / tín dụng — Cần khai báo Danh mục đặc biệt theo chính sách Meta.';
  } else if (hasEmployment) {
    recommendedCategory = 'EMPLOYMENT';
    warningMessage = 'Có dấu hiệu tuyển dụng việc làm — Cần tuân thủ danh mục cơ hội việc làm của Meta.';
  }

  // Nếu có Gemini API Key, gọi trực tiếp Gemini API
  if (apiKey) {
    try {
      const prompt = `
Bạn là Giám đốc Sáng tạo Quảng cáo Facebook Ads thực chiến của BAHA GROUP.
Hãy tạo nội dung quảng cáo có tỷ lệ chuyển đổi cao cho dịch vụ/sản phẩm:
- Tên dịch vụ/sản phẩm: ${productName}
- Mô tả: ${description}
- Mục tiêu: ${objective}
- Khu vực: ${location}

Trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau:
{
  "headlines": [
    "Tiêu đề 1 thu hút dưới 45 ký tự",
    "Tiêu đề 2 nhấn mạnh ưu đãi",
    "Tiêu đề 3 mang tính cam kết"
  ],
  "primaryTexts": [
    "Bài viết quảng cáo đầy đủ có emoji, nêu vấn đề, giải pháp, quà tặng và kêu gọi hành động cụ thể"
  ],
  "callToAction": "SEND_MESSAGE",
  "suggestedTargeting": {
    "ageRange": "25 - 45",
    "gender": "ALL",
    "interests": ["Sở thích 1", "Sở thích 2", "Sở thích 3"]
  }
}
      `.trim();

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          ...parsed,
          specialCategoryCheck: {
            hasHousingSignal: hasHousing,
            hasCreditSignal: hasCredit,
            hasEmploymentSignal: hasEmployment,
            recommendedCategory,
            warningMessage,
          },
        };
      }
    } catch (err) {
      console.warn("Lỗi gọi Gemini API, chuyển sang bộ sinh nội dung dự phòng thông minh:", err);
    }
  }

  // BỘ SINH NỘI DUNG THÔNG MINH DỰ PHÒNG (RULE-BASED AI ENGINE)
  // Đảm bảo chạy 100% mượt mà ngay cả khi không có mạng hoặc chưa nhập API Key
  const isBeauty = descLower.includes("đẹp") || descLower.includes("spa") || descLower.includes("da") || descLower.includes("thẩm mỹ");
  const isInterior = descLower.includes("nội thất") || descLower.includes("thiết kế") || descLower.includes("nhà");
  const isHealth = descLower.includes("keo ong") || descLower.includes("sức khỏe") || descLower.includes("thuốc") || descLower.includes("bổ");

  let headlines: string[] = [];
  let primaryText = "";
  let ageRange = "25 - 45";
  let gender: 'ALL' | 'FEMALE' | 'MALE' = 'ALL';
  let interests: string[] = [];

  if (isBeauty) {
    headlines = [
      `Tỏa Sáng Làn Da Rạng Rỡ - Ưu Đãi 50% Tại ${location}`,
      `Trẻ Hóa Da Chuyên Sâu Cùng ${productName}`,
      `Đẹp Rạng Ngời Tự Nhiên - Đặt Lịch Tư Vấn Ngay Hôm Nay!`
    ];
    primaryText = `✨ BẠN MUỐN SỞ HỮU LÀN DA CĂNG MỊN, TRÀN ĐẦY SỨC SỐNG?\n\n🌿 ${description || 'Dịch vụ chăm sóc chuyên sâu chuẩn y khoa, đánh bay mệt mỏi và lão hóa da.'}\n\n🎁 ƯU ĐÃI ĐỘC QUYỀN TRONG THÁNG NÀY:\n✅ Giảm ngay 50% cho 20 khách hàng đầu tiên đăng ký hôm nay.\n✅ Tặng phác đồ kiểm tra và tư vấn cấu trúc da 1-1 cùng chuyên gia.\n\n📍 Phục vụ khách hàng tại khu vực: ${location}.\n👉 Bấm "Gửi tin nhắn" ngay để giữ suất ưu đãi và nhận báo giá chi tiết!`;
    gender = 'FEMALE';
    interests = ["Chăm sóc sắc đẹp", "Spa", "Làm đẹp tự nhiên", "Chăm sóc da"];
  } else if (isInterior) {
    headlines = [
      `${productName} - Thiết Kế Thi Công Trọn Gói Giá Xưởng`,
      `Biến Tổ Ấm Thành Kiệt Tác Cùng ${productName}`,
      `Nhận Bản Vẽ 3D Miễn Phí Tại ${location} - Ưu Đãi Tháng Này`
    ];
    primaryText = `🏡 NÂNG TẦM KHÔNG GIAN SỐNG CÙNG ${productName.toUpperCase()}!\n\n${description || 'Thiết kế hiện đại, tối ưu công năng, vật liệu cao cấp chuẩn chất lượng.'}\n\n🏆 CAM KẾT VÀNG:\n🔹 Khảo sát và lên thiết kế 3D hoàn toàn MIỄN PHÍ\n🔹 Thi công đúng tiến độ - Đúng vật liệu đã cam kết\n🔹 Bảo hành công trình dài hạn lên đến 5 năm\n\n👉 Bấm "Nhận báo giá" hoặc để lại tin nhắn để được KTS tư vấn ngay hôm nay!`;
    ageRange = "28 - 55";
    interests = ["Thiết kế nội thất", "Kiến trúc", "Bất động sản", "Trang trí nhà cửa"];
  } else if (isHealth) {
    headlines = [
      `${productName} - Bảo Vệ Sức Khỏe Gia Đình Toàn Diện`,
      `Kháng Khuẩn Tự Nhiên, Tăng Đề Kháng Với ${productName}`,
      `Ưu Đãi Đặc Biệt: Mua 2 Tặng 1 Duy Nhất Tuần Này!`
    ];
    primaryText = `🛡 BẢO VỆ CỔ HỌNG VÀ ĐƯỜNG HÔ HẤP MỖI NGÀY CÙNG ${productName.toUpperCase()}!\n\n${description || 'Chiết xuất tự nhiên an toàn lành tính cho cả gia đình, tăng cường miễn dịch.'}\n\n💥 ƯU ĐÃI DUY NHẤT HÔM NAY:\n- Mua combo tiết kiệm đến 30%\n- Miễn phí giao hàng toàn quốc\n\n👉 Bấm "Gửi tin nhắn" để được dược sĩ tư vấn chi tiết!`;
    ageRange = "30 - 60";
    interests = ["Sức khỏe", "Y học tự nhiên", "Dược phẩm", "Gia đình"];
  } else {
    headlines = [
      `Khám Phá Giải Pháp ${productName} Đẳng Cấp Tại ${location}`,
      `Ưu Đãi Cực Hấp Dẫn Cho ${productName} - Đặt Lịch Ngay!`,
      `${productName} - Lựa Chọn Hàng Đầu Cho Bạn`
    ];
    primaryText = `🌟 Bạn đang tìm kiếm giải pháp ${productName} chất lượng cao tại ${location}?\n\n${description || 'Chúng tôi mang đến sản phẩm/dịch vụ hoàn hảo với chi phí hợp lý nhất.'}\n\n🎁 Đăng ký ngay hôm nay để nhận ưu đãi đặc biệt dành riêng cho bạn!\n👉 Bấm "Gửi tin nhắn" để được hỗ trợ 24/7!`;
    interests = ["Mua sắm trực tuyến", "Dịch vụ chất lượng"];
  }

  return {
    headlines,
    primaryTexts: [primaryText],
    callToAction: "SEND_MESSAGE",
    suggestedTargeting: {
      ageRange,
      gender,
      interests,
    },
    specialCategoryCheck: {
      hasHousingSignal: hasHousing,
      hasCreditSignal: hasCredit,
      hasEmploymentSignal: hasEmployment,
      recommendedCategory,
      warningMessage,
    },
  };
}

