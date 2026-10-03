(() => {
    if (!window.playRuntime?.isEmulatorMode) return;

    const loginButton = document.getElementById('hero-login-btn');
    if (!loginButton) return;

    window.playDevFeatures = window.playDevFeatures || {};
    window.playDevFeatures.heroLogin = {
        syncAuth(user) {
            loginButton.hidden = Boolean(user);
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
                alert('HERO 계정이 생성되지 않았거나 비밀번호가 틀렸습니다. 에뮬레이터에서 계정을 먼저 생성해주세요.');
            } else {
                alert(`로그인 에러: ${error.message}`);
            }
        } finally {
            loginButton.disabled = false;
        }
    });
})();
