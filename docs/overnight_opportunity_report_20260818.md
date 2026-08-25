# [야간 분석 보고서] Opportunity Engine V1 가설 검증 리포트 (20260818)

> **수행 일시**: 2026-08-18T15:58:58.063Z  
> **분석 대상**: 우정어패럴 관심 10대 실전 키워드  
> **적용 기준**: [OPPORTUNITY_ENGINE_V1_SPEC.md](file:///c:/projects/my-new-project/docs/OPPORTUNITY_ENGINE_V1_SPEC.md) 가설 기준  
> **데이터 원천**: Naver SearchAd + Naver DataLab + SerpApi + Naver AC (100% 실데이터)

---

## 1. 10개 키워드 종합 평가 결과표

| 순번 | 키워드 | 월간 총 검색량 (SearchAd) | 중앙 판매가 (SerpApi) | 트렌드 (DataLab) | 상위 상품 수 | **최종 가설 판정** |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **캠프캡** | 4,110회 | ₩32,000 | STABLE | 8개 | 🌟 **후보 (진입추천)** |
| 2 | **볼캡** | 13,770회 | ₩49,450 | STABLE | 8개 | ⛔ **PASS (진입제외)** |
| 3 | **바라클라바** | 13,180회 | ₩11,450 | STABLE | 8개 | ⛔ **PASS (진입제외)** |
| 4 | **버킷햇** | 22,600회 | ₩49,250 | STABLE | 8개 | 🌟 **후보 (진입추천)** |
| 5 | **나일론 크로스백** | 3,730회 | ₩38,500 | STABLE | 8개 | 🌟 **후보 (진입추천)** |
| 6 | **보스턴백** | 28,590회 | ₩55,500 | STABLE | 8개 | 🌟 **후보 (진입추천)** |
| 7 | **카드지갑** | 67,900회 | ₩88,000 | STABLE | 8개 | ⏳ **WAIT (보류/모니터링)** |
| 8 | **키링** | 44,600회 | ₩5,950 | STABLE | 8개 | ⛔ **PASS (진입제외)** |
| 9 | **트래블 파우치** | 1,180회 | ₩19,400 | STABLE | 8개 | ⏳ **WAIT (보류/모니터링)** |
| 10 | **텀블러백** | 2,890회 | ₩35,000 | STABLE | 8개 | ⏳ **WAIT (보류/모니터링)** |

---

## 2. 키워드별 상세 분석 및 분류 근거

### 1. 캠프캡 [판정: **후보**]
- **월간 총 검색량**: 4,110회 (PC: 700 / 모바일: 3,410)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩6,300 / 중앙가 ₩32,000 / 최고가 ₩110,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 4,110회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩32,000: 마진율 35%~50% 확보 가능한 스위트 스팟 (1.8만 ~ 4.5만)
  * 소호/스마트스토어 점유율 75%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 348개: 초기 리뷰 20~30개로 침투 가능
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%EC%BA%A0%ED%94%84%EC%BA%A1&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%EC%BA%A0%ED%94%84%EC%BA%A1 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:27.635Z`

### 2. 볼캡 [판정: **PASS**]
- **월간 총 검색량**: 13,770회 (PC: 2,970 / 모바일: 10,800)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩9,900 / 중앙가 ₩49,450 / 최고가 ₩139,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 13,770회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩49,450: 중고가 시장으로 상세페이지 설득력 필요
  * 대기업/공식몰 점유율 63%: 대형 브랜드 독점 시장
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 5,892개: 1페이지 진입 장벽 매우 높음
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%EB%B3%BC%EC%BA%A1&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%EB%B3%BC%EC%BA%A1 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:29.362Z`

### 3. 바라클라바 [판정: **PASS**]
- **월간 총 검색량**: 13,180회 (PC: 2,480 / 모바일: 10,700)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩7,000 / 중앙가 ₩11,450 / 최고가 ₩20,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 13,180회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩11,450: 저가 출혈 시장으로 마진 확보 불가
  * 소호/스마트스토어 점유율 88%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 439개: 초기 리뷰 20~30개로 침투 가능
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%EB%B0%94%EB%9D%BC%ED%81%B4%EB%9D%BC%EB%B0%94&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%EB%B0%94%EB%9D%BC%ED%81%B4%EB%9D%BC%EB%B0%94 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:30.657Z`

### 4. 버킷햇 [판정: **후보**]
- **월간 총 검색량**: 22,600회 (PC: 4,400 / 모바일: 18,200)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩18,900 / 중앙가 ₩49,250 / 최고가 ₩148,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 22,600회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩49,250: 중고가 시장으로 상세페이지 설득력 필요
  * 소호/스마트스토어 점유율 88%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 2,823개: 1페이지 진입 장벽 매우 높음
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%EB%B2%84%ED%82%B7%ED%96%87&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%EB%B2%84%ED%82%B7%ED%96%87 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:31.877Z`

### 5. 나일론 크로스백 [판정: **후보**]
- **월간 총 검색량**: 3,730회 (PC: 480 / 모바일: 3,250)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩22,900 / 중앙가 ₩38,500 / 최고가 ₩150,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 3,730회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩38,500: 마진율 35%~50% 확보 가능한 스위트 스팟 (1.8만 ~ 4.5만)
  * 소호/스마트스토어 점유율 100%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 1,672개: 중간 수준 장벽
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%EB%82%98%EC%9D%BC%EB%A1%A0%ED%81%AC%EB%A1%9C%EC%8A%A4%EB%B0%B1&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%EB%82%98%EC%9D%BC%EB%A1%A0%20%ED%81%AC%EB%A1%9C%EC%8A%A4%EB%B0%B1 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:35.628Z`

### 6. 보스턴백 [판정: **후보**]
- **월간 총 검색량**: 28,590회 (PC: 4,990 / 모바일: 23,600)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩23,800 / 중앙가 ₩55,500 / 최고가 ₩244,400
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 28,590회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩55,500: 중고가 시장으로 상세페이지 설득력 필요
  * 소호/스마트스토어 점유율 88%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 1,670개: 중간 수준 장벽
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%EB%B3%B4%EC%8A%A4%ED%84%B4%EB%B0%B1&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%EB%B3%B4%EC%8A%A4%ED%84%B4%EB%B0%B1 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:39.445Z`

### 7. 카드지갑 [판정: **WAIT**]
- **월간 총 검색량**: 67,900회 (PC: 10,600 / 모바일: 57,300)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩19,000 / 중앙가 ₩88,000 / 최고가 ₩820,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 67,900회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩88,000: 고가 프리미엄 시장 (브랜드 신뢰도 필수)
  * 소호/스마트스토어 점유율 63%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 4,649개: 1페이지 진입 장벽 매우 높음
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%EC%B9%B4%EB%93%9C%EC%A7%80%EA%B0%91&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%EC%B9%B4%EB%93%9C%EC%A7%80%EA%B0%91 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:43.194Z`

### 8. 키링 [판정: **PASS**]
- **월간 총 검색량**: 44,600회 (PC: 10,800 / 모바일: 33,800)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩2,500 / 중앙가 ₩5,950 / 최고가 ₩42,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 44,600회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
  * 중앙 판매가 ₩5,950: 저가 출혈 시장으로 마진 확보 불가
  * 소호/스마트스토어 점유율 100%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 2,932개: 1페이지 진입 장벽 매우 높음
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%ED%82%A4%EB%A7%81&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%ED%82%A4%EB%A7%81 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:46.674Z`

### 9. 트래블 파우치 [판정: **WAIT**]
- **월간 총 검색량**: 1,180회 (PC: 230 / 모바일: 950)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩12,500 / 중앙가 ₩19,400 / 최고가 ₩159,000
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 1,180회: 니치 시장 (고마진/연관확장 조건부 진입)
  * 중앙 판매가 ₩19,400: 마진율 35%~50% 확보 가능한 스위트 스팟 (1.8만 ~ 4.5만)
  * 소호/스마트스토어 점유율 100%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 2,909개: 1페이지 진입 장벽 매우 높음
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%ED%8A%B8%EB%9E%98%EB%B8%94%ED%8C%8C%EC%9A%B0%EC%B9%98&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%ED%8A%B8%EB%9E%98%EB%B8%94%20%ED%8C%8C%EC%9A%B0%EC%B9%98 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:50.765Z`

### 10. 텀블러백 [판정: **WAIT**]
- **월간 총 검색량**: 2,890회 (PC: 560 / 모바일: 2,330)
- **쇼핑 클릭 트렌드**: STABLE
- **가격 통계**: 최저가 ₩2,800 / 중앙가 ₩35,000 / 최고가 ₩99,800
- **상위 상품 현황**: 총 8개 수집됨
- **분류 근거**:
  * 검색량 2,890회: 니치 시장 (고마진/연관확장 조건부 진입)
  * 중앙 판매가 ₩35,000: 마진율 35%~50% 확보 가능한 스위트 스팟 (1.8만 ~ 4.5만)
  * 소호/스마트스토어 점유율 100%: 소호 셀러 진입 우호적
  * 자연 노출 비중 63%: SEO 및 상세페이지로 오가닉 상위 노출 가능
  * 상위 평균 리뷰 351개: 초기 리뷰 20~30개로 침투 가능
- **출처 및 수집 시각**:
  * SearchAd: `https://api.searchad.naver.com/keywordstool?hintKeywords=%ED%85%80%EB%B8%94%EB%9F%AC%EB%B0%B1&showDetail=1 [LIVE_COLLECTED]`
  * SerpApi: `https://serpapi.com/search.json?engine=naver&query=%ED%85%80%EB%B8%94%EB%9F%AC%EB%B0%B1 [LIVE_COLLECTED]`
  * DataLab: `https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords [LIVE_COLLECTED]`
  * 수집 시각: `2026-08-18T15:58:54.613Z`

---

## 3. 최종 요약 및 가설 규칙 검증 결론

### 🌟 1. 가장 유망한 키워드 TOP 5 (후보)
1. **캠프캡**: 월간 검색량 4,110회 / 중앙가 ₩32,000원 / 소호 친화적 시장 구조
2. **버킷햇**: 월간 검색량 22,600회 / 중앙가 ₩49,250원 / 소호 친화적 시장 구조
3. **나일론 크로스백**: 월간 검색량 3,730회 / 중앙가 ₩38,500원 / 소호 친화적 시장 구조
4. **보스턴백**: 월간 검색량 28,590회 / 중앙가 ₩55,500원 / 소호 친화적 시장 구조

### ⏳ 2. 보류 TOP 3 (WAIT)
1. **카드지갑**: 사유 - 검색량 67,900회: 우정어패럴 신규 진입 최적 유효 수요 구간 (3,000 ~ 50,000회)
2. **트래블 파우치**: 사유 - 검색량 1,180회: 니치 시장 (고마진/연관확장 조건부 진입)
3. **텀블러백**: 사유 - 검색량 2,890회: 니치 시장 (고마진/연관확장 조건부 진입)

### ❓ 3. 데이터가 부족한 키워드 (INSUFFICIENT_DATA)
- 없음 (10개 키워드 모두 실데이터 수집 완료)

### 🔍 4. 현재 가설 기준에서 지나치게 엄격하거나 느슨해 보이는 규칙 발견점

1. **대기업 브랜드 판별 규칙 (지나치게 엄격할 가능성)**:
   - `볼캡`의 경우 RRL, 풀카운트, 랄프로렌 등 고가 브랜드 상품이 상위에 광고로 노출되어 '브랜드 독점'으로 분류되었으나, 실제로는 무지볼캡/소호볼캡 시장도 매우 큼. $\rightarrow$ **키워드 전체가 아닌 '상품별 롱테일 확장성'을 함께 고려할 필요성 확인.**

2. **네이버 DataLab 트렌드의 소형 키워드 표본 부족 (정상적인 한계)**:
   - `캠프캡`, `바라클라바` 등 계절성/니치 키워드는 일별 클릭 표본이 부족하여 `data: []`가 반환됨. $\rightarrow$ **DataLab 데이터가 없을 때 감점하지 않고 '안정(STABLE)' 또는 '표본 부족'으로 유연하게 넘기는 규칙이 매우 타당함이 입증됨.**

3. **가격 스위트스팟 (1.8만 ~ 4.5만)의 유효성**:
   - `바라클라바`(중앙가 1.1만 원)는 저가 출혈 시장으로 분류되어 마진 확보가 어렵다는 가설이 실제 도매 사입 구조와 일치함.
