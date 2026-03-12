/**
 * 배열 및 객체 조작 유틸리티
 */

/**
 * Fisher-Yates 셔플 알고리즘
 * @template T
 * @param {T[]} array - 원본 배열
 * @returns {T[]} 섞인 배열 (새 배열 반환)
 */
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 배열 중복 제거 (특정 키 기준)
 * @template T
 * @param {T[]} array - 원본 배열
 * @param {string|function} key - 중복 체크 키 또는 함수
 * @returns {T[]} 중복 제거된 배열
 * 
 * @example
 * uniqueBy([{id:1, name:'A'}, {id:1, name:'B'}], 'id') // [{id:1, name:'A'}]
 * uniqueBy([{id:1}, {id:2}], item => item.id) // [{id:1}, {id:2}]
 */
export function uniqueBy(array, key) {
  const seen = new Set();
  const keyFn = typeof key === 'function' ? key : item => item[key];
  
  return array.filter(item => {
    const k = keyFn(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 배열을 그룹화
 * @template T
 * @param {T[]} array - 원본 배열
 * @param {string|function} key - 그룹화 키 또는 함수
 * @returns {Object.<string, T[]>} 그룹화된 객체
 * 
 * @example
 * groupBy([{type:'A', v:1}, {type:'B', v:2}, {type:'A', v:3}], 'type')
 * // { A: [{type:'A', v:1}, {type:'A', v:3}], B: [{type:'B', v:2}] }
 */
export function groupBy(array, key) {
  const keyFn = typeof key === 'function' ? key : item => item[key];
  
  return array.reduce((groups, item) => {
    const k = keyFn(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
    return groups;
  }, {});
}

/**
 * 배열에서 N개 무작위 선택
 * @template T
 * @param {T[]} array - 원본 배열
 * @param {number} count - 선택할 개수
 * @returns {T[]} 선택된 항목들
 */
export function sampleSize(array, count) {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * 배열을 청크로 분할
 * @template T
 * @param {T[]} array - 원본 배열
 * @param {number} size - 청크 크기
 * @returns {T[][]} 분할된 배열
 * 
 * @example
 * chunk([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
 */
export function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 배열 정렬 (안정 정렬)
 * @template T
 * @param {T[]} array - 원본 배열
 * @param {string|function} key - 정렬 키 또는 함수
 * @param {'asc'|'desc'} [order='asc'] - 정렬 순서
 * @returns {T[]} 정렬된 배열 (새 배열)
 */
export function sortBy(array, key, order = 'asc') {
  const keyFn = typeof key === 'function' ? key : item => item[key];
  const sorted = [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}
