import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    url: '/?XTransformPort=3003',
  });
}