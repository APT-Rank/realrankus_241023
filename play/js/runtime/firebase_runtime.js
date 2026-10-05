(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isEmulatorMode = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
    const projectId = isEmulatorMode ? 'demo-play' : 'aptrank-cc61b';

    window.playRuntime = Object.freeze({
        isEmulatorMode,
        mode: isEmulatorMode ? 'emulator' : 'production',
        projectId,
    });

    firebase.initializeApp({
        projectId,
        apiKey: isEmulatorMode ? 'demo-api-key' : 'AIzaSyAivJVoqhrDQzuslEAoizhb5ByGhpQGHzE',
    });

    if (isEmulatorMode) {
        firebase.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
        firebase.firestore().useEmulator('127.0.0.1', 8080);
        firebase.app().functions('asia-northeast3').useEmulator('127.0.0.1', 5001);
    }
})();
