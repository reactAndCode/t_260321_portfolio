"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_WORK_TYPE,
  type ChecklistItem,
  getWorkType,
  type RiskLevel,
  WORK_TYPES,
  type WorkTypeId
} from "@/lib/checklists";

const DRAFT_STORAGE_KEY = "crewsafe-inspection-draft";
const HISTORY_STORAGE_KEY = "crewsafe-inspection-history";

interface InspectionFormState {
  siteName: string;
  contractorName: string;
  inspectorName: string;
  inspectionDate: string;
  weather: string;
}

interface PhotoPreview {
  id: string;
  name: string;
  sizeLabel: string;
  url: string;
}

interface SavedInspection {
  id: string;
  createdAt: string;
  inspectionDate: string;
  weather: string;
  siteName: string;
  contractorName: string;
  inspectorName: string;
  workTypeLabel: string;
  score: number;
  checkedCount: number;
  totalCount: number;
  stopWorkCount: number;
  missingItems: string[];
  photoCount: number;
  notes: string;
}

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatTimestamp(isoString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(isoString));
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))}KB`;
}

function buildChecklistState(items: ChecklistItem[], currentState?: Record<string, boolean>) {
  return items.reduce<Record<string, boolean>>((nextState, item) => {
    nextState[item.id] = currentState?.[item.id] ?? false;
    return nextState;
  }, {});
}

function riskLabel(level: RiskLevel) {
  switch (level) {
    case "critical":
      return "즉시 중지";
    case "high":
      return "우선 보완";
    default:
      return "일반 확인";
  }
}

export function InspectionDashboard() {
  const [form, setForm] = useState<InspectionFormState>({
    siteName: "",
    contractorName: "",
    inspectorName: "",
    inspectionDate: "",
    weather: "맑음"
  });
  const [workTypeId, setWorkTypeId] = useState<WorkTypeId>(DEFAULT_WORK_TYPE);
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    buildChecklistState(getWorkType(DEFAULT_WORK_TYPE).items)
  );
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [history, setHistory] = useState<SavedInspection[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const photoUrlsRef = useRef<string[]>([]);

  const workType = useMemo(() => getWorkType(workTypeId), [workTypeId]);

  useEffect(() => {
    if (!form.inspectionDate) {
      setForm((current) => ({ ...current, inspectionDate: getTodayInputValue() }));
    }
  }, [form.inspectionDate]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

      if (draft) {
        const parsedDraft = JSON.parse(draft) as {
          form: InspectionFormState;
          workTypeId: WorkTypeId;
          checks: Record<string, boolean>;
          notes: string;
        };

        setForm({
          ...parsedDraft.form,
          inspectionDate: parsedDraft.form.inspectionDate || getTodayInputValue()
        });
        setWorkTypeId(parsedDraft.workTypeId);
        setChecks(buildChecklistState(getWorkType(parsedDraft.workTypeId).items, parsedDraft.checks));
        setNotes(parsedDraft.notes ?? "");
      }

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as SavedInspection[];
        setHistory(parsedHistory);
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    setChecks((current) => buildChecklistState(workType.items, current));
  }, [workType]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        form,
        workTypeId,
        checks,
        notes
      })
    );
  }, [checks, form, hasHydrated, notes, workTypeId]);

  useEffect(() => {
    photoUrlsRef.current = photos.map((photo) => photo.url);
  }, [photos]);

  useEffect(() => {
    return () => {
      photoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const totalCount = workType.items.length;
  const checkedCount = workType.items.filter((item) => checks[item.id]).length;
  const missingCriticalItems = workType.items.filter((item) => item.stopWork && !checks[item.id]);
  const missingItems = workType.items.filter((item) => item.required && !checks[item.id]);
  const completionRate = Math.round((checkedCount / totalCount) * 100);
  const score = Math.max(
    0,
    100 - missingCriticalItems.length * 28 - (missingItems.length - missingCriticalItems.length) * 12
  );

  const statusTone = missingCriticalItems.length
    ? "critical"
    : missingItems.length > 2
      ? "warning"
      : "safe";

  const statusLabel =
    statusTone === "critical"
      ? "작업 중지 권고"
      : statusTone === "warning"
        ? "보완 후 진행"
        : "진행 가능";

  const guidance =
    statusTone === "critical"
      ? "즉시 중지 항목이 남아 있습니다. 조치 완료 전 착공을 멈추고 사진 증빙을 남기세요."
      : statusTone === "warning"
        ? "착수 전 보완이 필요한 항목이 있습니다. 반장 확인 후 재점검 권장입니다."
        : "핵심 항목이 충족되었습니다. 작업 중에도 변동 사항이 생기면 즉시 재점검하세요.";

  const handleFormChange =
    (field: keyof InspectionFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value
      }));
    };

  const handleToggleChecklist = (itemId: string) => {
    setChecks((current) => ({
      ...current,
      [itemId]: !current[itemId]
    }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    const availableSlots = Math.max(0, 6 - photos.length);
    const newPhotos = selectedFiles.slice(0, availableSlots).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      url: URL.createObjectURL(file)
    }));

    setPhotos((current) => [...current, ...newPhotos]);
    event.target.value = "";
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === photoId);
      if (target) {
        URL.revokeObjectURL(target.url);
      }

      return current.filter((photo) => photo.id !== photoId);
    });
  };

  const handleSaveInspection = () => {
    if (!form.siteName.trim() || !form.inspectorName.trim() || !form.contractorName.trim()) {
      setFeedback("현장명, 시공사, 점검자를 모두 입력해야 기록을 저장할 수 있습니다.");
      return;
    }

    const entry: SavedInspection = {
      id: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`,
      createdAt: new Date().toISOString(),
      inspectionDate: form.inspectionDate,
      weather: form.weather,
      siteName: form.siteName.trim(),
      contractorName: form.contractorName.trim(),
      inspectorName: form.inspectorName.trim(),
      workTypeLabel: workType.label,
      score,
      checkedCount,
      totalCount,
      stopWorkCount: missingCriticalItems.length,
      missingItems: missingItems.map((item) => item.label),
      photoCount: photos.length,
      notes: notes.trim()
    };

    const nextHistory = [entry, ...history].slice(0, 8);
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setFeedback("점검 기록이 브라우저에 저장되었습니다. 현장 재방문 시 최근 기록을 바로 확인할 수 있습니다.");
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">CrewSafe Daily Inspection MVP</p>
          <h1>소규모 건설 현장을 위한 일일 안전점검 보드</h1>
          <p className="hero-copy">
            작업별 체크리스트, 사진 증빙, 즉시 중지 항목 요약을 한 화면에 묶었습니다. 반장이나
            현장소장이 모바일로 빠르게 점검하고, 저장된 기록을 통해 사고 전 예방 근거를 남길 수
            있습니다.
          </p>
        </div>

        <div className="hero-metrics">
          <article className="metric-card">
            <span>오늘 작업</span>
            <strong>{workType.label}</strong>
            <small>{workType.accent}</small>
          </article>
          <article className="metric-card">
            <span>점검 완성도</span>
            <strong>{completionRate}%</strong>
            <small>
              {checkedCount}/{totalCount} 항목 확인
            </small>
          </article>
          <article className={`metric-card status-card ${statusTone}`}>
            <span>현장 판단</span>
            <strong>{statusLabel}</strong>
            <small>{missingCriticalItems.length}개 중지 항목 미해결</small>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <div className="primary-column">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="section-kicker">현장 기본 정보</p>
                <h2>당일 점검 대상</h2>
              </div>
              <span className="panel-badge">모바일 입력 최적화</span>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>현장명</span>
                <input
                  type="text"
                  placeholder="예: 성수동 오피스텔 신축"
                  value={form.siteName}
                  onChange={handleFormChange("siteName")}
                />
              </label>

              <label className="field">
                <span>시공사</span>
                <input
                  type="text"
                  placeholder="예: 대명건설"
                  value={form.contractorName}
                  onChange={handleFormChange("contractorName")}
                />
              </label>

              <label className="field">
                <span>점검자</span>
                <input
                  type="text"
                  placeholder="예: 현장소장 김민수"
                  value={form.inspectorName}
                  onChange={handleFormChange("inspectorName")}
                />
              </label>

              <label className="field">
                <span>점검일</span>
                <input
                  type="date"
                  value={form.inspectionDate}
                  onChange={handleFormChange("inspectionDate")}
                />
              </label>

              <label className="field">
                <span>날씨</span>
                <select value={form.weather} onChange={handleFormChange("weather")}>
                  <option value="맑음">맑음</option>
                  <option value="흐림">흐림</option>
                  <option value="비">비</option>
                  <option value="강풍">강풍</option>
                  <option value="눈">눈</option>
                </select>
              </label>
            </div>
          </article>

          <article className="panel">
            <div className="section-head">
              <div>
                <p className="section-kicker">작업별 체크리스트</p>
                <h2>오늘의 작업 유형</h2>
              </div>
              <span className="panel-badge accent">{workType.accent}</span>
            </div>

            <div className="work-type-grid">
              {WORK_TYPES.map((candidate) => {
                const active = candidate.id === workTypeId;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    className={`work-type-card ${active ? "active" : ""}`}
                    onClick={() => setWorkTypeId(candidate.id)}
                  >
                    <strong>{candidate.label}</strong>
                    <span>{candidate.summary}</span>
                  </button>
                );
              })}
            </div>

            <div className="checklist">
              {workType.items.map((item) => {
                const checked = checks[item.id];

                return (
                  <label key={item.id} className={`check-item ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleChecklist(item.id)}
                    />
                    <div className="check-copy">
                      <div className="check-topline">
                        <span className={`risk-tag ${item.riskLevel}`}>{riskLabel(item.riskLevel)}</span>
                        <span className="state-tag">{checked ? "확인 완료" : "미확인"}</span>
                      </div>
                      <strong>{item.label}</strong>
                      <p>{item.hint}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </article>

          <article className="panel">
            <div className="section-head">
              <div>
                <p className="section-kicker">사진 증빙</p>
                <h2>현장 상태 촬영</h2>
              </div>
              <span className="panel-badge">최대 6장</span>
            </div>

            <label className="upload-box">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoChange}
              />
              <strong>카메라 또는 갤러리에서 사진 추가</strong>
              <span>난간, 개구부, 분전반, 장비 동선 등 핵심 증빙을 남기세요.</span>
            </label>

            <div className="photo-grid">
              {photos.length ? (
                photos.map((photo) => (
                  <article key={photo.id} className="photo-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.name} />
                    <div className="photo-meta">
                      <strong>{photo.name}</strong>
                      <span>{photo.sizeLabel}</span>
                    </div>
                    <button type="button" onClick={() => handleRemovePhoto(photo.id)}>
                      삭제
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-photos">아직 첨부된 사진이 없습니다.</div>
              )}
            </div>
          </article>
        </div>

        <aside className="secondary-column">
          <article className={`panel summary-panel ${statusTone}`}>
            <div className="section-head">
              <div>
                <p className="section-kicker">AI Risk Snapshot</p>
                <h2>오늘의 위험 요약</h2>
              </div>
              <span className="score-chip">{score}점</span>
            </div>

            <div className="summary-stack">
              <div className="summary-status">
                <strong>{statusLabel}</strong>
                <p>{guidance}</p>
              </div>

              <div className="summary-metric-grid">
                <div>
                  <span>즉시 중지 항목</span>
                  <strong>{missingCriticalItems.length}개</strong>
                </div>
                <div>
                  <span>미확인 항목</span>
                  <strong>{missingItems.length}개</strong>
                </div>
                <div>
                  <span>사진 증빙</span>
                  <strong>{photos.length}장</strong>
                </div>
                <div>
                  <span>CrewSafe 준비도</span>
                  <strong>{score}%</strong>
                </div>
              </div>

              <div className="alert-box">
                <strong>우선 조치</strong>
                {missingItems.length ? (
                  <ul>
                    {missingItems.slice(0, 4).map((item) => (
                      <li key={item.id}>{item.label}</li>
                    ))}
                  </ul>
                ) : (
                  <p>필수 항목이 모두 충족되었습니다. 점검 메모만 남기면 됩니다.</p>
                )}
              </div>

              <label className="field">
                <span>점검 메모</span>
                <textarea
                  rows={6}
                  placeholder="예: 3층 동측 비계 난간 재체결 요청, 오전 10시까지 조치 예정"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>

              <button type="button" className="save-button" onClick={handleSaveInspection}>
                점검 기록 저장
              </button>

              {feedback ? <p className="feedback">{feedback}</p> : null}
            </div>
          </article>

          <article className="panel history-panel">
            <div className="section-head">
              <div>
                <p className="section-kicker">최근 기록</p>
                <h2>저장된 점검 이력</h2>
              </div>
              <span className="panel-badge">{history.length}건</span>
            </div>

            <div className="history-list">
              {history.length ? (
                history.map((entry) => (
                  <article key={entry.id} className="history-item">
                    <div className="history-topline">
                      <strong>{entry.siteName}</strong>
                      <span>{formatTimestamp(entry.createdAt)}</span>
                    </div>
                    <p>
                      {entry.inspectionDate} · {entry.weather} · {entry.workTypeLabel}
                    </p>
                    <p>
                      {entry.contractorName} · {entry.inspectorName}
                    </p>
                    <div className="history-metrics">
                      <span>점수 {entry.score}</span>
                      <span>중지항목 {entry.stopWorkCount}</span>
                      <span>사진 {entry.photoCount}</span>
                    </div>
                    {entry.missingItems.length ? (
                      <small>{entry.missingItems[0]}</small>
                    ) : (
                      <small>필수 항목 모두 확인</small>
                    )}
                  </article>
                ))
              ) : (
                <div className="empty-history">저장된 점검 기록이 아직 없습니다.</div>
              )}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
