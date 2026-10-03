(() => {
    const projectId = 'aptrank-cc61b';

    window.playRuntime = Object.freeze({
        isEmulatorMode: false,
        mode: 'production',
        projectId,
    });

    firebase.initializeApp({
        projectId,
        apiKey: 'AIzaSyAivJVoqhrDQzuslEAoizhb5ByGhpQGHzE',
    });
})();
