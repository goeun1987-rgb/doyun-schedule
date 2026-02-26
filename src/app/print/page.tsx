import { getAllSchedules } from '@/lib/db-schedules';
import type { Schedule } from '@/lib/types';

const DAYS = ['월', '화', '수', '목', '금', '토'] as const;
const DAY_INDICES = [1, 2, 3, 4, 5, 6];
const START_HOUR = 13;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const ROW_HEIGHT = 70; // px per hour

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(t: string) {
  return t.slice(0, 5);
}

function toBgColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

export default async function PrintPage() {
  const schedules = await getAllSchedules();

  const byDay = new Map<number, Schedule[]>();
  for (const d of DAY_INDICES) byDay.set(d, []);
  for (const s of schedules) {
    byDay.get(s.day_of_week)?.push(s);
  }

  const bodyHeight = HOURS.length * ROW_HEIGHT;

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '20px 12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <h1 style={{
        fontSize: 22,
        fontWeight: 800,
        textAlign: 'center',
        marginBottom: 14,
        color: '#111827',
      }}>
        도윤이 시간표
      </h1>

      <div style={{
        display: 'flex',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}>
        {/* 시간 열 */}
        <div style={{ width: 52, flexShrink: 0 }}>
          {/* 헤더 빈칸 */}
          <div style={{
            height: 36,
            borderBottom: '1px solid #d1d5db',
            background: '#f9fafb',
          }} />
          {/* 시간 라벨들 */}
          {HOURS.map((h, i) => (
            <div key={h} style={{
              height: ROW_HEIGHT,
              borderBottom: i < HOURS.length - 1 ? '1px solid #f3f4f6' : 'none',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              paddingRight: 6,
              paddingTop: 2,
              fontSize: 11,
              color: '#9ca3af',
            }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 요일 열들 */}
        {DAY_INDICES.map((dayIdx, di) => {
          const daySchedules = byDay.get(dayIdx) || [];
          return (
            <div key={dayIdx} style={{
              flex: 1,
              borderLeft: '1px solid #d1d5db',
              minWidth: 0,
            }}>
              {/* 요일 헤더 */}
              <div style={{
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                color: '#374151',
                background: '#f9fafb',
                borderBottom: '1px solid #d1d5db',
              }}>
                {DAYS[di]}
              </div>

              {/* 시간 본문 - relative container */}
              <div style={{
                position: 'relative',
                height: bodyHeight,
              }}>
                {/* 시간 구분선 */}
                {HOURS.map((h, i) => (
                  <div key={h} style={{
                    position: 'absolute',
                    top: i * ROW_HEIGHT,
                    left: 0,
                    right: 0,
                    height: ROW_HEIGHT,
                    borderBottom: i < HOURS.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }} />
                ))}

                {/* 수업 블록 */}
                {daySchedules.map((s) => {
                  const startMin = timeToMinutes(s.start_time) - START_HOUR * 60;
                  const duration = timeToMinutes(s.end_time) - timeToMinutes(s.start_time);
                  const topPx = (startMin / 60) * ROW_HEIGHT;
                  const heightPx = (duration / 60) * ROW_HEIGHT;

                  return (
                    <div key={s.id} style={{
                      position: 'absolute',
                      top: topPx + 1,
                      height: heightPx - 2,
                      left: 2,
                      right: 2,
                      backgroundColor: toBgColor(s.color),
                      borderLeft: `3px solid ${s.color}`,
                      borderRadius: 4,
                      padding: '3px 4px',
                      overflow: 'hidden',
                      fontSize: 10,
                      lineHeight: 1.3,
                    }}>
                      <div style={{ fontWeight: 700, color: '#1f2937', fontSize: 11 }}>
                        {s.title}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 9 }}>
                        {formatTime(s.start_time)}~{formatTime(s.end_time)}
                      </div>
                      {s.location && (
                        <div style={{ color: '#9ca3af', fontSize: 8, marginTop: 1 }}>
                          {s.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{
        textAlign: 'center',
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 10,
      }}>
        2026년 2월 기준
      </p>
    </div>
  );
}
