import { NextResponse } from 'next/server';
import { getCampaignById, saveCampaign, deleteCampaign } from '@/lib/storage';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const campaign = getCampaignById(params.id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chiến dịch' }, { status: 404 });
    }
    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = getCampaignById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chiến dịch' }, { status: 404 });
    }

    const updates = await req.json();
    const updated = saveCampaign({ ...existing, ...updates, id: existing.id, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const deleted = deleteCampaign(params.id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

