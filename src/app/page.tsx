'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '@/lib/types';
import { DAYS_OF_WEEK, SCHEDULE_COLORS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 월~토 탭 (index 1~6, 일요일=0 제외)
const DAY_TABS = [1, 2, 3, 4, 5, 6] as const;

function getTodayTab(): number {
  const today = new Date().getDay(); // 0=일 ~ 6=토
  return DAY_TABS.includes(today as (typeof DAY_TABS)[number]) ? today : 1;
}

function formatTime(t: string) {
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

// ---------- Modal ----------

interface ModalProps {
  schedule?: Schedule | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: (id: number) => void;
}

function ScheduleModal({ schedule, onClose, onSaved, onDelete }: ModalProps) {
  const isEdit = !!schedule;

  const [form, setForm] = useState<CreateScheduleRequest & { is_active?: number }>({
    title: schedule?.title ?? '',
    type: schedule?.type ?? 'academy',
    day_of_week: schedule?.day_of_week ?? getTodayTab(),
    start_time: schedule?.start_time ?? '15:00',
    end_time: schedule?.end_time ?? '16:00',
    location: schedule?.location ?? '',
    color: schedule?.color ?? SCHEDULE_COLORS[0],
    notes: schedule?.notes ?? '',
    is_active: schedule?.is_active ?? 1,
  });

  const [saving, setSaving] = useState(false);

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = isEdit ? `/api/schedules/${schedule!.id}` : '/api/schedules';
    const method = isEdit ? 'PUT' : 'POST';

    const body: CreateScheduleRequest | UpdateScheduleRequest = {
      ...form,
      location: form.location || undefined,
      notes: form.notes || undefined,
    };

    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{isEdit ? '수업 수정' : '수업 추가'}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* 이름 */}
          <label className="form-label">
            수업 이름
            <input className="form-input" required value={form.title} onChange={(e) => set('title', e.target.value)} />
          </label>

          {/* 타입 */}
          <label className="form-label">
            유형
            <select className="form-input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="school">학교</option>
              <option value="academy">학원</option>
            </select>
          </label>

          {/* 요일 */}
          <label className="form-label">
            요일
            <select className="form-input" value={form.day_of_week} onChange={(e) => set('day_of_week', Number(e.target.value))}>
              {DAY_TABS.map((d) => (
                <option key={d} value={d}>{DAYS_OF_WEEK[d]}</option>
              ))}
            </select>
          </label>

          {/* 시간 */}
          <div className="flex gap-2">
            <label className="form-label flex-1">
              시작
              <input className="form-input" type="time" required value={form.start_time} onChange={(e) => set('start_time', e.target.value)} />
            </label>
            <label className="form-label flex-1">
              종료
              <input className="form-input" type="time" required value={form.end_time} onChange={(e) => set('end_time', e.target.value)} />
            </label>
          </div>

          {/* 장소 */}
          <label className="form-label">
            장소
            <input className="form-input" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
          </label>

          {/* 색상 */}
          <div className="form-label">
            색상
            <div className="flex gap-2 mt-1">
              {SCHEDULE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="color-dot"
                  style={{
                    backgroundColor: c,
                    outline: form.color === c ? '3px solid #000' : 'none',
                    outlineOffset: '2px',
                  }}
                  onClick={() => set('color', c)}
                />
              ))}
            </div>
          </div>

          {/* 메모 */}
          <label className="form-label">
            메모
            <textarea className="form-input" rows={2} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </label>

          {/* 버튼 */}
          <div className="flex gap-2 mt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? '저장 중...' : isEdit ? '수정' : '추가'}
            </button>
            {isEdit && onDelete && (
              <button type="button" className="btn-danger" onClick={() => onDelete(schedule!.id)}>
                삭제
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function Home() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Schedule | null>(null);
  const [longPressId, setLongPressId] = useState<number | null>(null);

  useEffect(() => {
    setSelectedDay(getTodayTab());
  }, []);

  const { data: schedules = [], isLoading } = useSWR<Schedule[]>(
    `/api/schedules?day=${selectedDay}`,
    fetcher,
  );

  const refresh = useCallback(() => {
    mutate(`/api/schedules?day=${selectedDay}`);
  }, [selectedDay]);

  function openAdd() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(s: Schedule) {
    setEditTarget(s);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
  }

  function handleSaved() {
    closeModal();
    refresh();
    // 수정 시 요일이 바뀌었을 수 있으므로 모든 캐시 무효화
    mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/schedules'), undefined, { revalidate: true });
  }

  async function handleDelete(id: number) {
    if (!confirm('정말 삭제할까요?')) return;
    await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    closeModal();
    refresh();
  }

  // long press for mobile delete
  let pressTimer: ReturnType<typeof setTimeout>;

  function handleTouchStart(id: number) {
    pressTimer = setTimeout(() => setLongPressId(id), 600);
  }

  function handleTouchEnd() {
    clearTimeout(pressTimer);
  }

  async function confirmLongPressDelete(id: number) {
    if (!confirm('이 수업을 삭제할까요?')) {
      setLongPressId(null);
      return;
    }
    await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    setLongPressId(null);
    refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">도윤이 시간표</h1>
          <button onClick={openAdd} className="btn-primary text-sm">
            + 추가
          </button>
        </div>

        {/* Day Tabs */}
        <div className="max-w-lg mx-auto flex border-t border-gray-100">
          {DAY_TABS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`day-tab flex-1 ${selectedDay === d ? 'day-tab-active' : ''}`}
            >
              {DAYS_OF_WEEK[d]}
            </button>
          ))}
        </div>
      </header>

      {/* Schedule Cards */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12">불러오는 중...</p>
        ) : schedules.length === 0 ? (
          <p className="text-center text-gray-400 py-12">이 날은 수업이 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="schedule-card"
                style={{ borderLeftColor: s.color }}
                onClick={() => openEdit(s)}
                onTouchStart={() => handleTouchStart(s.id)}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => { e.preventDefault(); setLongPressId(s.id); }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-semibold text-gray-900">{s.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {s.type === 'school' ? '학교' : '학원'}
                      </span>
                    </div>
                    {s.location && (
                      <p className="text-sm text-gray-500 mt-1 ml-4">{s.location}</p>
                    )}
                    {s.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 ml-4">{s.notes}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap ml-2">
                    {formatTime(s.start_time)} ~ {formatTime(s.end_time)}
                  </span>
                </div>

                {/* Long press delete popup */}
                {longPressId === s.id && (
                  <div className="mt-2 flex gap-2 justify-end">
                    <button className="text-xs text-gray-500" onClick={(e) => { e.stopPropagation(); setLongPressId(null); }}>
                      취소
                    </button>
                    <button className="text-xs text-red-500 font-medium" onClick={(e) => { e.stopPropagation(); confirmLongPressDelete(s.id); }}>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <ScheduleModal
          schedule={editTarget}
          onClose={closeModal}
          onSaved={handleSaved}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
