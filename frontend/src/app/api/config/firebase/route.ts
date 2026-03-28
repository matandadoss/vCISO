import { NextResponse } from 'next/server';

export async function GET() {
  const configString = process.env.FIREBASE_CONFIG;

  if (!configString) {
    return NextResponse.json(
      { warning: 'Firebase configuration is completely missing from the secure environment. Using mock.' },
      { status: 200 }
    );
  }

  try {
    const config = JSON.parse(configString);
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Failed to parse FIREBASE_CONFIG secret JSON', error);
    return NextResponse.json(
      { error: 'Malformed Firebase configuration secret.' },
      { status: 500 }
    );
  }
}
