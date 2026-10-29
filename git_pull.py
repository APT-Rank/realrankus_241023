import os
import sys
import subprocess
import datetime
import time
import asyncio
import telegram

# Git 저장소 경로
REPO_DIR = r"C:\Users\anito\APT-Rank_Git"
PUSH_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "git_push.py")
if not os.path.exists(PUSH_SCRIPT):
    PUSH_SCRIPT = os.path.join(REPO_DIR, "git_push.py")

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

def run_git_pull(trigger_push=True):
    print("=" * 50, flush=True)
    print(f"[Git Pull] 시작: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
    print(f"[Git Pull] 대상 저장소: {REPO_DIR}", flush=True)
    print("=" * 50, flush=True)

    if not os.path.exists(REPO_DIR):
        err_msg = f"🚨 [Git Pull 오류] 저장소 경로를 찾을 수 없습니다: {REPO_DIR}"
        print(err_msg, flush=True)
        telgm_bot(err_msg)
        sys.exit(1)

    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    try:
        res = subprocess.run(
            ["git", "pull"],
            cwd=REPO_DIR,
            capture_output=True,
            text=True,
            check=True,
            env=env
        )
        print("[Git Pull] 출력 결과:\n" + res.stdout.strip(), flush=True)
        print("[Git Pull] 정상 완료되었습니다.", flush=True)
    except subprocess.CalledProcessError as e:
        err_detail = e.stderr.strip() if e.stderr else str(e)
        err_msg = (
            f"🚨 [Git Pull 비정상 종료 알림]\n"
            f"- 저장소: {REPO_DIR}\n"
            f"- 오류 내용: {err_detail}\n\n"
            f"※ Pull이 실패하여 Push 작업을 중단합니다."
        )
        print(err_msg, flush=True)
        telgm_bot(err_msg)
        sys.exit(1)

    # Pull이 안정적으로 종료되면 Push 실행
    if trigger_push:
        print("\n[Git Pull 완료] Pull이 안정적으로 종료되어 Git Push를 실행합니다...", flush=True)
        time.sleep(1)
        if os.path.exists(PUSH_SCRIPT):
            subprocess.run([sys.executable, "-u", PUSH_SCRIPT], check=True)
        else:
            print(f"[!] Warning: Push 스크립트를 찾을 수 없습니다: {PUSH_SCRIPT}", flush=True)

if __name__ == "__main__":
    # 단독 실행 지원 (옵션으로 --no-push 시 pull만 수행)
    auto_push = "--no-push" not in sys.argv
    run_git_pull(trigger_push=auto_push)

