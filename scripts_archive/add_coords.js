const fs = require('fs');

// 건물/지역별 대표 좌표 (검색 우선순위 순서)
const BUILDING_COORDS = [
    // KT 빌딩
    ["KT West 지하", { lat: 37.5709, lng: 126.9762 }],
    ["KT East 지하", { lat: 37.5703, lng: 126.9835 }],
    
    // 디타워
    ["디타워", { lat: 37.5700, lng: 126.9850 }],
    ["D타워", { lat: 37.5700, lng: 126.9850 }],
    
    // 르메이에르종로타운
    ["르메이에르종로타운", { lat: 37.5710, lng: 126.9820 }],
    ["르메이에르 종로타운", { lat: 37.5710, lng: 126.9820 }],
    
    // 도렴빌딩
    ["도렴빌딩", { lat: 37.5703, lng: 126.9775 }],
    
    // 로얄빌딩
    ["로얄빌딩", { lat: 37.5707, lng: 126.9807 }],
    
    // 더케이트윈타워
    ["케이트윈타워", { lat: 37.5702, lng: 126.9795 }],
    
    // 그랑서울
    ["그랑서울", { lat: 37.5720, lng: 126.9780 }],
    ["스타필드", { lat: 37.5720, lng: 126.9780 }],
    
    // 두산위브파빌리온
    ["두산위브파빌리온", { lat: 37.5715, lng: 126.9780 }],
    
    // SFC몰
    ["SFC몰", { lat: 37.5708, lng: 126.9815 }],
    ["서울파이낸스센터", { lat: 37.5708, lng: 126.9815 }],
    
    // 청진동
    ["청진동", { lat: 37.5720, lng: 126.9880 }],
    
    // 센트로폴리스 (종각)
    ["센트로폴리스", { lat: 37.5725, lng: 126.9825 }],
    
    // 세종대로/새문안로
    ["세종대로23", { lat: 37.5710, lng: 126.9800 }],
    ["세종대로21", { lat: 37.5710, lng: 126.9800 }],
    ["세종대로", { lat: 37.5710, lng: 126.9800 }],
    ["새문안로", { lat: 37.5710, lng: 126.9800 }],
    
    // 기타 특정 건물
    ["교보빌딩", { lat: 37.5705, lng: 126.9810 }],
    ["일민미술관", { lat: 37.5712, lng: 126.9785 }],
    ["신라스테이", { lat: 37.5698, lng: 126.9772 }],
    ["세종문화회관", { lat: 37.5722, lng: 126.9765 }],
    ["타워8빌딩", { lat: 37.5718, lng: 126.9830 }],
    ["일우빌딩", { lat: 37.5708, lng: 126.9800 }],
    ["신문로아파트", { lat: 37.5710, lng: 126.9795 }],
    
    // 종로/종각 지역 (넓은 범위)
    ["종로5길", { lat: 37.5725, lng: 126.9825 }],
    ["종로3가", { lat: 37.5725, lng: 126.9825 }],
    ["종로2가", { lat: 37.5725, lng: 126.9825 }],
    ["종로1가", { lat: 37.5725, lng: 126.9825 }],
    ["종각", { lat: 37.5725, lng: 126.9825 }],
    ["종로", { lat: 37.5725, lng: 126.9825 }],
    
    // 무교동
    ["을지로1길", { lat: 37.5685, lng: 126.9790 }],
    
    // 광화문 인근 (기본값)
    ["광화문 인근", { lat: 37.5700, lng: 126.9775 }],
    ["광화문 중심", { lat: 37.5700, lng: 126.9775 }],
];

function findCoordsForWalk(walkText) {
    for (const [building, coords] of BUILDING_COORDS) {
        if (walkText.includes(building)) {
            return coords;
        }
    }
    return null;
}

function addCoordinates(content) {
    const lines = content.split('\n');
    const newLines = [];
    let i = 0;
    let addedCount = 0;
    
    while (i < lines.length) {
        const line = lines[i];
        newLines.push(line);
        
        // cuisine 라인을 찾고, 다음 라인이 coords가 아닌지 확인
        if (line.includes('cuisine:') && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            // 이미 coords가 있으면 건너뛰기
            if (nextLine.includes('coords:')) {
                i++;
                continue;
            }
            
            // walk 필드 찾기 (앞으로 최대 50줄 스캔)
            let walkText = null;
            for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
                if (lines[j].includes('walk:')) {
                    // walk: "..." 패턴에서 문자열 추출
                    const match = lines[j].match(/walk:\s*"([^"]+)"/);
                    if (match) {
                        walkText = match[1];
                        break;
                    }
                }
                // 다음 식당 객체를 만나면 중단
                if (lines[j].includes('  {') && j+1 < lines.length && lines[j+1].includes('name:')) {
                    break;
                }
            }
            
            // 좌표 찾기
            if (walkText) {
                const coords = findCoordsForWalk(walkText);
                if (coords) {
                    // cuisine 라인 다음에 coords 추가
                    const indent = '    ';
                    const coordsLine = `${indent}coords: { lat: ${coords.lat}, lng: ${coords.lng} },`;
                    newLines.push(coordsLine);
                    addedCount++;
                }
            }
        }
        
        i++;
    }
    
    return { content: newLines.join('\n'), addedCount };
}

function main() {
    const inputFile = 'C:\\Users\\KT\\kt-lunch\\src\\App.js';
    
    console.log('📖 파일 읽는 중...');
    const content = fs.readFileSync(inputFile, 'utf-8');
    
    const originalCoords = (content.match(/coords:/g) || []).length;
    
    console.log('⚙️  좌표 추가 작업 중...');
    const { content: newContent, addedCount } = addCoordinates(content);
    
    const newCoords = (newContent.match(/coords:/g) || []).length;
    
    console.log('💾 파일 저장 중...');
    fs.writeFileSync(inputFile, newContent, 'utf-8');
    
    console.log('✅ 좌표 추가 완료!');
    console.log(`📊 좌표 통계: ${originalCoords}개 → ${newCoords}개 (+${addedCount}개 추가)`);
}

main();
