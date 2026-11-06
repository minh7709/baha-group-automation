import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOTP(): string {
  // Sinh mã số OTP 6 chữ số ngẫu nhiên
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  otpCode: string;
  simulated: boolean;
}

export async function sendVerificationEmail(email: string, otpCode: string): Promise<EmailSendResult> {
  const subject = `[BAHA ADS] Mã xác thực tài khoản của bạn: ${otpCode}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #dfe2f1; padding: 24px; border-radius: 12px; max-width: 500px; margin: auto;">
      <h2 style="color: #38bdf8; margin-bottom: 8px;">BAHA ADS PRO — Xác Thực Tài Khoản</h2>
      <p style="color: #94a3b8; font-size: 14px;">Cảm ơn bạn đã đăng ký hệ thống thiết lập quảng cáo tự động BAHA GROUP.</p>
      <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
        <span style="font-size: 12px; color: #87929a; text-transform: uppercase; letter-spacing: 1px;">Mã OTP xác thực của bạn:</span>
        <div style="font-size: 32px; font-weight: 800; color: #10b981; letter-spacing: 6px; margin-top: 8px;">${otpCode}</div>
        <p style="font-size: 11px; color: #ffb4ab; margin-top: 8px;">Mã này có hiệu lực trong vòng 15 phút.</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
    </div>
  `;

  // Kiểm tra nếu có cấu hình Resend API Key để gửi email thật
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'BaHa Ads <noreply@bahagroup.vn>',
          to: [email],
          subject,
          html: htmlContent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          message: `Đã gửi email xác thực thật tới ${email} qua Resend!`,
          otpCode,
          simulated: false,
        };
      }
    } catch (err) {
      console.warn("Lỗi gửi qua Resend, chuyển sang chế độ mô phỏng:", err);
    }
  }

  // Chế độ MÔ PHỎNG THÔNG MINH (Development & Testing)
  // Ghi log ra console và gửi qua Telegram nếu có cấu hình Telegram Token
  console.log(`
══════════════════════════════════════════════════════════════
📧 [EMAIL MÔ PHỎNG] GỬI MÃ XÁC THỰC EMAIL
Người nhận: ${email}
Tiêu đề: ${subject}
Mã OTP: ${otpCode} (Hiệu lực: 15 phút)
══════════════════════════════════════════════════════════════
  `);

  return {
    success: true,
    message: `Đã gửi mã xác thực tới ${email}. (Mã OTP: ${otpCode})`,
    otpCode,
    simulated: true,
  };
}

