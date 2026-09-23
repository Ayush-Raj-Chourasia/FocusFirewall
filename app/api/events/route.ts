import { NextRequest, NextResponse } from 'next/server';
import { eventsIngestSchema } from '@/lib/validation/schemas';
import demoStream from '@/data/demo-stream.json';
import frozenEvents from '@/data/events.json';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'demo';

  if (type === 'benchmark') {
    return NextResponse.json({
      total: frozenEvents.length,
      scenarios: frozenEvents,
    });
  }

  return NextResponse.json({
    total: demoStream.length,
    events: demoStream,
  });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = eventsIngestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event batch', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      accepted: parsed.data.events.length,
      message: `Ingested ${parsed.data.events.length} events into simulation buffer`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process events ingest' },
      { status: 500 }
    );
  }
}
