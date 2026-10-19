@echo off
set GIT_TERMINAL_PROMPT=0
cd /d C:\Users\anito\APT-Rank_Git
git config --global core.autocrlf true
git config --global credential.helper manager-core
git add *
git commit -m "Real-Price Auto Update"
git push -u origin master