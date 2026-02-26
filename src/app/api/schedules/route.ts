import { NextRequest, NextResponse } from 'next/server';
import { getAllSchedules, createSchedule } from '@/lib/db-schedules';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const day = searchParams.get('day');

    const schedules = await getAllSchedules(day !== null ? Number(day) : undefined);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('GET /api/schedules error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const schedule = await createSchedule(body);
  return NextResponse.json(schedule, { status: 201 });
}
