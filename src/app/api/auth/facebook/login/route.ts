import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isMockRequest = searchParams.get('mode') === 'mock';

  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;
  const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';

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

  // Danh sách quyền theo tài liệu chuẩn Meta Graph API v21.0
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
  ].join(',');

  const fbAuthUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?` + new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes,
    response_type: 'code',
    auth_type: 'rerequest',
  }).toString();

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
