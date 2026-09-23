import { NextRequest, NextResponse } from 'next/server';
import { decideRequestSchema } from '@/lib/validation/schemas';
import { getEngine } from '@/lib/engine';
import { runDeterministicFallback } from '@/lib/attention/policy';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parseResult = decideRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { event, context, preferredEngine, thresholds } = parseResult.data;

    const engine = getEngine(preferredEngine);

    const effectiveThresholds = thresholds
      ? {
          interrupt_now: thresholds.interrupt_now ?? 0.82,
          show_soon: thresholds.show_soon ?? 0.72,
          batch: thresholds.batch ?? 0.72,
          silence: thresholds.silence ?? 0.9,
        }
      : undefined;

    try {
      const decision = await engine.decide({
        event,
        context,
        thresholds: effectiveThresholds,
      });

      return NextResponse.json(decision);
    } catch (engineError) {
      console.warn('Engine error occurred, running deterministic rules fallback:', engineError);
      const fallback = runDeterministicFallback(event, context);
      return NextResponse.json({
        ...fallback,
        gatedReason: `Engine fallback applied: ${engineError instanceof Error ? engineError.message : 'Unknown error'}`,
      });
    }
  } catch (err) {
    console.error('API /api/decide error:', err);
    return NextResponse.json(
      { error: 'Internal server error processing decision' },
      { status: 500 }
    );
  }
}
