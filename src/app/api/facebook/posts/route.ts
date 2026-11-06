import { NextResponse } from 'next/server';
import { FacebookService } from '@/lib/facebook';
import { decryptToken } from '@/lib/crypto';
import {
  getConnectedPageByIdAsync,
  getAllConnectedPagesAsync,
  getFacebookPosts,
  saveFacebookPosts,
  FacebookPostStorageRecord,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function syncPagePosts(pageId: string, limit: number) {
  const page = await getConnectedPageByIdAsync(pageId);
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

async function syncAllPagePosts(limit: number) {
  const pages = await getAllConnectedPagesAsync();
  const results = await Promise.allSettled(pages.map((page) => syncPagePosts(page.pageId, limit)));
  const posts: FacebookPostStorageRecord[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      posts.push(...result.value);
    } else {
      errors.push(`${pages[index].pageName}: ${result.reason?.message || 'Không thể đồng bộ'}`);
    }
  });

  if (errors.length > 0 && posts.length === 0) {
    throw new Error(errors.join(' | '));
  }

  return { posts, errors };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get('pageId');
  const shouldSync = searchParams.get('sync') === 'true';
  const limit = Number(searchParams.get('limit') || 25);

  try {
    if (shouldSync && !pageId) {
      const result = await syncAllPagePosts(limit);
      return NextResponse.json({
        success: true,
        posts: result.posts,
        errors: result.errors,
        synced: true,
        syncedAt: new Date().toISOString(),
      });
    }

    if (!pageId) {
      return NextResponse.json({ success: true, posts: await getFacebookPosts(), synced: false });
    }

    const posts = shouldSync ? await syncPagePosts(pageId, limit) : await getFacebookPosts(pageId);
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
