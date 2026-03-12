#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
자동으로 식당 좌표 추가 스크립트
건물별 대표 좌표를 식당에 적용
"""

import re

# 건물/지역별 대표 좌표 (검색 우선순위 순서)
BUILDING_COORDS = [
    # KT 빌딩
    ("KT West 지하", {"lat": 37.5709, "lng": 126.9762}),
    ("KT East 지하", {"lat": 37.5703, "lng": 126.9835}),
    
    # 디타워
    ("디타워", {"lat": 37.5700, "lng": 126.9850}),
    ("D타워", {"lat": 37.5700, "lng": 126.9850}),
    
    # 르메이에르종로타운
    ("르메이에르종로타운", {"lat": 37.5710, "lng": 126.9820}),
    ("르메이에르 종로타운", {"lat": 37.5710, "lng": 126.9820}),
    
    # 도렴빌딩
    ("도렴빌딩", {"lat": 37.5703, "lng": 126.9775}),
    
    # 로얄빌딩
    ("로얄빌딩", {"lat": 37.5707, "lng": 126.9807}),
    
    # 더케이트윈타워
    ("케이트윈타워", {"lat": 37.5702, "lng": 126.9795}),
    
    # 그랑서울
    ("그랑서울", {"lat": 37.5720, "lng": 126.9780}),
    ("스타필드", {"lat": 37.5720, "lng": 126.9780}),
    
    # 두산위브파빌리온
    ("두산위브파빌리온", {"lat": 37.5715, "lng": 126.9780}),
    
    # SFC몰
    ("SFC몰", {"lat": 37.5708, "lng": 126.9815}),
    ("서울파이낸스센터", {"lat": 37.5708, "lng": 126.9815}),
    
    # 청진동
    ("청진동", {"lat": 37.5720, "lng": 126.9880}),
    
    # 센트로폴리스 (종각)
    ("센트로폴리스", {"lat": 37.5725, "lng": 126.9825}),
    
    # 세종대로/새문안로
    ("세종대로23", {"lat": 37.5710, "lng": 126.9800}),
    ("세종대로21", {"lat": 37.5710, "lng": 126.9800}),
    ("세종대로", {"lat": 37.5710, "lng": 126.9800}),
    ("새문안로", {"lat": 37.5710, "lng": 126.9800}),
    
    # 기타 특정 건물
    ("교보빌딩", {"lat": 37.5705, "lng": 126.9810}),
    ("일민미술관", {"lat": 37.5712, "lng": 126.9785}),
    ("신라스테이", {"lat": 37.5698, "lng": 126.9772}),
    ("세종문화회관", {"lat": 37.5722, "lng": 126.9765}),
    ("타워8빌딩", {"lat": 37.5718, "lng": 126.9830}),
    ("일우빌딩", {"lat": 37.5708, "lng": 126.9800}),
    ("신문로아파트", {"lat": 37.5710, "lng": 126.9795}),
    
    # 종로/종각 지역 (넓은 범위)
    ("종로5길", {"lat": 37.5725, "lng": 126.9825}),
    ("종로3가", {"lat": 37.5725, "lng": 126.9825}),
    ("종로2가", {"lat": 37.5725, "lng": 126.9825}),
    ("종로1가", {"lat": 37.5725, "lng": 126.9825}),
    ("종각", {"lat": 37.5725, "lng": 126.9825}),
    ("종로", {"lat": 37.5725, "lng": 126.9825}),
    
    # 무교동
    ("을지로1길", {"lat": 37.5685, "lng": 126.9790}),
    
    # 광화문 인근 (기본값)
    ("광화문 인근", {"lat": 37.5700, "lng": 126.9775}),
    ("광화문 중심", {"lat": 37.5700, "lng": 126.9775}),
]

def find_coords_for_walk(walk_text):
    """walk 필드에서 건물명을 찾아서 해당 좌표 반환 (첫 번째 매치)"""
    for building, coords in BUILDING_COORDS:
        if building in walk_text:
            return coords
    return None

def add_coordinates(content):
    """좌표가 없는 식당 객체에 좌표 추가"""
    lines = content.split('\n')
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # cuisine 라인을 찾고, 다음 라인이 coords가 아닌지 확인
        if 'cuisine:' in line and i + 1 < len(lines):
            next_line = lines[i + 1]
            # 이미 coords가 있으면 건너뛰기
            if 'coords:' in next_line:
                i += 1
                continue
            
            # walk 필드 찾기 (앞으로 최대 50줄 스캔)
            walk_text = None
            for j in range(i + 1, min(i + 50, len(lines))):
                if 'walk:' in lines[j]:
                    # walk: "..." 패턴에서 문자열 추출
                    match = re.search(r'walk:\s*"([^"]+)"', lines[j])
                    if match:
                        walk_text = match.group(1)
                        break
                # 다음 식당 객체를 만나면 중단
                if '  {' in lines[j] and 'name:' in lines[j+1] if j+1 < len(lines) else False:
                    break
            
            # 좌표 찾기
            if walk_text:
                coords = find_coords_for_walk(walk_text)
                if coords:
                    # cuisine 라인 다음에 coords 추가
                    indent = '    '
                    coords_line = f'{indent}coords: {{ lat: {coords["lat"]}, lng: {coords["lng"]} }},'
                    new_lines.append(coords_line)
        
        i += 1
    
    return '\n'.join(new_lines)

def main():
    input_file = r"c:\Users\KT\kt-lunch\src\App.js"
    
    # 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 좌표 추가
    new_content = add_coordinates(content)
    
    # 파일 쓰기
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ 좌표 추가 완료: {input_file}")
    
    # 통계
    original_coords = content.count("coords:")
    new_coords = new_content.count("coords:")
    print(f"📊 좌표 통계: {original_coords}개 → {new_coords}개 (+ {new_coords - original_coords}개 추가)")

if __name__ == "__main__":
    main()

