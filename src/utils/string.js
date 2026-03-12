/**
 * 문자열 처리 유틸리티
 */

/**
 * 브랜드명 추출 (체인점 중복 제거용)
 * @param {string} name - 식당 이름
 * @returns {string} 추출된 브랜드명
 * 
 * @example
 * extractBrand("스타벅스 광화문점") // "스타벅스"
 * extractBrand("BBQ 치킨 종로점") // "BBQ"
 */
export function extractBrand(name) {
  // "광화문점", "종각점", "D타워점" 등 지점명 제거
  const brandName = name
    .replace(/\s*(광화문|종각|종로|디타워|D타워|SFC|KT|웨스트|이스트|본점|지점|직영점|1호점|2호점)\s*점?$/i, '')
    .trim();
  
  // 첫 단어만 추출 (ex: "아웃백 스테이크하우스" -> "아웃백")
  const firstWord = brandName.split(/\s+/)[0];
  
  return firstWord || name; // 추출 실패 시 원본 반환
}

/**
 * 가격 문자열에서 숫자 추출
 * @param {string} priceStr - 가격 문자열 (예: "12,000원", "15000원")
 * @returns {number} 추출된 숫자 (예: 12000, 15000)
 */
export function extractPrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.match(/[\d,]+/);
  if (!match) return 0;
  return parseInt(match[0].replace(/,/g, ''), 10);
}

/**
 * 가격 범위 문자열 파싱
 * @param {string} priceStr - 가격 범위 (예: "10,000~15,000원")
 * @returns {{min: number, max: number}} 최소/최대 가격
 */
export function parsePriceRange(priceStr) {
  if (!priceStr) return { min: 0, max: 0 };
  
  const prices = priceStr.match(/[\d,]+/g);
  if (!prices || prices.length === 0) return { min: 0, max: 0 };
  
  const min = parseInt(prices[0].replace(/,/g, ''), 10);
  const max = prices.length > 1 
    ? parseInt(prices[prices.length - 1].replace(/,/g, ''), 10)
    : min;
  
  return { min, max };
}

/**
 * 숫자를 통화 형식으로 변환
 * @param {number} num - 숫자
 * @returns {string} 포맷된 문자열 (예: "12,000원")
 */
export function formatCurrency(num) {
  return `${num.toLocaleString('ko-KR')}원`;
}

/**
 * 문자열 자르기 (말줄임표 추가)
 * @param {string} str - 원본 문자열
 * @param {number} maxLength - 최대 길이
 * @returns {string} 잘린 문자열
 */
export function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * 배열을 문장으로 변환
 * @param {string[]} items - 항목 배열
 * @param {string} [separator='·'] - 구분자
 * @returns {string} 결합된 문자열
 * 
 * @example
 * joinItems(['혼밥', '2-3명', '4-6명'], '·') // "혼밥·2-3명·4-6명"
 */
export function joinItems(items, separator = '·') {
  return items.filter(Boolean).join(separator);
}
