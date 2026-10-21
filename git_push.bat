cd\
D:
cd APT-Rank_Git
python scripts/sync_price_to_r2.py
git config --global core.autocrlf true
git config --global credential.helper manager-core
git add *
git commit -m "Real-Price Auto Update"
git push -u origin master

pause
