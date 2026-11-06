import { NextResponse } from 'next/server';
import { FacebookService } from '@/lib/facebook';
import { decryptToken } from '@/lib/crypto';
import {
  getConnectedPageById,
  getFacebookPosts,
  saveFacebookPosts,
  FacebookPostStorageRecord,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function syncPagePosts(pageId: string, limit: number) {
  const page = getConnectedPageById(pageId);
  if (!page) {
    throw new Error('Không tìm thấy Fanpage đã liên kết.');
  }

  const token = decryptToken(page.pageAccessToken);
  const service = new FacebookService();
  const posts = await service.listPagePosts(page.pageId, token, limit);
  const records: FacebookPostStorageRecord[] = posts.map((post) => ({
    ...post,
    pageName: page.pageName,
  }));
  await saveFacebookPosts(records);
  return records;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get('pageId');
  const shouldSync = searchParams.get('sync') === 'true';
  const limit = Number(searchParams.get('limit') || 25);

  if (!pageId) {
    return NextResponse.json({ success: false, error: 'Thiếu pageId.' }, { status: 400 });
  }

  try {
    const posts = shouldSync
      ? await syncPagePosts(pageId, limit)
      : await getFacebookPosts(pageId);
    return NextResponse.json({
      success: true,
      posts,
      synced: shouldSync,
      syncedAt: shouldSync ? new Date().toISOString() : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
