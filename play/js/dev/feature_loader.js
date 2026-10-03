(() => {
    if (!window.playRuntime?.isEmulatorMode) {
        window.playDevFeaturesReady = Promise.resolve();
        return;
    }

    const loadFeature = source => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = source;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Unable to load local PLAY feature: ${source}`));
        document.head.appendChild(script);
    });

    window.playDevFeaturesReady = Promise.all([
        loadFeature('./js/dev/hero_login.js'),
        loadFeature('./js/dev/time_slip.js'),
    ]).catch(error => {
        console.error('Local PLAY development features could not be loaded:', error);
    });
})();
