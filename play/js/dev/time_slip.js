(() => {
    if (!window.playRuntime?.isEmulatorMode) return;

    const toggle = document.getElementById('testModeToggle');
    const panel = document.getElementById('test-mode-panel');
    const activityPanel = document.getElementById('test-mode-activity');
    if (!toggle || !panel || !activityPanel) return;

    let enabled = false;
    let speedMultiplier = 1;
    let seasonUnsubscribe = null;
    let activityUnsubscribe = null;
    let heroAssetUnsubscribe = null;

    const isAuthorizedHero = () => window.playRuntime?.isEmulatorMode === true
        && currentUser?.uid === 'HERO_USER'
        && currentSeasonId === 'test_hero_season';

    function stopListeners() {
        [seasonUnsubscribe, activityUnsubscribe, heroAssetUnsubscribe].forEach(unsubscribe => unsubscribe?.());
        seasonUnsubscribe = null;
        activityUnsubscribe = null;
        heroAssetUnsubscribe = null;
    }

    function deactivate() {
        enabled = false;
        toggle.checked = false;
        panel.hidden = true;
        activityPanel.hidden = true;
        stopListeners();
        liveActivityRecords = [];
    }

    function syncAuth(user) {
        const authorized = window.playRuntime?.isEmulatorMode === true && user?.uid === 'HERO_USER';
        toggle.hidden = !authorized;
        if (!authorized) deactivate();
    }

    function setStatus(status) {
        const statusElement = document.getElementById('sim-status-display');
        if (statusElement) statusElement.textContent = status;
    }

    function setEnabled(value) {
        if (value && !isAuthorizedHero()) {
            toggle.checked = false;
            alert('에뮬레이터의 HERO 계정으로 로그인해야 TIME-SLIP을 사용할 수 있습니다.');
            return;
        }

        if (!value) {
            deactivate();
            return;
        }

        enabled = true;
        panel.hidden = false;
        activityPanel.hidden = false;
        startListeners();
        reloadHeroState();
    }

    async function reloadHeroState() {
        if (!enabled || !isAuthorizedHero()) return;
        try {
            const getPlayerState = firebase.app().functions('asia-northeast3').httpsCallable('getPlayerState');
            const response = await getPlayerState({ season_id: currentSeasonId, player_id: 'HERO' });
            if (!enabled) return;
            playerState = { ...response.data, ownership: response.data.ownership || response.data.ownerships || [] };
            updateMyWorldUI();
        } catch (error) {
            console.error('Failed to load local HERO state:', error);
        }
    }

    function startListeners() {
        if (!enabled || !isAuthorizedHero() || seasonUnsubscribe) return;

        const db = firebase.firestore();
        seasonUnsubscribe = db.collection('PLAY_SEASON').doc(currentSeasonId).onSnapshot(doc => {
            if (!enabled || !doc.exists) return;

            const data = doc.data();
            currentSeasonState = data;
            document.getElementById('sim-time-display').textContent = `Period ${data.current_simulation_period}`;
            updateMyWorldUI();
            setStatus(data.clock_status || 'UNKNOWN');
            if (currentContext === 'MAP_VIEW') updateCommandPanel();
            if (currentContext === 'REGION_EXPLORE') renderTestRegionExplorer();
            if (currentContext === 'MY_WORLD') {
                updateMyWorldScreen();
                updateCommandPanel();
            }
        }, error => console.error('TIME-SLIP season listener failed:', error));

        heroAssetUnsubscribe = db.collection('PLAY_PLAYER_ASSET').doc('HERO').onSnapshot(doc => {
            if (!enabled || !doc.exists) return;
            playerState = { ...playerState, player_id: 'HERO', asset: doc.data() };
            updateMyWorldUI();
            updateCommandPanel();
        }, error => console.error('Local HERO asset listener failed:', error));

        activityUnsubscribe = db.collection('PLAY_DECISION_LOG')
            .where('season_id', '==', currentSeasonId)
            .orderBy('created_at', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                if (!enabled) return;
                liveActivityRecords = snapshot.docs.map(doc => doc.data());
                const container = document.getElementById('activity-log-container');
                container.replaceChildren();

                liveActivityRecords.forEach(log => {
                    const row = document.createElement('div');
                    row.className = `mb-1 ${log.player_id === 'HERO' ? 'text-warning' : 'text-light'}`;
                    const label = document.createElement('strong');
                    label.textContent = log.player_id === 'HERO' ? 'YOU (HERO)' : `AI (${log.player_id})`;
                    row.append(label, document.createTextNode(`: ${log.action_type || log.event_type || 'acted'} P${log.simulation_period ?? '—'}`));
                    container.appendChild(row);
                });

                if (currentContext === 'MAP_VIEW') updateCommandPanel();
                if (currentContext === 'REGION_EXPLORE') renderTestRegionExplorer();
                if (currentContext === 'MY_WORLD') updateCommandPanel();
            }, error => console.error('TIME-SLIP activity listener failed:', error));

        subscribeSeasonParticipants();
    }

    function setSpeed(speed) {
        if (!enabled || ![1, 5, 20, 100].includes(speed)) return;
        speedMultiplier = speed;
        panel.querySelectorAll('[data-time-slip-speed]').forEach(button => {
            button.classList.toggle('active', Number(button.dataset.timeSlipSpeed) === speed);
        });
    }

    async function sendControl(action) {
        if (!enabled || !isAuthorizedHero()) return;
        try {
            setStatus(`${action} 요청 중...`);
            const controlFunction = firebase.app().functions('asia-northeast3').httpsCallable('controlSimulation');
            const response = await controlFunction({ season_id: currentSeasonId, action, speed: speedMultiplier });
            setStatus(action === 'STEP' ? 'STEP 처리 중...' : response.data.clock_status || action);
        } catch (error) {
            console.error(`Simulation control [${action}] failed:`, error);
            setStatus(`오류: ${error.message || error.code || '요청 실패'}`);
        }
    }

    window.playDevFeatures = window.playDevFeatures || {};
    window.playDevFeatures.timeSlip = {
        get enabled() {
            return enabled;
        },
        deactivate,
        syncAuth,
    };

    toggle.hidden = true;
    panel.hidden = true;
    activityPanel.hidden = true;
    toggle.addEventListener('change', () => setEnabled(toggle.checked));
    panel.querySelectorAll('[data-time-slip-action]').forEach(button => {
        button.addEventListener('click', () => sendControl(button.dataset.timeSlipAction));
    });
    panel.querySelectorAll('[data-time-slip-speed]').forEach(button => {
        button.addEventListener('click', () => setSpeed(Number(button.dataset.timeSlipSpeed)));
    });
})();
