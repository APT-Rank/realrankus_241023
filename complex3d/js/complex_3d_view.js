/**
 * ==========================================================================
 * RealRankers 3D Complex View & Solar Simulation Engine (Complex3dView)
 * [Makoto Shinkai Anime Aesthetic Edition - 톤앤매너 마스터피스 파인튜닝]
 * 
 * 1. 배경: 신카이 마코토(Makoto Shinkai) 감독 시그니처 여름 청량 하늘 & 웅장한 적란운 돔
 * 2. 지반: 애니메이션풍 웜 아스팔트/민트 조경 프로시저럴 텍스처 + 네이버 지도 소프트라이트 블렌딩
 * 3. 단지: 극장판 애니메이션 셀 작화풍 윤곽선(Cel Outline) & 파스텔 시세 밴드 (민트/아주르/코랄)
 * 4. 원경: 공기원근법(Atmospheric Perspective)을 적용한 파스텔 미스트 슬레이트 주변 건물
 * 5. 조명: 5400K 골든 햇살 + 푸른 하늘 반사광(Hemisphere Fill) + 지평선 소프트 포그
 * ==========================================================================
 */

var complex3d_instance = null;

function renderComplex3dView(containerId, data3d, aptRankInfo) {
  var container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container || !data3d) return;

  if (complex3d_instance && typeof complex3d_instance.destroy === 'function') {
    complex3d_instance.destroy();
  }

  container.innerHTML = "";

  var centerRaw = data3d.center || [127.0, 37.5];
  var center = { lat: 37.5, lng: 127.0 };
  if (Array.isArray(centerRaw) && centerRaw.length >= 2) {
    var a = Number(centerRaw[0]), b = Number(centerRaw[1]);
    // 한국 좌표 특성: 경도(lng)는 항상 100 초과 (~124-132), 위도(lat)는 100 미만 (~33-39)
    if (a > 100) {
      center.lng = a;
      center.lat = b;
    } else {
      center.lat = a;
      center.lng = b;
    }
  } else if (centerRaw && typeof centerRaw === 'object') {
    center.lat = Number(centerRaw.lat !== undefined ? centerRaw.lat : (centerRaw.y || 37.5));
    center.lng = Number(centerRaw.lng !== undefined ? centerRaw.lng : (centerRaw.x || 127.0));
  }
  if (!isFinite(center.lat)) center.lat = 37.5;
  if (!isFinite(center.lng)) center.lng = 127.0;

  var latMeters = 111000;
  var lngMeters = 111320 * Math.cos(center.lat * Math.PI / 180);

  function toLocalXY(lng, lat) {
    return {
      x: (lng - center.lng) * lngMeters,
      y: (lat - center.lat) * latMeters
    };
  }

  // --- 1. Three.js Scene, Camera, Renderer ---
  var scene = new THREE.Scene();
  window.debugScene = scene;

  var width = container.clientWidth || window.innerWidth;
  var height = container.clientHeight || window.innerHeight;

  var camera = new THREE.PerspectiveCamera(40, width / height, 2, 12000);
  window.debugCamera = camera;

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08; // 신카이 특유의 눈부신 애니메이션 발광감
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);
  container.style.touchAction = 'none';
  renderer.domElement.style.touchAction = 'none';

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  window.debugControls = controls;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 45;       // 최소 줌인 한계: 건물 벽체 뚫림 방지
  controls.maxDistance = 1050;     // 최대 줌아웃 한계: [대책 4] 1km 생활권 반경원(1000m)을 정밀하게 조망하면서 바닥판 외곽선 노출 방지
  controls.minPolarAngle = 0.05;   // 수직 짐벌락 방지 (~2.8도)
  controls.maxPolarAngle = 1.455;  // 초기 동적 틸트 기본값 (~83.4도)

  // =========================================================================
  // ★ [방안 2 & 대책 4] 카메라 거리 연동 동적 틸트 앵글 & 줌 락 시스템 (Dynamic Angle & Zoom Clamp) ★
  // - 근거리(50m~180m): 단지 안에서 고층 빌딩과 하늘/태양을 올려다볼 수 있도록 최대 83.4°까지 시원하게 개방
  // - 원거리(800m~980m): 멀어질수록 최대 틸트각을 56.4°(조감도 각도)로 부드럽게 유도하여 바닥 끝선/한계점 노출 원천 차단
  // =========================================================================
  function getDynamicMaxPolarAngle(dist) {
    var nearDist = 180;   // 근거리 임계치 (m)
    var farDist = 980;    // [대책 4] 원거리 임계치 (m): 최대 줌아웃(1050m) 도달 전 980m부터 조감도 앵글(56.4°) 완벽 고정
    var maxAngle = 1.455; // 근거리 최대 틸트: ~83.4° (Math.PI / 2 - 0.116)
    var minAngle = 0.985; // 원거리 최대 틸트: ~56.4° (조감도 앵글)

    if (dist <= nearDist) return maxAngle;
    if (dist >= farDist) return minAngle;

    var t = (dist - nearDist) / (farDist - nearDist);
    // Smoothstep Hermite 보간으로 부드러운 가변 전환 (3t^2 - 2t^3)
    var s = t * t * (3 - 2 * t);
    return maxAngle - s * (maxAngle - minAngle);
  }

  function updateDynamicCameraClamp() {
    if (!controls || !controls.enabled || isPOVMode) return;
    var dist = camera.position.distanceTo(controls.target);
    controls.maxPolarAngle = getDynamicMaxPolarAngle(dist);
  }

  controls.addEventListener('change', updateDynamicCameraClamp);

  // --- 2. 신카이 마코토(Makoto Shinkai) 스타일 애니메이션 하늘 돔 ---
  var skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2048;
  skyCanvas.height = 1024;
  window.debugSkyCanvas = skyCanvas;
  var skyCtx = skyCanvas.getContext('2d');
  var skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.encoding = THREE.sRGBEncoding;

  // 1km 생활권의 건물과 이름표는 안개 없이 보이고, 지반 경계 이후부터 안개가 완만하게 적용되도록 설정
  var horizonFogColor = new THREE.Color(0xd6e8f6);
  scene.fog = new THREE.Fog(0xd6e8f6, 1000, 2600);
  var daySkyTexture = null;
  var twilightOverlay;
  var nightStarField = [];
  for (var nightStarIndex = 0; nightStarIndex < 360; nightStarIndex++) {
    var starColorVariation = Math.random();
    nightStarField.push({
      x: Math.random(),
      y: Math.random() * 0.72,
      radius: 0.5 + Math.random() * 0.5,
      alpha: 0.72 + Math.random() * 0.28,
      color: starColorVariation > 0.88 ? '255, 240, 218' : (starColorVariation < 0.2 ? '210, 232, 255' : '248, 251, 255'),
      sparkle: Math.random() < 0.03,
      sparkleLength: 2.4 + Math.random() * 1.2
    });
  }

  function renderShinkaiSky(hour) {
    var w = skyCanvas.width, h = skyCanvas.height;
    var isTwilight = (hour >= 16.75 && hour <= 18.5) || (hour >= 6.5 && hour <= 7.5);
    var isNightSky = typeof isNightMode === 'boolean' ? isNightMode : (hour < 6.5 || hour >= 18.5);

    if (isNightSky) {
      if (twilightOverlay) twilightOverlay.visible = false;
      var nightGrad = skyCtx.createLinearGradient(0, 0, 0, h);
      nightGrad.addColorStop(0.0, '#030817');
      nightGrad.addColorStop(0.38, '#0b1730');
      nightGrad.addColorStop(0.72, '#172747');
      nightGrad.addColorStop(1.0, '#263653');
      skyCtx.fillStyle = nightGrad;
      skyCtx.fillRect(0, 0, w, h);

      for (var starIndex = 0; starIndex < nightStarField.length; starIndex++) {
        var star = nightStarField[starIndex];
        var starX = Math.round(star.x * w);
        var starY = Math.round(star.y * h);
        skyCtx.fillStyle = 'rgba(' + star.color + ', ' + star.alpha.toFixed(2) + ')';

        if (star.sparkle) {
          var sparkleLength = star.sparkleLength;
          var sparkleWidth = 0.45;
          skyCtx.beginPath();
          skyCtx.moveTo(starX, starY - sparkleLength);
          skyCtx.lineTo(starX + sparkleWidth, starY - sparkleWidth);
          skyCtx.lineTo(starX + sparkleLength, starY);
          skyCtx.lineTo(starX + sparkleWidth, starY + sparkleWidth);
          skyCtx.lineTo(starX, starY + sparkleLength);
          skyCtx.lineTo(starX - sparkleWidth, starY + sparkleWidth);
          skyCtx.lineTo(starX - sparkleLength, starY);
          skyCtx.lineTo(starX - sparkleWidth, starY - sparkleWidth);
          skyCtx.closePath();
          skyCtx.fill();
        } else {
          skyCtx.beginPath();
          skyCtx.arc(starX, starY, star.radius, 0, Math.PI * 2);
          skyCtx.fill();
        }
      }

      skyTexture.needsUpdate = true;
      scene.fog.color.setHex(0x172747);
      scene.background = new THREE.Color(0x030817);
      if (skyDome && skyMat) {
        skyMat.map = skyTexture;
        skyMat.needsUpdate = true;
        skyDome.visible = true;
      }
      return;
    }

    // 1. 대기 그라데이션 (신카이 마코토 특유의 깊고 채도 높은 서머 블루)
    var skyGrad = skyCtx.createLinearGradient(0, 0, 0, h);
    if (isTwilight) {
      // 황혼 노을 (카타와레도키)
      skyGrad.addColorStop(0.0, '#161942');
      skyGrad.addColorStop(0.24, '#2f2c69');
      skyGrad.addColorStop(0.48, '#693f77');
      skyGrad.addColorStop(0.68, '#bf5567');
      skyGrad.addColorStop(0.84, '#f88c52');
      skyGrad.addColorStop(0.96, '#fed384');
      skyGrad.addColorStop(1.0, '#ffe8ba');
      scene.fog.color.setHex(0xf88c52);
    } else {
      // 눈부시게 푸르고 선명한 코발트 사파이어 -> 여름 아주르 블루
      skyGrad.addColorStop(0.0, '#063d75');  // 깊은 사파이어 블루
      skyGrad.addColorStop(0.25, '#126bb8'); // 선명한 코발트
      skyGrad.addColorStop(0.50, '#2998e8'); // 아주르 블루
      skyGrad.addColorStop(0.70, '#56bdfa'); // 청량한 터콰이즈
      skyGrad.addColorStop(0.88, '#9fe1fd'); // 밝은 대기 헤이즈
      skyGrad.addColorStop(1.0, '#dff3fe');  // 지평선 수채화 블룸
      scene.fog.color.setHex(0xd6e8f6);
    }
    skyCtx.fillStyle = skyGrad;
    skyCtx.fillRect(0, 0, w, h);

    // 2. 신카이 마코토 시그니처: 지평선 위로 우뚝 솟은 조형적인 적란운(뭉게구름 타워)
    // 수채화/디지털 매트페인팅 기법의 다중 볼륨 셰이딩 (라벤더 섀도우 -> 파스텔 스카이 -> 순백 림)
    function drawShinkaiCloudTower(cx, cy, scale) {
      skyCtx.save();

      var puffs = [
        // 기단부 (좌우 베이스)
        { dx: -110, dy: 65, r: 90 },
        { dx: 110, dy: 70, r: 85 },
        { dx: -55, dy: 45, r: 105 },
        { dx: 55, dy: 50, r: 100 },
        // 중앙 볼륨
        { dx: -40, dy: -15, r: 115 },
        { dx: 40, dy: -10, r: 120 },
        { dx: 0, dy: -55, r: 130 },
        // 중간 상단 볼륨
        { dx: -30, dy: -125, r: 105 },
        { dx: 30, dy: -130, r: 110 },
        // 최상단 솟아오른 크라운 (우뚝 선 적란운 봉우리)
        { dx: -15, dy: -195, r: 95 },
        { dx: 20, dy: -205, r: 100 },
        { dx: 0, dy: -260, r: 85 }
      ];

      // Layer 1: 몽환적인 라벤더/바이올렛 페리윙클 언더섀도우 (입체감과 애니메이션 감성의 핵심)
      skyCtx.fillStyle = isTwilight ? '#4a2c52' : '#556d92';
      puffs.forEach(function (p) {
        skyCtx.beginPath();
        skyCtx.arc(cx + p.dx * scale, cy + (p.dy + 32) * scale, p.r * scale * 1.06, 0, Math.PI * 2);
        skyCtx.fill();
      });
      skyCtx.beginPath();
      skyCtx.ellipse(cx, cy + 100 * scale, 180 * scale, 50 * scale, 0, 0, Math.PI * 2);
      skyCtx.fill();

      // Layer 2: 중간 파스텔 스카이 톤 (부드러운 볼륨감)
      skyCtx.fillStyle = isTwilight ? '#8a5c7c' : '#9ec9f5';
      puffs.forEach(function (p) {
        skyCtx.beginPath();
        skyCtx.arc(cx + p.dx * scale, cy + (p.dy + 12) * scale, p.r * scale * 0.98, 0, Math.PI * 2);
        skyCtx.fill();
      });

      // Layer 3: 내부 볼륨 하이라이트 (햇빛을 머금은 팽창하는 솜사탕 입체감)
      skyCtx.fillStyle = isTwilight ? '#d498aa' : '#d8ebfd';
      puffs.forEach(function (p) {
        skyCtx.beginPath();
        skyCtx.arc(cx + (p.dx - 8) * scale, cy + (p.dy - 4) * scale, p.r * scale * 0.88, 0, Math.PI * 2);
        skyCtx.fill();
      });

      // Layer 4: 햇빛을 직접 받는 순백 림 볼륨 (하이라이트)
      skyCtx.fillStyle = isTwilight ? '#ffddb8' : '#ffffff';
      puffs.forEach(function (p) {
        skyCtx.beginPath();
        skyCtx.arc(cx + (p.dx - 12) * scale, cy + (p.dy - 16) * scale, p.r * scale * 0.78, 0, Math.PI * 2);
        skyCtx.fill();
      });

      // Layer 5: 눈부신 은빛 림 라이트 (최상단 크라운 봉우리)
      skyCtx.fillStyle = '#ffffff';
      [puffs[7], puffs[8], puffs[9], puffs[10], puffs[11]].forEach(function (p) {
        skyCtx.beginPath();
        skyCtx.arc(cx + (p.dx - 16) * scale, cy + (p.dy - 26) * scale, p.r * scale * 0.65, 0, Math.PI * 2);
        skyCtx.fill();
      });

      skyCtx.restore();
    }

    // 신카이 구도: 화면 중앙 좌측 상공에 웅장한 적란운 타워와 우측 타워 배치
    drawShinkaiCloudTower(w * 0.20, h * 0.64, 1.30);
    drawShinkaiCloudTower(w * 0.62, h * 0.60, 1.45);
    drawShinkaiCloudTower(w * 0.88, h * 0.66, 1.15);

    // 3. 상공 권운(비행기운 / Cirrus Streaks)
    skyCtx.save();
    skyCtx.strokeStyle = isTwilight ? 'rgba(255, 220, 190, 0.45)' : 'rgba(255, 255, 255, 0.75)';
    skyCtx.lineWidth = 14;
    skyCtx.lineCap = 'round';
    for (var i = 0; i < 7; i++) {
      var sx = (i * 310) % w;
      var sy = 70 + (i * 35);
      skyCtx.beginPath();
      skyCtx.moveTo(sx, sy);
      skyCtx.bezierCurveTo(sx + 100, sy - 25, sx + 200, sy + 22, sx + 320, sy - 15);
      skyCtx.stroke();
    }
    skyCtx.restore();

    // 4. 대기를 관통하는 신카이 시그니처 빛줄기(God-Rays / Crepuscular Rays)
    var sunX = isTwilight ? w * 0.74 : w * 0.76;
    var sunY = isTwilight ? h * 0.48 : h * 0.25;
    skyCtx.save();
    skyCtx.globalCompositeOperation = 'screen';
    for (var r = 0; r < 7; r++) {
      var angle = 0.52 + (r * 0.15);
      var rayLen = 950;
      var gradRay = skyCtx.createLinearGradient(sunX, sunY, sunX + Math.cos(angle) * rayLen, sunY + Math.sin(angle) * rayLen);
      gradRay.addColorStop(0.0, isTwilight ? 'rgba(255, 200, 140, 0.32)' : 'rgba(255, 250, 230, 0.28)');
      gradRay.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      skyCtx.fillStyle = gradRay;
      skyCtx.beginPath();
      skyCtx.moveTo(sunX, sunY);
      skyCtx.arc(sunX, sunY, rayLen, angle - 0.045, angle + 0.045);
      skyCtx.closePath();
      skyCtx.fill();
    }
    skyCtx.restore();

    // 5. 찬란한 태양 렌즈 플레어 & 코로나 버스트
    var sunGrad = skyCtx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 360);
    sunGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    sunGrad.addColorStop(0.14, isTwilight ? 'rgba(255, 215, 130, 0.95)' : 'rgba(255, 248, 225, 0.98)');
    sunGrad.addColorStop(0.40, isTwilight ? 'rgba(255, 120, 80, 0.38)' : 'rgba(180, 235, 255, 0.42)');
    sunGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    skyCtx.fillStyle = sunGrad;
    skyCtx.beginPath();
    skyCtx.arc(sunX, sunY, 360, 0, Math.PI * 2);
    skyCtx.fill();

    skyTexture.needsUpdate = true;
    scene.fog.color.setHex(isTwilight ? 0xf88c52 : 0xd6e8f6);
    if (daySkyTexture) {
      scene.background = daySkyTexture;
      if (skyDome) skyDome.visible = false;
    } else if (skyDome) {
      skyDome.visible = true;
    }
    if (twilightOverlay) {
      twilightOverlay.visible = !!daySkyTexture && isTwilight;
      twilightOverlay.material.opacity = twilightOverlay.visible ? 0.31 : 0;
    }
  }

  renderShinkaiSky(14.0);

  // 3D 스카이 돔 지오메트리: 반경 5500으로 배치하여 1km+ 확장 지반을 완전히 감쌈
  var skyGeo = new THREE.SphereGeometry(5500, 48, 32);
  var skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false // 하늘 돔 자체는 포그에 가려지지 않음
  });
  var skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);
  twilightOverlay = new THREE.Mesh(
    new THREE.SphereGeometry(5480, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    })
  );
  twilightOverlay.visible = false;
  scene.add(twilightOverlay);

  // 사용자가 지정한 '햇살 비추는 도시의 하늘' 4096x2048 고해상도 파노라마 텍스처 로드 (sunlit_city_sky_4096.jpg)
  // 카메라 줌에 상관없이 배경 이미지가 항상 동일한 원근/스케일로 유지되도록 scene.background(Equirectangular) 적용
  var skyTexLoader = new THREE.TextureLoader();
  skyTexLoader.load('assets/images/sunlit_city_sky_4096.jpg', function (loadedTex) {
    loadedTex.encoding = THREE.sRGBEncoding;
    loadedTex.mapping = THREE.EquirectangularReflectionMapping;
    loadedTex.minFilter = THREE.LinearFilter;
    loadedTex.magFilter = THREE.LinearFilter;
    loadedTex.generateMipmaps = true;
    daySkyTexture = loadedTex;
    renderShinkaiSky(currentHour);
  }, undefined, function (err) {
    console.warn("[3D View] Sunlit city sky texture fallback:", err);
  });

  // --- 3. 조명 & 태양 일조 시뮬레이션 ---
  // 빛은 약간 부드럽게 완화하고 반사광(간접광)을 대폭 낮추어 건물 그림자가 짙고 강렬하게 드리워지도록 세팅
  var hemiLight = new THREE.HemisphereLight(0x70b8ff, 0xf1f5f9, 0.36);
  scene.add(hemiLight);

  var ambientLight = new THREE.AmbientLight(0xd8edff, 0.12);
  scene.add(ambientLight);

  // 직사 태양광: 1.05로 과도한 눈부심을 억제하고 그림자와의 명암 대비(Contrast)를 극대화
  var sunLight = new THREE.DirectionalLight(0xfff7ea, 1.05);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 20;
  sunLight.shadow.camera.far = 2800;
  var d = 700; // 대단지(헬리오시티 등) 전체를 커버하는 넓은 그림자 뷰볼륨
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0003;
  scene.add(sunLight);
  scene.add(sunLight.target);

  var now = new Date();
  var currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  var currentSeason = 'equinox';
  var isNightMode = false;
  var celestialBody = 'sun';

  // --- 3-1. 3D 태양 아이콘 오브젝트 (눈부심 없는 정갈한 ☀️ 그래픽 태양 아이콘 - 2배 크기 & 고해상도) ---
  function createSunIconTexture() {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');
    var cx = 256, cy = 256;

    // 1. 은은하고 부드러운 외곽 온기 링 (눈부신 백색 플레어 제거, 절제된 황금빛 아우라)
    var auraGrad = ctx.createRadialGradient(cx, cy, 64, cx, cy, 176);
    auraGrad.addColorStop(0.0, 'rgba(251, 191, 36, 0.40)');
    auraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    auraGrad.addColorStop(1.0, 'rgba(245, 158, 11, 0.0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 176, 0, Math.PI * 2);
    ctx.fill();

    // 2. 8개의 정갈한 태양 광선 (모던 그래픽 아이콘 스타일 - 선명한 굵기)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    for (var i = 0; i < 8; i++) {
      var angle = (i * Math.PI) / 4;
      var r1 = 96;
      var r2 = 132;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }

    // 3. 단정하고 선명한 황금빛 태양 원반 코어 (눈부시지 않은 따뜻한 앰버 골드)
    var coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 72);
    coreGrad.addColorStop(0.0, '#fffbeb'); // 부드러운 웜 화이트 중심
    coreGrad.addColorStop(0.45, '#fef08a'); // 따스한 레몬 골드
    coreGrad.addColorStop(0.85, '#f59e0b'); // 선명한 앰버 골드
    coreGrad.addColorStop(1.0, '#d97706'); // 단정한 오렌지 골드 림
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 72, 0, Math.PI * 2);
    ctx.fill();

    // 4. 또렷한 외곽 라인
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.stroke();

    return new THREE.CanvasTexture(c);
  }

  var sunSpriteMat = new THREE.SpriteMaterial({
    map: createSunIconTexture(),
    color: 0xffffff,
    transparent: true,
    blending: THREE.NormalBlending, // AdditiveBlending 제거! 배경 하늘을 탈색시키지 않고 아이콘만 얹힘
    depthWrite: false
  });
  var sunSprite = new THREE.Sprite(sunSpriteMat);
  sunSprite.scale.set(260, 260, 1); // 요청에 따라 2배 크기로 확대 (기존 130 -> 260)
  sunSprite.renderOrder = 9995; // 궤적 튜브보다 앞쪽에 그려지도록 높은 우선순위 부여
  scene.add(sunSprite);

  var sunUnitDir = new THREE.Vector3(0, 1, 0);
  var moonUnitDir = new THREE.Vector3(0, 1, 0);

  function createMoonIconTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    var cx = 256, cy = 256;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 132, 0, Math.PI * 2);
    ctx.clip();
    var moonGrad = ctx.createRadialGradient(cx - 36, cy - 40, 8, cx, cy, 142);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.7, '#e0e7ff');
    moonGrad.addColorStop(1, '#a5b4fc');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(cx - 140, cy - 140, 280, 280);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(30, 41, 59, 0.78)';
    ctx.beginPath();
    ctx.arc(cx + 68, cy - 12, 112, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 132, 0, Math.PI * 2);
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }

  var moonSpriteMat = new THREE.SpriteMaterial({
    map: createMoonIconTexture(),
    color: 0xffffff,
    transparent: true,
    depthWrite: false
  });
  var moonSprite = new THREE.Sprite(moonSpriteMat);
  moonSprite.visible = false;
  moonSprite.scale.set(330, 330, 1);
  moonSprite.renderOrder = 9995;
  scene.add(moonSprite);

  function updateSun() {
    var declMap = { winter: -23.44, equinox: 0.0, summer: 23.44 };
    var decl = (declMap[currentSeason] || 0.0) * Math.PI / 180;
    var lat = center.lat * Math.PI / 180;
    var hourAngle = (currentHour - 12.0) * 15 * Math.PI / 180;

    var sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
    var alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    var cosAz = (Math.sin(decl) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(alt));
    var az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (hourAngle > 0) az = 2 * Math.PI - az;

    // 태양 단위 방향 벡터
    sunUnitDir.set(
      Math.cos(alt) * Math.sin(az),
      Math.sin(alt),
      -Math.cos(alt) * Math.cos(az)
    ).normalize();
    isNightMode = alt <= 0.0;
    celestialBody = isNightMode ? 'moon' : 'sun';
    moonUnitDir.copy(sunUnitDir).negate();

    var activeCelestialDir = isNightMode ? moonUnitDir : sunUnitDir;
    var sunDist = 950;
    sunLight.position.set(
      activeCelestialDir.x * sunDist,
      Math.max(30, activeCelestialDir.y * sunDist),
      activeCelestialDir.z * sunDist
    );
    sunLight.target.position.set(0, 0, 0);

    if (isNightMode) {
      sunSprite.visible = false;
      moonSprite.visible = true;
      sunLight.castShadow = false;
      sunLight.intensity = 0.08;
      sunLight.color.setHex(0x9caee8);
      hemiLight.intensity = 0.28;
      hemiLight.color.setHex(0x52648f);
      hemiLight.groundColor.setHex(0x28334d);
    } else {
      moonSprite.visible = false;
      sunSprite.visible = true;
      sunLight.castShadow = true;
      if (alt <= 0.14) {
        sunSpriteMat.color.setHex(0xf97316); // 노을 오렌지
        sunSprite.scale.set(290, 290, 1); // 2배 크기 (기존 145 -> 290)
        sunLight.intensity = 0.45;
        sunLight.color.setHex(0xf97316);
        hemiLight.intensity = 0.20;
        hemiLight.color.setHex(0xb26b91);
        hemiLight.groundColor.setHex(0xfcd34d);
      } else if (alt < 0.30) {
        sunSpriteMat.color.setHex(0xfbbf24); // 황금빛
        sunSprite.scale.set(270, 270, 1); // 2배 크기 (기존 135 -> 270)
        sunLight.intensity = 0.75;
        sunLight.color.setHex(0xfbbf24);
        hemiLight.intensity = 0.28;
        hemiLight.color.setHex(0x72b4f5);
        hemiLight.groundColor.setHex(0xfef3c7);
      } else {
        sunSpriteMat.color.setHex(0xffffff); // 단정하고 깔끔한 아이콘 본래 색상
        sunSprite.scale.set(250, 250, 1); // 2배 크기 (기존 125 -> 250)
        sunLight.intensity = 1.05; // 부드러운 직사광 (눈부심 억제)
        sunLight.color.setHex(0xfff7ea);
        hemiLight.intensity = 0.36; // 짙고 깊은 그림자 유지
        hemiLight.color.setHex(0x70b8ff);
        hemiLight.groundColor.setHex(0xf1f5f9);
      }
    }

    renderShinkaiSky(currentHour);

    if (typeof window.onComplex3dSunUpdate === 'function') {
      var bodyDirection = isNightMode ? moonUnitDir : sunUnitDir;
      var azDeg = Math.round((Math.atan2(bodyDirection.x, -bodyDirection.z) * 180 / Math.PI + 360) % 360);
      var altDeg = Math.round(Math.asin(Math.max(-1, Math.min(1, bodyDirection.y))) * 180 / Math.PI);
      var dirText = "정남";
      if (azDeg >= 337.5 || azDeg < 22.5) dirText = "정북";
      else if (azDeg >= 22.5 && azDeg < 67.5) dirText = "북동";
      else if (azDeg >= 67.5 && azDeg < 112.5) dirText = "정동";
      else if (azDeg >= 112.5 && azDeg < 157.5) dirText = "남동";
      else if (azDeg >= 157.5 && azDeg < 202.5) dirText = "정남";
      else if (azDeg >= 202.5 && azDeg < 247.5) dirText = "남서";
      else if (azDeg >= 247.5 && azDeg < 292.5) dirText = "정서";
      else if (azDeg >= 292.5 && azDeg < 337.5) dirText = "북서";

      window.onComplex3dSunUpdate({
        hour: currentHour,
        season: currentSeason,
        azimuthDeg: azDeg,
        altitudeDeg: altDeg,
        dirText: dirText,
        isDaylight: !isNightMode,
        isNightMode: isNightMode,
        celestialBody: celestialBody
      });
    }

    if (sunTrajectoryGroup && sunTrajectoryGroup.visible) {
      updateSunTrajectory();
    }
  }

  // --- 3-2. [아실/직방 3D 벤치마크] 창밖조망 시간별 태양 궤적 (Sun Trajectory Arc HUD) ---
  var sunTrajectoryGroup = new THREE.Group();
  sunTrajectoryGroup.name = "sunTrajectoryGroup";
  sunTrajectoryGroup.visible = false; // 기본은 숨김 (창밖조망 시에만 활성화)
  scene.add(sunTrajectoryGroup);

  var sunHourNodeSprites = [];

  // --- 3-3. 가상 발코니 유리 프레임 (3D 모델링 완전 삭제: 2D 이미지/SVG 오버레이로 완전 대체) ---
  var balconyGlassFrameGroup = new THREE.Group();
  balconyGlassFrameGroup.name = "balconyGlassFrameGroup";
  balconyGlassFrameGroup.visible = false;
  // 3D 메쉬 모델링은 완전히 삭제하고, 오직 2D SVG 뷰포트 오버레이(#balcony-2d-frame-overlay)만 사용
  var isBalconyFrameEnabled = true; // 기본 ON

  function updateBalconyGlassFrame(eyePos) {
    // 3D 프레임 모델링 완전 제거됨 (2D 프레임 오버레이만 사용)
  }

  function createSunHourBadgeTexture(dh, isActive, isMoon) {
    var canvas = document.createElement('canvas');
    // Retina 2x 고해상도 (512x192)로 선명하게 렌더링
    canvas.width = 512;
    canvas.height = 192;
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2); // 내부 256x96 좌표계를 2배 스케일로 정밀 렌더링

    // 1. 천체 아이콘 (중심 x: 42, y: 48)
    var cx = 42, cy = 48;
    if (isActive) {
      var aura = ctx.createRadialGradient(cx, cy, 8, cx, cy, 38);
      aura.addColorStop(0.0, isMoon ? 'rgba(224, 231, 255, 0.95)' : 'rgba(254, 240, 138, 0.95)');
      aura.addColorStop(0.45, isMoon ? 'rgba(129, 140, 248, 0.68)' : 'rgba(245, 158, 11, 0.75)');
      aura.addColorStop(1.0, isMoon ? 'rgba(129, 140, 248, 0.0)' : 'rgba(245, 158, 11, 0.0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isMoon) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = isActive ? '#ffffff' : '#c7d2fe';
      ctx.fillRect(cx - 16, cy - 16, 32, 32);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(30, 41, 59, 0.76)';
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      var rayLen = isActive ? 24 : 20;
      var rayBase = isActive ? 14 : 12;
      ctx.fillStyle = isActive ? '#fef08a' : '#f59e0b';
      for (var i = 0; i < 8; i++) {
        var angle = i * Math.PI / 4;
        var tipX = cx + Math.cos(angle) * rayLen;
        var tipY = cy + Math.sin(angle) * rayLen;
        var p1Angle = angle + 0.22;
        var p2Angle = angle - 0.22;
        var p1X = cx + Math.cos(p1Angle) * rayBase;
        var p1Y = cy + Math.sin(p1Angle) * rayBase;
        var p2X = cx + Math.cos(p2Angle) * rayBase;
        var p2Y = cy + Math.sin(p2Angle) * rayBase;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(p1X, p1Y);
        ctx.lineTo(p2X, p2Y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = isActive ? '#ffffff' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy, isActive ? 12 : 11, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 시간 텍스트 라벨 (예: 'AM 11:00', 'PM 12:00')
    var label = dh.label;
    var fullText = label;

    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 텍스트 외곽 테두리 (어떤 하늘 배경에서도 100% 가독성 보장)
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeText(fullText, 76, cy + 1);

    // 텍스트 본문 채우기
    ctx.fillStyle = isActive ? '#fef08a' : '#ffffff';
    ctx.fillText(fullText, 76, cy + 1);

    var tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function updateSunTrajectory() {
    // 기존 궤적 메쉬 및 스프라이트 정리
    while (sunTrajectoryGroup.children.length > 0) {
      var child = sunTrajectoryGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
      sunTrajectoryGroup.remove(child);
    }
    sunHourNodeSprites = [];

    var lat = (center.lat || 37.5665) * Math.PI / 180;
    var decl = 0;
    if (currentSeason === 'summer') decl = 23.44 * Math.PI / 180;
    else if (currentSeason === 'winter') decl = -23.44 * Math.PI / 180;

    // 창밖 조망 시 세대 발코니 시점(balconyEyePos)을 기준으로 실제 천문학적 태양 궤적 형성
    var anchor = (isPOVMode && balconyEyePos) ? balconyEyePos : (camera ? camera.position : new THREE.Vector3());
    var sunDist = 580; // 3D 하늘 궤적 시야 반경

    var trajectoryIsMoon = isNightMode;
    var trajectoryStart = trajectoryIsMoon ? 17 : 5;
    var trajectoryEnd = trajectoryIsMoon ? 31 : 19;
    var curvePoints = [];
    for (var h = trajectoryStart; h <= trajectoryEnd; h += 0.20) {
      var normalizedHour = h % 24;
      var hourAngle = (normalizedHour - 12.0) * 15 * Math.PI / 180;
      var sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
      var alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
      if (trajectoryIsMoon ? alt < -0.01 : alt > 0.01) {
        var cosAz = (Math.sin(decl) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(alt));
        var az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
        if (hourAngle > 0) az = 2 * Math.PI - az;

        var bodyAlt = trajectoryIsMoon ? -alt : alt;
        var bodyAz = trajectoryIsMoon ? (az + Math.PI) % (Math.PI * 2) : az;
        var ptX = anchor.x + sunDist * Math.cos(bodyAlt) * Math.sin(bodyAz);
        var ptY = anchor.y + sunDist * Math.sin(bodyAlt);
        var ptZ = anchor.z - sunDist * Math.cos(bodyAlt) * Math.cos(bodyAz);
        curvePoints.push(new THREE.Vector3(ptX, ptY, ptZ));
      }
    }

    if (curvePoints.length >= 2) {
      var curve = new THREE.CatmullRomCurve3(curvePoints);
      var tubeGeo = new THREE.TubeGeometry(curve, 72, 2.6, 8, false);
      var tubeMat = new THREE.MeshBasicMaterial({
        color: trajectoryIsMoon ? 0xa5b4fc : 0xf59e0b,
        transparent: true,
        opacity: 0.85,
        depthTest: true,
        depthWrite: false
      });
      var tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.renderOrder = 500; // 궤적 튜브는 중간 우선순위 (배지 스프라이트보다 먼저 렌더링)
      sunTrajectoryGroup.add(tubeMesh);
    }

    var DISPLAY_HOURS = trajectoryIsMoon ? [
      { h: 18.0, label: '18:00' },
      { h: 20.0, label: '20:00' },
      { h: 22.0, label: '22:00' },
      { h: 0.0, label: '00:00' },
      { h: 2.0, label: '02:00' },
      { h: 4.0, label: '04:00' },
      { h: 6.0, label: '06:00' }
    ] : [
      { h: 6.0, label: '06:00' },
      { h: 8.0, label: '08:00' },
      { h: 9.0, label: '09:00' },
      { h: 12.0, label: '12:00' },
      { h: 14.0, label: '14:00' },
      { h: 16.0, label: '16:00' },
      { h: 18.0, label: '18:00' }
    ];

    // 현재 시각과 가장 가까운 시간대 배지 감지
    var minDiff = 999;
    var closestHour = null;
    DISPLAY_HOURS.forEach(function (dh) {
      var rawDiff = Math.abs(currentHour - dh.h);
      var diff = Math.min(rawDiff, 24 - rawDiff);
      if (diff < minDiff) {
        minDiff = diff;
        closestHour = dh.h;
      }
    });

    // ★ [요청사항 1] 태양 아이콘 및 시간표시가 궤적 곡선 뒤에 가려지지 않도록 관찰자 쪽으로 25m 앞으로 전진 배치 ★
    var nodeDist = sunDist - 25; // 궤적(580m)보다 25m 앞선 555m에 배치

    DISPLAY_HOURS.forEach(function (dh) {
      var hourAngle = (dh.h - 12.0) * 15 * Math.PI / 180;
      var sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
      var alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
      if (trajectoryIsMoon ? alt >= -0.01 : alt <= 0.01) return;

      var cosAz = (Math.sin(decl) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(alt));
      var az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
      if (hourAngle > 0) az = 2 * Math.PI - az;

      var bodyAlt = trajectoryIsMoon ? -alt : alt;
      var bodyAz = trajectoryIsMoon ? (az + Math.PI) % (Math.PI * 2) : az;
      var nx = anchor.x + nodeDist * Math.cos(bodyAlt) * Math.sin(bodyAz);
      var ny = anchor.y + nodeDist * Math.sin(bodyAlt);
      var nz = anchor.z - nodeDist * Math.cos(bodyAlt) * Math.cos(bodyAz);

      var isActive = (dh.h === closestHour && minDiff <= 0.75);
      var spMat = new THREE.SpriteMaterial({
        map: createSunHourBadgeTexture(dh, isActive, trajectoryIsMoon),
        depthTest: false,
        depthWrite: false
      });
      var sp = new THREE.Sprite(spMat);
      sp.position.set(nx, ny, nz);
      sp.scale.set(140, 52, 1); // ★ [요청사항 1] 현재의 2배 크기로 확대 (기존 70, 26 -> 140, 52) ★
      sp.renderOrder = 9999;    // ★ [요청사항 1] 궤적 튜브(renderOrder 500)보다 훨씬 높게 지정하여 항상 최상단/앞쪽에 렌더링 ★
      sp.userData = { isSunHourNode: true, hour: dh.h };
      sunTrajectoryGroup.add(sp);
      sunHourNodeSprites.push(sp);
    });
  }

  updateSun();

  // --- 4. 바닥: 신카이풍 애니메이션 조경 + 네이버 지도 소프트 블렌딩 ---
  // 원형 지반(CircleGeometry)으로 모서리 각진 경계를 완전히 제거하고 하늘 돔 안에서 자연스럽게 포그와 융합
  // ★ 1km 반경원(1000m)을 여유롭게 수용하도록 1280px (반경 약 1,212m) 광역 3D 지반 뷰 구축 ★
  var mapZoom = 16;
  var metersPerPixel = (156543.03392 * Math.cos(center.lat * Math.PI / 180)) / Math.pow(2, mapZoom);
  var groundPixelSize = 1280;
  var exactSpanMeters = groundPixelSize * metersPerPixel;
  var exactRadius = exactSpanMeters / 2; // 지반 반경 (~1,212m, 1km 반경원 완벽 커버)
  var groundRadius = exactRadius;
  var groundGeo = new THREE.CircleGeometry(groundRadius, 64);

  // 기본 프로시저럴 애니메이션 지반 텍스처 생성기 (따뜻한 아스팔트 + 산뜻한 민트 조경)
  var groundCanvas = document.createElement('canvas');
  groundCanvas.width = groundPixelSize;
  groundCanvas.height = groundPixelSize;
  var gCtx = groundCanvas.getContext('2d');

  function renderAnimeProceduralGround() {
    var gw = groundCanvas.width, gh = groundCanvas.height;

    // 1. 따스한 햇빛을 머금은 웜 슬레이트 도로/아스팔트 베이스
    gCtx.fillStyle = '#cbd5e1';
    gCtx.fillRect(0, 0, gw, gh);

    // 2. 도시 블록 및 공원/조경 구역 타일링 (애니메이션풍 정갈한 녹지 분할)
    var cellSize = 128;
    for (var x = 0; x < gw; x += cellSize) {
      for (var y = 0; y < gh; y += cellSize) {
        // 블록 내부 인도 및 조경 (도로 여백 16px)
        var margin = 16;
        var bw = cellSize - margin * 2;
        var bh = cellSize - margin * 2;

        // 보도 블록 베이스 (밝은 아이보리)
        gCtx.fillStyle = '#f1f5f9';
        gCtx.fillRect(x + margin, y + margin, bw, bh);

        // 녹지 및 잔디 (프레시 민트 에메랄드)
        var isPark = ((x / cellSize) + (y / cellSize)) % 2 === 0;
        gCtx.fillStyle = isPark ? '#bbf7d0' : '#86efac';
        gCtx.fillRect(x + margin + 8, y + margin + 8, bw - 16, bh - 16);

        // 정갈한 단지 내 산책로 십자선
        gCtx.fillStyle = '#f8fafc';
        gCtx.fillRect(x + margin + bw / 2 - 2, y + margin, 4, bh);
        gCtx.fillRect(x + margin, y + margin + bh / 2 - 2, bw, 4);
      }
    }

    // 도로 중앙선 (부드러운 화이트 점선)
    gCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    gCtx.lineWidth = 4;
    for (var rx = cellSize; rx < gw; rx += cellSize) {
      gCtx.beginPath();
      gCtx.moveTo(rx - 8, 0);
      gCtx.lineTo(rx - 8, gh);
      gCtx.stroke();
    }
    for (var ry = cellSize; ry < gh; ry += cellSize) {
      gCtx.beginPath();
      gCtx.moveTo(0, ry - 8);
      gCtx.lineTo(gw, ry - 8);
      gCtx.stroke();
    }

    // 3. 지반 가장자리 원형 비네팅 (지평선 포그 색상 #d6e8f6과 완벽하게 페이드아웃)
    var radGrad = gCtx.createRadialGradient(gw / 2, gh / 2, gw * 0.38, gw / 2, gh / 2, gw * 0.495);
    radGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
    radGrad.addColorStop(1.0, '#d6e8f6');
    gCtx.fillStyle = radGrad;
    gCtx.fillRect(0, 0, gw, gh);
  }
  renderAnimeProceduralGround();

  var groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.encoding = THREE.sRGBEncoding;
  groundTex.wrapS = THREE.ClampToEdgeWrapping;
  groundTex.wrapT = THREE.ClampToEdgeWrapping;

  var groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.78,
    metalness: 0.02
  });

  var ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.2, 0);
  ground.receiveShadow = true;
  scene.add(ground);


  // 네이버 지도 및 가상 조경 지반 로드 (CORS 클린 로더 & 신카이 가상 조경 지원)
  function loadNaverMapGroundTexture(mapType) {
    // 1. 가상 지반 옵션: 9종 상호 연결 모듈러 타일 (도로 & 연두색 평지 블록)
    if (mapType === 'virtual') {
      console.warn("[3D View] Loading 9-Tile Interconnected Modular Ground Texture (Roads & Light-Green Grounds)...");
      var virtualLoader = new THREE.TextureLoader();
      virtualLoader.load('assets/images/shinkai_9tile_modular_ground_feathered.jpg', function (tex) {
        tex.encoding = THREE.sRGBEncoding;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;

        groundMat.map = tex;
        groundMat.roughness = 0.85;
        groundMat.needsUpdate = true;
        window.debugNaverStatus = { called: true, mapType: 'virtual', updated: true, tileCount: 0 };
        console.warn("[3D View] 9-Tile Interconnected Modular Ground Texture successfully loaded!");
      }, undefined, function (err) {
        console.warn("[3D View] Virtual ground texture fallback:", err);
      });
      return;
    }

    var retryCount = 0;
    function tryInit() {
      if (typeof naver === 'undefined' || !naver.maps) {
        retryCount++;
        if (retryCount <= 25) {
          setTimeout(tryInit, 300);
        } else {
          console.log("[3D View] Naver Maps API timed out. Using curated Anime Procedural Ground.");
        }
        return;
      }

      console.warn("[3D View] Naver Maps API ready! Initializing 3D ground tile capture...");
      var offscreen = document.getElementById('naver_3d_ground_cache');
      if (!offscreen) {
        offscreen = document.createElement('div');
        offscreen.id = 'naver_3d_ground_cache';
        offscreen.style.cssText = 'position:fixed; left:-9999px; top:-9999px; width:1280px; height:1280px; overflow:hidden; z-index:-1000;';
        document.body.appendChild(offscreen);
      } else {
        offscreen.style.width = '1280px';
        offscreen.style.height = '1280px';
        offscreen.innerHTML = "";
      }

      var selectedMapTypeId = naver.maps.MapTypeId.NORMAL;
      if (mapType === 'satellite') selectedMapTypeId = naver.maps.MapTypeId.SATELLITE;
      if (mapType === 'hybrid') selectedMapTypeId = naver.maps.MapTypeId.HYBRID;

      var mapZoom = 16; // 줌 16: 1280px가 약 2,425m를 커버하여 1km 반경원 전체와 광역 인프라를 1:1 매칭
      var metersPerPixel = (156543.03392 * Math.cos(center.lat * Math.PI / 180)) / Math.pow(2, mapZoom);
      var exactSpanMeters = 1280 * metersPerPixel;
      var exactRadius = exactSpanMeters / 2; // 지반 반경 (~1,212m)
      groundRadius = exactRadius;

      // 지반 지오메트리를 실제 네이버 지도 커버리지와 1:1로 일치시킴
      if (ground.geometry) ground.geometry.dispose();
      ground.geometry = new THREE.CircleGeometry(exactRadius, 64);

      try {
        var tempMap = new naver.maps.Map(offscreen, {
          center: new naver.maps.LatLng(center.lat, center.lng),
          zoom: mapZoom,
          mapTypeId: selectedMapTypeId,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          zoomControl: false,
          disableKineticPan: true
        });

        var hasRenderedMap = false;
        window.debugNaverStatus = { called: false, error: null, tileCount: 0, updated: false, mapType: mapType || 'normal' };

        function applyCleanNaverTiles() {
          if (hasRenderedMap) return;
          var imgs = offscreen.querySelectorAll('img');
          window.debugNaverStatus.tileCount = imgs.length;
          if (imgs.length === 0) return;

          var offRect = offscreen.getBoundingClientRect();
          var tilePositions = [];
          imgs.forEach(function (img) {
            var r = img.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && img.src) {
              tilePositions.push({
                src: img.src,
                dx: r.left - offRect.left,
                dy: r.top - offRect.top,
                dw: r.width,
                dh: r.height
              });
            }
          });

          if (tilePositions.length === 0) return;
          hasRenderedMap = true;
          window.debugNaverStatus.called = true;
          console.warn("[Naver Map] Loading clean CORS tiles for WebGL ground. Tile count:", tilePositions.length, "MapType:", mapType || 'normal');

          var canvas = document.createElement('canvas');
          canvas.width = 1280;
          canvas.height = 1280;
          var ctx = canvas.getContext('2d');

          // 기본 아스팔트 베이스
          ctx.fillStyle = (mapType === 'hybrid' || mapType === 'satellite') ? '#1e293b' : '#f1f5f9';
          ctx.fillRect(0, 0, 1280, 1280);

          // CORS 깨끗한 새 이미지 객체로 비동기 로딩 (WebGL texImage2D SecurityError 원천 방지)
          var loadPromises = tilePositions.map(function (tp) {
            return new Promise(function (resolve) {
              var cleanImg = new Image();
              cleanImg.crossOrigin = 'anonymous';
              cleanImg.onload = function () {
                resolve({ img: cleanImg, tp: tp });
              };
              cleanImg.onerror = function () {
                resolve(null);
              };
              cleanImg.src = tp.src;
            });
          });

          Promise.all(loadPromises).then(function (results) {
            var drawnCount = 0;
            results.forEach(function (res) {
              if (res && res.img) {
                ctx.drawImage(res.img, res.tp.dx, res.tp.dy, res.tp.dw, res.tp.dh);
                drawnCount++;
              }
            });
            window.debugNaverStatus.drawnCount = drawnCount;

            // ★ 네이버 지도 고유의 선명한 도로명/건물명/지형 식별성을 유지하면서 지평선과 자연스럽게 융합 ★
            // 1. 과도한 워시아웃 제거: 아주 은은한 웜 틴트만 살짝 부여 (5% 불투명도)
            ctx.save();
            ctx.globalCompositeOperation = 'soft-light';
            ctx.fillStyle = 'rgba(255, 248, 235, 0.25)';
            ctx.fillRect(0, 0, 1280, 1280);

            // 2. 지반 가장자리 원형 비네팅 포그 결합: 중심부 1km 지도는 100% 선명하게 보이고, 최외곽만 지평선 안개와 페더링
            ctx.globalCompositeOperation = 'source-over';
            var halfSize = 640;
            var rad = ctx.createRadialGradient(halfSize, halfSize, halfSize * 0.82, halfSize, halfSize, halfSize);
            rad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
            rad.addColorStop(1.0, '#d6e8f6');
            ctx.fillStyle = rad;
            ctx.fillRect(0, 0, 1280, 1280);
            ctx.restore();

            window.debugNaverCanvas = canvas;

            var naverTex = new THREE.CanvasTexture(canvas);
            naverTex.encoding = THREE.sRGBEncoding;
            naverTex.wrapS = THREE.ClampToEdgeWrapping;
            naverTex.wrapT = THREE.ClampToEdgeWrapping;

            groundMat.map = naverTex;
            groundMat.roughness = 0.85; // 지도의 텍스트와 라인이 또렷하게 보이도록 조명 난반사 억제
            groundMat.needsUpdate = true;
            window.debugNaverStatus.updated = true;
            console.warn("[3D View] Ground texture successfully updated with CRISP 1:1 Naver Map tiles! Drawn:", drawnCount);
          }).catch(function (err) {
            window.debugNaverStatus.error = String(err);
            console.error("NAVER TEXTURE PROMISE ERROR:", err);
          });
        }

        // 타일이 offscreen에 비동기 배치되는 즉시 캐치하는 타이머
        var checkAttempts = 0;
        var tileCheckTimer = setInterval(function () {
          checkAttempts++;
          var imgs = offscreen.querySelectorAll('img');
          if (imgs.length >= 8 || checkAttempts > 20) {
            clearInterval(tileCheckTimer);
            if (imgs.length > 0) {
              applyCleanNaverTiles();
            }
          }
        }, 350);

        naver.maps.Event.once(tempMap, 'tilesloaded', function () {
          clearInterval(tileCheckTimer);
          setTimeout(applyCleanNaverTiles, 200);
        });
      } catch (err) {
        console.warn("Naver map init note:", err);
      }
    }

    tryInit();
  }

  // 바닥 지반 기본값: 실제 네이버 일반 지도('normal')를 디폴트로 로드
  loadNaverMapGroundTexture('normal');

  // --- 5. Extrude Helper ---
  function createShapeFromRing(ring) {
    if (!ring || ring.length < 3) return null;
    var shape = new THREE.Shape();
    var pts = [];
    var sumY = 0;
    for (var i = 0; i < ring.length; i++) {
      if (!ring[i] || ring[i].length < 2) continue;
      var lng = Number(ring[i][0]);
      var lat = Number(ring[i][1]);
      if (!isFinite(lng) || !isFinite(lat)) continue;
      var p = toLocalXY(lng, lat);
      if (!isFinite(p.x) || !isFinite(p.y)) continue;
      pts.push(p);
      sumY += p.y;
    }
    if (pts.length < 3) return null;
    var bCenterY = sumY / pts.length;

    // 건물 위치(Position): -bCenterY (북쪽=-Z, 남쪽=+Z로 단지 내 동배치 100% 정위치)
    // 건물 향(Facing Orientation): 원본 전면 발코니/후면 복도 방향(+dy) 그대로 정상 보존
    var transformedPts = [];
    for (var j = 0; j < pts.length; j++) {
      var sy = 2 * bCenterY - pts[j].y;
      transformedPts.push({ x: pts[j].x, y: sy });
      if (j === 0) shape.moveTo(pts[j].x, sy);
      else shape.lineTo(pts[j].x, sy);
    }
    shape.closePath();
    shape.transformedPts = transformedPts;
    return shape;
  }

  // 폴리곤 점 배열로부터 THREE.Shape 생성
  function createShapeFromPts(pts) {
    if (!pts || pts.length < 3) return null;
    var shape = new THREE.Shape();
    shape.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].x, pts[i].y);
    }
    shape.closePath();
    return shape;
  }

  // 건물의 주요 축(PCA) 산출: 긴 판상형 아파트의 주동 방향 및 길이 측정
  function computePolygonPCA(pts) {
    if (!pts || pts.length < 3) return { ux: 1, uy: 0, sMin: 0, sMax: 1, L: 1 };
    var n = pts.length;
    var cx = 0, cy = 0;
    for (var i = 0; i < n; i++) {
      cx += pts[i].x;
      cy += pts[i].y;
    }
    cx /= n;
    cy /= n;

    var cxx = 0, cyy = 0, cxy = 0;
    for (var i = 0; i < n; i++) {
      var dx = pts[i].x - cx;
      var dy = pts[i].y - cy;
      cxx += dx * dx;
      cyy += dy * dy;
      cxy += dx * dy;
    }

    var theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
    var ux = Math.cos(theta);
    var uy = Math.sin(theta);
    // 방향 통일: 남쪽(+Z)을 바라봤을 때 좌측(East, +X)이 1호(t=0), 우측(West, -X)이 N호(t=1)
    // 따라서 주축 벡터는 동(+X) -> 서(-X) 방향(ux < 0)으로 정렬하여 일관된 호수 배치 보장
    if (ux > 1e-4 || (Math.abs(ux) <= 1e-4 && uy > 0)) {
      ux = -ux;
      uy = -uy;
    }

    var sMin = 999999, sMax = -999999;
    for (var i = 0; i < n; i++) {
      var s = pts[i].x * ux + pts[i].y * uy;
      if (s < sMin) sMin = s;
      if (s > sMax) sMax = s;
    }
    var L = Math.max(1, sMax - sMin);
    return { ux: ux, uy: uy, sMin: sMin, sMax: sMax, L: L };
  }

  // Sutherland-Hodgman 알고리즘 기반 2D 슬래브 클리핑 (주축 s방향 [sMin, sMax] 범위 내 폴리곤 슬라이스)
  function clipPolygonWithSlab(polygon, ux, uy, sMin, sMax) {
    function clipHalfPlane(pts, sign, boundary) {
      if (!pts || pts.length < 3) return [];
      var out = [];
      var len = pts.length;
      for (var i = 0; i < len; i++) {
        var p1 = pts[i];
        var p2 = pts[(i + 1) % len];
        var s1 = p1.x * ux + p1.y * uy;
        var s2 = p2.x * ux + p2.y * uy;
        var in1 = (sign * (s1 - boundary) >= -1e-5);
        var in2 = (sign * (s2 - boundary) >= -1e-5);
        if (in1 && in2) {
          out.push(p2);
        } else if (in1 && !in2) {
          var t = (boundary - s1) / (s2 - s1);
          out.push({
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
          });
        } else if (!in1 && in2) {
          var t = (boundary - s1) / (s2 - s1);
          out.push({
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
          });
          out.push(p2);
        }
      }
      return out;
    }

    var step1 = clipHalfPlane(polygon, 1, sMin);   // s >= sMin
    var step2 = clipHalfPlane(step1, -1, sMax);   // s <= sMax
    return step2;
  }

  // --- 6. 주변 건물 (Neighbor Buildings): 부드러운 연회색 (Soft Light Grayscale) ---
  // 메인 타겟 단지가 돋보이도록 주변 배경 아파트는 한층 더 화사하고 연한 그레이(#e5e7eb)로 렌더링
  var neighborMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.70,
    metalness: 0.02,
    transparent: true,
    opacity: 0.68
  });

  var neighborLineMat = new THREE.LineBasicMaterial({
    color: 0xb0b3b8,
    transparent: true,
    opacity: 0.28
  });

  // 주변 건물 전용 그룹 (기본값: 숨김/Hide - 사용자가 필요할 때 체크박스로 On 가능)
  var neighborGroup = new THREE.Group();
  neighborGroup.name = "neighborBuildingsGroup";
  neighborGroup.visible = false;
  scene.add(neighborGroup);

  var neighborObjectKeys = Object.create(null);
  var genericNeighborSignatures = Object.create(null);
  function getNeighborFootprintSignature(ring) {
    var points = [];
    (ring || []).forEach(function (coordinate) {
      if (!coordinate || coordinate.length < 2) return;
      var point = toLocalXY(Number(coordinate[0]), Number(coordinate[1]));
      if (isFinite(point.x) && isFinite(point.y)) {
        points.push([Math.round(point.x * 10) / 10, Math.round(point.y * 10) / 10]);
      }
    });
    if (points.length > 1 && points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1]) {
      points.pop();
    }
    points.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    return points.length >= 3 ? JSON.stringify(points) : '';
  }

  function removeNeighborBuilding(objectKey) {
    var entry = neighborObjectKeys[objectKey];
    if (!entry || entry.isApartmentNeighbor) return;
    neighborGroup.remove(entry.mesh);
    neighborGroup.remove(entry.line);
    entry.mesh.geometry.dispose();
    entry.line.geometry.dispose();
    delete neighborObjectKeys[objectKey];
  }

  function addNeighborBuilding(n, apartmentCode) {
    if (!n.rings || !n.rings[0]) return;
    var objectKey = String(apartmentCode || '') + ':' + String(n.id || n.dong || neighborGroup.children.length);
    if (neighborObjectKeys[objectKey]) return;
    var footprintSignature = getNeighborFootprintSignature(n.rings[0]);
    if (apartmentCode && footprintSignature) {
      (genericNeighborSignatures[footprintSignature] || []).forEach(removeNeighborBuilding);
    }
    var shape = createShapeFromRing(n.rings[0]);
    if (!shape) return;

    var height = n.heightM && n.heightM > 0 ? n.heightM : (n.floors ? n.floors * 2.8 : 15);
    var geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geom.rotateX(-Math.PI / 2);

    var mesh = new THREE.Mesh(geom, neighborMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      isNeighbor: true,
      isApartmentNeighbor: !!apartmentCode,
      complexCode: apartmentCode || '',
      name: n.name || n.dong || ''
    };
    neighborGroup.add(mesh);

    // 미세한 원경 펜선
    var edges = new THREE.EdgesGeometry(geom, 35);
    var line = new THREE.LineSegments(edges, neighborLineMat);
    line.position.copy(mesh.position);
    neighborGroup.add(line);
    neighborObjectKeys[objectKey] = {
      mesh: mesh,
      line: line,
      isApartmentNeighbor: !!apartmentCode
    };
    if (!apartmentCode && footprintSignature) {
      if (!genericNeighborSignatures[footprintSignature]) genericNeighborSignatures[footprintSignature] = [];
      genericNeighborSignatures[footprintSignature].push(objectKey);
    }
  }

  (data3d.neighbors || []).forEach(function (neighbor) {
    addNeighborBuilding(neighbor, '');
  });

  // --- 7. 대상 단지 아파트 (Target Complex): 극장판 애니메이션 셀 작화풍 ---
  var interactiveFloors = [];
  var dongMeshes = {};
  var dongCenters = {};
  var dongBBoxes = {};
  var dongTotalFloors = {};

  // =========================================================================
  // ★ [1) 커스텀 색상 설정 변수] 아파트 층별(저층, 중층, 고층) 외벽 색상 변수 ★
  // 사용자가 원하는 색상 코드(HEX: '#475569' 등)로 쉽게 변경 가능합니다.
  // =========================================================================
  var APT_COLOR_LOW  = '#475569'; // 저층 (1~5층)  - 딥 슬레이트 그레이 (차분하고 묵직한 하부 그레이스케일)
  var APT_COLOR_MID  = '#64748b'; // 중층 (6~10층) - 미디엄 슬레이트 그레이 (균형감 있는 중간 그레이스케일)
  var APT_COLOR_HIGH = '#8f9fae'; // 고층 (11층+)  - 세련되고 차분한 상부 슬레이트 그레이 (선명한 그레이스케일 계조)

  // 외부 전역(window.APT_FLOOR_COLORS) 설정이 사전에 정의되어 있는 경우 우선 적용
  if (typeof window !== 'undefined' && window.APT_FLOOR_COLORS) {
    if (window.APT_FLOOR_COLORS.low)  APT_COLOR_LOW  = window.APT_FLOOR_COLORS.low;
    if (window.APT_FLOOR_COLORS.mid)  APT_COLOR_MID  = window.APT_FLOOR_COLORS.mid;
    if (window.APT_FLOOR_COLORS.high) APT_COLOR_HIGH = window.APT_FLOOR_COLORS.high;
  }

  // 아파트 저층/중층/고층 3단 그레이스케일 컬러 맵
  var bandColors = {
    low: new THREE.Color(APT_COLOR_LOW),   // 1~5층 저층
    mid: new THREE.Color(APT_COLOR_MID),   // 6~10층 중층
    high: new THREE.Color(APT_COLOR_HIGH)  // 11층+ 고층
  };

  // 층간 화이트 몰딩 슬래브 색상
  var slabColor = new THREE.Color(0xf8fafc);

  // 셀 작화(Cel Outline) 펜선 기본 머티리얼 템플릿 (선명하고 깔끔한 슬레이트 네이비)
  var celLineMat = new THREE.LineBasicMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.55
  });

  var buildings = data3d.buildings || [];
  var complexMinX = 999999, complexMaxX = -999999, complexMinZ = 999999, complexMaxZ = -999999;
  var complexMaxHeight = 30;

  buildings.forEach(function (b) {
    if (!b.rings || !b.rings[0]) return;
    var baseShape = createShapeFromRing(b.rings[0]);
    if (!baseShape) return;

    var totalFloors = b.floors || 15;
    var floorHeight = 2.85;
    var dongKey = b.dong || b.name || "건물";
    var dongList = [];

    var bldgHeight = totalFloors * floorHeight;
    if (bldgHeight > complexMaxHeight) complexMaxHeight = bldgHeight;

    // ★ 건물의 실제 3D 지오메트리 footprint 기반 정밀 중심 좌표 및 단지 바운딩박스 계산 ★
    // 기존 -p.y 부호 반전으로 인한 Z좌표 불일치를 완벽히 수정: 실제 3D 버텍스 좌표계와 100% 동기화
    var sampleGeom = new THREE.ExtrudeGeometry(baseShape, { depth: 0.1, bevelEnabled: false });
    sampleGeom.rotateX(-Math.PI / 2);
    sampleGeom.computeBoundingBox();
    var bBox = sampleGeom.boundingBox;
    var center3DX = (bBox.min.x + bBox.max.x) / 2;
    var center3DZ = (bBox.min.z + bBox.max.z) / 2;

    var spanX = bBox.max.x - bBox.min.x;
    var spanZ = bBox.max.z - bBox.min.z;
    var minSpan = Math.min(spanX, spanZ);
    var approxFootprintArea = spanX * spanZ;

    // ★ [방안 A] 초소형 노이즈/환기탑/경비초소/GIS 기호 등 바닥면적 25㎡ 미만 또는 가로·세로 최소 폭 3.0m 미만 구조물 완전 제거 ★
    // 주거동이나 상가로서의 기능이 없는 초소형 파편 및 바늘탑 원인 구조물을 3D 씬에서 원천 배제합니다.
    if (approxFootprintArea < 25.0 || minSpan < 3.0) {
      sampleGeom.dispose();
      return;
    }

    // ★ [데이터 무결성 방어] 25㎡ 이상 ~ 65㎡ 미만 소형 부속 구조물(경비실, 관리동 등) 바늘탑 방지 보정 ★
    // 정상 주거용 아파트 동은 가로/세로 최소 폭이 6.5m 이상이고 바닥 면적이 65㎡ 이상이어야 합니다.
    // 65㎡ 미만인 소형 구조물에 대장 매칭 오류로 고층이 지정된 경우,
    // 최대 2층으로 강제 보정하고 다중 라인 분할을 해제하여 현실적인 단지 시설물 형태로 렌더링합니다.
    var isAuxiliaryStructure = (approxFootprintArea < 65 || minSpan < 6.5);
    if (isAuxiliaryStructure && totalFloors > 2) {
      totalFloors = Math.min(totalFloors, 2);
      b.lines = [];
      b.residential = false;
      b.selectable = false;
    }

    bldgHeight = totalFloors * floorHeight;
    if (bldgHeight > complexMaxHeight) complexMaxHeight = bldgHeight;

    dongCenters[dongKey] = new THREE.Vector3(center3DX, bldgHeight / 2, center3DZ);
    dongBBoxes[dongKey] = {
      minX: bBox.min.x, maxX: bBox.max.x,
      minZ: bBox.min.z, maxZ: bBox.max.z,
      spanX: spanX,
      spanZ: spanZ
    };

    if (bBox.min.x < complexMinX) complexMinX = bBox.min.x;
    if (bBox.max.x > complexMaxX) complexMaxX = bBox.max.x;
    if (bBox.min.z < complexMinZ) complexMinZ = bBox.min.z;
    if (bBox.max.z > complexMaxZ) complexMaxZ = bBox.max.z;

    sampleGeom.dispose();

    // ★ [핵심 혁신] 라인별 층수 단차 및 호수별(Unit) 3D 분할 압출 시스템 ★
    var lines = Array.isArray(b.lines) ? b.lines.filter(function (l) { return l && l.line; }) : [];
    var cumWeights = [0.0];
    var pca = null;
    var basePts = baseShape.transformedPts || [];

    if (lines.length > 0) {
      var fMax = -1;
      lines.forEach(function (l) {
        var lf = l.floorMax || totalFloors;
        if (lf > fMax) fMax = lf;
      });
      if (fMax > 0) {
        totalFloors = Math.max(totalFloors, fMax);
      }
      bldgHeight = totalFloors * floorHeight;

      // 라인별 면적 가중치 계산 (supply > exclusive > 1.0)
      var totalW = 0;
      var lineWeights = [];
      lines.forEach(function (l) {
        var w = l.supply || l.exclusive || 1.0;
        lineWeights.push(w);
        totalW += w;
      });
      if (totalW > 0) {
        var curCum = 0;
        for (var li = 0; li < lines.length; li++) {
          curCum += lineWeights[li] / totalW;
          cumWeights.push(curCum);
        }
        cumWeights[cumWeights.length - 1] = 1.0;
      }
      pca = computePolygonPCA(basePts);
    }

    dongTotalFloors[dongKey] = totalFloors;

    // 각 라인별 2D 슬라이스 형상 및 ExtrudeGeometry 사전 생성 (동일 라인은 층간 지오메트리 공유로 극강의 렌더링 성능 확보)
    var sliceHeight = floorHeight - 0.22;
    var lineGeomCache = [];
    var lineEdgesCache = [];

    if (lines.length > 1 && basePts.length >= 3 && pca) {
      for (var li = 0; li < lines.length; li++) {
        var tMin = cumWeights[li];
        var tMax = cumWeights[li + 1];
        var sA = pca.sMin + tMin * pca.L;
        var sB = pca.sMin + tMax * pca.L;
        var clipped = clipPolygonWithSlab(basePts, pca.ux, pca.uy, sA, sB);
        if (clipped && clipped.length >= 3) {
          var sShape = createShapeFromPts(clipped);
          var sGeom = new THREE.ExtrudeGeometry(sShape, {
            depth: sliceHeight,
            bevelEnabled: true,
            bevelSegments: 1,
            steps: 1,
            bevelSize: 0.08,
            bevelThickness: 0.08
          });
          sGeom.rotateX(-Math.PI / 2);
          lineGeomCache.push(sGeom);
          lineEdgesCache.push(new THREE.EdgesGeometry(sGeom, 26));
        } else {
          lineGeomCache.push(null);
          lineEdgesCache.push(null);
        }
      }
    } else {
      var singleGeom = new THREE.ExtrudeGeometry(baseShape, {
        depth: sliceHeight,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.08,
        bevelThickness: 0.08
      });
      singleGeom.rotateX(-Math.PI / 2);
      lineGeomCache.push(singleGeom);
      lineEdgesCache.push(new THREE.EdgesGeometry(singleGeom, 26));
    }

    for (var f = 1; f <= totalFloors; f++) {
      var band = 'mid';
      var bandLabel = '중층';
      if (f <= 5) {
        band = 'low';
        bandLabel = '저층';
      } else if (f >= 11) {
        band = 'high';
        bandLabel = '고층';
      }
      var baseColor = bandColors[band].clone();

      if (lines.length > 1 && pca) {
        for (var li = 0; li < lines.length; li++) {
          var lineObj = lines[li];
          var lineMin = lineObj.floorMin || 1;
          var lineMax = lineObj.floorMax || totalFloors;
          if (f < lineMin || f > lineMax) continue; // 해당 라인은 이 층에 존재하지 않음 (단차 자동 반영)

          var geom = lineGeomCache[li];
          var edgesGeom = lineEdgesCache[li];
          if (!geom) continue;

          var lineNum = parseInt(lineObj.line, 10);
          var hoName = f + ('0' + lineNum).slice(-2) + '호';
          var mat = new THREE.MeshStandardMaterial({
            color: baseColor.clone(),
            roughness: 0.42,
            metalness: 0.06
          });

          var unitMesh = new THREE.Mesh(geom, mat);
          unitMesh.position.y = (f - 1) * floorHeight;
          unitMesh.castShadow = true;
          unitMesh.receiveShadow = true;

          unitMesh.userData = {
            dong: dongKey,
            dongName: b.name || dongKey,
            floor: f,
            line: lineObj.line,
            lineNum: lineNum,
            lineIndex: li,
            hoName: hoName,
            supply: lineObj.supply,
            exclusive: lineObj.exclusive,
            totalFloors: totalFloors,
            band: band,
            bandLabel: bandLabel,
            baseColor: baseColor,
            isFloor: true,
            isUnit: true,
            lineDesc: hoName
          };

          scene.add(unitMesh);
          interactiveFloors.push(unitMesh);
          dongList.push(unitMesh);

          var line = new THREE.LineSegments(edgesGeom, celLineMat.clone());
          line.position.copy(unitMesh.position);
          scene.add(line);
          unitMesh.userData.edgeLine = line;
        }
      } else {
        var geom = lineGeomCache[0];
        var edgesGeom = lineEdgesCache[0];
        var mat = new THREE.MeshStandardMaterial({
          color: baseColor.clone(),
          roughness: 0.42,
          metalness: 0.06
        });
        var floorMesh = new THREE.Mesh(geom, mat);
        floorMesh.position.y = (f - 1) * floorHeight;
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;

        var hoName = f + '01호';
        floorMesh.userData = {
          dong: dongKey,
          dongName: b.name || dongKey,
          floor: f,
          line: '01',
          lineNum: 1,
          lineIndex: 0,
          hoName: hoName,
          totalFloors: totalFloors,
          band: band,
          bandLabel: bandLabel,
          baseColor: baseColor,
          isFloor: true,
          isUnit: true,
          lineDesc: hoName
        };

        scene.add(floorMesh);
        interactiveFloors.push(floorMesh);
        dongList.push(floorMesh);

        var line = new THREE.LineSegments(edgesGeom, celLineMat.clone());
        line.position.copy(floorMesh.position);
        scene.add(line);
        floorMesh.userData.edgeLine = line;
      }
    }

    dongMeshes[dongKey] = dongList;

    // ★ 동 호수 배지: 투명한 프로스트 글래스모피즘 HUD 배지 (주거동 위주로 정갈하게 배치) ★
    var isResidential = b.residential !== false && !dongKey.includes('근린생활') && !dongKey.includes('상가') && !isAuxiliaryStructure;
    if (isResidential) {
      var canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 72;
      var ctx = canvas.getContext('2d');

      // 라운드 글래스 필
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(4, 4, 172, 64, 18);
        ctx.fill();
      } else {
        ctx.fillRect(4, 4, 172, 64);
      }
      // 스카이블루 아웃라인
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#38bdf8';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(4, 4, 172, 64, 18);
        ctx.stroke();
      } else {
        ctx.strokeRect(4, 4, 172, 64);
      }

      // 딥 네이비 타이포그래피
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 28px "Spoqa Han Sans Neo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dongKey, 90, 36);

      var spriteMap = new THREE.CanvasTexture(canvas);
      spriteMap.encoding = THREE.sRGBEncoding;
      var spriteMat = new THREE.SpriteMaterial({
        map: spriteMap,
        depthTest: true, // 깊이 테스트 활성화: 원거리 건물의 배지가 전방 건물을 뚫고 잘못 투과되어 보이는 현상 방지
        depthWrite: false
      });
      var sprite = new THREE.Sprite(spriteMat);
      // 건물의 실제 옥상 상단(bldgHeight) 바로 위에 일치하도록 배치
      sprite.position.set(dongCenters[dongKey].x, bldgHeight + 5.5, dongCenters[dongKey].z);
      sprite.scale.set(16, 6.4, 1);
      sprite.userData = { isDongLabel: true, dongKey: dongKey };
      scene.add(sprite);
    }
  });

  // --- 8. 시네마틱 버드아이 조감 앵글 (Grand Anime Vista) ---
  // 화면 상단 50%에 찬란한 신카이 구름 하늘과 태양이 웅장하게 펼쳐지고, 하단 50%에 아파트 단지가 당당하게 솟아오르는 신카이 마코토 시그니처 앵글
  var defaultCamPos = new THREE.Vector3();
  var defaultTarget = new THREE.Vector3();
  var complexCenterX = 0, complexCenterZ = 0, complexMaxSpan = 250;

  if (complexMinX < complexMaxX && complexMinZ < complexMaxZ) {
    complexCenterX = (complexMinX + complexMaxX) / 2;
    complexCenterZ = (complexMinZ + complexMaxZ) / 2;
    var spanX = complexMaxX - complexMinX;
    var spanZ = complexMaxZ - complexMinZ;
    complexMaxSpan = Math.max(spanX, spanZ, 250);

    // 타겟: 단지 중간 높이 (하늘과 단지의 완벽한 수평선 균형)
    defaultTarget.set(complexCenterX, complexMaxHeight * 0.45, complexCenterZ);

    // 카메라: 완만한 12~16도 로우-미드 조감도 -> 단지 전체와 주변 조경이 여유롭게 들어오도록 원거리 조망 (새로고침 디폴트 뷰 확장)
    var camDist = complexMaxSpan * 1.35; // 기존 0.85 -> 1.35로 시원하게 확장
    var camHeight = complexMaxHeight * 1.45 + 30; // 스케일에 맞는 안정적인 고도
    defaultCamPos.set(complexCenterX + camDist * 0.65, camHeight, complexCenterZ + camDist * 0.80);

    controls.target.copy(defaultTarget);
    camera.position.copy(defaultCamPos);
    camera.lookAt(controls.target);
    controls.update();
  }

  // --- 8-1. Constant Screen-Size Camera-Facing 2D Billboards (Method 1) ---
  // 카메라 거리(Zoom) 및 각도와 무관하게 항상 카메라 정면을 바라보며 화면 픽셀 크기를 일정하게 유지하는 고해상도 2D 빌보드 라벨 시스템
  var constantScreenBillboards = [];
  function registerConstantScreenBillboard(sprite, baseHeightPx, aspect) {
    if (!sprite) return;
    constantScreenBillboards.push({
      sprite: sprite,
      baseHeightPx: baseHeightPx || 34,
      aspect: aspect || 4.0
    });
  }

  // --- 8-B. 아파트 중심 기준 생활권 반경원 (250m, 500m, 1km 동심원) ---
  var radiusRingsGroup = new THREE.Group();
  radiusRingsGroup.name = "radiusRingsGroup";
  scene.add(radiusRingsGroup);

  var RADIUS_CONFIGS = [
    {
      radius: 250,
      label: '250m (도보 3분)',
      colorHex: 0xE43B46, // 리얼랭커스 시그니처 레드 (도보 초근접 생활권)
      ringWidth: 1.8,     // 1px 더 또렷하고 굵은 링 라인
      opacity: 0.78
    },
    {
      radius: 500,
      label: '500m (도보 7분)',
      colorHex: 0xE43B46, // 전 반경원 통일 레드 (#E43B46)
      ringWidth: 2.2,     // 1px 더 또렷하고 굵은 링 라인
      opacity: 0.72
    },
    {
      radius: 1000,
      label: '1km (도보 15분)',
      colorHex: 0xE43B46, // 전 반경원 통일 레드 (#E43B46)
      ringWidth: 3.2,     // 1px 더 또렷하고 굵은 링 라인
      opacity: 0.68
    }
  ];

  RADIUS_CONFIGS.forEach(function (cfg) {
    // 1) 3D 수평 원형 링 메시 (바닥 지반 y=0.38에 완벽 밀착)
    var ringGeom = new THREE.RingGeometry(cfg.radius - cfg.ringWidth / 2, cfg.radius + cfg.ringWidth / 2, 144);
    var ringMat = new THREE.MeshBasicMaterial({
      color: cfg.colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: cfg.opacity,
      depthWrite: false
    });
    var ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(complexCenterX, 0.38, complexCenterZ);
    radiusRingsGroup.add(ringMesh);

    // 2) 2D 빌보드 거리 배지 (동남쪽 135도 각도 상에 일목요연하게 배치)
    var angleRad = (135 * Math.PI) / 180;
    var badgeX = complexCenterX + Math.cos(angleRad) * cfg.radius;
    var badgeZ = complexCenterZ + Math.sin(angleRad) * cfg.radius;

    var canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 72;
    var ctx = canvas.getContext('2d');

    // 라운드 글래스 배경
    ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(4, 4, 272, 64, 18);
      ctx.fill();
    } else {
      ctx.fillRect(4, 4, 272, 64);
    }
    // 컬러 테두리 (1px 굵게 강조)
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#E43B46';
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(4, 4, 272, 64, 18);
      ctx.stroke();
    } else {
      ctx.strokeRect(4, 4, 272, 64);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Spoqa Han Sans Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('반경 ' + cfg.label, 140, 36);

    var spriteMap = new THREE.CanvasTexture(canvas);
    spriteMap.encoding = THREE.sRGBEncoding;
    var spriteMat = new THREE.SpriteMaterial({
      map: spriteMap,
      depthTest: false,
      depthWrite: false
    });
    var badgeSprite = new THREE.Sprite(spriteMat);
    badgeSprite.position.set(badgeX, 1.2, badgeZ);
    badgeSprite.scale.set(22, 5.6, 1);
    radiusRingsGroup.add(badgeSprite);

    registerConstantScreenBillboard(badgeSprite, 30, 280 / 72);
  });

  // --- 8. 주변 입지 인프라 3D 시각화 (초등학교, 중학교, 백화점/몰, 마트, 지하철역, 상권, 학원가, 병원, 공원, 은행, 주변건물 11종 세분화) ---
  var infraGroups = {
    elementary: new THREE.Group(),
    middle: new THREE.Group(),
    dept_mall: new THREE.Group(),
    mart: new THREE.Group(),
    subway: new THREE.Group(),
    commercial: new THREE.Group(),
    academy: new THREE.Group(),
    hospital: new THREE.Group(),
    park: new THREE.Group(),
    bank: new THREE.Group(),
    neighbors: neighborGroup
  };
  infraGroups.elementary.name = "infra_elementary";
  infraGroups.middle.name = "infra_middle";
  infraGroups.dept_mall.name = "infra_dept_mall";
  infraGroups.mart.name = "infra_mart";
  infraGroups.subway.name = "infra_subway";
  infraGroups.commercial.name = "infra_commercial";
  infraGroups.academy.name = "infra_academy";
  infraGroups.hospital.name = "infra_hospital";
  infraGroups.park.name = "infra_park";
  infraGroups.bank.name = "infra_bank";

  scene.add(infraGroups.elementary);
  scene.add(infraGroups.middle);
  scene.add(infraGroups.dept_mall);
  scene.add(infraGroups.mart);
  scene.add(infraGroups.subway);
  scene.add(infraGroups.commercial);
  scene.add(infraGroups.academy);
  scene.add(infraGroups.hospital);
  scene.add(infraGroups.park);
  scene.add(infraGroups.bank);

  function toWorldPos(v1, v2) {
    var lat, lng;
    if (v1 > 100) {
      lng = v1; lat = v2;
    } else {
      lat = v1; lng = v2;
    }
    var p = toLocalXY(lng, lat);
    return new THREE.Vector3(p.x, 0, -p.y);
  }

  function getDistanceString(worldVec) {
    var d = Math.round(Math.sqrt(worldVec.x * worldVec.x + worldVec.z * worldVec.z));
    return d >= 1000 ? (d / 1000).toFixed(1) + 'km' : d + 'm';
  }

  // ★ 3D 표시되는 반경 밖의 시설물은 씬에 표시하지 않음 (지반 원형 반경 기준 필터) ★
  function isWithinVisibleRadius(worldVec) {
    if (!worldVec) return false;
    var dSq = worldVec.x * worldVec.x + worldVec.z * worldVec.z;
    return dSq <= (groundRadius * groundRadius);
  }

  // --- 8-1. 고해상도 레티나 2D 필(Pill) 라벨 뱃지 캔버스 텍스처 생성기 (명칭 + 연회색 거리/상세) ---
  // 3) 이름표의 우측 거리표시가 있는 경우: 박스 제거하고 이름과 동일한 35px 크기의 연회색(#cbd5e1) 글자만 기재
  // 4) 전체 이름표 좌측의 원형 아이콘 삭제, 이름표 폰트크기 35px
  function createPillBadgeCanvas(icon, title, distStr, borderColor, bgColor) {
    var hasDist = !!distStr;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var fontStyle = 'bold 35px "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.font = fontStyle;

    var displayTitle = title || '';
    var titleMetrics = ctx.measureText(displayTitle);
    var distMetrics = hasDist ? ctx.measureText(distStr) : { width: 0 };

    if (hasDist) {
      // 명칭 + 18px 간격 + 거리 + 좌우 여백(24px씩) + 캔버스 마진(16px)
      var idealW = Math.ceil(titleMetrics.width + 18 + distMetrics.width + 48 + 16);
      canvas.width = Math.max(280, Math.min(520, idealW));
    } else {
      // 명칭 단독 (거리 없음, 예: 주요 학원가, 상권 밀집구역)
      var idealW = Math.ceil(titleMetrics.width + 56 + 16);
      canvas.width = Math.max(220, Math.min(420, idealW));
    }
    canvas.height = 110;

    var borderCol = borderColor || '#38bdf8';
    var bgCol = bgColor || 'rgba(15, 23, 42, 0.94)';

    // 1. 부드러운 외곽 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // 2. 메인 필(Pill) 바디
    ctx.fillStyle = bgCol;
    ctx.beginPath();
    var pillWidth = canvas.width - 16;
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(8, 8, pillWidth, 94, 22);
    } else {
      ctx.rect(8, 8, pillWidth, 94);
    }
    ctx.fill();

    // 그림자 리셋
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 외곽 테두리
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 텍스트 스타일 재지정 (캔버스 크기 재할당 후 복원)
    ctx.font = fontStyle;
    ctx.textBaseline = 'middle';

    if (hasDist) {
      // ★ 3) 우측 거리표시: 박스 제거하고 이름과 동일한 35px 크기의 연회색(#cbd5e1) 글자만 우측 정렬 기재 ★
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'right';
      ctx.fillText(distStr, canvas.width - 24, 56);

      // 4. 좌측 명칭 텍스트 (거리 텍스트와 겹치지 않도록 동적 자르기)
      var rightDistW = ctx.measureText(distStr).width;
      var maxTitleW = (canvas.width - 24 - rightDistW - 16) - 24;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      while (ctx.measureText(displayTitle).width > maxTitleW && displayTitle.length > 2) {
        displayTitle = displayTitle.slice(0, -2) + '…';
      }
      ctx.fillText(displayTitle, 24, 56);
    } else {
      // 거리 표시가 없는 경우 (주요학원가, 상권밀집구역 등): 중앙 정렬
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      var maxTitleWNoDist = canvas.width - 48;
      while (ctx.measureText(displayTitle).width > maxTitleWNoDist && displayTitle.length > 2) {
        displayTitle = displayTitle.slice(0, -2) + '…';
      }
      ctx.fillText(displayTitle, canvas.width / 2, 56);
    }

    return canvas;
  }

  // 3D 플로팅 명칭 라벨 (카메라 정면 응시 + 화면 크기 일정 유지 2D 빌보드 스프라이트)
  function createFloatingLabel(icon, title, subText, borderColor, bgColor) {
    var canvas = createPillBadgeCanvas(icon, title, subText, borderColor, bgColor);
    var texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    var mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    var sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 999;
    var aspect = canvas.width / canvas.height;
    sprite.scale.set(10 * aspect, 10, 1);

    // 카메라 거리와 무관하게 화면상 일정 크기 유지 등록
    registerConstantScreenBillboard(sprite, 34, aspect);
    return sprite;
  }

  // 1. 학교 절차적 3D 모델링 (본관 4개층 교실창문 멀리언 + 강당 아치형 볼트지붕 + 연결통로 + 시계탑 & 국기게양대)
  function createSchool3DModel(name, distStr) {
    var group = new THREE.Group();

    // 캠퍼스 바닥 포디움
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
    var groundPlinth = new THREE.Mesh(new THREE.BoxGeometry(58, 0.6, 38), groundMat);
    groundPlinth.position.y = 0.3;
    groundPlinth.receiveShadow = true;
    group.add(groundPlinth);

    // 본관 외벽 매스 (따뜻한 학교 크림 벽돌톤)
    var brickMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // 따뜻한 연노랑 크림 벽돌
      roughness: 0.65,
      metalness: 0.05
    });
    var mainBody = new THREE.Mesh(new THREE.BoxGeometry(38, 16, 15), brickMat);
    mainBody.position.set(-6, 8.3, 0);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    // 본관 4개 층 교실 창문 리본 & 창문 격자 멀리언
    var winMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.88
    });
    var mullionMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    for (var f = 0; f < 4; f++) {
      var fy = 3.2 + f * 3.6;
      // 전면 창문띠
      var winFront = new THREE.Mesh(new THREE.BoxGeometry(35, 1.8, 0.5), winMat);
      winFront.position.set(-6, fy, 7.6);
      group.add(winFront);

      // 창문 세로 멀리언 기둥 (교실 창문 격자 분할)
      for (var col = -5; col <= 5; col++) {
        var mullion = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.85, 0.6), mullionMat);
        mullion.position.set(-6 + col * 3.2, fy, 7.65);
        group.add(mullion);
      }

      // 후면 창문띠
      var winBack = new THREE.Mesh(new THREE.BoxGeometry(35, 1.8, 0.5), winMat);
      winBack.position.set(-6, fy, -7.6);
      group.add(winBack);
    }

    // 본관 옥상 난간 (Parapet) & 테라코타 몰딩
    var parapetMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.5 });
    var parapet = new THREE.Mesh(new THREE.BoxGeometry(39, 1.0, 16), parapetMat);
    parapet.position.set(-6, 16.8, 0);
    group.add(parapet);

    // 주출입구 포티코 & 캐노피 (Entrance Canopy with Columns)
    var canopyMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3 });
    var canopy = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 4.5), canopyMat);
    canopy.position.set(-6, 4.5, 9.5);
    canopy.castShadow = true;
    group.add(canopy);

    var colMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    var colLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.8, 12), colMat);
    colLeft.position.set(-9.5, 2.3, 10.8);
    group.add(colLeft);
    var colRight = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.8, 12), colMat);
    colRight.position.set(-2.5, 2.3, 10.8);
    group.add(colRight);

    // 체육관 / 강당 별관 (Gymnasium with Curved Barrel-Vault Roof)
    var gymMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.55 });
    var gymBody = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 22), gymMat);
    gymBody.position.set(22, 5.3, 0);
    gymBody.castShadow = true;
    gymBody.receiveShadow = true;
    group.add(gymBody);

    // 강당 둥근 아치형 지붕 (Cylinder Half-Shell)
    var archRoofGeom = new THREE.CylinderGeometry(11.2, 11.2, 18.2, 24, 1, false, 0, Math.PI);
    archRoofGeom.rotateZ(Math.PI / 2);
    archRoofGeom.rotateY(Math.PI / 2);
    var archRoofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2 });
    var gymRoof = new THREE.Mesh(archRoofGeom, archRoofMat);
    gymRoof.position.set(22, 10.3, 0);
    gymRoof.castShadow = true;
    group.add(gymRoof);

    // 2층 연결 통로 (Skybridge Corridor)
    var bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    var bridge = new THREE.Mesh(new THREE.BoxGeometry(6, 3.8, 4), bridgeMat);
    bridge.position.set(11, 7.5, 0);
    group.add(bridge);

    // 중앙 시계탑 (Clock Tower & Spire)
    var towerBody = new THREE.Mesh(new THREE.BoxGeometry(5.5, 8.5, 5.5), brickMat);
    towerBody.position.set(-16, 20.5, 0);
    towerBody.castShadow = true;
    group.add(towerBody);

    // 시계 다이얼 (Clock Dials - Front & Back)
    var dialMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var dialRimMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    var dialFront = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 16), dialMat);
    dialFront.rotateX(Math.PI / 2);
    dialFront.position.set(-16, 22, 2.8);
    group.add(dialFront);
    var rimFront = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.15, 8, 24), dialRimMat);
    rimFront.position.set(-16, 22, 2.9);
    group.add(rimFront);

    // 시계탑 피라미드 박공지붕
    var steepleGeom = new THREE.ConeGeometry(4.2, 5.5, 4);
    steepleGeom.rotateY(Math.PI / 4);
    var steeple = new THREE.Mesh(steepleGeom, parapetMat);
    steeple.position.set(-16, 27.5, 0);
    steeple.castShadow = true;
    group.add(steeple);

    // 깃대 & 학교 깃발
    var poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.5, 8), poleMat);
    pole.position.set(-16, 31.5, 0);
    group.add(pole);

    var flagMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide });
    var flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), flagMat);
    flag.position.set(-14.8, 32.5, 0);
    group.add(flag);

    // 플로팅 라벨 (시계탑 최상단 위로 여유 있게 배치)
    var label = createFloatingLabel('🏫', name, distStr, '#38bdf8');
    label.position.set(0, 42, 0);
    group.add(label);

    return group;
  }

  // 2. 대형병원 절차적 3D 모델링 (트윈 메디컬 타워 + 글래스 아트리움 + 헬리패드 + 응급센터)
  function createHospital3DModel(name, distStr) {
    var group = new THREE.Group();

    // 병원 단지 베이스
    var baseMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    var basePlinth = new THREE.Mesh(new THREE.BoxGeometry(50, 0.6, 38), baseMat);
    basePlinth.position.y = 0.3;
    basePlinth.receiveShadow = true;
    group.add(basePlinth);

    // 1~3층 포디움 & 응급의료센터(ER) 진입부
    var hospWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
    var podium = new THREE.Mesh(new THREE.BoxGeometry(44, 9, 32), hospWhiteMat);
    podium.position.y = 4.8;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    // 응급센터 빨간색 캐노피 (Emergency Bay Canopy)
    var erMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    var erCanopy = new THREE.Mesh(new THREE.BoxGeometry(14, 1.0, 6), erMat);
    erCanopy.position.set(12, 4.8, 17);
    group.add(erCanopy);

    // 메인 고층 병동 타워 (Main Ward Tower)
    var towerBody = new THREE.Mesh(new THREE.BoxGeometry(26, 26, 20), hospWhiteMat);
    towerBody.position.set(-4, 21, 0);
    towerBody.castShadow = true;
    towerBody.receiveShadow = true;
    group.add(towerBody);

    // 중앙 수직 아쿠아 글래스 커튼월 (Vertical Glass Spine)
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85
    });
    var glassSpine = new THREE.Mesh(new THREE.BoxGeometry(12, 28, 20.8), glassMat);
    glassSpine.position.set(-4, 20, 0);
    group.add(glassSpine);

    // 옥상 헬리패드 데크 (Helipad Deck with Elevated Pillars)
    var heliDeckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    var helipad = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 0.8, 32), heliDeckMat);
    helipad.position.set(-4, 34.5, 0);
    group.add(helipad);

    // 헬리패드 원형 옐로우 서클 및 H 마크
    var hRingMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    var hRing = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.8, 32), hRingMat);
    hRing.rotateX(-Math.PI / 2);
    hRing.position.set(-4, 34.95, 0);
    group.add(hRing);

    // 붉은 십자 메디컬 엠블럼 (+)
    var crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    var crossV = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.2, 0.3), crossMat);
    crossV.position.set(-4, 30.5, 10.6);
    group.add(crossV);
    var crossH = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.2, 0.3), crossMat);
    crossH.position.set(-4, 30.5, 10.6);
    group.add(crossH);

    var label = createFloatingLabel('🏥', name, distStr, '#10b981');
    label.position.set(0, 46, 0);
    group.add(label);

    return group;
  }

  // 3. 마트 및 복합몰 절차적 3D 모델링 (1층 글래스 쇼윈도 + 브랜드 패널 + 대형 캐노피 + 옥상공조설비 + 자립형 사인타워)
  function createMart3DModel(name, distStr, isMall) {
    var group = new THREE.Group();

    // 쇼핑몰 대지 베이스
    var plazaMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    var plaza = new THREE.Mesh(new THREE.BoxGeometry(56, 0.6, 44), plazaMat);
    plaza.position.y = 0.3;
    plaza.receiveShadow = true;
    group.add(plaza);

    // 1층 전면 투명 글래스 로비 & 쇼윈도 (Ground Floor Glazed Shopfronts)
    var glassLobbyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.35,
      transparent: true,
      opacity: 0.85
    });
    var lobby = new THREE.Mesh(new THREE.BoxGeometry(44, 4.5, 30), glassLobbyMat);
    lobby.position.y = 2.5;
    group.add(lobby);

    // 쇼윈도 기둥 프레임 (Glass Divider Mullions)
    var mullionMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    for (var m = -4; m <= 4; m++) {
      var mul = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 0.6), mullionMat);
      mul.position.set(m * 4.8, 2.5, 15.2);
      group.add(mul);
    }

    // 2~3층 대형 복합 매스 (상징 컬러 패널링: 몰은 세련된 인디고/바이올렛, 마트는 비비드 오렌지/옐로우)
    var mainPanelMat = new THREE.MeshStandardMaterial({
      color: isMall ? 0x4f46e5 : 0xf97316,
      roughness: 0.45,
      metalness: 0.15
    });
    var upperBody = new THREE.Mesh(new THREE.BoxGeometry(42, 11, 28), mainPanelMat);
    upperBody.position.y = 10.2;
    upperBody.castShadow = true;
    upperBody.receiveShadow = true;
    group.add(upperBody);

    // 전면 브랜드 시그니처 띠 & 대형 로고 패널 (Brand Banner Strip)
    var brandBannerMat = new THREE.MeshStandardMaterial({
      color: isMall ? 0x312e81 : 0xdc2626,
      roughness: 0.3
    });
    var brandBanner = new THREE.Mesh(new THREE.BoxGeometry(32, 2.8, 0.8), brandBannerMat);
    brandBanner.position.set(0, 11.5, 14.4);
    group.add(brandBanner);

    // 수평 LED 액센트 밴드 (Horizontal Glowing Trim Band)
    var accentMat = new THREE.MeshStandardMaterial({
      color: isMall ? 0x38bdf8 : 0xfde047,
      emissive: isMall ? 0x0284c7 : 0xeab308,
      emissiveIntensity: 0.45,
      roughness: 0.2
    });
    var trimBand = new THREE.Mesh(new THREE.BoxGeometry(43, 0.8, 28.8), accentMat);
    trimBand.position.y = 15.8;
    group.add(trimBand);

    // 웅장한 돌출 입구 캐노피 (Grand Entrance Portal & Glass Canopy)
    var canopyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    var canopyPortal = new THREE.Mesh(new THREE.BoxGeometry(22, 4.0, 7), canopyMat);
    canopyPortal.position.set(0, 4.5, 17);
    canopyPortal.castShadow = true;
    group.add(canopyPortal);

    var canopyGlass = new THREE.Mesh(new THREE.BoxGeometry(20, 0.6, 8), glassLobbyMat);
    canopyGlass.position.set(0, 5.0, 18.5);
    group.add(canopyGlass);

    // 옥상 설비 (HVAC 공조기 유닛 & 환기 칠러 팬)
    var hvacMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    var hvac1 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), hvacMat);
    hvac1.position.set(-10, 17.2, 4);
    group.add(hvac1);
    // 직사각형 옥상 배기 그릴 박스 (원형 오브젝트 제거)
    var ventGrille = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 2.6), accentMat);
    ventGrille.position.set(-10, 18.8, 4);
    group.add(ventGrille);

    var hvac2 = new THREE.Mesh(new THREE.BoxGeometry(7, 3.5, 6), hvacMat);
    hvac2.position.set(8, 17.5, -4);
    group.add(hvac2);

    // 입구 측면 자립형 사각 폴사인 타워 (원형 기둥 -> 사각 기둥 기하구조로 변경)
    var pylonPoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
    var pylonPole = new THREE.Mesh(new THREE.BoxGeometry(1.4, 22, 1.4), pylonPoleMat);
    pylonPole.position.set(24, 11, 16);
    pylonPole.castShadow = true;
    group.add(pylonPole);

    var signBoxMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: isMall ? 0x818cf8 : 0xfbbf24,
      emissiveIntensity: 0.4,
      roughness: 0.2
    });
    var signBox = new THREE.Mesh(new THREE.BoxGeometry(7.5, 7.5, 2.5), signBoxMat);
    signBox.position.set(24, 20, 16);
    signBox.castShadow = true;
    group.add(signBox);

    var label = createFloatingLabel(isMall ? '🏬' : '🛒', name, distStr, isMall ? '#818cf8' : '#f59e0b');
    label.position.set(0, 38, 0);
    group.add(label);

    return group;
  }

  // 4. 백화점 절차적 3D 모델링 (연갈색 계열 대리석 + 1.3배 높이 파사드 + 수직 사각 핀 루버 + 스텝 펜트하우스 크라운)
  function createDeptStore3DModel(name, distStr) {
    var group = new THREE.Group();

    // 럭셔리 대리석 단지 베이스
    var plazaMat = new THREE.MeshStandardMaterial({ color: 0xede8e1, roughness: 0.6 });
    var plaza = new THREE.Mesh(new THREE.BoxGeometry(58, 0.6, 48), plazaMat);
    plaza.position.y = 0.3;
    plaza.receiveShadow = true;
    group.add(plaza);

    // 1층 호텔식 드롭오프(Drop-off) & 필로티 포디움 (높이 1.3x 반영: 6.5 -> 8.5)
    var marbleMat = new THREE.MeshStandardMaterial({ color: 0xf5ede3, roughness: 0.35, metalness: 0.05 });
    var basePodium = new THREE.Mesh(new THREE.BoxGeometry(46, 8.5, 36), marbleMat);
    basePodium.position.y = 4.25;
    basePodium.castShadow = true;
    basePodium.receiveShadow = true;
    group.add(basePodium);

    // 전면 드롭오프 대리석 사각 열주 (Colonnade Square Pillars - 원형 기둥 제거 및 사각 기둥 적용)
    var colMat = new THREE.MeshStandardMaterial({ color: 0xe6dacb, roughness: 0.3, metalness: 0.1 });
    for (var c = -3; c <= 3; c++) {
      var pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8.5, 1.2), colMat);
      pillar.position.set(c * 6, 4.25, 18.5);
      pillar.castShadow = true;
      group.add(pillar);
    }

    // 웅장한 웜 브론즈 & 글래스 입구 캐노피 (Grand Warm Bronze Canopy)
    var bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xb48b50,
      metalness: 0.65,
      roughness: 0.25,
      emissive: 0x5c3d18,
      emissiveIntensity: 0.2
    });
    var canopy = new THREE.Mesh(new THREE.BoxGeometry(26, 1.0, 9), bronzeMat);
    canopy.position.set(0, 7.5, 20);
    canopy.castShadow = true;
    group.add(canopy);

    // 2~6층 백화점 본체 매스 (1.3배 높이: 22 -> 29, 고급 연갈색 웜 샌드 트래버틴 파사드)
    var facadeMat = new THREE.MeshStandardMaterial({
      color: 0xc4a686, // 품격 있는 웜 샌드 / 연갈색 트래버틴 스톤톤
      roughness: 0.55,
      metalness: 0.12
    });
    var mainBody = new THREE.Mesh(new THREE.BoxGeometry(42, 29, 32), facadeMat);
    mainBody.position.y = 23.0;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    // 전면/후면/측면 수직 핀 루버 (1.3배 높이: 19 -> 25, 웜 브론즈 사각 핀)
    var finMat = new THREE.MeshStandardMaterial({
      color: 0x8c5e34, // 웜 브론즈 / 카라멜 핀 루버
      metalness: 0.5,
      roughness: 0.35
    });
    // 전면 & 후면 핀 루버
    for (var i = -8; i <= 8; i++) {
      var finFront = new THREE.Mesh(new THREE.BoxGeometry(0.45, 25, 0.8), finMat);
      finFront.position.set(i * 2.3, 23.0, 16.4);
      group.add(finFront);

      var finBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 25, 0.8), finMat);
      finBack.position.set(i * 2.3, 23.0, -16.4);
      group.add(finBack);
    }
    // 좌측 & 우측 핀 루버
    for (var j = -6; j <= 6; j++) {
      var finLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 25, 0.45), finMat);
      finLeft.position.set(-21.4, 23.0, j * 2.2);
      group.add(finLeft);

      var finRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 25, 0.45), finMat);
      finRight.position.set(21.4, 23.0, j * 2.2);
      group.add(finRight);
    }

    // 7~8층 스텝백 펜트하우스 (1.3배 높이: 6 -> 8, 딥 모카 에스프레소)
    var setbackMat = new THREE.MeshStandardMaterial({ color: 0x453120, roughness: 0.45 });
    var setbackPenthouse = new THREE.Mesh(new THREE.BoxGeometry(32, 8, 24), setbackMat);
    setbackPenthouse.position.y = 41.5;
    setbackPenthouse.castShadow = true;
    group.add(setbackPenthouse);

    // 옥상 테라스 루프탑 가든 (Sky Garden Green Patch)
    var grassMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 });
    var skyGarden = new THREE.Mesh(new THREE.BoxGeometry(38, 0.4, 28), grassMat);
    skyGarden.position.y = 37.6;
    group.add(skyGarden);

    // 최상단 아트리움 클리어스토리 글래스 크라운 (원형 돔/토러스 링 제거 -> 직사각형 글래스 크라운)
    var crownGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.4
    });
    var crownGlass = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 14), crownGlassMat);
    crownGlass.position.set(0, 48.0, 0);
    crownGlass.castShadow = true;
    group.add(crownGlass);

    // 옥상 상부 정사각형 박스 삭제 요청 반영 완료 (emblemTower 제거)

    // 플로팅 라벨 (최상단 건축물 위로 안정적으로 배치)
    var label = createFloatingLabel('🏬', name, distStr, '#d97706');
    label.position.set(0, 58, 0);
    group.add(label);

    return group;
  }

  // 5. 2D 지상 랜드마크 핀 (카메라 정면 응시 + 화면 크기 일정 유지 2D 빌보드 뱃지 - Method 1)
  function createLandmarkPin3D(icon, title, distStr, colorHex, lineColor) {
    var group = new THREE.Group();

    var col = colorHex || 0x38bdf8;
    var lineCol = lineColor || '#38bdf8';

    // 1) 지면 접지 앵커 링 (Ground Anchor Beacon Ring)
    var ringGeom = new THREE.RingGeometry(1.2, 3.2, 24);
    var ringMat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    group.add(ring);

    // 내부 중심 화이트 점 (Center white beacon dot)
    var dot = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    dot.rotation.x = -Math.PI / 2;
    dot.position.y = 0.22;
    group.add(dot);

    // 2) 수직 앵커 지주 침 (Slim Vertical Anchor Stem)
    var stemH = 14;
    var stemGeom = new THREE.CylinderGeometry(0.35, 0.35, stemH, 8);
    var stemMat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.75
    });
    var stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.y = stemH / 2;
    group.add(stem);

    // 3) 상단 2D 빌보드 라벨 뱃지 (Pill Badge Sprite - Constant Screen Size)
    var canvas = createPillBadgeCanvas(icon, title, distStr, lineCol);
    var texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    var spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    var sprite = new THREE.Sprite(spriteMat);
    sprite.renderOrder = 999;
    sprite.position.y = stemH + 3;
    var aspect = canvas.width / canvas.height;
    sprite.scale.set(10 * aspect, 10, 1);
    group.add(sprite);

    // 카메라 거리와 무관하게 화면상 일정 크기 유지 등록 (Method 1)
    registerConstantScreenBillboard(sprite, 34, aspect);

    return group;
  }

  // 6. 단지-시설 간 지상 보행 연결 점선 (Dashed Polyline)
  function createConnectingDashline(startVec, endVec, colorHex) {
    var curve = new THREE.LineCurve3(
      new THREE.Vector3(startVec.x, 0.4, startVec.z),
      new THREE.Vector3(endVec.x, 0.4, endVec.z)
    );
    var geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
    var mat = new THREE.LineDashedMaterial({
      color: colorHex || 0xec4899,
      linewidth: 3,
      scale: 1,
      dashSize: 8,
      gapSize: 5
    });
    var line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    return line;
  }

  // 7. 지반 위 발광 바닥 폴리곤 구역 (상권 & 학원가)
  function createGroundPolygonArea(coordsLatLng, fillColorHex, strokeColorHex, badgeIcon, badgeTitle, badgeSub) {
    if (!coordsLatLng) return null;
    // GeoJSON Polygon 링 중첩 배열 unwrap: [[[lng, lat], ...]]
    while (Array.isArray(coordsLatLng) && coordsLatLng.length === 1 && Array.isArray(coordsLatLng[0])) {
      coordsLatLng = coordsLatLng[0];
    }
    if (!Array.isArray(coordsLatLng) || coordsLatLng.length < 3) return null;

    var group = new THREE.Group();
    var shape = new THREE.Shape();

    function parseLocalPt(pt) {
      if (!pt || pt.length < 2) return null;
      var a = Number(pt[0]), b = Number(pt[1]);
      if (isNaN(a) || isNaN(b)) return null;
      if (a > 100) {
        return toLocalXY(a, b); // a is lng, b is lat
      } else {
        return toLocalXY(b, a); // b is lng, a is lat
      }
    }

    var validPts = [];
    for (var i = 0; i < coordsLatLng.length; i++) {
      var lp = parseLocalPt(coordsLatLng[i]);
      if (lp) validPts.push(lp);
    }
    if (validPts.length < 3) return null;

    shape.moveTo(validPts[0].x, validPts[0].y);
    var centerLocalX = validPts[0].x;
    var centerLocalZ = -validPts[0].y;

    for (var j = 1; j < validPts.length; j++) {
      shape.lineTo(validPts[j].x, validPts[j].y);
      centerLocalX += validPts[j].x;
      centerLocalZ += -validPts[j].y;
    }
    shape.closePath();

    centerLocalX /= validPts.length;
    centerLocalZ /= validPts.length;

    // ★ 3D 표시되는 반경 밖의 구역은 표시하지 않음 ★
    if (centerLocalX * centerLocalX + centerLocalZ * centerLocalZ > groundRadius * groundRadius) {
      return null;
    }

    var polyGeom = new THREE.ShapeGeometry(shape);
    polyGeom.rotateX(-Math.PI / 2);

    var polyMat = new THREE.MeshBasicMaterial({
      color: fillColorHex,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(polyGeom, polyMat);
    mesh.position.y = 0.25;
    mesh.renderOrder = 1;
    group.add(mesh);

    var edges = new THREE.EdgesGeometry(polyGeom);
    var lineMat = new THREE.LineBasicMaterial({
      color: strokeColorHex,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });
    var line = new THREE.LineSegments(edges, lineMat);
    line.position.y = 0.27;
    line.renderOrder = 2;
    group.add(line);

    if (badgeTitle) {
      // ★ 2) 상권밀집구역, 주요학원가의 하단부에 다른 이름표와 같이 바닥으로 연결되는 선(지주침) 및 접지 링 추가 ★
      var col = new THREE.Color(strokeColorHex);

      // 1) 지면 접지 앵커 링 & 중심 도트 (다른 입간판과 동일 스타일)
      var ringGeom = new THREE.RingGeometry(1.2, 3.2, 24);
      var ringMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });
      var ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(centerLocalX, 0.3, centerLocalZ);
      ring.renderOrder = 3;
      group.add(ring);

      var dot = new THREE.Mesh(
        new THREE.CircleGeometry(1.1, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(centerLocalX, 0.32, centerLocalZ);
      dot.renderOrder = 4;
      group.add(dot);

      // 2) 수직 앵커 지주 침 (Slim Vertical Anchor Stem - 다른 입간판과 동일한 실린더 지주 침)
      var stemH = 30.5;
      var stemGeom = new THREE.CylinderGeometry(0.35, 0.35, stemH, 8);
      var stemMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.85
      });
      var stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.set(centerLocalX, stemH / 2 + 0.3, centerLocalZ);
      stem.renderOrder = 10;
      group.add(stem);

      // 3) 상단 이름표 라벨 (Y=32m, 최상단 renderOrder=999)
      var badge = createFloatingLabel(null, badgeTitle, null, strokeColorHex);
      badge.position.set(centerLocalX, 32, centerLocalZ);
      badge.renderOrder = 999;
      group.add(badge);
    }

    return group;
  }

  // 8. 데이터 적재 및 3D 공간 배치 (11종 세부 레이어 분할 및 3D 반경 내 시설물 필터링)
  function buildSurroundingInfrastructure() {
    var data = aptRankInfo || {};
    var isHeliocity = (data3d.searchCode === '111515' || (data3d.name && data3d.name.indexOf('헬리오') !== -1));

    // A-1. 초등학교 (3D 모델링)
    var pSchoolCoord = data["초등학교좌표"];
    var pSchoolName = data["초등학교명"] || "초등학교";
    if (pSchoolCoord && pSchoolCoord[0] && pSchoolCoord[1]) {
      var pos = toWorldPos(Number(pSchoolCoord[0]), Number(pSchoolCoord[1]));
      if (isWithinVisibleRadius(pos)) {
        var m = createSchool3DModel(pSchoolName, getDistanceString(pos));
        m.position.copy(pos);
        infraGroups.elementary.add(m);

        var dash = createConnectingDashline(new THREE.Vector3(complexCenterX, 0, complexCenterZ), pos, 0x38bdf8);
        infraGroups.elementary.add(dash);
      }
    } else if (isHeliocity) {
      // 헬리오시티 대표 초품아: 가락초, 해누리초
      var hGarakCho = toWorldPos(37.4971, 127.1035);
      if (isWithinVisibleRadius(hGarakCho)) {
        var m1 = createSchool3DModel("서울가락초등학교", getDistanceString(hGarakCho));
        m1.position.copy(hGarakCho);
        infraGroups.elementary.add(m1);
        infraGroups.elementary.add(createConnectingDashline(new THREE.Vector3(complexCenterX, 0, complexCenterZ), hGarakCho, 0x38bdf8));
      }

      var hHaenuriCho = toWorldPos(37.4962, 127.1102);
      if (isWithinVisibleRadius(hHaenuriCho)) {
        var m2 = createSchool3DModel("서울해누리초등학교", getDistanceString(hHaenuriCho));
        m2.position.copy(hHaenuriCho);
        infraGroups.elementary.add(m2);
      }
    }

    // A-2. 중학교 (3D 모델링)
    var mSchoolArr = data["중학교정보"];
    if (mSchoolArr && mSchoolArr.length) {
      mSchoolArr.forEach(function (ms) {
        var mName = ms['중학교명'] || ms['name'];
        var mx = Number(ms['x'] || (ms['yx'] ? ms['yx'][1] : 0));
        var my = Number(ms['y'] || (ms['yx'] ? ms['yx'][0] : 0));
        if (mx && my) {
          var mPos = toWorldPos(my, mx);
          if (isWithinVisibleRadius(mPos)) {
            var scm = createSchool3DModel(mName, getDistanceString(mPos));
            scm.position.copy(mPos);
            infraGroups.middle.add(scm);
          }
        }
      });
    } else if (isHeliocity) {
      var hGarakJung = toWorldPos(37.4988, 127.1158);
      if (isWithinVisibleRadius(hGarakJung)) {
        var ms1 = createSchool3DModel("가락중학교", getDistanceString(hGarakJung));
        ms1.position.copy(hGarakJung);
        infraGroups.middle.add(ms1);
      }

      var hHaenuriJung = toWorldPos(37.4962, 127.1102);
      if (isWithinVisibleRadius(hHaenuriJung)) {
        var ms2 = createSchool3DModel("해누리중학교", getDistanceString(hHaenuriJung));
        ms2.position.copy(hHaenuriJung);
        infraGroups.middle.add(ms2);
      }
    }

    // B-1. 대형마트 (3D 모델링)
    var martArr = data["대형마트정보"];
    if (martArr && martArr.length) {
      martArr.forEach(function (it) {
        if (it[1] && it[1][0] && it[1][1]) {
          var wPos = toWorldPos(Number(it[1][0]), Number(it[1][1]));
          if (isWithinVisibleRadius(wPos)) {
            var mm = createMart3DModel(it[0], getDistanceString(wPos), false);
            mm.position.copy(wPos);
            infraGroups.mart.add(mm);
          }
        }
      });
    } else if (isHeliocity) {
      var hLotteMart = toWorldPos(37.4928, 127.1155);
      if (isWithinVisibleRadius(hLotteMart)) {
        var mm1 = createMart3DModel("롯데마트 송파점", getDistanceString(hLotteMart), false);
        mm1.position.copy(hLotteMart);
        infraGroups.mart.add(mm1);
      }
    }

    // B-2. 백화점 및 복합쇼핑몰 (3D 모델링)
    var deptArr = (data["백화점정보"] || []).concat(data["아울렛몰정보"] || []);
    if (deptArr && deptArr.length) {
      deptArr.forEach(function (it) {
        if (it[1] && it[1][0] && it[1][1]) {
          var dPos = toWorldPos(Number(it[1][0]), Number(it[1][1]));
          if (isWithinVisibleRadius(dPos)) {
            var isMall = (it[0] && (it[0].indexOf('몰') !== -1 || it[0].indexOf('아울렛') !== -1));
            var dm = isMall ? createMart3DModel(it[0], getDistanceString(dPos), true) : createDeptStore3DModel(it[0], getDistanceString(dPos));
            dm.position.copy(dPos);
            infraGroups.dept_mall.add(dm);
          }
        }
      });
    } else if (isHeliocity) {
      var hLotteDept = toWorldPos(37.5139, 127.1006);
      if (isWithinVisibleRadius(hLotteDept)) {
        var dm1 = createDeptStore3DModel("롯데백화점 잠실점", getDistanceString(hLotteDept));
        dm1.position.copy(hLotteDept);
        infraGroups.dept_mall.add(dm1);
      }

      var hGarakMall = toWorldPos(37.4945, 127.1142);
      if (isWithinVisibleRadius(hGarakMall)) {
        var mm2 = createMart3DModel("가락몰 복합유통센터", getDistanceString(hGarakMall), true);
        mm2.position.copy(hGarakMall);
        infraGroups.dept_mall.add(mm2);
      }
    }

    // B-3. 대형병원 / 종합병원 (3D 모델링)
    var bigHospArr = data["종합병원정보"];
    if (bigHospArr && bigHospArr.length) {
      bigHospArr.forEach(function (it) {
        if (it[1] && it[1][0] && it[1][1]) {
          var hPos = toWorldPos(Number(it[1][0]), Number(it[1][1]));
          if (isWithinVisibleRadius(hPos)) {
            var hm = createHospital3DModel(it[0], getDistanceString(hPos));
            hm.position.copy(hPos);
            infraGroups.hospital.add(hm);
          }
        }
      });
    } else if (isHeliocity) {
      var hPoliceHosp = toWorldPos(37.4958, 127.1235);
      if (isWithinVisibleRadius(hPoliceHosp)) {
        var hm1 = createHospital3DModel("국립경찰병원 (종합병원)", getDistanceString(hPoliceHosp));
        hm1.position.copy(hPoliceHosp);
        infraGroups.hospital.add(hm1);
      }
    }

    // C. 지하철역 (2D 입간판 & 보행선)
    var metroCoord = data["역지점좌표"];
    var metroName = data["가까운역이름"] || "지하철역";
    if (metroCoord && metroCoord[0] && metroCoord[1]) {
      var subPos = toWorldPos(Number(metroCoord[0]), Number(metroCoord[1]));
      if (isWithinVisibleRadius(subPos)) {
        var spin = createLandmarkPin3D('🚇', metroName + "역", getDistanceString(subPos), 0xec4899, '#ec4899');
        spin.position.copy(subPos);
        infraGroups.subway.add(spin);

        var sLine = createConnectingDashline(new THREE.Vector3(complexCenterX, 0, complexCenterZ), subPos, 0xec4899);
        infraGroups.subway.add(sLine);
      }
    } else if (isHeliocity) {
      // 헬리오시티 직결 송파역 (8호선)
      var hSongpaStation = toWorldPos(37.4997, 127.1122);
      if (isWithinVisibleRadius(hSongpaStation)) {
        var sp1 = createLandmarkPin3D('🚇', "송파역 (8호선 직결)", getDistanceString(hSongpaStation), 0xec4899, '#f472b6');
        sp1.position.copy(hSongpaStation);
        infraGroups.subway.add(sp1);
        infraGroups.subway.add(createConnectingDashline(new THREE.Vector3(complexCenterX, 0, complexCenterZ), hSongpaStation, 0xec4899));
      }

      // 가락시장역 (3·8호선 환승)
      var hGarakStation = toWorldPos(37.4925, 127.1182);
      if (isWithinVisibleRadius(hGarakStation)) {
        var sp2 = createLandmarkPin3D('🚇', "가락시장역 (3·8호선 환승)", getDistanceString(hGarakStation), 0xf97316, '#fb923c');
        sp2.position.copy(hGarakStation);
        infraGroups.subway.add(sp2);
      }

      // 석촌역 (8·9호선 급행 환승)
      var hSeokchonStation = toWorldPos(37.5054, 127.1069);
      if (isWithinVisibleRadius(hSeokchonStation)) {
        var sp3 = createLandmarkPin3D('🚇', "석촌역 (9호선 급행 환승)", getDistanceString(hSeokchonStation), 0xeab308, '#facc15');
        sp3.position.copy(hSeokchonStation);
        infraGroups.subway.add(sp3);
      }
    }

    // D-1. 공원 (2D 입간판)
    var parkArr = data["공원정보"] || data["대형공원정보"];
    if (parkArr && parkArr.length) {
      parkArr.slice(0, 5).forEach(function (it) {
        if (it[1] && it[1][0] && it[1][1]) {
          var pPos = toWorldPos(Number(it[1][0]), Number(it[1][1]));
          if (isWithinVisibleRadius(pPos)) {
            var pp = createLandmarkPin3D('🌳', it[0], getDistanceString(pPos), 0x10b981, '#34d399');
            pp.position.copy(pPos);
            infraGroups.park.add(pp);
          }
        }
      });
    } else if (isHeliocity) {
      var hTancheon = toWorldPos(37.4948, 127.0988);
      if (isWithinVisibleRadius(hTancheon)) {
        var pp1 = createLandmarkPin3D('🌳', "탄천 수변생태공원", getDistanceString(hTancheon), 0x10b981, '#34d399');
        pp1.position.copy(hTancheon);
        infraGroups.park.add(pp1);
      }

      var hSeokchonLake = toWorldPos(37.5085, 127.1030);
      if (isWithinVisibleRadius(hSeokchonLake)) {
        var pp2 = createLandmarkPin3D('🌲', "석촌호수 (송파나루공원)", getDistanceString(hSeokchonLake), 0x059669, '#10b981');
        pp2.position.copy(hSeokchonLake);
        infraGroups.park.add(pp2);
      }
    }

    // D-2. 은행 (2D 입간판)
    var bankArr = data["은행정보"];
    if (bankArr && bankArr.length) {
      bankArr.slice(0, 4).forEach(function (it) {
        if (it[1] && it[1][0] && it[1][1]) {
          var bPos = toWorldPos(Number(it[1][0]), Number(it[1][1]));
          if (isWithinVisibleRadius(bPos)) {
            var bp = createLandmarkPin3D('🏦', it[0], getDistanceString(bPos), 0x2563eb, '#60a5fa');
            bp.position.copy(bPos);
            infraGroups.bank.add(bp);
          }
        }
      });
    } else if (isHeliocity) {
      var hShinhanBank = toWorldPos(37.4991, 127.1115);
      if (isWithinVisibleRadius(hShinhanBank)) {
        var bp1 = createLandmarkPin3D('🏦', "신한은행 헬리오시티점", getDistanceString(hShinhanBank), 0x2563eb, '#60a5fa');
        bp1.position.copy(hShinhanBank);
        infraGroups.bank.add(bp1);
      }
    }

    // E-1. 상권 바닥 폴리곤 구역 (Ground Polygons)
    var marketAreas = data["상권영역"];
    if (marketAreas && marketAreas.length) {
      marketAreas.forEach(function (poly, idx) {
        var mPoly = createGroundPolygonArea(poly, 0xf59e0b, '#f59e0b', null, '상권 밀집구역', null);
        if (mPoly) infraGroups.commercial.add(mPoly);
      });
    } else if (isHeliocity) {
      var hMarketPoly = [
        [37.4920, 127.1130],
        [37.4958, 127.1120],
        [37.4965, 127.1170],
        [37.4930, 127.1190],
        [37.4918, 127.1160]
      ];
      var mPoly1 = createGroundPolygonArea(hMarketPoly, 0xf59e0b, '#f59e0b', null, "가락몰·송파 중심상권", null);
      if (mPoly1) infraGroups.commercial.add(mPoly1);
    }

    // E-2. 학원가 바닥 폴리곤 구역 (Ground Polygons)
    var academyAreas = data["학원가영역_1km"] || data["학원가영역_300m"];
    if (academyAreas && academyAreas.length) {
      academyAreas.forEach(function (poly, idx) {
        var aPoly = createGroundPolygonArea(poly, 0x3b82f6, '#60a5fa', null, '주요 학원가', null);
        if (aPoly) infraGroups.academy.add(aPoly);
      });
    } else if (isHeliocity) {
      var hAcademyPoly = [
        [37.5015, 127.1085],
        [37.5065, 127.1075],
        [37.5072, 127.1135],
        [37.5020, 127.1145]
      ];
      var aPoly1 = createGroundPolygonArea(hAcademyPoly, 0x3b82f6, '#60a5fa', null, "송파·석촌 학원가", null);
      if (aPoly1) infraGroups.academy.add(aPoly1);
    }
  }

  // 초기 주변 입지 3D 오브젝트 빌드
  buildSurroundingInfrastructure();

  // --- 9. Raycaster & Interactive Hover/Tooltip ---
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2(-999, -999);
  var hoveredFloor = null;
  var activeFocusedDong = 'all';
  var dimColor = new THREE.Color(0xb0b8c4);

  var tooltip = document.getElementById('complex3d_tooltip');
  var ttDong = document.getElementById('complex3d_tt_dong');
  var ttFloor = document.getElementById('complex3d_tt_floor');

  function onMouseMove(event) {
    var rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (tooltip) {
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top = (event.clientY + 14) + 'px';
    }
  }
  container.addEventListener('mousemove', onMouseMove);

  function checkHover() {
    // ★ 창밖 조망 모드에서는 다른 동/층 호버, 롤오버, 툴팁 일체 차단 ★
    if (isPOVMode && currentPOVSubMode === 'outward') {
      if (hoveredFloor) {
        if (hoveredFloor !== activePOVFloor) {
          if (activeFocusedDong && activeFocusedDong !== 'all' && hoveredFloor.userData.dong !== activeFocusedDong) {
            hoveredFloor.material.color.copy(dimColor);
          } else {
            hoveredFloor.material.color.copy(hoveredFloor.userData.baseColor);
          }
          hoveredFloor.material.emissive.setHex(0x000000);
        }
        hoveredFloor = null;
      }
      if (tooltip) tooltip.style.display = 'none';
      if (container) container.style.cursor = isDraggingPOVLook ? 'grabbing' : 'grab';
      return;
    }

    raycaster.setFromCamera(mouse, camera);
    // 2) 특정 동 포커스 시 다른 동들은 마우스 액션 차단: 포커스된 동의 층만 후보로 추출
    var candidateFloors = interactiveFloors;
    if (activeFocusedDong && activeFocusedDong !== 'all') {
      candidateFloors = interactiveFloors.filter(function (m) {
        return m.userData.dong === activeFocusedDong;
      });
    }
    var intersects = raycaster.intersectObjects(candidateFloors);

    if (intersects.length > 0) {
      var hit = intersects[0].object;
      if (hoveredFloor !== hit) {
        if (hoveredFloor && hoveredFloor !== activePOVFloor) {
          if (activeFocusedDong && activeFocusedDong !== 'all' && hoveredFloor.userData.dong !== activeFocusedDong) {
            hoveredFloor.material.color.copy(dimColor);
          } else {
            hoveredFloor.material.color.copy(hoveredFloor.userData.baseColor);
          }
          hoveredFloor.material.emissive.setHex(0x000000);
        }
        hoveredFloor = hit;
        // 호버 시 황금빛 햇살 하이라이트 발광
        hoveredFloor.material.color.setHex(0xfef08a);
        hoveredFloor.material.emissive.setHex(0xca8a04);
        hoveredFloor.material.emissiveIntensity = 0.35;

        if (tooltip && ttDong && ttFloor) {
          var u = hit.userData;
          ttDong.innerText = u.dongName + ' (' + u.totalFloors + '층 중)';
          var lineSuffix = u.hoName ? ' · ' + u.hoName : (u.lineDesc ? ' · ' + u.lineDesc : '');
          ttFloor.innerText = u.floor + '층 (' + u.bandLabel + ')' + lineSuffix;
          tooltip.style.display = 'block';
        }
      }
    } else {
      if (hoveredFloor) {
        if (hoveredFloor !== activePOVFloor) {
          if (activeFocusedDong && activeFocusedDong !== 'all' && hoveredFloor.userData.dong !== activeFocusedDong) {
            hoveredFloor.material.color.copy(dimColor);
          } else {
            hoveredFloor.material.color.copy(hoveredFloor.userData.baseColor);
          }
          hoveredFloor.material.emissive.setHex(0x000000);
        }
        hoveredFloor = null;
        if (tooltip) tooltip.style.display = 'none';
      }
    }
  }

  // =========================================================================
  // ★ [기능 2] 세대 조망권 뷰 (Floor POV) & 일조 시뮬레이션 시스템 ★
  // 특정 층 클릭 시 해당 층의 눈높이(1.6m) 창가/발코니로 1인칭 이동하여 전방 조망 조망
  // =========================================================================
  var isPOVMode = false;
  var previousCameraState = null;
  var activePOVFloor = null;
  var currentPOVSubMode = 'focus';
  var currentPOVFOV = 85; // 기본 화각: 85도 (기존 90도에서 5도 낮춤, UI 옵션으로 75~95도 선택 가능)
  var prevRadiusRingsVisible = true;
  var balconyEyePos = new THREE.Vector3();
  var povYaw = 0;   // 창문 정면(남향 +Z) 기준 좌우 시선 회전각 (rad)
  var povPitch = -0.04; // 상하 시선 회전각 (rad)
  var isDraggingPOVLook = false;
  var wasInPOVOutward = false;
  var prevNeighborVisible = false;
  var povCameraTransitionId = null;
  var cameraAnimationFrames = {};
  var cameraAnimationSerial = 0;

  // 발코니 세대 좌/우 호수 이동 관리 시스템
  var currentFloorUnits = [];
  var currentBalconyUnitIdx = 0;
  var balconyShiftAnimId = null;

  function getFloorUnits(dong, floor) {
    var units = [];
    interactiveFloors.forEach(function (m) {
      if (m.userData && m.userData.dong === dong && m.userData.floor === floor) {
        units.push(m);
      }
    });
    // 호수 순서대로 정렬 (lineNum 오름차순: 1호, 2호, 3호, 4호...)
    units.sort(function (a, b) {
      return (a.userData.lineNum || 0) - (b.userData.lineNum || 0);
    });
    return units;
  }

  function getUnitInfo(unitMesh) {
    if (!unitMesh || !unitMesh.userData) {
      return { key: 'unit', label: '세대', shortLabel: '세대', hoName: '세대', lineNum: 1, mesh: null };
    }
    var u = unitMesh.userData;
    var label = u.hoName || (u.floor + '층');
    return {
      key: u.hoName || (u.floor + '01호'),
      label: label,
      shortLabel: u.hoName || (u.floor + '01호'),
      hoName: u.hoName,
      lineNum: u.lineNum,
      mesh: unitMesh
    };
  }

  function shiftBalconyUnit(direction) {
    if (!isPOVMode || currentPOVSubMode !== 'outward' || !activePOVFloor) return;
    if (!currentFloorUnits || currentFloorUnits.length === 0) return;
    var nextIdx = Math.max(0, Math.min(currentFloorUnits.length - 1, currentBalconyUnitIdx + direction));
    if (nextIdx === currentBalconyUnitIdx) return;
    setBalconyUnit(nextIdx);
  }

  function setBalconyUnit(index) {
    if (!isPOVMode || currentPOVSubMode !== 'outward' || !activePOVFloor) return;
    if (!currentFloorUnits || currentFloorUnits.length === 0) return;
    index = Math.max(0, Math.min(currentFloorUnits.length - 1, index));
    currentBalconyUnitIdx = index;
    var targetMesh = currentFloorUnits[currentBalconyUnitIdx];
    if (!targetMesh) return;

    activePOVFloor = targetMesh;

    // 타겟 호수의 3D 바운딩박스 중심 및 전면 발코니 좌표 산출
    var uBox = new THREE.Box3().setFromObject(targetMesh);
    var targetCenterX = (uBox.min.x + uBox.max.x) / 2;
    var targetFrontZ = uBox.max.z;
    var eyeY = targetMesh.position.y + 1.6;

    var startX = balconyEyePos.x;
    var startZ = balconyEyePos.z;
    var targetX = targetCenterX;
    var targetZ = targetFrontZ - 0.45;

    if (balconyShiftAnimId) cancelAnimationFrame(balconyShiftAnimId);
    var startTime = performance.now();
    var duration = 380; // 부드럽고 신속한 380ms 슬라이딩 이동

    function updateShift(now) {
      var elapsed = now - startTime;
      var progress = Math.min(1.0, elapsed / duration);
      var ease = 1 - Math.pow(1 - progress, 3);
      balconyEyePos.x = startX + (targetX - startX) * ease;
      balconyEyePos.z = startZ + (targetZ - startZ) * ease;
      camera.position.x = balconyEyePos.x;
      camera.position.z = balconyEyePos.z;

      // 시선 방향 유지
      var lookX = Math.sin(povYaw) * Math.cos(povPitch);
      var lookY = Math.sin(povPitch);
      var lookZ = Math.cos(povYaw) * Math.cos(povPitch);
      var targetPt = new THREE.Vector3(
        balconyEyePos.x + lookX * 50,
        balconyEyePos.y + lookY * 50,
        balconyEyePos.z + lookZ * 50
      );
      camera.lookAt(targetPt);
      controls.target.copy(targetPt);

      if (typeof window.onPOVLookChange === 'function') {
        window.onPOVLookChange(povYaw, povPitch);
      }

      if (progress < 1.0) {
        balconyShiftAnimId = requestAnimationFrame(updateShift);
      } else {
        balconyShiftAnimId = null;
        if (sunTrajectoryGroup && sunTrajectoryGroup.visible) {
          updateSunTrajectory();
        }
      }
    }
    balconyShiftAnimId = requestAnimationFrame(updateShift);

    var unitInfo = getUnitInfo(targetMesh);
    if (typeof window.onBalconyUnitChange === 'function') {
      window.onBalconyUnitChange({
        unit: unitInfo,
        index: currentBalconyUnitIdx,
        total: currentFloorUnits.length,
        hasPrev: currentBalconyUnitIdx > 0,
        hasNext: currentBalconyUnitIdx < currentFloorUnits.length - 1
      });
    }
  }

  function cancelPOVCameraTransition() {
    if (povCameraTransitionId !== null) {
      cancelAnimationFrame(povCameraTransitionId);
      povCameraTransitionId = null;
    }
  }

  function cancelCameraAnimation() {
    Object.keys(cameraAnimationFrames).forEach(function (animationId) {
      cancelAnimationFrame(cameraAnimationFrames[animationId]);
      delete cameraAnimationFrames[animationId];
    });
  }

  function animatePOVCameraTo(endPos, endTarget, duration, targetFOV) {
    cancelPOVCameraTransition();
    if (balconyShiftAnimId !== null) {
      cancelAnimationFrame(balconyShiftAnimId);
      balconyShiftAnimId = null;
    }
    cancelCameraAnimation();

    var startPos = balconyEyePos.clone();
    var startTarget = controls.target.clone();
    var startFOV = camera.fov;
    var endFOV = (typeof targetFOV === 'number') ? targetFOV : startFOV;
    var destination = endPos.clone();
    var destinationTarget = endTarget.clone();
    var startTime = performance.now();
    controls.enabled = false;

    function step(now) {
      if (!isPOVMode || currentPOVSubMode !== 'outward') {
        povCameraTransitionId = null;
        return;
      }

      var progress = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      balconyEyePos.lerpVectors(startPos, destination, eased);
      camera.position.copy(balconyEyePos);
      controls.target.lerpVectors(startTarget, destinationTarget, eased);
      if (startFOV !== endFOV) {
        camera.fov = startFOV + (endFOV - startFOV) * eased;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(controls.target);

      if (progress < 1) {
        povCameraTransitionId = requestAnimationFrame(step);
        return;
      }

      balconyEyePos.copy(destination);
      camera.position.copy(destination);
      controls.target.copy(destinationTarget);
      if (startFOV !== endFOV) {
        camera.fov = endFOV;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(controls.target);
      povCameraTransitionId = null;
      if (sunTrajectoryGroup && sunTrajectoryGroup.visible) updateSunTrajectory();
    }

    povCameraTransitionId = requestAnimationFrame(step);
  }

  function viewFloorPOV(floorMesh, subMode) {
    if (!floorMesh || !floorMesh.userData) return;
    var isOutwardUnitSwitch = isPOVMode && currentPOVSubMode === 'outward' && (!subMode || subMode === 'outward');
    if (!isOutwardUnitSwitch) cancelPOVCameraTransition();
    var u = floorMesh.userData;
    var dong = u.dong;
    var floor = u.floor;
    var dongCenter = dongCenters[dong] || new THREE.Vector3();
    var bBox = dongBBoxes[dong] || { minX: dongCenter.x - 20, maxX: dongCenter.x + 20, minZ: dongCenter.z - 10, maxZ: dongCenter.z + 10, spanX: 40, spanZ: 20 };

    if (subMode) {
      currentPOVSubMode = subMode;
    } else if (!isPOVMode) {
      currentPOVSubMode = 'focus';
    }

    // 1) 이전 카메라 상태 저장 (조망 뷰 최초 진입 시 1회 저장)
    if (!isPOVMode) {
      previousCameraState = {
        position: camera.position.clone(),
        target: controls.target.clone()
      };
      isPOVMode = true;
    }

    // 2) 선택된 호수 황금빛 하이라이트 유지 및 이전 하이라이트 복원
    if (activePOVFloor && activePOVFloor !== floorMesh) {
      if (activeFocusedDong && activeFocusedDong !== 'all' && activePOVFloor.userData.dong !== activeFocusedDong) {
        activePOVFloor.material.color.copy(dimColor);
      } else {
        activePOVFloor.material.color.copy(activePOVFloor.userData.baseColor);
      }
      activePOVFloor.material.emissive.setHex(0x000000);
    }
    activePOVFloor = floorMesh;
    activePOVFloor.material.color.setHex(0xfef08a);
    activePOVFloor.material.emissive.setHex(0xd97706);
    activePOVFloor.material.emissiveIntensity = 0.55;

    if (currentPOVSubMode === 'outward' && currentFloorUnits.length) {
      currentFloorUnits.forEach(function (unitMesh) {
        unitMesh.visible = true;
        if (unitMesh.userData && unitMesh.userData.edgeLine) {
          unitMesh.userData.edgeLine.visible = true;
        }
      });
    }

    // 해당 층의 모든 호수 목록 갱신
    currentFloorUnits = getFloorUnits(dong, floor);
    var foundIdx = currentFloorUnits.indexOf(floorMesh);
    currentBalconyUnitIdx = foundIdx >= 0 ? foundIdx : 0;
    var activeUnit = currentFloorUnits[currentBalconyUnitIdx] || floorMesh;

    // 3) 카메라 위치 & 타겟 계산
    var eyeY = activeUnit.position.y + 1.6;
    var camPos, camTarget;

    if (currentPOVSubMode === 'outward') {
      // [창밖 조망 모드]:
      // ★ 1. 생활권 반경원 자동 Hide ★
      if (radiusRingsGroup) {
        if (!wasInPOVOutward) prevRadiusRingsVisible = radiusRingsGroup.visible;
        radiusRingsGroup.visible = false;
      }
      // ★ 2. 아실/직방형 3D 시간별 태양 궤적 표시 ★
      if (sunTrajectoryGroup) {
        sunTrajectoryGroup.visible = true;
        updateSunTrajectory();
      }
      if (balconyGlassFrameGroup) {
        balconyGlassFrameGroup.visible = false;
      }
      // ★ 3. 주변건물 레이어 자동 ON 및 화사하고 단정한 연한 회색 불투명 렌더링 전환 ★
      if (!wasInPOVOutward) {
        prevNeighborVisible = neighborGroup ? neighborGroup.visible : false;
        wasInPOVOutward = true;
      }
      if (neighborGroup) neighborGroup.visible = true;
      neighborMat.color.setHex(0xd4d8df);
      neighborMat.transparent = false;
      neighborMat.opacity = 1.0;
      neighborMat.roughness = 0.72;
      neighborLineMat.color.setHex(0x94a3b8);
      neighborLineMat.transparent = false;
      neighborLineMat.opacity = 0.65;

      // ★ 4. 아파트 실내 안쪽에서 외부를 바라보도록 타겟 호수의 3D 좌표 기준 카메라 배치 (외벽 bBox.maxZ/unitZ 기준 실내 안쪽 -0.45m) ★
      var uBox = new THREE.Box3().setFromObject(activeUnit);
      var unitPosX = (uBox.min.x + uBox.max.x) / 2;
      var unitPosZ = uBox.max.z - 0.45;
      var targetEyePos = new THREE.Vector3(unitPosX, eyeY, unitPosZ);

      // 직방/호갱노노 3D 실측 앵글: 하향 약 -8도(pitch -0.14 rad), 정면 시야
      if (!isOutwardUnitSwitch) {
        povYaw = 0.08;
        povPitch = -0.14;
        balconyEyePos.copy(targetEyePos);
      }
      camPos = targetEyePos;
      var lookX = Math.sin(povYaw) * Math.cos(povPitch);
      var lookY = Math.sin(povPitch);
      var lookZ = Math.cos(povYaw) * Math.cos(povPitch);
      camTarget = new THREE.Vector3(targetEyePos.x + lookX * 80.0, targetEyePos.y + lookY * 80.0, targetEyePos.z + lookZ * 80.0);

      // 선택 층 전 세대 메시 및 펜선 은폐 (실내에서 창밖 조망 시 벽체 차단 방지)
      currentFloorUnits.forEach(function (uMesh) {
        uMesh.visible = false;
        if (uMesh.userData && uMesh.userData.edgeLine) {
          uMesh.userData.edgeLine.visible = false;
        }
      });
    } else {
      // [외관·일조 포커스 모드]:
      if (sunTrajectoryGroup) sunTrajectoryGroup.visible = false;
      if (balconyGlassFrameGroup) balconyGlassFrameGroup.visible = false;
      if (radiusRingsGroup) radiusRingsGroup.visible = prevRadiusRingsVisible;

      // 선택 층 가시성 복원
      currentFloorUnits.forEach(function (uMesh) {
        uMesh.visible = true;
        if (uMesh.userData && uMesh.userData.edgeLine) {
          uMesh.userData.edgeLine.visible = true;
        }
      });

      // 창밖 조망에서 복귀한 경우 주변건물 머티리얼 및 가시성 원복
      if (wasInPOVOutward) {
        wasInPOVOutward = false;
        neighborMat.color.setHex(0xe5e7eb);
        neighborMat.transparent = true;
        neighborMat.opacity = 0.68;
        neighborMat.roughness = 0.70;
        neighborLineMat.color.setHex(0xb0b3b8);
        neighborLineMat.transparent = true;
        neighborLineMat.opacity = 0.28;
        if (neighborGroup) neighborGroup.visible = prevNeighborVisible;
      }
      controls.enabled = true;
      if (container) container.style.cursor = 'default';

      var dist = Math.max(50, bBox.spanX * 1.35);
      var selectedUnitBox = new THREE.Box3().setFromObject(activeUnit);
      camTarget = new THREE.Vector3(
        (selectedUnitBox.min.x + selectedUnitBox.max.x) / 2,
        eyeY,
        (selectedUnitBox.min.z + selectedUnitBox.max.z) / 2
      );
      var buildingCenterZ = (bBox.minZ + bBox.maxZ) / 2;
      camPos = new THREE.Vector3(
        camTarget.x + dist * 0.40,
        camTarget.y + dist * 0.30,
        camTarget.z + bBox.maxZ - buildingCenterZ + dist * 0.90
      );
    }

    // 부드러운 시네마틱 카메라 이동 (750ms)
    var targetFOV = (currentPOVSubMode === 'outward') ? currentPOVFOV : 40;
    if (isOutwardUnitSwitch) {
      animatePOVCameraTo(camPos, camTarget, 750, targetFOV);
    } else {
      complex3d_instance.animateCameraTo(camPos, camTarget, 750, targetFOV);
    }

    var unitInfo = getUnitInfo(activeUnit);

    // UI 콜백 (상단 플로팅 HUD 배너 표출)
    if (typeof window.onFloorPOVStart === 'function') {
      window.onFloorPOVStart({
        dong: dong,
        dongName: u.dongName || dong,
        floor: floor,
        totalFloors: u.totalFloors,
        bandLabel: u.bandLabel,
        lineDesc: u.lineDesc,
        activeLines: u.activeLines,
        subMode: currentPOVSubMode,
        unit: unitInfo,
        unitIndex: currentBalconyUnitIdx,
        totalUnits: currentFloorUnits ? currentFloorUnits.length : 1,
        povYaw: povYaw,
        povPitch: povPitch,
        fov: currentPOVFOV
      });
    }
    if (currentPOVSubMode === 'outward' && typeof window.onPOVLookChange === 'function') {
      window.onPOVLookChange(povYaw, povPitch);
    }
  }

  function setPOVSubMode(mode) {
    if (!isPOVMode || !activePOVFloor) return;
    viewFloorPOV(activePOVFloor, mode);
  }

  function exitFloorPOV() {
    if (!isPOVMode) return;
    isPOVMode = false;
    cancelPOVCameraTransition();
    if (balconyShiftAnimId) {
      cancelAnimationFrame(balconyShiftAnimId);
      balconyShiftAnimId = null;
    }

    // 태양 궤적 숨김
    if (sunTrajectoryGroup) {
      sunTrajectoryGroup.visible = false;
    }
    if (balconyGlassFrameGroup) {
      balconyGlassFrameGroup.visible = false;
    }

    // 생활권 반경원 복원
    if (radiusRingsGroup) {
      radiusRingsGroup.visible = prevRadiusRingsVisible;
    }

    // 주변건물 원복
    if (wasInPOVOutward) {
      wasInPOVOutward = false;
      neighborMat.color.setHex(0xe5e7eb);
      neighborMat.transparent = true;
      neighborMat.opacity = 0.68;
      neighborMat.roughness = 0.70;
      neighborLineMat.color.setHex(0xb0b3b8);
      neighborLineMat.transparent = true;
      neighborLineMat.opacity = 0.28;
      if (neighborGroup) neighborGroup.visible = prevNeighborVisible;
    }
    controls.enabled = true;
    if (container) container.style.cursor = 'default';

    // 선택된 층 전 세대 가시성 및 하이라이트 복원
    if (currentFloorUnits && currentFloorUnits.length > 0) {
      currentFloorUnits.forEach(function (uMesh) {
        uMesh.visible = true;
        if (uMesh.userData && uMesh.userData.edgeLine) {
          uMesh.userData.edgeLine.visible = true;
        }
      });
    }
    if (activePOVFloor) {
      activePOVFloor.visible = true;
      if (activePOVFloor.userData && activePOVFloor.userData.edgeLine) {
        activePOVFloor.userData.edgeLine.visible = true;
      }
      if (activeFocusedDong && activeFocusedDong !== 'all' && activePOVFloor.userData.dong !== activeFocusedDong) {
        activePOVFloor.material.color.copy(dimColor);
      } else {
        activePOVFloor.material.color.copy(activePOVFloor.userData.baseColor);
      }
      activePOVFloor.material.emissive.setHex(0x000000);
      activePOVFloor = null;
    }

    // 이전 카메라 뷰포인트로 복원 (기본 FOV 40도 복귀)
    if (previousCameraState) {
      complex3d_instance.animateCameraTo(previousCameraState.position, previousCameraState.target, 700, 40);
      previousCameraState = null;
    }

    // UI 콜백 (상단 플로팅 배너 닫기)
    if (typeof window.onFloorPOVExit === 'function') {
      window.onFloorPOVExit();
    }
  }

  // 마우스 클릭(Pointer Down/Up) 및 창밖 조망 시선 회전 감지
  var pointerDownInfo = { x: 0, y: 0, time: 0 };
  var povDragStart = { x: 0, y: 0 };

  function onPointerDown(e) {
    pointerDownInfo = { x: e.clientX, y: e.clientY, time: performance.now() };
    if (isPOVMode && currentPOVSubMode === 'outward') {
      isDraggingPOVLook = true;
      povDragStart.x = e.clientX;
      povDragStart.y = e.clientY;
      if (e.target && e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (container) container.style.cursor = 'grabbing';
      return;
    }
  }

  function onPointerMovePOV(e) {
    if (!isPOVMode || currentPOVSubMode !== 'outward' || !isDraggingPOVLook) return;
    var dx = e.clientX - povDragStart.x;
    var dy = e.clientY - povDragStart.y;
    povDragStart.x = e.clientX;
    povDragStart.y = e.clientY;

    // 모바일 터치 및 마우스 드래그 감도 최적화 (터치 환경에서는 반응성을 높여 시야 이동을 매끄럽게 지원)
    var isTouch = (e.pointerType === 'touch') || ('ontouchstart' in window && window.innerWidth <= 768);
    var lookSpeed = isTouch ? 0.0065 : 0.0035;

    // 좌우 회전 (Yaw): 자유롭고 넓은 시야 이동 지원 (360° 전방위 파노라마 조망 가능)
    povYaw -= dx * lookSpeed;
    if (povYaw > Math.PI) povYaw -= Math.PI * 2;
    else if (povYaw < -Math.PI) povYaw += Math.PI * 2;

    // 상하 회전 (Pitch): -78도 ~ +78도 (하늘과 바닥까지 넓게 탐색 가능)
    povPitch = Math.max(-1.36, Math.min(1.36, povPitch - dy * lookSpeed));

    // 카메라는 발코니에 100% 고정된 채 시선 방향만 회전
    camera.position.copy(balconyEyePos);
    var lookX = Math.sin(povYaw) * Math.cos(povPitch);
    var lookY = Math.sin(povPitch);
    var lookZ = Math.cos(povYaw) * Math.cos(povPitch);
    var targetPt = new THREE.Vector3(
      balconyEyePos.x + lookX * 50,
      balconyEyePos.y + lookY * 50,
      balconyEyePos.z + lookZ * 50
    );
    camera.lookAt(targetPt);
    if (typeof window.onPOVLookChange === 'function') {
      window.onPOVLookChange(povYaw, povPitch);
    }
    controls.target.copy(targetPt);
  }

  function onPointerUp(e) {
    if (e.target && e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    isDraggingPOVLook = false;
    // ★ 창밖 조망 시 다른 동/층 클릭 일체 차단 (단, 태양 궤적 노드 클릭은 지원) ★
    if (isPOVMode && currentPOVSubMode === 'outward') {
      var dx = e.clientX - pointerDownInfo.x;
      var dy = e.clientY - pointerDownInfo.y;
      var dt = performance.now() - pointerDownInfo.time;
      if (Math.hypot(dx, dy) <= 6 && dt <= 400 && e.button === 0) {
        var rect = container.getBoundingClientRect();
        var clickMouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        var ray = new THREE.Raycaster();
        ray.setFromCamera(clickMouse, camera);
        var hits = ray.intersectObjects(sunHourNodeSprites);
        if (hits.length > 0 && typeof hits[0].object.userData.hour === 'number') {
          complex3d_instance.setTime(hits[0].object.userData.hour);
        }
      }
      if (container) container.style.cursor = 'grab';
      return;
    }

    if (e.button !== 0) return; // 좌클릭만 처리
    var dx = e.clientX - pointerDownInfo.x;
    var dy = e.clientY - pointerDownInfo.y;
    var dt = performance.now() - pointerDownInfo.time;
    if (Math.hypot(dx, dy) > 6 || dt > 400) return; // 드래그/시선회전 조작은 클릭 무시

    var rect = container.getBoundingClientRect();
    var clickMouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    var clickRaycaster = new THREE.Raycaster();
    clickRaycaster.setFromCamera(clickMouse, camera);

    var candidateFloors = interactiveFloors;
    if (activeFocusedDong && activeFocusedDong !== 'all') {
      candidateFloors = interactiveFloors.filter(function (m) {
        return m.userData.dong === activeFocusedDong;
      });
    }
    var intersects = clickRaycaster.intersectObjects(candidateFloors);
    if (intersects.length > 0) {
      var hit = intersects[0].object;
      viewFloorPOV(hit, 'focus');
    }
  }
  // 창밖 조망 시 마우스 휠로 사용자 맞춤형 화각(FOV 55도~105도) 미세조정 지원
  function onWheelPOV(e) {
    if (!isPOVMode || currentPOVSubMode !== 'outward') return;
    e.preventDefault();
    var delta = e.deltaY > 0 ? 2 : -2;
    var newFOV = Math.max(55, Math.min(105, camera.fov + delta));
    if (newFOV !== camera.fov) {
      camera.fov = newFOV;
      camera.updateProjectionMatrix();
      currentPOVFOV = newFOV;
      if (typeof window.onPOVFOVChange === 'function') {
        window.onPOVFOVChange(newFOV);
      }
    }
  }

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMovePOV);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointercancel', onPointerUp);
  container.addEventListener('wheel', onWheelPOV, { passive: false });

  function onKeyDown(e) {
    if (e.key === 'Escape' && isPOVMode) {
      exitFloorPOV();
    } else if (isPOVMode && currentPOVSubMode === 'outward') {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        shiftBalconyUnit(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        shiftBalconyUnit(1);
      }
    }
  }
  window.addEventListener('keydown', onKeyDown);

  // =========================================================================
  // ★ [기능 3] 층별 입체 단면 분해 뷰 (Exploded View) 애니메이션 엔진 ★
  // 층간 수직 간격을 0.0m ↔ 1.2m로 부드러운 Tween(600ms)으로 전개하여 층별 단면 구조 조망
  // =========================================================================
  var currentExplodeGap = 0.0;
  var explodeAnimId = null;
  var isExplodedState = false;

  function animateExplodeGap(targetGap, duration) {
    duration = duration || 600;
    if (explodeAnimId) cancelAnimationFrame(explodeAnimId);
    var startGap = currentExplodeGap;
    var startTime = performance.now();

    function step(now) {
      var p = Math.min(1.0, (now - startTime) / duration);
      // EaseInOutCubic
      var t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      currentExplodeGap = startGap + (targetGap - startGap) * t;

      var floorH = 2.85;
      interactiveFloors.forEach(function (m) {
        var f = m.userData.floor;
        var newY = (f - 1) * (floorH + currentExplodeGap);
        m.position.y = newY;
        if (m.userData.edgeLine) {
          m.userData.edgeLine.position.y = newY;
        }
      });

      // 옥상 동 라벨 스프라이트도 층 분해 간격에 맞춰 함께 상승
      scene.traverse(function (obj) {
        if (obj.isSprite && obj.userData && obj.userData.isDongLabel) {
          var dongKey = obj.userData.dongKey;
          var totalFloors = dongTotalFloors[dongKey] || 15;
          var baseBldgH = totalFloors * floorH;
          var extraH = (totalFloors - 1) * currentExplodeGap;
          obj.position.y = baseBldgH + extraH + 5.5;
        }
      });

      if (p < 1.0) {
        explodeAnimId = requestAnimationFrame(step);
      } else {
        explodeAnimId = null;
      }
    }
    explodeAnimId = requestAnimationFrame(step);
  }

  // --- 10. Animation Loop ---
  var isAnimating = true;
  function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);

    // 창밖 조망 모드에서는 카메라 좌표를 발코니 난간에 엄격히 고정
    if (isPOVMode && currentPOVSubMode === 'outward') {
      camera.position.copy(balconyEyePos);
    } else {
      updateDynamicCameraClamp();
      controls.update();
    }

    // ★ 카메라 거리(Zoom) 및 각도와 무관하게 화면상 항상 일정한 크기를 유지하는 2D 빌보드 라벨 스케일 동기화 (Method 1) ★
    if (constantScreenBillboards.length > 0) {
      var vHeight = container.clientHeight || window.innerHeight || 800;
      var fovFactor = 2 * Math.tan((camera.fov * Math.PI) / 360);
      var camPos = camera.position;
      var targetH = Math.max(26, Math.min(36, vHeight * 0.042));
      var worldPos = new THREE.Vector3();

      for (var bIdx = 0; bIdx < constantScreenBillboards.length; bIdx++) {
        var item = constantScreenBillboards[bIdx];
        var sp = item.sprite;
        if (!sp) continue;

        // 부모 레이어 그룹이 꺼져 있거나 본인이 꺼져 있으면 스킵
        var isVis = sp.visible;
        var pNode = sp.parent;
        while (pNode && isVis) {
          if (pNode.visible === false) { isVis = false; break; }
          pNode = pNode.parent;
        }
        if (!isVis) continue;

        sp.getWorldPosition(worldPos);
        var dist = camPos.distanceTo(worldPos);
        dist = Math.max(10, Math.min(dist, 2500));

        var worldH = dist * fovFactor * (targetH / vHeight);
        var worldW = worldH * item.aspect;

        sp.scale.set(worldW, worldH, 1);
      }
    }

    // 태양 아이콘만 원근 왜곡 없이 천구에 항상 맺히도록 관측자 위치 동기화
    if (sunSprite && sunSprite.visible) {
      sunSprite.position.copy(camera.position).addScaledVector(sunUnitDir, 3200);
    }
    if (moonSprite && moonSprite.visible) {
      moonSprite.position.copy(camera.position).addScaledVector(moonUnitDir, 3200);
    }

    // 나침반 및 화면 4면 실시간 16방위 방향지시표 연동 콜백
    if (typeof window.onComplex3dCameraRotate === 'function') {
      var forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      // Three.js 좌표계: -Z는 북쪽(N), +X는 동쪽(E), +Z는 남쪽(S), -X는 서쪽(W)
      var headingRad = Math.atan2(forward.x, -forward.z);
      var headingDeg = ((headingRad * 180 / Math.PI) + 360) % 360;
      window.onComplex3dCameraRotate(controls.getAzimuthalAngle(), controls.getPolarAngle(), headingDeg);
    }

    // 화면 기준 태양 위치 & 오프스크린 지시표(화살표+태양 아이콘) 연동 콜백
    if (typeof window.onComplex3dSunScreenUpdate === 'function') {
      var bodyUnitDir = isNightMode ? moonUnitDir : sunUnitDir;
      var sunWorld = camera.position.clone().addScaledVector(bodyUnitDir, 1000);
      var proj = sunWorld.clone().project(camera);
      var camFwd = new THREE.Vector3();
      camera.getWorldDirection(camFwd);
      var isBehind = bodyUnitDir.dot(camFwd) < 0;

      window.onComplex3dSunScreenUpdate({
        ndcX: isBehind ? -proj.x : proj.x,
        ndcY: isBehind ? -proj.y : proj.y,
        isBehind: isBehind,
        onScreen: !isBehind && proj.x >= -0.88 && proj.x <= 0.88 && proj.y >= -0.82 && proj.y <= 0.82,
        celestialBodyVisible: isNightMode ? moonSprite.visible : sunSprite.visible
      });
    }

    checkHover();
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    if (!container) return;
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // --- 11. Public Controls Instance ---
  complex3d_instance = {
    scene: scene,
    camera: camera,
    controls: controls,
    renderer: renderer,
    setTime: function (hour) {
      currentHour = ((parseFloat(hour) % 24) + 24) % 24;
      updateSun();
    },
    setSeason: function (season) {
      currentSeason = season;
      updateSun();
    },
    setGroundMapType: function (type) {
      loadNaverMapGroundTexture(type);
    },
    lookDirection: function (dir) {
      // 1) 동서남북 버튼 클릭 시: 카메라 뷰포인트(타겟 위치, 관측 고도 h, 관측 거리 d)는 100% 유지하고 수평 방향만 해당 방향을 전방으로 회전
      var target = controls.target.clone();
      var h = Math.max(15, camera.position.y - target.y);
      var dx = camera.position.x - target.x;
      var dz = camera.position.z - target.z;
      var d = Math.max(30, Math.sqrt(dx * dx + dz * dz));

      var newPos = target.clone();
      if (dir === 'N') {
        // 북쪽 전방(화면 위쪽이 북쪽): 카메라는 타겟의 남쪽(+Z)에 위치하여 북쪽(-Z)을 바라봄
        newPos.set(target.x, target.y + h, target.z + d);
      } else if (dir === 'S') {
        // 남쪽 전방(화면 위쪽이 남쪽): 카메라는 타겟의 북쪽(-Z)에 위치하여 남쪽(+Z)을 바라봄
        newPos.set(target.x, target.y + h, target.z - d);
      } else if (dir === 'E') {
        // 동쪽 전방(화면 위쪽이 동쪽): 카메라는 타겟의 서쪽(-X)에 위치하여 동쪽(+X)을 바라봄
        newPos.set(target.x - d, target.y + h, target.z);
      } else if (dir === 'W') {
        // 서쪽 전방(화면 위쪽이 서쪽): 카메라는 타겟의 동쪽(+X)에 위치하여 서쪽(-X)을 바라봄
        newPos.set(target.x + d, target.y + h, target.z);
      }
      this.animateCameraTo(newPos, target, 650);
    },
    lookAtSun: function () {
      var target = controls.target.clone();
      var currentDist = camera.position.distanceTo(target);
      var dist = Math.max(350, Math.min(1300, currentDist));

      // 태양의 수평 단위 벡터 (XZ 평면)
      var bodyUnitDir = isNightMode ? moonUnitDir : sunUnitDir;
      var horiz = new THREE.Vector2(bodyUnitDir.x, bodyUnitDir.z).normalize();
      var altRad = Math.asin(Math.max(0.1, bodyUnitDir.y));

      // 카메라는 태양의 반대편에 서서 낮은 시점에서 하늘을 올려다봄
      var camH = dist * 0.18;
      var camD = dist * 0.90;

      var newPos = new THREE.Vector3(
        target.x - horiz.x * camD,
        target.y + camH,
        target.z - horiz.y * camD
      );

      // 시선(Target)을 태양 고도 방향 상공으로 충분히 틸트업하여, 단지와 태양(☀️)이 한 화면 상단 1/3 지점에 완벽히 안착하도록 배치
      var tiltH = dist * Math.tan(altRad * 0.78);
      var newTarget = new THREE.Vector3(
        target.x,
        target.y + tiltH,
        target.z
      );

      this.animateCameraTo(newPos, newTarget, 800);
    },
    zoomIn: function () {
      this.zoomCamera(0.72);
    },
    zoomOut: function () {
      this.zoomCamera(1.38);
    },
    zoomReset: function () {
      this.viewReset();
    },
    viewReset: function () {
      // 3) 새로고침 뷰를 디폴트 뷰로 설정 (부드러운 감속 복귀)
      this.animateCameraTo(defaultCamPos, defaultTarget, 650);
    },
    viewTop: function () {
      // 4) 상단뷰: 현재 카메라의 수평 방위(azimuth)를 부드럽게 유지하며 튀는 현상(Gimbal Lock) 없이 수직 탑뷰로 전환
      var curOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
      var horiz = new THREE.Vector2(curOffset.x, curOffset.z);
      if (horiz.lengthSq() < 0.001) horiz.set(0, 1);
      horiz.normalize();

      var topHeight = complexMaxSpan * 1.55;
      var target = new THREE.Vector3(complexCenterX, 0, complexCenterZ);
      // 약 87.5도 고각(수평 오프셋 5%): 수직 평면도처럼 보이면서도 OrbitControls 짐벌락(마지막 튀는 현상)을 완벽 차단
      var newPos = new THREE.Vector3(
        complexCenterX + horiz.x * (topHeight * 0.05),
        topHeight,
        complexCenterZ + horiz.y * (topHeight * 0.05)
      );
      this.animateCameraTo(newPos, target, 750);
    },
    viewBirdEye: function () {
      // 4) 위에서 아래로 내려다보는 뷰: 약 58~60도 고각 조감도 뷰
      var target = new THREE.Vector3(complexCenterX, complexMaxHeight * 0.25, complexCenterZ);
      var dist = complexMaxSpan * 1.15;
      var pitch = 58 * Math.PI / 180;
      var h = dist * Math.sin(pitch);
      var d = dist * Math.cos(pitch);
      var newPos = new THREE.Vector3(
        complexCenterX + d * 0.40,
        h,
        complexCenterZ + d * 0.90
      );
      this.animateCameraTo(newPos, target, 750);
    },
    zoomCamera: function (factor) {
      var dir = new THREE.Vector3().subVectors(camera.position, controls.target);
      var targetDist = dir.length() * factor;
      targetDist = Math.max(40, Math.min(3800, targetDist));
      dir.setLength(targetDist);
      var newPos = new THREE.Vector3().addVectors(controls.target, dir);
      this.animateCameraTo(newPos, controls.target, 320);
    },
    animateCameraTo: function (newPos, newTarget, duration, targetFOV) {
      duration = duration || 650;
      var animationId = ++cameraAnimationSerial;
      var startPos = camera.position.clone();
      var startTarget = controls.target.clone();
      var startFOV = camera.fov;
      var endFOV = (typeof targetFOV === 'number') ? targetFOV : camera.fov;
      var endPos = newPos.clone();
      var endTarget = newTarget ? newTarget.clone() : controls.target.clone();
      var startTime = performance.now();

      // 애니메이션 중 OrbitControls와의 프레임별 내부 경합 방지 (부드러운 카메라 전환)
      controls.enabled = false;

      function step(now) {
        var progress = Math.min(1.0, (now - startTime) / duration);
        var t = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        camera.position.lerpVectors(startPos, endPos, t);
        controls.target.lerpVectors(startTarget, endTarget, t);
        if (startFOV !== endFOV) {
          camera.fov = startFOV + (endFOV - startFOV) * t;
          camera.updateProjectionMatrix();
        }
        camera.lookAt(controls.target);

        if (progress < 1.0) {
          cameraAnimationFrames[animationId] = requestAnimationFrame(step);
        } else {
          delete cameraAnimationFrames[animationId];
          camera.position.copy(endPos);
          controls.target.copy(endTarget);
          if (startFOV !== endFOV) {
            camera.fov = endFOV;
            camera.updateProjectionMatrix();
          }
          camera.lookAt(controls.target);
          if (!isPOVMode || currentPOVSubMode !== 'outward') {
            controls.enabled = true;
            if (container) container.style.cursor = 'default';
            updateDynamicCameraClamp();
          }
          controls.update();
        }
      }
      cameraAnimationFrames[animationId] = requestAnimationFrame(step);
    },
    getSunInfo: function () {
      var declMap = { winter: -23.44, equinox: 0.0, summer: 23.44 };
      var decl = (declMap[currentSeason] || 0.0) * Math.PI / 180;
      var lat = center.lat * Math.PI / 180;
      var hourAngle = (currentHour - 12.0) * 15 * Math.PI / 180;
      var sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
      var alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
      var cosAz = (Math.sin(decl) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(alt));
      var az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
      if (hourAngle > 0) az = 2 * Math.PI - az;
      var nightMode = alt <= 0;
      var bodyAz = nightMode ? (az + Math.PI) % (Math.PI * 2) : az;
      var bodyAlt = nightMode ? -alt : alt;
      return {
        azimuthDeg: Math.round((bodyAz * 180 / Math.PI) % 360),
        altitudeDeg: Math.round(bodyAlt * 180 / Math.PI),
        hour: currentHour,
        season: currentSeason,
        isNightMode: nightMode,
        celestialBody: nightMode ? 'moon' : 'sun'
      };
    },
    // ★ [기능 3] 층별 입체 단면 분해 뷰 (Exploded View) 토글 및 상태 확인 메서드 ★
    toggleExplode: function (forceState) {
      if (isPOVMode) exitFloorPOV(); // 조망 뷰 모드 중 단면 분해 시 조망 뷰 우선 안전 종료
      if (forceState !== undefined) {
        isExplodedState = !!forceState;
      } else {
        isExplodedState = !isExplodedState;
      }
      var targetGap = isExplodedState ? 1.2 : 0.0;
      animateExplodeGap(targetGap, 600);
      return isExplodedState;
    },
    isExploded: function () {
      return isExplodedState;
    },
    // ★ [기능 2] 세대 조망권 뷰 (Floor POV) 제어 메서드 ★
    viewFloorPOV: function (floorMesh, subMode) {
      viewFloorPOV(floorMesh, subMode);
    },
    setPOVSubMode: function (mode) {
      setPOVSubMode(mode);
    },
    exitFloorPOV: function () {
      exitFloorPOV();
    },
    isPOVMode: function () {
      return isPOVMode;
    },
    focusDong: function (dongKey) {
      activeFocusedDong = dongKey || 'all';

      // 3) 카메라 각도(각도/방향/거리)는 100% 그대로 유지하고, 포커스된 대상을 화면 중앙에 위치하도록 카메라 팬(Pan) 이동
      var curOffset = new THREE.Vector3().subVectors(camera.position, controls.target);

      if (!dongKey || dongKey === 'all') {
        // 전체 복원
        interactiveFloors.forEach(function (m) {
          m.material.color.copy(m.userData.baseColor);
          m.material.opacity = 1.0;
          m.material.transparent = false;
          if (m.userData.edgeLine) {
            m.userData.edgeLine.material.opacity = 0.55;
          }
        });
        scene.traverse(function (obj) {
          if (obj.isSprite && obj.userData && obj.userData.isDongLabel) {
            obj.material.opacity = 1.0;
          }
        });

        // 단지 중앙으로 부드럽게 복귀 (카메라 각도 유지)
        var newTarget = new THREE.Vector3(complexCenterX, complexMaxHeight * 0.40, complexCenterZ);
        var newCamPos = new THREE.Vector3().addVectors(newTarget, curOffset);
        this.animateCameraTo(newCamPos, newTarget, 600);
      } else {
        var centerPos = dongCenters[dongKey];
        if (centerPos) {
          // 특정 동 선택: 선택된 동만 원본 파스텔 색상 유지, 나머지 모든 동은 투명 회색(dim) 처리
          interactiveFloors.forEach(function (m) {
            if (m.userData.dong === dongKey) {
              m.material.color.copy(m.userData.baseColor);
              m.material.opacity = 1.0;
              m.material.transparent = false;
              if (m.userData.edgeLine) {
                m.userData.edgeLine.material.opacity = 0.75;
              }
            } else {
              m.material.color.copy(dimColor);
              m.material.opacity = 0.22;
              m.material.transparent = true;
              if (m.userData.edgeLine) {
                m.userData.edgeLine.material.opacity = 0.10;
              }
            }
          });

          // 동 라벨: 선택된 동 배지만 1.0 유지, 나머지 동 배지는 0.20으로 dim
          scene.traverse(function (obj) {
            if (obj.isSprite && obj.userData && obj.userData.isDongLabel) {
              if (obj.userData.dongKey === dongKey) {
                obj.material.opacity = 1.0;
              } else {
                obj.material.opacity = 0.20;
              }
            }
          });

          // 카메라 각도는 온전히 유지한 채, 선택된 동의 3D 중심을 화면 정중앙(target)으로 부드럽게 이동
          var newTarget = new THREE.Vector3(centerPos.x, centerPos.y, centerPos.z);
          var newCamPos = new THREE.Vector3().addVectors(newTarget, curOffset);
          this.animateCameraTo(newCamPos, newTarget, 600);
        }
      }
    },
    getDongList: function () {
      return Object.keys(dongMeshes).sort(function (a, b) {
        return a.localeCompare(b, 'ko', { numeric: true });
      });
    },
    getPOVUnitOptions: function () {
      return interactiveFloors.map(function (mesh) {
        var unit = mesh.userData || {};
        return {
          dong: String(unit.dong || ''),
          dongName: unit.dongName || String(unit.dong || ''),
          floor: Number(unit.floor) || 1,
          hoName: unit.hoName || '',
          lineNum: Number(unit.lineNum) || 0
        };
      }).filter(function (unit) {
        return unit.dong && unit.hoName;
      }).sort(function (a, b) {
        return a.dong.localeCompare(b.dong, 'ko', { numeric: true }) ||
          a.floor - b.floor || a.lineNum - b.lineNum;
      });
    },
    selectPOVUnit: function (dongKey, floor, hoName) {
      if (!isPOVMode) return false;
      var selectedUnit = interactiveFloors.find(function (mesh) {
        var unit = mesh.userData || {};
        return String(unit.dong) === String(dongKey) &&
          Number(unit.floor) === Number(floor) &&
          unit.hoName === hoName;
      });
      if (!selectedUnit) return false;
      viewFloorPOV(selectedUnit, currentPOVSubMode);
      return true;
    },
    // 아파트 층별 저층/중층/고층 색상 동적 변경 및 조회 메서드
    setFloorColors: function (low, mid, high) {
      if (low) bandColors.low.set(low);
      if (mid) bandColors.mid.set(mid);
      if (high) bandColors.high.set(high);
      interactiveFloors.forEach(function (m) {
        var b = m.userData.band;
        m.userData.baseColor.copy(bandColors[b]);
        if (activeFocusedDong === 'all' || m.userData.dong === activeFocusedDong) {
          m.material.color.copy(m.userData.baseColor);
        }
      });
    },
    getFloorColors: function () {
      return {
        low: '#' + bandColors.low.getHexString(),
        mid: '#' + bandColors.mid.getHexString(),
        high: '#' + bandColors.high.getHexString()
      };
    },
    scene: scene,
    camera: camera,
    controls: controls,
    infraGroups: infraGroups,
    neighborGroup: neighborGroup,
    setApartmentNeighborModels: function (models) {
      (models || []).forEach(function (model) {
        var complexCode = String(model.searchCode || '');
        var complexName = model.name || '';
        (model.buildings || []).forEach(function (building) {
          if (!building.residential) return;
          addNeighborBuilding(Object.assign({}, building, {
            id: 'apt_' + complexCode + '_' + (building.id || building.dong || ''),
            name: complexName + (building.dong ? ' ' + building.dong : '')
          }), complexCode);
        });
      });
    },
    toggleInfraLayer: function (layerKey, visible) {
      if (layerKey === 'neighbors' && neighborGroup) {
        neighborGroup.visible = !!visible;
        return;
      }
      // 하위 호환 레거시 그룹 키 지원
      if (layerKey === 'school') {
        if (infraGroups.elementary) infraGroups.elementary.visible = !!visible;
        if (infraGroups.middle) infraGroups.middle.visible = !!visible;
        return;
      }
      if (layerKey === 'shopping') {
        if (infraGroups.dept_mall) infraGroups.dept_mall.visible = !!visible;
        if (infraGroups.mart) infraGroups.mart.visible = !!visible;
        return;
      }
      if (layerKey === 'transit') {
        if (infraGroups.subway) infraGroups.subway.visible = !!visible;
        return;
      }
      if (layerKey === 'polygon') {
        if (infraGroups.commercial) infraGroups.commercial.visible = !!visible;
        if (infraGroups.academy) infraGroups.academy.visible = !!visible;
        return;
      }
      if (layerKey === 'amenity') {
        if (infraGroups.hospital) infraGroups.hospital.visible = !!visible;
        if (infraGroups.park) infraGroups.park.visible = !!visible;
        if (infraGroups.bank) infraGroups.bank.visible = !!visible;
        return;
      }
      // 11종 세부 레이어 키 직접 토글
      if (infraGroups && infraGroups[layerKey]) {
        infraGroups[layerKey].visible = !!visible;
      }
    },
    setNeighborsVisible: function (visible) {
      if (neighborGroup) neighborGroup.visible = !!visible;
    },
    getNeighborsVisible: function () {
      return neighborGroup ? neighborGroup.visible : false;
    },
    shiftBalconyUnit: shiftBalconyUnit,
    setBalconyUnit: setBalconyUnit,
    getBalconyUnitInfo: function () {
      var curUnit = currentFloorUnits[currentBalconyUnitIdx] || activePOVFloor;
      return {
        units: currentFloorUnits,
        currentIndex: currentBalconyUnitIdx,
        currentUnit: getUnitInfo(curUnit)
      };
    },
    setPOVFOV: function (fov) {
      currentPOVFOV = Math.max(55, Math.min(105, fov));
      if (isPOVMode && currentPOVSubMode === 'outward') {
        camera.fov = currentPOVFOV;
        camera.updateProjectionMatrix();
      }
      if (typeof window.onPOVFOVChange === 'function') {
        window.onPOVFOVChange(currentPOVFOV);
      }
    },
    getPOVFOV: function () {
      return currentPOVFOV;
    },
    toggleBalconyFrame: function () {
      isBalconyFrameEnabled = !isBalconyFrameEnabled;
      var overlay = document.getElementById('balcony-2d-frame-overlay');
      if (overlay) {
        overlay.style.display = (isBalconyFrameEnabled && isPOVMode && currentPOVSubMode === 'outward') ? 'block' : 'none';
      }
      return isBalconyFrameEnabled;
    },
    setBalconyFrameVisible: function (visible) {
      isBalconyFrameEnabled = !!visible;
      var overlay = document.getElementById('balcony-2d-frame-overlay');
      if (overlay) {
        overlay.style.display = (isBalconyFrameEnabled && isPOVMode && currentPOVSubMode === 'outward') ? 'block' : 'none';
      }
    },
    isBalconyFrameVisible: function () {
      return isBalconyFrameEnabled;
    },
    setRadiusRingsVisible: function (visible) {
      if (radiusRingsGroup) radiusRingsGroup.visible = !!visible;
    },
    getRadiusRingsVisible: function () {
      return radiusRingsGroup ? radiusRingsGroup.visible : true;
    },
    getInfraStats: function () {
      return {
        elementary: infraGroups.elementary ? infraGroups.elementary.children.length : 0,
        middle: infraGroups.middle ? infraGroups.middle.children.length : 0,
        dept_mall: infraGroups.dept_mall ? infraGroups.dept_mall.children.length : 0,
        mart: infraGroups.mart ? infraGroups.mart.children.length : 0,
        subway: infraGroups.subway ? infraGroups.subway.children.length : 0,
        commercial: infraGroups.commercial ? infraGroups.commercial.children.length : 0,
        academy: infraGroups.academy ? infraGroups.academy.children.length : 0,
        hospital: infraGroups.hospital ? infraGroups.hospital.children.length : 0,
        park: infraGroups.park ? infraGroups.park.children.length : 0,
        bank: infraGroups.bank ? infraGroups.bank.children.length : 0,
        neighbors: neighborGroup ? Math.floor(neighborGroup.children.length / 2) : 0
      };
    },
    destroy: function () {
      isAnimating = false;
      constantScreenBillboards = [];
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMovePOV);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheelPOV);
      window.removeEventListener('keydown', onKeyDown);
      renderer.dispose();
      container.innerHTML = "";
    }
  };

  return complex3d_instance;
}
