import { NextRequest, NextResponse } from 'next/server';
import { getAllSchedules, createSchedule } from '@/lib/db-schedules';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const day = searchParams.get('day');

  const schedules = await getAllSchedules(day !== null ? Number(day) : undefined);
  return NextResponse.json(schedules);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const schedule = await createSchedule(body);
  return NextResponse.json(schedule, { status: 201 });
}
