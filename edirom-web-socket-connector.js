import '../edirom-core-web-components/src/edirom-icon.js';

console.log("WebSocket Connector Web Component loaded");

// Resolve the component's own script URL at definition time, so we can
// locate vendor libraries relative to ourselves even when the component
// is deployed at an unknown path.
const _COMPONENT_BASE = (() => {
    // Classic <script> tag
    if (document.currentScript) {
        return new URL('.', document.currentScript.src).href;
    }
    // ES module (imported or loaded with type="module")
    try {
        if (import.meta.url) {
            return new URL('.', import.meta.url).href;
        }
    } catch (_) { }
    return '';
})();

const componentTemplate = `
<style>
    :host {
        display: block;
        height: 100%;
        --_ws-primary: var(--primary-color, #000000);
        --_ws-secondary: var(--secondary-color, #cacaca);
        --_ws-tertiary: var(--tertiary-color, #faf6f0);
        --_ws-quaternary: var(--quaternary-color, var(--_ws-secondary));
    }

    #ws-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    #ws-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        -webkit-user-select: none;
        user-select: none;
    }

    #ws-button:active {
        background: rgba(255, 255, 255, 0.2);
    }

    #ws-button edirom-icon {
        width: 100%;
        height: 100%;
    }

    #session-popover {
        position: fixed;
        inset: 0;
        margin: auto;
        width: 95dvw;
        max-width: 600px;
        height: 95dvh;
        border: none;
        padding: 0;
        border-radius: 12px;
        background: transparent;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        overflow: hidden;
        transform-origin: var(--popover-origin-x, 50%) var(--popover-origin-y, 50%);
        transition: transform 0.75s cubic-bezier(0.22, 1.15, 0.36, 1), opacity 0.15s ease-out;
    }

    @starting-style {
        #session-popover:popover-open {
            transform: scale(0.04);
        }
        #session-popover:popover-open::backdrop {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
        }
    }

    #session-popover.closing {
        transform: scale(0.04);
        opacity: 0.5;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.8, 0.3), opacity 0.2s ease-in 0.2s;
    }

    #session-popover.closing::backdrop {
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
        transition: backdrop-filter 0.2s ease-in;
    }

    #session-popover::backdrop {
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        transition: backdrop-filter 0.75s ease;
    }

    #session-popover-inner {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 0;
        box-sizing: border-box;
        gap: 0;
    }

    #session-popover-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 20px;
        height: 50px;
        box-sizing: border-box;
        background-color: var(--_ws-secondary);
        color: var(--_ws-primary);
        font-size: 1rem;
        font-weight: 600;
        user-select: none;
        -webkit-user-select: none;
        flex-shrink: 0;
    }

    #session-popover-header edirom-icon {
        width: 1.4rem;
        height: 1.4rem;
        flex-shrink: 0;
    }

    #notification-host {
        position: fixed;
        top: 16px;
        left: 0;
        right: 0;
        margin: 0 auto;
        width: fit-content;
        max-width: min(480px, 90dvw);
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
        border: none;
        padding: 0;
        background: transparent;
        box-shadow: none;
    }

    .notification-toast {
        min-height: 50px;
        min-width: 100px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 16px 10px;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        transform-origin: center center;
        animation: toast-appear 0.35s cubic-bezier(0.22, 1.15, 0.36, 1) forwards;
    }

    .notification-toast.dismissing {
        animation: toast-dismiss 0.25s ease-in forwards;
    }

    .toast-green  { background: #83c702; color: #fff; }
    .toast-yellow { background: #f0a500; color: #fff; }
    .toast-red    { background: #e05353; color: #fff; }
    .toast-grey   { background: #6b7280; color: #fff; }

    .notification-toast edirom-icon {
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
    }

    .toast-message {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 500;
        line-height: 1.4;
    }

    .toast-progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: rgba(0, 0, 0, 0.15);
        border-radius: 0 0 12px 12px;
        overflow: hidden;
    }

    .toast-progress-inner {
        height: 100%;
        width: 100%;
        background: rgba(0, 0, 0, 0.3);
        transform-origin: left center;
        animation: toast-progress-shrink 3s linear forwards;
    }

    @keyframes toast-appear {
        from { transform: scale(0); opacity: 0; }
        to   { transform: scale(1); opacity: 1; }
    }

    @keyframes toast-dismiss {
        from { transform: scale(1); opacity: 1; }
        to   { transform: scale(0); opacity: 0; }
    }

    @keyframes toast-progress-shrink {
        from { transform: scaleX(1); }
        to   { transform: scaleX(0); }
    }

    #session-content {
        flex: 1;
        overflow-y: auto;
        scrollbar-gutter: stable;
        color: var(--_ws-primary);
        background-color: var(--_ws-tertiary);
        padding: 16px 20px;
        box-sizing: border-box;
        -webkit-overflow-scrolling: touch;
    }

    #session-content h2 {
        font-size: 1rem;
        margin: 12px 0 6px;
        user-select: none;
        -webkit-user-select: none;
    }

    #session-content hr {
        border: none;
        border-top: 1px solid rgba(35, 42, 68, 0.2);
        margin: 12px 0;
    }

    #qr-code-placeholder {
        text-align: center;
    }

    #qr-code-placeholder img {
        max-width: min(300px, 60vw);
        max-height: min(300px, 60vw);
        border-radius: 12px;
    }

    #session-id {
        text-align: center;
        font-size: 4rem;
        font-family: monospace;
        font-weight: 600;
        color: var(--_ws-primary);
        letter-spacing: 4px;
    }

    .members-table {
        display: flex;
        flex-direction: column;
        margin: 0 0 4px;
    }

    .member-row {
        display: grid;
        grid-template-columns: 20px 1fr auto;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid rgba(35, 42, 68, 0.1);
    }

    .member-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
    }

    .member-icon edirom-icon {
        width: 100%;
        height: 100%;
    }

    .member-name {
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .member-name-input {
        width: 100%;
        min-width: 0;
        padding: 0;
        margin: 0;
        height: 1lh;
        box-sizing: border-box;
        border: none;
        border-bottom: 1px solid var(--_ws-secondary);
        background: transparent;
        color: inherit;
        font-size: inherit;
        line-height: inherit;
        font-family: inherit;
        outline: none;
    }

    .member-actions {
        display: flex;
        gap: 2px;
        flex-shrink: 0;
    }

    .member-actions .icon-button {
        width: 18px;
        height: 18px;
    }

    #bottom-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 14px;
        flex-shrink: 0;
        height: 60px;
        box-sizing: border-box;
        background: transparent;
        padding: 0 20px;
    }

    #close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        padding: 0;
        cursor: pointer;
        border: none;
        border-radius: 50%;
        background: var(--_ws-secondary);
        color: var(--_ws-primary);
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
    }

    /* ---- Page System ---- */

    .page-session-information {
        display: flex;
        flex-direction: column;
        min-height: 100%;
    }

    .page-failed-connection {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-top: 12px;
    }

    .connection-error-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 15px;
        background: #e05353;
        color: #fff;
    }

    .connection-error-card edirom-icon {
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
    }

    .connection-error-card p {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.4;
    }

    .session-info-footer {
        margin-top: auto;
        padding-top: 40px;
    }

    #session-content h1 {
        font-size: 1.25rem;
        font-weight: 600;
        text-align: center;
        margin: 0 0 20px;
        user-select: none;
        -webkit-user-select: none;
    }

    .device-name-row {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
        font-size: 0.95rem;
        color: var(--_ws-primary);
    }

    .device-name-label {
        flex-shrink: 0;
        white-space: nowrap;
        user-select: none;
        -webkit-user-select: none;
    }

    .device-name-text {
        flex: 0 1 auto;
        min-width: 0;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 6px 10px;
        border: 1px solid transparent;
        border-radius: 6px;
        box-sizing: border-box;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
    }

    .device-name-input {
        flex: 0 1 auto;
        min-width: 5ch;
        font-size: 0.95rem;
        font-weight: 600;
        padding: 6px 10px;
        border: 1px solid color-mix(in oklch, var(--_ws-secondary) 70%, transparent);
        border-radius: 6px;
        background: transparent;
        color: var(--_ws-primary);
        font-family: inherit;
        box-sizing: border-box;
        field-sizing: content;
    }

    .device-name-row .icon-button {
        width: 20px;
        height: 20px;
    }

    .icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
    }

    .icon-button:active {
        background: rgba(0, 0, 0, 0.1);
    }

    .icon-button edirom-icon {
        width: 100%;
        height: 100%;
    }

    .action-buttons-row {
        display: flex;
        gap: 4%;
        justify-content: center;
        margin-bottom: 20px;
    }

    .action-button {
        container-type: inline-size;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        max-width: 200px;
        aspect-ratio: 1 / 1;
        padding: 18px 10px;
        border: none;
        border-radius: 12px;
        background: var(--_ws-secondary);
        color: var(--_ws-primary);
        cursor: pointer;
        font-family: inherit;
        font-weight: 500;
        text-align: center;
        line-height: 1.3;
        -webkit-tap-highlight-color: transparent;
        -webkit-user-select: none;
        user-select: none;
    }

    .action-button:active {
        background: color-mix(in oklch, var(--_ws-secondary) 85%, black);
    }

    .action-button edirom-icon {
        width: 40%;
        height: 40%;
        display: block;
    }

    .action-button > span {
        font-size: clamp(0.85rem, 8cqw, 1.6rem);
    }

    .intro-text {
        font-size: 0.85rem;
        color: var(--_ws-primary);
        opacity: 0.7;
        text-align: center;
        margin: 0;
        line-height: 1.5;
    }

    .add-device-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 14px 20px;
        margin-top: 16px;
        border: none;
        border-radius: 10px;
        background: var(--_ws-secondary);
        color: var(--_ws-primary);
        cursor: pointer;
        font-family: inherit;
        font-size: 1rem;
        font-weight: 600;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-user-select: none;
        user-select: none;
    }

    .add-device-button:active {
        background: color-mix(in oklch, var(--_ws-secondary) 85%, black);
    }

    .add-device-button edirom-icon {
        width: 1.4rem;
        height: 1.4rem;
        flex-shrink: 0;
    }

    .dissolve-session-button {
        margin-top: 10px;
        background: #ed121261;
        color: #fff;
    }

    .dissolve-session-button:active {
        background: color-mix(in oklch, #ed121261 85%, black);
    }

    .invite-type-container {
        padding-top: 13px;
        padding-bottom: 13px;
    }

    .invite-type-label {
        text-align: center;
        font-size: 0.88rem;
        color: var(--_ws-primary);
        user-select: none;
        -webkit-user-select: none;
        }

    .qr-code-container {
        text-align: center;
        margin-bottom: 16px;
    }

    .qr-code-container img {
        max-width: min(220px, 60vw);
    }

    .url-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        background: var(--_ws-secondary);
        color: var(--_ws-primary);
    }

    .url-row .icon-button {
        width: 1.2rem;
        height: 1.2rem;
    }

    .url-text {
        flex: 1;
        font-size: 0.85rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin: 0;
        -webkit-user-select: none;
        user-select: none;
    }

    .copy-btn-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
    }

    .copy-tooltip {
        position: absolute;
        bottom: calc(100% + 15px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--_ws-secondary);
        color: var(--_ws-primary);
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: 6px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s;
    }

    .copy-tooltip.visible {
        opacity: 1;
    }

    .join-input-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
    }

    .join-input-label {
        font-size: 0.95rem;
        color: var(--_ws-primary);
        margin: 0;
        user-select: none;
        -webkit-user-select: none;
    }

    .join-input {
        font-size: 1.5rem;
        font-weight: 600;
        text-align: center;
        letter-spacing: 0.3em;
        padding: 12px;
        border: 2px solid var(--_ws-secondary);
        border-radius: 10px;
        background: transparent;
        color: var(--_ws-primary);
        font-family: monospace;
        width: 100%;
        box-sizing: border-box;
        text-transform: uppercase;
    }

    .join-input:focus {
        outline: none;
        border-color: color-mix(in oklch, var(--_ws-secondary) 70%, white);
    }

    .join-error {
        color: #e05353;
        font-size: 0.9rem;
        font-weight: 500;
        margin: 0 0 8px;
    }

    .separator-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 20px 0;
        color: var(--_ws-primary);
        opacity: 0.6;
    }

    .separator-line {
        flex: 1;
        height: 1px;
        background: currentColor;
    }

    .separator-text {
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        user-select: none;
        -webkit-user-select: none;
    }

    .qr-scanner-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 140px;
        border: 2px dashed var(--_ws-secondary);
        border-radius: 10px;
        color: var(--_ws-primary);
        opacity: 0.5;
        font-size: 0.9rem;
        text-align: center;
        padding: 20px;
        box-sizing: border-box;
    }

    #back-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        padding: 0;
        cursor: pointer;
        border: none;
        border-radius: 50%;
        background: var(--_ws-secondary);
        color: var(--_ws-primary);
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
    }

    #back-button:active {
        background: color-mix(in oklch, var(--_ws-secondary) 85%, black);
    }

    #back-button.hidden {
        display: none;
    }

    #close-button edirom-icon,
    #back-button edirom-icon {
        width: 1.4rem;
        height: 1.4rem;
    }
</style>
<div id="ws-container">
    <button id="ws-button" aria-label="WebSocket Verbindung">
        <edirom-icon name="hub" size="fill"></edirom-icon>
    </button>
    <div id="session-popover" popover="manual">
        <div id="session-popover-inner">
            <div id="session-popover-header">
                <edirom-icon name="hub" size="fill"></edirom-icon>
                <span>Vernetzte Arbeitsumgebung</span>
            </div>
            <div id="session-content"></div>
            <div id="bottom-row">
                <button id="back-button" class="hidden" aria-label="Zurück">
                    <edirom-icon name="arrow_back" size="fill"></edirom-icon>
                </button>
                <button id="close-button" aria-label="Schließen">
                    <edirom-icon name="close" size="fill"></edirom-icon>
                </button>
            </div>
        </div>
    </div>
    <div id="notification-host" popover="manual"></div>
</div>
`;

const CONNECTION_STATE_COLORS = {
    failed: 'red',
    connected: '#ed9418',
    checking: 'var(--_ws-quaternary)',
    session: '#83c702',
};


class EdiromWebSocketConnector extends HTMLElement {

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
        this._connectionState = 'checking';
        this._webSocket = null;
        this._clientId = null;
        this._sessionId = null;
        this._sessionData = null;
        this._joinError = null;
        this.deviceName = "";
        this._currentPageName = null;
        this._pageHistory = [];
        this.wsUrl = null;
        this._inviteUrl = null;
        this._autoJoined = false;
        this._disconnectReason = null;
        this._isCreatingSession = false;
        this._browserReady = false;
    }

    // -------------------------------------------------------------------------
    // Vendor library loading (shared across all instances)
    // -------------------------------------------------------------------------

    static _bowserLoadPromise = null;
    static _qrcodeLoadPromise = null;

    /**
     * Ensures a single vendor library is loaded by injecting a <script> tag
     * into the host's <head>. Deduplicates across all instances of the
     * component.
     *
     * @param {string} globalName - window property to check after load
     * @param {string} relativePath - path relative to this component's script
     * @returns {Promise<void>}
     */
    static _ensureLibrary(globalName, relativePath) {
        if (window[globalName]) return Promise.resolve();

        const cacheKey = `_${globalName}LoadPromise`;
        if (EdiromWebSocketConnector[cacheKey]) {
            return EdiromWebSocketConnector[cacheKey];
        }

        if (!_COMPONENT_BASE) {
            return Promise.reject(new Error(
                `Cannot determine component location to load ${relativePath}. ` +
                `Preload the library with a <script> tag before this component.`
            ));
        }

        const scriptSrc = new URL(relativePath, _COMPONENT_BASE).href;

        EdiromWebSocketConnector[cacheKey] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptSrc;
            script.onload = () => {
                if (window[globalName]) {
                    resolve();
                } else {
                    reject(new Error(
                        `${relativePath} loaded but window.${globalName} is not set.`
                    ));
                }
            };
            script.onerror = () => {
                reject(new Error(`Failed to load ${relativePath} from: ${scriptSrc}`));
            };
            document.head.appendChild(script);
        });

        return EdiromWebSocketConnector[cacheKey];
    }

    static get observedAttributes() {
        return ['ws-url', 'session', 'invite-url'];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    connectedCallback() {
        console.log('EdiromWebSocketConnector connected!');
        this._applyTemplate();
        this._setupElements();
        this._setupEventListeners();
        this._setConnectionState('checking');
        this._initialCheckPromise = this._runAvailabilityCheck();
        this.setAttribute('data-handles-back-request', '');
        this.addEventListener('back-request', this._handleBackRequest);

        // Load bowser from the component's own vendor directory (injected into
        // the host <head> if not already present). Once ready, initialise
        // browser-dependent state.
        EdiromWebSocketConnector._ensureLibrary('bowser', 'vendor/bowser-es5.js')
            .then(() => {
                this.browser = bowser.getParser(window.navigator.userAgent);
                this._browserReady = true;
                this.initDeviceName();
            })
            .catch((err) => {
                console.warn('EdiromWebSocketConnector: bowser not available, using fallback.', err);
                this.browser = null;
                this.initDeviceName();
            });

        // Pre-load qrcode in the background — _renderQrCode checks for it at
        // render time and falls back to plain text if absent.
        EdiromWebSocketConnector._ensureLibrary('qrcode', 'vendor/qrcode.js').catch(() => {});
    }

    disconnectedCallback() {
        console.log('EdiromWebSocketConnector disconnected!');
        this.removeEventListener('back-request', this._handleBackRequest);
        document.removeEventListener('keydown', this._handleDocumentKeydown);
        document.removeEventListener('click', this._handleDocumentClick, true);
        if (this._webSocket) {
            this._webSocket.onclose = null; // prevent state updates after removal
            this._webSocket.close();
            this._webSocket = null;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'ws-url') {
            this.wsUrl = newValue;
        } else if (name === 'session') {
            if (newValue) {
                this._autoJoined = true;
                Promise.resolve(this._initialCheckPromise).then(() => this._joinSession(newValue));
            }
        } else if (name === 'invite-url') {
            this._inviteUrl = newValue;
            if (this._currentPageName === 'invitePage') {
                const urlTextEl = this._sessionContent?.querySelector('.url-text');
                if (urlTextEl) urlTextEl.textContent = this._getFullInviteUrl() ?? '—';
                const qrPlaceholder = this._sessionContent?.querySelector('#qr-code-placeholder');
                if (qrPlaceholder) this._renderQrCode(qrPlaceholder);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Template & Elements
    // -------------------------------------------------------------------------

    _applyTemplate = () => {
        const template = document.createElement('template');
        template.innerHTML = componentTemplate;
        this.shadow.innerHTML = '';
        this.shadow.append(template.content.cloneNode(true));
    }

    _setupElements = () => {
        this._wsButton = this.shadow.querySelector('#ws-button');
        this._statusIcon = this._wsButton.querySelector('edirom-icon');
        this._sessionPopover = this.shadow.querySelector('#session-popover');
        this._notificationHost = this.shadow.querySelector('#notification-host');
        this._sessionContent = this.shadow.querySelector('#session-content');
        this._backButton = this.shadow.querySelector('#back-button');
        this._closeButton = this.shadow.querySelector('#close-button');
    }

    _setupEventListeners = () => {
        this._wsButton.addEventListener('click', () => {
            this._openPopover();
        });
        this._backButton.addEventListener('click', () => {
            this._navigateBack();
        });
        this._closeButton.addEventListener('click', () => {
            this._closePopover();
        });

        // `popover="manual"` has no built-in light dismissal, so close the
        // session popover ourselves when the user presses Escape or clicks
        // anywhere outside it. The toast notification host is intentionally
        // NOT affected by these handlers.
        document.addEventListener('keydown', this._handleDocumentKeydown);
        // Capture phase: runs before the trigger button's own click handler,
        // so opening (button shows the popover) and toggling closed both work.
        document.addEventListener('click', this._handleDocumentClick, true);
    }

    _handleBackRequest = (event) => {
        if (!this._sessionPopover?.matches(':popover-open')) return;
        event.preventDefault();
        if (this._pageHistory.length > 0) {
            this._navigateBack();
        } else {
            this._closePopover();
        }
    }

    _handleDocumentKeydown = (event) => {
        if (event.key !== 'Escape') return;
        if (this._sessionPopover?.matches(':popover-open')) {
            this._closePopover();
        }
    }

    _handleDocumentClick = (event) => {
        if (!this._sessionPopover?.matches(':popover-open')) return;
        const path = event.composedPath();
        if (path.includes(this._sessionPopover)) return;
        this._closePopover();
    }

    _openPopover = () => {
        const btnRect = this._wsButton.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        const popoverLeft = window.innerWidth * 0.025;
        const popoverTop = window.innerHeight * 0.025;
        this._sessionPopover.style.setProperty('--popover-origin-x', `${btnCenterX - popoverLeft}px`);
        this._sessionPopover.style.setProperty('--popover-origin-y', `${btnCenterY - popoverTop}px`);
        if (this._currentPageName === null) {
            this._switchPage(this._startPageForState(), { pushHistory: false });
        }
        this._sessionPopover.showPopover();
    }

    _startPageForState = () => {
        if (this._connectionState === 'session') return 'sessionInformation';
        if (this._connectionState === 'failed') return 'failedConnectionPage';
        return 'initialPage';
    }

    _closePopover = () => {
        this._sessionPopover.classList.add('closing');
        const handler = (event) => {
            if (event.propertyName === 'transform') {
                this._sessionPopover.removeEventListener('transitionend', handler);
                this._sessionPopover.classList.remove('closing');
                this._sessionPopover.hidePopover();
            }
        };
        this._sessionPopover.addEventListener('transitionend', handler);
    }

    // -------------------------------------------------------------------------
    // Connection State
    // -------------------------------------------------------------------------

    _setConnectionState = (state) => {
        if (["checking", "connected", "failed", "session"].includes(state)) {
            this._connectionState = state;
            this._updateStatusIcon();
        }
    }

    _updateStatusIcon = () => {
        if (!this._statusIcon) return;
        const color = CONNECTION_STATE_COLORS[this._connectionState] ?? 'grey';
        this._statusIcon.setAttribute('color', color);
    }

    // -------------------------------------------------------------------------
    // WebSocket
    // -------------------------------------------------------------------------

    /**
     * Probes whether the WebSocket server is reachable via a dedicated
     * `?ping=true` handshake. Does not create or join a session.
     * @returns {Promise<boolean>}
     */
    _checkServerAvailability = () => {
        return new Promise((resolve) => {
            if (!this.wsUrl) { resolve(false); return; }
            const ws = new WebSocket(`${this.wsUrl}?ping=true`);
            let settled = false;
            const finish = (result) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
                if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) ws.close();
                resolve(result);
            };
            const timeoutId = setTimeout(() => finish(false), 5000);
            ws.onmessage = (event) => {
                try {
                    if (JSON.parse(event.data)?.response === 'pong') finish(true);
                } catch (_) { /* ignore */ }
            };
            ws.onerror = () => finish(false);
            ws.onclose = () => finish(false);
        });
    }

    /**
     * Central entry point for the pre-session availability gate: runs the
     * ping check, updates connection state/icon color, keeps the currently
     * displayed page in sync, and (only for an explicit retry) shows the
     * result as a toast.
     * @param {{isRetry?: boolean}} [options]
     * @returns {Promise<boolean>}
     */
    _runAvailabilityCheck = async ({ isRetry = false } = {}) => {
        const available = await this._checkServerAvailability();
        this._setConnectionState(available ? 'connected' : 'failed');
        this._currentPageName = null;
        if (this._sessionPopover?.matches(':popover-open')) {
            this._switchPage(this._startPageForState(), { pushHistory: false });
        }
        if (isRetry) {
            this._showNotification(
                available ? 'Verbindung zum Server erfolgreich.' : 'Verbindung konnte nicht hergestellt werden.',
                available ? 'green' : 'red'
            );
        }
        return available;
    }

    _buildInitialConnection = (sessionId = null) => {
        if (!this.wsUrl) {
            console.warn('EdiromWebSocketConnector: no ws-url attribute set, skipping connection.');
            return;
        }

        if (this._webSocket) {
            this._webSocket.onclose = null;
            this._webSocket.close();
        }

        this._clientId = null;
        this._sessionId = null;
        this._sessionData = null;

        const clientName = encodeURIComponent(this.deviceName);
        const deviceType = encodeURIComponent(this.getDeviceType());
        const base = `${this.wsUrl}?clientName=${clientName}&deviceType=${deviceType}`;
        const url = sessionId ? `${base}&sessionId=${sessionId}` : base;
        this._webSocket = new WebSocket(url);

        this._webSocket.onopen = () => {
            console.log('EdiromWebSocketConnector: connection opened.');
            this._setConnectionState('connected');
        };

        this._webSocket.onclose = () => {
            console.log('EdiromWebSocketConnector: connection closed.');
            const wasInSession = this._connectionState === 'session';
            const reason = this._disconnectReason;
            this._disconnectReason = null;
            if (wasInSession) {
                if (reason === 'dissolved') this._showNotification('Die Sitzung wurde aufgelöst.', 'yellow');
                else if (reason === 'removed') this._showNotification('Dein Gerät wurde aus der Sitzung entfernt.', 'yellow');
                else if (reason === 'left') this._showNotification('Du hast die Sitzung verlassen.', 'yellow');
                else if (reason === null) this._showNotification('Verbindung unterbrochen.', 'red');
            }
            if (this._connectionState !== 'failed') {
                // A closed session socket doesn't by itself tell us whether the
                // server is still reachable (we may have just left/dissolved a
                // session, or the server rejected a join) — so re-derive the
                // state from a fresh availability check instead of guessing.
                // 'checking' is only a transient placeholder while that
                // check is in flight; it never lingers as a final state.
                this._setConnectionState('checking');
                this._checkServerAvailability().then((available) => {
                    if (this._connectionState !== 'session') {
                        this._setConnectionState(available ? 'connected' : 'failed');
                    }
                });
            }
            const joinedFromJoinPage = !!this._joinError;
            this._joinError = null;
            this._sessionId = null;
            this._clientId = null;
            this._sessionData = null;
            this._pageHistory = [];
            this._currentPageName = null;
            if (this._sessionPopover?.matches(':popover-open')) {
                if (joinedFromJoinPage) {
                    this._pageHistory = ['initialPage'];
                    this._switchPage('joinPage', { pushHistory: false });
                } else {
                    this._switchPage('initialPage', { pushHistory: false });
                }
            }
        };

        this._webSocket.onmessage = (event) => {
            let dataJson;
            try {
                dataJson = JSON.parse(event.data);
            } catch (e) {
                console.error('EdiromWebSocketConnector: could not parse message.', e);
                return;
            }
            this._handleMessage(dataJson);
        };

        this._webSocket.onerror = (error) => {
            console.error('EdiromWebSocketConnector: connection error.', error);
            this._setConnectionState('failed');
            this._showNotification('Verbindung konnte nicht hergestellt werden.', 'red');
        };
    }

    _createNewSession = () => {
        this._isCreatingSession = true;
        this._buildInitialConnection();
    }

    _joinSession = (sessionId) => {
        this._isCreatingSession = false;
        this._buildInitialConnection(sessionId.trim().toUpperCase());
    }

    _sendRemoveClient = (clientId) => {
        if (this._webSocket?.readyState === WebSocket.OPEN) {
            this._webSocket.send(JSON.stringify({ message: 'removeClient', clientId }));
        }
    }

    _sendUpdateClientName = (name) => {
        if (this._webSocket?.readyState === WebSocket.OPEN) {
            this._webSocket.send(JSON.stringify({ message: 'updateClientName', clientName: name }));
        }
    }

    _sendDissolveSession = () => {
        if (this._webSocket?.readyState === WebSocket.OPEN) {
            this._webSocket.send(JSON.stringify({ message: 'dissolveSession' }));
        }
    }

    /**
     * Sends a generic message to the WebSocket server.
     * @param {string} type - Message type (e.g. "syncState")
     * @param {Object|null} [payload=null] - Optional payload data
     * @param {string[]|null} [clientTargets=null] - Optional list of client IDs to target;
     *   omit or pass null to send to all other clients in the session
     */
    sendMessage = (type, payload = null, clientTargets = null) => {
        if (this._webSocket?.readyState !== WebSocket.OPEN) return;
        const message = { type };
        if (payload !== null && payload !== undefined) message.payload = payload;
        if (Array.isArray(clientTargets)) message.client_targets = clientTargets;
        this._webSocket.send(JSON.stringify(message));
        console.log('EdiromWebSocketConnector: message sent', message);
    }


    _handleMessage = (dataJson) => {
        console.log('EdiromWebSocketConnector: received message', dataJson);
        if (dataJson.response === 'sessionJoined') {
            this._clientId = dataJson.clientId;
            this._sessionId = dataJson.sessionId;
            this._sessionData = dataJson.sessionData;
            this._setConnectionState('session');
            this._pageHistory = [];
            this._switchPage('sessionInformation', { pushHistory: false });
            const joinMsg = this._isCreatingSession ? 'Sitzung wurde erstellt.' : 'Erfolgreich beigetreten.';
            this._showNotification(joinMsg, 'green');
            if (this._autoJoined) {
                this._autoJoined = false;
                this._openPopover();
            }
            if (dataJson.lastRelayed?.type) {
                this.dispatchEvent(new CustomEvent('received-message', {
                    detail: dataJson.lastRelayed,
                    bubbles: true,
                    composed: true
                }));
            }
            this.dispatchEvent(new CustomEvent('session-joined', {
                detail: {
                    sessionId: dataJson.sessionId,
                    hasLastRelayed: !!dataJson.lastRelayed,
                    isCreatingSession: this._isCreatingSession
                },
                bubbles: true,
                composed: true
            }));
        } else if (dataJson.response === 'error' && dataJson.reason === 'sessionNotFound') {
            this._joinError = true;
            this._showNotification('Diese Sitzungs-ID existiert nicht.', 'red');
        } else if (dataJson.response === 'sessionDissolved') {
            if (!this._disconnectReason) this._disconnectReason = 'dissolved';
        } else if (dataJson.response === 'clientRemoved') {
            if (!this._disconnectReason) this._disconnectReason = 'removed';
        } else if (dataJson.sessionId && this._sessionId === null) {
            this._setSessionId(dataJson.sessionId);
        } else if (dataJson.clientId && this._clientId === null) {
            this._clientId = dataJson.clientId;
        } else if (dataJson.message || dataJson.type) {
            this.dispatchEvent(new CustomEvent('received-message', {
                detail: dataJson,
                bubbles: true,
                composed: true
            }));
        } else if (dataJson.response === 'clientConnected') {
            console.log('EdiromWebSocketConnector: client connected.');
            this._sessionData = dataJson.sessionData;
            this._updateMembersList();
            const connectedName = dataJson.clientData?.metadata?.name ?? 'Unbekanntes Gerät';
            this._showNotification(`"${connectedName}" ist der Sitzung beigetreten.`, 'green');
        } else if (dataJson.response === 'clientDisconnected') {
            console.log('EdiromWebSocketConnector: client disconnected.');
            this._sessionData = dataJson.sessionData;
            this._updateMembersList();
            const disconnectedName = dataJson.clientData?.metadata?.name ?? 'Unbekanntes Gerät';
            this._showNotification(`"${disconnectedName}" hat die Sitzung verlassen.`, 'yellow');
        } else if (dataJson.response === 'sessionDataUpdated') {
            this._sessionData = dataJson.sessionData;
            this._updateMembersList();
        } else if (dataJson.sessionData) {
            this._sessionData = dataJson.sessionData;
            this._updateMembersList();
        }
    }

    // -------------------------------------------------------------------------
    // Session Info
    // -------------------------------------------------------------------------

    _setSessionId = (sessionId) => {
        this._sessionId = sessionId;
        if (this._currentPageName === 'invitePage') {
            const sessionIdEl = this._sessionContent?.querySelector('#session-id');
            if (sessionIdEl) sessionIdEl.textContent = sessionId;
            const urlTextEl = this._sessionContent?.querySelector('.url-text');
            if (urlTextEl) urlTextEl.textContent = this._getFullInviteUrl() ?? '—';
            const qrPlaceholder = this._sessionContent?.querySelector('#qr-code-placeholder');
            if (qrPlaceholder) this._renderQrCode(qrPlaceholder);
        }
    }

    _getFullInviteUrl = () => {
        if (this._inviteUrl && this._sessionId) return this._inviteUrl + this._sessionId;
        if (this._sessionId) return this._sessionId;
        return null;
    }

    _updateMembersList = () => {
        if (!this._sessionData) return;
        const membersList = this._sessionContent?.querySelector('#session-members-list');
        if (membersList) {
            this._renderMembersIntoList(membersList);
        }
    }

    // -------------------------------------------------------------------------
    // Notification Toasts
    // -------------------------------------------------------------------------

    _toastIconMap = { green: 'check_circle', yellow: 'warning', red: 'error', grey: 'info' };

    _showNotification = (message, type = 'grey') => {
        const toast = this._createToast(message, type);
        const host = this._notificationHost;
        if (!host) return;

        // FLIP: First — record current positions of existing toasts
        const existingToasts = [...host.children];
        const oldRects = existingToasts.map(el => el.getBoundingClientRect());

        // Prepend new toast (newest at top)
        host.prepend(toast);

        // Show the notification host if not already open
        if (!host.matches(':popover-open')) {
            host.showPopover();
        }

        // FLIP: Last — get new positions after prepend
        const newRects = existingToasts.map(el => el.getBoundingClientRect());

        // FLIP: Invert — translate existing toasts so they appear unmoved
        existingToasts.forEach((el, i) => {
            const deltaY = oldRects[i].top - newRects[i].top;
            if (deltaY !== 0) {
                el.style.transition = 'none';
                el.style.transform = `translateY(${deltaY}px)`;
            }
        });

        // Force reflow
        host.offsetHeight;

        // FLIP: Play — animate existing toasts down to their new positions
        existingToasts.forEach(el => {
            el.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
            el.style.transform = '';
            el.addEventListener('transitionend', () => {
                el.style.transition = '';
            }, { once: true });
        });

        // Auto-dismiss after 3 s
        toast._dismissTimer = setTimeout(() => this._dismissToast(toast), 3000);
    }

    _createToast = (message, type) => {
        const toast = document.createElement('div');
        toast.className = `notification-toast toast-${type}`;

        const icon = document.createElement('edirom-icon');
        icon.setAttribute('name', this._toastIconMap[type] ?? 'info');
        icon.setAttribute('size', 'fill');
        toast.appendChild(icon);

        const msg = document.createElement('span');
        msg.className = 'toast-message';
        msg.textContent = message;
        toast.appendChild(msg);

        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress-bar';
        const progressInner = document.createElement('div');
        progressInner.className = 'toast-progress-inner';
        progressBar.appendChild(progressInner);
        toast.appendChild(progressBar);

        return toast;
    }

    _dismissToast = (toast) => {
        clearTimeout(toast._dismissTimer);
        toast.classList.add('dismissing');
        toast.addEventListener('animationend', () => {
            this._removeToast(toast);
        }, { once: true });
    }

    _removeToast = (toast) => {
        const host = this._notificationHost;
        if (!host) return;

        // FLIP: First — record positions of remaining toasts before removal
        const remaining = [...host.children].filter(el => el !== toast);
        const oldRects = remaining.map(el => el.getBoundingClientRect());

        toast.remove();

        if (host.children.length === 0) {
            host.hidePopover();
            return;
        }

        // FLIP: Last — positions after removal (toasts shift up)
        const newRects = remaining.map(el => el.getBoundingClientRect());

        // FLIP: Invert
        remaining.forEach((el, i) => {
            const deltaY = oldRects[i].top - newRects[i].top;
            if (deltaY !== 0) {
                el.style.transition = 'none';
                el.style.transform = `translateY(${deltaY}px)`;
            }
        });

        // Force reflow
        host.offsetHeight;

        // FLIP: Play
        remaining.forEach(el => {
            el.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
            el.style.transform = '';
            el.addEventListener('transitionend', () => {
                el.style.transition = '';
            }, { once: true });
        });
    }

    _showJoinError = (msg) => {
        this._joinError = msg;
        const errorEl = this._sessionContent?.querySelector('.join-error');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.hidden = false;
        }
    }

    // -------------------------------------------------------------------------
    // Page System
    // -------------------------------------------------------------------------

    _switchPage = (pageName, { pushHistory = true } = {}) => {
        if (pushHistory && this._currentPageName !== null) {
            this._pageHistory.push(this._currentPageName);
        }
        this._currentPageName = pageName;
        if (!this._sessionContent) return;
        this._sessionContent.innerHTML = '';
        let pageEl;
        switch (pageName) {
            case 'initialPage': pageEl = this._buildInitialPage(); break;
            case 'sessionInformation': pageEl = this._buildSessionInformationPage(); break;
            case 'invitePage': pageEl = this._buildInvitePage(); break;
            case 'joinPage': pageEl = this._buildJoinPage(); break;
            case 'failedConnectionPage': pageEl = this._buildFailedConnectionPage(); break;
            default:
                console.warn(`EdiromWebSocketConnector: unknown page "${pageName}"`);
                return;
        }
        this._sessionContent.appendChild(pageEl);
        this._updateBackButton();
    }

    _navigateBack = () => {
        if (this._pageHistory.length === 0) return;
        const prevPage = this._pageHistory.pop();
        this._switchPage(prevPage, { pushHistory: false });
    }

    _updateBackButton = () => {
        if (!this._backButton) return;
        if (this._pageHistory.length > 0) {
            this._backButton.classList.remove('hidden');
        } else {
            this._backButton.classList.add('hidden');
        }
    }

    // -------------------------------------------------------------------------
    // Page Builders
    // -------------------------------------------------------------------------

    _buildFailedConnectionPage = () => {
        const page = document.createElement('div');
        page.className = 'page-failed-connection';

        const card = document.createElement('div');
        card.className = 'connection-error-card';
        const cardIcon = document.createElement('edirom-icon');
        cardIcon.setAttribute('name', 'wifi_off');
        cardIcon.setAttribute('size', 'fill');
        const cardText = document.createElement('p');
        cardText.textContent = 'Die Verbindung zum Server konnte nicht hergestellt werden.';
        card.appendChild(cardIcon);
        card.appendChild(cardText);
        page.appendChild(card);

        const retryButton = document.createElement('button');
        retryButton.className = 'add-device-button';
        const retryIcon = document.createElement('edirom-icon');
        retryIcon.setAttribute('name', 'refresh');
        retryIcon.setAttribute('size', 'fill');
        const retryLabel = document.createElement('span');
        retryLabel.textContent = 'Erneut versuchen';
        retryButton.appendChild(retryIcon);
        retryButton.appendChild(retryLabel);
        retryButton.addEventListener('click', () => {
            this._runAvailabilityCheck({ isRetry: true });
        });
        page.appendChild(retryButton);

        return page;
    }

    _buildInitialPage = () => {
        const page = document.createElement('div');
        page.className = 'page-initial';

        // Device name row
        const deviceNameRow = document.createElement('div');
        deviceNameRow.className = 'device-name-row';

        const label = document.createElement('span');
        label.className = 'device-name-label';
        label.textContent = 'Gerätename:';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'device-name-text';
        nameSpan.textContent = this.deviceName || '';

        const editButton = document.createElement('button');
        editButton.className = 'icon-button';
        editButton.setAttribute('aria-label', 'Gerätename bearbeiten');
        const editIcon = document.createElement('edirom-icon');
        editIcon.setAttribute('name', 'edit');
        editIcon.setAttribute('size', 'fill');
        editButton.appendChild(editIcon);

        const startEditing = () => {
            if (deviceNameRow.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'device-name-input';
            input.value = this.deviceName || '';
            input.minLength = 1;
            input.maxLength = 64;

            const save = () => {
                console.log('Saving device name:', input.value);
                const newName = input.value.trim()
                this.deviceName = newName;
                this.onDeviceNameChange();
                nameSpan.textContent = newName;
                if (input.parentNode === deviceNameRow) {
                    deviceNameRow.replaceChild(nameSpan, input);
                }
                editButton.style.visibility = '';
            };

            input.addEventListener('blur', save);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
                if (e.key === 'Escape') {
                    e.stopPropagation(); // cancel editing only, keep popover open
                    if (input.parentNode === deviceNameRow) {
                        deviceNameRow.replaceChild(nameSpan, input);
                    }
                    editButton.style.visibility = '';
                }
            });

            deviceNameRow.replaceChild(input, nameSpan);
            editButton.style.visibility = 'hidden';
            input.focus();
            input.select();
        };

        nameSpan.addEventListener('click', startEditing);
        editButton.addEventListener('click', startEditing);

        deviceNameRow.appendChild(label);
        deviceNameRow.appendChild(nameSpan);
        deviceNameRow.appendChild(editButton);
        page.appendChild(deviceNameRow);

        // Action buttons row
        const actionRow = document.createElement('div');
        actionRow.className = 'action-buttons-row';

        const newSessionBtn = document.createElement('button');
        newSessionBtn.className = 'action-button';
        const newSessionIcon = document.createElement('edirom-icon');
        newSessionIcon.setAttribute('name', 'add_box');
        newSessionIcon.setAttribute('size', 'fill');
        const newSessionLabel = document.createElement('span');
        newSessionLabel.textContent = 'Sitzung erstellen';
        newSessionBtn.appendChild(newSessionIcon);
        newSessionBtn.appendChild(newSessionLabel);
        newSessionBtn.addEventListener('click', () => {
            this._createNewSession();
        });

        const joinSessionBtn = document.createElement('button');
        joinSessionBtn.className = 'action-button';
        const joinSessionIcon = document.createElement('edirom-icon');
        joinSessionIcon.setAttribute('name', 'login');
        joinSessionIcon.setAttribute('size', 'fill');
        const joinSessionLabel = document.createElement('span');
        joinSessionLabel.textContent = 'Sitzung beitreten';
        joinSessionBtn.appendChild(joinSessionIcon);
        joinSessionBtn.appendChild(joinSessionLabel);
        joinSessionBtn.addEventListener('click', () => this._switchPage('joinPage'));

        actionRow.appendChild(newSessionBtn);
        actionRow.appendChild(joinSessionBtn);
        page.appendChild(actionRow);

        // Intro text
        const introText = document.createElement('p');
        introText.className = 'intro-text';
        introText.textContent = 'Mit der vernetzten Arbeitsumgebung können Sie die digitale Edition auf mehreren Geräten gleichzeitig nutzen.';
        page.appendChild(introText);

        return page;
    }

    _buildSessionInformationPage = () => {
        const page = document.createElement('div');
        page.className = 'page-session-information';

        const h1 = document.createElement('h1');
        h1.textContent = 'Sitzungsinformationen';
        page.appendChild(h1);

        const h2 = document.createElement('h2');
        h2.textContent = 'Geräte';
        page.appendChild(h2);

        const membersList = document.createElement('div');
        membersList.id = 'session-members-list';
        membersList.className = 'members-table';
        this._renderMembersIntoList(membersList);
        page.appendChild(membersList);

        const addDeviceBtn = document.createElement('button');
        addDeviceBtn.className = 'add-device-button';
        const addDeviceIcon = document.createElement('edirom-icon');
        addDeviceIcon.setAttribute('name', 'add_to_queue');
        addDeviceIcon.setAttribute('size', 'fill');
        const addDeviceLabel = document.createElement('span');
        addDeviceLabel.textContent = 'Neues Gerät hinzufügen';
        addDeviceBtn.appendChild(addDeviceIcon);
        addDeviceBtn.appendChild(addDeviceLabel);
        addDeviceBtn.addEventListener('click', () => this._switchPage('invitePage'));
        page.appendChild(addDeviceBtn);

        const leaveSessionBtn = document.createElement('button');
        leaveSessionBtn.className = 'add-device-button';
        const leaveIcon = document.createElement('edirom-icon');
        leaveIcon.setAttribute('name', 'logout');
        leaveIcon.setAttribute('size', 'fill');
        const leaveLabel = document.createElement('span');
        leaveLabel.textContent = 'Sitzung verlassen';
        leaveSessionBtn.appendChild(leaveIcon);
        leaveSessionBtn.appendChild(leaveLabel);
        leaveSessionBtn.addEventListener('click', () => {
            const shouldLeave = window.confirm('Möchten Sie diese Sitzung wirklich verlassen?');
            if (shouldLeave) {
                this._disconnectReason = 'left';
                this._sendRemoveClient(this._clientId);
            }
        });

        const dissolveSessionBtn = document.createElement('button');
        dissolveSessionBtn.className = 'add-device-button dissolve-session-button';
        const dissolveIcon = document.createElement('edirom-icon');
        dissolveIcon.setAttribute('name', 'destruction');
        dissolveIcon.setAttribute('size', 'fill');
        const dissolveLabel = document.createElement('span');
        dissolveLabel.textContent = 'Sitzung auflösen';
        dissolveSessionBtn.appendChild(dissolveIcon);
        dissolveSessionBtn.appendChild(dissolveLabel);
        dissolveSessionBtn.addEventListener('click', () => {
            const shouldDissolve = window.confirm('Möchten Sie diese Sitzung wirklich auflösen?');
            if (shouldDissolve) {
                this._sendDissolveSession();
            }
        });

        const footer = document.createElement('div');
        footer.className = 'session-info-footer';
        footer.appendChild(leaveSessionBtn);
        footer.appendChild(dissolveSessionBtn);
        page.appendChild(footer);

        return page;
    }

    _buildInvitePage = () => {
        const page = document.createElement('div');
        page.className = 'page-invite';

        // Session ID
        const sessionIdContainer = document.createElement('div');
        sessionIdContainer.className = 'invite-type-container';
        let inviteTypeLabel = document.createElement('div');
        inviteTypeLabel.className = 'invite-type-label';
        inviteTypeLabel.textContent = 'Sitzungs-ID';
        sessionIdContainer.appendChild(inviteTypeLabel);
        const sessionIdEl = document.createElement('div');
        sessionIdEl.id = 'session-id';
        sessionIdEl.textContent = this._sessionId ?? '—';
        sessionIdContainer.appendChild(sessionIdEl);
        page.appendChild(sessionIdContainer);

        // QR code
        const qrContainer = document.createElement('div');
        qrContainer.className = 'invite-type-container';
        inviteTypeLabel = document.createElement('div');
        inviteTypeLabel.className = 'invite-type-label';
        inviteTypeLabel.textContent = 'QR-Code';
        qrContainer.appendChild(inviteTypeLabel);
        const qrPlaceholder = document.createElement('div');
        qrPlaceholder.id = 'qr-code-placeholder';
        this._renderQrCode(qrPlaceholder)
        qrContainer.appendChild(qrPlaceholder);
        page.appendChild(qrContainer);

        // Invite URL row
        const urlContainer = document.createElement('div');
        urlContainer.className = 'invite-type-container';
        inviteTypeLabel = document.createElement('div');
        inviteTypeLabel.className = 'invite-type-label';
        inviteTypeLabel.textContent = 'URL';
        urlContainer.appendChild(inviteTypeLabel);
        const urlRow = document.createElement('div');
        urlRow.className = 'url-row';

        const urlText = document.createElement('p');
        urlText.className = 'url-text';
        urlText.textContent = this._getFullInviteUrl() ?? '—';

        // Copy button in a relative wrapper for tooltip positioning
        const copyWrapper = document.createElement('div');
        copyWrapper.className = 'copy-btn-wrapper';

        const copyTooltip = document.createElement('span');
        copyTooltip.className = 'copy-tooltip';
        copyTooltip.textContent = 'Kopiert!';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'icon-button';
        copyBtn.setAttribute('aria-label', 'URL kopieren');
        const copyIcon = document.createElement('edirom-icon');
        copyIcon.setAttribute('name', 'content_copy');
        copyIcon.setAttribute('size', 'fill');
        copyBtn.appendChild(copyIcon);

        let tooltipTimer = null;
        copyBtn.addEventListener('click', () => {
            const currentUrl = urlText.textContent;
            navigator.clipboard?.writeText(currentUrl).then(() => {
                clearTimeout(tooltipTimer);
                copyTooltip.classList.add('visible');
                tooltipTimer = setTimeout(() => copyTooltip.classList.remove('visible'), 2000);
            }).catch(err => {
                console.warn('EdiromWebSocketConnector: clipboard write failed.', err);
            });
        });

        copyWrapper.appendChild(copyTooltip);
        copyWrapper.appendChild(copyBtn);

        // Share button — hidden on devices/browsers that don't support the Web Share API
        const shareBtn = document.createElement('button');
        shareBtn.className = 'icon-button';
        shareBtn.setAttribute('aria-label', 'Teilen');
        const shareIcon = document.createElement('edirom-icon');
        shareIcon.setAttribute('name', 'share');
        shareIcon.setAttribute('size', 'fill');
        shareBtn.appendChild(shareIcon);
        shareBtn.addEventListener('click', () => {
            const currentUrl = urlText.textContent;
            navigator.share({ url: currentUrl }).catch(err => {
                if (err.name !== 'AbortError') {
                    console.warn('EdiromWebSocketConnector: share failed.', err);
                }
            });
        });
        if (typeof navigator.share !== 'function') {
            shareBtn.style.display = 'none';
        }

        urlRow.appendChild(urlText);
        urlRow.appendChild(copyWrapper);
        urlRow.appendChild(shareBtn);
        urlContainer.appendChild(urlRow);
        page.appendChild(urlContainer);

        return page;
    }

    _buildJoinPage = () => {
        const page = document.createElement('div');
        page.className = 'page-join';

        // Session ID input row
        const inputRow = document.createElement('div');
        inputRow.className = 'join-input-row';

        const inputLabel = document.createElement('p');
        inputLabel.className = 'join-input-label';
        inputLabel.textContent = 'Sitzungs-ID eingeben:';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'join-input';
        input.minLength = 6;
        input.maxLength = 6;
        input.placeholder = '······';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'characters');
        input.setAttribute('spellcheck', 'false');
        input.addEventListener('input', () => {
            if (input.value.trim().length === 6) {
                this._joinSession(input.value);
            }
        });

        inputRow.appendChild(inputLabel);
        inputRow.appendChild(input);
        page.appendChild(inputRow);

        // Separator row
        const separatorRow = document.createElement('div');
        separatorRow.className = 'separator-row';
        const lineLeft = document.createElement('div');
        lineLeft.className = 'separator-line';
        const separatorText = document.createElement('span');
        separatorText.className = 'separator-text';
        separatorText.textContent = 'ODER';
        const lineRight = document.createElement('div');
        lineRight.className = 'separator-line';
        separatorRow.appendChild(lineLeft);
        separatorRow.appendChild(separatorText);
        separatorRow.appendChild(lineRight);
        page.appendChild(separatorRow);

        // QR scanner placeholder
        const scannerPlaceholder = document.createElement('div');
        scannerPlaceholder.className = 'qr-scanner-placeholder';
        scannerPlaceholder.textContent = 'QR-Code scannen';
        page.appendChild(scannerPlaceholder);

        return page;
    }

    // -------------------------------------------------------------------------
    // Page Helpers
    // -------------------------------------------------------------------------

    _renderMembersIntoList = (container) => {
        container.innerHTML = '';
        if (!this._sessionData) return;
        const members = [...(this._sessionData.sessionMembers ?? [])];
        members.sort((a, b) => (a.id === this._clientId ? -1 : b.id === this._clientId ? 1 : 0));

        for (const member of members) {
            const isOwn = member.id === this._clientId;
            const row = document.createElement('div');
            row.className = 'member-row';

            // Col 1: device icon
            const iconCol = document.createElement('div');
            iconCol.className = 'member-icon';
            const deviceIcon = document.createElement('edirom-icon');
            const dt = member.metadata?.deviceType ?? '';
            const iconName = dt === 'tablet' ? 'tablet_mac' : dt === 'mobile' ? 'smartphone' : dt === 'desktop' ? 'laptop_mac' : dt === 'tv' ? 'tv_gen' : 'mobile_question';
            deviceIcon.setAttribute('name', iconName);
            deviceIcon.setAttribute('size', 'fill');
            iconCol.appendChild(deviceIcon);
            row.appendChild(iconCol);

            // Col 2: client name
            const nameCol = document.createElement('div');
            nameCol.className = 'member-name';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = member.metadata?.name ?? '—';
            nameCol.appendChild(nameSpan);
            row.appendChild(nameCol);

            // Col 3: action buttons
            const actionsCol = document.createElement('div');
            actionsCol.className = 'member-actions';

            if (isOwn) {
                const editBtn = document.createElement('button');
                editBtn.className = 'icon-button';
                editBtn.setAttribute('aria-label', 'Namen bearbeiten');
                const editIcon = document.createElement('edirom-icon');
                editIcon.setAttribute('name', 'edit');
                editIcon.setAttribute('size', 'fill');
                editBtn.appendChild(editIcon);
                editBtn.addEventListener('click', () => {
                    if (nameCol.querySelector('input')) return;
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'member-name-input';
                    input.value = member.metadata?.name ?? '';
                    input.maxLength = 64;
                    const save = () => {
                        const newName = input.value.trim() || member.metadata?.name || '—';
                        this.deviceName = newName;
                        this.onDeviceNameChange();
                        this._sendUpdateClientName(newName);
                        if (member.metadata) member.metadata.name = newName;
                        nameSpan.textContent = newName;
                        if (input.parentNode === nameCol) nameCol.replaceChild(nameSpan, input);
                    };
                    input.addEventListener('blur', save);
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
                        if (e.key === 'Escape') {
                            e.stopPropagation(); // cancel editing only, keep popover open
                            if (input.parentNode === nameCol) nameCol.replaceChild(nameSpan, input);
                        }
                    });
                    nameCol.replaceChild(input, nameSpan);
                    input.focus();
                    input.select();
                });
                actionsCol.appendChild(editBtn);
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'icon-button';
            removeBtn.setAttribute('aria-label', 'Gerät entfernen');
            const removeIcon = document.createElement('edirom-icon');
            removeIcon.setAttribute('name', 'close');
            removeIcon.setAttribute('size', 'fill');
            removeBtn.appendChild(removeIcon);
            removeBtn.addEventListener('click', () => {
                const deviceName = member.metadata?.name || 'Unbekanntes Gerät';
                const shouldRemove = window.confirm(`Möchten Sie das Gerät "${deviceName}" wirklich entfernen?`);
                if (shouldRemove) {
                    this._sendRemoveClient(member.id);
                }
            });
            actionsCol.appendChild(removeBtn);

            row.appendChild(actionsCol);
            container.appendChild(row);
        }
    }

    _renderQrCode = (containerEl) => {
        if (!this._sessionId) return;
        const content = this._getFullInviteUrl() ?? this._sessionId.toString();
        if (typeof qrcode === 'function') {
            const qr = qrcode(0, 'M');
            qr.addData(content);
            qr.make();
            containerEl.innerHTML = qr.createImgTag(6);
        } else {
            containerEl.textContent = content;
        }
    }

    getDeviceType = () => {
        // Fix for iPadOS 13+ which lies about being a Mac
        const isIPad = /Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
        if (isIPad) return 'tablet';

        if (this.browser) return this.browser.getPlatformType();
        return 'desktop'; // fallback when bowser hasn't loaded yet
    }

    getOSName = () => {
        // Fix for iPadOS 13+ which lies about being a Mac
        const isIPad = /Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
        if (isIPad) return 'iPadOS';
        if (this.browser) return this.browser.getOSName();
        return ''; // fallback when bowser hasn't loaded yet
    }

    getVendor = () => {
        if (this.browser) return this.browser.getPlatform().vendor || '';
        return ''; // fallback when bowser hasn't loaded yet
    }

    generateDeviceName = () => {
        const deviceType = this.getDeviceType();
        const osName = this.getOSName();
        const vendor = this.getVendor();

        let deviceTypeLabel = '';
        if (deviceType === 'mobile') {
            deviceTypeLabel = 'Smartphone';
        } else if (deviceType === 'tablet') {
            deviceTypeLabel = 'Tablet';
        } else {
            deviceTypeLabel = 'Computer';
        }

        let deviceName = `${vendor} ${osName} ${deviceTypeLabel}`.trim();

        if (!deviceName) {
            deviceName = 'Unknown Device';
        }

        return deviceName;
    }

    initDeviceName = () => {
        console.log('EdiromWebSocketConnector: initializing device name...');
        let deviceName = "";
        deviceName = localStorage.getItem('workspace-device-name');
        if (!deviceName) {
            deviceName = this.generateDeviceName();
        }
        this.deviceName = deviceName;
        console.log('EdiromWebSocketConnector: initialized device name as', this.deviceName);
        this.onDeviceNameChange();
    }

    onDeviceNameChange = () => {
        // if (this._webSocket && this._webSocket.readyState === WebSocket.OPEN) {
        //     this._webSocket.send(JSON.stringify({
        //         message: 'updateDeviceName',
        //         deviceName: this.deviceName
        //     }));
        // }

        localStorage.setItem('workspace-device-name', this.deviceName);
    }
}

if (!customElements.get('edirom-web-socket-connector')) {
    customElements.define('edirom-web-socket-connector', EdiromWebSocketConnector);
}

