/**
 * @fileoverview 애플리케이션 설정 상수
 * KT 빌딩 좌표, 도보 설정, 예산 범위 등
 */

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - 위도
 * @property {number} lng - 경도
 */

/**
 * KT East 빌딩 기준 좌표 (종로3길 33)
 * @type {Coordinates}
 */
export const KT_EAST_COORDS = { 
  lat: 37.5703, 
  lng: 126.9835 
};

/**
 * 평균 도보 속도 (미터/분)
 * 일반 성인 평균 도보 속도 기준
 * @type {number}
 */
export const WALK_SPEED = 80;

/**
 * 실제 도보 경로 보정 계수
 * 직선거리 대비 실제 도보 경로는 약 1.3배 더 김
 * @type {number}
 */
export const WALK_DISTANCE_MULTIPLIER = 1.3;

/**
 * 예산 범위 정의 (원)
 * @type {Object.<string, Object>}
 */
export const BUDGET_RANGES = {
  cheap: {
    min: 0,
    max: 10000,
    label: "~1만원",
    description: "가성비 최고"
  },
  normal: {
    min: 10000,
    max: 20000,
    label: "1~2만원",
    description: "보통 수준"
  },
  expensive: {
    min: 20000,
    max: Infinity,
    label: "2만원 이상",
    description: "특별하게"
  }
};

/**
 * 예산 호환성 테이블
 * 사용자가 선택한 예산에 따라 허용되는 식당 예산 범위
 * 
 * 로직:
 * - cheap(~1만원): cheap만 허용 (가성비 중시)
 * - normal(1~2만원): cheap, normal 허용 (저렴한 것도 OK)
 * - expensive(2만원+): expensive만 허용 (목적이 다름, 저렴한 곳은 제외)
 * 
 * @type {Object.<string, string[]>}
 */
export const BUDGET_COMPAT = {
  cheap: ["cheap"],
  normal: ["cheap", "normal"],
  expensive: ["expensive"],
};
