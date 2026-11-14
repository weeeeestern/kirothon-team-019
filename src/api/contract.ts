// 프론트와 백엔드의 계약. backend-dev만 고친다 (.kiro/steering/api-contract.md).
// 서버에는 경로의 정류장 목록, 출발 시각, 위치를 보내지 않는다. 경로는 routeKey 문자열 하나로만 가리킨다.

export const REPORT_SITUATIONS = ['construction', 'strike', 'marathon', 'congestion', 'rain', 'dust'] as const;
export type ReportSituation = typeof REPORT_SITUATIONS[number];

export type ApiMode = 'remote' | 'local';

/** 경로 키 형식 `<노선>:<출발역>-<도착역>` (예: `2:강남-선릉`), 1~80자 */
export interface ReportInput {
  routeKey: string;
  situation: ReportSituation;
  /** 1~60자 */
  place: string;
  /** `HH:mm` (예: `08:10`) */
  time: string;
  /** 0~100자 */
  note: string;
}

/** 서울 날짜 기준 오늘 제보 한 건. 다른 사용자 ID는 담기지 않는다. */
export interface ReportStatus {
  id: string;
  routeKey: string;
  situation: ReportSituation;
  place: string;
  time: string;
  note: string;
  /** `YYYY-MM-DD` (서울) */
  reportDay: string;
  /** 작성자를 뺀 서로 다른 사용자의 확인 수 */
  confirmations: number;
  /** confirmations >= 2 */
  confirmed: boolean;
  isMine: boolean;
}

export type PointReason = 'report' | 'helpful' | 'feedback';

export interface PointEntry {
  /** 이유별 고유 키: `report:<id>`, `helpful:<id>:<user>`, `feedback:<noticeId>` */
  id: string;
  amount: 1 | 5 | 10;
  reason: PointReason;
  createdAt: string;
}

/** RPC가 던지는 오류 코드. `connection`은 네트워크 실패(화면의 "연결이 불안정해요" 안내용). */
export type ApiErrorCode =
  | 'invalid_input' | 'unauthenticated' | 'not_found' | 'self_confirm' | 'route_mismatch'
  | 'expired' | 'duplicate' | 'self_helpful' | 'not_confirmed' | 'connection' | 'unknown';

export const API_ERROR_CODES: readonly ApiErrorCode[] = [
  'invalid_input', 'unauthenticated', 'not_found', 'self_confirm', 'route_mismatch',
  'expired', 'duplicate', 'self_helpful', 'not_confirmed', 'connection', 'unknown',
];

export class ApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export interface ReportsApi {
  mode: ApiMode;
  /** 제보 저장, 작성자 +10 (한 번만). */
  submitReport(input: ReportInput): Promise<{ id: string }>;
  /** 확인 기록 후 작성자를 뺀 확인 수를 반환. 본인·중복·다른 경로·날짜 지남이면 ApiError. */
  confirmReport(id: string, routeKey: string): Promise<{ confirmations: number }>;
  /** 확인된 제보에 '도움됨', 작성자 +5 (한 번만). 새로 기록되면 true, 이미 눌렀으면 false. 본인·미확인이면 ApiError. */
  markHelpful(id: string): Promise<boolean>;
  /** 알림 ID당 +1 (한 번만). 새로 적립되면 true, 이미 했으면 false. */
  recordFeedback(noticeId: string): Promise<boolean>;
  /** 같은 경로 키의 오늘(서울) 제보. */
  listToday(routeKey: string): Promise<ReportStatus[]>;
  /** 내 포인트 원장 (최신순). */
  myPoints(): Promise<PointEntry[]>;
  /**
   * local 모드 전용 시연 보조. 이웃 2명이 확인한 것으로 기록한다. remote에는 없다.
   * (한 브라우저에서는 서로 다른 사용자 2명을 만들 수 없어서 둔다.)
   */
  simulateNeighbors?(id: string): Promise<void>;
}
