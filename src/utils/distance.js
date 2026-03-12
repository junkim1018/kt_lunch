/**
 * 거리 계산 유틸리티
 * Haversine formula를 사용한 두 좌표 간 거리 계산
 */

/**
 * 두 GPS 좌표 간 직선 거리 계산 (Haversine formula)
 * @param {number} lat1 - 시작점 위도
 * @param {number} lng1 - 시작점 경도
 * @param {number} lat2 - 도착점 위도
 * @param {number} lng2 - 도착점 경도
 * @returns {number} 거리 (미터)
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * 거리를 도보 시간으로 변환
 * @param {number} distanceInMeters - 직선 거리 (미터)
 * @param {number} [walkSpeed=80] - 도보 속도 (미터/분, 기본값: 80)
 * @param {number} [routeMultiplier=1.3] - 실제 경로 보정 계수 (기본값: 1.3)
 * @returns {number} 도보 시간 (분)
 */
export function getWalkTime(distanceInMeters, walkSpeed = 80, routeMultiplier = 1.3) {
  const actualDistance = distanceInMeters * routeMultiplier; // 실제 도보 경로는 직선거리보다 30% 더 김
  const minutes = Math.round(actualDistance / walkSpeed);
  return Math.max(1, minutes); // 최소 1분
}

/**
 * 거리를 사람이 읽기 편한 문자열로 변환
 * @param {number} distanceInMeters - 거리 (미터)
 * @returns {string} 포맷된 거리 문자열 (예: "530m", "1.2km")
 */
export function formatDistance(distanceInMeters) {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`;
}

/**
 * 도보 시간을 문자열로 변환
 * @param {number} minutes - 도보 시간 (분)
 * @returns {string} 포맷된 시간 문자열 (예: "도보 3분", "도보 12분")
 */
export function formatWalkTime(minutes) {
  return `도보 ${minutes}분`;
}
