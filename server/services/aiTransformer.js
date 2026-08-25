/**
 * WOOJUNG SELLER - AI 상품화 변환 엔진
 * 국내 이커머스(스마트스토어, 쿠팡 등) 상위 노출 및 전환율 극대화 템플릿 알고리즘
 */

function generateProductTransformation(product) {
  const originalName = product.original_name || '모자';
  const supplier = product.supplier || '도매처';
  const cost = Number(product.cost_price) || 0;
  const price = Number(product.selling_price) || 0;

  // 카테고리/키워드 특성 추출 (캠프캡, 볼캡, 모자, 잡화 등)
  const isCampCap = /캠프|camp|5패널|스트랩/i.test(originalName);
  const isBallCap = /볼캡|야구모자|ballcap|스냅백|대두|소두/i.test(originalName);
  const isNylonOrWaterproof = /나일론|방수|발수|우븐|고프코어|아웃도어|경량/i.test(originalName);
  const isCotton = /면|코튼|워싱|피그먼트/i.test(originalName);

  // 1. 한국어 최적화 상품명 생성 (네이버/쿠팡 상위노출 알고리즘 최적화 가이드라인 준수)
  let generatedTitle = '';
  if (isCampCap) {
    generatedTitle = isNylonOrWaterproof
      ? `[당일출고] 어반 방수 나일론 캠프캡 5패널 경량 스트랩 모자`
      : `[남녀공용] 클래식 코튼 캠프캡 5패널 딥핏 무지 스트릿 모자`;
  } else if (isBallCap) {
    generatedTitle = isNylonOrWaterproof
      ? `[소두핏] 퀵드라이 나일론 볼캡 롱바이저 생활방수 무지 야구모자`
      : `[얼굴소멸핏] 딥 워싱 코튼 볼캡 깊은 대두 무지 캡모자`;
  } else {
    // 일반 상품명 기반 지능형 정제
    const cleanedOriginal = originalName
      .replace(/[\/\\#,+()$~%.'":*?<>{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    generatedTitle = `[단독특가] 데일리 ${cleanedOriginal} 남녀공용 베이직 아이템`;
  }

  // 2. SEO 핵심 키워드 10개 생성
  let keywords = [];
  if (isCampCap) {
    keywords = [
      '캠프캡',
      '5패널캡',
      '나일론캠프캡',
      '남자캠프캡',
      '여자캠프캡',
      '고프코어모자',
      '생활방수모자',
      '아웃도어모자',
      '스트릿볼캡',
      '가벼운모자'
    ];
  } else if (isBallCap) {
    keywords = [
      '볼캡',
      '깊은볼캡',
      '소두핏볼캡',
      '대두볼캡',
      '무지볼캡',
      '남녀공용볼캡',
      '워싱볼캡',
      '롱바이저볼캡',
      '러닝모자',
      '데일리캡'
    ];
  } else {
    keywords = [
      originalName.slice(0, 10),
      '데일리추천',
      '가성비아이템',
      '남녀공용',
      '트렌드패션',
      '선물추천',
      '인기신상',
      '고급원단',
      '편안한착용감',
      '당일출고'
    ];
  }

  // 3. 상품 핵심 장점 3개 도출 (USP: Unique Selling Proposition)
  let keyBenefits = [];
  if (isCampCap) {
    keyBenefits = [
      {
        title: '얼굴형을 살려주는 완벽한 5패널 실루엣',
        description: '어떤 두상에도 들뜸 없이 밀착되는 인체공학적 5패널 입체 패턴으로 옆라인과 앞태가 자연스럽게 정돈됩니다.'
      },
      {
        title: '생활방수 & 깃털 같은 초경량 나일론 패브릭',
        description: '갑작스러운 비와 땀에도 끄떡없는 발수 코팅 원단으로, 야외 활동부터 일상 스트릿 룩까지 쾌적하게 착용 가능합니다.'
      },
      {
        title: '자유로운 사이즈 조절 이지-웨빙 스트랩',
        description: '원터치 버클과 견고한 웨빙 스트랩이 적용되어 두상 크기에 상관없이 1초 만에 최적의 핏을 맞출 수 있습니다.'
      }
    ];
  } else if (isBallCap) {
    keyBenefits = [
      {
        title: '광대와 턱선까지 감싸주는 깊이감 있는 딥(Deep) 핏',
        description: '일반 볼캡 대비 1.5cm 더 깊어진 크라운 설계로 착용 즉시 얼굴이 작아 보이는 소두핏을 연출합니다.'
      },
      {
        title: '자외선 완벽 차단 & 밸런스를 잡은 롱 챙(Visor)',
        description: '햇빛을 효과적으로 막아주며 흐트러짐 없는 단단한 바이저 쉐입으로 오랜 기간 착용해도 원형을 유지합니다.'
      },
      {
        title: '통기성 높은 프리미엄 코튼 / 쿨 드라이 원단',
        description: '피부에 닿는 스웻밴드에 흡습속건 밴딩을 적용하여 사계절 내내 끈적임 없는 쾌적한 피팅감을 선사합니다.'
      }
    ];
  } else {
    keyBenefits = [
      {
        title: '프리미엄 소재로 완성된 탁월한 내구성',
        description: '원가 절감형 저가 원단이 아닌, 변형 없이 오래 지속되는 고급 가공 마감을 적용했습니다.'
      },
      {
        title: '누구나 어울리는 실패 없는 스탠다드 핏',
        description: '수십 번의 샘플링을 거쳐 한국인 체형에 가장 이상적인 비율과 착용감을 구현했습니다.'
      },
      {
        title: '유행을 타지 않는 타임리스 미니멀 디자인',
        description: '출근룩, 원마일웨어, 여행룩 어디에나 자연스럽게 매치되는 올라운드 활용도를 자랑합니다.'
      }
    ];
  }

  // 4. 상세페이지 5단 구성안 (Structure Blueprint)
  const detailStructure = [
    {
      step: 1,
      name: '도입부 (후킹 & 문제 제기)',
      objective: '스크롤 3초 안에 "내 이야기다!"라고 느끼게 만드는 문제 상황 트리거 및 비포/애프터 제시',
      components: ['후킹 한 줄 카피', '두상 콤플렉스/기존 모자의 불편함 언급', '착용 비교 이미지 영역']
    },
    {
      step: 2,
      name: '공감대 형성 (Pain Point)',
      objective: '모자 유목민들이 겪는 흔한 고민 3가지(어정쩡한 깊이, 들뜨는 핏, 답답한 무게) 짚어주기',
      components: ['고민 체크리스트 3문 3답', '실제 착용 핏 비교']
    },
    {
      step: 3,
      name: '솔루션 & 3대 핵심 소구점 (USP)',
      objective: '이 상품이어야만 하는 이유 3가지를 클로즈업 사진 및 직관적 그래픽으로 증명',
      components: ['원단 방수/흡습 테스트 컷', '입체 패턴 디테일 뷰', '스트랩/부자재 퀄리티 컷']
    },
    {
      step: 4,
      name: '스타일링 가이드 & 실측 스펙',
      objective: '남녀 모델 착용 컷과 정확한 실측 치수로 구매 망설임/사이즈 문의 제거',
      components: ['모델 피팅 컷 (남/여)', '컬러 라인업 팔레트', '정밀 실측 사이즈표']
    },
    {
      step: 5,
      name: '안심 혜택 & 클로징 (CTA)',
      objective: '초도 물량 한정 혜택 안내 및 품질 불만족 시 100% 안심 교환/반품 보장 약속',
      components: ['당일 출고 안내 배너', '품질 보증 엠블럼', '최종 구매 버튼 유도']
    }
  ];

  // 5. 상세페이지 카피 초안 생성 (Copywriting Draft)
  const detailCopy = `
# 🧢 ${generatedTitle}

---

## ⚡ [Intro Hook] "모자만 쓰면 어색해 보였던 당신을 위한 인생 핏"
> **"왜 내가 모자를 쓰면 머리가 커 보이거나, 위로 붕 뜨는 걸까?"**

더 이상 모자 유목민으로 방황하지 마세요.
수백 명의 실제 착용 피드백을 기반으로 한국인 두상에 가장 완벽한 황금 비율을 찾아냈습니다.

---

## 🔍 [Pain Point Check] 이런 분들께 강력히 추천합니다!
- 📌 모자 깊이가 얕아 바람만 불면 벗겨질까 불안하셨던 분
- 📌 모자를 썼을 때 얼굴형이 부각되어 보였던 분
- 📌 무겁고 답답한 원단 때문에 땀 차고 답답하셨던 분
- 📌 어떤 옷에나 툭 걸쳐도 세련된 스타일을 완성하고 싶은 분

---

## 💡 [Core Solution] 차별화된 3가지 디테일 포인트

### 1️⃣ ${keyBenefits[0].title}
${keyBenefits[0].description}

### 2️⃣ ${keyBenefits[1].title}
${keyBenefits[1].description}

### 3️⃣ ${keyBenefits[2].title}
${keyBenefits[2].description}

---

## 📏 [Product Spec & Color]
- **소재**: 프리미엄 기능성 원단 (폴리/나일론/코튼 블렌드)
- **사이즈**: FREE (둘레 55~61cm 조절 가능 / 챙길이 7.2cm / 깊이 12.5cm)
- **색상 옵션**: 매트 블랙 / 미드나잇 차콜 / 올리브 카키 / 샌드 베이지
- **제조/공급처**: ${supplier} 협력사

---

## 🎁 [Special Benefit & Promise]
- 🚚 **평일 14시 이전 주문 시 당일 출고 원칙**
- 🛡️ **제품 수령 후 불만족 시 100% 안심 교환/반품 지원**
- 📦 **구겨짐 방지 캡 가드 전용 에어캡 안전 포장 발송**
`.trim();

  return {
    generated_title: generatedTitle,
    keywords: keywords,
    key_benefits: keyBenefits,
    detail_structure: detailStructure,
    detail_copy: detailCopy
  };
}

module.exports = { generateProductTransformation };
