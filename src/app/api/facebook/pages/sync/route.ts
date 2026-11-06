import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPrisma } from '@/lib/prisma';
import { decryptToken, encryptToken } from '@/lib/crypto';
import { FACEBOOK_SESSION_COOKIE, readFacebookSession } from '@/lib/facebook-auth';
import { saveConnectedPage, ConnectedPageRecord } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
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
      requiresPagePermission: true,
      error: 'Tài khoản Facebook chưa có User Access Token để lấy Fanpage.',
    }, { status: 403 });
  }

  const token = decryptToken(user.facebookAccessToken);
  const version = process.env.META_GRAPH_VERSION || 'v21.0';
  const response = await fetch(
    `https://graph.facebook.com/${version}/me/accounts?fields=id,name,category,access_token&access_token=${encodeURIComponent(token)}`,
  );
  const data = await response.json();

  if (!response.ok || data.error) {
    return NextResponse.json({
      success: false,
      requiresPagePermission: true,
      error: data.error?.message || 'Facebook chưa cấp quyền Page cho User Access Token này.',
    }, { status: 403 });
  }

  const pages = Array.isArray(data.data) ? data.data : [];
  for (const page of pages) {
    const record: ConnectedPageRecord = {
      id: `page-${page.id}`,
      pageId: page.id,
      pageName: page.name,
      pageCategory: page.category || 'Trang Facebook',
      pageAccessToken: encryptToken(page.access_token),
      userId: session.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveConnectedPage(record);
  }

  return NextResponse.json({
    success: true,
    count: pages.length,
    pages: pages.map((page: { id: string; name: string }) => ({ pageId: page.id, pageName: page.name })),
  });
}
