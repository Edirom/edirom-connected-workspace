# Edirom Connected Workspace

Web component for connecting multiple devices in a shared session via WebSocket: session creation, joining via ID or QR code, device management, cross-device messaging, and a synced per-client state.

## Usage

```html
<script defer src="path/to/edirom-connected-workspace/edirom-connected-workspace.js" type="module"></script>

<edirom-connected-workspace
  ws-url="wss://example.com/ws"
  session="ABC123"
  invite-url="https://example.com/join/"
>
</edirom-connected-workspace>
```

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `ws-url` | string | WebSocket server URL. Required for connection. |
| `session` | string | Session ID to auto-join on connect. When set, the component automatically joins the given session and opens the popover. |
| `invite-url` | string | Base URL used to generate invite links and QR codes. Combined with the current session ID. |

## Events

| Event | Detail | Description |
|---|---|---|
| `session-joined` | `{ sessionId, isCreatingSession }` | This client created or joined a session. |
| `received-message` | `object` | A message with a `type` other than `syncState` was received. `detail` is the parsed JSON message. |

## Methods

| Method | Description |
|---|---|
| `sendMessage(type, payload?, clientTargets?)` | Sends `{ type, payload }` to the other clients in the session, or only to `clientTargets` (an array of client IDs) if given. |
| `registerStateHandler({ keys, get, apply })` | Registers the host app's handler for a group of session-state keys. Returns a function that unregisters it. See below. |
| `updateState(patch)` | Reports that (part of) this client's state changed locally, e.g. `updateState({ connection: 'xyz' })`. See below. |

## Session state

The WebSocket server keeps a `state` per client and orchestrates it between clients:

- **`updateState`** (client → server): "my state changed". Other clients that don't have the new value yet are sent a `syncState`.
- **`syncState`** (server → client): "move to this state". A newly joined client always receives one with the current session state.

The host app keeps the actual values; the component only mirrors what the server knows for this client. Register a handler for a group of keys, and call `updateState` whenever a value settles locally:

```js
const workspace = document.querySelector('edirom-connected-workspace');

workspace.registerStateHandler({
  keys: ['edition', 'work', 'connection'],
  get: () => ({ edition, work, connection }),   // current values from the app's store
  apply: async (patch) => { /* move the app to patch.connection etc.; resolve when settled */ }
});

workspace.updateState({ connection: 'xyz' });   // null is a valid value
```

Notes:
- `updateState` is idempotent — values the server already knows are dropped, so it can be called generously.
- A `syncState` is applied through `apply` without being reported back. If the app couldn't reach the requested value, the actual value is reported once.
- A `syncState` that arrives before a handler is registered is kept and applied on `registerStateHandler`.
- The component reports the handlers' state automatically when a session is created, and after the initial `syncState` of a joined session.
- Which keys exist, and whether they're shared with other clients, is defined by `STATE_SCHEMA` in the ws-server.

## Styling

Themed via CSS custom properties, overridable on the element or any ancestor:

| Custom property | Default | Description |
|---|---|---|
| `--primary-color` | `#000000` | Primary text and icon color |
| `--secondary-color` | `#cacaca` | Background of headers, buttons and interactive elements |
| `--tertiary-color` | `#faf6f0` | Background of the content area |
| `--quaternary-color` | `--secondary-color` | Color of the disconnected status icon |

```css
edirom-connected-workspace {
  --primary-color: #232a44;
  --secondary-color: #e9d9af;
  --tertiary-color: #faf6f0;
}
```

## Dependencies

Vendor libraries are injected into the host `<head>` automatically — no separate `<script>` tags needed.

- **[`edirom-icon`](https://github.com/Edirom/edirom-core-web-components)** — icon rendering.
- [Bowser](https://github.com/lancedikson/bowser) — browser/OS detection (`vendor/bowser-es5.js`).
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) — QR code generation (`vendor/qrcode.js`).
