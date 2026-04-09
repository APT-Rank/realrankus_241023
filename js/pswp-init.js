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
            ? '<svg class="pswp__icn" viewBox="0 0 640 640"><path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z"/></svg>'
            : '<svg class="pswp__icn" viewBox="0 0 640 640"><path d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z"/></svg>',
            onClick: (event, el, pswp) => {
                if (isApp) {
                    executeCopy(pswp);
                } else {
                    //executeCopy(pswp);
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