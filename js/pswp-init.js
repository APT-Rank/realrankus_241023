import PhotoSwipeLightbox from 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js';

// 1. 헬퍼 함수: 파일명 생성
const getAnalysisFileName = () => {
    const sido = document.getElementById("sido");
    const gungu = document.getElementById("gungu");
    const sidoName = sido ? sido.options[sido.selectedIndex].text : "Seoul";
    const regionName = gungu ? gungu.options[gungu.selectedIndex].text : "Region";
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    return `${sidoName}_${regionName}_RealRankus_${timestamp}.png`;
};

// 2. 헬퍼 함수: [Web용] 다운로드 실행
const executeDownload = async (pswp) => {
    const currSlide = pswp.currSlide;
    if (!currSlide || !currSlide.data.src) return;

    const imgUrl = currSlide.data.src;
    const fileName = getAnalysisFileName();

    try {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) {
        console.error('다운로드 실패:', err);
        //window.open(imgUrl, '_blank');
        openOuterLink(imgUrl);
    }
};

// 3. 헬퍼 함수: [App용] 공유하기 실행
const executeShare = async (pswp) => {
    const currSlide = pswp.currSlide;
    if (!currSlide || !currSlide.data.src) return;

    const imgUrl = currSlide.data.src;
    const fileName = getAnalysisFileName();

    const sido = $("#sido option:selected").text(); // 선택된 시도명 가져오기
    const gungu = $("#gungu option:selected").text(); // 선택된 지역명 가져오기
    const region_name = sido + " " + gungu; // 파일명에서 지역명 추출

    try {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: '리얼랭커스 GLI 기반 시장 진단',
                text: region_name + ' 고·저평가 아파트 분석 결과를 공유합니다.'
            });
        } else {
            await navigator.share({ url: imgUrl });
        }
    } catch (err) {
        console.error('공유 실패:', err);
        // 공유 실패 시 차선책으로 새 창 열기
        openOuterLink(imgUrl);
    }
};

// 헬퍼 함수: 클립보드에 이미지 복사
const executeCopy = async (pswp) => {
    const currSlide = pswp.currSlide;
    if (!currSlide || !currSlide.data.src) return;

    const imgUrl = currSlide.data.src;

    try {
        // 1. 이미지 데이터를 가져와 Blob으로 변환
        const response = await fetch(imgUrl);
        const blob = await response.blob();

        // 2. Clipboard API를 사용하여 이미지 복사
        // 이미지 타입은 보통 image/png 또는 image/jpeg여야 합니다.
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);

        //alert("이미지가 클립보드에 복사되었습니다.\n원하는 곳에 붙여넣기 하세요.");
        toastMessage("이미지가 클립보드에 복사되었습니다.\n원하는 곳에 붙여넣기 하세요.", 500)
    } catch (err) {
        console.error('복사 실패:', err);
        // 에러 시 차선책으로 이미지 새 창 열기
        window.open(imgUrl, '_blank');
    }
};

// 4. 메인 초기화 함수
window.initPhotoSwipe = function() {
    if (window.pswpLightbox) {
        window.pswpLightbox.destroy();
    }

    const lightbox = new PhotoSwipeLightbox({
        gallery: '.my-pswp-gallery-wrapper',
        children: 'a.pswp-trigger-link',
        pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js')
    });

    // 버튼 등록 로직
    lightbox.on('uiRegister', function() {
        // 환경에 따른 설정값 분기
        const isApp = (typeof connectionWebApp !== 'undefined' && connectionWebApp === "App");
        
        const config = {
            name: isApp ? 'pswp-share-button' : 'pswp-download-button',
            // 앱이면 공유 아이콘, 웹이면 다운로드 아이콘
        html: isApp 
            ? '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M22 6h-4.2c-.4-1.2-1.5-2-2.8-2s-2.4.8-2.8 2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7 0c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm7 18H8V8h2v3h12V8h2v16z" fill="#fff"/></svg>'
            : '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" fill="#fff"/></svg>',
            onClick: (event, el, pswp) => {
                if (isApp) {
                    executeCopy(pswp);
                } else {
                    executeDownload(pswp);
                }
            }
        };

        lightbox.pswp.ui.registerElement({
            name: config.name,
            order: 8,
            isButton: true,
            tagName: 'button',
            html: config.html,
            onInit: (el, pswp) => {
                el.onclick = (e) => config.onClick(e, el, pswp);
            }
        });
    });

    lightbox.init();
    window.pswpLightbox = lightbox;
};