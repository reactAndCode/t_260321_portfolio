export type RiskLevel = "critical" | "high" | "medium";

export type WorkTypeId =
  | "scaffold"
  | "roofing"
  | "excavation"
  | "electrical";

export interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  riskLevel: RiskLevel;
  required: boolean;
  stopWork: boolean;
}

export interface WorkTypeChecklist {
  id: WorkTypeId;
  label: string;
  summary: string;
  accent: string;
  items: ChecklistItem[];
}

export const WORK_TYPES: WorkTypeChecklist[] = [
  {
    id: "scaffold",
    label: "비계 작업",
    summary: "추락과 붕괴를 막기 위한 난간, 발판, 고정 상태를 집중 점검합니다.",
    accent: "추락 고위험",
    items: [
      {
        id: "scaffold-guardrail",
        label: "작업 발판과 난간대가 전 구간에 설치되어 있다.",
        hint: "2중 난간, 발끝막이판 누락 여부를 포함해 확인",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "scaffold-anchor",
        label: "비계 벽이음 및 고정 상태가 풀림 없이 유지된다.",
        hint: "앵커 변형, 체결 불량, 전도 위험 여부 확인",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "scaffold-access",
        label: "상하부 이동통로와 출입금지 구역 표시가 구분되어 있다.",
        hint: "사다리, 계단, 위험구역 통제선 점검",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "scaffold-ppe",
        label: "작업자 전원이 안전대와 보호구를 착용했다.",
        hint: "고소 작업용 안전대 체결 상태 포함",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "scaffold-weather",
        label: "강풍·우천 등 기상 악화 시 작업중지 기준을 공유했다.",
        hint: "작업 전 브리핑 및 중지 기준 게시 여부",
        riskLevel: "medium",
        required: true,
        stopWork: false
      }
    ]
  },
  {
    id: "roofing",
    label: "지붕 작업",
    summary: "개구부 추락과 미끄럼 방지를 위한 방호 조치와 작업 순서를 점검합니다.",
    accent: "개구부 관리",
    items: [
      {
        id: "roofing-lifeline",
        label: "생명줄, 안전대 걸이, 추락방지망이 설치되어 있다.",
        hint: "고정점 인장 강도와 체결 상태 확인",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "roofing-opening",
        label: "채광창·개구부 덮개와 경고표지가 유지된다.",
        hint: "임시 덮개 파손, 이탈 가능성 포함",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "roofing-slip",
        label: "미끄럼 방지용 작업화와 자재 적치 구역이 분리되어 있다.",
        hint: "빗물, 분진, 자재 엉킴 여부 확인",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "roofing-lift",
        label: "양중 장비 작업 반경에 접근 금지 통제가 되어 있다.",
        hint: "신호수 배치와 하부 출입통제 여부 확인",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "roofing-briefing",
        label: "당일 작업 순서와 추락 위험 포인트를 아침 조회에서 공유했다.",
        hint: "신규 투입자와 외주 인력 포함",
        riskLevel: "medium",
        required: true,
        stopWork: false
      }
    ]
  },
  {
    id: "excavation",
    label: "굴착 작업",
    summary: "붕괴, 매몰, 차량 충돌을 막기 위한 경사면과 중장비 동선을 점검합니다.",
    accent: "매몰 위험",
    items: [
      {
        id: "excavation-slope",
        label: "굴착면 구배 또는 흙막이 지보공이 기준대로 유지된다.",
        hint: "토사 상태 변화, 균열, 침하 여부 포함",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "excavation-edge",
        label: "굴착 가장자리 추락방지 난간과 접근금지 조치가 있다.",
        hint: "야간 반사표지 및 조명 포함",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "excavation-equipment",
        label: "굴착기 회전반경과 작업자 보행 동선이 분리되어 있다.",
        hint: "유도원 배치 및 후방경보 작동 확인",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "excavation-rain",
        label: "우수 유입 방지와 배수 계획이 준비되어 있다.",
        hint: "집수정, 배수펌프, 비상복구 자재 포함",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "excavation-gas",
        label: "지중 매설물 및 가스·전기 인입선 사전 확인을 마쳤다.",
        hint: "도면, 탐사 결과, 작업 허가서 대조",
        riskLevel: "medium",
        required: true,
        stopWork: false
      }
    ]
  },
  {
    id: "electrical",
    label: "전기 작업",
    summary: "감전과 화재를 막기 위한 차단, 잠금표시, 임시배선 상태를 점검합니다.",
    accent: "감전 위험",
    items: [
      {
        id: "electrical-lockout",
        label: "전원 차단과 잠금표시(LOTO)가 적용되어 있다.",
        hint: "무전압 확인과 작업자별 태그 부착 포함",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "electrical-leakage",
        label: "누전차단기와 접지 상태가 정상이다.",
        hint: "임시 분전반 시험 버튼 및 접지선 손상 여부 확인",
        riskLevel: "critical",
        required: true,
        stopWork: true
      },
      {
        id: "electrical-cable",
        label: "임시배선이 통행로와 분리되고 피복 손상이 없다.",
        hint: "케이블 커버, 방수 조치 포함",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "electrical-hotwork",
        label: "용접·절단 병행 시 화재감시자와 소화기가 배치되어 있다.",
        hint: "비산불티 방지포와 인화물 제거 여부 확인",
        riskLevel: "high",
        required: true,
        stopWork: false
      },
      {
        id: "electrical-qualification",
        label: "작업자 자격과 오늘 작업허가서가 확인되었다.",
        hint: "협력사 포함, 교육 이수 여부 확인",
        riskLevel: "medium",
        required: true,
        stopWork: false
      }
    ]
  }
];

export const DEFAULT_WORK_TYPE = WORK_TYPES[0].id;

export function getWorkType(workTypeId: WorkTypeId) {
  return WORK_TYPES.find((workType) => workType.id === workTypeId) ?? WORK_TYPES[0];
}
