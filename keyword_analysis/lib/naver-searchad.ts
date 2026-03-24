import crypto from "node:crypto";

type SearchAdKeywordItem = {
  relKeyword: string;
  monthlyPcQcCnt: string;
  monthlyMobileQcCnt: string;
  compIdx: string;
};

function getSearchAdConfig() {
  const accessKey = process.env.NAVER_SEARCHAD_ACCESS_KEY;
  const secretKey = process.env.NAVER_SEARCHAD_SECRET_KEY;
  const customerId = process.env.NAVER_SEARCHAD_CUSTOMER_ID;

  if (!accessKey || !secretKey || !customerId) {
    return null;
  }

  return { accessKey, secretKey, customerId };
}

function createSignature(timestamp: string, secretKey: string) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}.GET./keywordstool`)
    .digest("base64");
}

function parseCount(raw: string) {
  if (!raw || raw === "< 10") {
    return 0;
  }

  const parsed = Number(raw.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchSearchAdKeyword(keyword: string) {
  const config = getSearchAdConfig();

  if (!config) {
    return null;
  }

  const timestamp = Date.now().toString();
  const signature = createSignature(timestamp, config.secretKey);
  const endpoint = new URL("https://api.searchad.naver.com/keywordstool");
  endpoint.searchParams.set("hintKeywords", keyword);
  endpoint.searchParams.set("showDetail", "1");

  const response = await fetch(endpoint, {
    headers: {
      "X-Timestamp": timestamp,
      "X-API-KEY": config.accessKey,
      "X-Customer": config.customerId,
      "X-Signature": signature
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`SearchAd API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    keywordList?: SearchAdKeywordItem[];
  };

  const items = payload.keywordList ?? [];
  const exact = items.find((item) => item.relKeyword === keyword) ?? items[0];

  return {
    keywordSummary: exact
      ? {
          monthlySearchPc: parseCount(exact.monthlyPcQcCnt),
          monthlySearchMobile: parseCount(exact.monthlyMobileQcCnt)
        }
      : {
          monthlySearchPc: null,
          monthlySearchMobile: null
        },
    relatedKeywords: items.slice(0, 8).map((item) => ({
      keyword: item.relKeyword,
      monthlyTotal: parseCount(item.monthlyPcQcCnt) + parseCount(item.monthlyMobileQcCnt),
      competition: item.compIdx ? Number(item.compIdx) : null
    }))
  };
}
