import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { query } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_TAVILY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Tavily API key is missing' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_answer: false,
        include_images: false,
        max_results: 10,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tavily API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Tavily' }, { status: 500 });
  }
}
