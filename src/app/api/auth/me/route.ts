import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FACEBOOK_SESSION_COOKIE, readFacebookSession } from '@/lib/facebook-auth';

export async function GET() {
  const session = readFacebookSession(cookies().get(FACEBOOK_SESSION_COOKIE)?.value);
  return NextResponse.json({ success: Boolean(session), user: session || null });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(FACEBOOK_SESSION_COOKIE);
  return response;
}
