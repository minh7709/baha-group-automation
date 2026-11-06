import { NextResponse } from 'next/server';
import { getUserByEmail, saveUser } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otpCode } = body;

    if (!email || !otpCode) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp Email và Mã OTP 6 chữ số.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tài khoản với email này.' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Tài khoản của bạn đã được xác thực trước đó. Bạn có thể đăng nhập ngay.',
        alreadyVerified: true,
      });
    }

    // Kiểm tra hạn token
    if (user.tokenExpiry && new Date(user.tokenExpiry).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Mã OTP đã hết hạn (quá 15 phút). Vui lòng đăng ký lại để nhận mã mới.' },
        { status: 400 }
      );
    }

    // Đối chiếu OTP
    if (user.verificationToken?.trim() !== otpCode.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái xác thực
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.tokenExpiry = undefined;
    saveUser(user);

    return NextResponse.json({
      success: true,
      message: 'Xác thực email thành công! Tài khoản của bạn đã sẵn sàng sử dụng.',
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

