import { NextResponse } from 'next/server';
import { getAllConnectedPagesAsync, saveConnectedPage, deleteConnectedPage, ConnectedPageRecord } from '@/lib/storage';
import { encryptToken, maskToken } from '@/lib/crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;

    const allPages = await getAllConnectedPagesAsync();
    const pages = userId
      ? allPages.filter((page) => page.userId === userId || page.userId === 'usr-founder-baha')
      : allPages;

    // Không trả về pageAccessToken nhạy cảm ra client
    const safePages = pages.map((p) => ({
      id: p.id,
      pageId: p.pageId,
      pageName: p.pageName,
      pageCategory: p.pageCategory,
      userId: p.userId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      hasToken: !!p.pageAccessToken,
    }));

    return NextResponse.json({
      success: true,
      pages: safePages,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pageId, pageName, pageCategory, pageAccessToken, userId = 'usr-founder-baha' } = body;

    if (!pageId || !pageName) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp Page ID và Tên Fanpage' },
        { status: 400 }
      );
    }

    const rawToken = pageAccessToken || `EAAGm0PXqB_token_${pageId}`;
    const encryptedToken = encryptToken(rawToken);

    const newPage: ConnectedPageRecord = {
      id: `page-${pageId}`,
      pageId: pageId.trim(),
      pageName: pageName.trim(),
      pageCategory: pageCategory || 'Trang Facebook',
      pageAccessToken: encryptedToken,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveConnectedPage(newPage);

    return NextResponse.json({
      success: true,
      message: `Đã kết nối thành công Fanpage "${pageName}"!`,
      page: {
        id: newPage.id,
        pageId: newPage.pageId,
        pageName: newPage.pageName,
        pageCategory: newPage.pageCategory,
        userId: newPage.userId,
        hasToken: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID trang để hủy kết nối' }, { status: 400 });
    }

    const deleted = deleteConnectedPage(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
