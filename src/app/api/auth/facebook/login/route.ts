import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isMockRequest = searchParams.get('mode') === 'mock';

  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;
  const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';

  // Nếu người dùng chọn test mô phỏng hoặc chưa cấu hình META_APP_ID
  if (isMockRequest || !appId) {
    const mockCallbackUrl = new URL(redirectUri, req.url);
    mockCallbackUrl.searchParams.set('code', `mock_oauth_code_${Date.now()}`);
    mockCallbackUrl.searchParams.set('state', 'simulated_state');
    return NextResponse.redirect(mockCallbackUrl.toString());
  }

  // Danh sách quyền yêu cầu người dùng cấp theo tài liệu
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
  ].join(',');

  const state = Math.random().toString(36).substring(7);

  const fbAuthUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?` + new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes,
    response_type: 'code',
    auth_type: 'rerequest',
  }).toString();

  return NextResponse.redirect(fbAuthUrl);
}

