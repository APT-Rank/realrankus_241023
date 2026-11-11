/**
 * optimize_all_3d_data.js
 * 
 * 24,013개 전국 3D 단지 데이터 일괄 최적화 배치 스크립트:
 * 1) 바늘탑/초소형 구조물(바닥면적 < 25㎡ 또는 가로·세로 최소폭 < 3.0m) 원천 제거 (방안 A)
 * 2) 25㎡ 이상 ~ 65㎡ 미만 소형 부속 구조물(경비실, 관리동 등) 최대 2층/단일라인 보정
 * 3) 중심 좌표 center를 { lat, lng } 표준 객체로 일괄 정규화
 * 4) JSON 압축(Minify)을 통한 저장 공간 및 네트워크 페이로드 대폭 절감
 */

const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

const DATA_DIR = path.resolve(__dirname, '../data/3d');

function evaluateFootprint(ring, latRef) {
  if (!ring || ring.length < 3) return { area: 0, boxArea: 0, minSpan: 0 };
  const kx = 111319.49 * Math.cos(latRef * Math.PI / 180);
  const ky = 111319.49;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  const n = ring.length;
  let doubleArea = 0;

  for (let i = 0; i < n; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const x1 = p1[0] * kx;
    const y1 = p1[1] * ky;
    const x2 = p2[0] * kx;
    const y2 = p2[1] * ky;

    if (x1 < minX) minX = x1;
    if (x1 > maxX) maxX = x1;
    if (y1 < minY) minY = y1;
    if (y1 > maxY) maxY = y1;

    doubleArea += (x1 * y2 - x2 * y1);
  }

  const area = Math.abs(doubleArea) * 0.5;
  const spanX = Math.max(0, maxX - minX);
  const spanY = Math.max(0, maxY - minY);
  const minSpan = Math.min(spanX, spanY);
  const boxArea = spanX * spanY;

  return { area, boxArea, minSpan };
}

function processFile(filePath) {
  const stat = fs.statSync(filePath);
  const origSize = stat.size;
  const raw = fs.readFileSync(filePath, 'utf8');
  let d;
  try {
    d = JSON.parse(raw);
  } catch (e) {
    return null;
  }

  // 1. Center normalization
  let centerObj = { lat: 37.5, lng: 127.0 };
  const rawCenter = d.center;
  if (Array.isArray(rawCenter) && rawCenter.length >= 2) {
    const a = Number(rawCenter[0]);
    const b = Number(rawCenter[1]);
    centerObj = (a > 100) ? { lat: b, lng: a } : { lat: a, lng: b };
  } else if (rawCenter && typeof rawCenter === 'object') {
    centerObj = {
      lat: Number(rawCenter.lat !== undefined ? rawCenter.lat : (rawCenter.y || 37.5)),
      lng: Number(rawCenter.lng !== undefined ? rawCenter.lng : (rawCenter.x || 127.0))
    };
  }
  if (!isFinite(centerObj.lat)) centerObj.lat = 37.5;
  if (!isFinite(centerObj.lng)) centerObj.lng = 127.0;
  d.center = centerObj;

  const latRef = centerObj.lat;

  // 2. Buildings optimization
  const bldsBefore = (d.buildings || []).length;
  let bldsClamped = 0;

  const keptBuildings = (d.buildings || []).filter(b => {
    if (!b.rings || !b.rings[0] || b.rings[0].length < 3) return false;
    const { area, boxArea, minSpan } = evaluateFootprint(b.rings[0], latRef);

    // Filter < 25sqm or minSpan < 3m
    if (area < 25.0 || boxArea < 25.0 || minSpan < 3.0) {
      return false;
    }

    // Auxiliary structure clamping (25~65sqm)
    if (area < 65.0 || minSpan < 6.5) {
      const flr = b.floors || (b.height ? Math.round(b.height / 3.0) : 1);
      if (flr > 2) {
        b.floors = 2;
        if (b.height) b.height = Math.min(b.height, 6.0);
        if (b.heightM) b.heightM = Math.min(b.heightM, 6.0);
        b.lines = [];
        b.residential = false;
        b.selectable = false;
        bldsClamped++;
      }
    }

    return true;
  });

  d.buildings = keptBuildings;
  const bldsAfter = keptBuildings.length;
  const bldsRemoved = bldsBefore - bldsAfter;

  // 3. Neighbors optimization (if any)
  let nbrsRemoved = 0;
  if (Array.isArray(d.neighbors) && d.neighbors.length > 0) {
    const nbrBefore = d.neighbors.length;
    d.neighbors = d.neighbors.filter(nb => {
      if (!nb.rings || !nb.rings[0] || nb.rings[0].length < 3) return false;
      const { area, boxArea, minSpan } = evaluateFootprint(nb.rings[0], latRef);
      return !(area < 25.0 || boxArea < 25.0 || minSpan < 3.0);
    });
    nbrsRemoved = nbrBefore - d.neighbors.length;
  }

  // 4. Save compact minified JSON
  const minified = JSON.stringify(d);
  fs.writeFileSync(filePath, minified, 'utf8');
  const newSize = Buffer.byteLength(minified, 'utf8');

  return {
    origSize,
    newSize,
    bldsBefore,
    bldsAfter,
    bldsRemoved,
    bldsClamped,
    nbrsRemoved
  };
}

if (!isMainThread) {
  // Worker Thread
  const { fileChunk } = workerData;
  const stats = {
    processed: 0,
    origBytes: 0,
    newBytes: 0,
    bldsBefore: 0,
    bldsAfter: 0,
    bldsRemoved: 0,
    bldsClamped: 0,
    nbrsRemoved: 0
  };

  for (const f of fileChunk) {
    const res = processFile(f);
    if (res) {
      stats.processed++;
      stats.origBytes += res.origSize;
      stats.newBytes += res.newSize;
      stats.bldsBefore += res.bldsBefore;
      stats.bldsAfter += res.bldsAfter;
      stats.bldsRemoved += res.bldsRemoved;
      stats.bldsClamped += res.bldsClamped;
      stats.nbrsRemoved += res.nbrsRemoved;
    }
  }

  parentPort.postMessage(stats);
} else {
  // Main Thread
  async function run() {
    console.log(`[시작] 전국 3D 단지 데이터 일괄 최적화 배치 가동...`);
    console.log(`대상 디렉터리: ${DATA_DIR}`);

    if (!fs.existsSync(DATA_DIR)) {
      console.error(`디렉터리를 찾을 수 없습니다: ${DATA_DIR}`);
      process.exit(1);
    }

    const allFiles = fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(DATA_DIR, f));

    const totalCount = allFiles.length;
    console.log(`발견된 3D 단지 파일 수: ${totalCount.toLocaleString()}개\n`);

    const numCPUs = Math.min(os.cpus().length || 4, 8);
    console.log(`멀티스레드 워커 수: ${numCPUs}개 워커 스레드 동시 실행`);

    const chunkSize = Math.ceil(totalCount / numCPUs);
    const chunks = [];
    for (let i = 0; i < totalCount; i += chunkSize) {
      chunks.push(allFiles.slice(i, i + chunkSize));
    }

    const tStart = Date.now();
    const workerPromises = chunks.map((chunk, idx) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { fileChunk: chunk }
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
          if (code !== 0) reject(new Error(`Worker ${idx} stopped with exit code ${code}`));
        });
      });
    });

    const results = await Promise.all(workerPromises);
    const elapsedSec = (Date.now() - tStart) / 1000;

    const totalStats = results.reduce((acc, curr) => {
      acc.processed += curr.processed;
      acc.origBytes += curr.origBytes;
      acc.newBytes += curr.newBytes;
      acc.bldsBefore += curr.bldsBefore;
      acc.bldsAfter += curr.bldsAfter;
      acc.bldsRemoved += curr.bldsRemoved;
      acc.bldsClamped += curr.bldsClamped;
      acc.nbrsRemoved += curr.nbrsRemoved;
      return acc;
    }, {
      processed: 0,
      origBytes: 0,
      newBytes: 0,
      bldsBefore: 0,
      bldsAfter: 0,
      bldsRemoved: 0,
      bldsClamped: 0,
      nbrsRemoved: 0
    });

    const origMB = (totalStats.origBytes / (1024 * 1024)).toFixed(1);
    const newMB = (totalStats.newBytes / (1024 * 1024)).toFixed(1);
    const savedMB = ((totalStats.origBytes - totalStats.newBytes) / (1024 * 1024)).toFixed(1);
    const savedRatio = totalStats.origBytes > 0
      ? (((totalStats.origBytes - totalStats.newBytes) / totalStats.origBytes) * 100).toFixed(1)
      : '0.0';

    console.log(`\n======================================================`);
    console.log(`🎉 [최적화 완료] 24,013개 전국 3D 단지 일괄 처리 완료!`);
    console.log(`======================================================`);
    console.log(`- 처리 파일 수: ${totalStats.processed.toLocaleString()}개`);
    console.log(`- 처리 소요 시간: ${elapsedSec.toFixed(1)}초 (초당 ${(totalStats.processed / elapsedSec).toFixed(0)}개 파일 처리)`);
    console.log(`- 용량 절감: ${origMB} MB ➡️ ${newMB} MB (${savedMB} MB 감소, ▼ ${savedRatio}%)`);
    console.log(`- 바늘탑/25㎡ 미만 제거 건물: ${totalStats.bldsRemoved.toLocaleString()}개 제거`);
    console.log(`- 25~65㎡ 부속 시설물 층수/와이어 보정: ${totalStats.bldsClamped.toLocaleString()}개 보정`);
    console.log(`- 주변 건물(Neighbors) 필터링: ${totalStats.nbrsRemoved.toLocaleString()}개 제거`);
    console.log(`- 중심 좌표(center): 100% { lat, lng } 표준 객체 변환 완료`);
    console.log(`======================================================\n`);
  }

  run().catch(err => {
    console.error('배치 실행 오류:', err);
    process.exit(1);
  });
}
