/**
 * PLAY - IA-02 Implementation
 * WORLD -> REGION -> COMPLEX -> LISTING -> LISTING DETAIL
 */

// Global State
let playerState = { cash: null };
let currentUser = null;
let currentSeasonId = 'S_FINAL'; 
let currentContext = 'WORLD'; // WORLD, REGION, COMPLEX, LISTING, LISTING_DETAIL
let currentSeasonState = null;
let seasonCardState = null;
let seasonEconomicEvents = [];
let seasonEventsLoaded = false;
let playerAssetUnsubscribe = null;
let playerAssetSubscriptionId = null;
const SEASON_ECONOMIC_METRIC_FIELDS = [
    { field: 'base_interest', valueId: 'season-metric-base-interest', deltaId: 'season-delta-base-interest' },
    { field: 'inflation', valueId: 'season-metric-inflation', deltaId: 'season-delta-inflation' },
    { field: 'income_rate', valueId: 'season-metric-income-rate', deltaId: 'season-delta-income-rate' },
    { field: 'DSR', valueId: 'season-metric-dsr', deltaId: 'season-delta-dsr' },
    { field: 'LTV', valueId: 'season-metric-ltv', deltaId: 'season-delta-ltv' }
];
let liveActivityRecords = [];
let seasonStateUnsubscribe = null;
let seasonStateSubscriptionId = null;
let seasonCardStateUnsubscribe = null;
let seasonEventsUnsubscribe = null;
let participantUnsubscribe = null;
let participantSeasonId = null;
const participantAssetUnsubscribers = new Map();
let seasonParticipants = [];

function isHeroTestSeason() {
    return false;
}

function isTimeSlipEnabled() {
    return false;
}

async function resolveActivePlayerSeason(user) {
    const firestore = firebase.firestore();
    const playersSnapshot = await firestore.collection('PLAY_PLAYER')
        .where('user_id', '==', user.uid)
        .get();
    const players = playersSnapshot.docs
        .map(document => document.data())
        .filter(player => player.status === 'ACTIVE' && player.season_id && player.player_id);

    if (!players.length) {
        throw new Error('No active PLAY_PLAYER record exists for this account.');
    }

    const seasonIds = [...new Set(players.map(player => player.season_id))];
    const seasonEntries = await Promise.all(seasonIds.map(async seasonId => {
        const seasonDocument = await firestore.collection('PLAY_SEASON').doc(seasonId).get();
        return [seasonId, seasonDocument.exists ? seasonDocument.data() : null];
    }));
    const seasons = new Map(seasonEntries);
    const memberships = players.filter(player => seasons.get(player.season_id)?.status === 'ACTIVE');

    if (memberships.length !== 1) {
        throw new Error(memberships.length ? 'Multiple active PLAY seasons found for this account.' : 'No active PLAY_SEASON exists for this account.');
    }

    const player = memberships[0];
    return { player, seasonId: player.season_id, season: seasons.get(player.season_id) };
}

function stopSeasonStateSubscription() {
    if (seasonStateUnsubscribe) seasonStateUnsubscribe();
    seasonStateUnsubscribe = null;
    seasonStateSubscriptionId = null;
}

function stopPlayerAssetSubscription() {
    if (playerAssetUnsubscribe) playerAssetUnsubscribe();
    playerAssetUnsubscribe = null;
    playerAssetSubscriptionId = null;
}

function subscribeToPlayerAsset(playerId) {
    if (playerAssetSubscriptionId === playerId && playerAssetUnsubscribe) return;
    stopPlayerAssetSubscription();
    if (!playerId) return;

    playerAssetSubscriptionId = playerId;
    playerAssetUnsubscribe = firebase.firestore().collection('PLAY_PLAYER_ASSET').doc(playerId).onSnapshot(assetDocument => {
        if (!assetDocument.exists || playerState?.player_id !== playerId) return;
        playerState = { ...playerState, asset: assetDocument.data() };
        updateMyWorldUI();
    }, error => console.error(`Player asset listener failed (${playerId}):`, error));
}

function stopSeasonCardSubscriptions() {
    if (seasonCardStateUnsubscribe) seasonCardStateUnsubscribe();
    if (seasonEventsUnsubscribe) seasonEventsUnsubscribe();
    seasonCardStateUnsubscribe = null;
    seasonEventsUnsubscribe = null;
    seasonEconomicEvents = [];
    seasonEventsLoaded = false;
}

function toSeasonPercentPoints(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string' && value.trim().endsWith('%')) {
        const parsedValue = Number.parseFloat(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
    }
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;
    return Math.abs(numericValue) <= 1 ? numericValue * 100 : numericValue;
}

function getSeasonMetricValues(season) {
    return Object.fromEntries(SEASON_ECONOMIC_METRIC_FIELDS.map(({ field }) => [
        field,
        toSeasonPercentPoints(season?.[field])
    ]));
}

function calculateSeasonMetricDeltas(currentValues, previousValues) {
    return Object.fromEntries(SEASON_ECONOMIC_METRIC_FIELDS.map(({ field }) => {
        const currentValue = currentValues?.[field];
        const previousValue = previousValues?.[field];
        return [field, Number.isFinite(currentValue) && Number.isFinite(previousValue)
            ? currentValue - previousValue
            : 0];
    }));
}

function getSeasonEconomicEventMetricDeltas() {
    const [currentEvent, previousEvent] = seasonEconomicEvents;
    if (!currentEvent || !previousEvent) {
        return Object.fromEntries(SEASON_ECONOMIC_METRIC_FIELDS.map(({ field }) => [field, 0]));
    }
    return calculateSeasonMetricDeltas(
        getSeasonMetricValues(currentEvent),
        getSeasonMetricValues(previousEvent)
    );
}

function setSeasonCardState(season) {
    seasonCardState = season;
    updateSeasonProgressCard();
}

function subscribeToSeasonState(seasonId) {
    if (seasonStateSubscriptionId === seasonId && seasonStateUnsubscribe) return;
    stopSeasonStateSubscription();
    seasonStateSubscriptionId = seasonId;
    if (seasonId === 'S_FINAL' && seasonCardStateUnsubscribe) {
        seasonCardStateUnsubscribe();
        seasonCardStateUnsubscribe = null;
    }
    seasonStateUnsubscribe = firebase.firestore().collection('PLAY_SEASON').doc(seasonId).onSnapshot(seasonDocument => {
        if (currentSeasonId !== seasonId) return;
        currentSeasonState = seasonDocument.exists ? seasonDocument.data() : null;
        if (seasonId === 'S_FINAL') setSeasonCardState(currentSeasonState);
        else updateSeasonProgressCard();
    }, error => console.error(`Season state listener failed (${seasonId}):`, error));
}

function subscribeToSeasonCard() {
    const firestore = firebase.firestore();
    if (seasonStateSubscriptionId === 'S_FINAL' && seasonStateUnsubscribe) {
        setSeasonCardState(currentSeasonState);
    } else if (!seasonCardStateUnsubscribe) {
        seasonCardStateUnsubscribe = firestore.collection('PLAY_SEASON').doc('S_FINAL').onSnapshot(seasonDocument => {
            setSeasonCardState(seasonDocument.exists ? seasonDocument.data() : null);
        }, error => {
            console.error('Season card state listener failed (S_FINAL):', error);
            setSeasonCardState(null);
        });
    }

    if (!seasonEventsUnsubscribe) {
        seasonEventsUnsubscribe = firestore.collection('PLAY_SEASON').doc('S_FINAL')
            .collection('season_event')
            .orderBy('created_at', 'desc')
            .onSnapshot(eventsSnapshot => {
                seasonEconomicEvents = eventsSnapshot.docs.map(document => ({
                    id: document.id,
                    ...document.data()
                }));
                seasonEventsLoaded = true;
                renderSeasonEconomicEvents();
                renderSeasonEconomicMetrics();
            }, error => {
                console.error('Season economic events listener failed (S_FINAL):', error);
                seasonEconomicEvents = [];
                seasonEventsLoaded = true;
                renderSeasonEconomicEvents();
            });
    }
    updateSeasonProgressCard();
}

function setupHeroLogin(auth) {
    const loginButton = document.getElementById('hero-login-btn');
    const loginModal = document.getElementById('hero-login-modal');
    const loginForm = document.getElementById('hero-login-form');
    const emailInput = document.getElementById('hero-login-email');
    const passwordInput = document.getElementById('hero-login-password');
    const errorElement = document.getElementById('hero-login-error');
    const submitButton = document.getElementById('hero-login-submit');
    if (!loginButton || !loginModal || !loginForm) return;

    loginButton.addEventListener('click', () => {
        errorElement.textContent = '';
        bootstrap.Modal.getOrCreateInstance(loginModal).show();
    });
    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        errorElement.textContent = '';
        submitButton.disabled = true;
        try {
            await auth.signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value);
            passwordInput.value = '';
            bootstrap.Modal.getOrCreateInstance(loginModal).hide();
        } catch (error) {
            errorElement.textContent = error.message || 'Firebase sign-in failed.';
        } finally {
            submitButton.disabled = false;
        }
    });
}

async function initFirebaseAndPlayer() {
    const auth = firebase.auth();
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (error) {
        console.warn('Firebase Auth persistence could not be enabled:', error);
    }
    setupHeroLogin(auth);
    auth.onAuthStateChanged(async (user) => {
        const loginButton = document.getElementById('hero-login-btn');
        const heroStatus = document.getElementById('hero-auth-status');
        stopPlayerAssetSubscription();
        if (loginButton) loginButton.hidden = Boolean(user);
        if (user) {
            currentUser = user;
            // Only the local emulator HERO opens the isolated test season.
            // TIME-SLIP controls test visibility/actions, not user identity.
            const userSeasonId = currentSeasonId;


            if (currentSeasonId !== userSeasonId) {
                window.playDevFeatures?.timeSlip?.deactivate();
                resetSeasonParticipants();
            }
            currentSeasonId = userSeasonId;
            window.playDevFeatures?.heroLogin?.syncAuth(user);
            window.playDevFeatures?.timeSlip?.syncAuth(user);
            if (heroStatus) heroStatus.textContent = 'Loading PLAY…';
            try {
                const membership = await resolveActivePlayerSeason(user);
                if (currentSeasonId !== membership.seasonId) {
                    window.playDevFeatures?.timeSlip?.deactivate();
                    resetSeasonParticipants();
                }
                currentSeasonId = membership.seasonId;
                currentSeasonState = membership.season;
                subscribeToSeasonState(currentSeasonId);
                subscribeToSeasonCard();
                const getPlayerState = firebase.app().functions('asia-northeast3').httpsCallable('getPlayerState');
                const res = await getPlayerState({ season_id: currentSeasonId });
                if (res.data.player_id !== membership.player.player_id) {
                    throw new Error('PLAY_PLAYER identity changed while loading account state.');
                }
                playerState = { ...res.data, ownership: res.data.ownership || res.data.ownerships || [] };
                subscribeToPlayerAsset(playerState.player_id);
                if (heroStatus) heroStatus.textContent = playerState.player_id;
                console.log('PLAY state loaded from Firestore', currentSeasonId, playerState.player_id);
                if (isHeroTestSeason()) {
                    try {
                        const seasonDoc = await firebase.firestore().collection('PLAY_SEASON').doc(currentSeasonId).get();
                        currentSeasonState = seasonDoc.exists ? seasonDoc.data() : null;
                    } catch (seasonError) {
                        console.warn('HERO season metadata is not readable yet:', seasonError.message);
                    }
                }
            } catch (e) {
                stopPlayerAssetSubscription();
                stopSeasonStateSubscription();
                subscribeToSeasonCard();
                if (e.message && e.message.includes('not found')) {
                    console.warn(`Player not found in current season (${currentSeasonId}).`);
                } else {
                    console.error("Failed to load player state", e);
                }
                playerState = { player_id: null, asset: null, ownership: [] };
                currentSeasonState = null;
                if (heroStatus) heroStatus.textContent = 'PLAY setup unavailable';
            }
            updateMyWorldUI();
            updateCommandPanel();
        } else {
            console.log("Not logged in");
            stopPlayerAssetSubscription();
            stopSeasonStateSubscription();
            stopSeasonCardSubscriptions();
            window.playDevFeatures?.timeSlip?.syncAuth(null);
            window.playDevFeatures?.heroLogin?.syncAuth(null);
            if (heroStatus) heroStatus.textContent = 'Not signed in';
            currentUser = null;
            currentSeasonId = 'S_FINAL';
            currentSeasonState = null;
            seasonCardState = null;
            resetSeasonParticipants();
            playerState = { player_id: null, asset: null, ownership: [] };
            updateMyWorldUI();
        }
    });
}

let selectedRegion = null;
let selectedComplex = null;
let selectedListing = null;
let map = null;
let homeMap = null;
let mapViewMap = null;
let markers = [];
const complexMarkerInstances = new Map();
const regionMarkerInstances = new Map();
let activeMarkerMode = null;
let currentMarkerInfoWindow = null;
let markerHoverZIndex = 1000;
const LARGE_MARKER_PAN_DURATION_MS = 500;
let regionMasterCache = new Map();
let regionMasterRequests = new Map();
let markerRenderSequence = 0;
let initialMapRenderPending = false;
let visibleComplexMarkers = [];
let complexSelectionSequence = 0;
let selectedComplexId = null;
let selectedComplexLoadError = null;
let selectedComplexMapPosition = null;
let selectedComplexSupplyByPropertyId = new Map();
let selectedComplexSupplyStatus = 'loading';
let dynamicContextDismissed = false;
let dynamicContextMapReady = false;
let dynamicContextRevealTimer = null;
const dynamicContextBoundMaps = new WeakSet();
let allProperties = [];
let complexDataMap = {}; // { 'complex_name': [property1, property2] }
const complexDetailsCache = new Map();
const complexDetailsRequests = new Map();
const propertyMasterCache = new Map();
const propertyMasterRequests = new Map();
const complexMasterSummaryCache = new Map();
const complexMasterSummaryRequests = new Map();
const complexSearchCache = new Map();
let searchDebounceTimer = null;
let searchRequestSequence = 0;
const mapUiState = {
    layer: null,
    tool: null,
    onlyTradable: false,
    favoriteRegions: new Set(),
    favoriteComplexes: new Set()
};

// Decision State Variables
let decisionState = 'NONE'; // NONE, EXPLORE, COMPARE, HOLD, BUY_INTENT, FUNDING_CHECK, COST_CHECK, EXPECTED_RESULT, BUY_CONFIRMATION, IA_03C_ENTRY
let watchState = false;

// Localized Strings
const LANG = {
    WORLD: '세계',
    REGION: '지역',
    COMPLEX: '아파트 단지',
    LISTING: '매물',
    LISTING_DETAIL: '매물 상세',
    BACK_TO_WORLD: '세계로 돌아가기',
    BACK_TO_REGION: '지역으로 돌아가기',
    BACK_TO_COMPLEX: '단지로 돌아가기',
    BACK_TO_LISTING: '매물 목록으로 돌아가기',
    VIEW_LISTINGS: '매물 보기',
    PRICE: '가격',
    AREA: '면적',
    FLOOR: '층',
    DIRECTION: '방향',
    RECENT_TRANSACTION: '최근 실거래',
    CURRENT_PRICE: '현재 가격',
    FILTER: '필터',
    SORT: '정렬',
    DETAILS: '상세 정보',
    AVAILABLE: '거래 가능',
    UNAVAILABLE: '거래 불가'
};

// Formatting helpers
function formatPrice(price) {
    if (price === 0) return '0원';
    if (!price || isNaN(price)) return '확인 불가';
    // Format to 억 단위
    return (price / 100000000).toFixed(1) + '억';
}

function formatDate(dateString) {
    if (!dateString) return '미기재';
    return dateString.split('T')[0];
}

// Data Loading
function setInitialMapLoading(isLoading) {
    const overlay = document.getElementById('map-initial-loading');
    if (overlay) overlay.hidden = !isLoading;
}

function finishInitialMapRender(renderSequence) {
    if (!initialMapRenderPending) return;
    if (renderSequence !== undefined && renderSequence !== markerRenderSequence) return;
    initialMapRenderPending = false;
    setInitialMapLoading(false);
}

async function loadData() {
    initialMapRenderPending = true;
    setInitialMapLoading(true);
    try {
        let tileManifest = null;
        try {
            tileManifest = await playMapTiles.loadManifest();
            console.log(`Loaded map catalog ${tileManifest.version} with ${tileManifest.marker_count} complex markers.`);
        } catch (manifestError) {
            console.warn('Map marker tiles are not built or deployed yet:', manifestError.message);
        }

        initMap();
        renderFeaturedAreas(tileManifest?.featured_regions || []);
        updateCommandPanel();
    } catch (e) {
        console.error('Failed to initialize PLAY map data', e);
        finishInitialMapRender();
    }
}

function cachePropertyMaster(property) {
    if (!property || !property.property_id) return;
    const propertyId = String(property.property_id);
    propertyMasterCache.set(propertyId, property);
    const existingIndex = allProperties.findIndex(item => String(item.property_id) === propertyId);
    if (existingIndex >= 0) allProperties[existingIndex] = property;
    else allProperties.push(property);
}

async function loadPropertyMasterById(propertyId) {
    const key = String(propertyId || '');
    if (!key) return null;
    if (propertyMasterCache.has(key)) return propertyMasterCache.get(key);
    if (propertyMasterRequests.has(key)) return propertyMasterRequests.get(key);

    const request = firebase.firestore().collection('PLAY_PROPERTY_MASTER').doc(key).get()
        .then(snapshot => {
            if (!snapshot.exists) return null;
            const data = snapshot.data();
            const property = { ...data, property_id: data.property_id || snapshot.id };
            cachePropertyMaster(property);
            return property;
        })
        .finally(() => propertyMasterRequests.delete(key));
    propertyMasterRequests.set(key, request);
    return request;
}

async function loadComplexProperties(complexName, complexId) {
    const cacheKey = String(complexId || complexName || '');
    if (complexDetailsCache.has(cacheKey)) {
        return complexDetailsCache.get(cacheKey);
    }
    if (complexDetailsRequests.has(cacheKey)) return complexDetailsRequests.get(cacheKey);

    const request = (async () => {
        const db = firebase.firestore();
        let query = db.collection('PLAY_PROPERTY_MASTER');
        query = complexId !== null && complexId !== undefined && String(complexId).trim() !== ''
            ? query.where('complex_id', '==', complexId)
            : query.where('complex_name', '==', complexName);
        const properties = [];
        let cursor = null;
        while (true) {
            let pageQuery = query.orderBy(firebase.firestore.FieldPath.documentId()).limit(100);
            if (cursor) pageQuery = pageQuery.startAfter(cursor);
            const snapshot = await pageQuery.get();
            snapshot.docs.forEach(document => {
                const property = { ...document.data(), property_id: document.data().property_id || document.id };
                properties.push(property);
                cachePropertyMaster(property);
            });
            if (snapshot.empty || snapshot.size < 100) break;
            cursor = snapshot.docs[snapshot.docs.length - 1];
        }
        complexDetailsCache.set(cacheKey, properties);
        return properties;
    })().finally(() => complexDetailsRequests.delete(cacheKey));

    complexDetailsRequests.set(cacheKey, request);
    return request;
}

async function loadComplexPrimarySupply(properties, seasonId) {
    const propertyIds = [...new Map(properties
        .filter(property => property.property_status === 'NORMAL' && property.tradable === true && property.property_id !== null && property.property_id !== undefined)
        .map(property => [String(property.property_id), property.property_id])).values()];
    const propertyIdBatches = [];
    for (let index = 0; index < propertyIds.length; index += 10) {
        propertyIdBatches.push(propertyIds.slice(index, index + 10));
    }

    const supplySnapshots = await Promise.all(propertyIdBatches.map(propertyIdBatch => firebase.firestore()
        .collection('PLAY_PRIMARY_SUPPLY')
        .where('season_id', '==', seasonId)
        .where('property_id', 'in', propertyIdBatch)
        .get()));
    const supplyByPropertyId = new Map();
    supplySnapshots.forEach(snapshot => snapshot.forEach(document => {
        const supply = document.data();
        supplyByPropertyId.set(String(supply.property_id), Number(supply.remaining_supply) || 0);
    }));
    return supplyByPropertyId;
}

async function loadComplexMasterSummary(complexId) {
    if (complexId === null || complexId === undefined || String(complexId).trim() === '') return null;
    const key = String(complexId);
    if (complexMasterSummaryCache.has(key)) return complexMasterSummaryCache.get(key);
    if (complexMasterSummaryRequests.has(key)) return complexMasterSummaryRequests.get(key);

    const request = (async () => {
        const queryIds = [complexId];
        if (typeof complexId === 'string' && /^\d+$/.test(complexId.trim())) {
            queryIds.push(Number(complexId));
        } else if (typeof complexId === 'number') {
            queryIds.push(String(complexId));
        }

        const summary = { representative_area_label: null, initial_price: null };
        for (const queryId of queryIds) {
            const snapshot = await firebase.firestore().collection('PLAY_PROPERTY_MASTER')
                .where('complex_id', '==', queryId)
                .limit(1)
                .get();
            const property = snapshot.docs[0]?.data();
            if (!property) continue;

            const label = String(property.representative_area_label || '').trim();
            if (label && label.replace(/\s/g, '') !== '정보없음') summary.representative_area_label = label;
            const initialPrice = Number(property.initial_price);
            if (Number.isFinite(initialPrice) && initialPrice > 0) summary.initial_price = initialPrice;
            if (summary.representative_area_label && summary.initial_price !== null) break;
        }

        complexMasterSummaryCache.set(key, summary);
        return summary;
    })()
        .finally(() => complexMasterSummaryRequests.delete(key));
    complexMasterSummaryRequests.set(key, request);
    return request;
}

// Map Initialization
function initMap() {
    homeMap = map = new naver.maps.Map('map-container', {
        center: new naver.maps.LatLng(37.3220, 127.0970),
        zoom: 16,
        minZoom: 5,
        zoomControl: true,
        zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
        }
    });
    
    const homeMapInstance = map;
    naver.maps.Event.addListener(homeMapInstance, 'idle', function() {
        if (map === homeMapInstance && ['WORLD', 'MAP_VIEW', 'REGION', 'COMPLEX', 'LISTING'].includes(currentContext)) {
            renderWorldMarkers();
        }
    });

    bindMapControls();

    const renderInitialMarkers = attempt => {
        requestAnimationFrame(() => {
            if (map !== homeMapInstance) {
                finishInitialMapRender();
                return;
            }
            if (!map.getBounds()) {
                if (attempt < 10) setTimeout(() => renderInitialMarkers(attempt + 1), 100);
                else finishInitialMapRender();
                return;
            }
            renderWorldMarkers();
        });
    };
    renderInitialMarkers(0);
}

function ensureMapViewMap() {
    if (mapViewMap) return mapViewMap;

    mapViewMap = new naver.maps.Map('map-view-map-container', {
        center: new naver.maps.LatLng(37.5, 127.0),
        zoom: 11,
        minZoom: 5,
        zoomControl: true,
        zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
        }
    });

    const mapViewInstance = mapViewMap;
    naver.maps.Event.addListener(mapViewInstance, 'idle', function() {
        if (map !== mapViewInstance) return;
        if (['WORLD', 'MAP_VIEW', 'REGION', 'COMPLEX', 'LISTING'].includes(currentContext)) {
            renderWorldMarkers();
        }
    });

    return mapViewInstance;
}

function bindMapControls() {
    document.querySelectorAll('[data-map-type]').forEach(button => {
        button.addEventListener('click', () => {
            const satellite = button.dataset.mapType === 'satellite';
            map.setMapTypeId(satellite ? naver.maps.MapTypeId.SATELLITE : naver.maps.MapTypeId.NORMAL);
            document.querySelectorAll('[data-map-type]').forEach(item => {
                const active = item === button;
                item.classList.toggle('active', active);
                item.setAttribute('aria-pressed', String(active));
            });
        });
    });

    document.querySelectorAll('[data-map-layer]').forEach(button => {
        button.addEventListener('click', () => {
            const layer = mapUiState.layer === button.dataset.mapLayer ? null : button.dataset.mapLayer;
            mapUiState.layer = layer;
            document.querySelectorAll('[data-map-layer]').forEach(item => {
                const active = item.dataset.mapLayer === layer;
                item.classList.toggle('active', active);
                item.setAttribute('aria-pressed', String(active));
            });
            renderMapInteractionPanel();
            renderCurrentMapMarkers();
        });
    });

    document.querySelectorAll('[data-map-tool]').forEach(button => {
        button.addEventListener('click', () => {
            const tool = mapUiState.tool === button.dataset.mapTool ? null : button.dataset.mapTool;
            mapUiState.tool = tool;
            document.querySelectorAll('[data-map-tool]').forEach(item => {
                const active = item.dataset.mapTool === tool;
                item.classList.toggle('active', active);
                item.setAttribute('aria-pressed', String(active));
            });
            renderMapInteractionPanel();
            renderCurrentMapMarkers();
        });
    });

    const searchInput = document.getElementById('map-search-input');
    const searchResults = document.getElementById('map-search-results');
    const clearSearch = document.getElementById('map-search-clear');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(renderSearchResults, 300);
        });
        searchInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                const firstResult = searchResults.querySelector('[data-search-region], [data-search-complex]');
                if (firstResult) firstResult.click();
            }
            if (event.key === 'Escape') searchResults.hidden = true;
        });
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            renderSearchResults();
        });
    }

    const panel = document.getElementById('map-interaction-panel');
    panel.addEventListener('click', event => {
        const action = event.target.closest('[data-map-action]')?.dataset.mapAction;
        if (action === 'close') {
            mapUiState.tool = null;
            mapUiState.layer = null;
            document.querySelectorAll('[data-map-tool]').forEach(button => {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            });
            document.querySelectorAll('[data-map-layer]').forEach(button => {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            });
            renderMapInteractionPanel();
            renderCurrentMapMarkers();
        } else if (action === 'toggle-tradable') {
            mapUiState.onlyTradable = !mapUiState.onlyTradable;
            renderMapInteractionPanel();
            renderCurrentMapMarkers();
        } else if (action === 'toggle-favorite') {
            toggleCurrentFavorite();
            renderMapInteractionPanel();
            renderCurrentMapMarkers();
        }
    });

    document.getElementById('featured-area-items')?.addEventListener('click', event => {
        const card = event.target.closest('[data-featured-region]');
        if (card) {
            selectRegion(card.dataset.featuredRegion, 12, new naver.maps.LatLng(Number(card.dataset.latitude), Number(card.dataset.longitude)));
        }
    });
}

async function renderSearchResults() {
    const input = document.getElementById('map-search-input');
    const results = document.getElementById('map-search-results');
    const clearButton = document.getElementById('map-search-clear');
    const query = input.value.trim();
    const requestSequence = ++searchRequestSequence;
    clearButton.hidden = !query;
    results.replaceChildren();
    if (!query) {
        results.hidden = true;
        return;
    }

    const options = [];
    if ('수지구'.includes(query) || 'suji-gu'.includes(query)) {
        options.push({ label: '수지구', detail: '지역', region: { region_name: '수지구', latitude: 37.322, longitude: 127.097, level: 'Level1' } });
    }

    if (query.length >= 2) {
        const loading = document.createElement('div');
        loading.className = 'map-search-empty';
        loading.textContent = '검색 중...';
        results.appendChild(loading);
        results.hidden = false;
        try {
            const db = firebase.firestore();
            const [complexSnapshot, regionSnapshot] = await Promise.all([
                db.collection('PLAY_PROPERTY_MASTER').orderBy('complex_name').startAt(query).endAt(`${query}\uf8ff`).limit(40).get(),
                db.collection('PLAY_PROPERTY_REGION_MASTER').orderBy('region_name').startAt(query).endAt(`${query}\uf8ff`).limit(10).get()
            ]);
            if (requestSequence !== searchRequestSequence || input.value.trim() !== query) return;

            const seenComplexes = new Set();
            complexSnapshot.docs.forEach(document => {
                const property = document.data();
                const id = String(property.complex_id || property.property_id || document.id);
                if (!property.complex_name || seenComplexes.has(id)) return;
                seenComplexes.add(id);
                options.push({
                    label: property.complex_name,
                    detail: '단지',
                    complex: { id: property.complex_id || property.property_id || document.id, name: property.complex_name, latitude: Number(property.y), longitude: Number(property.x) }
                });
            });
            regionSnapshot.docs.forEach(document => {
                const region = document.data();
                if (!region.region_name || !Number.isFinite(Number(region.latitude)) || !Number.isFinite(Number(region.longitude))) return;
                options.push({ label: region.region_name, detail: '지역', region });
            });
        } catch (error) {
            if (requestSequence !== searchRequestSequence) return;
            console.warn('Map search query failed:', error.message);
        }
    }

    if (!options.length) {
        const empty = document.createElement('div');
        empty.className = 'map-search-empty';
        empty.textContent = query.length < 2 ? '두 글자 이상 입력하세요.' : '검색 결과가 없습니다.';
        results.appendChild(empty);
    }
    options.slice(0, 10).forEach(option => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'map-search-result';
        item.setAttribute('role', 'option');
        item.innerHTML = `<span>${escapeHtml(option.label)}</span><small>${option.detail}</small>`;
        if (option.region) item.dataset.searchRegion = 'true';
        if (option.complex) item.dataset.searchComplex = option.complex.name;
        item.addEventListener('click', () => {
            if (option.region) {
                const region = option.region;
                const zoom = region.level === 'Level0' ? 9 : region.level === 'Level1' ? 11 : 12;
                selectRegion(region.region_name, zoom, new naver.maps.LatLng(Number(region.latitude), Number(region.longitude)));
            } else if (Number.isFinite(option.complex.latitude) && Number.isFinite(option.complex.longitude)) {
                selectComplex(option.complex.name, option.complex.latitude, option.complex.longitude, option.complex.id);
            }
            input.value = option.label;
            results.hidden = true;
        });
        results.appendChild(item);
    });
    results.hidden = false;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function renderFeaturedAreas(featuredRegions = []) {
    const container = document.getElementById('featured-area-items');
    if (!container) return;
    container.replaceChildren();
    featuredRegions.forEach(region => {
        if (!Number.isFinite(Number(region.latitude)) || !Number.isFinite(Number(region.longitude))) return;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'featured-area-card';
        card.dataset.featuredRegion = region.name;
        card.dataset.latitude = region.latitude;
        card.dataset.longitude = region.longitude;
        card.innerHTML = `<span class="wireframe-img" aria-hidden="true"></span><span><strong>${escapeHtml(region.name)}</strong><small>${Number(region.count).toLocaleString()}개 단지</small></span>`;
        container.appendChild(card);
    });
    if (!featuredRegions.length) {
        container.innerHTML = '<div class="featured-area-empty">전국 지도에서 지역을 탐색하세요.</div>';
    }
}

function renderMapInteractionPanel() {
    const panel = document.getElementById('map-interaction-panel');
    if (!panel) return;
    const descriptions = {
        volume: ['거래량', '현재 데이터에는 실거래 건수 시계열이 없어 지도 수치를 표시하지 않습니다. 등록 매물 수는 거래량과 다른 지표입니다.'],
        price: ['가격변화', '현재 데이터는 매물 스냅샷이며 과거 가격 시계열이 없어 상승·하락률을 표시하지 않습니다.'],
        jeonse: ['전세가율', '검증된 전세가 데이터가 없어 이 레이어에는 표시할 항목이 없습니다.'],
        development: ['개발호재', '검증된 개발계획 데이터가 연결되지 않았습니다. 확인되지 않은 위치는 지도에 표시하지 않습니다.'],
        favorites: ['내 관심', '관심 등록은 현재 세션에 보관됩니다. 아래에서 현재 지역 또는 단지를 등록할 수 있습니다.']
    };
    const toolDescriptions = {
        subway: ['지하철', '검증된 역 위치 데이터가 없어 표시할 항목이 없습니다.'],
        development: ['개발계획', '검증된 개발계획 데이터가 없어 표시할 항목이 없습니다.'],
        schools: ['학교', '검증된 학교 위치 데이터가 없어 표시할 항목이 없습니다.'],
        amenities: ['생활환경', '검증된 생활시설 데이터가 없어 표시할 항목이 없습니다.']
    };
    let title = '';
    let description = '';
    if (mapUiState.tool === 'filters') {
        title = '지도 필터';
        description = `<label class="map-filter-option"><input type="checkbox" data-map-action="toggle-tradable" ${mapUiState.onlyTradable ? 'checked' : ''}> 거래 가능 매물이 있는 단지만 표시</label><small>수지구 스냅샷의 거래 가능 여부를 사용합니다.</small>`;
    } else if (mapUiState.tool === 'favorites' || mapUiState.layer === 'favorites') {
        title = '관심지역';
        description = `${descriptions.favorites[1]}<button type="button" class="map-panel-action" data-map-action="toggle-favorite">${isCurrentFavorite() ? '현재 선택 해제' : '현재 선택 등록'}</button><small>등록한 지역 ${mapUiState.favoriteRegions.size}개 · 단지 ${mapUiState.favoriteComplexes.size}개</small>`;
    } else if (mapUiState.tool && toolDescriptions[mapUiState.tool]) {
        [title, description] = toolDescriptions[mapUiState.tool];
    } else if (mapUiState.layer && descriptions[mapUiState.layer]) {
        [title, description] = descriptions[mapUiState.layer];
    }
    if (!title) {
        panel.hidden = true;
        panel.replaceChildren();
        return;
    }
    panel.innerHTML = `<button type="button" class="map-panel-close" data-map-action="close" aria-label="패널 닫기">×</button><strong>${title}</strong><div class="map-panel-description">${description}</div>`;
    panel.hidden = false;
}

function isCurrentFavorite() {
    if (currentContext === 'COMPLEX' || currentContext === 'LISTING' || currentContext === 'LISTING_DETAIL') {
        return mapUiState.favoriteComplexes.has(selectedComplex);
    }
    return mapUiState.favoriteRegions.has(selectedRegion || 'Suji-gu');
}

function toggleCurrentFavorite() {
    if (currentContext === 'COMPLEX' || currentContext === 'LISTING' || currentContext === 'LISTING_DETAIL') {
        if (!selectedComplex) return;
        if (mapUiState.favoriteComplexes.has(selectedComplex)) mapUiState.favoriteComplexes.delete(selectedComplex);
        else mapUiState.favoriteComplexes.add(selectedComplex);
    } else {
        const region = selectedRegion || 'Suji-gu';
        if (mapUiState.favoriteRegions.has(region)) mapUiState.favoriteRegions.delete(region);
        else mapUiState.favoriteRegions.add(region);
    }
}

function renderCurrentMapMarkers() {
    if (['WORLD', 'MAP_VIEW', 'REGION', 'COMPLEX', 'LISTING'].includes(currentContext)) {
        renderWorldMarkers();
    }
}

function clearMarkers() {
    if (currentMarkerInfoWindow) {
        currentMarkerInfoWindow.close();
        currentMarkerInfoWindow = null;
    }
    markers.forEach(m => m.setMap(null));
    markers = [];
}

function resetActiveMapMarkerState() {
    markerRenderSequence += 1;
    clearMarkers();
    complexMarkerInstances.forEach(marker => marker.setMap(null));
    regionMarkerInstances.forEach(marker => marker.setMap(null));
    complexMarkerInstances.clear();
    regionMarkerInstances.clear();
    activeMarkerMode = null;
    visibleComplexMarkers = [];
}

// ---------------------------------------------------------
// RENDER MAP MARKERS
// ---------------------------------------------------------
function showComplexInfo(marker, isSmallMarker) {
    if (currentMarkerInfoWindow) currentMarkerInfoWindow.close();

    markerHoverZIndex += 2;
    marker.setZIndex(markerHoverZIndex);

    const infoWindow = new naver.maps.InfoWindow({
        content: `<div class="complex_info_window" style="text-align:center;border-radius:5px;border:2px solid #dd5249;padding:3px 8px;box-shadow:rgba(0,0,0,.25) 3px 3px 5px,rgba(0,0,0,.5) 2px 2px 4px;"><div id="info_window_complex_name" style="font-weight:600;user-select:none;">${escapeHtml(marker.apt_name)}</div><div id="info_window_complex_address" style="font-size:.85em;user-select:none;">${escapeHtml(marker.address)}</div></div>`,
        borderWidth: 0,
        anchorSize: new naver.maps.Size(0, 0),
        pixelOffset: new naver.maps.Point(isSmallMarker ? 5 : 20, -5)
    });

    marker.hoverInfoWindow = infoWindow;
    currentMarkerInfoWindow = infoWindow;
    infoWindow.open(map, marker);
}

function hideComplexInfo(marker) {
    if (!marker.hoverInfoWindow) return;

    marker.hoverInfoWindow.close();
    if (currentMarkerInfoWindow === marker.hoverInfoWindow) currentMarkerInfoWindow = null;
    marker.hoverInfoWindow = null;
}

function renderWorldMarkers() {
    const renderSequence = ++markerRenderSequence;
    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    const zoom = map.getZoom();
    const showComplexMarkers = currentContext !== 'MAP_VIEW' && zoom >= 14;
    const markerMode = showComplexMarkers ? 'complex' : 'administrative';
    if (markerMode !== activeMarkerMode) {
        clearMarkers();
        complexMarkerInstances.clear();
        regionMarkerInstances.clear();
        activeMarkerMode = markerMode;
    }
    
    if (showComplexMarkers) {
        // Show small complex markers one zoom level below the large markers
        const isSmallMarker = zoom < 15;
        const southwest = mapBounds.getSW();
        const northeast = mapBounds.getNE();
        const tileBounds = {
            west: southwest.lng(),
            east: northeast.lng(),
            south: southwest.lat(),
            north: northeast.lat()
        };
        playMapTiles.loadVisibleMarkers(tileBounds).then(async complexMarkers => {
            if (renderSequence !== markerRenderSequence || map.getZoom() !== zoom) return;
            const currentBounds = map.getBounds();
            if (!currentBounds) return;
            visibleComplexMarkers = complexMarkers.filter(comp => {
                const latitude = Number(comp.y);
                const longitude = Number(comp.x);
                return Number.isFinite(latitude) && Number.isFinite(longitude)
                    && currentBounds.hasLatLng(new naver.maps.LatLng(latitude, longitude));
            });
            const areaLabelEntries = [];
            if (!isSmallMarker) {
                for (let index = 0; index < visibleComplexMarkers.length; index += 10) {
                    const markerBatch = visibleComplexMarkers.slice(index, index + 10);
                    const batchEntries = await Promise.all(markerBatch.map(async comp => {
                        const complexId = comp.complex_id || comp.id;
                        try {
                        return [String(complexId || ''), await loadComplexMasterSummary(complexId)];
                        } catch (error) {
                            console.error(`Failed to load representative area for complex ${complexId}`, error);
                            return [String(complexId || ''), null];
                        }
                    }));
                    areaLabelEntries.push(...batchEntries);
                }
            }
            if (renderSequence !== markerRenderSequence || map.getZoom() !== zoom) return;
            const masterSummaries = new Map(areaLabelEntries);
            const desiredMarkerIds = new Set();
            visibleComplexMarkers.forEach(comp => {
            const complexName = comp.complex_name;
            if (mapUiState.onlyTradable && Number(comp.tradable_count || 0) < 1) return;
            if ((mapUiState.layer === 'favorites' || mapUiState.tool === 'favorites') && !mapUiState.favoriteComplexes.has(complexName)) return;
            const position = new naver.maps.LatLng(Number(comp.y), Number(comp.x));
            if (!Number.isFinite(Number(comp.y)) || !Number.isFinite(Number(comp.x)) || !currentBounds.hasLatLng(position)) return;
            const markerPrefix = isSmallMarker ? 'small_marker' : 'large_marker';
            const markerId = `${markerPrefix}_${String(comp.complex_id || comp.id || complexName).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
            const masterSummary = masterSummaries.get(String(comp.complex_id || comp.id || ''));
            const initialPrice = Number(masterSummary?.initial_price);
            const markerPrice = Number.isFinite(initialPrice) && initialPrice > 0 ? formatPrice(initialPrice) : '--';
            const markerArea = masterSummary?.representative_area_label || '--';
            const markerColor = '#198754';
            const markerKey = String(comp.complex_id || comp.id || complexName);
            const markerSignature = JSON.stringify([
                markerPrefix,
                complexName,
                Number(comp.y),
                Number(comp.x),
                comp.legal_dong_address || '',
                markerPrice,
                markerArea
            ]);
            desiredMarkerIds.add(markerKey);
            const markerContent = isSmallMarker ? `
                <svg version="1.1" class="small_marker_play" id="${markerId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="30" height="30">
                    <defs>
                        <style>
                            .small_marker_play { fill: ${markerColor}; stroke: ${markerColor}; stroke-width: 0.5; }
                            .small_marker_label { fill: #fff; font-size: 5px; font-weight: 600; }
                        </style>
                    </defs>
                    <path class="small_marker_play" d="M17.89,4.43,9.86.31a1.67,1.67,0,0,0-1.55,0L.36,4.43a.48.48,0,0,0-.24.42v9.58c0,.74.35,1.35.76,1.35h1l2.26,3.35,2.25-3.35h11c.41,0,.75-.61.75-1.35V4.86A.48.48,0,0,0,17.89,4.43Z" />
                    <text class="small_marker_label" text-anchor="middle" x="9" y="12">APT</text>
                </svg>` : `
                <svg version="1.1" class="large_marker gradeB" id="${markerId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" width="68" height="60">
                    <defs>
                        <style>
                            .gradeB { fill: ${markerColor}; }
                            .large_marker_gradeB { stroke: ${markerColor}; stroke-width: 0.5; }
                            .cls-2 { fill: #fff; }
                            .cls-3_text { fill: #fff; font-size: 8px; font-weight: 600; }
                            .cls-4_text { fill: #000; font-size: 7px; font-weight: 600; }
                            .cls-5_text { fill: #000; font-size: 5px; font-weight: 600; }
                        </style>
                    </defs>
                    <g class="svg_loc_large">
                        <path class="cls-1 large_marker_gradeB" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z" />
                        <path class="cls-2 large_marker_gradeB" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z" />
                        <text class="cls-3_text" text-anchor="middle" x="16.5" y="10">APT</text>
                        <text class="cls-4_text" text-anchor="middle" x="17" y="20">${markerPrice}</text>
                        <text class="cls-5_text" text-anchor="middle" x="17" y="26">${markerArea}</text>
                    </g>
                </svg>`;
            const existingMarker = complexMarkerInstances.get(markerKey);
            if (existingMarker?.playSignature === markerSignature) return;
            if (existingMarker) {
                if (existingMarker.hoverInfoWindow) hideComplexInfo(existingMarker);
                existingMarker.setPosition(position);
            }

            const marker = existingMarker || new naver.maps.Marker({
                position: position,
                map: map,
                title: comp.complex_name,
                icon: {
                    content: markerContent,
                    size: new naver.maps.Size(24, 37),
                    anchor: new naver.maps.Point(12, isSmallMarker ? 24 : 60)
                }
            });
            if (existingMarker) {
                existingMarker.setTitle(comp.complex_name);
                existingMarker.setIcon({
                    content: markerContent,
                    size: new naver.maps.Size(24, 37),
                    anchor: new naver.maps.Point(12, isSmallMarker ? 24 : 60)
                });
            }
            marker.playSignature = markerSignature;
            marker.apt_name = comp.complex_name;
            marker.address = comp.legal_dong_address || '주소 확인 불가';
            marker.playComplexContext = { comp, isSmallMarker };

            if (!existingMarker) {
                naver.maps.Event.addListener(marker, 'click', function() {
                const addressParts = String(comp.legal_dong_address || '').split(/\s+/).filter(Boolean);
                const regionName = [...addressParts].reverse().find(part => /(시|군|구)$/.test(part)) || selectedRegion;
                const { comp: markerComp, isSmallMarker: markerIsSmall } = marker.playComplexContext;
                selectComplex(markerComp.complex_name, markerComp.y, markerComp.x, markerComp.complex_id || markerComp.id, regionName, !markerIsSmall);
            });
            naver.maps.Event.addListener(marker, 'mouseover', function() {
                showComplexInfo(marker, marker.playComplexContext.isSmallMarker);
            });
            naver.maps.Event.addListener(marker, 'mouseout', function() {
                hideComplexInfo(marker);
            });

            }
            complexMarkerInstances.set(markerKey, marker);
        });
            complexMarkerInstances.forEach((marker, markerKey) => {
                if (desiredMarkerIds.has(markerKey)) return;
                if (marker.hoverInfoWindow) hideComplexInfo(marker);
                marker.setMap(null);
                complexMarkerInstances.delete(markerKey);
            });
            markers = Array.from(complexMarkerInstances.values());
            if (currentContext === 'REGION') updateCommandPanel();
        }).catch(error => {
            if (renderSequence === markerRenderSequence) console.error('Failed to load visible apartment markers', error);
        }).finally(() => {
            finishInitialMapRender(renderSequence);
        });
        return;
    }
    
    visibleComplexMarkers = [];
    if (currentContext === 'REGION') updateCommandPanel();
    renderAdministrativeMarkers(zoom, renderSequence).finally(() => {
        finishInitialMapRender(renderSequence);
    });
}

async function loadRegionMasterLevel(level) {
    if (regionMasterCache.has(level)) return regionMasterCache.get(level);
    if (regionMasterRequests.has(level)) return regionMasterRequests.get(level);

    const request = firebase.firestore()
        .collection('PLAY_PROPERTY_REGION_MASTER')
        .where('level', '==', level)
        .get()
        .then(snapshot => {
            const regions = snapshot.docs
                .map(document => {
                    const region = document.data();
                    region.name = escapeHtml(String(region.region_name || '').trim().split(/\s+/).filter(Boolean).at(-1) || region.region_name);
                    return region;
                })
                .filter(region => region.latitude !== null && region.latitude !== undefined
                    && region.longitude !== null && region.longitude !== undefined
                    && Number.isFinite(Number(region.latitude))
                    && Number.isFinite(Number(region.longitude)));
            regionMasterCache.set(level, regions);
            return regions;
        })
        .finally(() => regionMasterRequests.delete(level));

    regionMasterRequests.set(level, request);
    return request;
}

async function renderAdministrativeMarkers(zoom, renderSequence) {
    const regionLevel = zoom >= 12 ? 'Level2' : zoom >= 10 ? 'Level1' : zoom >= 9 ? 'Level0' : null;
    if (!regionLevel || ((mapUiState.layer === 'favorites' || mapUiState.tool === 'favorites') && !mapUiState.favoriteRegions.has('Suji-gu'))) {
        regionMarkerInstances.forEach(marker => marker.setMap(null));
        regionMarkerInstances.clear();
        markers = [];
        return;
    }

    let regions;
    try {
        regions = await loadRegionMasterLevel(regionLevel);
    } catch (error) {
        console.error(`Failed to load ${regionLevel} region markers`, error);
        return;
    }
    if (renderSequence !== markerRenderSequence || map.getZoom() !== zoom) return;
    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    const markerClass = regionLevel === 'Level2' ? 'lv2_marker' : regionLevel === 'Level1' ? 'lv1_marker' : 'lv0_marker';
    const markerWidth = regionLevel === 'Level0' ? '90px' : '65px';
    const nameFontSize = regionLevel === 'Level2' ? '0.7em' : regionLevel === 'Level1' ? '0.8em' : '1em';
    const priceFontSize = regionLevel === 'Level2' ? '0.8em' : regionLevel === 'Level1' ? '0.9em' : '1.1em';
    const nextZoom = regionLevel === 'Level2' ? 14 : regionLevel === 'Level1' ? 12 : 11;
    const desiredMarkerIds = new Set();

    regions.forEach(region => {
        const latitude = Number(region.latitude);
        const longitude = Number(region.longitude);
        const position = new naver.maps.LatLng(latitude, longitude);
        if (!mapBounds.hasLatLng(position)) return;
        const regionName = String(region.region_name || '').trim();
        const averagePriceValue = Number(region.average_price) * 10000;
        const averagePrice = Number.isFinite(averagePriceValue) && averagePriceValue > 0
            ? `${(averagePriceValue / 100000000).toFixed(2)}억`
            : '--';
        const markerKey = `${regionLevel}:${latitude}:${longitude}`;
        const markerSignature = JSON.stringify([
            regionLevel,
            latitude,
            longitude,
            regionName,
            region.name,
            averagePrice,
            nextZoom
        ]);
        desiredMarkerIds.add(markerKey);
        const existingMarker = regionMarkerInstances.get(markerKey);
        if (existingMarker?.playSignature === markerSignature) return;
        if (existingMarker) existingMarker.setMap(null);

        const marker = new naver.maps.Marker({
            position: position,
            map: map,
            title: `${regionName} ${averagePrice}`,
            icon: {
                content: `<div class="${markerClass}" style="background-color:#E43B46;color:#fff;text-align:center;width:${markerWidth};border-radius:5px;padding:3px 0;box-shadow:rgba(0,0,0,.25) 3px 3px 5px,rgba(0,0,0,.5) 2px 2px 4px;user-select:none;"><div class="${markerClass}_dong_name" style="font-size:${nameFontSize};">${region.name}</div><div class="${markerClass}_avg_price" style="font-size:${priceFontSize};">${averagePrice}</div></div>`,
                size: new naver.maps.Size(24, 37),
                anchor: new naver.maps.Point(8, 45)
            }
        });
        marker.playSignature = markerSignature;

        naver.maps.Event.addListener(marker, 'click', function() {
            const markerPosition = new naver.maps.LatLng(latitude, longitude);
            map.setCenter(markerPosition);
            map.setZoom(nextZoom);
        });

        regionMarkerInstances.set(markerKey, marker);
    });

    regionMarkerInstances.forEach((marker, markerKey) => {
        if (desiredMarkerIds.has(markerKey)) return;
        marker.setMap(null);
        regionMarkerInstances.delete(markerKey);
    });
    markers = Array.from(regionMarkerInstances.values());
}

function renderComplexMarkers() {
    // Deprecated: Now handled dynamically by renderWorldMarkers based on zoom level.
    renderWorldMarkers();
}

// ---------------------------------------------------------
// STATE TRANSITIONS
// ---------------------------------------------------------

function selectRegion(regionName, zoom = 14, center = new naver.maps.LatLng(37.3220, 127.0970)) {
    currentContext = 'REGION';
    selectedRegion = regionName;
    selectedComplex = null;
    selectedListing = null;

    map.morph(center, zoom);
    
    renderWorldMarkers();
    renderMapInteractionPanel();
    updateCommandPanel();
}

function positionDynamicContextPanel() {
    const panel = document.getElementById('dynamic-context');
    const mapWrapper = document.getElementById('map-wrapper');

    if (!panel || panel.hidden || !mapWrapper) return;





    const mapWidth = mapWrapper.clientWidth;
    const mapHeight = mapWrapper.clientHeight;



    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const preferredLeft = mapWidth / 2 + 54;
    const maxLeft = Math.max(12, mapWidth - panelWidth - 12);
    const preferredTop = (mapHeight - panelHeight) / 2;
    const maxTop = Math.max(12, mapHeight - panelHeight - 12);






    panel.style.left = `${Math.min(Math.max(preferredLeft, 12), maxLeft)}px`;
    panel.style.top = `${Math.min(Math.max(preferredTop, 12), maxTop)}px`;
}

function showDynamicContextPanel() {
    const panel = document.getElementById('dynamic-context');
    if (!panel || dynamicContextDismissed) return;

    panel.hidden = false;
    window.requestAnimationFrame(() => {
        if (panel.hidden || dynamicContextDismissed) return;
        positionDynamicContextPanel();
        panel.classList.add('is-visible');
    });
}

function hideDynamicContextPanel() {
    const panel = document.getElementById('dynamic-context');
    if (!panel) return;
    panel.classList.remove('is-visible');
    panel.hidden = true;
}

function closeDynamicContextPanel() {
    const panel = document.getElementById('dynamic-context');
    if (!panel) return;

    dynamicContextDismissed = true;
    if (dynamicContextRevealTimer) {
        window.clearTimeout(dynamicContextRevealTimer);
        dynamicContextRevealTimer = null;
    }
    panel.classList.remove('is-visible');
    window.setTimeout(() => {
        if (dynamicContextDismissed) panel.hidden = true;
    }, LARGE_MARKER_PAN_DURATION_MS);
}

function handleDynamicContextMapIdle() {
    dynamicContextMapReady = true;
    if (dynamicContextRevealTimer) {
        window.clearTimeout(dynamicContextRevealTimer);
        dynamicContextRevealTimer = null;
    }
    positionDynamicContextPanel();
    if (['COMPLEX', 'LISTING', 'LISTING_DETAIL'].includes(currentContext) && !dynamicContextDismissed) {
        showDynamicContextPanel();
    }
}

function bindDynamicContextMapEvents(activeMap) {
    if (!activeMap || dynamicContextBoundMaps.has(activeMap)) return;
    naver.maps.Event.addListener(activeMap, 'idle', handleDynamicContextMapIdle);
    dynamicContextBoundMaps.add(activeMap);
}

window.addEventListener('resize', positionDynamicContextPanel);
async function selectComplex(complexName, lat, lng, complexId, regionName, preserveZoom = false) {
    // Research Logging Hook: Complex 선택
    console.log(`[RESEARCH_LOGGING_HOOK] EXPOSURE: Complex Selected - ${complexName}`);
    
    const selectionSequence = ++complexSelectionSequence;
    if (currentMarkerInfoWindow) {
        currentMarkerInfoWindow.close();
        currentMarkerInfoWindow = null;
    }
    selectedComplexMapPosition = new naver.maps.LatLng(lat, lng);
    selectedComplexSupplyByPropertyId = new Map();
    selectedComplexSupplyStatus = 'loading';
    dynamicContextDismissed = false;
    bindDynamicContextMapEvents(map);
    const mapCenter = map.getCenter();
    const isAlreadyCentered = Math.abs(mapCenter.lat() - lat) < 0.000001
        && Math.abs(mapCenter.lng() - lng) < 0.000001
        && (preserveZoom || map.getZoom() === 15);
    dynamicContextMapReady = isAlreadyCentered;
    hideDynamicContextPanel();
    if (selectedComplex && selectedComplex !== complexName) delete complexDataMap[selectedComplex];
    currentContext = 'COMPLEX';
    selectedComplex = complexName;
    selectedComplexId = complexId ?? null;
    selectedRegion = regionName || selectedRegion;
    selectedListing = null;
    selectedComplexLoadError = null;
    delete complexDataMap[complexName];

    const center = selectedComplexMapPosition;
    if (preserveZoom) map.panTo(center, { duration: LARGE_MARKER_PAN_DURATION_MS });
    else map.morph(center, 15);
    dynamicContextMapReady = true;
    if (!dynamicContextMapReady) {
        dynamicContextRevealTimer = window.setTimeout(() => {
            if (selectionSequence !== complexSelectionSequence || dynamicContextDismissed || currentContext !== 'COMPLEX') return;
            dynamicContextMapReady = true;
            showDynamicContextPanel();
        }, 1200);
    }
    renderMapInteractionPanel();
    updateCommandPanel();
    try {
        const properties = await loadComplexProperties(complexName, selectedComplexId);
        if (selectionSequence !== complexSelectionSequence || currentContext !== 'COMPLEX' || selectedComplex !== complexName) return;
        complexDataMap[complexName] = properties;
        try {
            const supplyByPropertyId = await loadComplexPrimarySupply(properties, currentSeasonId);
            if (selectionSequence !== complexSelectionSequence || currentContext !== 'COMPLEX' || selectedComplex !== complexName) return;
            selectedComplexSupplyByPropertyId = supplyByPropertyId;
            const hasRemainingSupply = [...selectedComplexSupplyByPropertyId.values()].some(remainingSupply => remainingSupply > 0);
            selectedComplexSupplyStatus = hasRemainingSupply ? 'available' : 'unavailable';

        } catch (supplyError) {
            if (selectionSequence !== complexSelectionSequence) return;
            selectedComplexSupplyStatus = 'error';
            console.error(`Failed to load primary supply for ${complexName}`, supplyError);
        }
        updateCommandPanel();
    } catch (error) {
        if (selectionSequence !== complexSelectionSequence) return;
        selectedComplexLoadError = error;
        console.error(`Failed to load properties for ${complexName}`, error);
        updateCommandPanel();
    }
}

function viewListings() {
    currentContext = 'LISTING';
    selectedListing = null;
    updateCommandPanel();
}

function selectListing(propertyId) {
    // Research Logging Hook: Listing 선택
    console.log(`[RESEARCH_LOGGING_HOOK] EXPOSURE/DECISION: Listing Selected - ${propertyId}`);
    
    currentContext = 'LISTING_DETAIL';
    const props = complexDataMap[selectedComplex];
    selectedListing = props.find(p => String(p.property_id) === String(propertyId));
    if (!selectedListing) return;
    
    updateCommandPanel();
}

// Navigation Back Handlers
function restoreStandardMapLayout() {
    decisionState = 'NONE';
    document.getElementById('map-left-sidebar').style.display = 'none';
    document.getElementById('map-search-bar').style.display = 'flex';
    document.getElementById('map-left-toolbar').style.display = 'flex';
    document.getElementById('map-top-filters').classList.add('d-lg-flex');
    document.getElementById('map-top-filters').style.display = '';
    document.getElementById('map-bottom-carousel').classList.add('d-lg-block');
    document.getElementById('map-bottom-carousel').style.display = '';
}

function viewMapView() {
    currentContext = 'MAP_VIEW';
    document.getElementById('map-container').style.display = 'none';
    document.getElementById('map-view-map-container').style.display = 'block';

    const nextMap = ensureMapViewMap();
    if (map !== nextMap) {
        resetActiveMapMarkerState();
        map = nextMap;
    }
    nextMap.autoResize();
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;

    document.getElementById('map-view-container').style.display = 'flex';
    document.getElementById('full-screen-container').style.display = 'none';

    document.getElementById('map-left-sidebar').style.display = 'flex';
    document.getElementById('map-search-bar').style.display = 'none';
    document.getElementById('map-left-toolbar').style.display = 'none';
    document.getElementById('map-top-filters').classList.remove('d-lg-flex');
    document.getElementById('map-top-filters').style.display = 'none';
    document.getElementById('map-bottom-carousel').classList.remove('d-lg-block');
    document.getElementById('map-bottom-carousel').style.display = 'none';

    nextMap.autoResize();
    renderWorldMarkers();
    updateCommandPanel();
}

function goBackToWorld() {
    document.getElementById('map-view-map-container').style.display = 'none';
    document.getElementById('map-container').style.display = 'block';

    if (homeMap && map !== homeMap) {
        resetActiveMapMarkerState();
        map = homeMap;
    }
    if (homeMap) homeMap.autoResize();
    currentContext = 'WORLD';
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;

    document.getElementById('map-view-container').style.display = 'flex';
    document.getElementById('full-screen-container').style.display = 'none';
    restoreStandardMapLayout();

    if (homeMap) homeMap.autoResize();
    // Maintain current map viewport (center and zoom) when returning to Home
    renderWorldMarkers();
    updateCommandPanel();
}

function goBackToRegion() {
    if(!selectedRegion) return goBackToWorld();
    
    currentContext = 'REGION';
    selectedComplex = null;
    selectedListing = null;

    document.getElementById('map-view-container').style.display = 'flex';
    document.getElementById('full-screen-container').style.display = 'none';
    restoreStandardMapLayout();
    
    if (selectedRegion === 'Suji-gu') {
        map.morph(new naver.maps.LatLng(37.3220, 127.0970), 12);
        renderComplexMarkers();
    }
    updateCommandPanel();
}

function goBackToComplex() {
    if(!selectedComplex) return goBackToRegion();
    // retrieve lat lng
    const props = complexDataMap[selectedComplex];
    if(props && props.length > 0) {
        currentContext = 'COMPLEX';
        selectedListing = null;
        document.getElementById('map-view-container').style.display = 'flex';
        document.getElementById('full-screen-container').style.display = 'none';
        restoreStandardMapLayout();
        decisionState = 'NONE';
        map.morph(new naver.maps.LatLng(props[0].y, props[0].x), 15);
        updateCommandPanel();
    } else {
        goBackToRegion();
    }
}

function goBackToListing() {
    decisionState = 'NONE';
    viewListings();
}

// Decision Handlers
function doDecisionExplore() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: EXPLORE');
    decisionState = 'EXPLORE';
    updateCommandPanel();
}

function doDecisionCompare() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: COMPARE');
    decisionState = 'COMPARE';
    updateCommandPanel();
}

function toggleWatch() {
    watchState = !watchState;
    console.log(`[RESEARCH_LOGGING_HOOK] DECISION: WATCH ${watchState ? 'ON' : 'OFF'}`);
    updateCommandPanel();
}

function doDecisionHold() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: HOLD');
    decisionState = 'HOLD';
    updateCommandPanel();
}

function doBuyIntent() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: BUY_INTENT');
    decisionState = 'BUY_INTENT';
    updateCommandPanel();
}

function doFundingCheck() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: FUNDING_CHECK');
    decisionState = 'FUNDING_CHECK';
    updateCommandPanel();
}

function doCostCheck() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: COST_CHECK');
    decisionState = 'COST_CHECK';
    updateCommandPanel();
}

function doExpectedResult() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: EXPECTED_RESULT');
    decisionState = 'EXPECTED_RESULT';
    updateCommandPanel();
}

function doBuyConfirmation() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: BUY_CONFIRMATION');
    decisionState = 'BUY_CONFIRMATION';
    updateCommandPanel();
}

async function doBuyTransaction() {
    console.log('[RESEARCH_LOGGING_HOOK] DECISION: IA_03C_ENTRY');
    decisionState = 'IA_03C_ENTRY';
    updateCommandPanel();
    
    if (!currentUser) {
        alert("로그인이 필요합니다.");
        cancelDecision();
        return;
    }
    
    const p = selectedListing;
    if (!p) return;
    
    try {
        const purchasePrimaryProperty = firebase.app().functions('asia-northeast3').httpsCallable('purchasePrimaryProperty');
        const res = await purchasePrimaryProperty({
            season_id: currentSeasonId,
            property_id: p.property_id,
            idempotency_key: `BUY_${Date.now()}_${p.property_id}`,
            loan_request: window.currentLoanRequest || 0,
            research_context: {
                trace_id: `TR_${Date.now()}`,
                participant_id: currentUser.uid,
                simulation_period: (typeof currentSeasonState !== 'undefined' && currentSeasonState) ? currentSeasonState.current_simulation_period : 1
            }
        });
        console.log("Purchase Success", res.data);
        alert("구매가 완료되었습니다. 트랜잭션 ID: " + res.data.transaction_id);
        
        // Reload player state
        const getPlayerState = firebase.app().functions('asia-northeast3').httpsCallable('getPlayerState');
        const stateRes = await getPlayerState({ season_id: currentSeasonId });
        playerState = stateRes.data;
        updateMyWorldUI();
        
        window.latestBuyResult = {
            tx: res.data,
            property: p,
            cost: getTransactionCostRate(p.initial_price, p.representative_area_sqm) * p.initial_price
        };
        
        decisionState = 'BUY_RESULT';
        updateCommandPanel();
    } catch (e) {
        console.error("Purchase Failed", e);
        alert("구매 실패: " + e.message);
        cancelDecision();
    }
}

function cancelDecision() {
    decisionState = 'NONE';
    updateCommandPanel();
}

function goToMyWorld() {
    decisionState = 'NONE';
    selectedListing = null;
    selectedComplex = null;
    selectedRegion = null;
    currentContext = 'WORLD';
    document.getElementById('map-view-container').style.display = 'flex';
    document.getElementById('full-screen-container').style.display = 'none';
    updateCommandPanel();
    
    // Optionally focus or highlight the world command content here
}

async function viewOwnedPropertyDetail(propertyId) {
    decisionState = 'NONE';
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;
    
    window.selectedOwnedPropertyId = propertyId;
    currentContext = 'OWNED_PROPERTY_DETAIL';
    
    document.getElementById('map-view-container').style.display = 'none';
    const fsContainer = document.getElementById('full-screen-container');
    fsContainer.style.display = 'flex';
    
    // Find ownership data
    const prop = playerState && playerState.ownership ? playerState.ownership.find(o => o.property_id === propertyId) : null;
    
    if (!prop) {
        fsContainer.innerHTML = `
        <div class="screen-layout d-flex justify-content-center align-items-center w-100 h-100 bg-light">
            <div class="text-center">
                <i class="fa-solid fa-triangle-exclamation text-warning fs-1 mb-3"></i>
                <h5>보유 자산 정보를 찾을 수 없습니다.</h5>
                <button class="btn btn-primary mt-3" onclick="goToMyWorld()">내 세계</button>
                <button class="btn btn-outline-secondary mt-3" onclick="goToMyWorld()">세계로 돌아가기</button>
            </div>
        </div>`;
        return;
    }
    
    // Find Property Master data
    fsContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center w-100 h-100"><div class="text-muted">부동산 정보를 불러오는 중...</div></div>';
    let matchedProp = null;
    try {
        matchedProp = await loadPropertyMasterById(propertyId);
    } catch (error) {
        console.error('Failed to load owned property details', error);
    }
    if (currentContext !== 'OWNED_PROPERTY_DETAIL' || String(window.selectedOwnedPropertyId) !== String(propertyId)) return;
    
    if (!matchedProp) {
        fsContainer.innerHTML = `
        <div class="screen-layout d-flex justify-content-center align-items-center w-100 h-100 bg-light">
            <div class="text-center">
                <i class="fa-solid fa-triangle-exclamation text-warning fs-1 mb-3"></i>
                <h5>부동산 정보를 찾을 수 없습니다.</h5>
                <button class="btn btn-primary mt-3" onclick="goToMyWorld()">내 세계</button>
                <button class="btn btn-outline-secondary mt-3" onclick="goToMyWorld()">세계로 돌아가기</button>
            </div>
        </div>`;
        return;
    }
    
    const dt = prop.acquired_at ? new Date(prop.acquired_at._seconds * 1000).toLocaleString() : 'YYYY-MM-DD';
    
    fsContainer.innerHTML = `
    <div class="screen-layout bg-light d-flex justify-content-center pt-5 w-100 overflow-auto" style="height:100vh;">
        <div style="max-width: 600px; width: 100%; padding: 0 15px;">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold mb-0">상세 자산 정보</h4>
                <button class="btn btn-sm btn-outline-secondary" onclick="goToMyWorld()"><i class="fa-solid fa-xmark"></i> 닫기</button>
            </div>
            
            <!-- A. Ownership Summary -->
            <div class="card mb-3 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <h6 class="fw-bold text-primary"><i class="fa-solid fa-user-check me-1"></i>보유 정보</h6>
                </div>
                <div class="card-body pt-2">
                    <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                        <span class="text-muted small">상태</span>
                        <span class="badge bg-primary">보유 중</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">취득 가격</span>
                        <strong class="text-dark">${formatPrice(prop.acquisition_price)}</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span class="text-muted small">취득 일자</span>
                        <span class="text-dark small">${dt}</span>
                    </div>
                </div>
            </div>
            
            <!-- B. Complex Summary -->
            <div class="card mb-3 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <h6 class="fw-bold"><i class="fa-solid fa-building me-1"></i>단지 및 매물 정보</h6>
                </div>
                <div class="card-body pt-2">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">단지명</span>
                        <strong class="text-dark">${matchedProp.complex_name}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">매물 ID</span>
                        <span class="text-dark small">${matchedProp.property_id}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">대표 면적</span>
                        <span class="text-dark small">${matchedProp.representative_area_sqm}㎡</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">총 세대수</span>
                        <span class="text-dark small">${matchedProp.total_households ? matchedProp.total_households + '세대' : '정보 없음'}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">주소</span>
                        <span class="text-dark small text-end" style="word-break: keep-all;">${matchedProp.road_address || matchedProp.address || '정보 없음'}</span>
                    </div>
                </div>
            </div>
            
            <!-- C. Market Context -->
            <div class="card mb-4 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <h6 class="fw-bold text-success"><i class="fa-solid fa-chart-line me-1"></i>시장 정보</h6>
                </div>
                <div class="card-body pt-2">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">등록/참고 가격</span>
                        <strong class="text-dark">${formatPrice(matchedProp.initial_price)}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">최근 실거래가</span>
                        <span class="text-dark small">${matchedProp.sales_info_raw || '정보 없음'}</span>
                    </div>
                    <div class="d-flex justify-content-between pt-2 mt-2 border-top">
                        <span class="text-muted small fw-bold">현재 시장 가치</span>
                        <span class="text-primary small fw-bold">현재 가치 정보 없음</span>
                    </div>
                </div>
            </div>
            
            <!-- D. Map Context -->
            <div class="card mb-4 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <h6 class="fw-bold"><i class="fa-solid fa-map-location-dot me-1"></i>위치 정보</h6>
                </div>
                <div class="card-body pt-2 text-center text-muted small py-4 bg-light rounded m-3">
                    지도 정보 없음<br>(Map Context Not Available)
                </div>
            </div>

            <div class="d-grid gap-2 mb-5 pb-5">
                <button class="btn btn-danger fw-bold" onclick="viewSellDecision('${propertyId}')">매도 결정 (SELL)</button>
                <button class="btn btn-primary fw-bold mt-2" onclick="goToMyWorld()">내 세계</button>
                <button class="btn btn-outline-secondary" onclick="goToMyWorld()">세계로 돌아가기</button>
            </div>
        </div>
    </div>
    `;
}

async function viewSellDecision(propertyId) {
    currentContext = 'SELL_DECISION';
    const fsContainer = document.getElementById('full-screen-container');
    
    const prop = playerState.ownership.find(o => String(o.property_id) === String(propertyId));
    if (!prop) return;
    fsContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center w-100 h-100"><div class="text-muted">부동산 정보를 불러오는 중...</div></div>';
    let matchedProp = null;
    try {
        matchedProp = await loadPropertyMasterById(propertyId);
    } catch (error) {
        console.error('Failed to load property for sell decision', error);
    }
    if (currentContext !== 'SELL_DECISION') return;
    
    if (!matchedProp) {
        fsContainer.innerHTML = '<div class="alert alert-danger m-4">매물 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';
        return;
    }
    
    const dt = prop.acquired_at ? new Date(prop.acquired_at._seconds * 1000).toLocaleString() : 'YYYY-MM-DD';
    
    // Log research exposure
    if (typeof logResearchEvent === 'function') {
        logResearchEvent('SELL_DECISION_EXPOSURE', { property_id: propertyId });
    }
    
    fsContainer.innerHTML = `
    <div class="screen-layout bg-light d-flex justify-content-center pt-5 w-100 overflow-auto" style="height:100vh;">
        <div style="max-width: 600px; width: 100%; padding: 0 15px;">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold mb-0 text-danger"><i class="fa-solid fa-file-signature me-2"></i>매도 의사 결정</h4>
                <button class="btn btn-sm btn-outline-secondary" onclick="viewOwnedPropertyDetail('${propertyId}')"><i class="fa-solid fa-arrow-left"></i> 뒤로</button>
            </div>
            
            <div class="alert alert-warning border-warning">
                <i class="fa-solid fa-triangle-exclamation me-1"></i> <strong>매도 의향(Sell Intent) 기록 단계입니다.</strong><br>
                실제 매도 주문 및 거래는 이후 단계에서 진행됩니다. 현재는 자산이나 현금이 변경되지 않습니다.
            </div>
            
            <div class="card mb-3 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <h6 class="fw-bold"><i class="fa-solid fa-user-check me-1"></i>나의 포지션</h6>
                </div>
                <div class="card-body pt-2">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">단지명</span>
                        <strong class="text-dark">${matchedProp.complex_name}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">취득 가격</span>
                        <strong class="text-primary">${formatPrice(prop.acquisition_price)}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">취득 일자</span>
                        <span class="text-dark small">${dt}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span class="text-muted small">현재 상태</span>
                        <span class="badge bg-primary">보유 중</span>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <h6 class="fw-bold text-success"><i class="fa-solid fa-chart-line me-1"></i>시장 상황</h6>
                </div>
                <div class="card-body pt-2">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">등록/참고 가격</span>
                        <strong class="text-dark">${formatPrice(matchedProp.initial_price)}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small">최근 실거래가</span>
                        <span class="text-dark small">${matchedProp.sales_info_raw || '정보 없음'}</span>
                    </div>
                    <div class="d-flex justify-content-between pt-2 mt-2 border-top">
                        <span class="text-muted small fw-bold">현재 시장 가치</span>
                        <span class="text-primary small fw-bold">현재 시장 정보 없음</span>
                    </div>
                </div>
            </div>
            
            <div class="d-grid gap-2 mb-5 pb-5">
                <button class="btn btn-danger fw-bold py-3" onclick="processSellIntent('${propertyId}')">매도 의향 확인 (SELL INTENT)</button>
                <button class="btn btn-outline-primary py-2 mt-2" onclick="viewOwnedPropertyDetail('${propertyId}')">보유 유지 (HOLD)</button>
                <button class="btn btn-outline-secondary py-2" onclick="viewOwnedPropertyDetail('${propertyId}')">취소 (CANCEL)</button>
            </div>
        </div>
    </div>
    `;
}

function processSellIntent(propertyId) {
    // Log research action
    if (typeof logResearchEvent === 'function') {
        logResearchEvent('SELL_INTENT_ACTION', { property_id: propertyId });
    }
    
    // No real mutation in IA-04C. Show intent recorded message.
    alert('매도 의향(Sell Intent)이 기록되었습니다.\\n실제 매도는 다음 단계(IA-04D)에서 구현됩니다.');
    goToMyWorld();
}

function getAvailableCash() {
    if (playerState && playerState.asset && typeof playerState.asset.cash_available !== 'undefined') {
        return playerState.asset.cash_available;
    }
    return null; // UNAVAILABLE
}

const SEASON_MONTH_COUNT = 360;
const REAL_HOURS_PER_SEASON_MONTH = 6;
const GAME_DAYS_PER_SEASON_MONTH = 30;
function getSeasonStartDate(season) {
    const timestamp = season?.simulation_started_at
        || season?.started_at
        || season?.activated_at
        || season?.created_at;
    if (!timestamp) return null;

    try {
        if (typeof timestamp.toDate === 'function') return timestamp.toDate();
        if (timestamp instanceof Date) return timestamp;
        if (Number.isFinite(timestamp.seconds)) {
            return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1e6);
        }
        if (Number.isFinite(timestamp._seconds)) {
            return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1e6);
        }
        const date = new Date(timestamp);
        return Number.isNaN(date.getTime()) ? null : date;
    } catch (error) {
        return null;
    }
}

function updateSeasonProgressBar(elapsedMonths, ariaText) {
    const bar = document.getElementById('my-world-season-progress-bar');
    const fill = document.getElementById('my-world-season-progress-fill');
    if (!bar || !fill) return;

    const completed = Number.isFinite(elapsedMonths) ? Math.max(0, Math.min(SEASON_MONTH_COUNT, elapsedMonths)) : 0;
    const percent = completed / SEASON_MONTH_COUNT * 100;
    fill.style.width = `${percent}%`;
    bar.setAttribute('aria-valuenow', String(completed));
    bar.setAttribute('aria-valuetext', ariaText);
}

function formatSeasonPercent(value) {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'string' && value.trim().endsWith('%')) return value.trim();
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return String(value);
    const percentage = Math.abs(numericValue) <= 1 ? numericValue * 100 : numericValue;
    return `${percentage.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;
}

function renderSeasonEconomicMetrics() {
    const season = seasonCardState || {};
    const deltas = getSeasonEconomicEventMetricDeltas();
    SEASON_ECONOMIC_METRIC_FIELDS.forEach(({ field, valueId, deltaId }) => {
        const valueElement = document.getElementById(valueId);
        const deltaElement = document.getElementById(deltaId);
        if (valueElement) valueElement.textContent = formatSeasonPercent(season[field]);
        if (deltaElement) {
            const rawDelta = Number(deltas[field]) || 0;
            const roundedDelta = Math.abs(rawDelta) < 0.05 ? 0 : Math.round(rawDelta * 10) / 10;
            const sign = roundedDelta >= 0 ? '+' : '';
            deltaElement.textContent = `(${sign}${roundedDelta.toFixed(1)})`;
        }
    });
}

function renderSeasonEconomicEvents() {
    const countEl = document.getElementById('season-economic-event-count');
    const listEl = document.getElementById('season-economic-event-list');
    if (!countEl || !listEl) return;

    countEl.textContent = seasonEventsLoaded ? String(seasonEconomicEvents.length) : '—';
    if (!seasonEventsLoaded) {
        listEl.innerHTML = '<div class="season-economic-event-empty">경제 이벤트를 불러오는 중입니다.</div>';
        return;
    }
    if (!seasonEconomicEvents.length) {
        listEl.innerHTML = '<div class="season-economic-event-empty">등록된 경제 이벤트가 없습니다.</div>';
        return;
    }

    const formatCreatedAt = value => {
        const date = getSeasonStartDate({ created_at: value });
        return date ? date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '날짜 미상';
    };
    const season = seasonCardState || {};

    listEl.innerHTML = seasonEconomicEvents.map(event => {
        const description = escapeHtml(event.description || '설명 없음');
        return `
          <article class="season-economic-event-item">
            <div class="season-economic-event-heading">
              <span>${description}</span>
              <span class="season-economic-event-period">${escapeHtml(formatCreatedAt(event.created_at))}</span>
            </div>
            <div class="season-economic-event-meta">기준금리 ${escapeHtml(formatSeasonPercent(season.base_interest))} · 물가상승률 ${escapeHtml(formatSeasonPercent(season.inflation))} · 소득증가율 ${escapeHtml(formatSeasonPercent(season.income_rate))}</div>
            <div class="season-economic-event-meta">DSR ${escapeHtml(formatSeasonPercent(season.DSR))} · LTV ${escapeHtml(formatSeasonPercent(season.LTV))}</div>
          </article>`;
    }).join('');
}

function updateSeasonProgressCard() {
    const seasonNameEl = document.getElementById('my-world-season-name');
    const progressEl = document.getElementById('my-world-season-progress');
    if (!progressEl) return;

    const seasonName = seasonCardState?.season_name || '시즌명을 불러오는 중…';
    if (seasonNameEl) seasonNameEl.textContent = seasonName;
    renderSeasonEconomicMetrics();
    renderSeasonEconomicEvents();

    const startDate = getSeasonStartDate(seasonCardState);
    if (!startDate) {
        progressEl.textContent = '시즌 시작 정보 없음 / 360개월 (—%)';
        updateSeasonProgressBar(0, '시즌 시작 시각을 확인할 수 없습니다.');
        return;
    }

    const realMonthDurationMs = REAL_HOURS_PER_SEASON_MONTH * 60 * 60 * 1000;
    const realGameDayDurationMs = realMonthDurationMs / GAME_DAYS_PER_SEASON_MONTH;
    const elapsedMs = Math.min(SEASON_MONTH_COUNT * realMonthDurationMs, Math.max(0, Date.now() - startDate.getTime()));
    const realGameHourDurationMs = realGameDayDurationMs / 24;
    const elapsedGameHours = Math.floor(elapsedMs / realGameHourDurationMs);
    const gameHoursPerMonth = GAME_DAYS_PER_SEASON_MONTH * 24;
    const months = Math.min(SEASON_MONTH_COUNT, Math.floor(elapsedGameHours / gameHoursPerMonth));
    const days = months === SEASON_MONTH_COUNT
        ? 0
        : Math.floor(elapsedGameHours / 24) % GAME_DAYS_PER_SEASON_MONTH;
    const hours = months === SEASON_MONTH_COUNT ? 0 : elapsedGameHours % 24;
    const elapsedMonths = elapsedMs / realMonthDurationMs;
    const percent = (elapsedMonths / SEASON_MONTH_COUNT * 100).toFixed(1);
    const progressLabel = `${months}개월 ${days}일 ${hours}시간 / ${SEASON_MONTH_COUNT}개월 (${percent}%)`;

    progressEl.textContent = progressLabel;
    updateSeasonProgressBar(elapsedMonths, progressLabel);
}

function openSeasonInfo() {
    const dialog = document.getElementById('season-info-dialog');
    if (dialog && !dialog.open) dialog.showModal();
}

function closeSeasonInfo() {
    const dialog = document.getElementById('season-info-dialog');
    if (dialog?.open) dialog.close();
}

window.setInterval(updateSeasonProgressCard, 3 * 1000);
window.addEventListener('focus', updateSeasonProgressCard);

function updateMyWorldUI() {
    const cashEl = document.getElementById('my-world-cash');
    const netWorthEl = document.getElementById('my-world-net-worth');
    const propertyCountEl = document.getElementById('my-world-property-count');
    const propsContainer = document.getElementById('purchased-properties-container');
    const playerNameEl = document.getElementById('my-world-player-name');
    const playerName = currentUser?.displayName || playerState?.display_name || playerState?.player_id || '사용자';
    if (playerNameEl) playerNameEl.textContent = `${playerName}님의 자산현황`;
    updateSeasonProgressCard();
    updateMyWorldScreen();

    const advanceButton = document.getElementById('my-world-time-advance');
    if (advanceButton) advanceButton.style.display = 'none';
    
    if (playerState && playerState.asset) {
        const currency = value => value == null ? '—' : `${Math.round(value).toLocaleString('ko-KR')}원`;
        const compactCash = value => value == null ? '—' : `${(value / 100000000).toFixed(2)}억`;
        if (cashEl) cashEl.textContent = compactCash(playerState.asset.cash_available);
        if (netWorthEl) netWorthEl.textContent = currency(playerState.asset.net_worth);
        if (propertyCountEl) propertyCountEl.textContent = `${playerState.asset.property_count ?? 0}채`;
        
        if (propsContainer) {
            let html = '';
            if (playerState.ownership && playerState.ownership.length > 0) {
                html += '<div class="fw-bold mb-2 mt-4"><i class="fa-solid fa-house-chimney me-1"></i>보유 부동산 상세</div>';
                playerState.ownership.forEach(prop => {
                    const dt = prop.acquired_at ? new Date(prop.acquired_at._seconds * 1000).toLocaleString() : '미기재';
                    const matchedProp = propertyMasterCache.get(String(prop.property_id));
                    const complexName = matchedProp ? matchedProp.complex_name : '정보 불러오는 중...';
                    const areaSqm = matchedProp ? `${matchedProp.representative_area_sqm}㎡` : '면적 정보 불러오는 중...';
                    
                    html += `
                    <div class="card mb-2 shadow-sm border-0" style="cursor:pointer;" data-owned-property-id="${escapeHtml(String(prop.property_id))}" onclick="viewOwnedPropertyDetail('${escapeHtml(String(prop.property_id))}')">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong data-owned-complex-name style="font-size: 14px;">${escapeHtml(String(complexName))}</strong>
                                <span class="badge bg-primary text-white">보유</span>
                            </div>
                            <div class="small text-muted mb-2">${escapeHtml(String(prop.property_id))} | <span data-owned-property-area>${escapeHtml(String(areaSqm))}</span></div>
                            <div class="d-flex justify-content-between small mb-1 border-top pt-2">
                                <span>취득가</span>
                                <strong>${formatPrice(prop.acquisition_price)}</strong>
                            </div>
                            <div class="d-flex justify-content-between small text-muted mb-1">
                                <span>취득일</span>
                                <span>${dt}</span>
                            </div>
                            <div class="d-flex justify-content-between small mt-2 pt-2 border-top text-primary fw-bold">
                                <span>현재 시장 가치</span>
                                <span>현재 가치 정보 없음</span>
                            </div>
                        </div>
                    </div>`;
                });
            } else {
                html += '<div class="text-muted small mt-3">보유한 부동산이 없습니다.</div>';
            }
            propsContainer.innerHTML = html;
            propsContainer.querySelectorAll('[data-owned-property-id]').forEach(async card => {
                if (propertyMasterCache.has(card.dataset.ownedPropertyId)) return;
                try {
                    const property = await loadPropertyMasterById(card.dataset.ownedPropertyId);
                    if (!property || !card.isConnected) return;
                    card.querySelector('[data-owned-complex-name]').textContent = property.complex_name || '정보 없음';
                    card.querySelector('[data-owned-property-area]').textContent = property.representative_area_sqm == null
                        ? '면적 정보 없음'
                        : `${property.representative_area_sqm}㎡`;
                } catch (error) {
                    console.error(`Failed to load owned property ${card.dataset.ownedPropertyId}`, error);
                }
            });
        }
    } else {
        if (cashEl) cashEl.textContent = '—';
        if (netWorthEl) netWorthEl.textContent = '—';
        if (propertyCountEl) propertyCountEl.textContent = '—';
        ['my-world-monthly-income', 'my-world-living-expense', 'my-world-loan-payment'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '—';
        });
        if (propsContainer) propsContainer.innerHTML = '<div class="text-muted small mt-3">HERO 자산을 불러오려면 로그인하세요.</div>';
    }
}

function updateMyWorldScreen() {
    if (!playerState?.asset) return;
    const asset = playerState.asset;
    const currency = value => value == null ? '—' : `${Math.round(value).toLocaleString('ko-KR')}원`;
    const values = {
        'my-world-total-value': currency(asset.net_worth),
        'my-world-cash-value': currency(asset.cash_available),
        'my-world-property-value': currency((playerState.ownership || []).reduce((sum, item) => sum + (item.acquisition_price || 0), 0)),
        'my-world-debt-value': currency(asset.debt_total),
        'my-world-property-count': `${asset.property_count ?? 0}채`,

        'my-world-monthly-income': currency(asset.monthly_income),
        'my-world-living-expense': currency(asset.monthly_living_expense),
        'my-world-loan-payment': currency(asset.monthly_loan_payment ?? 0),
        'live-my-total-assets': currency(asset.cash_total),
        'live-my-net-worth': currency(asset.net_worth),
        'live-my-cash': currency(asset.cash_available),
        'live-my-property-cost': currency((playerState.ownership || []).reduce((sum, item) => sum + (item.acquisition_price || 0), 0)),
        'live-my-debt': currency(asset.debt_total),
        'live-my-period': `P${currentSeasonState?.current_simulation_period ?? '—'}`,
        'my-world-return-value': '미제공',
        'my-world-cash-share': '미제공',
        'my-world-property-share': '미제공',
        'my-world-debt-share': '미제공',
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    const historyEl = document.getElementById('my-world-history-chart');
    if (historyEl && isTimeSlipEnabled()) {
        historyEl.textContent = `Period ${currentSeasonState?.current_simulation_period ?? '—'}의 자산 상태는 위 요약에서 확인할 수 있습니다. 과거 period별 자산 이력은 backend에서 제공되지 않습니다.`;
    }
}


function getTransactionCostRate(price, area) {
    if (price == null || area == null || isNaN(price) || isNaN(area)) return null;
    if (price <= 600000000) {
        return area <= 85 ? 0.011 : 0.013;
    } else if (price <= 900000000) {
        return 0.022 + ((price - 600000000) / 300000000) * 0.002;
    } else {
        return area <= 85 ? 0.033 : 0.035;
    }
}

function calculateMonthlyPayment(principal, monthlyRate, termMonths) {
    if (!principal || principal <= 0 || !termMonths || termMonths <= 0) return 0;
    if (!monthlyRate || monthlyRate <= 0) return principal / termMonths;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

function calculateRemainingTerm() {
    const currentPeriod = (typeof currentSeasonState !== 'undefined' && currentSeasonState?.current_simulation_period != null) ? currentSeasonState.current_simulation_period : 0;
    const totalPeriods = (typeof currentSeasonState !== 'undefined' && currentSeasonState?.total_simulation_periods != null) ? currentSeasonState.total_simulation_periods : 360;
    const remaining = totalPeriods - currentPeriod;
    return Math.min(360, Math.max(1, remaining));
}

function calculateDSRLoanLimit(annualIncome, existingAnnualDebt, monthlyRate, termMonths, dsrLimit = 0.5) {
    const maxAnnualDebt = annualIncome * dsrLimit;
    const availableAnnualDebt = maxAnnualDebt - existingAnnualDebt;
    if (availableAnnualDebt <= 0) return 0;
    const availableMonthlyDebt = availableAnnualDebt / 12;
    if (!monthlyRate || monthlyRate <= 0) return availableMonthlyDebt * termMonths;
    return availableMonthlyDebt * (Math.pow(1 + monthlyRate, termMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
}

function calculateMaxLoan(propertyPrice, ltvLimit, annualIncome, existingAnnualDebt, monthlyRate, termMonths, dsrLimit = 0.5) {
    const maxLtvLoan = propertyPrice * ltvLimit;
    const maxDsrLoan = calculateDSRLoanLimit(annualIncome, existingAnnualDebt, monthlyRate, termMonths, dsrLimit);
    return Math.floor(Math.max(0, Math.min(maxLtvLoan, maxDsrLoan)));
}

function getActiveRegionLabel() {
    const scope = currentSeasonState?.active_region_scope;
    if (scope?.region_scope) return scope.region_scope;
    if (scope && typeof scope === 'object') {
        return [scope.province, scope.city, scope.district].filter(Boolean).join(' ') || '지역 설정 없음';
    }
    return isHeroTestSeason() ? '경기도 용인시 수지구' : '지역 설정 없음';
}

function renderTestRegionExplorer() {
    const fsContainer = document.getElementById('full-screen-container');
    fsContainer.style.display = 'flex';
    fsContainer.innerHTML = `
      <div class="screen-layout">
        <aside class="left-sidebar"><h6>테스트 지역</h6><div class="fw-bold">${escapeHtml(getActiveRegionLabel())}</div><div class="small text-muted mt-2">Period ${currentSeasonState?.current_simulation_period ?? '—'}</div></aside>
        <main class="main-content">
          <h3>${escapeHtml(getActiveRegionLabel())}</h3>
          <p class="text-muted">현재 테스트 지역의 Season 상태를 표시합니다.</p>
          <div class="wireframe-box p-3 mb-3"><strong>시장 상태</strong><div class="mt-2">Firestore season 문서에는 가격 변화·거래량 집계가 제공되지 않습니다.</div></div>
          <div class="wireframe-box p-3 mb-3"><strong>Property 목록</strong><div class="mt-2">${allProperties.length}개 로컬 기준 스냅샷 매물 · 시뮬레이션상 현재 가격/거래 가능 상태와는 별개입니다.</div></div>
          <h5>최근 참가자 활동</h5>
          <div id="region-live-activity">${renderActivityMarkup(liveActivityRecords.slice(0, 10))}</div>
        </main>
      </div>`;
}

function renderActivityMarkup(records) {
    if (!records?.length) return '<div class="text-muted">아직 기록된 활동이 없습니다.</div>';
    return records.map(log => `<div class="border-bottom py-2"><strong>${log.player_id === 'HERO' ? 'HERO' : `참가자 ${escapeHtml(log.player_id || '—')}`}</strong> · ${escapeHtml(log.action_type || log.event_type || '활동')} · P${log.simulation_period ?? '—'}</div>`).join('');
}

function viewRegionExplorer() {
    currentContext = 'REGION_EXPLORE';
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;

    if (isTimeSlipEnabled()) {
        renderTestRegionExplorer();
        updateCommandPanel();
        return;
    }

    document.getElementById('map-view-container').style.display = 'none';
    const fsContainer = document.getElementById('full-screen-container');
    fsContainer.style.display = 'flex';
    
    fsContainer.innerHTML = `
    <div class="screen-layout">
        <div class="left-sidebar">
            <div class="mb-3">
                <div class="input-group">
                    <span class="input-group-text bg-white"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" class="form-control border-start-0 ps-0" placeholder="지역명, 시군구를 검색하세요." style="border-left:none;">
                </div>
            </div>
            <ul class="nav nav-tabs nav-justified mb-3" style="font-size:13px;">
              <li class="nav-item"><a class="nav-link active text-dark fw-bold" href="#">전체</a></li>
              <li class="nav-item"><a class="nav-link text-muted" href="#">수도권</a></li>
              <li class="nav-item"><a class="nav-link text-muted" href="#">광역시</a></li>
              <li class="nav-item"><a class="nav-link text-muted" href="#">기타</a></li>
            </ul>
            <table class="table table-hover table-sm" style="font-size:13px; cursor:pointer;">
                <tbody>
                    <tr onclick="alert('Placeholder: 강남구')">
                        <td>강남구</td><td class="text-danger text-end">+3.1%</td><td class="text-end">24.8억</td>
                    </tr>
                    <tr onclick="alert('Placeholder: 서초구')">
                        <td>서초구</td><td class="text-danger text-end">+2.7%</td><td class="text-end">22.1억</td>
                    </tr>
                    <tr onclick="alert('Placeholder: 송파구')">
                        <td>송파구</td><td class="text-danger text-end">+2.5%</td><td class="text-end">18.4억</td>
                    </tr>
                    <tr onclick="alert('Placeholder: 마포구')">
                        <td>마포구</td><td class="text-danger text-end">+2.3%</td><td class="text-end">15.8억</td>
                    </tr>
                    <tr onclick="alert('Placeholder: 용산구')">
                        <td>용산구</td><td class="text-danger text-end">+1.9%</td><td class="text-end">17.2억</td>
                    </tr>
                    <tr onclick="selectRegion('Suji-gu')" class="table-active fw-bold">
                        <td>수지구</td><td class="text-danger text-end">+2.8%</td><td class="text-end">8.5억</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="main-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>강남구</h3>
                <div>
                    <button class="btn btn-outline-secondary btn-sm"><i class="fa-regular fa-star"></i> 관심등록</button>
                    <button class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-code-compare"></i> 비교하기</button>
                </div>
            </div>
            
            <ul class="nav nav-tabs mb-4">
              <li class="nav-item"><a class="nav-link active text-dark fw-bold" href="#">요약</a></li>
              <li class="nav-item"><a class="nav-link text-muted" href="#">아파트 단지</a></li>
              <li class="nav-item"><a class="nav-link text-muted" href="#">시장동향</a></li>
              <li class="nav-item"><a class="nav-link text-muted" href="#">개발호재</a></li>
              <li class="nav-item"><a class="nav-link text-muted" href="#">생활환경</a></li>
            </ul>
            
            <div class="row text-center mb-4">
                <div class="col"><div class="wireframe-box py-3"><div class="text-muted small">3개월 변동률</div><div class="fs-4 fw-bold text-danger">+3.1%</div></div></div>
                <div class="col"><div class="wireframe-box py-3"><div class="text-muted small">거래량</div><div class="fs-4 fw-bold">+42%</div></div></div>
                <div class="col"><div class="wireframe-box py-3"><div class="text-muted small">평균 매매가</div><div class="fs-4 fw-bold">24.8억</div></div></div>
                <div class="col"><div class="wireframe-box py-3"><div class="text-muted small">전세가율</div><div class="fs-4 fw-bold">48%</div></div></div>
            </div>
            
            <h5 class="mb-3">주요 아파트 단지 (125개)</h5>
            <table class="wireframe-table">
                <thead>
                    <tr><th>단지명</th><th>위치</th><th>세대수</th><th>준공년도</th><th>평균 매매가</th><th>변동률(3개월)</th></tr>
                </thead>
                <tbody>
                    <tr><td><i class="fa-solid fa-building me-2 text-muted"></i>래미안대치팰리스</td><td>대치동</td><td>1,608</td><td>2015</td><td>32.4억</td><td class="text-danger">▲ +2.8%</td></tr>
                    <tr><td><i class="fa-solid fa-building me-2 text-muted"></i>은마아파트</td><td>대치동</td><td>4,424</td><td>1979</td><td>24.1억</td><td class="text-danger">▲ +1.9%</td></tr>
                    <tr><td><i class="fa-solid fa-building me-2 text-muted"></i>도곡렉슬</td><td>도곡동</td><td>3,002</td><td>2006</td><td>28.7억</td><td class="text-danger">▲ +2.6%</td></tr>
                    <tr><td><i class="fa-solid fa-building me-2 text-muted"></i>개포자이</td><td>개포동</td><td>3,337</td><td>2018</td><td>29.8억</td><td class="text-danger">▲ +3.4%</td></tr>
                    <tr><td><i class="fa-solid fa-building me-2 text-muted"></i>대치삼성</td><td>대치동</td><td>1,708</td><td>1993</td><td>22.1억</td><td class="text-danger">▲ +2.1%</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    `;
    updateCommandPanel();
}

function viewMyWorld() {
    currentContext = 'MY_WORLD';
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;

    document.getElementById('map-view-container').style.display = 'none';
    const fsContainer = document.getElementById('full-screen-container');
    fsContainer.style.display = 'flex';
    
    fsContainer.innerHTML = `
    <div class="screen-layout">
        <div class="left-sidebar">
            <div class="sidebar-menu-item active"><i class="fa-solid fa-house-user"></i> 자산 요약</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-building"></i> 보유 부동산</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-file-invoice-dollar"></i> 거래 내역</div>
            <div class="sidebar-menu-item"><i class="fa-regular fa-star"></i> 관심 목록</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-money-check-dollar"></i> 대출 관리</div>
        </div>
        <div class="main-content">
            <div class="row mb-4">
                <div class="col-md-7">
                    <h5 class="mb-3">내 자산 요약</h5>
                    <div class="wireframe-box mb-3 d-flex justify-content-between align-items-center">
                        <div>
                            <div class="text-muted mb-1">총 자산</div>
                            <h2 id="my-world-total-value" class="mb-0 fw-bold">—</h2>
                        </div>
                        <div class="text-end">
                            <div class="text-muted mb-1">총 수익률</div>
                            <h3 id="my-world-return-value" class="mb-0 fw-bold">미제공</h3>
                        </div>
                    </div>
                    <div class="d-flex gap-3">
                        <div class="wireframe-box flex-fill p-3">
                            <div class="text-muted small mb-2"><i class="fa-solid fa-money-bill-wave me-1"></i> 현금</div>
                            <div id="my-world-cash-value" class="fw-bold fs-5">—</div>
                            <div id="my-world-cash-share" class="small text-muted">미제공</div>
                        </div>
                        <div class="wireframe-box flex-fill p-3">
                            <div class="text-muted small mb-2"><i class="fa-solid fa-house me-1"></i> 부동산 취득가</div>
                            <div id="my-world-property-value" class="fw-bold fs-5">—</div>
                            <div id="my-world-property-share" class="small text-muted">미제공</div>
                        </div>
                        <div class="wireframe-box flex-fill p-3">
                            <div class="text-muted small mb-2"><i class="fa-solid fa-credit-card me-1"></i> 부채</div>
                            <div id="my-world-debt-value" class="fw-bold fs-5">—</div>
                            <div id="my-world-debt-share" class="small text-muted">미제공</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="d-flex justify-content-between mb-3">
                        <h5 class="mb-0">자산 변화 추이</h5>
                        <select class="form-select form-select-sm w-auto"><option>전체</option></select>
                    </div>
                    <div id="my-world-history-chart" class="wireframe-chart">기간별 자산 이력 미제공</div>
                </div>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">보유 부동산 (<span id="my-world-property-count">0채</span>)</h5>
                <button class="btn btn-outline-secondary btn-sm">매수하기 &gt;</button>
            </div>
            <table class="wireframe-table text-center mb-4">
                <thead>
                    <tr><th>단지명</th><th>유형</th><th>매입가</th><th>현재가</th><th>수익률</th><th>보유기간</th><th>상태</th></tr>
                </thead>
                <tbody>
                    <tr><td colspan="7" class="py-5 text-muted">
                        <i class="fa-solid fa-house-chimney-window fs-2 mb-2"></i><br>
                        보유한 부동산이 없습니다.<br>지역을 탐색하여 첫 부동산을 매수해보세요.
                    </td></tr>
                </tbody>
            </table>
        </div>
    </div>
    `;
    updateCommandPanel();
    updateMyWorldScreen();
}

function viewPeople() {
    currentContext = 'PEOPLE';
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;

    document.getElementById('map-view-container').style.display = 'none';
    const fsContainer = document.getElementById('full-screen-container');
    fsContainer.style.display = 'flex';
    
    fsContainer.innerHTML = `
    <div class="screen-layout">
        <div class="left-sidebar">
            <div class="sidebar-menu-item active"><i class="fa-solid fa-users"></i> 참가자 목록</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-chart-line"></i> 주요 활동</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-chess-knight"></i> 투자 스타일</div>
        </div>
        <div class="main-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">참가자 목록 <span id="people-count" class="text-muted fw-normal small">(불러오는 중)</span></h5>
                <div class="d-flex gap-2">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-white"><i class="fa-solid fa-magnifying-glass"></i></span>
                        <input type="text" class="form-control border-start-0 ps-0" placeholder="플레이어명 검색">
                    </div>
                    <select class="form-select form-select-sm w-auto"><option>전체</option></select>
                    <select class="form-select form-select-sm w-auto"><option>정렬 기준 미설정</option></select>
                </div>
            </div>
            
            <table class="wireframe-table text-center">
                <thead>
                    <tr><th>순위 기준</th><th>Participant</th><th>Type</th><th>Period</th><th>현금</th><th>보유 수</th><th>부채</th><th>순자산</th><th>최근 행동</th></tr>
                </thead>
                <tbody>
                    <tr><td colspan="9" class="text-muted">Firestore 참가자 데이터를 불러오는 중입니다.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    `;
    updateCommandPanel();
    subscribeSeasonParticipants();
    renderSeasonParticipants();
}

function viewSeason() {
    currentContext = 'SEASON';
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;

    document.getElementById('map-view-container').style.display = 'none';
    const fsContainer = document.getElementById('full-screen-container');
    fsContainer.style.display = 'flex';
    
    fsContainer.innerHTML = `
    <div class="screen-layout">
        <div class="left-sidebar">
            <div class="sidebar-menu-item active"><i class="fa-solid fa-ranking-star"></i> 자산 랭킹</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-arrow-trend-up"></i> 수익률 랭킹</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-handshake"></i> 거래량 랭킹</div>
            <div class="sidebar-menu-item"><i class="fa-solid fa-map"></i> 지역별 랭킹</div>
        </div>
        <div class="main-content">
            <h5 class="mb-4">시즌 랭킹 <span id="ranking-count" class="text-muted fw-normal small">(불러오는 중)</span></h5>
            <table class="wireframe-table text-center">
                <thead>
                    <tr><th>순위 기준</th><th>Participant</th><th>Type</th><th>Period</th><th>현금</th><th>보유 수</th><th>부채</th><th>순자산</th><th>최근 행동</th></tr>
                </thead>
                <tbody>
                    <tr><td colspan="9" class="text-muted">Firestore 참가자 데이터를 불러오는 중입니다.</td></tr>
                </tbody>
            </table>
        </div>
        <div class="right-sidebar bg-light">
            <h6 class="fw-bold mb-4">내 순위</h6>
            <div class="text-center mb-4">
                <i class="fa-solid fa-trophy fs-1 text-muted mb-2"></i>
                <h4>순위 <span id="my-season-rank">미설정</span> <span id="my-season-count" class="fs-6 text-muted fw-normal">/ —명</span></h4>
            </div>
            
            <div class="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span class="text-muted small">총 자산</span>
                <span id="my-season-net-worth" class="fw-bold small">—</span>
            </div>
            <div class="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span class="text-muted small">승인된 랭킹 기준</span>
                <span class="fw-bold small">미설정</span>
            </div>
            <div class="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span class="text-muted small">보유 부동산</span>
                <span id="my-season-properties" class="fw-bold small">—</span>
            </div>
            <div class="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span class="text-muted small">거래량</span>
                <span class="fw-bold small">미제공</span>
            </div>
        </div>
    </div>
    `;
    updateCommandPanel();
    subscribeSeasonParticipants();
    renderSeasonParticipants();
}

function resetSeasonParticipants() {
    if (participantUnsubscribe) participantUnsubscribe();
    participantAssetUnsubscribers.forEach(unsubscribe => unsubscribe());
    participantAssetUnsubscribers.clear();
    participantUnsubscribe = null;
    participantSeasonId = null;
    seasonParticipants = [];
    liveActivityRecords = [];
    currentSeasonState = null;
}

function subscribeSeasonParticipants() {
    if (participantSeasonId !== currentSeasonId) {
        if (participantUnsubscribe) participantUnsubscribe();
        participantAssetUnsubscribers.forEach(unsubscribe => unsubscribe());
        participantAssetUnsubscribers.clear();
        participantUnsubscribe = null;
        participantSeasonId = currentSeasonId;
        seasonParticipants = [];
    }
    if (participantUnsubscribe) return;
    participantUnsubscribe = firebase.firestore().collection('PLAY_PLAYER')
        .where('season_id', '==', currentSeasonId)
        .onSnapshot(snapshot => {
            const playerIds = new Set(snapshot.docs.map(doc => doc.data().player_id));
            participantAssetUnsubscribers.forEach((unsubscribe, playerId) => {
                if (!playerIds.has(playerId)) {
                    unsubscribe();
                    participantAssetUnsubscribers.delete(playerId);
                }
            });
            seasonParticipants = snapshot.docs.map(doc => {
                const player = doc.data();
                return { ...player, asset: seasonParticipants.find(item => item.player_id === player.player_id)?.asset || null };
            });
            snapshot.docs.forEach(doc => {
                const player = doc.data();
                if (participantAssetUnsubscribers.has(player.player_id)) return;
                const unsubscribe = firebase.firestore().collection('PLAY_PLAYER_ASSET').doc(player.player_id).onSnapshot(assetDoc => {
                    seasonParticipants = seasonParticipants.map(item => item.player_id === player.player_id
                        ? { ...item, asset: assetDoc.exists ? assetDoc.data() : null }
                        : item);
                    renderSeasonParticipants();
                }, error => console.error(`Participant asset listener failed (${player.player_id}):`, error));
                participantAssetUnsubscribers.set(player.player_id, unsubscribe);
            });
            renderSeasonParticipants();
        }, error => {
            console.error('Season participant listener failed:', error);
            const rows = document.querySelector('#full-screen-container table tbody');
            if (rows) rows.innerHTML = '<tr><td colspan="7" class="text-danger">참가자 정보를 불러오지 못했습니다.</td></tr>';
        });
}

function renderSeasonParticipants() {
    if (!['PEOPLE', 'SEASON'].includes(currentContext)) return;
    const rows = document.querySelector('#full-screen-container table tbody');
    if (!rows) return;
    const participants = [...seasonParticipants].sort((a, b) => String(a.player_id).localeCompare(String(b.player_id)));
    const count = currentContext === 'PEOPLE' ? document.getElementById('people-count') : document.getElementById('ranking-count');
    if (count) count.textContent = `(총 ${participants.length}명)`;
    if (currentContext === 'SEASON') {
        const heroAsset = participants.find(player => player.player_id === 'HERO')?.asset;
        const summary = {
            'my-season-rank': '기준 미설정',
            'my-season-count': `/ ${participants.length}명`,
            'my-season-net-worth': heroAsset?.net_worth == null ? '—' : `${Math.round(heroAsset.net_worth).toLocaleString('ko-KR')}원`,
            'my-season-properties': heroAsset?.property_count == null ? '—' : `${heroAsset.property_count}채`,
        };
        Object.entries(summary).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    if (!participants.length) {
        rows.innerHTML = '<tr><td colspan="9" class="text-muted">이 시즌에 등록된 참가자가 없습니다.</td></tr>';
        return;
    }
    rows.innerHTML = participants.map((player, index) => {
        const asset = player.asset || {};
        const name = player.player_id === 'HERO' ? 'HERO' : `참가자 ${player.player_id}`;
        const show = value => value == null ? '—' : Math.round(value).toLocaleString('ko-KR');
        const type = player.player_id === 'HERO' ? 'HERO' : (player.user_id?.startsWith('ai_user_') ? 'AI' : 'Participant');
        const recent = liveActivityRecords.find(log => log.player_id === player.player_id);
        const recentAction = recent ? escapeHtml(recent.action_type || recent.event_type || '활동') : '—';
        return `<tr class="${player.player_id === 'HERO' ? 'table-active fw-bold' : ''}"><td>—</td><td class="text-start">${escapeHtml(name)}${player.player_id === 'HERO' ? ' (나)' : ''}</td><td>${type}</td><td>P${currentSeasonState?.current_simulation_period ?? '—'}</td><td>${show(asset.cash_available)}</td><td>${asset.property_count ?? '—'}</td><td>${show(asset.debt_total)}</td><td>${show(asset.net_worth)}</td><td>${recentAction}</td></tr>`;
    }).join('');
}

function viewGuide() {
    currentContext = 'GUIDE';
    selectedRegion = null;
    selectedComplex = null;
    selectedListing = null;

    document.getElementById('map-view-container').style.display = 'none';
    const fsContainer = document.getElementById('full-screen-container');
    fsContainer.style.display = 'flex';
    
    fsContainer.innerHTML = `
    <div class="screen-layout">
        <div class="left-sidebar">
            <div class="fw-bold mb-3 text-muted">SYSTEM / GUIDE</div>
            <div class="sidebar-menu-item active">1. PLAY란?</div>
            <div class="sidebar-menu-item">2. 경제 세계</div>
            <div class="sidebar-menu-item">3. 30년 / 360개월</div>
            <div class="sidebar-menu-item">4. 시작 자산</div>
            <div class="sidebar-menu-item">5. 수입과 생활비</div>
            <div class="sidebar-menu-item">6. 부동산 시장</div>
            <div class="sidebar-menu-item">7. 대출과 부채</div>
            <div class="sidebar-menu-item">8. 매수</div>
            <div class="sidebar-menu-item">9. 매도</div>
            <div class="sidebar-menu-item">10. 행동과 결과</div>
            <div class="sidebar-menu-item">11. 다른 참가자</div>
            <div class="sidebar-menu-item">12. 시즌</div>
            <div class="sidebar-menu-item">13. Economic Freedom</div>
            <div class="sidebar-menu-item">14. 데이터 활용 안내</div>
        </div>
        <div class="main-content">
            <div class="wireframe-box h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                <i class="fa-solid fa-book-open fs-1 mb-3"></i>
                <h4>가이드 문서를 선택하세요.</h4>
                <p>좌측 메뉴에서 확인하고 싶은 도움말을 선택하면 상세 내용이 표시됩니다.</p>
            </div>
        </div>
    </div>
    `;
    updateCommandPanel();
}

// ---------------------------------------------------------
// COMMAND PANEL RENDERING
// ---------------------------------------------------------

function updateCommandPanel() {
    const worldCommandContent = document.getElementById('world-command-content');
    const mapViewCommandContent = document.getElementById('map-view-command-content');
    
    // Toggle command panel wrapper contents
    if (currentContext === 'MAP_VIEW') {
        hideDynamicContextPanel();
        worldCommandContent.style.display = 'block';
        mapViewCommandContent.style.display = 'block';

    if (isTimeSlipEnabled()) {
            mapViewCommandContent.innerHTML = `
                <div class="mb-4">
                    <div class="fw-bold text-muted small mb-3">Season Live State</div>
                    <h3 class="fw-bold mb-2">${escapeHtml(getActiveRegionLabel())}</h3>
                    <div class="mb-3">Period ${currentSeasonState?.current_simulation_period ?? '—'}</div>
                    <div class="wireframe-box p-3 mb-3">시장 가격·거래량 집계는 현재 backend에 제공되지 않습니다.</div>
                    <h6>최근 활동</h6>
                    <div>${renderActivityMarkup(liveActivityRecords.slice(0, 10))}</div>
                    <small class="text-muted">지도 매물 표시는 기준 스냅샷이며, 거래 후 실시간 가격 상태는 아직 연결되지 않았습니다.</small>
                </div>`;
            return;
        }
        
        mapViewCommandContent.innerHTML = `
            <div class="mb-4">
                <div class="fw-bold text-muted small mb-3">선택한 지역</div>
                <h3 class="fw-bold mb-3">강남구</h3>
                <div class="d-flex gap-2 text-center mb-4">
                    <div class="wireframe-box flex-fill py-2"><div class="small text-muted">3개월 변동률</div><div class="fw-bold fs-5 text-danger">+3.1%</div></div>
                    <div class="wireframe-box flex-fill py-2"><div class="small text-muted">거래량</div><div class="fw-bold fs-5">+42%</div></div>
                    <div class="wireframe-box flex-fill py-2"><div class="small text-muted">평균 매매가</div><div class="fw-bold fs-5">24.8억</div></div>
                    <div class="wireframe-box flex-fill py-2"><div class="small text-muted">전세가율</div><div class="fw-bold fs-5">48%</div></div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="fw-bold">최근 6개월 가격 추이</div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary active">매매가</button>
                        <button class="btn btn-outline-secondary">전세가</button>
                    </div>
                </div>
                <div class="wireframe-chart p-4 text-center text-muted border bg-light" style="height:200px;">
                    <i class="fa-solid fa-chart-line fs-2 mb-2"></i><br>차트 (1월 ~ 6월 가격 추이)
                </div>
            </div>
        `;
        return; // Don't process standard headers/actions
    } else {
        worldCommandContent.style.display = 'block';
        mapViewCommandContent.style.display = 'none';
    }

    const isComplexContext = ['COMPLEX', 'LISTING', 'LISTING_DETAIL'].includes(currentContext);
    if (isComplexContext && dynamicContextMapReady && !dynamicContextDismissed) showDynamicContextPanel();
    else hideDynamicContextPanel();

    const headerEl = document.getElementById('context-header');
    const titleEl = document.getElementById('panel-title');
    const actionEl = document.getElementById('action-area');

    if (isTimeSlipEnabled() && currentContext === 'REGION_EXPLORE') {
        headerEl.textContent = '지역탐색';
        titleEl.textContent = getActiveRegionLabel();
        actionEl.innerHTML = `<div class="mb-3">Period ${currentSeasonState?.current_simulation_period ?? '—'}</div><div class="alert alert-secondary">시장 가격·거래량 집계는 backend에 제공되지 않습니다.</div><div>최근 참가자 활동</div>${renderActivityMarkup(liveActivityRecords.slice(0, 10))}`;
        return;
    }

    if (currentContext === 'WORLD') {
        headerEl.innerHTML = LANG.WORLD;
        titleEl.innerHTML = `${LANG.WORLD} 개요`;
        
        let html = `<p class="text-muted small">탐험할 지역을 선택하세요.</p>`;
        html += `<ul class="list-group">`;
        html += `<li class="list-group-item" onclick="selectRegion('Suji-gu')"><i class="fa-solid fa-map-location-dot me-2 text-primary"></i> Suji-gu (수지구)</li>`;
        html += `</ul>`;
        actionEl.innerHTML = html;
        
    } else if (currentContext === 'REGION_EXPLORE') {
        headerEl.innerHTML = LANG.REGION + ` 탐색`;
        titleEl.innerHTML = `수도권 주요 지역`;
        
        let html = `
        <div class="mb-3">
            <input type="text" class="form-control" placeholder="지역 검색 (예: 강남구, 수지구)" style="border:1px solid #999;">
        </div>
        <div class="mb-3">
            <div class="fw-bold mb-2 small text-muted">지역 목록 및 핵심 지표</div>
            <ul class="list-group list-group-flush border-top border-bottom">
                <li class="list-group-item d-flex justify-content-between align-items-center" onclick="selectRegion('Suji-gu')">
                    <div>
                        <div class="fw-bold">수지구 (Suji-gu)</div>
                        <div class="small" style="color:#666;">평균 매매가 8.5억 | 전세가율 65% | 거래량 활발</div>
                    </div>
                    <span class="small fw-bold">가격 변화 ▲+1.2%</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('데이터 없음 (Placeholder)')">
                    <div>
                        <div class="fw-bold">강남구 (Gangnam-gu)</div>
                        <div class="small" style="color:#666;">평균 매매가 24.8억 | 전세가율 48%</div>
                    </div>
                    <span class="small fw-bold">가격 변화 ▲+3.1%</span>
                </li>
            </ul>
        </div>
        `;
        actionEl.innerHTML = html;
        
    } else if (currentContext === 'MY_WORLD') {
        headerEl.innerHTML = `내 자산 (MY WORLD)`;
        titleEl.innerHTML = `자산 현황`;
        
        let html = `
        <div class="mb-4">
            <div class="d-flex justify-content-between mb-2"><span class="text-muted">총자산</span> <span id="live-my-total-assets" class="fw-bold">—</span></div>
            <div class="d-flex justify-content-between mb-2"><span class="text-muted">순자산</span> <span id="live-my-net-worth" class="fw-bold">—</span></div>
            <div class="d-flex justify-content-between mb-2"><span class="text-muted">현금</span> <span id="live-my-cash" class="fw-bold">—</span></div>
            <div class="d-flex justify-content-between mb-2"><span class="text-muted">부동산 취득가</span> <span id="live-my-property-cost" class="fw-bold">—</span></div>
            <div class="d-flex justify-content-between mb-2"><span class="text-muted">부채</span> <span id="live-my-debt" class="fw-bold">—</span></div>
            <div class="d-flex justify-content-between mb-2"><span class="text-muted">현재 Period</span> <span id="live-my-period" class="fw-bold">—</span></div>
        </div>
        
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item"><a class="nav-link active" href="#">보유 부동산</a></li>
          <li class="nav-item"><a class="nav-link" href="#">거래 내역</a></li>
          <li class="nav-item"><a class="nav-link" href="#">관심 목록</a></li>
        </ul>
        
        <div class="alert alert-secondary text-center">
            보유 중인 부동산이 없습니다. (Empty State)
        </div>
        `;
        actionEl.innerHTML = html;
        
    } else if (currentContext === 'PEOPLE') {
        headerEl.innerHTML = `다른 참가자 (PEOPLE)`;
        titleEl.innerHTML = `참가자 목록 및 활동`;
        
        let html = `
        <div class="mb-3">
            <input type="text" class="form-control" placeholder="참가자 검색" style="border:1px solid #999;">
        </div>
        
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item"><a class="nav-link active" href="#">최근 활동</a></li>
          <li class="nav-item"><a class="nav-link" href="#">시장 행동</a></li>
        </ul>
        
        <div class="alert alert-secondary text-center">
            최근 활동 내역이 없습니다. (Empty State)
        </div>
        `;
        actionEl.innerHTML = html;
        
    } else if (currentContext === 'SEASON') {
        headerEl.innerHTML = `시즌랭킹 (SEASON)`;
        titleEl.innerHTML = `시즌 종합 랭킹`;
        
        let html = `
        <div class="d-flex justify-content-between align-items-center mb-3 p-2 bg-light border">
            <span>나의 순위</span>
            <span class="fw-bold">- 위 (평가 대기중)</span>
        </div>
        
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item"><a class="nav-link active" href="#">자산 랭킹</a></li>
          <li class="nav-item"><a class="nav-link" href="#">수익률 랭킹</a></li>
          <li class="nav-item"><a class="nav-link" href="#">거래량 랭킹</a></li>
        </ul>
        
        <div class="alert alert-secondary text-center">
            랭킹 데이터가 집계되지 않았습니다. (Empty State)
        </div>
        `;
        actionEl.innerHTML = html;
        
    } else if (currentContext === 'GUIDE') {
        headerEl.innerHTML = `가이드 (SYSTEM / GUIDE)`;
        titleEl.innerHTML = `PLAY 이용 가이드`;
        
        let html = `
        <ul class="list-group list-group-flush border-top border-bottom" style="max-height: 400px; overflow-y: auto;">
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: PLAY란?')">1. PLAY란? <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 경제 세계')">2. 경제 세계 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 30년 / 360개월')">3. 30년 / 360개월 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 시작 자산')">4. 시작 자산 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 수입과 생활비')">5. 수입과 생활비 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 부동산 시장')">6. 부동산 시장 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 대출과 부채')">7. 대출과 부채 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 매수')">8. 매수 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 매도')">9. 매도 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 행동과 결과')">10. 행동과 결과 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 다른 참가자')">11. 다른 참가자 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 시즌')">12. 시즌 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: Economic Freedom')">13. Economic Freedom <i class="fa-solid fa-chevron-right small text-muted"></i></li>
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="alert('가이드: 데이터 활용 안내')">14. 데이터 활용 안내 <i class="fa-solid fa-chevron-right small text-muted"></i></li>
        </ul>
        `;
        actionEl.innerHTML = html;
        
    } else if (currentContext === 'REGION') {
        headerEl.innerHTML = `<a href="#" onclick="goBackToWorld()" class="text-decoration-none">${LANG.WORLD}</a> &gt; ${selectedRegion}`;
        titleEl.innerHTML = `${selectedRegion} ${LANG.REGION}`;
        
        const complexes = visibleComplexMarkers.slice(0, 50);
        let html = `<p class="text-muted small">현재 지도 화면의 단지 ${visibleComplexMarkers.length.toLocaleString()}곳 중 최대 50곳을 표시합니다.</p>`;
        html += `<ul class="list-group mb-3" style="max-height: 400px; overflow-y: auto;">`;
        complexes.forEach((comp, index) => {
            html += `<li class="list-group-item" role="button" data-visible-complex-index="${index}"><i class="fa-solid fa-building me-2 text-success"></i> ${escapeHtml(comp.complex_name)}</li>`;
        });
        if (!complexes.length) html += '<li class="list-group-item text-muted">단지 마커가 표시되는 줌 레벨로 확대해 주세요.</li>';
        html += `</ul>`;
        html += `<button class="btn btn-outline-secondary btn-sm" onclick="goBackToWorld()"><i class="fa-solid fa-arrow-left"></i> ${LANG.BACK_TO_WORLD}</button>`;
        actionEl.innerHTML = html;
        actionEl.querySelectorAll('[data-visible-complex-index]').forEach(item => {
            item.addEventListener('click', () => {
                const comp = complexes[Number(item.dataset.visibleComplexIndex)];
                if (!comp) return;
                const addressParts = String(comp.legal_dong_address || '').split(/\s+/).filter(Boolean);
                const regionName = [...addressParts].reverse().find(part => /(시|군|구)$/.test(part)) || selectedRegion;
                selectComplex(comp.complex_name, comp.y, comp.x, comp.complex_id || comp.id, regionName);
            });
        });
        
    } else if (currentContext === 'COMPLEX') {
        headerEl.innerHTML = `<a href="#" onclick="goBackToWorld()" class="text-decoration-none">${LANG.WORLD}</a> &gt; <a href="#" onclick="goBackToRegion()" class="text-decoration-none">${selectedRegion}</a> &gt; ${selectedComplex}`;
        titleEl.innerHTML = `${selectedComplex}`;
        
        const props = complexDataMap[selectedComplex];
        if (!Array.isArray(props)) {
            if (selectedComplexLoadError) {
                actionEl.innerHTML = '<div class="alert alert-danger">단지 정보를 불러오지 못했습니다. <button class="btn btn-sm btn-outline-danger ms-2" data-retry-complex>다시 시도</button></div>';
                actionEl.querySelector('[data-retry-complex]').addEventListener('click', () => {
                    const center = map.getCenter();
                    selectComplex(selectedComplex, center.lat(), center.lng(), selectedComplexId, selectedRegion);
                });
            } else {
                actionEl.innerHTML = '<div class="text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>단지 매물 정보를 불러오는 중...</div>';
            }
            return;
        }
        if (!props.length) {
            actionEl.innerHTML = '<div class="alert alert-warning">이 단지에 등록된 매물 정보가 없습니다.</div>';
            return;
        }
        const tradableProperties = props.filter(property => property.property_status === 'NORMAL');
        const tradableCount = tradableProperties.length;
        const listingPrices = tradableProperties.map(property => Number(property.initial_price)).filter(price => Number.isFinite(price) && price > 0);
        const minListingPrice = listingPrices.length ? Math.min(...listingPrices) : null;
        const maxListingPrice = listingPrices.length ? Math.max(...listingPrices) : null;
        const pricePerPyeong = tradableProperties.map(property => {
            const price = Number(property.initial_price);
            const area = Number(property.representative_area_sqm);
            return Number.isFinite(price) && price > 0 && Number.isFinite(area) && area > 0
                ? price / area * 3.305785
                : null;
        }).filter(price => price !== null);
        const averagePricePerPyeong = pricePerPyeong.length
            ? pricePerPyeong.reduce((sum, price) => sum + price, 0) / pricePerPyeong.length
            : null;
        const recentSalesInfo = tradableProperties.find(property => property.sales_info_raw)?.sales_info_raw;
        
        let html = `<p class="text-muted small">${props[0].legal_dong_address || '주소 확인 불가'}</p>`;
        
        html += `<div class="card mb-3 bg-light border-0">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between mb-1"><span>총 세대수</span> <strong>${props[0].household_count || '확인 불가'}</strong></div>
                        <div class="d-flex justify-content-between mb-1"><span>현재 등록 매물</span> <strong>${tradableCount}건</strong></div>
                        <div class="d-flex justify-content-between"><span>대표 면적</span> <strong>${props[0].representative_area_sqm}㎡</strong></div>
                    </div>
                 </div>`;
        
        const priceRangeLabel = minListingPrice !== null
            ? `${formatPrice(minListingPrice)} ~ ${formatPrice(maxListingPrice)}`
            : '확인 불가';
        const averagePricePerPyeongLabel = averagePricePerPyeong !== null
            ? formatPrice(averagePricePerPyeong)
            : '확인 불가';
        const recentSalesInfoLabel = recentSalesInfo ? escapeHtml(String(recentSalesInfo)) : '확인 불가';
        html += `<div class="card mb-3 bg-light border-0">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between mb-1"><span>등록 매물 가격대</span> <strong>${priceRangeLabel}</strong></div>
                        <div class="d-flex justify-content-between mb-1"><span>평당 평균 등록가</span> <strong>${averagePricePerPyeongLabel}</strong></div>
                        <div class="d-flex justify-content-between gap-2"><span>최근 실거래 정보</span> <strong class="text-end">${recentSalesInfoLabel}</strong></div>
                    </div>
                 </div>`;

        const purchaseEnabled = selectedComplexSupplyStatus === 'available';
        const purchaseButtonLabel = purchaseEnabled
            ? '매수 가능'
            : selectedComplexSupplyStatus === 'unavailable'
                ? '매수 불가'
                : selectedComplexSupplyStatus === 'error'
                    ? '매수 상태 확인 불가'
                    : '매수 가능 여부 확인 중...';
        const purchaseButtonClass = purchaseEnabled ? 'btn-primary' : 'btn-outline-secondary';
        const purchaseButtonDisabled = purchaseEnabled ? '' : 'disabled';
        const purchaseButtonAction = purchaseEnabled ? 'onclick="viewListings()"' : '';
        html += `<div class="d-grid gap-2 mb-3">
                    <button class="btn ${purchaseButtonClass}" ${purchaseButtonDisabled} ${purchaseButtonAction}>${purchaseButtonLabel}</button>
                 </div>`;
                 

        actionEl.innerHTML = html;
        
    } else if (currentContext === 'LISTING') {
        // Research Logging Hook: Listing 노출
        console.log(`[RESEARCH_LOGGING_HOOK] EXPOSURE: Listings for ${selectedComplex} displayed`);
        
        headerEl.innerHTML = `<a href="#" onclick="goBackToRegion()" class="text-decoration-none">${selectedRegion}</a> &gt; <a href="#" onclick="goBackToComplex()" class="text-decoration-none">${selectedComplex}</a> &gt; ${LANG.LISTING}`;
        titleEl.innerHTML = `${selectedComplex} ${LANG.LISTING}`;
        
        const props = complexDataMap[selectedComplex] || [];
        // Filter out INCOMPLETE
        let tradableProps = props.filter(property => property.property_status === 'NORMAL'
            && (selectedComplexSupplyByPropertyId.get(String(property.property_id)) || 0) > 0);
        
        // Sorting (default low price)
        tradableProps.sort((a,b) => a.initial_price - b.initial_price);
        
        let html = `<div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="text-muted small">총 ${tradableProps.length}건</span>
                        <select class="form-select form-select-sm w-auto" onchange="console.log('[RESEARCH_LOGGING_HOOK] Sort Used')">
                            <option value="price_asc">낮은 가격순</option>
                            <option value="price_desc">높은 가격순</option>
                            <option value="area_desc">면적 큰 순</option>
                        </select>
                    </div>`;
                    
        html += `<div style="max-height: 500px; overflow-y: auto;" class="mb-3">`;
        
        tradableProps.forEach(p => {
            html += `
            <div class="listing-card" onclick="selectListing('${p.property_id}')">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="status-badge bg-primary text-white">${LANG.AVAILABLE}</span>
                    <span class="text-muted small">${formatDate(p.initial_price_date)}</span>
                </div>
                <div class="price-text mb-2">${formatPrice(p.initial_price)}</div>
                <div class="text-muted small d-flex gap-3">
                    <div><i class="fa-solid fa-ruler-combined"></i> ${p.representative_area_sqm}㎡</div>
                    <div><i class="fa-solid fa-building"></i> 층 미기재</div>
                    <div><i class="fa-regular fa-compass"></i> 방향 미기재</div>
                </div>
            </div>`;
        });
        
        if(tradableProps.length === 0) {
            html += `<div class="alert alert-warning">현재 거래 가능한 매물이 없습니다.</div>`;
        }
        html += `</div>`;
        
        html += `<button class="btn btn-outline-secondary btn-sm" onclick="goBackToComplex()"><i class="fa-solid fa-arrow-left"></i> ${LANG.BACK_TO_COMPLEX}</button>`;
        actionEl.innerHTML = html;
        
    } else if (currentContext === 'LISTING_DETAIL') {
        headerEl.innerHTML = `<a href="#" onclick="goBackToComplex()" class="text-decoration-none">${selectedComplex}</a> &gt; <a href="#" onclick="goBackToListing()" class="text-decoration-none">${LANG.LISTING}</a> &gt; ${LANG.LISTING_DETAIL}`;
        titleEl.innerHTML = `${LANG.LISTING_DETAIL}`;
        
        const p = selectedListing;
        
        let html = `
        <div class="card mb-4 border-primary">
            <div class="card-header bg-primary text-white d-flex justify-content-between">
                <span>${p.complex_name}</span>
                <span>${p.representative_area_sqm}㎡</span>
            </div>
            <div class="card-body">
                <h3 class="price-text mb-3">${formatPrice(p.initial_price)}</h3>
                <ul class="list-group list-group-flush small mb-3">
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>${LANG.FLOOR}</span> <strong>미기재</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>${LANG.DIRECTION}</span> <strong>미기재</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>등록일</span> <strong>${formatDate(p.initial_price_date)}</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>상태</span> <strong class="text-success">${LANG.AVAILABLE}</strong></li>
                </ul>
                
                <h6 class="mt-4 mb-2 fw-bold border-bottom pb-2">시장 정보</h6>
                <ul class="list-group list-group-flush small">
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>${LANG.CURRENT_PRICE}</span> <strong>${formatPrice(p.initial_price)}</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>${LANG.RECENT_TRANSACTION}</span> <strong>${p.sales_info_raw || '정보 없음'}</strong></li>
                </ul>
            </div>
        </div>
        `;
        
        if (decisionState === 'NONE') {
            html += `
            <div id="decision-panel" class="mb-3 border rounded p-3 bg-light">
                <h6 class="fw-bold mb-3"><i class="fa-solid fa-code-branch me-2"></i>의사결정</h6>
                <div class="row g-2 mb-2">
                    <div class="col-6">
                        <button id="decision-explore" class="btn btn-outline-secondary w-100 btn-sm" onclick="doDecisionExplore()">
                            <i class="fa-solid fa-magnifying-glass me-1"></i> 추가 탐색
                        </button>
                    </div>
                    <div class="col-6">
                        <button id="decision-compare" class="btn btn-outline-secondary w-100 btn-sm" onclick="doDecisionCompare()">
                            <i class="fa-solid fa-code-compare me-1"></i> 비교하기
                        </button>
                    </div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <button id="decision-watch" class="btn btn-${watchState ? 'warning text-dark' : 'outline-warning text-dark'} w-100 btn-sm" onclick="toggleWatch()">
                            <i class="${watchState ? 'fa-solid' : 'fa-regular'} fa-star me-1"></i> ${watchState ? '관심 해제' : '관심 등록'}
                        </button>
                    </div>
                    <div class="col-6">
                        <button id="decision-hold" class="btn btn-outline-dark w-100 btn-sm" onclick="doDecisionHold()">
                            <i class="fa-solid fa-pause me-1"></i> 관망 (HOLD)
                        </button>
                    </div>
                </div>
                <button id="decision-buy-intent" class="btn btn-primary w-100 fw-bold" onclick="doBuyIntent()">
                    <i class="fa-solid fa-cart-shopping me-1"></i> 매수 검토 (BUY INTENT)
                </button>
            </div>
            `;
        } else if (decisionState === 'EXPLORE') {
            html += `
            <div class="alert alert-info" id="decision-explore-panel">
                <h6 class="fw-bold"><i class="fa-solid fa-magnifying-glass me-1"></i> 탐색 정보</h6>
                <p class="small mb-2">해당 매물(${p.complex_name})에 대한 주변 시세 및 개발 호재 데이터를 수집했습니다.</p>
                <ul class="small mb-3 ps-3">
                    <li>3개월 거래량 추이: 안정적</li>
                    <li>예상 임대수익률: 4.2%</li>
                    <li>주변 학군 정보: 양호</li>
                </ul>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelDecision()">상세로 돌아가기</button>
            </div>
            `;
        } else if (decisionState === 'COMPARE') {
            const sameComplexProps = complexDataMap[selectedComplex].filter(cp => cp.property_id !== p.property_id).slice(0, 2);
            let compareHtml = sameComplexProps.map(cp => `
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom small">
                    <div>
                        <div class="fw-bold">${cp.representative_area_sqm}㎡</div>
                        <div class="text-muted">층수 미기재</div>
                    </div>
                    <div class="fw-bold text-danger">${formatPrice(cp.initial_price)}</div>
                </div>
            `).join('');
            if (sameComplexProps.length === 0) compareHtml = '<p class="small text-muted">비교 가능한 매물이 없습니다.</p>';

            html += `
            <div class="alert alert-secondary" id="decision-compare-panel">
                <h6 class="fw-bold"><i class="fa-solid fa-code-compare me-1"></i> 비교 결과</h6>
                <p class="small fw-bold mb-1">같은 단지 다른 매물</p>
                <div class="bg-white p-2 border rounded mb-3">
                    ${compareHtml}
                </div>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelDecision()">상세로 돌아가기</button>
            </div>
            `;
        } else if (decisionState === 'HOLD') {
            html += `
            <div class="alert alert-dark text-center" id="decision-hold-panel">
                <i class="fa-solid fa-pause fs-2 mb-2"></i>
                <h6 class="fw-bold">관망 (HOLD) 결정</h6>
                <p class="small mb-3">지금은 거래를 진행하지 않기로 결정했습니다.<br>이 결정이 기록되었습니다.</p>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelDecision()">상세로 돌아가기</button>
            </div>
            `;
        } else if (decisionState === 'BUY_INTENT') {
            window.currentLoanRequest = 0;
            html += `
            <div class="alert alert-primary" id="decision-buy-intent-panel">
                <h6 class="fw-bold"><i class="fa-solid fa-cart-shopping me-1"></i> 매수 검토 (BUY INTENT)</h6>
                <p class="small mb-3">해당 매물의 매수 절차를 시작합니다. 아직 실제 거래가 발생하지 않았으며, 자금 및 비용을 점검합니다.</p>
                <button class="btn btn-primary w-100 mb-2" onclick="doFundingCheck()">자금 확인 (Funding Check)</button>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelDecision()">취소하고 상세로 돌아가기</button>
            </div>
            `;
        } else if (decisionState === 'FUNDING_CHECK') {
            const currentCash = getAvailableCash();
            const taxRate = getTransactionCostRate(p.initial_price, p.representative_area_sqm);
            const tax = taxRate !== null ? Math.floor(p.initial_price * taxRate) : null;
            const requiredFunds = tax !== null ? p.initial_price + tax : null;
            
            // Loan config & limits
            const ltv_limit = (typeof currentSeasonState !== 'undefined' && currentSeasonState?.config?.primary_supply_ratio) ? currentSeasonState.config.primary_supply_ratio : 0.7;
            const annual_income = 70000000;
            const dsr_limit = 0.5;
            const existing_annual_debt = 0; 
            
            const base_rate = 0.03;
            const interest_rate = base_rate + 0.015 + 0.002; // 4.70%
            const monthly_rate = interest_rate / 12;
            const loan_term = calculateRemainingTerm();
            
            const max_loan_possible = calculateMaxLoan(p.initial_price, ltv_limit, annual_income, existing_annual_debt, monthly_rate, loan_term, dsr_limit);
            
            let requested_loan = window.currentLoanRequest || 0;
            if (requested_loan > max_loan_possible) requested_loan = max_loan_possible;
            window.currentLoanRequest = requested_loan;
            
            const monthly_payment = calculateMonthlyPayment(requested_loan, monthly_rate, loan_term);
            const calculated_dsr = annual_income > 0 ? ((existing_annual_debt + monthly_payment * 12) / annual_income) : 0;
            
            const cashStr = currentCash === null ? 'UNAVAILABLE' : formatPrice(currentCash);
            const requiredFundsStr = requiredFunds === null ? 'UNAVAILABLE' : formatPrice(requiredFunds);
            
            let isSufficient = false;
            let statusStr = 'UNAVAILABLE';
            let statusClass = 'text-muted';
            
            if (currentCash !== null && requiredFunds !== null) {
                const isFundingSufficient = (currentCash + requested_loan) >= requiredFunds;
                const isDsrSufficient = calculated_dsr <= 0.5;
                isSufficient = isFundingSufficient && isDsrSufficient;
                statusStr = isSufficient ? '자금 충분' : (calculated_dsr > 0.5 ? 'DSR 초과' : '자금 부족');
                statusClass = isSufficient ? 'text-success' : 'text-danger';
            }
            
            const nextDisabled = currentCash === null || requiredFunds === null || !isSufficient ? 'disabled' : '';
            
            const amt25 = formatPrice(Math.round((max_loan_possible * 0.25) / 1000000) * 1000000);
            const amt50 = formatPrice(Math.round((max_loan_possible * 0.50) / 1000000) * 1000000);
            const amt75 = formatPrice(Math.round((max_loan_possible * 0.75) / 1000000) * 1000000);
            const amt100 = formatPrice(max_loan_possible);

            html += `
            <div class="alert alert-primary" id="decision-funding-check-panel">
                <h6 class="fw-bold"><i class="fa-solid fa-wallet me-1"></i> 자금 확인 및 대출 (Funding Check)</h6>
                <ul class="list-group list-group-flush small mb-3">
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent">
                        <span>매물 가격</span>
                        <strong>${formatPrice(p.initial_price)}</strong>
                    </li>
                    <li class="list-group-item px-0 bg-transparent border-top border-dark mt-1 pt-2">
                        <div class="d-flex justify-content-between align-items-baseline">
                            <span>최대 가능 대출</span>
                            <strong class="fs-6">${formatPrice(max_loan_possible)}</strong>
                        </div>
                        <div class="text-muted text-end" style="font-size: 11px;">
                            LTV·DSR 계산 결과 중 낮은 금액 적용<br>
                            LTV ${(ltv_limit * 100).toFixed(0)}% · DSR 50% 기준
                        </div>
                    </li>
                    <li class="list-group-item px-0 bg-transparent">
                        <div class="d-flex justify-content-between mb-1">
                            <span>대출 신청 금액</span>
                            <strong id="loanAmountLabel" class="text-primary">${formatPrice(requested_loan)}</strong>
                        </div>
                        <input type="range" class="form-range mb-0" min="0" max="${max_loan_possible}" step="1000000" id="loanRangeInput" value="${requested_loan}" oninput="window.updateLoanUI(this.value, ${p.initial_price}, ${ltv_limit}, ${annual_income}, ${existing_annual_debt}, ${monthly_rate}, ${loan_term}, ${interest_rate}, ${currentCash}, ${requiredFunds})">
                        <div class="d-flex justify-content-between text-muted mt-1" style="font-size: 11px; line-height: 1.2;">
                            <span class="text-start">0</span>
                            <span class="text-center">${amt25}</span>
                            <span class="text-center">${amt50}</span>
                            <span class="text-center">${amt75}</span>
                            <span class="text-end">최대 (${amt100})</span>
                        </div>
                    </li>
                    <li class="list-group-item px-0 bg-transparent">
                        <div class="d-flex justify-content-between align-items-center">
                            <span>예상 월 상환액</span>
                            <strong id="loanMonthlyLabel" class="fs-6 text-dark">${Math.round(monthly_payment).toLocaleString('ko-KR')}원/월</strong>
                        </div>
                        <div class="text-muted text-end" style="font-size: 11px;" id="loanMetaLabel">
                            금리 ${(interest_rate * 100).toFixed(2)}% · 상환기간 ${loan_term}개월
                        </div>
                    </li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent border-top border-dark mt-1 pt-2">
                        <span>보유 현금</span>
                        <strong>${cashStr}</strong>
                    </li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent">
                        <span>필요 자금 (비용 포함)</span>
                        <strong class="text-danger">${requiredFundsStr}</strong>
                    </li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent">
                        <span>자금 상태</span>
                        <strong id="fundStatusLabel" class="${statusClass}">${statusStr}</strong>
                    </li>
                </ul>
                <button class="btn btn-primary w-100 mb-2" id="nextCostCheckBtn" onclick="doCostCheck()" ${nextDisabled}>비용 확인 (Transaction Cost)</button>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelDecision()">취소</button>
            </div>
            `;
        } else if (decisionState === 'COST_CHECK') {
            const taxRate = getTransactionCostRate(p.initial_price, p.representative_area_sqm);
            const tax = taxRate !== null ? Math.floor(p.initial_price * taxRate) : null;
            const taxStr = tax !== null ? formatPrice(tax) : 'UNAVAILABLE';
            const totalStr = tax !== null ? formatPrice(p.initial_price + tax) : 'UNAVAILABLE';
            
            html += `
            <div class="alert alert-primary" id="decision-cost-check-panel">
                <h6 class="fw-bold"><i class="fa-solid fa-file-invoice-dollar me-1"></i> 비용 확인 (Transaction Cost)</h6>
                <ul class="list-group list-group-flush small mb-3">
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent"><span>매물 가격</span> <strong>${formatPrice(p.initial_price)}</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent"><span>예상 취득세/수수료</span> <strong>${taxStr}</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent border-top border-dark mt-1 pt-2"><span>총 예상 비용</span> <strong class="text-danger">${totalStr}</strong></li>
                </ul>
                <button class="btn btn-primary w-100 mb-2" onclick="doExpectedResult()">결과 예상 (Expected Result)</button>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="doFundingCheck()">이전 단계</button>
            </div>
            `;
        } else if (decisionState === 'EXPECTED_RESULT') {
            const currentCash = getAvailableCash();
            const currentDebt = getPlayerAsset()?.debt_total || 0;
            const taxRate = getTransactionCostRate(p.initial_price, p.representative_area_sqm);
            const tax = taxRate !== null ? Math.floor(p.initial_price * taxRate) : null;
            const requiredFunds = tax !== null ? p.initial_price + tax : null;
            const requested_loan = window.currentLoanRequest || 0;
            const expectedCash = (currentCash !== null && requiredFunds !== null) ? currentCash + requested_loan - requiredFunds : null;
            
            html += `
            <div class="alert alert-primary" id="decision-expected-result-panel">
                <h6 class="fw-bold"><i class="fa-solid fa-chart-pie me-1"></i> 구매 후 예상 (Expected Result)</h6>
                <p class="small text-muted mb-2">실제 구매 진행 시 예상되는 자산 변동입니다.</p>
                <ul class="list-group list-group-flush small mb-3">
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent"><span>현금</span> <strong>${expectedCash !== null ? formatPrice(expectedCash) : 'UNAVAILABLE'}</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent"><span>보유 부동산 수</span> <strong>+ 1건</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent"><span>부채</span> <strong>${formatPrice(currentDebt + requested_loan)}</strong></li>
                    <li class="list-group-item px-0 d-flex justify-content-between bg-transparent"><span>예상 순자산</span> <strong class="text-primary">취득세만큼 감소</strong></li>
                </ul>
                <button class="btn btn-primary w-100 mb-2" onclick="doBuyConfirmation()">최종 구매 확인 (Confirmation)</button>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="doCostCheck()">이전 단계</button>
            </div>
            `;
        } else if (decisionState === 'BUY_CONFIRMATION') {
            const currentCash = getAvailableCash();
            const requested_loan = window.currentLoanRequest || 0;
            const taxRate = getTransactionCostRate(p.initial_price, p.representative_area_sqm);
            const tax = taxRate !== null ? Math.floor(p.initial_price * taxRate) : null;
            const requiredFunds = tax !== null ? p.initial_price + tax : null;
            let statusStr = 'UNAVAILABLE';
            let statusClass = 'text-muted';
            
            if (currentCash !== null && requiredFunds !== null) {
                const isSufficient = (currentCash + requested_loan) >= requiredFunds;
                statusStr = isSufficient ? '매수 가능' : '자금 부족';
                statusClass = isSufficient ? 'text-success' : 'text-danger';
            }
            
            html += `
            <div class="alert alert-primary" id="decision-buy-confirmation-panel">
                <h6 class="fw-bold text-center mb-3"><i class="fa-solid fa-circle-check text-success fs-1 mb-2"></i><br>구매 요약 및 최종 확인</h6>
                <div class="bg-white p-3 border rounded small mb-3">
                    <div class="mb-1 text-muted">대상</div>
                    <div class="fw-bold mb-3">${p.complex_name} (${p.representative_area_sqm}㎡)</div>
                    
                    <div class="mb-1 text-muted">결제 자금</div>
                    <div class="fw-bold text-danger mb-3">${requiredFunds !== null ? formatPrice(requiredFunds) : 'UNAVAILABLE'}</div>
                    
                    <div class="mb-1 text-muted">자금 상태</div>
                    <div class="fw-bold ${statusClass}">${statusStr}</div>
                </div>
                <button class="btn btn-danger w-100 fw-bold mb-2" onclick="doBuyTransaction()">구매 진행 (IA-03C Entry)</button>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="doBuyIntent()">다시 살펴보기</button>
            </div>
            `;
        } else if (decisionState === 'IA_03C_ENTRY') {
            html += `
            <div class="alert alert-success text-center" id="decision-ia03c-entry-panel">
                <i class="fa-solid fa-flag-checkered fs-2 mb-2"></i>
                <h6 class="fw-bold">IA-03C ACTUAL BUY 단계 진입</h6>
                <p class="small mb-3">이후부터 실제 거래가 체결되고 계좌 잔고가 차감됩니다.</p>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="cancelDecision()">처음으로 돌아가기</button>
            </div>
            `;
        } else if (decisionState === 'BUY_RESULT') {
            const br = window.latestBuyResult;
            html += `
            <div class="alert alert-success" id="decision-buy-result-panel">
                <h5 class="fw-bold text-center mb-4"><i class="fa-solid fa-check-circle text-success fs-1 mb-2"></i><br>구매 완료</h5>
                
                <div class="bg-white p-3 border rounded small mb-3 shadow-sm">
                    <div class="text-center border-bottom pb-2 mb-3">
                        <div class="fw-bold fs-6 text-dark">${br.property.complex_name}</div>
                        <div class="text-muted">${br.property.property_id} | ${br.property.representative_area_sqm}㎡</div>
                    </div>
                    
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Transaction ID</span>
                        <span class="fw-bold text-dark text-truncate" style="max-width: 150px;">${br.tx.transaction_id || '정보 없음'}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">취득 가격</span>
                        <span class="fw-bold">${formatPrice(br.property.initial_price)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">취득세 및 수수료</span>
                        <span class="fw-bold">${formatPrice(br.cost)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-3 pb-2 border-bottom">
                        <span class="text-muted">총 지출(Outflow)</span>
                        <span class="fw-bold text-danger">${formatPrice(br.property.initial_price + br.cost)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">보유 현금</span>
                        <span class="fw-bold text-success">${formatPrice(playerState.asset.cash_available)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">순자산 (Net Worth)</span>
                        <span class="fw-bold text-primary">${formatPrice(playerState.asset.net_worth)}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span class="text-muted">보유 부동산 수</span>
                        <span class="fw-bold text-dark">${playerState.asset.property_count} 채</span>
                    </div>
                </div>
                
                <button class="btn btn-primary w-100 mb-2 fw-bold" onclick="goToMyWorld()">내 세계 보기 (MY WORLD)</button>
                <button class="btn btn-outline-dark w-100 mb-2" onclick="cancelDecision()">구매한 아파트 보기</button>
                <button class="btn btn-link text-secondary w-100 text-decoration-none" onclick="goToMyWorld()">세계로 돌아가기</button>
            </div>
            `;
            // Hide the back-to-listing button for result state
            actionEl.innerHTML = html;
            return;
        }
                 
        html += `<button class="btn btn-outline-secondary btn-sm" onclick="goBackToListing()"><i class="fa-solid fa-arrow-left"></i> ${LANG.BACK_TO_LISTING}</button>`;
        actionEl.innerHTML = html;
    }
}

// On Load
$(document).ready(async function() {
    await (window.playDevFeaturesReady || Promise.resolve());
    initFirebaseAndPlayer();
    loadData();
});


window.updateLoanUI = function(valStr, propertyPrice, ltvLimit, annualIncome, existingAnnualDebt, monthlyRate, loanTerm, interestRate, currentCash, requiredFunds) {
    const val = parseInt(valStr) || 0;
    window.currentLoanRequest = val;
    
    const amountLabel = document.getElementById('loanAmountLabel');
    if (amountLabel) amountLabel.innerText = formatPrice(val);
    
    const monthlyPayment = calculateMonthlyPayment(val, monthlyRate, loanTerm);
    const monthlyLabel = document.getElementById('loanMonthlyLabel');
    if (monthlyLabel) {
        monthlyLabel.innerText = `${Math.round(monthlyPayment).toLocaleString('ko-KR')}원/월`;
    }
    
    const newAnnualDebt = (existingAnnualDebt || 0) + (monthlyPayment * 12);
    const calculatedDSR = annualIncome > 0 ? (newAnnualDebt / annualIncome) : 0;
    
    if (currentCash !== null && requiredFunds !== null) {
        const isFundingSufficient = (currentCash + val) >= requiredFunds;
        const isDsrSufficient = calculatedDSR <= 0.5;
        const isSufficient = isFundingSufficient && isDsrSufficient;
        
        const statusEl = document.getElementById('fundStatusLabel');
        if (statusEl) {
            statusEl.innerText = isSufficient ? '자금 충분' : (calculatedDSR > 0.5 ? 'DSR 초과' : '자금 부족');
            statusEl.className = isSufficient ? 'text-success' : 'text-danger';
        }
        
        const btn = document.getElementById('nextCostCheckBtn');
        if (btn) btn.disabled = !isSufficient;
    }
};
