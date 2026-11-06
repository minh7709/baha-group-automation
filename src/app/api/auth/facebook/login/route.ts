import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isMockRequest = searchParams.get('mode') === 'mock';
  const scopeType = searchParams.get('scope') || 'pages';

  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;
  const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';
  const loginConfigId = process.env.META_OAUTH_CONFIG_ID;

  // Sinh state ngẫu nhiên 32 ký tự chống tấn công CSRF (Bảo mật bắt buộc Section 3.4)
  const state = crypto.randomBytes(16).toString('hex');

  // Nếu người dùng chọn test mô phỏng hoặc chưa cấu hình META_APP_ID
  if (isMockRequest || !appId) {
    const mockCallbackUrl = new URL(redirectUri, req.url);
    mockCallbackUrl.searchParams.set('code', `mock_oauth_code_${Date.now()}`);
    mockCallbackUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(mockCallbackUrl.toString());
    response.cookies.set('fb_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 phút
      path: '/',
    });
    return response;
  }

  // Chỉ yêu cầu quyền đã được cấu hình cho Use Case tương ứng trên Meta.
  // `email` không bắt buộc để kết nối Fanpage và thường gây Invalid Scopes
  // khi app chưa bật Facebook Login với quyền email.
  let scopes = process.env.META_OAUTH_BASIC_SCOPES || 'public_profile';
  if (scopeType === 'pages') {
    scopes = process.env.META_OAUTH_PAGES_SCOPES
      || 'pages_show_list,pages_read_engagement,pages_manage_posts';
  } else if (scopeType === 'ads') {
    scopes = process.env.META_OAUTH_ADS_SCOPES || 'ads_management,ads_read';
  }

  const authParams: Record<string, string> = {
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    response_type: 'code',
    scope: scopes,
  };

  // Facebook Login for Business dùng config_id để áp dụng cấu hình quyền
  // đã tạo trong Meta App Dashboard. Không gửi nếu app dùng Login thường.
  if (loginConfigId) {
    authParams.config_id = loginConfigId;
  }

  const fbAuthUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?`
    + new URLSearchParams(authParams).toString();

  const response = NextResponse.redirect(fbAuthUrl);
  // Lưu state vào HttpOnly cookie để đối soát ở callback
  response.cookies.set('fb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
