// Single source of truth for the WebSocket wire protocol shared between
// edirom-ws-server and this component. Zero dependencies (no DOM, no
// imports) so it can be loaded as-is by both a browser ES module and a
// Node.js script (via dynamic import()).
//
// Layout of this file, top to bottom: connecting, then messages the server
// sends, then messages the client sends, then error reasons, then the two
// generic build/matches helpers that work with any message name from either
// table. To add a message: add one entry to the matching table below — no
// other part of this file needs to change.

// -----------------------------------------------------------------------
// Connecting — query params on the initial WebSocket upgrade URL, before
// any JSON message is exchanged.
// -----------------------------------------------------------------------

export const CONNECT_PARAMS = {
    ping: 'ping',
    sessionId: 'sessionId',
    clientName: 'clientName',
    deviceType: 'deviceType'
};

export function buildConnectUrl(wsUrl, { clientName, deviceType, sessionId } = {}) {
    const params = new URLSearchParams({
        [CONNECT_PARAMS.clientName]: clientName,
        [CONNECT_PARAMS.deviceType]: deviceType
    });
    if (sessionId) params.set(CONNECT_PARAMS.sessionId, sessionId);
    return `${wsUrl}?${params.toString()}`;
}

export function buildPingUrl(wsUrl) {
    return `${wsUrl}?${CONNECT_PARAMS.ping}=true`;
}

// -----------------------------------------------------------------------
// Messages the server sends to the client.
// Registry key == the value carried in `channel` on the wire.
// -----------------------------------------------------------------------

export const MESSAGES_TO_CLIENT = {
    // Sent right after this client creates or joins a session.
    sessionJoined: {
        channel: 'response',
        build: ({ sessionId, clientId, sessionData }) => ({ response: 'sessionJoined', sessionId, clientId, sessionData })
    },
    // Sent to existing members when someone joins.
    clientConnected: {
        channel: 'response',
        build: ({ clientData, sessionData }) => ({ response: 'clientConnected', clientData, sessionData })
    },
    // Sent to remaining members when someone leaves.
    clientDisconnected: {
        channel: 'response',
        build: ({ clientData, sessionData }) => ({ response: 'clientDisconnected', clientData, sessionData })
    },
    // Sent to other members after a client renames itself.
    sessionDataUpdated: {
        channel: 'response',
        build: ({ sessionData }) => ({ response: 'sessionDataUpdated', sessionData })
    },
    // Sent to a client another member kicked, right before the server closes its socket.
    clientRemoved: {
        channel: 'response',
        build: () => ({ response: 'clientRemoved' })
    },
    // Sent to every member when the session is dissolved, right before the server closes their sockets.
    sessionDissolved: {
        channel: 'response',
        build: () => ({ response: 'sessionDissolved' })
    },
    // Sent to every connected client right before the server process itself
    // shuts down (a deploy/restart, or as a last resort after an unexpected
    // error) — distinct from sessionDissolved, which means a session ended
    // while the server keeps running. The socket is closed right after.
    serverShutdown: {
        channel: 'response',
        build: () => ({ response: 'serverShutdown' })
    },
    // Sent, then the socket is closed, when a requested sessionId doesn't match a live session.
    // `reason` is one of ERROR_REASONS.
    error: {
        channel: 'response',
        build: ({ reason }) => ({ response: 'error', reason })
    },
    // Reply to a ping=true health check.
    pong: {
        channel: 'response',
        build: () => ({ response: 'pong' })
    },
    // Pushes a shared-state change to a client. Always sent once to a joiner
    // (possibly with an empty patch) so it knows its initial state is settled.
    syncState: {
        channel: 'type',
        build: ({ patch }) => ({ type: 'syncState', payload: { patch } })
    }
};

// -----------------------------------------------------------------------
// Messages the client sends to the server.
// Declaration order matters here: server-side dispatch precedence depends
// on 'message'-channel entries appearing before 'type'-channel ones — do
// not let a formatter/linter alphabetize this object.
// -----------------------------------------------------------------------

export const MESSAGES_TO_SERVER = {
    // Renames this client; other members get sessionDataUpdated.
    updateClientName: {
        channel: 'message',
        build: ({ clientName }) => ({ message: 'updateClientName', clientName })
    },
    // Kicks the named client (by id) from the session.
    removeClient: {
        channel: 'message',
        build: ({ clientId }) => ({ message: 'removeClient', clientId })
    },
    // Ends the session for everyone.
    dissolveSession: {
        channel: 'message',
        build: () => ({ message: 'dissolveSession' })
    },
    // Reports a client-side state change. `cause: 'syncResult'` marks a client
    // reporting what it actually applied after a syncState push — the server
    // stores it but never fans it back out. Any other/absent cause is a
    // user-driven change, pushed to other members as syncState.
    updateState: {
        channel: 'type',
        build: ({ patch, cause }) => ({ type: 'updateState', payload: cause ? { patch, cause } : { patch } })
    }
};

// -----------------------------------------------------------------------
// Error reasons — the `reason` field of an `error` message.
// -----------------------------------------------------------------------

export const ERROR_REASONS = {
    sessionNotFound: 'sessionNotFound'
};

// -----------------------------------------------------------------------
// Building and reading messages — work with any name from either table
// above, so callers don't need to know or care which direction it's for.
// -----------------------------------------------------------------------

function definitionFor(name) {
    const def = MESSAGES_TO_CLIENT[name] ?? MESSAGES_TO_SERVER[name];
    if (!def) throw new Error(`Unknown protocol message "${name}"`);
    return def;
}

export function build(name, args = {}) {
    return definitionFor(name).build(args);
}

export function matches(raw, name) {
    const def = definitionFor(name);
    return raw != null && raw[def.channel] === name;
}
