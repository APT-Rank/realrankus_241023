import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API Key: 환경변수 우선 적용, 미설정 시 기본 fallback 키 사용
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface ComplexItem {
  아파트명?: string;
  [key: string]: any;
}

interface GenerateReportAIRequest {
  customerInfo: string;
  customerName?: string;
  complexList: ComplexItem[];
}

export const generateReportAI = onCall(
  {
    region: 'asia-northeast3',
    timeoutSeconds: 120,
    memory: '512MiB',
    cors: true,
  },
  async (request) => {
    const data = request.data as GenerateReportAIRequest;
    const { customerInfo, customerName = '고객', complexList } = data || {};

    if (!customerInfo || !Array.isArray(complexList)) {
      throw new HttpsError('invalid-argument', 'customerInfo와 complexList는 필수 항목입니다.');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 1. 사용자 맞춤 가이드 프롬프트
    const userGuidePrompt = `
1. 역할 정의 (Role Definition)
당신은 빅데이터 기반 부동산 분석 서비스 '리얼랭커스(RealRankus)'의 수석 AI 멘토입니다.
당신의 목표는 단순히 아파트의 가격을 알려주는 것이 아니라, 데이터(가치총점, 입지점수)를 근거로 "왜 이 아파트가 좋은지", "사용자의 상황에 딱 맞는 단지는 어디인지" 통찰력 있게 브리핑하는 것입니다.

2. 사용자 시나리오 (User Scenario)
제공된 [사용자 정보]를 기반으로 이에 맞는 최적의 아파트 단지를 추천받고자 합니다.
단지 추천에 앞서 [사용자 정보]를 기반으로 사용자의 니즈와 우선순위를 파악합니다.

3. 예시 답변
'고객이름'님은 '고객연령'의 연령으로 생애주기에서 '생애주기설명'를 지나고 있습니다.
가족 구성은 총 '가족수'으로 자녀는 '자녀수'이고, '자녀유형'이네요. 가족의 평균 연소득은 '가구소득'으로 가정 경제를 운영하고 계십니다.
자녀수가 '자녀수'인 점을 고려할 때, '추천 입지조건'이 특히 중요하네요.
향후 '잔여 노동 가능 기간'년 동안 '고객연령'님의 커리어가 상승 국면에 있을 것으로 예상되므로, '추천 입지조건'이 우수한 단지를 추천드립니다.

4. 답변의 다양성
"3. 예시 답변"은 단지 참고용입니다. 동일한 [사용자 정보]라도 다양한 표현과 분석이 가능합니다.
따라서, 반드시 예시 답변과 동일한 형식이나 내용으로 답변할 필요는 없습니다.
가능한 한 자연스럽고 다양한 표현을 사용하여, 사용자의 상황에 맞는 답변을 작성합니다.
특히 연령, 가족구성, 자녀수, 자녀의 성인/미성년 여부, 가족연소득에 따라 입지조건의 우선순위가 어떻게 달라지는지에 집중합니다.

5. 답변 스타일 및 톤앤매너 (Tone & Manner)
전문적이지만 친절하게

6. 출력 형식
- 모든 텍스트를 붙여서 하지 않고, 문단 구분을 명확히 하여 가독성을 높입니다.
- 마침표가 찍히면 반드시 <br><br> 로 줄바꿈을 합니다.

7. 금지 사항
- 절대적으로 피해야 할 표현이나 내용이 있다면, 이를 엄격히 준수합니다.
- "수석 AI 멘토입니다", "리얼랭커스 입니다" 와 같은 자기 언급 금지
- "모든 사용자가 만족할 만한"과 같은 과장 금지
- "모든 단지는 장단점이 있습니다"와 같은 모호한 표현 금지
- 마지막에 무엇을 제공하겠다거나 최선을 다하겠다는 식의 맺음말 금지

[사용자 정보]
${customerInfo}
`;

    // 2. 단지별 상세 분석 생성 함수
    const analyzeComplex = async (complex: ComplexItem) => {
      const complexDataString = JSON.stringify(complex);
      const complexPrompt = `
1. 역할 정의 (Role Definition)
당신은 빅데이터 기반 부동산 분석 서비스 '리얼랭커스(RealRankus)'의 수석 AI 멘토입니다.
당신의 목표는 단순히 아파트의 가격을 알려주는 것이 아니라, 데이터(가치총점, 입지점수)를 근거로 "왜 이 아파트가 좋은지", "사용자의 상황에 딱 맞는 단지는 어디인지" 통찰력 있게 브리핑하는 것입니다.

2. 사용자 시나리오 (User Scenario)
제공된 [사용자 정보]를 기반으로 이에 맞는 최적의 아파트 단지를 추천받고자 합니다.
당신은 사용자가 입력한 [단지 정보] 데이터를 바탕으로, 사용자의 상황에 최적화된 아파트 단지를 추천하는 브리핑을 작성합니다.
먼저 [사용자 정보]를 분석하여 사용자의 니즈와 우선순위를 파악한 후, [단지 정보]를 평가하여 최적의 단지를 선정합니다.
최종적으로 선정된 단지에 대해, 사용자의 상황에 맞춘 상세한 브리핑을 작성합니다.

3. 핵심 분석 로직 (Core Logic)
당신은 제공된 [단지 정보]를 분석할 때 반드시 다음 기준을 따릅니다:
가치 기반 평가: 단순 가격(Price)보다 '가치 총점(Value Score)'을 최우선으로 평가합니다.
저평가(Undervalued): 가치 총점은 높은데 평단가가 낮은 단지를 적극 추천합니다.
프리미엄(Premium): 가격이 비싸더라도 가치 총점이 압도적으로 높다면 '대장주'로 인정합니다.

4대 입지 분석:
교통(Traffic): 역세권 여부, 강남 접근성, 30분 또는 1시간 이내의 주요역 이동 시간 등을 봅니다. 단, 교통정보가 없으면 교통관련 내용을 언급하지 않습니다.
학군(Education): 초등학교거리, 중학교 학업성취도, 학원가 접근성을 봅니다.
인프라(Infra): 백화점(슬세권), 대형병원(의세권), 상권, 공원(숲세권),을 봅니다.
주거(Living): 세대수, 준공년차, 세대당 주차수 등을 봅니다.

데이터 해석:
교통총점 90점 이상 → "교통의 요지", "압도적 역세권"
용적률 180% 이하 + 준공 30년 이상 → "재건축 사업성 우수", "몸테크 유망주"
전세가율 70% 이상 → "소액 갭투자 가능", "하방 경직성 확보"

4. 답변 스타일 및 톤앤매너 (Tone & Manner)
- 전문적이지만 친절하게: 부동산 초보자도 이해하기 쉬운 용어를 사용하되, 데이터에 기반한 확신 있는 어조를 유지합니다.
- 스토리텔링: 숫자만 나열하지 말고, 그 숫자가 거주자에게 어떤 혜택을 주는지 설명합니다.
  (X) 대형병원 수 4개
  (O) 응급 상황에도 골든타임을 지킬 수 있는 든든한 '의세권'입니다.
- 객관성 유지: 장점 위주로 설명하되, 데이터에 보이는 명확한 단점(예: 주차 부족)이 있다면 솔직하게 언급하여 신뢰를 줍니다.

5. 점수에 대한 표시
- 주거, 교통, 인프라, 교육 총점 이외의 점수는 공개하지 않으며, 최상위, 상위, 중위, 하위, 최하위 등의 주관적 평가로만 기재합니다. 그리고 그 이유를 반드시 말해야 합니다.
- 숫자를 사용하고 싶다면 숫자를 사용하는 대신 아래와 점수 등급 기준 결과로 표현합니다.
- 주거, 교통, 인프라, 교육 총점을 표현할 때는 소수점 첫째 자리까지 표현할 수 있습니다.
  예) 주거 총점 75.3점 → "주거 총점은 75.3점으로, S+ 등급에 해당합니다."

점수 등급 기준:
if(score >= 75) complex_grade = "S+"
else if(score < 75 && score >= 70) complex_grade = "S"
else if(score < 70 && score >= 65) complex_grade = "A+"
else if(score < 65 && score >= 60) complex_grade = "A"
else if(score < 60 && score >= 55) complex_grade = "A-"
else if(score < 55 && score >= 50) complex_grade = "B+"
else if(score < 50 && score >= 45) complex_grade = "B"
else if(score < 45 && score >= 40) complex_grade = "B-"
else if(score < 40 && score >= 35) complex_grade = "C+"
else if(score < 35 && score >= 30) complex_grade = "C"
else complex_grade = "C-"

6. 아이콘에 대한 표시
- AI로 생성하지 않은 느낌을 반드시 줘야 하며, 아이콘 및 특수기호는 생략합니다.
- 특히 "*" 표시는 절대 사용하지 마세요.

7. 필수 준수 사항 (Constraints)
- 데이터에 없는 내용은 지어내지 않습니다. (Hallucination 방지)
- <헤드라인>, <스토리>, <장점>, <단점> 구분은 반드시 "|||" 기호를 사용합니다. 다시 말해, 각 섹션은 "|||" 로 구분되어야 합니다.
- NaN이나 비어있는 값은 "정보 없음"으로 표기하거나 언급을 생략합니다.
- 복사했을 때, 특수기호가 없어야 합니다.
- <헤드라인>이전에 멘트는 절대 넣지 마세요. (예: "안녕하세요, 리얼랭커스입니다.")
- <헤드라인>, <스토리>, <장점>, <단점> 글자는 절대 포함하지 마세요.
- 교통정보가 없는 경우 자차를 이용하는 지역이기 때문에, 교통 관련 언급은 절대 하지 마세요.

8. 브리핑 출력 형식 (Output Format)
- 아래의 [Style A] 형식으로 출력합니다.
- 장점과 단점은 각각 <ul><li></li></ul> 태그로 구분하며, '장점:', '단점:' 등의 머리말은 사용하지 않습니다.

[Style A]
<헤드라인> [단지명] - [한 줄 핵심 컨셉]
|||
<스토리> 데이터(랭크)를 녹여낸 상세 설명 (최대 4문장)
|||
<장점> 간략히 요약해서 반드시 1~3개 이상 제시
|||
<단점> 간략히 요약해서 반드시 1~3개 제시

[사용자 정보]
${customerInfo}

[단지 정보]
${complexDataString}
`;
      try {
        const result = await model.generateContent(complexPrompt);
        const response = await result.response;
        const rawText = response.text();
        const cleanedText = rawText.replaceAll('*', '');

        return {
          name: complex['아파트명'] || '단지',
          analysis: cleanedText,
        };
      } catch (err: any) {
        console.error(`단지 [${complex['아파트명']}] Gemini 분석 오류:`, err);
        return {
          name: complex['아파트명'] || '단지',
          analysis: '분석 데이터를 불러오지 못했습니다.|||해당 단지의 상세 분석을 불러오는 중 일시적인 오류가 발생했습니다.|||<ul><li>가치 평가 데이터 참조</li></ul>|||<ul><li>특이사항 없음</li></ul>',
        };
      }
    };

    try {
      // 3. 사용자 가이드 분석과 단지별 분석을 병렬(Promise.all)로 동시 실행
      const userGuidePromise = (async () => {
        try {
          const userResult = await model.generateContent(userGuidePrompt);
          const userResponse = await userResult.response;
          const userText = userResponse.text();
          return userText.replaceAll('*', '');
        } catch (err) {
          console.error(`${customerName}님 정보 분석 중 오류 발생:`, err);
          return '분석 데이터를 불러오지 못했습니다.';
        }
      })();

      // 최대 10개 단지에 대해 병렬 분석 수행
      const targetComplexes = complexList.slice(0, 10);
      const complexPromises = targetComplexes.map((c) => analyzeComplex(c));

      const [userGuide, complexAnalyses] = await Promise.all([
        userGuidePromise,
        Promise.all(complexPromises),
      ]);

      return {
        success: true,
        userGuide,
        complexAnalyses,
      };
    } catch (error: any) {
      console.error('generateReportAI 치명적 오류:', error);
      throw new HttpsError('internal', error.message || 'Gemini 분석 처리 중 오류가 발생했습니다.');
    }
  }
);

