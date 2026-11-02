#!/usr/bin/env node
'use strict';

/**
 * RealRankUs Monthly Version Updater
 *
 * 매월 데이터 업데이트 시 15개 이상의 프론트엔드 파일(HTML, JS)에 분산된
 * 기준월, DB 버전, 옵션 태그, 공지사항 등을 일괄 갱신하는 릴리즈 스크립트입니다.
 *
 * [사용법]
 *   node scripts/update_monthly_version.js --month=202612
 *   node scripts/update_monthly_version.js --month=202612 --date=2026-12-03 --bizMonth=202610
 *   node scripts/update_monthly_version.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.resolve(__dirname, '..');

// -------------------------------------------------------------
// Helper: CLI Argument Parser
// -------------------------------------------------------------
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value === undefined ? true : value;
    }
  }
  return args;
}

// -------------------------------------------------------------
// Helper: Date Calculations
// -------------------------------------------------------------
function formatYYYYMM(year, month) {
  const m = month < 10 ? '0' + month : '' + month;
  return `${year}${m}`;
}

function parseYYYYMM(ymStr) {
  const y = parseInt(ymStr.substring(0, 4), 10);
  const m = parseInt(ymStr.substring(4, 6), 10);
  return { year: y, month: m };
}

function getNextMonth(ymStr) {
  const { year, month } = parseYYYYMM(ymStr);
  if (month === 12) {
    return formatYYYYMM(year + 1, 1);
  }
  return formatYYYYMM(year, month + 1);
}

function getMonthsAgo(ymStr, diff) {
  let { year, month } = parseYYYYMM(ymStr);
  month -= diff;
  while (month <= 0) {
    month += 12;
    year -= 1;
  }
  return formatYYYYMM(year, month);
}

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// -------------------------------------------------------------
// File Replacement Tracker
// -------------------------------------------------------------
let changesSummary = [];

function replaceInFile(relPath, replacers, isDryRun) {
  const absPath = path.join(rootDir, relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`[경고] 파일을 찾을 수 없습니다: ${relPath}`);
    return;
  }

  let content = fs.readFileSync(absPath, 'utf8');
  let original = content;
  let fileChanges = 0;

  for (const item of replacers) {
    const { desc, pattern, replacement } = item;
    if (typeof pattern === 'string') {
      if (content.includes(pattern)) {
        content = content.replace(pattern, replacement);
        fileChanges++;
      } else {
        // pattern not found
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        fileChanges++;
      }
    }
  }

  if (fileChanges > 0) {
    changesSummary.push({ file: relPath, count: fileChanges });
    if (!isDryRun) {
      fs.writeFileSync(absPath, content, 'utf8');
    }
  }
}

// -------------------------------------------------------------
// Main Execution
// -------------------------------------------------------------
async function run() {
  console.log('========================================================');
  console.log('       RealRankUs 월간 릴리즈 자동 업데이트 스크립트       ');
  console.log('========================================================\n');

  const args = parseArgs();
  const isDryRun = Boolean(args['dry-run'] || args.dryRun);

  // 1. 현재 설정된 기준월(oldMonth) 자동 감지
  const appMainPath = path.join(rootDir, 'js/app_main_lang.js');
  if (!fs.existsSync(appMainPath)) {
    console.error('[오류] js/app_main_lang.js 파일을 찾을 수 없습니다.');
    process.exit(1);
  }
  const appMainText = fs.readFileSync(appMainPath, 'utf8');
  const curMatch = appMainText.match(/var\s+thisMonth\s*=\s*["'](\d{6})["']/);
  if (!curMatch) {
    console.error('[오류] js/app_main_lang.js에서 thisMonth를 찾을 수 없습니다.');
    process.exit(1);
  }
  const oldMonth = curMatch[1];
  const oldYear = oldMonth.substring(0, 4);
  const oldMon = oldMonth.substring(4, 6);

  // 2. 신규 월(targetMonth) 결정
  let targetMonth = args.month;
  if (!targetMonth) {
    targetMonth = getNextMonth(oldMonth);
  }
  targetMonth = String(targetMonth);

  const { year: targetYear, month: targetMonNum } = parseYYYYMM(targetMonth);
  const targetMon = targetMonNum < 10 ? '0' + targetMonNum : '' + targetMonNum;

  // 3. 업데이트 날짜 및 BIZ 기준월 결정
  const updateDate = args.date || getTodayStr();
  let bizMonth = args.bizMonth;
  if (!bizMonth) {
    bizMonth = getMonthsAgo(targetMonth, 2); // 기본 2개월 전
  }
  const { year: bizYear, month: bizMonNum } = parseYYYYMM(bizMonth);
  const bizMon = bizMonNum < 10 ? '0' + bizMonNum : '' + bizMonNum;

  const oldBizMonth = getMonthsAgo(oldMonth, 2);
  const { year: oldBizYear, month: oldBizMonNum } = parseYYYYMM(oldBizMonth);
  const oldBizMon = oldBizMonNum < 10 ? '0' + oldBizMonNum : '' + oldBizMonNum;

  console.log(`- 현재 기준월 (Old) : ${oldYear}년 ${oldMon}월 (${oldMonth})`);
  console.log(`- 갱신 기준월 (New) : ${targetYear}년 ${targetMon}월 (${targetMonth})`);
  console.log(`- 업데이트 일자     : ${updateDate}`);
  console.log(`- BIZ 데이터 기준월 : ${bizYear}년 ${bizMon}월 (${bizMonth})`);
  if (isDryRun) {
    console.log('\n[알림] --dry-run 모드입니다. 파일이 실제로 변경되지 않습니다.');
  }
  console.log('--------------------------------------------------------\n');

  // 대화형 확인 (인자가 명시되지 않았고 터미널 인터랙티브일 때)
  if (!args.month && !args['dry-run'] && process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await new Promise((resolve) => {
      rl.question(
        `위 설정으로 ${targetMonth}월 업데이트를 진행하시겠습니까? (y/n): `,
        resolve
      );
    });
    rl.close();
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('업데이트를 취소했습니다.');
      process.exit(0);
    }
    console.log('');
  }

  // -------------------------------------------------------------
  // 작업 1. index.html (메인 드롭다운)
  // -------------------------------------------------------------
  replaceInFile(
    'index.html',
    [
      {
        desc: 'month select option 추가',
        pattern: new RegExp(
          `(<select id="month"[^>]*>\\s*)(<option value="${oldMonth}" selected>[^<]+</option>)`
        ),
        replacement: `$1<option value="${targetMonth}" selected>${targetYear}년 ${targetMon}월</option>\r\n            <option value="${oldMonth}">${oldYear}년 ${oldMon}월</option>`,
      },
    ],
    isDryRun
  );

  // -------------------------------------------------------------
  // 작업 2. js/app_main_lang.js
  // -------------------------------------------------------------
  replaceInFile(
    'js/app_main_lang.js',
    [
      {
        desc: 'thisMonth 갱신',
        pattern: new RegExp(`var thisMonth = "${oldMonth}";`),
        replacement: `var thisMonth = "${targetMonth}";`,
      },
      {
        desc: 'selectedMonth 갱신',
        pattern: new RegExp(`var selectedMonth = "${oldMonth}";`),
        replacement: `var selectedMonth = "${targetMonth}";`,
      },
      {
        desc: 'DB_Date 갱신',
        pattern: /var DB_Date = "\d{6}_\d{2}";/,
        replacement: `var DB_Date = "${targetMonth}_01";`,
      },
      {
        desc: 'popCookie 쿠키 체크 갱신 (1)',
        pattern: new RegExp(`popCookie\\s*!=\\s*"${oldMonth}"`, 'g'),
        replacement: `popCookie != "${targetMonth}"`,
      },
      {
        desc: 'popCookie 쿠키 저장 갱신 (2)',
        pattern: new RegExp(`\\.cookie\\("popCookie",\\s*"${oldMonth}"`, 'g'),
        replacement: `.cookie("popCookie", "${targetMonth}"`,
      },
      {
        desc: 'IndexedDB 구버전 삭제 등록',
        pattern: new RegExp(
          `window\\.indexedDB\\.deleteDatabase\\(DB_Date\\);`
        ),
        replacement: `window.indexedDB.deleteDatabase("${oldMonth}_01");\r\n  window.indexedDB.deleteDatabase("${oldMonth}_01_EN");\r\n  window.indexedDB.deleteDatabase(DB_Date);`,
      },
      {
        desc: '공지사항 호출 조건문 추가',
        pattern: new RegExp(
          `if \\(selectedMonth == "${oldMonth}"\\) \\{\\s*detailHtml \\+= \\$\\{notice_${oldMonth}\\};\\s*\\}`
        ),
        replacement: `if (selectedMonth == "${oldMonth}") {\r\n    detailHtml += \`\${notice_${oldMonth}}\`;\r\n  }\r\n  if (selectedMonth == "${targetMonth}") {\r\n    detailHtml += \`\${notice_${targetMonth}}\`;\r\n  }`,
      },
    ],
    isDryRun
  );

  // -------------------------------------------------------------
  // 작업 3. js/notice_aptrank.js (공지문 템플릿 추가)
  // -------------------------------------------------------------
  const noticePath = path.join(rootDir, 'js/notice_aptrank.js');
  if (fs.existsSync(noticePath)) {
    const noticeContent = fs.readFileSync(noticePath, 'utf8');
    if (!noticeContent.includes(`var notice_${targetMonth} =`)) {
      const newNoticeBlock =
        `var notice_${targetMonth} = \r\n` +
        `"<div class='popupTitle' style='text-align: center; padding-bottom: 1em'> ${targetYear}년 ${targetMonNum}월 업데이트 안내 (${updateDate})</div>"\r\n` +
        `+"<ul>"\r\n` +
        `+"<li><div class='notice'>${targetYear}년 ${targetMonNum - 1 === 0 ? 12 : targetMonNum - 1}월 인구 변동 정보 업데이트 했습니다.</div></li>"\r\n` +
        `+"<li><div class='notice'>전국 단지 정보 및 최신 데이터 업데이트를 적용했습니다.</div></li>"\r\n` +
        `+"</ul>"\r\n` +
        `+"<hr>"\r\n\r\n`;

      changesSummary.push({ file: 'js/notice_aptrank.js', count: 1 });
      if (!isDryRun) {
        fs.writeFileSync(noticePath, newNoticeBlock + noticeContent, 'utf8');
      }
    }
  }

  // -------------------------------------------------------------
  // 작업 4. op/index.html & op/op_v2.js
  // -------------------------------------------------------------
  replaceInFile(
    'op/index.html',
    [
      {
        desc: 'OP month select option 추가',
        pattern: new RegExp(
          `(<select id="month"[^>]*>\\s*)(<option value="${oldMonth}" selected>[^<]+</option>)`
        ),
        replacement: `$1<option value="${targetMonth}" selected>${targetYear}년 ${targetMon}월</option>\r\n            <option value="${oldMonth}">${oldYear}년 ${oldMon}월</option>`,
      },
      {
        desc: 'OP selectedMonth 갱신',
        pattern: new RegExp(`var selectedMonth = "${oldMonth}"`),
        replacement: `var selectedMonth = "${targetMonth}"`,
      },
    ],
    isDryRun
  );

  // -------------------------------------------------------------
  // 작업 5. cityclass/index.html & cityclass/index_m.html
  // -------------------------------------------------------------
  ['cityclass/index.html', 'cityclass/index_m.html'].forEach((f) => {
    replaceInFile(
      f,
      [
        {
          desc: 'CityClass currentMonth 갱신',
          pattern: new RegExp(`var currentMonth = "${oldMonth}"`),
          replacement: `var currentMonth = "${targetMonth}"`,
        },
      ],
      isDryRun
    );
  });

  // -------------------------------------------------------------
  // 작업 6. theme/index.html
  // -------------------------------------------------------------
  replaceInFile(
    'theme/index.html',
    [
      {
        desc: 'theme updatedMonth 갱신',
        pattern: new RegExp(`var updatedMonth = "${oldMonth}"`),
        replacement: `var updatedMonth = "${targetMonth}"`,
      },
      {
        desc: 'theme 업데이트 일자 갱신',
        pattern: /업데이트:\s*\d{4}-\d{2}-\d{2}/,
        replacement: `업데이트: ${updateDate}`,
      },
    ],
    isDryRun
  );

  // -------------------------------------------------------------
  // 작업 7. biz/index.html & biz/index_m.html
  // -------------------------------------------------------------
  ['biz/index.html', 'biz/index_m.html'].forEach((f) => {
    replaceInFile(
      f,
      [
        {
          desc: 'biz currentMonth 갱신',
          pattern: new RegExp(`var currentMonth = "${oldMonth}"`),
          replacement: `var currentMonth = "${targetMonth}"`,
        },
        {
          desc: 'biz updateComment 갱신',
          pattern: /var updateComment = "\d{4}년 \d{1,2}월 데이터 기준"/,
          replacement: `var updateComment = "${bizYear}년 ${bizMonNum}월 데이터 기준"`,
        },
        {
          desc: 'biz BIZ_Valuated 파일 갱신',
          pattern: /BIZ_Valuated_\d{6}\.json/,
          replacement: `BIZ_Valuated_${bizMonth}.json`,
        },
        {
          desc: 'biz update_info 안내문 갱신',
          pattern: /업데이트\s*:\s*\d{4}-\d{2}-\d{2}(\s*<br>)?\s*\(\d{4}년 \d{1,2}월 데이터 기준\)/,
          replacement: (match) => {
            const hasBr = match.includes('<br>');
            return `업데이트 : ${updateDate}${hasBr ? ' <br>' : ''} (${bizYear}년 ${bizMonNum}월 데이터 기준)`;
          },
        },
      ],
      isDryRun
    );
  });

  // -------------------------------------------------------------
  // 작업 8. priceCal/index.html & priceCal/m/index.html
  // -------------------------------------------------------------
  ['priceCal/index.html', 'priceCal/m/index.html'].forEach((f) => {
    replaceInFile(
      f,
      [
        {
          desc: 'priceCal currentMonth 갱신',
          pattern: new RegExp(`var currentMonth = "${oldMonth}";`),
          replacement: `var currentMonth = "${targetMonth}";`,
        },
        {
          desc: 'priceCal 연도별 월 선택 한도 상향',
          pattern: new RegExp(`if \\(k <= ${parseInt(oldMon, 10)}\\)`),
          replacement: `if (k <= ${targetMonNum})`,
        },
      ],
      isDryRun
    );
  });

  // -------------------------------------------------------------
  // 작업 9. summary/index.html
  // -------------------------------------------------------------
  replaceInFile(
    'summary/index.html',
    [
      {
        desc: 'summary month select option 추가',
        pattern: new RegExp(
          `(<select id="month"[^>]*>\\s*(?:<!--[^>]*-->\\s*)?)(<option value="${oldMonth}" selected>[^<]+</option>)`
        ),
        replacement: `$1<option value="${targetMonth}" selected>${targetYear}년 ${targetMon}월</option>\r\n            <option value="${oldMonth}">${oldYear}년 ${oldMon}월</option>`,
      },
      {
        desc: 'summary selectedMonth 갱신',
        pattern: new RegExp(`var selectedMonth = "${oldMonth}"`),
        replacement: `var selectedMonth = "${targetMonth}"`,
      },
      {
        desc: 'summary 업데이트 요약 블록 갱신',
        pattern: /var this_month_update = `[^`]*`/,
        replacement:
          `var this_month_update = \`\r\n` +
          `  [${String(targetYear).slice(2)}년 ${targetMonNum}월 업데이트 요약]  \r\n` +
          `  - 전국 단지 정보 및 분석 지표 업데이트\r\n` +
          `  - 최신 실거래가 및 인구 변동 데이터 반영\r\n` +
          `  \\n\``,
      },
    ],
    isDryRun
  );

  // -------------------------------------------------------------
  // 작업 10. Guider/index.html & mbti/index.html
  // -------------------------------------------------------------
  replaceInFile(
    'Guider/index.html',
    [
      {
        desc: 'Guider currentMonth 갱신',
        pattern: new RegExp(`var currentMonth = "${oldMonth}";`),
        replacement: `var currentMonth = "${targetMonth}";`,
      },
    ],
    isDryRun
  );

  replaceInFile(
    'mbti/index.html',
    [
      {
        desc: 'mbti currentMonth 갱신',
        pattern: new RegExp(`var currentMonth = "${oldMonth}";`),
        replacement: `var currentMonth = "${targetMonth}";`,
      },
    ],
    isDryRun
  );

  // -------------------------------------------------------------
  // 작업 11. 모든 서비스의 JS/CSS 캐시 버스팅 쿼리스트링 갱신
  // -------------------------------------------------------------
  const cacheFiles = [
    'biz/index.html',
    'biz/index_m.html',
    'cityclass/index.html',
    'cityclass/index_m.html',
    'index.html',
    'en/index.html',
    'moneyflow/index.html',
    'moneyflow/index_m.html',
    'newsinfo/index.html',
    'op/index.html',
    'price/index.html',
    'priceCal/index.html',
    'priceCal/m/index.html',
    'theme/index.html',
    'theme/index_map.html'
  ];

  const newCacheVer = `${updateDate.replace(/-/g, '')}_1`;

  for (const cf of cacheFiles) {
    replaceInFile(
      cf,
      [
        {
          desc: `${cf} share/common 캐시 갱신`,
          pattern: /\?v=\d{8}_\d+/g,
          replacement: `?v=${newCacheVer}`,
        },
        {
          desc: `${cf} app_main_lang.js 캐시 갱신`,
          pattern: /app_main_lang\.js\?v=[^"'\s>]+/g,
          replacement: `app_main_lang.js?v=${newCacheVer}`,
        },
        {
          desc: `${cf} notice_aptrank.js 캐시 갱신`,
          pattern: /notice_aptrank\.js(\?v=[^"'\s>]+)?/g,
          replacement: `notice_aptrank.js?v=${newCacheVer}`,
        },
      ],
      isDryRun
    );
  }

  // -------------------------------------------------------------
  // 작업 결과 출력
  // -------------------------------------------------------------
  console.log('========================================================');
  console.log(`[완료] 총 ${changesSummary.length}개 파일 처리됨`);
  console.log('========================================================');
  changesSummary.forEach((item, idx) => {
    console.log(`  ${idx + 1}. [${item.file}] (${item.count}곳 치환)`);
  });

  if (isDryRun) {
    console.log(
      '\nℹ️  Dry-run 모드였습니다. 실제로 적용하려면 --dry-run 옵션 없이 실행하세요.'
    );
  } else {
    console.log(
      `\n🎉 ${targetMonth}월 업데이트가 성공적으로 모든 서비스에 반영되었습니다!`
    );
    console.log(
      '💡 변경사항을 확인한 뒤 `git diff` 및 `git commit`을 진행하세요.'
    );
  }
}

run().catch((err) => {
  console.error('[오류 발생]', err);
  process.exit(1);
});
