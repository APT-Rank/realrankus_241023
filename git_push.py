import os
import sys
import subprocess
import datetime
import time
import asyncio
import telegram

# Git 저장소 경로
REPO_DIR = r"C:\Users\anito\APT-Rank_Git"

telgm_token = "1872197252:AAGk2VVPq9zBi6uL-Mg7UPiB6DQmx4D324E"
chat_id = "1572186775"

def telgm_bot(str_msg):
    async def _send():
        request = telegram.request.HTTPXRequest(connect_timeout=30, read_timeout=30, write_timeout=30, pool_timeout=30)
        async with telegram.Bot(token=telgm_token, request=request) as bot:
            await bot.send_message(chat_id=chat_id, text=str_msg)
    for attempt in range(3):
        try:
            asyncio.run(_send())
            return
        except Exception as e:
            print(f"[Telegram] 발송 실패 ({attempt + 1}/3): {e}", flush=True)
            time.sleep(2)

def run_git_push(commit_msg="Real-Price Auto Update"):
    print("=" * 50, flush=True)
    print(f"[Git Push] 시작: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
    print(f"[Git Push] 대상 저장소: {REPO_DIR}", flush=True)
    print("=" * 50, flush=True)

    if not os.path.exists(REPO_DIR):
        err_msg = f"🚨 [Git Push 오류] 저장소 경로를 찾을 수 없습니다: {REPO_DIR}"
        print(err_msg, flush=True)
        telgm_bot(err_msg)
        sys.exit(1)

    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    try:
        # 1. Git 환경 및 인증 헬퍼 설정
        subprocess.run(["git", "config", "core.autocrlf", "true"], cwd=REPO_DIR, check=True, env=env)
        subprocess.run(["git", "config", "credential.helper", "manager"], cwd=REPO_DIR, check=True, env=env)

        # 2. git add
        print("[Git Push] git add 진행 중...", flush=True)
        subprocess.run(["git", "add", "."], cwd=REPO_DIR, check=True, env=env)

        # 3. 변경 사항 확인
        status_res = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=REPO_DIR,
            capture_output=True,
            text=True,
            check=True,
            env=env
        )
        has_changes = bool(status_res.stdout.strip())

        if has_changes:
            # 4. git commit
            print(f"[Git Push] 변경 사항 커밋 중: '{commit_msg}'", flush=True)
            commit_res = subprocess.run(
                ["git", "commit", "-m", commit_msg],
                cwd=REPO_DIR,
                capture_output=True,
                text=True,
                check=True,
                env=env
            )
            print(commit_res.stdout.strip(), flush=True)
        else:
            print("[Git Push] 커밋할 변경 사항이 없습니다. 최신 상태입니다.", flush=True)

        # 5. git push
        print("[Git Push] git push origin master 진행 중...", flush=True)
        push_res = subprocess.run(
            ["git", "push", "-u", "origin", "master"],
            cwd=REPO_DIR,
            capture_output=True,
            text=True,
            check=True,
            env=env
        )
        if push_res.stdout.strip():
            print(push_res.stdout.strip(), flush=True)
        if push_res.stderr.strip():
            print(push_res.stderr.strip(), flush=True)

        # 6. 푸시 무사히 종료 -> 마지막 완료 메시지 텔레그램 발송
        end_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        success_msg = (
            f"🎉 [Git Push 완료 알림]\n"
            f"- 저장소: APT-Rank_Git\n"
            f"- 작업: Git Pull & Push 최종 성공\n"
            f"- 상태: 변경 사항이 원격 저장소(master)에 무사히 반영되었습니다.\n"
            f"- 완료 시간: {end_time}"
        )
        print("-" * 50 + "\n" + success_msg + "\n" + "-" * 50, flush=True)
        telgm_bot(success_msg)

    except subprocess.CalledProcessError as e:
        err_detail = e.stderr.strip() if e.stderr else str(e)
        err_msg = (
            f"🚨 [Git Push 비정상 종료 알림]\n"
            f"- 저장소: {REPO_DIR}\n"
            f"- 오류 내용: {err_detail}"
        )
        print(err_msg, flush=True)
        telgm_bot(err_msg)
        sys.exit(1)

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "Real-Price Auto Update"
    run_git_push(commit_msg=msg)

