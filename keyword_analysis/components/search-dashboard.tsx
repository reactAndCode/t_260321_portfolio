"use client";

import { useEffect, useState } from "react";
import { KeywordAnalysisResult } from "@/lib/types";

function formatNumber(value: number | null) {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("ko-KR");
}

function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      <span className="metric-hint">{hint}</span>
    </article>
  );
}

function TrendChart({ trend }: { trend: KeywordAnalysisResult["trend"] }) {
  if (trend.length === 0) {
    return <div className="empty-panel">추이 데이터가 아직 없습니다.</div>;
  }

  const max = Math.max(...trend.map((point) => point.value), 1);
  const points = trend
    .map((point, index) => {
      const x = (index / Math.max(trend.length - 1, 1)) * 100;
      const y = 100 - (point.value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-shell">
      <svg viewBox="0 0 100 100" className="trend-svg" preserveAspectRatio="none">
        <polyline points={points} />
      </svg>
      <div className="chart-labels">
        {trend.map((point) => (
          <span key={point.date}>{point.date.slice(2)}</span>
        ))}
      </div>
    </div>
  );
}

export function SearchDashboard() {
  const [keyword, setKeyword] = useState("문래동 미술학원");
  const [submittedKeyword, setSubmittedKeyword] = useState("문래동 미술학원");
  const [data, setData] = useState<KeywordAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis(
    nextKeyword: string,
    options?: {
      signal?: AbortSignal;
    }
  ) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analyze?keyword=${encodeURIComponent(nextKeyword)}`, {
        signal: options?.signal
      });
      const payload = (await response.json()) as KeywordAnalysisResult | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "분석 요청에 실패했습니다.");
      }

      setData(payload);
    } catch (submitError) {
      setData(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "분석 중 알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = keyword.trim();
    if (!trimmed) {
      setError("키워드를 입력해 주세요.");
      return;
    }

    setSubmittedKeyword(trimmed);
    await runAnalysis(trimmed);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialData() {
      await runAnalysis("문래동 미술학원", { signal: controller.signal });
    }

    void loadInitialData();

    return () => controller.abort();
  }, []);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">NAVER KEYWORD ANALYSIS</p>
          <h1>검색 전에, 수요와 확장 가능성부터 봅니다.</h1>
          <p className="hero-text">
            네이버 키워드를 입력하면 검색량, 추이, 연관 키워드를 한 화면에서 빠르게 확인할 수
            있는 MVP 대시보드입니다.
          </p>
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          <label className="search-label" htmlFor="keyword">
            분석할 키워드
          </label>
          <div className="search-row">
            <input
              id="keyword"
              className="search-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="예: 문래동 미술학원"
            />
            <button className="search-button" type="submit" disabled={loading}>
              {loading ? "분석 중..." : "분석 시작"}
            </button>
          </div>
          <p className="search-note">
            환경변수가 없으면 mock 데이터로 동작하고, 설정되면 네이버 실데이터를 우선 조회합니다.
          </p>
        </form>
      </section>

      {error ? <section className="status-panel error">{error}</section> : null}

      {!data && !loading && !error ? (
        <section className="status-panel">
          <strong>{submittedKeyword}</strong> 검색어로 대시보드를 시작해 보세요.
        </section>
      ) : null}

      {data ? (
        <section className="dashboard">
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">RESULT</p>
              <h2>{data.keyword}</h2>
            </div>
            <div className="source-chip">
              {data.sourceMeta.mode === "live" ? "Live Naver Data" : "Mock Preview"}
            </div>
          </div>

          <div className="metric-grid">
            <MetricCard
              label="월간 PC 검색량"
              value={formatNumber(data.summary.monthlySearchPc)}
              hint="SearchAd 기준"
            />
            <MetricCard
              label="월간 모바일 검색량"
              value={formatNumber(data.summary.monthlySearchMobile)}
              hint="SearchAd 기준"
            />
            <MetricCard
              label="월간 총 검색량"
              value={formatNumber(data.summary.monthlySearchTotal)}
              hint="PC + Mobile"
            />
          </div>

          <div className="panel-grid">
            <article className="panel">
              <div className="panel-head">
                <h3>검색 추이</h3>
                <span>최근 12개월</span>
              </div>
              <TrendChart trend={data.trend} />
            </article>

            <article className="panel">
              <div className="panel-head">
                <h3>빠른 인사이트</h3>
                <span>자동 요약</span>
              </div>
              {data.insights.length > 0 ? (
                <ul className="insight-list">
                  {data.insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              ) : (
                <div className="empty-panel">요약할 데이터가 아직 충분하지 않습니다.</div>
              )}
            </article>
          </div>

          <article className="panel">
            <div className="panel-head">
              <h3>연관 키워드</h3>
              <span>확장 후보</span>
            </div>
            {data.relatedKeywords.length > 0 ? (
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>키워드</th>
                      <th>월간 검색량</th>
                      <th>경쟁도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.relatedKeywords.map((item) => (
                      <tr key={item.keyword}>
                        <td>{item.keyword}</td>
                        <td>{formatNumber(item.monthlyTotal)}</td>
                        <td>
                          {item.competition === null
                            ? "-"
                            : `${Math.round(item.competition * 100)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-panel">표시할 연관 키워드가 없습니다.</div>
            )}
          </article>
        </section>
      ) : null}
    </main>
  );
}
