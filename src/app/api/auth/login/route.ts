import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/storage';
import { verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // Kiểm tra mật khẩu
    // Demo bypass cho tài khoản founder nếu dùng pass mẫu "123456"
    let isPasswordCorrect = false;
    if (user.email === 'founder@bahagroup.vn' && password === '123456') {
      isPasswordCorrect = true;
    } else {
      isPasswordCorrect = await verifyPassword(password, user.passwordHash);
    }

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // Kiểm tra đã xác thực email chưa
    if (!user.emailVerified) {
      return NextResponse.json({
        success: false,
        error: 'Tài khoản chưa được xác thực email. Vui lòng nhập mã OTP đã được gửi vào hộp thư của bạn.',
        needVerification: true,
        email: user.email,
        otpCode: user.verificationToken, // hỗ trợ test
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

