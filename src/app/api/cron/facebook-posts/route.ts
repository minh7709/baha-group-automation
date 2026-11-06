import { NextResponse } from 'next/server';
import { FacebookService } from '@/lib/facebook';
import { decryptToken } from '@/lib/crypto';
import { getAllConnectedPages, saveFacebookPosts, FacebookPostStorageRecord } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && !expectedSecret) {
    return NextResponse.json({ success: false, error: 'CRON_SECRET chưa được cấu hình.' }, { status: 503 });
  }
  if (expectedSecret && authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const service = new FacebookService();
  const results: Array<{ pageId: string; success: boolean; count?: number; error?: string }> = [];
  for (const page of getAllConnectedPages()) {
    try {
      const posts = await service.listPagePosts(page.pageId, decryptToken(page.pageAccessToken), 25);
      const records: FacebookPostStorageRecord[] = posts.map((post) => ({
        ...post,
        pageName: page.pageName,
      }));
      await saveFacebookPosts(records);
      results.push({ pageId: page.pageId, success: true, count: records.length });
    } catch (error: any) {
      results.push({ pageId: page.pageId, success: false, error: error.message });
    }
  }

  return NextResponse.json({
    success: results.every((result) => result.success),
    results,
    syncedAt: new Date().toISOString(),
  });
}
