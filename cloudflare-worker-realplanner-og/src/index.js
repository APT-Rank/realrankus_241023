/**
 * 2026-11-22: 리얼플래너 공유 링크 동적 OG 메타태그 치환 Cloudflare Worker
 * - URL 쿼리(?share=1&r=서울시+강남구&c=...)를 읽어
 *   카카오톡/문자/SNS 크롤러에 "{지역명} 현장 답사 코스" og:title / twitter:title / <title>을 동적 응답
 * - 공유 파라미터가 없거나 HTML이 아닌 정적 리소스(JS/CSS/이미지)는 원본 그대로 통과
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const isShare = url.searchParams.get("share") === "1";
    const rawRegion = (url.searchParams.get("r") || "").trim();

    // 공유 링크이면서 지역 파라미터가 있는 HTML 요청만 동적 OG 치환 수행
    if (!isShare || !rawRegion) {
      return fetch(request);
    }

    const response = await fetch(request);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return response;
    }

    // XSS/제어문자 방지용 안전한 지역명 정제 (최대 40자)
    const safeRegion = rawRegion.replace(/[<>"'&\r\n\t]/g, "").slice(0, 40).trim();
    if (!safeRegion) {
      return response;
    }

    const rawCodes = (url.searchParams.get("c") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const stopCount = Math.min(30, rawCodes.length);

    const dynamicTitle = `${safeRegion} 현장 답사 코스`;
    const dynamicPageTitle = `${dynamicTitle} - 리얼랭커스`;
    const dynamicDesc = stopCount > 0
      ? `${safeRegion} 총 ${stopCount}개 단지 현장 답사 코스 | 도보/차량 이동 동선, 리얼랭커스`
      : `${safeRegion} 아파트 현장 답사 코스 | 도보/차량 이동 동선, 리얼랭커스`;
    const canonicalUrl = url.toString();

    return new HTMLRewriter()
      .on("title", {
        element(el) {
          el.setInnerContent(dynamicPageTitle);
        }
      })
      .on('meta[property="og:title"]', {
        element(el) {
          el.setAttribute("content", dynamicTitle);
        }
      })
      .on('meta[name="twitter:title"]', {
        element(el) {
          el.setAttribute("content", dynamicTitle);
        }
      })
      .on('meta[property="og:description"]', {
        element(el) {
          el.setAttribute("content", dynamicDesc);
        }
      })
      .on('meta[name="twitter:description"]', {
        element(el) {
          el.setAttribute("content", dynamicDesc);
        }
      })
      .on('meta[name="description"]', {
        element(el) {
          el.setAttribute("content", dynamicDesc);
        }
      })
      .on('meta[property="og:url"]', {
        element(el) {
          el.setAttribute("content", canonicalUrl);
        }
      })
      .on('meta[name="twitter:url"]', {
        element(el) {
          el.setAttribute("content", canonicalUrl);
        }
      })
      .transform(response);
  }
};
