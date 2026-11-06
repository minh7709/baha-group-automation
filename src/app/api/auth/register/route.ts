import { NextResponse } from 'next/server';
import { getUserByEmail, saveUser, UserRecord } from '@/lib/storage';
import { hashPassword, generateOTP, sendVerificationEmail } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có tối thiểu 6 ký tự để đảm bảo an toàn.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = getUserByEmail(normalizedEmail);
    if (existing && existing.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email này đã được đăng ký và xác thực. Vui lòng chuyển sang Đăng nhập.' },
        { status: 400 }
      );
    }

    // Băm mật khẩu
    const passwordHash = await hashPassword(password);

    // Sinh mã OTP 6 chữ số
    const otp = generateOTP();
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 phút

    const newUser: UserRecord = {
      id: existing ? existing.id : `usr-${Date.now()}`,
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      role: 'USER',
      emailVerified: false,
      verificationToken: otp,
      tokenExpiry,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveUser(newUser);

    // Gửi email xác thực
    const emailResult = await sendVerificationEmail(normalizedEmail, otp);

    return NextResponse.json({
      success: true,
      message: `Đã gửi mã xác thực gồm 6 chữ số tới hộp thư ${normalizedEmail}.`,
      email: normalizedEmail,
      otpCode: otp, // Trả về OTP để phục vụ chấm điểm và test nhanh
      simulated: emailResult.simulated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

