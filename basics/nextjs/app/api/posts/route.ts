import { NextRequest, NextResponse } from 'next/server';
import { POSTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawLimit = searchParams.get('limit') ?? '10';
  const category = searchParams.get('category');

  const parsedLimit = parseInt(rawLimit, 10);
  if (isNaN(parsedLimit)) {
    return NextResponse.json(
      { error: 'limit must be a number' },
      { status: 400 },
    );
  }

  const limit = Math.min(Math.max(parsedLimit, 1), 50);

  let posts = [...POSTS];
  if (
    category &&
    ['tech', 'business', 'design', 'Tech', 'Business', 'Design'].includes(
      category,
    )
  ) {
    posts = posts.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
  }

  const paginated = posts.slice(0, limit);

  return NextResponse.json(
    { posts: paginated, total: posts.length, limit },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}

export async function POST(request: NextRequest) {
  let body: { title?: string; content?: string; category?: string };
  try {
    body = (await request.json()) as {
      title?: string;
      content?: string;
      category?: string;
    };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.title || !body.content || !body.category) {
    return NextResponse.json(
      { error: 'title, content, and category are required' },
      { status: 400 },
    );
  }

  // Simulate DB insert latency
  await new Promise((r) => setTimeout(r, 500));

  const newPost = {
    ...body,
    slug: body.title.toLowerCase().replace(/\s+/g, '-'),
    publishedAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, post: newPost }, { status: 201 });
}
