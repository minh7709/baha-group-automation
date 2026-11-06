import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPrisma } from '@/lib/prisma';
import { decryptToken } from '@/lib/crypto';
import { FACEBOOK_SESSION_COOKIE, readFacebookSession } from '@/lib/facebook-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = readFacebookSession(cookies().get(FACEBOOK_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Bạn chưa đăng nhập bằng Facebook.' }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL chưa được cấu hình.' }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user?.facebookAccessToken) {
    return NextResponse.json({
      success: false,
      requiresReauth: true,
      error: 'Chưa có User Access Token. Hãy đăng nhập lại bằng OAuth với quyền user_posts.',
    }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 25), 1), 100);
  const version = process.env.META_GRAPH_VERSION || 'v21.0';
  const token = decryptToken(user.facebookAccessToken);
  const fields = 'id,message,created_time,permalink_url,full_picture,story';
  const response = await fetch(`https://graph.facebook.com/${version}/me/posts?${new URLSearchParams({
    fields,
    limit: String(limit),
    access_token: token,
  })}`);
  const data = await response.json();

  if (!response.ok || data.error) {
    return NextResponse.json({
      success: false,
      requiresReauth: true,
      error: data.error?.message || 'Meta không cho phép đọc bài viết cá nhân bằng token hiện tại.',
      metaErrorCode: data.error?.code,
      metaErrorType: data.error?.type,
    }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    posts: (data.data || []).map((post: any) => ({
      id: post.id,
      message: post.message || post.story || '',
      createdTime: post.created_time,
      permalinkUrl: post.permalink_url,
      fullPicture: post.full_picture,
    })),
    paging: data.paging || null,
  });
}
