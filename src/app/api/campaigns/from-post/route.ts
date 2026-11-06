import { NextResponse } from 'next/server';
import { getFacebookPosts, getConnectedPageByIdAsync, saveCampaign } from '@/lib/storage';
import { CampaignData } from '@/lib/types';
import { CAMPAIGN_SAFETY_LIMITS } from '@/lib/campaign-policy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId, pageId, source = 'page', profilePost } = body;
    if (!postId || !pageId) {
      return NextResponse.json({ success: false, error: 'Thiếu postId hoặc pageId.' }, { status: 400 });
    }

    const page = await getConnectedPageByIdAsync(pageId);
    const post = source === 'profile'
      ? profilePost
      : (await getFacebookPosts(pageId)).find((item) => item.id === postId);
    if (!page || !post) {
      return NextResponse.json({ success: false, error: 'Bài đăng không tồn tại hoặc Fanpage chưa được liên kết.' }, { status: 404 });
    }

    const now = new Date();
    const dailyBudget = Number(body.dailyBudget || 200000);
    const durationDays = Number(body.durationDays || 7);
    const totalBudget = dailyBudget * durationDays;
    const campaign: CampaignData = {
      id: `camp-post-${Date.now()}`,
      code: `BaHa-POST-${now.toISOString().replace(/\D/g, '').slice(0, 14)}`,
      name: body.name || `Quảng cáo bài đăng - ${page.pageName}`,
      description: post.message || `Quảng cáo bài đăng ${post.id}`,
      imageUrl: post.fullPicture,
      objective: body.objective || 'TRAFFIC',
      objectiveText: 'Quảng cáo bài đăng đã chọn trên Facebook',
      specialCategory: 'NONE',
      location: body.location || 'TP.Hồ Chí Minh',
      radiusKm: Number(body.radiusKm || 15),
      targetAge: body.targetAge || '25 - 45',
      targetGender: body.targetGender || 'ALL',
      targetInterests: body.targetInterests || [],
      dailyBudget,
      durationDays,
      totalBudget,
      maxEstimatedSpend: totalBudget * CAMPAIGN_SAFETY_LIMITS.RESERVE_FACTOR,
      startDate: now.toISOString().slice(0, 10),
      endDate: new Date(now.getTime() + durationDays * 86400000).toISOString().slice(0, 10),
      headline: body.headline || 'Quảng cáo bài đăng Facebook',
      primaryText: post.message || '',
      callToAction: body.callToAction || 'LEARN_MORE',
      pageName: page.pageName,
      pageId: page.pageId,
      facebookPostId: source === 'page' ? post.id : undefined,
      adAccountId: process.env.META_AD_ACCOUNT_ID,
      status: 'DRAFT',
      version: 1,
      isMock: body.isMock ?? true,
      telegramSent: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return NextResponse.json({ success: true, campaign: saveCampaign(campaign), post });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Không thể tạo bản nháp từ bài đăng.' }, { status: 500 });
  }
}
