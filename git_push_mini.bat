@echo off
cd /d "C:\Users\anito\APT-Rank_Git"

:: 최신 원격 저장소 커밋 정보 가져오기
git fetch origin master

:: 원격 저장소 커밋 기준으로 로컬 커밋 내역을 소프트 리셋
:: (로컬의 중간 커밋들은 지우고, 변경된 파일 변경 사항들은 그대로 스테이지 상태로 유지)
git reset --soft origin/master

:: 새로 추가되거나 변경된 모든 파일 스테이징
git add -A

:: 변경 사항이 있는 경우에만 커밋 생성
git diff --cached --quiet || git commit -m "Real-Price Auto Update"

:: 원격 저장소로 푸쉬
git push origin master

pause