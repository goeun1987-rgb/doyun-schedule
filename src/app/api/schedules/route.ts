import { NextRequest, NextResponse } from 'next/server';
import { getAllSchedules, createSchedule } from '@/lib/db-schedules';

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const day = searchParams.get('day');

  const schedules = getAllSchedules(day !== null ? Number(day) : undefined);
  return NextResponse.json(schedules);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const schedule = createSchedule(body);
    return NextResponse.json(schedule, { status: 201 });
  });
}
