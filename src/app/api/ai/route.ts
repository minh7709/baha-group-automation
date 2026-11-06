import { NextResponse } from 'next/server';
import { generateAdContentWithAI } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productName, description, objective, location, apiKey } = body;

    if (!productName) {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp tên sản phẩm/dịch vụ' }, { status: 400 });
    }

    const suggestions = await generateAdContentWithAI({
      productName,
      description: description || '',
      objective: objective || 'MESSAGES',
      location: location || 'TP.Hồ Chí Minh',
      apiKey,
    });

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

