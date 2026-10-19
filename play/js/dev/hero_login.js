(() => {
    if (!window.playRuntime?.isEmulatorMode) return;

    const loginButton = document.getElementById('hero-login-btn');
    if (!loginButton) return;

    const accountSwitchButton = document.createElement('button');
    accountSwitchButton.type = 'button';
    accountSwitchButton.id = 'play-test-account-switch';
    accountSwitchButton.className = 'btn btn-sm btn-outline-secondary ms-2';
    accountSwitchButton.hidden = true;
    accountSwitchButton.textContent = 'AI 소유자 계정으로 전환';
    loginButton.insertAdjacentElement('afterend', accountSwitchButton);

    window.playDevFeatures = window.playDevFeatures || {};
    window.playDevFeatures.heroLogin = {
        syncAuth(user) {
            loginButton.hidden = Boolean(user);
            accountSwitchButton.hidden = !user;
            accountSwitchButton.textContent = user?.uid === 'AI_TEST_OWNER_USER'
                ? 'HERO 계정으로 전환'
                : 'AI 소유자 계정으로 전환';
        },
    };

    loginButton.hidden = false;
    loginButton.addEventListener('click', async () => {
        if (!window.playRuntime?.isEmulatorMode) return;

        loginButton.disabled = true;
        try {
            await firebase.auth().signInWithEmailAndPassword('hero@aptrank.test', 'password123');
        } catch (error) {
            if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
                alert('HERO 테스트 계정이 없습니다. 먼저 npm run seed:exchange-emulator를 실행해주세요.');
            } else {
                alert(`로그인 에러: ${error.message}`);
            }
        } finally {
            loginButton.disabled = false;
        }
    });

    accountSwitchButton.addEventListener('click', async () => {
        if (!window.playRuntime?.isEmulatorMode) return;

        const auth = firebase.auth();
        const target = auth.currentUser?.uid === 'AI_TEST_OWNER_USER'
            ? { email: 'hero@aptrank.test', password: 'password123' }
            : { email: 'ai-owner@aptrank.test', password: 'password123' };
        accountSwitchButton.disabled = true;
        try {
            await auth.signOut();
            await auth.signInWithEmailAndPassword(target.email, target.password);
        } catch (error) {
            alert(`테스트 계정 전환 오류: ${error.message}`);
        } finally {
            accountSwitchButton.disabled = false;
        }
    });
})();
