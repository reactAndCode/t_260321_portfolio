type DatalabResultItem = {
  title: string;
  data: Array<{
    period: string;
    ratio: number;
  }>;
};

function getDatalabConfig() {
  const clientId = process.env.NAVER_DATALAB_CLIENT_ID;
  const clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

function getStartDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 11);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function fetchDatalabTrend(keyword: string) {
  const config = getDatalabConfig();

  if (!config) {
    return null;
  }

  const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Naver-Client-Id": config.clientId,
      "X-Naver-Client-Secret": config.clientSecret
    },
    body: JSON.stringify({
      startDate: getStartDate(),
      endDate: new Date().toISOString().slice(0, 10),
      timeUnit: "month",
      keywordGroups: [
        {
          groupName: keyword,
          keywords: [keyword]
        }
      ]
    }),
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`DataLab API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: DatalabResultItem[];
  };

  return (payload.results?.[0]?.data ?? []).map((point) => ({
    date: point.period.slice(0, 7),
    value: point.ratio
  }));
}
