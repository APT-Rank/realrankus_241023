import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp({
    databaseURL: 'https://aptrank-cc61b-default-rtdb.firebaseio.com',
  });
}

// 토스페이먼츠 시크릿 키 (환경변수 우선, 없으면 공식 테스트 시크릿 키)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50n3GigRogerM';
const EXPECTED_AMOUNT = 29900;

interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  dbKey: string; // RTDB 주문 키 (예: Aptrank_20261016...)
}

export const confirmReportPayment = onCall(
  {
    region: 'asia-northeast3',
    timeoutSeconds: 30,
    cors: true,
  },
  async (request) => {
    const data = request.data as ConfirmPaymentRequest;
    const { paymentKey, orderId, amount, dbKey } = data || {};

    // 1. 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount || !dbKey) {
      throw new HttpsError('invalid-argument', '결제 검증에 필요한 파라미터가 누락되었습니다.');
    }

    // 2. 금액 위변조 검증 (29,900원 일치 여부)
    if (Number(amount) !== EXPECTED_AMOUNT) {
      console.error(`[결제 위변조 의심] 요청 금액: ${amount}, 기대 금액: ${EXPECTED_AMOUNT}`);
      throw new HttpsError('failed-precondition', '결제 금액이 일치하지 않습니다.');
    }

    // 3. 토스페이먼츠 최종 승인 API (Server-to-Server) 호출
    const basicAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
    let tossResponse: any;

    try {
      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      tossResponse = await response.json();

      if (!response.ok) {
        console.error('토스 결제 승인 실패:', tossResponse);
        throw new Error(tossResponse.message || '결제 승인 처리 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error('토스 결제 API 호출 오류:', err);
      throw new HttpsError('internal', err.message || '결제 승인 통신 오류');
    }

    // 4. 승인 상태 확인 (DONE)
    if (tossResponse.status !== 'DONE') {
      console.error('토스 결제 상태 미완료:', tossResponse.status);
      throw new HttpsError('failed-precondition', `결제가 완료되지 않았습니다: ${tossResponse.status}`);
    }

    // 5. Firebase Realtime Database 결제 완료 업데이트
    try {
      const rtdb = admin.database();
      await rtdb.ref(dbKey).update({
        paid: true,
        progress: 'Paid',
        amount: EXPECTED_AMOUNT,
        paymentKey,
        orderId,
        paymentMethod: tossResponse.method || '간편결제/카드',
        paidAt: new Date().toISOString(),
        receiptUrl: tossResponse.receipt?.url || '',
      });
      console.log(`[결제 완료] dbKey: ${dbKey}, orderId: ${orderId}, amount: ${amount}`);
    } catch (dbErr: any) {
      console.error('RTDB 업데이트 오류:', dbErr);
      // 결제는 완료되었으므로 심각한 에러로 전파하기보다 로그를 남기고 성공 응답
    }

    return {
      success: true,
      orderId,
      paymentKey,
      amount: EXPECTED_AMOUNT,
      receiptUrl: tossResponse.receipt?.url || '',
    };
  }
);

