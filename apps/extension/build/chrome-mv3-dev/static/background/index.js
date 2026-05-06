(function(define){var __define; typeof define === "function" && (__define=define,define=null);
// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"gcLCL":[function(require,module,exports) {
var u = globalThis.process?.argv || [];
var h = ()=>globalThis.process?.env || {};
var B = new Set(u), _ = (e)=>B.has(e), G = u.filter((e)=>e.startsWith("--") && e.includes("=")).map((e)=>e.split("=")).reduce((e, [t, o])=>(e[t] = o, e), {});
var U = _("--dry-run"), g = ()=>_("--verbose") || h().VERBOSE === "true", N = g();
var m = (e = "", ...t)=>console.log(e.padEnd(9), "|", ...t);
var y = (...e)=>console.error("\uD83D\uDD34 ERROR".padEnd(9), "|", ...e), v = (...e)=>m("\uD83D\uDD35 INFO", ...e), f = (...e)=>m("\uD83D\uDFE0 WARN", ...e), M = 0, i = (...e)=>g() && m(`\u{1F7E1} ${M++}`, ...e);
var b = ()=>{
    let e = globalThis.browser?.runtime || globalThis.chrome?.runtime, t = ()=>setInterval(e.getPlatformInfo, 24e3);
    e.onStartup.addListener(t), t();
};
var n = {
    "isContentScript": false,
    "isBackground": true,
    "isReact": false,
    "runtimes": [
        "background-service-runtime"
    ],
    "host": "localhost",
    "port": 1815,
    "entryFilePath": "/Users/a1234/Documents/latch-web-extension/apps/extension/.plasmo/static/background/index.ts",
    "bundleId": "d7b9b2f81f818f0b",
    "envHash": "d99a5ffa57acd638",
    "verbose": "false",
    "secure": false,
    "serverPort": 61890
};
module.bundle.HMR_BUNDLE_ID = n.bundleId;
globalThis.process = {
    argv: [],
    env: {
        VERBOSE: n.verbose
    }
};
var D = module.bundle.Module;
function H(e) {
    D.call(this, e), this.hot = {
        data: module.bundle.hotData[e],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(t) {
            this._acceptCallbacks.push(t || function() {});
        },
        dispose: function(t) {
            this._disposeCallbacks.push(t);
        }
    }, module.bundle.hotData[e] = void 0;
}
module.bundle.Module = H;
module.bundle.hotData = {};
var c = globalThis.browser || globalThis.chrome || null;
function R() {
    return !n.host || n.host === "0.0.0.0" ? location.protocol.indexOf("http") === 0 ? location.hostname : "localhost" : n.host;
}
function x() {
    return !n.host || n.host === "0.0.0.0" ? "localhost" : n.host;
}
function d() {
    return n.port || location.port;
}
var P = "__plasmo_runtime_page_", S = "__plasmo_runtime_script_";
var O = `${n.secure ? "https" : "http"}://${R()}:${d()}/`;
async function k(e = 1470) {
    for(;;)try {
        await fetch(O);
        break;
    } catch  {
        await new Promise((o)=>setTimeout(o, e));
    }
}
if (c.runtime.getManifest().manifest_version === 3) {
    let e = c.runtime.getURL("/__plasmo_hmr_proxy__?url=");
    globalThis.addEventListener("fetch", function(t) {
        let o = t.request.url;
        if (o.startsWith(e)) {
            let s = new URL(decodeURIComponent(o.slice(e.length)));
            s.hostname === n.host && s.port === `${n.port}` ? (s.searchParams.set("t", Date.now().toString()), t.respondWith(fetch(s).then((r)=>new Response(r.body, {
                    headers: {
                        "Content-Type": r.headers.get("Content-Type") ?? "text/javascript"
                    }
                })))) : t.respondWith(new Response("Plasmo HMR", {
                status: 200,
                statusText: "Testing"
            }));
        }
    });
}
function E(e, t) {
    let { modules: o } = e;
    return o ? !!o[t] : !1;
}
function C(e = d()) {
    let t = x();
    return `${n.secure || location.protocol === "https:" && !/localhost|127.0.0.1|0.0.0.0/.test(t) ? "wss" : "ws"}://${t}:${e}/`;
}
function L(e) {
    typeof e.message == "string" && y("[plasmo/parcel-runtime]: " + e.message);
}
function T(e) {
    if (typeof globalThis.WebSocket > "u") return;
    let t = new WebSocket(C(Number(d()) + 1));
    return t.addEventListener("message", async function(o) {
        let s = JSON.parse(o.data);
        await e(s);
    }), t.addEventListener("error", L), t;
}
function A(e) {
    if (typeof globalThis.WebSocket > "u") return;
    let t = new WebSocket(C());
    return t.addEventListener("message", async function(o) {
        let s = JSON.parse(o.data);
        if (s.type === "update" && await e(s.assets), s.type === "error") for (let r of s.diagnostics.ansi){
            let l = r.codeframe || r.stack;
            f("[plasmo/parcel-runtime]: " + r.message + `
` + l + `

` + r.hints.join(`
`));
        }
    }), t.addEventListener("error", L), t.addEventListener("open", ()=>{
        v(`[plasmo/parcel-runtime]: Connected to HMR server for ${n.entryFilePath}`);
    }), t.addEventListener("close", ()=>{
        f(`[plasmo/parcel-runtime]: Connection to the HMR server is closed for ${n.entryFilePath}`);
    }), t;
}
var w = module.bundle.parent, a = {
    buildReady: !1,
    bgChanged: !1,
    csChanged: !1,
    pageChanged: !1,
    scriptPorts: new Set,
    pagePorts: new Set
};
async function p(e = !1) {
    if (e || a.buildReady && a.pageChanged) {
        i("BGSW Runtime - reloading Page");
        for (let t of a.pagePorts)t.postMessage(null);
    }
    if (e || a.buildReady && (a.bgChanged || a.csChanged)) {
        i("BGSW Runtime - reloading CS");
        let t = await c?.tabs.query({
            active: !0
        });
        for (let o of a.scriptPorts){
            let s = t.some((r)=>r.id === o.sender.tab?.id);
            o.postMessage({
                __plasmo_cs_active_tab__: s
            });
        }
        c.runtime.reload();
    }
}
if (!w || !w.isParcelRequire) {
    b();
    let e = A(async (t)=>{
        i("BGSW Runtime - On HMR Update"), a.bgChanged ||= t.filter((s)=>s.envHash === n.envHash).some((s)=>E(module.bundle, s.id));
        let o = t.find((s)=>s.type === "json");
        if (o) {
            let s = new Set(t.map((l)=>l.id)), r = Object.values(o.depsByBundle).map((l)=>Object.values(l)).flat();
            a.bgChanged ||= r.every((l)=>s.has(l));
        }
        p();
    });
    e.addEventListener("open", ()=>{
        let t = setInterval(()=>e.send("ping"), 24e3);
        e.addEventListener("close", ()=>clearInterval(t));
    }), e.addEventListener("close", async ()=>{
        await k(), p(!0);
    });
}
T(async (e)=>{
    switch(i("BGSW Runtime - On Build Repackaged"), e.type){
        case "build_ready":
            a.buildReady ||= !0, p();
            break;
        case "cs_changed":
            a.csChanged ||= !0, p();
            break;
    }
});
c.runtime.onConnect.addListener(function(e) {
    let t = e.name.startsWith(P), o = e.name.startsWith(S);
    if (t || o) {
        let s = t ? a.pagePorts : a.scriptPorts;
        s.add(e), e.onDisconnect.addListener(()=>{
            s.delete(e);
        }), e.onMessage.addListener(function(r) {
            i("BGSW Runtime - On source changed", r), r.__plasmo_cs_changed__ && (a.csChanged ||= !0), r.__plasmo_page_changed__ && (a.pageChanged ||= !0), p();
        });
    }
});
c.runtime.onMessage.addListener(function(t) {
    return t.__plasmo_full_reload__ && (i("BGSW Runtime - On top-level code changed"), p()), !0;
});

},{}],"2w7px":[function(require,module,exports) {
var _index = require("../../../src/background/index");
var _mainWorldScripts = require("./main-world-scripts");

},{"../../../src/background/index":"elNcd","./main-world-scripts":"exieT"}],"elNcd":[function(require,module,exports) {
/**
 * Background Service Worker \u2014 the ONLY execution context that may hold key material.
 *
 * Responsibilities:
 * - Encrypted vault (keys never leave this context)
 * - Transaction signing
 * - Message routing from popup and content scripts
 *
 * Security rule: NEVER send raw private keys in chrome.runtime.sendMessage responses.
 */ var _backend = require("./backend");
var _storage = require("./storage");
const STORAGE_KEYS = {
    setupState: "latch.setupState",
    accountPublicKey: "latch.accountPublicKey",
    uiSurface: "latch.uiSurface"
};
async function getSetupState() {
    const result = await chrome.storage.local.get([
        STORAGE_KEYS.setupState,
        STORAGE_KEYS.accountPublicKey
    ]);
    return {
        setupState: result[STORAGE_KEYS.setupState] ?? "new",
        accountPublicKey: result[STORAGE_KEYS.accountPublicKey]
    };
}
async function setSetupState(req) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.setupState]: req.setupState,
        [STORAGE_KEYS.accountPublicKey]: req.accountPublicKey
    });
}
async function applyUiSurfacePreference(pref) {
    // Side panel API is Chrome-only; Plasmo will map to Firefox sidebar_action where relevant,
    // but we still need to guard the runtime API surface.
    const hasSidePanel = "sidePanel" in chrome;
    try {
        if (pref === "sidepanel") {
            // Let action-click open the side panel.
            await chrome.action.setPopup({
                popup: ""
            });
            if (hasSidePanel) {
                await chrome.sidePanel.setOptions({
                    path: "sidepanel.html",
                    enabled: true
                });
                await chrome.sidePanel.setPanelBehavior({
                    openPanelOnActionClick: true
                });
            }
        } else {
            await chrome.action.setPopup({
                popup: "popup.html"
            });
            if (hasSidePanel) {
                await chrome.sidePanel.setOptions({
                    path: "sidepanel.html",
                    enabled: true
                });
                // Critical: do NOT open sidepanel on action click in popup mode.
                await chrome.sidePanel.setPanelBehavior({
                    openPanelOnActionClick: false
                });
            }
        }
    } catch (err) {
        console.error("[latch:background] applyUiSurfacePreference failed", err);
    }
}
async function initUiSurfacePreference() {
    const res = await chrome.storage.local.get([
        STORAGE_KEYS.uiSurface
    ]);
    const v = res[STORAGE_KEYS.uiSurface];
    if (v !== "popup" && v !== "sidepanel") {
        await chrome.storage.local.set({
            [STORAGE_KEYS.uiSurface]: "popup"
        });
        await applyUiSurfacePreference("popup");
        return;
    }
    await applyUiSurfacePreference(v);
}
chrome.runtime.onInstalled.addListener((details)=>{
    // Always default to popup on first install, and reset to popup on update so users
    // don't get stuck in sidepanel mode without realizing why action-click changed.
    if (details.reason === "install" || details.reason === "update") {
        chrome.storage.local.set({
            [STORAGE_KEYS.uiSurface]: "popup"
        }).then(()=>applyUiSurfacePreference("popup"));
        return;
    }
    initUiSurfacePreference();
});
chrome.runtime.onStartup.addListener(()=>{
    initUiSurfacePreference();
    (0, _storage.migrateLegacyPublicKeyIfNeeded)();
});
chrome.storage.onChanged.addListener((changes, areaName)=>{
    if (areaName !== "local") return;
    const change = changes[STORAGE_KEYS.uiSurface];
    if (!change) return;
    const next = change.newValue;
    const pref = next === "sidepanel" ? "sidepanel" : "popup";
    applyUiSurfacePreference(pref);
});
function ok(data) {
    return {
        ok: true,
        data
    };
}
function toSerializableError(err) {
    if (err instanceof (0, _backend.BackendError)) return err.toSerializable();
    if (err instanceof Error) return {
        message: err.message
    };
    return {
        message: String(err)
    };
}
const pendingDappResolvers = new Map();
function mergePermissions(base, add) {
    return base.includes(add) ? base : [
        ...base,
        add
    ];
}
async function openApprovalPopup() {
    try {
        // Prefer openPopup when available
        if ("action" in chrome && typeof chrome.action.openPopup === "function") {
            await chrome.action.openPopup();
            return;
        }
    } catch  {
    // fall through to window.create
    }
    try {
        await chrome.windows.create({
            url: chrome.runtime.getURL("popup.html"),
            type: "popup",
            width: 400,
            height: 650
        });
    } catch (err) {
        console.error("[latch:background] openApprovalPopup failed", err);
    }
}
async function requireDappApproval(args) {
    const requestId = crypto.randomUUID();
    const pending = {
        id: requestId,
        origin: args.origin,
        kind: args.kind,
        createdAt: Date.now()
    };
    await (0, _storage.addPendingDappRequest)(pending);
    await openApprovalPopup();
    return await new Promise((resolve)=>{
        pendingDappResolvers.set(requestId, resolve);
    });
}
chrome.runtime.onMessage.addListener((rawMessage, _sender, sendResponse)=>{
    const message = rawMessage;
    (async ()=>{
        switch(message?.type){
            case "GET_SETUP_STATE":
                {
                    const data = await getSetupState();
                    sendResponse(ok(data));
                    return;
                }
            case "SET_SETUP_STATE":
                await setSetupState(message.payload);
                sendResponse(ok());
                return;
            case "LOGOUT":
                await (0, _storage.clearSession)();
                await setSetupState({
                    setupState: "new",
                    accountPublicKey: undefined
                });
                sendResponse(ok());
                return;
            case "GET_ACCOUNTS":
                {
                    const data = await (0, _storage.getAccounts)();
                    sendResponse(ok(data));
                    return;
                }
            case "SET_ACTIVE_ACCOUNT":
                {
                    const req = message.payload;
                    await (0, _storage.setActiveAccount)(req.accountId);
                    sendResponse(ok());
                    return;
                }
            case "CREATE_OR_CONNECT_FREIGHTER":
                {
                    const req = message.payload;
                    const data = await (0, _backend.createOrConnectFreighter)(req);
                    const { account } = await (0, _storage.createAccount)({
                        mode: "freighter",
                        smartAccountAddress: data.smartAccountAddress,
                        gAddress: req.gAddress
                    });
                    sendResponse(ok({
                        ...data,
                        account
                    }));
                    return;
                }
            case "CREATE_OR_CONNECT_PHANTOM":
                {
                    const req = message.payload;
                    const data = await (0, _backend.createOrConnectPhantom)(req);
                    const { account } = await (0, _storage.createAccount)({
                        mode: "phantom",
                        smartAccountAddress: data.smartAccountAddress,
                        gAddress: data.gAddress,
                        phantomPublicKeyHex: req.publicKeyHex
                    });
                    sendResponse(ok({
                        ...data,
                        account
                    }));
                    return;
                }
            case "CREATE_OR_CONNECT_PASSKEY":
                {
                    const req = message.payload;
                    const data = await (0, _backend.createOrConnectPasskey)(req);
                    const { account } = await (0, _storage.createAccount)({
                        mode: "passkey",
                        smartAccountAddress: data.smartAccountAddress,
                        passkeyCredentialId: req.credentialId,
                        passkeyKeyDataHex: req.keyDataHex
                    });
                    sendResponse(ok({
                        ...data,
                        account
                    }));
                    return;
                }
            case "BUILD_TX":
                {
                    const req = message.payload;
                    const data = await (0, _backend.buildTx)(req);
                    sendResponse(ok(data));
                    return;
                }
            case "BUILD_DELEGATED_TX":
                {
                    const req = message.payload;
                    const data = await (0, _backend.buildDelegatedTx)(req);
                    sendResponse(ok(data));
                    return;
                }
            case "SUBMIT_TX_PHANTOM":
                {
                    const req = message.payload;
                    const data = await (0, _backend.submitTxPhantom)(req);
                    sendResponse(ok(data));
                    return;
                }
            case "SUBMIT_TX_DELEGATED":
                {
                    const req = message.payload;
                    const data = await (0, _backend.submitTxDelegated)(req);
                    sendResponse(ok(data));
                    return;
                }
            case "SUBMIT_TX_WEBAUTHN":
                {
                    const req = message.payload;
                    const data = await (0, _backend.submitTxWebauthn)(req);
                    sendResponse(ok(data));
                    return;
                }
            case "GET_DAPP_PERMISSIONS":
                {
                    const req = message.payload;
                    const allowed = await (0, _storage.getDappPermissions)(req.origin);
                    sendResponse(ok({
                        origin: req.origin,
                        allowed
                    }));
                    return;
                }
            case "SET_DAPP_PERMISSIONS":
                {
                    const req = message.payload;
                    const allowed = await (0, _storage.setDappPermissions)(req.origin, req.allowed);
                    sendResponse(ok({
                        origin: req.origin,
                        allowed
                    }));
                    return;
                }
            case "LIST_PENDING_DAPP_REQUESTS":
                {
                    const requests = await (0, _storage.listPendingDappRequests)();
                    const data = {
                        requests
                    };
                    sendResponse(ok(data));
                    return;
                }
            case "RESOLVE_PENDING_DAPP_REQUEST":
                {
                    const req = message.payload;
                    const resolver = pendingDappResolvers.get(req.requestId);
                    pendingDappResolvers.delete(req.requestId);
                    await (0, _storage.removePendingDappRequest)(req.requestId);
                    resolver?.({
                        approved: req.approved,
                        signedXdr: req.signedXdr
                    });
                    sendResponse(ok());
                    return;
                }
            case "DAPP_GET_PUBLIC_KEY":
                {
                    const req = message.payload;
                    const allowed = await (0, _storage.getDappPermissions)(req.origin);
                    if (!allowed.includes("getPublicKey")) {
                        const approval = await requireDappApproval({
                            origin: req.origin,
                            kind: "getPublicKey"
                        });
                        if (!approval.approved) throw new (0, _backend.BackendError)("User rejected", {
                            status: 403,
                            code: "user_rejected"
                        });
                        await (0, _storage.setDappPermissions)(req.origin, mergePermissions(allowed, "getPublicKey"));
                    }
                    const { accounts, activeAccountId } = await (0, _storage.getAccounts)();
                    const active = accounts.find((a)=>a.id === activeAccountId) ?? accounts[0];
                    if (!active?.smartAccountAddress) throw new (0, _backend.BackendError)("No active account", {
                        status: 400,
                        code: "no_account"
                    });
                    sendResponse(ok({
                        publicKey: active.smartAccountAddress
                    }));
                    return;
                }
            case "DAPP_SIGN_TRANSACTION":
                {
                    const req = message.payload;
                    const origin = req?.origin ?? req?.request?.origin;
                    const normalizedOrigin = origin ?? "unknown";
                    const allowed = await (0, _storage.getDappPermissions)(normalizedOrigin);
                    if (!allowed.includes("signTransaction")) {
                        const approval = await requireDappApproval({
                            origin: normalizedOrigin,
                            kind: "signTransaction"
                        });
                        if (!approval.approved) throw new (0, _backend.BackendError)("User rejected", {
                            status: 403,
                            code: "user_rejected"
                        });
                        if (!approval.signedXdr) throw new (0, _backend.BackendError)("Signing not completed", {
                            status: 400,
                            code: "no_signature"
                        });
                        await (0, _storage.setDappPermissions)(normalizedOrigin, mergePermissions(allowed, "signTransaction"));
                        sendResponse(ok({
                            response: {
                                signedXdr: approval.signedXdr
                            }
                        }));
                        return;
                    }
                    throw new (0, _backend.BackendError)("signTransaction requires user gesture via popup", {
                        status: 400,
                        code: "not_supported"
                    });
                }
            default:
                console.log("[latch:background] message received", message);
                sendResponse(ok());
                return;
        }
    })().catch((err)=>{
        sendResponse({
            ok: false,
            error: toSerializableError(err)
        });
    });
    return true // keep channel open for async responses
    ;
});

},{"./backend":"aYYIP","./storage":"101oO"}],"aYYIP":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "BackendError", ()=>BackendError);
parcelHelpers.export(exports, "createOrConnectFreighter", ()=>createOrConnectFreighter);
parcelHelpers.export(exports, "createOrConnectPhantom", ()=>createOrConnectPhantom);
parcelHelpers.export(exports, "createOrConnectPasskey", ()=>createOrConnectPasskey);
parcelHelpers.export(exports, "buildTx", ()=>buildTx);
parcelHelpers.export(exports, "buildDelegatedTx", ()=>buildDelegatedTx);
parcelHelpers.export(exports, "submitTxPhantom", ()=>submitTxPhantom);
parcelHelpers.export(exports, "submitTxDelegated", ()=>submitTxDelegated);
parcelHelpers.export(exports, "submitTxWebauthn", ()=>submitTxWebauthn);
const BASE_URL = "https://v0-latch-stellar.vercel.app";
class BackendError extends Error {
    status;
    code;
    details;
    constructor(message, opts){
        super(message);
        this.name = "BackendError";
        this.status = opts?.status;
        this.code = opts?.code;
        this.details = opts?.details;
    }
    toSerializable() {
        return {
            message: this.message,
            status: this.status,
            code: this.code
        };
    }
}
async function jsonFetch(path, init) {
    const controller = new AbortController();
    const timeoutMs = init?.timeoutMs ?? 20000;
    const timeout = setTimeout(()=>controller.abort(), timeoutMs);
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
                "content-type": "application/json",
                ...init?.headers ?? {}
            }
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : undefined;
        if (!res.ok) throw new BackendError(data?.error ?? data?.message ?? `Request failed: ${res.status}`, {
            status: res.status,
            details: data
        });
        return data;
    } catch (err) {
        if (err instanceof BackendError) throw err;
        if (err instanceof Error && err.name === "AbortError") throw new BackendError("Request timed out", {
            code: "timeout"
        });
        throw new BackendError(err instanceof Error ? err.message : String(err));
    } finally{
        clearTimeout(timeout);
    }
}
async function createOrConnectFreighter(req) {
    return await jsonFetch("/api/smart-account/freighter", {
        method: "POST",
        body: JSON.stringify(req)
    });
}
async function createOrConnectPhantom(req) {
    return await jsonFetch("/api/smart-account", {
        method: "POST",
        body: JSON.stringify(req)
    });
}
async function createOrConnectPasskey(req) {
    return await jsonFetch("/api/smart-account/webauthn", {
        method: "POST",
        body: JSON.stringify(req)
    });
}
async function buildTx(req) {
    return await jsonFetch("/api/transaction/build", {
        method: "POST",
        body: JSON.stringify(req)
    });
}
async function buildDelegatedTx(req) {
    return await jsonFetch("/api/transaction/build-delegated", {
        method: "POST",
        body: JSON.stringify(req)
    });
}
async function submitTxPhantom(req) {
    return await jsonFetch("/api/transaction/submit", {
        method: "POST",
        body: JSON.stringify(req)
    });
}
async function submitTxDelegated(req) {
    return await jsonFetch("/api/transaction/submit-delegated", {
        method: "POST",
        body: JSON.stringify(req)
    });
}
async function submitTxWebauthn(req) {
    return await jsonFetch("/api/transaction/submit-webauthn", {
        method: "POST",
        body: JSON.stringify(req)
    });
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"5G9Z5"}],"5G9Z5":[function(require,module,exports) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, "__esModule", {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === "default" || key === "__esModule" || dest.hasOwnProperty(key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}],"101oO":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "storageKeys", ()=>storageKeys);
parcelHelpers.export(exports, "getAccounts", ()=>getAccounts);
parcelHelpers.export(exports, "setActiveAccount", ()=>setActiveAccount);
parcelHelpers.export(exports, "upsertAccount", ()=>upsertAccount);
parcelHelpers.export(exports, "createAccount", ()=>createAccount);
parcelHelpers.export(exports, "getDappPermissions", ()=>getDappPermissions);
parcelHelpers.export(exports, "setDappPermissions", ()=>setDappPermissions);
parcelHelpers.export(exports, "listPendingDappRequests", ()=>listPendingDappRequests);
parcelHelpers.export(exports, "addPendingDappRequest", ()=>addPendingDappRequest);
parcelHelpers.export(exports, "removePendingDappRequest", ()=>removePendingDappRequest);
parcelHelpers.export(exports, "clearSession", ()=>clearSession);
/**
 * Optional one-time migration: if legacy `latch.accountPublicKey` exists and no accounts are present,
 * create a placeholder account for UI continuity.
 */ parcelHelpers.export(exports, "migrateLegacyPublicKeyIfNeeded", ()=>migrateLegacyPublicKeyIfNeeded);
const STORAGE_KEYS = {
    setupState: "latch.setupState",
    legacyAccountPublicKey: "latch.accountPublicKey",
    accounts: "latch.accounts",
    activeAccountId: "latch.activeAccountId",
    dappPermissions: "latch.dappPermissions",
    pendingDappRequests: "latch.pendingDappRequests"
};
function storageKeys() {
    return STORAGE_KEYS;
}
async function getAccounts() {
    const res = await chrome.storage.local.get([
        STORAGE_KEYS.accounts,
        STORAGE_KEYS.activeAccountId
    ]);
    const accounts = res[STORAGE_KEYS.accounts] ?? [];
    const activeAccountId = res[STORAGE_KEYS.activeAccountId];
    return {
        accounts,
        activeAccountId
    };
}
async function setActiveAccount(accountId) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.activeAccountId]: accountId
    });
}
function newId() {
    return crypto.randomUUID();
}
async function upsertAccount(input) {
    const { accounts, activeAccountId } = await getAccounts();
    const now = Date.now();
    const id = input.id ?? newId();
    const createdAt = input.createdAt ?? now;
    const next = {
        ...input,
        id,
        createdAt
    };
    const existingIdx = accounts.findIndex((a)=>a.id === id);
    const nextAccounts = existingIdx >= 0 ? accounts.map((a, i)=>i === existingIdx ? next : a) : [
        ...accounts,
        next
    ];
    await chrome.storage.local.set({
        [STORAGE_KEYS.accounts]: nextAccounts,
        [STORAGE_KEYS.activeAccountId]: activeAccountId ?? id
    });
    return {
        account: next,
        activeAccountId: activeAccountId ?? id
    };
}
async function createAccount(params) {
    return await upsertAccount({
        mode: params.mode,
        smartAccountAddress: params.smartAccountAddress,
        gAddress: params.gAddress,
        phantomPublicKeyHex: params.phantomPublicKeyHex,
        passkeyCredentialId: params.passkeyCredentialId,
        passkeyKeyDataHex: params.passkeyKeyDataHex
    });
}
async function getDappPermissions(origin) {
    const res = await chrome.storage.local.get([
        STORAGE_KEYS.dappPermissions
    ]);
    const store = res[STORAGE_KEYS.dappPermissions] ?? {};
    return store[origin] ?? [];
}
async function setDappPermissions(origin, allowed) {
    const res = await chrome.storage.local.get([
        STORAGE_KEYS.dappPermissions
    ]);
    const store = res[STORAGE_KEYS.dappPermissions] ?? {};
    const next = {
        ...store,
        [origin]: allowed
    };
    await chrome.storage.local.set({
        [STORAGE_KEYS.dappPermissions]: next
    });
    return allowed;
}
async function listPendingDappRequests() {
    const res = await chrome.storage.local.get([
        STORAGE_KEYS.pendingDappRequests
    ]);
    return res[STORAGE_KEYS.pendingDappRequests] ?? [];
}
async function addPendingDappRequest(req) {
    const current = await listPendingDappRequests();
    await chrome.storage.local.set({
        [STORAGE_KEYS.pendingDappRequests]: [
            ...current,
            req
        ]
    });
}
async function removePendingDappRequest(requestId) {
    const current = await listPendingDappRequests();
    await chrome.storage.local.set({
        [STORAGE_KEYS.pendingDappRequests]: current.filter((r)=>r.id !== requestId)
    });
}
async function clearSession() {
    await chrome.storage.local.remove([
        STORAGE_KEYS.accounts,
        STORAGE_KEYS.activeAccountId,
        STORAGE_KEYS.setupState,
        STORAGE_KEYS.legacyAccountPublicKey,
        STORAGE_KEYS.dappPermissions,
        STORAGE_KEYS.pendingDappRequests
    ]);
}
async function migrateLegacyPublicKeyIfNeeded() {
    const { accounts } = await getAccounts();
    if (accounts.length > 0) return;
    const res = await chrome.storage.local.get([
        STORAGE_KEYS.legacyAccountPublicKey
    ]);
    const pk = res[STORAGE_KEYS.legacyAccountPublicKey];
    if (!pk) return;
    // We don't know smartAccountAddress; keep as gAddress for now (treated as freighter-ish).
    await createAccount({
        mode: "freighter",
        smartAccountAddress: "",
        gAddress: pk
    });
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"5G9Z5"}],"exieT":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
var _injector = require("url:../../../src/contents/injector");
var _injectorDefault = parcelHelpers.interopDefault(_injector);
chrome.scripting.registerContentScripts([
    {
        "id": "srcContentsInjector",
        "js": [
            (0, _injectorDefault.default).split("/").pop().split("?")[0]
        ],
        "matches": [
            "<all_urls>"
        ],
        "runAt": "document_start",
        "world": "MAIN"
    }
]).catch((_)=>{});

},{"url:../../../src/contents/injector":"iw7RQ","@parcel/transformer-js/src/esmodule-helpers.js":"5G9Z5"}],"iw7RQ":[function(require,module,exports) {
module.exports = require("3cecf81f4b4e2e3b").getBundleURL("iwiFI") + "../../injector.06b36109.js" + "?" + Date.now();

},{"3cecf81f4b4e2e3b":"7BRJX"}],"7BRJX":[function(require,module,exports) {
"use strict";
var bundleURL = {};
function getBundleURLCached(id) {
    var value = bundleURL[id];
    if (!value) {
        value = getBundleURL();
        bundleURL[id] = value;
    }
    return value;
}
function getBundleURL() {
    try {
        throw new Error();
    } catch (err) {
        var matches = ("" + err.stack).match(/(https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/[^)\n]+/g);
        if (matches) // The first two stack frames will be this function and getBundleURLCached.
        // Use the 3rd one, which will be a runtime in the original bundle.
        return getBaseURL(matches[2]);
    }
    return "/";
}
function getBaseURL(url) {
    return ("" + url).replace(/^((?:https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/.+)\/[^/]+$/, "$1") + "/";
} // TODO: Replace uses with `new URL(url).origin` when ie11 is no longer supported.
function getOrigin(url) {
    var matches = ("" + url).match(/(https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/[^/]+/);
    if (!matches) throw new Error("Origin not found");
    return matches[0];
}
exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
exports.getOrigin = getOrigin;

},{}]},["gcLCL","2w7px"], "2w7px", "parcelRequiree5a2")

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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MkUsUUFBUTtBQUMvRyxFQUFFLGtGQUFrRjtBQUdwRixTQUFTLFVBQVUsR0FBRztJQUNwQixJQUFJLFVBQVUsQUFBQyxDQUFBLEtBQUssR0FBRSxFQUFHLE1BQU07SUFFL0IsSUFBSSxDQUFDLFNBQ0gsTUFBTSxJQUFJLE1BQU07SUFHbEIsT0FBTyxPQUFPLENBQUMsRUFBRTtBQUNuQjtBQUVBLFFBQVEsZUFBZTtBQUN2QixRQUFRLGFBQWE7QUFDckIsUUFBUSxZQUFZIiwic291cmNlcyI6WyJub2RlX21vZHVsZXMvLnBucG0vQHBsYXNtb2hxK3BhcmNlbC1ydW50aW1lQDAuMjUuMi9ub2RlX21vZHVsZXMvQHBsYXNtb2hxL3BhcmNlbC1ydW50aW1lL2Rpc3QvcnVudGltZS03YzRmNGNhMmVkYjgzNmQxLmpzIiwiYXBwcy9leHRlbnNpb24vLnBsYXNtby9zdGF0aWMvYmFja2dyb3VuZC9pbmRleC50cyIsImFwcHMvZXh0ZW5zaW9uL3NyYy9iYWNrZ3JvdW5kL2luZGV4LnRzIiwiYXBwcy9leHRlbnNpb24vc3JjL2JhY2tncm91bmQvYmFja2VuZC50cyIsIm5vZGVfbW9kdWxlcy8ucG5wbS9AcGFyY2VsK3RyYW5zZm9ybWVyLWpzQDIuOS4zX0BwYXJjZWwrY29yZUAyLjkuMy9ub2RlX21vZHVsZXMvQHBhcmNlbC90cmFuc2Zvcm1lci1qcy9zcmMvZXNtb2R1bGUtaGVscGVycy5qcyIsImFwcHMvZXh0ZW5zaW9uL3NyYy9iYWNrZ3JvdW5kL3N0b3JhZ2UudHMiLCJhcHBzL2V4dGVuc2lvbi8ucGxhc21vL3N0YXRpYy9iYWNrZ3JvdW5kL21haW4td29ybGQtc2NyaXB0cy50cyIsIm5vZGVfbW9kdWxlcy8ucG5wbS9AcGFyY2VsK3J1bnRpbWUtanNAMi44LjNfQHBhcmNlbCtjb3JlQDIuOS4zL25vZGVfbW9kdWxlcy9AcGFyY2VsL3J1bnRpbWUtanMvbGliL3J1bnRpbWUtYzAxMmVjOTEzMDQ1ZDVmNC5qcyIsIm5vZGVfbW9kdWxlcy8ucG5wbS9AcGFyY2VsK3J1bnRpbWUtanNAMi44LjNfQHBhcmNlbCtjb3JlQDIuOS4zL25vZGVfbW9kdWxlcy9AcGFyY2VsL3J1bnRpbWUtanMvbGliL2hlbHBlcnMvYnVuZGxlLXVybC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgdT1nbG9iYWxUaGlzLnByb2Nlc3M/LmFyZ3Z8fFtdO3ZhciBoPSgpPT5nbG9iYWxUaGlzLnByb2Nlc3M/LmVudnx8e307dmFyIEI9bmV3IFNldCh1KSxfPWU9PkIuaGFzKGUpLEc9dS5maWx0ZXIoZT0+ZS5zdGFydHNXaXRoKFwiLS1cIikmJmUuaW5jbHVkZXMoXCI9XCIpKS5tYXAoZT0+ZS5zcGxpdChcIj1cIikpLnJlZHVjZSgoZSxbdCxvXSk9PihlW3RdPW8sZSkse30pO3ZhciBVPV8oXCItLWRyeS1ydW5cIiksZz0oKT0+XyhcIi0tdmVyYm9zZVwiKXx8aCgpLlZFUkJPU0U9PT1cInRydWVcIixOPWcoKTt2YXIgbT0oZT1cIlwiLC4uLnQpPT5jb25zb2xlLmxvZyhlLnBhZEVuZCg5KSxcInxcIiwuLi50KTt2YXIgeT0oLi4uZSk9PmNvbnNvbGUuZXJyb3IoXCJcXHV7MUY1MzR9IEVSUk9SXCIucGFkRW5kKDkpLFwifFwiLC4uLmUpLHY9KC4uLmUpPT5tKFwiXFx1ezFGNTM1fSBJTkZPXCIsLi4uZSksZj0oLi4uZSk9Pm0oXCJcXHV7MUY3RTB9IFdBUk5cIiwuLi5lKSxNPTAsaT0oLi4uZSk9PmcoKSYmbShgXFx1ezFGN0UxfSAke00rK31gLC4uLmUpO3ZhciBiPSgpPT57bGV0IGU9Z2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lfHxnbG9iYWxUaGlzLmNocm9tZT8ucnVudGltZSx0PSgpPT5zZXRJbnRlcnZhbChlLmdldFBsYXRmb3JtSW5mbywyNGUzKTtlLm9uU3RhcnR1cC5hZGRMaXN0ZW5lcih0KSx0KCl9O3ZhciBuPXtcImlzQ29udGVudFNjcmlwdFwiOmZhbHNlLFwiaXNCYWNrZ3JvdW5kXCI6dHJ1ZSxcImlzUmVhY3RcIjpmYWxzZSxcInJ1bnRpbWVzXCI6W1wiYmFja2dyb3VuZC1zZXJ2aWNlLXJ1bnRpbWVcIl0sXCJob3N0XCI6XCJsb2NhbGhvc3RcIixcInBvcnRcIjoxODE1LFwiZW50cnlGaWxlUGF0aFwiOlwiL1VzZXJzL2ExMjM0L0RvY3VtZW50cy9sYXRjaC13ZWItZXh0ZW5zaW9uL2FwcHMvZXh0ZW5zaW9uLy5wbGFzbW8vc3RhdGljL2JhY2tncm91bmQvaW5kZXgudHNcIixcImJ1bmRsZUlkXCI6XCJkN2I5YjJmODFmODE4ZjBiXCIsXCJlbnZIYXNoXCI6XCJkOTlhNWZmYTU3YWNkNjM4XCIsXCJ2ZXJib3NlXCI6XCJmYWxzZVwiLFwic2VjdXJlXCI6ZmFsc2UsXCJzZXJ2ZXJQb3J0XCI6NjE4OTB9O21vZHVsZS5idW5kbGUuSE1SX0JVTkRMRV9JRD1uLmJ1bmRsZUlkO2dsb2JhbFRoaXMucHJvY2Vzcz17YXJndjpbXSxlbnY6e1ZFUkJPU0U6bi52ZXJib3NlfX07dmFyIEQ9bW9kdWxlLmJ1bmRsZS5Nb2R1bGU7ZnVuY3Rpb24gSChlKXtELmNhbGwodGhpcyxlKSx0aGlzLmhvdD17ZGF0YTptb2R1bGUuYnVuZGxlLmhvdERhdGFbZV0sX2FjY2VwdENhbGxiYWNrczpbXSxfZGlzcG9zZUNhbGxiYWNrczpbXSxhY2NlcHQ6ZnVuY3Rpb24odCl7dGhpcy5fYWNjZXB0Q2FsbGJhY2tzLnB1c2godHx8ZnVuY3Rpb24oKXt9KX0sZGlzcG9zZTpmdW5jdGlvbih0KXt0aGlzLl9kaXNwb3NlQ2FsbGJhY2tzLnB1c2godCl9fSxtb2R1bGUuYnVuZGxlLmhvdERhdGFbZV09dm9pZCAwfW1vZHVsZS5idW5kbGUuTW9kdWxlPUg7bW9kdWxlLmJ1bmRsZS5ob3REYXRhPXt9O3ZhciBjPWdsb2JhbFRoaXMuYnJvd3Nlcnx8Z2xvYmFsVGhpcy5jaHJvbWV8fG51bGw7ZnVuY3Rpb24gUigpe3JldHVybiFuLmhvc3R8fG4uaG9zdD09PVwiMC4wLjAuMFwiP2xvY2F0aW9uLnByb3RvY29sLmluZGV4T2YoXCJodHRwXCIpPT09MD9sb2NhdGlvbi5ob3N0bmFtZTpcImxvY2FsaG9zdFwiOm4uaG9zdH1mdW5jdGlvbiB4KCl7cmV0dXJuIW4uaG9zdHx8bi5ob3N0PT09XCIwLjAuMC4wXCI/XCJsb2NhbGhvc3RcIjpuLmhvc3R9ZnVuY3Rpb24gZCgpe3JldHVybiBuLnBvcnR8fGxvY2F0aW9uLnBvcnR9dmFyIFA9XCJfX3BsYXNtb19ydW50aW1lX3BhZ2VfXCIsUz1cIl9fcGxhc21vX3J1bnRpbWVfc2NyaXB0X1wiO3ZhciBPPWAke24uc2VjdXJlP1wiaHR0cHNcIjpcImh0dHBcIn06Ly8ke1IoKX06JHtkKCl9L2A7YXN5bmMgZnVuY3Rpb24gayhlPTE0NzApe2Zvcig7Oyl0cnl7YXdhaXQgZmV0Y2goTyk7YnJlYWt9Y2F0Y2h7YXdhaXQgbmV3IFByb21pc2Uobz0+c2V0VGltZW91dChvLGUpKX19aWYoYy5ydW50aW1lLmdldE1hbmlmZXN0KCkubWFuaWZlc3RfdmVyc2lvbj09PTMpe2xldCBlPWMucnVudGltZS5nZXRVUkwoXCIvX19wbGFzbW9faG1yX3Byb3h5X18/dXJsPVwiKTtnbG9iYWxUaGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJmZXRjaFwiLGZ1bmN0aW9uKHQpe2xldCBvPXQucmVxdWVzdC51cmw7aWYoby5zdGFydHNXaXRoKGUpKXtsZXQgcz1uZXcgVVJMKGRlY29kZVVSSUNvbXBvbmVudChvLnNsaWNlKGUubGVuZ3RoKSkpO3MuaG9zdG5hbWU9PT1uLmhvc3QmJnMucG9ydD09PWAke24ucG9ydH1gPyhzLnNlYXJjaFBhcmFtcy5zZXQoXCJ0XCIsRGF0ZS5ub3coKS50b1N0cmluZygpKSx0LnJlc3BvbmRXaXRoKGZldGNoKHMpLnRoZW4ocj0+bmV3IFJlc3BvbnNlKHIuYm9keSx7aGVhZGVyczp7XCJDb250ZW50LVR5cGVcIjpyLmhlYWRlcnMuZ2V0KFwiQ29udGVudC1UeXBlXCIpPz9cInRleHQvamF2YXNjcmlwdFwifX0pKSkpOnQucmVzcG9uZFdpdGgobmV3IFJlc3BvbnNlKFwiUGxhc21vIEhNUlwiLHtzdGF0dXM6MjAwLHN0YXR1c1RleHQ6XCJUZXN0aW5nXCJ9KSl9fSl9ZnVuY3Rpb24gRShlLHQpe2xldHttb2R1bGVzOm99PWU7cmV0dXJuIG8/ISFvW3RdOiExfWZ1bmN0aW9uIEMoZT1kKCkpe2xldCB0PXgoKTtyZXR1cm5gJHtuLnNlY3VyZXx8bG9jYXRpb24ucHJvdG9jb2w9PT1cImh0dHBzOlwiJiYhL2xvY2FsaG9zdHwxMjcuMC4wLjF8MC4wLjAuMC8udGVzdCh0KT9cIndzc1wiOlwid3NcIn06Ly8ke3R9OiR7ZX0vYH1mdW5jdGlvbiBMKGUpe3R5cGVvZiBlLm1lc3NhZ2U9PVwic3RyaW5nXCImJnkoXCJbcGxhc21vL3BhcmNlbC1ydW50aW1lXTogXCIrZS5tZXNzYWdlKX1mdW5jdGlvbiBUKGUpe2lmKHR5cGVvZiBnbG9iYWxUaGlzLldlYlNvY2tldD5cInVcIilyZXR1cm47bGV0IHQ9bmV3IFdlYlNvY2tldChDKE51bWJlcihkKCkpKzEpKTtyZXR1cm4gdC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLGFzeW5jIGZ1bmN0aW9uKG8pe2xldCBzPUpTT04ucGFyc2Uoby5kYXRhKTthd2FpdCBlKHMpfSksdC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIixMKSx0fWZ1bmN0aW9uIEEoZSl7aWYodHlwZW9mIGdsb2JhbFRoaXMuV2ViU29ja2V0PlwidVwiKXJldHVybjtsZXQgdD1uZXcgV2ViU29ja2V0KEMoKSk7cmV0dXJuIHQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIixhc3luYyBmdW5jdGlvbihvKXtsZXQgcz1KU09OLnBhcnNlKG8uZGF0YSk7aWYocy50eXBlPT09XCJ1cGRhdGVcIiYmYXdhaXQgZShzLmFzc2V0cykscy50eXBlPT09XCJlcnJvclwiKWZvcihsZXQgciBvZiBzLmRpYWdub3N0aWNzLmFuc2kpe2xldCBsPXIuY29kZWZyYW1lfHxyLnN0YWNrO2YoXCJbcGxhc21vL3BhcmNlbC1ydW50aW1lXTogXCIrci5tZXNzYWdlK2BcbmArbCtgXG5cbmArci5oaW50cy5qb2luKGBcbmApKX19KSx0LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLEwpLHQuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwoKT0+e3YoYFtwbGFzbW8vcGFyY2VsLXJ1bnRpbWVdOiBDb25uZWN0ZWQgdG8gSE1SIHNlcnZlciBmb3IgJHtuLmVudHJ5RmlsZVBhdGh9YCl9KSx0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCgpPT57ZihgW3BsYXNtby9wYXJjZWwtcnVudGltZV06IENvbm5lY3Rpb24gdG8gdGhlIEhNUiBzZXJ2ZXIgaXMgY2xvc2VkIGZvciAke24uZW50cnlGaWxlUGF0aH1gKX0pLHR9dmFyIHc9bW9kdWxlLmJ1bmRsZS5wYXJlbnQsYT17YnVpbGRSZWFkeTohMSxiZ0NoYW5nZWQ6ITEsY3NDaGFuZ2VkOiExLHBhZ2VDaGFuZ2VkOiExLHNjcmlwdFBvcnRzOm5ldyBTZXQscGFnZVBvcnRzOm5ldyBTZXR9O2FzeW5jIGZ1bmN0aW9uIHAoZT0hMSl7aWYoZXx8YS5idWlsZFJlYWR5JiZhLnBhZ2VDaGFuZ2VkKXtpKFwiQkdTVyBSdW50aW1lIC0gcmVsb2FkaW5nIFBhZ2VcIik7Zm9yKGxldCB0IG9mIGEucGFnZVBvcnRzKXQucG9zdE1lc3NhZ2UobnVsbCl9aWYoZXx8YS5idWlsZFJlYWR5JiYoYS5iZ0NoYW5nZWR8fGEuY3NDaGFuZ2VkKSl7aShcIkJHU1cgUnVudGltZSAtIHJlbG9hZGluZyBDU1wiKTtsZXQgdD1hd2FpdCBjPy50YWJzLnF1ZXJ5KHthY3RpdmU6ITB9KTtmb3IobGV0IG8gb2YgYS5zY3JpcHRQb3J0cyl7bGV0IHM9dC5zb21lKHI9PnIuaWQ9PT1vLnNlbmRlci50YWI/LmlkKTtvLnBvc3RNZXNzYWdlKHtfX3BsYXNtb19jc19hY3RpdmVfdGFiX186c30pfWMucnVudGltZS5yZWxvYWQoKX19aWYoIXd8fCF3LmlzUGFyY2VsUmVxdWlyZSl7YigpO2xldCBlPUEoYXN5bmMgdD0+e2koXCJCR1NXIFJ1bnRpbWUgLSBPbiBITVIgVXBkYXRlXCIpLGEuYmdDaGFuZ2VkfHw9dC5maWx0ZXIocz0+cy5lbnZIYXNoPT09bi5lbnZIYXNoKS5zb21lKHM9PkUobW9kdWxlLmJ1bmRsZSxzLmlkKSk7bGV0IG89dC5maW5kKHM9PnMudHlwZT09PVwianNvblwiKTtpZihvKXtsZXQgcz1uZXcgU2V0KHQubWFwKGw9PmwuaWQpKSxyPU9iamVjdC52YWx1ZXMoby5kZXBzQnlCdW5kbGUpLm1hcChsPT5PYmplY3QudmFsdWVzKGwpKS5mbGF0KCk7YS5iZ0NoYW5nZWR8fD1yLmV2ZXJ5KGw9PnMuaGFzKGwpKX1wKCl9KTtlLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsKCk9PntsZXQgdD1zZXRJbnRlcnZhbCgoKT0+ZS5zZW5kKFwicGluZ1wiKSwyNGUzKTtlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCgpPT5jbGVhckludGVydmFsKHQpKX0pLGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsb3NlXCIsYXN5bmMoKT0+e2F3YWl0IGsoKSxwKCEwKX0pfVQoYXN5bmMgZT0+e3N3aXRjaChpKFwiQkdTVyBSdW50aW1lIC0gT24gQnVpbGQgUmVwYWNrYWdlZFwiKSxlLnR5cGUpe2Nhc2VcImJ1aWxkX3JlYWR5XCI6e2EuYnVpbGRSZWFkeXx8PSEwLHAoKTticmVha31jYXNlXCJjc19jaGFuZ2VkXCI6e2EuY3NDaGFuZ2VkfHw9ITAscCgpO2JyZWFrfX19KTtjLnJ1bnRpbWUub25Db25uZWN0LmFkZExpc3RlbmVyKGZ1bmN0aW9uKGUpe2xldCB0PWUubmFtZS5zdGFydHNXaXRoKFApLG89ZS5uYW1lLnN0YXJ0c1dpdGgoUyk7aWYodHx8byl7bGV0IHM9dD9hLnBhZ2VQb3J0czphLnNjcmlwdFBvcnRzO3MuYWRkKGUpLGUub25EaXNjb25uZWN0LmFkZExpc3RlbmVyKCgpPT57cy5kZWxldGUoZSl9KSxlLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihmdW5jdGlvbihyKXtpKFwiQkdTVyBSdW50aW1lIC0gT24gc291cmNlIGNoYW5nZWRcIixyKSxyLl9fcGxhc21vX2NzX2NoYW5nZWRfXyYmKGEuY3NDaGFuZ2VkfHw9ITApLHIuX19wbGFzbW9fcGFnZV9jaGFuZ2VkX18mJihhLnBhZ2VDaGFuZ2VkfHw9ITApLHAoKX0pfX0pO2MucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoZnVuY3Rpb24odCl7cmV0dXJuIHQuX19wbGFzbW9fZnVsbF9yZWxvYWRfXyYmKGkoXCJCR1NXIFJ1bnRpbWUgLSBPbiB0b3AtbGV2ZWwgY29kZSBjaGFuZ2VkXCIpLHAoKSksITB9KTtcbiIsImltcG9ydCBcIi4uLy4uLy4uL3NyYy9iYWNrZ3JvdW5kL2luZGV4XCJcbmltcG9ydCBcIi4vbWFpbi13b3JsZC1zY3JpcHRzXCIiLCIvKipcbiAqIEJhY2tncm91bmQgU2VydmljZSBXb3JrZXIg4oCUIHRoZSBPTkxZIGV4ZWN1dGlvbiBjb250ZXh0IHRoYXQgbWF5IGhvbGQga2V5IG1hdGVyaWFsLlxuICpcbiAqIFJlc3BvbnNpYmlsaXRpZXM6XG4gKiAtIEVuY3J5cHRlZCB2YXVsdCAoa2V5cyBuZXZlciBsZWF2ZSB0aGlzIGNvbnRleHQpXG4gKiAtIFRyYW5zYWN0aW9uIHNpZ25pbmdcbiAqIC0gTWVzc2FnZSByb3V0aW5nIGZyb20gcG9wdXAgYW5kIGNvbnRlbnQgc2NyaXB0c1xuICpcbiAqIFNlY3VyaXR5IHJ1bGU6IE5FVkVSIHNlbmQgcmF3IHByaXZhdGUga2V5cyBpbiBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSByZXNwb25zZXMuXG4gKi9cblxuaW1wb3J0IHR5cGUge1xuICBCYWNrZ3JvdW5kTWVzc2FnZSxcbiAgQmFja2dyb3VuZFJlc3BvbnNlLFxuICBCdWlsZERlbGVnYXRlZFR4UmVxdWVzdCxcbiAgQnVpbGRUeFJlcXVlc3QsXG4gIENyZWF0ZU9yQ29ubmVjdEZyZWlnaHRlclJlcXVlc3QsXG4gIENyZWF0ZU9yQ29ubmVjdFBhc3NrZXlSZXF1ZXN0LFxuICBDcmVhdGVPckNvbm5lY3RQaGFudG9tUmVxdWVzdCxcbiAgR2V0QWNjb3VudHNSZXNwb25zZSxcbiAgR2V0RGFwcFBlcm1pc3Npb25zUmVxdWVzdCxcbiAgR2V0U2V0dXBTdGF0ZVJlc3BvbnNlLFxuICBMaXN0UGVuZGluZ0RhcHBSZXF1ZXN0c1Jlc3BvbnNlLFxuICBQZW5kaW5nRGFwcFJlcXVlc3QsXG4gIFNlcmlhbGl6YWJsZUVycm9yLFxuICBSZXNvbHZlUGVuZGluZ0RhcHBSZXF1ZXN0LFxuICBTZXRBY3RpdmVBY2NvdW50UmVxdWVzdCxcbiAgU2V0RGFwcFBlcm1pc3Npb25zUmVxdWVzdCxcbiAgU2V0U2V0dXBTdGF0ZVJlcXVlc3QsXG4gIFNldHVwU3RhdGUsXG4gIFN1Ym1pdERlbGVnYXRlZFR4UmVxdWVzdCxcbiAgU3VibWl0UGhhbnRvbVR4UmVxdWVzdCxcbiAgU3VibWl0V2ViYXV0aG5UeFJlcXVlc3Rcbn0gZnJvbSBcIkBsYXRjaC90eXBlc1wiXG5cbmltcG9ydCB7XG4gIEJhY2tlbmRFcnJvcixcbiAgYnVpbGREZWxlZ2F0ZWRUeCxcbiAgYnVpbGRUeCxcbiAgY3JlYXRlT3JDb25uZWN0RnJlaWdodGVyLFxuICBjcmVhdGVPckNvbm5lY3RQYXNza2V5LFxuICBjcmVhdGVPckNvbm5lY3RQaGFudG9tLFxuICBzdWJtaXRUeERlbGVnYXRlZCxcbiAgc3VibWl0VHhQaGFudG9tLFxuICBzdWJtaXRUeFdlYmF1dGhuXG59IGZyb20gXCIuL2JhY2tlbmRcIlxuXG5pbXBvcnQge1xuICBjcmVhdGVBY2NvdW50LFxuICBnZXRBY2NvdW50cyxcbiAgZ2V0RGFwcFBlcm1pc3Npb25zLFxuICBsaXN0UGVuZGluZ0RhcHBSZXF1ZXN0cyxcbiAgYWRkUGVuZGluZ0RhcHBSZXF1ZXN0LFxuICByZW1vdmVQZW5kaW5nRGFwcFJlcXVlc3QsXG4gIGNsZWFyU2Vzc2lvbixcbiAgbWlncmF0ZUxlZ2FjeVB1YmxpY0tleUlmTmVlZGVkLFxuICBzZXRBY3RpdmVBY2NvdW50LFxuICBzZXREYXBwUGVybWlzc2lvbnNcbn0gZnJvbSBcIi4vc3RvcmFnZVwiXG5cbmNvbnN0IFNUT1JBR0VfS0VZUyA9IHtcbiAgc2V0dXBTdGF0ZTogXCJsYXRjaC5zZXR1cFN0YXRlXCIsXG4gIGFjY291bnRQdWJsaWNLZXk6IFwibGF0Y2guYWNjb3VudFB1YmxpY0tleVwiLFxuICB1aVN1cmZhY2U6IFwibGF0Y2gudWlTdXJmYWNlXCJcbn0gYXMgY29uc3RcblxudHlwZSBVaVN1cmZhY2VQcmVmZXJlbmNlID0gXCJwb3B1cFwiIHwgXCJzaWRlcGFuZWxcIlxuXG5hc3luYyBmdW5jdGlvbiBnZXRTZXR1cFN0YXRlKCk6IFByb21pc2U8R2V0U2V0dXBTdGF0ZVJlc3BvbnNlPiB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbXG4gICAgU1RPUkFHRV9LRVlTLnNldHVwU3RhdGUsXG4gICAgU1RPUkFHRV9LRVlTLmFjY291bnRQdWJsaWNLZXlcbiAgXSlcblxuICByZXR1cm4ge1xuICAgIHNldHVwU3RhdGU6IChyZXN1bHRbU1RPUkFHRV9LRVlTLnNldHVwU3RhdGVdIGFzIFNldHVwU3RhdGUgfCB1bmRlZmluZWQpID8/IFwibmV3XCIsXG4gICAgYWNjb3VudFB1YmxpY0tleTogcmVzdWx0W1NUT1JBR0VfS0VZUy5hY2NvdW50UHVibGljS2V5XSBhcyBzdHJpbmcgfCB1bmRlZmluZWRcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzZXRTZXR1cFN0YXRlKHJlcTogU2V0U2V0dXBTdGF0ZVJlcXVlc3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHtcbiAgICBbU1RPUkFHRV9LRVlTLnNldHVwU3RhdGVdOiByZXEuc2V0dXBTdGF0ZSxcbiAgICBbU1RPUkFHRV9LRVlTLmFjY291bnRQdWJsaWNLZXldOiByZXEuYWNjb3VudFB1YmxpY0tleVxuICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiBhcHBseVVpU3VyZmFjZVByZWZlcmVuY2UocHJlZjogVWlTdXJmYWNlUHJlZmVyZW5jZSkge1xuICAvLyBTaWRlIHBhbmVsIEFQSSBpcyBDaHJvbWUtb25seTsgUGxhc21vIHdpbGwgbWFwIHRvIEZpcmVmb3ggc2lkZWJhcl9hY3Rpb24gd2hlcmUgcmVsZXZhbnQsXG4gIC8vIGJ1dCB3ZSBzdGlsbCBuZWVkIHRvIGd1YXJkIHRoZSBydW50aW1lIEFQSSBzdXJmYWNlLlxuICBjb25zdCBoYXNTaWRlUGFuZWwgPSBcInNpZGVQYW5lbFwiIGluIGNocm9tZVxuXG4gIHRyeSB7XG4gICAgaWYgKHByZWYgPT09IFwic2lkZXBhbmVsXCIpIHtcbiAgICAgIC8vIExldCBhY3Rpb24tY2xpY2sgb3BlbiB0aGUgc2lkZSBwYW5lbC5cbiAgICAgIGF3YWl0IGNocm9tZS5hY3Rpb24uc2V0UG9wdXAoeyBwb3B1cDogXCJcIiB9KVxuXG4gICAgICBpZiAoaGFzU2lkZVBhbmVsKSB7XG4gICAgICAgIGF3YWl0IGNocm9tZS5zaWRlUGFuZWwuc2V0T3B0aW9ucyh7IHBhdGg6IFwic2lkZXBhbmVsLmh0bWxcIiwgZW5hYmxlZDogdHJ1ZSB9KVxuICAgICAgICBhd2FpdCBjaHJvbWUuc2lkZVBhbmVsLnNldFBhbmVsQmVoYXZpb3IoeyBvcGVuUGFuZWxPbkFjdGlvbkNsaWNrOiB0cnVlIH0pXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGNocm9tZS5hY3Rpb24uc2V0UG9wdXAoeyBwb3B1cDogXCJwb3B1cC5odG1sXCIgfSlcbiAgICAgIGlmIChoYXNTaWRlUGFuZWwpIHtcbiAgICAgICAgYXdhaXQgY2hyb21lLnNpZGVQYW5lbC5zZXRPcHRpb25zKHsgcGF0aDogXCJzaWRlcGFuZWwuaHRtbFwiLCBlbmFibGVkOiB0cnVlIH0pXG4gICAgICAgIC8vIENyaXRpY2FsOiBkbyBOT1Qgb3BlbiBzaWRlcGFuZWwgb24gYWN0aW9uIGNsaWNrIGluIHBvcHVwIG1vZGUuXG4gICAgICAgIGF3YWl0IGNocm9tZS5zaWRlUGFuZWwuc2V0UGFuZWxCZWhhdmlvcih7IG9wZW5QYW5lbE9uQWN0aW9uQ2xpY2s6IGZhbHNlIH0pXG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiW2xhdGNoOmJhY2tncm91bmRdIGFwcGx5VWlTdXJmYWNlUHJlZmVyZW5jZSBmYWlsZWRcIiwgZXJyKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRVaVN1cmZhY2VQcmVmZXJlbmNlKCkge1xuICBjb25zdCByZXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoW1NUT1JBR0VfS0VZUy51aVN1cmZhY2VdKVxuICBjb25zdCB2ID0gcmVzW1NUT1JBR0VfS0VZUy51aVN1cmZhY2VdXG5cbiAgaWYgKHYgIT09IFwicG9wdXBcIiAmJiB2ICE9PSBcInNpZGVwYW5lbFwiKSB7XG4gICAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgW1NUT1JBR0VfS0VZUy51aVN1cmZhY2VdOiBcInBvcHVwXCIgc2F0aXNmaWVzIFVpU3VyZmFjZVByZWZlcmVuY2UgfSlcbiAgICBhd2FpdCBhcHBseVVpU3VyZmFjZVByZWZlcmVuY2UoXCJwb3B1cFwiKVxuICAgIHJldHVyblxuICB9XG5cbiAgYXdhaXQgYXBwbHlVaVN1cmZhY2VQcmVmZXJlbmNlKHYpXG59XG5cbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKChkZXRhaWxzKSA9PiB7XG4gIC8vIEFsd2F5cyBkZWZhdWx0IHRvIHBvcHVwIG9uIGZpcnN0IGluc3RhbGwsIGFuZCByZXNldCB0byBwb3B1cCBvbiB1cGRhdGUgc28gdXNlcnNcbiAgLy8gZG9uJ3QgZ2V0IHN0dWNrIGluIHNpZGVwYW5lbCBtb2RlIHdpdGhvdXQgcmVhbGl6aW5nIHdoeSBhY3Rpb24tY2xpY2sgY2hhbmdlZC5cbiAgaWYgKGRldGFpbHMucmVhc29uID09PSBcImluc3RhbGxcIiB8fCBkZXRhaWxzLnJlYXNvbiA9PT0gXCJ1cGRhdGVcIikge1xuICAgIHZvaWQgY2hyb21lLnN0b3JhZ2UubG9jYWxcbiAgICAgIC5zZXQoeyBbU1RPUkFHRV9LRVlTLnVpU3VyZmFjZV06IFwicG9wdXBcIiBzYXRpc2ZpZXMgVWlTdXJmYWNlUHJlZmVyZW5jZSB9KVxuICAgICAgLnRoZW4oKCkgPT4gYXBwbHlVaVN1cmZhY2VQcmVmZXJlbmNlKFwicG9wdXBcIikpXG4gICAgcmV0dXJuXG4gIH1cblxuICB2b2lkIGluaXRVaVN1cmZhY2VQcmVmZXJlbmNlKClcbn0pXG5cbmNocm9tZS5ydW50aW1lLm9uU3RhcnR1cC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIHZvaWQgaW5pdFVpU3VyZmFjZVByZWZlcmVuY2UoKVxuICB2b2lkIG1pZ3JhdGVMZWdhY3lQdWJsaWNLZXlJZk5lZWRlZCgpXG59KVxuXG5jaHJvbWUuc3RvcmFnZS5vbkNoYW5nZWQuYWRkTGlzdGVuZXIoKGNoYW5nZXMsIGFyZWFOYW1lKSA9PiB7XG4gIGlmIChhcmVhTmFtZSAhPT0gXCJsb2NhbFwiKSByZXR1cm5cbiAgY29uc3QgY2hhbmdlID0gY2hhbmdlc1tTVE9SQUdFX0tFWVMudWlTdXJmYWNlXVxuICBpZiAoIWNoYW5nZSkgcmV0dXJuXG4gIGNvbnN0IG5leHQgPSBjaGFuZ2UubmV3VmFsdWVcbiAgY29uc3QgcHJlZjogVWlTdXJmYWNlUHJlZmVyZW5jZSA9IG5leHQgPT09IFwic2lkZXBhbmVsXCIgPyBcInNpZGVwYW5lbFwiIDogXCJwb3B1cFwiXG4gIHZvaWQgYXBwbHlVaVN1cmZhY2VQcmVmZXJlbmNlKHByZWYpXG59KVxuXG5mdW5jdGlvbiBvazxUPihkYXRhPzogVCk6IEJhY2tncm91bmRSZXNwb25zZTxUPiB7XG4gIHJldHVybiB7IG9rOiB0cnVlLCBkYXRhIH1cbn1cblxuZnVuY3Rpb24gdG9TZXJpYWxpemFibGVFcnJvcihlcnI6IHVua25vd24pOiBTZXJpYWxpemFibGVFcnJvciB7XG4gIGlmIChlcnIgaW5zdGFuY2VvZiBCYWNrZW5kRXJyb3IpIHJldHVybiBlcnIudG9TZXJpYWxpemFibGUoKVxuICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB7IG1lc3NhZ2U6IGVyci5tZXNzYWdlIH1cbiAgcmV0dXJuIHsgbWVzc2FnZTogU3RyaW5nKGVycikgfVxufVxuXG50eXBlIFBlbmRpbmdSZXNvbHZlciA9IChyZXN1bHQ6IHsgYXBwcm92ZWQ6IGJvb2xlYW47IHNpZ25lZFhkcj86IHN0cmluZyB9KSA9PiB2b2lkXG5jb25zdCBwZW5kaW5nRGFwcFJlc29sdmVycyA9IG5ldyBNYXA8c3RyaW5nLCBQZW5kaW5nUmVzb2x2ZXI+KClcblxuZnVuY3Rpb24gbWVyZ2VQZXJtaXNzaW9uczxUIGV4dGVuZHMgc3RyaW5nPihiYXNlOiBUW10sIGFkZDogVCk6IFRbXSB7XG4gIHJldHVybiBiYXNlLmluY2x1ZGVzKGFkZCkgPyBiYXNlIDogWy4uLmJhc2UsIGFkZF1cbn1cblxuYXN5bmMgZnVuY3Rpb24gb3BlbkFwcHJvdmFsUG9wdXAoKSB7XG4gIHRyeSB7XG4gICAgLy8gUHJlZmVyIG9wZW5Qb3B1cCB3aGVuIGF2YWlsYWJsZVxuICAgIGlmIChcImFjdGlvblwiIGluIGNocm9tZSAmJiB0eXBlb2YgY2hyb21lLmFjdGlvbi5vcGVuUG9wdXAgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgYXdhaXQgY2hyb21lLmFjdGlvbi5vcGVuUG9wdXAoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBmYWxsIHRocm91Z2ggdG8gd2luZG93LmNyZWF0ZVxuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBjaHJvbWUud2luZG93cy5jcmVhdGUoe1xuICAgICAgdXJsOiBjaHJvbWUucnVudGltZS5nZXRVUkwoXCJwb3B1cC5odG1sXCIpLFxuICAgICAgdHlwZTogXCJwb3B1cFwiLFxuICAgICAgd2lkdGg6IDQwMCxcbiAgICAgIGhlaWdodDogNjUwXG4gICAgfSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihcIltsYXRjaDpiYWNrZ3JvdW5kXSBvcGVuQXBwcm92YWxQb3B1cCBmYWlsZWRcIiwgZXJyKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVEYXBwQXBwcm92YWwoYXJnczogeyBvcmlnaW46IHN0cmluZzsga2luZDogUGVuZGluZ0RhcHBSZXF1ZXN0W1wia2luZFwiXSB9KTogUHJvbWlzZTx7XG4gIGFwcHJvdmVkOiBib29sZWFuXG4gIHNpZ25lZFhkcj86IHN0cmluZ1xufT4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpXG4gIGNvbnN0IHBlbmRpbmc6IFBlbmRpbmdEYXBwUmVxdWVzdCA9IHtcbiAgICBpZDogcmVxdWVzdElkLFxuICAgIG9yaWdpbjogYXJncy5vcmlnaW4sXG4gICAga2luZDogYXJncy5raW5kLFxuICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKVxuICB9XG4gIGF3YWl0IGFkZFBlbmRpbmdEYXBwUmVxdWVzdChwZW5kaW5nKVxuICBhd2FpdCBvcGVuQXBwcm92YWxQb3B1cCgpXG5cbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgcGVuZGluZ0RhcHBSZXNvbHZlcnMuc2V0KHJlcXVlc3RJZCwgcmVzb2x2ZSlcbiAgfSlcbn1cblxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxuICAocmF3TWVzc2FnZTogQmFja2dyb3VuZE1lc3NhZ2UsIF9zZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSByYXdNZXNzYWdlIGFzIEJhY2tncm91bmRNZXNzYWdlXG5cbiAgICA7KGFzeW5jICgpID0+IHtcbiAgICAgIHN3aXRjaCAobWVzc2FnZT8udHlwZSkge1xuICAgICAgICBjYXNlIFwiR0VUX1NFVFVQX1NUQVRFXCI6IHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2V0U2V0dXBTdGF0ZSgpXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rPEdldFNldHVwU3RhdGVSZXNwb25zZT4oZGF0YSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlIFwiU0VUX1NFVFVQX1NUQVRFXCI6IHtcbiAgICAgICAgICBhd2FpdCBzZXRTZXR1cFN0YXRlKG1lc3NhZ2UucGF5bG9hZCBhcyBTZXRTZXR1cFN0YXRlUmVxdWVzdClcbiAgICAgICAgICBzZW5kUmVzcG9uc2Uob2soKSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgXCJMT0dPVVRcIjoge1xuICAgICAgICAgIGF3YWl0IGNsZWFyU2Vzc2lvbigpXG4gICAgICAgICAgYXdhaXQgc2V0U2V0dXBTdGF0ZSh7IHNldHVwU3RhdGU6IFwibmV3XCIsIGFjY291bnRQdWJsaWNLZXk6IHVuZGVmaW5lZCB9KVxuICAgICAgICAgIHNlbmRSZXNwb25zZShvaygpKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIkdFVF9BQ0NPVU5UU1wiOiB7XG4gICAgICAgICAgY29uc3QgZGF0YTogR2V0QWNjb3VudHNSZXNwb25zZSA9IGF3YWl0IGdldEFjY291bnRzKClcbiAgICAgICAgICBzZW5kUmVzcG9uc2Uob2s8R2V0QWNjb3VudHNSZXNwb25zZT4oZGF0YSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlIFwiU0VUX0FDVElWRV9BQ0NPVU5UXCI6IHtcbiAgICAgICAgICBjb25zdCByZXEgPSBtZXNzYWdlLnBheWxvYWQgYXMgU2V0QWN0aXZlQWNjb3VudFJlcXVlc3RcbiAgICAgICAgICBhd2FpdCBzZXRBY3RpdmVBY2NvdW50KHJlcS5hY2NvdW50SWQpXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKCkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlIFwiQ1JFQVRFX09SX0NPTk5FQ1RfRlJFSUdIVEVSXCI6IHtcbiAgICAgICAgICBjb25zdCByZXEgPSBtZXNzYWdlLnBheWxvYWQgYXMgQ3JlYXRlT3JDb25uZWN0RnJlaWdodGVyUmVxdWVzdFxuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjcmVhdGVPckNvbm5lY3RGcmVpZ2h0ZXIocmVxKVxuICAgICAgICAgIGNvbnN0IHsgYWNjb3VudCB9ID0gYXdhaXQgY3JlYXRlQWNjb3VudCh7XG4gICAgICAgICAgICBtb2RlOiBcImZyZWlnaHRlclwiLFxuICAgICAgICAgICAgc21hcnRBY2NvdW50QWRkcmVzczogZGF0YS5zbWFydEFjY291bnRBZGRyZXNzLFxuICAgICAgICAgICAgZ0FkZHJlc3M6IHJlcS5nQWRkcmVzc1xuICAgICAgICAgIH0pXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKHsgLi4uZGF0YSwgYWNjb3VudCB9KSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgXCJDUkVBVEVfT1JfQ09OTkVDVF9QSEFOVE9NXCI6IHtcbiAgICAgICAgICBjb25zdCByZXEgPSBtZXNzYWdlLnBheWxvYWQgYXMgQ3JlYXRlT3JDb25uZWN0UGhhbnRvbVJlcXVlc3RcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY3JlYXRlT3JDb25uZWN0UGhhbnRvbShyZXEpXG4gICAgICAgICAgY29uc3QgeyBhY2NvdW50IH0gPSBhd2FpdCBjcmVhdGVBY2NvdW50KHtcbiAgICAgICAgICAgIG1vZGU6IFwicGhhbnRvbVwiLFxuICAgICAgICAgICAgc21hcnRBY2NvdW50QWRkcmVzczogZGF0YS5zbWFydEFjY291bnRBZGRyZXNzLFxuICAgICAgICAgICAgZ0FkZHJlc3M6IGRhdGEuZ0FkZHJlc3MsXG4gICAgICAgICAgICBwaGFudG9tUHVibGljS2V5SGV4OiByZXEucHVibGljS2V5SGV4XG4gICAgICAgICAgfSlcbiAgICAgICAgICBzZW5kUmVzcG9uc2Uob2soeyAuLi5kYXRhLCBhY2NvdW50IH0pKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIkNSRUFURV9PUl9DT05ORUNUX1BBU1NLRVlcIjoge1xuICAgICAgICAgIGNvbnN0IHJlcSA9IG1lc3NhZ2UucGF5bG9hZCBhcyBDcmVhdGVPckNvbm5lY3RQYXNza2V5UmVxdWVzdFxuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjcmVhdGVPckNvbm5lY3RQYXNza2V5KHJlcSlcbiAgICAgICAgICBjb25zdCB7IGFjY291bnQgfSA9IGF3YWl0IGNyZWF0ZUFjY291bnQoe1xuICAgICAgICAgICAgbW9kZTogXCJwYXNza2V5XCIsXG4gICAgICAgICAgICBzbWFydEFjY291bnRBZGRyZXNzOiBkYXRhLnNtYXJ0QWNjb3VudEFkZHJlc3MsXG4gICAgICAgICAgICBwYXNza2V5Q3JlZGVudGlhbElkOiByZXEuY3JlZGVudGlhbElkLFxuICAgICAgICAgICAgcGFzc2tleUtleURhdGFIZXg6IHJlcS5rZXlEYXRhSGV4XG4gICAgICAgICAgfSlcbiAgICAgICAgICBzZW5kUmVzcG9uc2Uob2soeyAuLi5kYXRhLCBhY2NvdW50IH0pKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIkJVSUxEX1RYXCI6IHtcbiAgICAgICAgICBjb25zdCByZXEgPSBtZXNzYWdlLnBheWxvYWQgYXMgQnVpbGRUeFJlcXVlc3RcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgYnVpbGRUeChyZXEpXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKGRhdGEpKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIkJVSUxEX0RFTEVHQVRFRF9UWFwiOiB7XG4gICAgICAgICAgY29uc3QgcmVxID0gbWVzc2FnZS5wYXlsb2FkIGFzIEJ1aWxkRGVsZWdhdGVkVHhSZXF1ZXN0XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGJ1aWxkRGVsZWdhdGVkVHgocmVxKVxuICAgICAgICAgIHNlbmRSZXNwb25zZShvayhkYXRhKSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgXCJTVUJNSVRfVFhfUEhBTlRPTVwiOiB7XG4gICAgICAgICAgY29uc3QgcmVxID0gbWVzc2FnZS5wYXlsb2FkIGFzIFN1Ym1pdFBoYW50b21UeFJlcXVlc3RcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgc3VibWl0VHhQaGFudG9tKHJlcSlcbiAgICAgICAgICBzZW5kUmVzcG9uc2Uob2soZGF0YSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlIFwiU1VCTUlUX1RYX0RFTEVHQVRFRFwiOiB7XG4gICAgICAgICAgY29uc3QgcmVxID0gbWVzc2FnZS5wYXlsb2FkIGFzIFN1Ym1pdERlbGVnYXRlZFR4UmVxdWVzdFxuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBzdWJtaXRUeERlbGVnYXRlZChyZXEpXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKGRhdGEpKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIlNVQk1JVF9UWF9XRUJBVVRITlwiOiB7XG4gICAgICAgICAgY29uc3QgcmVxID0gbWVzc2FnZS5wYXlsb2FkIGFzIFN1Ym1pdFdlYmF1dGhuVHhSZXF1ZXN0XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHN1Ym1pdFR4V2ViYXV0aG4ocmVxKVxuICAgICAgICAgIHNlbmRSZXNwb25zZShvayhkYXRhKSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgXCJHRVRfREFQUF9QRVJNSVNTSU9OU1wiOiB7XG4gICAgICAgICAgY29uc3QgcmVxID0gbWVzc2FnZS5wYXlsb2FkIGFzIEdldERhcHBQZXJtaXNzaW9uc1JlcXVlc3RcbiAgICAgICAgICBjb25zdCBhbGxvd2VkID0gYXdhaXQgZ2V0RGFwcFBlcm1pc3Npb25zKHJlcS5vcmlnaW4pXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKHsgb3JpZ2luOiByZXEub3JpZ2luLCBhbGxvd2VkIH0pKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIlNFVF9EQVBQX1BFUk1JU1NJT05TXCI6IHtcbiAgICAgICAgICBjb25zdCByZXEgPSBtZXNzYWdlLnBheWxvYWQgYXMgU2V0RGFwcFBlcm1pc3Npb25zUmVxdWVzdFxuICAgICAgICAgIGNvbnN0IGFsbG93ZWQgPSBhd2FpdCBzZXREYXBwUGVybWlzc2lvbnMocmVxLm9yaWdpbiwgcmVxLmFsbG93ZWQpXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKHsgb3JpZ2luOiByZXEub3JpZ2luLCBhbGxvd2VkIH0pKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIkxJU1RfUEVORElOR19EQVBQX1JFUVVFU1RTXCI6IHtcbiAgICAgICAgICBjb25zdCByZXF1ZXN0cyA9IGF3YWl0IGxpc3RQZW5kaW5nRGFwcFJlcXVlc3RzKClcbiAgICAgICAgICBjb25zdCBkYXRhOiBMaXN0UGVuZGluZ0RhcHBSZXF1ZXN0c1Jlc3BvbnNlID0geyByZXF1ZXN0cyB9XG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKGRhdGEpKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBcIlJFU09MVkVfUEVORElOR19EQVBQX1JFUVVFU1RcIjoge1xuICAgICAgICAgIGNvbnN0IHJlcSA9IG1lc3NhZ2UucGF5bG9hZCBhcyBSZXNvbHZlUGVuZGluZ0RhcHBSZXF1ZXN0XG4gICAgICAgICAgY29uc3QgcmVzb2x2ZXIgPSBwZW5kaW5nRGFwcFJlc29sdmVycy5nZXQocmVxLnJlcXVlc3RJZClcbiAgICAgICAgICBwZW5kaW5nRGFwcFJlc29sdmVycy5kZWxldGUocmVxLnJlcXVlc3RJZClcbiAgICAgICAgICBhd2FpdCByZW1vdmVQZW5kaW5nRGFwcFJlcXVlc3QocmVxLnJlcXVlc3RJZClcbiAgICAgICAgICByZXNvbHZlcj8uKHsgYXBwcm92ZWQ6IHJlcS5hcHByb3ZlZCwgc2lnbmVkWGRyOiByZXEuc2lnbmVkWGRyIH0pXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKCkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlIFwiREFQUF9HRVRfUFVCTElDX0tFWVwiOiB7XG4gICAgICAgICAgY29uc3QgcmVxID0gbWVzc2FnZS5wYXlsb2FkIGFzIEdldERhcHBQZXJtaXNzaW9uc1JlcXVlc3RcbiAgICAgICAgICBjb25zdCBhbGxvd2VkID0gYXdhaXQgZ2V0RGFwcFBlcm1pc3Npb25zKHJlcS5vcmlnaW4pXG4gICAgICAgICAgaWYgKCFhbGxvd2VkLmluY2x1ZGVzKFwiZ2V0UHVibGljS2V5XCIpKSB7XG4gICAgICAgICAgICBjb25zdCBhcHByb3ZhbCA9IGF3YWl0IHJlcXVpcmVEYXBwQXBwcm92YWwoeyBvcmlnaW46IHJlcS5vcmlnaW4sIGtpbmQ6IFwiZ2V0UHVibGljS2V5XCIgfSlcbiAgICAgICAgICAgIGlmICghYXBwcm92YWwuYXBwcm92ZWQpIHRocm93IG5ldyBCYWNrZW5kRXJyb3IoXCJVc2VyIHJlamVjdGVkXCIsIHsgc3RhdHVzOiA0MDMsIGNvZGU6IFwidXNlcl9yZWplY3RlZFwiIH0pXG4gICAgICAgICAgICBhd2FpdCBzZXREYXBwUGVybWlzc2lvbnMocmVxLm9yaWdpbiwgbWVyZ2VQZXJtaXNzaW9ucyhhbGxvd2VkLCBcImdldFB1YmxpY0tleVwiKSlcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgeyBhY2NvdW50cywgYWN0aXZlQWNjb3VudElkIH0gPSBhd2FpdCBnZXRBY2NvdW50cygpXG4gICAgICAgICAgY29uc3QgYWN0aXZlID0gYWNjb3VudHMuZmluZCgoYSkgPT4gYS5pZCA9PT0gYWN0aXZlQWNjb3VudElkKSA/PyBhY2NvdW50c1swXVxuICAgICAgICAgIGlmICghYWN0aXZlPy5zbWFydEFjY291bnRBZGRyZXNzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQmFja2VuZEVycm9yKFwiTm8gYWN0aXZlIGFjY291bnRcIiwgeyBzdGF0dXM6IDQwMCwgY29kZTogXCJub19hY2NvdW50XCIgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VuZFJlc3BvbnNlKG9rKHsgcHVibGljS2V5OiBhY3RpdmUuc21hcnRBY2NvdW50QWRkcmVzcyB9KSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgXCJEQVBQX1NJR05fVFJBTlNBQ1RJT05cIjoge1xuICAgICAgICAgIGNvbnN0IHJlcSA9IG1lc3NhZ2UucGF5bG9hZCBhcyBhbnlcbiAgICAgICAgICBjb25zdCBvcmlnaW4gPSAocmVxPy5vcmlnaW4gYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAocmVxPy5yZXF1ZXN0Py5vcmlnaW4gYXMgc3RyaW5nIHwgdW5kZWZpbmVkKVxuICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRPcmlnaW4gPSBvcmlnaW4gPz8gXCJ1bmtub3duXCJcbiAgICAgICAgICBjb25zdCBhbGxvd2VkID0gYXdhaXQgZ2V0RGFwcFBlcm1pc3Npb25zKG5vcm1hbGl6ZWRPcmlnaW4pXG4gICAgICAgICAgaWYgKCFhbGxvd2VkLmluY2x1ZGVzKFwic2lnblRyYW5zYWN0aW9uXCIpKSB7XG4gICAgICAgICAgICBjb25zdCBhcHByb3ZhbCA9IGF3YWl0IHJlcXVpcmVEYXBwQXBwcm92YWwoeyBvcmlnaW46IG5vcm1hbGl6ZWRPcmlnaW4sIGtpbmQ6IFwic2lnblRyYW5zYWN0aW9uXCIgfSlcbiAgICAgICAgICAgIGlmICghYXBwcm92YWwuYXBwcm92ZWQpIHRocm93IG5ldyBCYWNrZW5kRXJyb3IoXCJVc2VyIHJlamVjdGVkXCIsIHsgc3RhdHVzOiA0MDMsIGNvZGU6IFwidXNlcl9yZWplY3RlZFwiIH0pXG4gICAgICAgICAgICBpZiAoIWFwcHJvdmFsLnNpZ25lZFhkcikgdGhyb3cgbmV3IEJhY2tlbmRFcnJvcihcIlNpZ25pbmcgbm90IGNvbXBsZXRlZFwiLCB7IHN0YXR1czogNDAwLCBjb2RlOiBcIm5vX3NpZ25hdHVyZVwiIH0pXG4gICAgICAgICAgICBhd2FpdCBzZXREYXBwUGVybWlzc2lvbnMobm9ybWFsaXplZE9yaWdpbiwgbWVyZ2VQZXJtaXNzaW9ucyhhbGxvd2VkLCBcInNpZ25UcmFuc2FjdGlvblwiKSlcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZShvayh7IHJlc3BvbnNlOiB7IHNpZ25lZFhkcjogYXBwcm92YWwuc2lnbmVkWGRyIH0gfSkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgbmV3IEJhY2tlbmRFcnJvcihcInNpZ25UcmFuc2FjdGlvbiByZXF1aXJlcyB1c2VyIGdlc3R1cmUgdmlhIHBvcHVwXCIsIHsgc3RhdHVzOiA0MDAsIGNvZGU6IFwibm90X3N1cHBvcnRlZFwiIH0pXG4gICAgICAgIH1cblxuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJbbGF0Y2g6YmFja2dyb3VuZF0gbWVzc2FnZSByZWNlaXZlZFwiLCBtZXNzYWdlKVxuICAgICAgICAgIHNlbmRSZXNwb25zZShvaygpKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBzZW5kUmVzcG9uc2UoeyBvazogZmFsc2UsIGVycm9yOiB0b1NlcmlhbGl6YWJsZUVycm9yKGVycikgfSBzYXRpc2ZpZXMgQmFja2dyb3VuZFJlc3BvbnNlKVxuICAgIH0pXG5cbiAgICByZXR1cm4gdHJ1ZSAvLyBrZWVwIGNoYW5uZWwgb3BlbiBmb3IgYXN5bmMgcmVzcG9uc2VzXG4gIH1cbilcblxuZXhwb3J0IHt9XG4iLCJpbXBvcnQgdHlwZSB7XG4gIEJ1aWxkRGVsZWdhdGVkVHhSZXF1ZXN0LFxuICBCdWlsZERlbGVnYXRlZFR4UmVzcG9uc2UsXG4gIEJ1aWxkVHhSZXF1ZXN0LFxuICBCdWlsZFR4UmVzcG9uc2UsXG4gIENyZWF0ZU9yQ29ubmVjdEZyZWlnaHRlclJlcXVlc3QsXG4gIENyZWF0ZU9yQ29ubmVjdEZyZWlnaHRlclJlc3BvbnNlLFxuICBDcmVhdGVPckNvbm5lY3RQYXNza2V5UmVxdWVzdCxcbiAgQ3JlYXRlT3JDb25uZWN0UGFzc2tleVJlc3BvbnNlLFxuICBDcmVhdGVPckNvbm5lY3RQaGFudG9tUmVxdWVzdCxcbiAgQ3JlYXRlT3JDb25uZWN0UGhhbnRvbVJlc3BvbnNlLFxuICBTZXJpYWxpemFibGVFcnJvcixcbiAgU3VibWl0RGVsZWdhdGVkVHhSZXF1ZXN0LFxuICBTdWJtaXRQaGFudG9tVHhSZXF1ZXN0LFxuICBTdWJtaXRUeFJlc3BvbnNlLFxuICBTdWJtaXRXZWJhdXRoblR4UmVxdWVzdFxufSBmcm9tIFwiQGxhdGNoL3R5cGVzXCJcblxuY29uc3QgQkFTRV9VUkwgPSBcImh0dHBzOi8vdjAtbGF0Y2gtc3RlbGxhci52ZXJjZWwuYXBwXCIgYXMgY29uc3RcblxuZXhwb3J0IGNsYXNzIEJhY2tlbmRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcHVibGljIHJlYWRvbmx5IHN0YXR1cz86IG51bWJlclxuICBwdWJsaWMgcmVhZG9ubHkgY29kZT86IHN0cmluZ1xuICBwdWJsaWMgcmVhZG9ubHkgZGV0YWlscz86IHVua25vd25cblxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIG9wdHM/OiB7IHN0YXR1cz86IG51bWJlcjsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSkge1xuICAgIHN1cGVyKG1lc3NhZ2UpXG4gICAgdGhpcy5uYW1lID0gXCJCYWNrZW5kRXJyb3JcIlxuICAgIHRoaXMuc3RhdHVzID0gb3B0cz8uc3RhdHVzXG4gICAgdGhpcy5jb2RlID0gb3B0cz8uY29kZVxuICAgIHRoaXMuZGV0YWlscyA9IG9wdHM/LmRldGFpbHNcbiAgfVxuXG4gIHRvU2VyaWFsaXphYmxlKCk6IFNlcmlhbGl6YWJsZUVycm9yIHtcbiAgICByZXR1cm4geyBtZXNzYWdlOiB0aGlzLm1lc3NhZ2UsIHN0YXR1czogdGhpcy5zdGF0dXMsIGNvZGU6IHRoaXMuY29kZSB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24ganNvbkZldGNoPFRSZXM+KHBhdGg6IHN0cmluZywgaW5pdD86IFJlcXVlc3RJbml0ICYgeyB0aW1lb3V0TXM/OiBudW1iZXIgfSk6IFByb21pc2U8VFJlcz4ge1xuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpXG4gIGNvbnN0IHRpbWVvdXRNcyA9IGluaXQ/LnRpbWVvdXRNcyA/PyAyMF8wMDBcbiAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0TXMpXG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtCQVNFX1VSTH0ke3BhdGh9YCwge1xuICAgICAgLi4uaW5pdCxcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAuLi4oaW5pdD8uaGVhZGVycyA/PyB7fSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcy50ZXh0KClcbiAgICBjb25zdCBkYXRhID0gdGV4dCA/IChKU09OLnBhcnNlKHRleHQpIGFzIHVua25vd24pIDogdW5kZWZpbmVkXG5cbiAgICBpZiAoIXJlcy5vaykge1xuICAgICAgdGhyb3cgbmV3IEJhY2tlbmRFcnJvcihcbiAgICAgICAgKGRhdGEgYXMgYW55KT8uZXJyb3IgPz8gKGRhdGEgYXMgYW55KT8ubWVzc2FnZSA/PyBgUmVxdWVzdCBmYWlsZWQ6ICR7cmVzLnN0YXR1c31gLFxuICAgICAgICB7IHN0YXR1czogcmVzLnN0YXR1cywgZGV0YWlsczogZGF0YSB9XG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGEgYXMgVFJlc1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgQmFja2VuZEVycm9yKSB0aHJvdyBlcnJcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG4gICAgICB0aHJvdyBuZXcgQmFja2VuZEVycm9yKFwiUmVxdWVzdCB0aW1lZCBvdXRcIiwgeyBjb2RlOiBcInRpbWVvdXRcIiB9KVxuICAgIH1cbiAgICB0aHJvdyBuZXcgQmFja2VuZEVycm9yKGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKSlcbiAgfSBmaW5hbGx5IHtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlT3JDb25uZWN0RnJlaWdodGVyKFxuICByZXE6IENyZWF0ZU9yQ29ubmVjdEZyZWlnaHRlclJlcXVlc3Rcbik6IFByb21pc2U8Q3JlYXRlT3JDb25uZWN0RnJlaWdodGVyUmVzcG9uc2U+IHtcbiAgcmV0dXJuIGF3YWl0IGpzb25GZXRjaDxDcmVhdGVPckNvbm5lY3RGcmVpZ2h0ZXJSZXNwb25zZT4oXCIvYXBpL3NtYXJ0LWFjY291bnQvZnJlaWdodGVyXCIsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcSlcbiAgfSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU9yQ29ubmVjdFBoYW50b20oXG4gIHJlcTogQ3JlYXRlT3JDb25uZWN0UGhhbnRvbVJlcXVlc3Rcbik6IFByb21pc2U8Q3JlYXRlT3JDb25uZWN0UGhhbnRvbVJlc3BvbnNlPiB7XG4gIHJldHVybiBhd2FpdCBqc29uRmV0Y2g8Q3JlYXRlT3JDb25uZWN0UGhhbnRvbVJlc3BvbnNlPihcIi9hcGkvc21hcnQtYWNjb3VudFwiLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXEpXG4gIH0pXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVPckNvbm5lY3RQYXNza2V5KFxuICByZXE6IENyZWF0ZU9yQ29ubmVjdFBhc3NrZXlSZXF1ZXN0XG4pOiBQcm9taXNlPENyZWF0ZU9yQ29ubmVjdFBhc3NrZXlSZXNwb25zZT4ge1xuICByZXR1cm4gYXdhaXQganNvbkZldGNoPENyZWF0ZU9yQ29ubmVjdFBhc3NrZXlSZXNwb25zZT4oXCIvYXBpL3NtYXJ0LWFjY291bnQvd2ViYXV0aG5cIiwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxKVxuICB9KVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRUeChyZXE6IEJ1aWxkVHhSZXF1ZXN0KTogUHJvbWlzZTxCdWlsZFR4UmVzcG9uc2U+IHtcbiAgcmV0dXJuIGF3YWl0IGpzb25GZXRjaDxCdWlsZFR4UmVzcG9uc2U+KFwiL2FwaS90cmFuc2FjdGlvbi9idWlsZFwiLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXEpXG4gIH0pXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZERlbGVnYXRlZFR4KHJlcTogQnVpbGREZWxlZ2F0ZWRUeFJlcXVlc3QpOiBQcm9taXNlPEJ1aWxkRGVsZWdhdGVkVHhSZXNwb25zZT4ge1xuICByZXR1cm4gYXdhaXQganNvbkZldGNoPEJ1aWxkRGVsZWdhdGVkVHhSZXNwb25zZT4oXCIvYXBpL3RyYW5zYWN0aW9uL2J1aWxkLWRlbGVnYXRlZFwiLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXEpXG4gIH0pXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdWJtaXRUeFBoYW50b20ocmVxOiBTdWJtaXRQaGFudG9tVHhSZXF1ZXN0KTogUHJvbWlzZTxTdWJtaXRUeFJlc3BvbnNlPiB7XG4gIHJldHVybiBhd2FpdCBqc29uRmV0Y2g8U3VibWl0VHhSZXNwb25zZT4oXCIvYXBpL3RyYW5zYWN0aW9uL3N1Ym1pdFwiLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXEpXG4gIH0pXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdWJtaXRUeERlbGVnYXRlZChyZXE6IFN1Ym1pdERlbGVnYXRlZFR4UmVxdWVzdCk6IFByb21pc2U8U3VibWl0VHhSZXNwb25zZT4ge1xuICByZXR1cm4gYXdhaXQganNvbkZldGNoPFN1Ym1pdFR4UmVzcG9uc2U+KFwiL2FwaS90cmFuc2FjdGlvbi9zdWJtaXQtZGVsZWdhdGVkXCIsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcSlcbiAgfSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1Ym1pdFR4V2ViYXV0aG4ocmVxOiBTdWJtaXRXZWJhdXRoblR4UmVxdWVzdCk6IFByb21pc2U8U3VibWl0VHhSZXNwb25zZT4ge1xuICByZXR1cm4gYXdhaXQganNvbkZldGNoPFN1Ym1pdFR4UmVzcG9uc2U+KFwiL2FwaS90cmFuc2FjdGlvbi9zdWJtaXQtd2ViYXV0aG5cIiwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxKVxuICB9KVxufVxuXG4iLCJleHBvcnRzLmludGVyb3BEZWZhdWx0ID0gZnVuY3Rpb24gKGEpIHtcbiAgcmV0dXJuIGEgJiYgYS5fX2VzTW9kdWxlID8gYSA6IHtkZWZhdWx0OiBhfTtcbn07XG5cbmV4cG9ydHMuZGVmaW5lSW50ZXJvcEZsYWcgPSBmdW5jdGlvbiAoYSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYSwgJ19fZXNNb2R1bGUnLCB7dmFsdWU6IHRydWV9KTtcbn07XG5cbmV4cG9ydHMuZXhwb3J0QWxsID0gZnVuY3Rpb24gKHNvdXJjZSwgZGVzdCkge1xuICBPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIGlmIChrZXkgPT09ICdkZWZhdWx0JyB8fCBrZXkgPT09ICdfX2VzTW9kdWxlJyB8fCBkZXN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVzdCwga2V5LCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2Vba2V5XTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBkZXN0O1xufTtcblxuZXhwb3J0cy5leHBvcnQgPSBmdW5jdGlvbiAoZGVzdCwgZGVzdE5hbWUsIGdldCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVzdCwgZGVzdE5hbWUsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZ2V0LFxuICB9KTtcbn07XG4iLCJpbXBvcnQgdHlwZSB7IEFjY291bnRNb2RlLCBEYXBwUGVybWlzc2lvbiwgR2V0QWNjb3VudHNSZXNwb25zZSwgUGVuZGluZ0RhcHBSZXF1ZXN0LCBTdG9yZWRBY2NvdW50IH0gZnJvbSBcIkBsYXRjaC90eXBlc1wiXG5cbmNvbnN0IFNUT1JBR0VfS0VZUyA9IHtcbiAgc2V0dXBTdGF0ZTogXCJsYXRjaC5zZXR1cFN0YXRlXCIsXG4gIGxlZ2FjeUFjY291bnRQdWJsaWNLZXk6IFwibGF0Y2guYWNjb3VudFB1YmxpY0tleVwiLFxuICBhY2NvdW50czogXCJsYXRjaC5hY2NvdW50c1wiLFxuICBhY3RpdmVBY2NvdW50SWQ6IFwibGF0Y2guYWN0aXZlQWNjb3VudElkXCIsXG4gIGRhcHBQZXJtaXNzaW9uczogXCJsYXRjaC5kYXBwUGVybWlzc2lvbnNcIlxuICAsXG4gIHBlbmRpbmdEYXBwUmVxdWVzdHM6IFwibGF0Y2gucGVuZGluZ0RhcHBSZXF1ZXN0c1wiXG59IGFzIGNvbnN0XG5cbnR5cGUgRGFwcFBlcm1pc3Npb25zU3RvcmUgPSBSZWNvcmQ8c3RyaW5nLCBEYXBwUGVybWlzc2lvbltdIHwgdW5kZWZpbmVkPlxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcmFnZUtleXMoKSB7XG4gIHJldHVybiBTVE9SQUdFX0tFWVNcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzKCk6IFByb21pc2U8R2V0QWNjb3VudHNSZXNwb25zZT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoW1NUT1JBR0VfS0VZUy5hY2NvdW50cywgU1RPUkFHRV9LRVlTLmFjdGl2ZUFjY291bnRJZF0pXG4gIGNvbnN0IGFjY291bnRzID0gKHJlc1tTVE9SQUdFX0tFWVMuYWNjb3VudHNdIGFzIFN0b3JlZEFjY291bnRbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgY29uc3QgYWN0aXZlQWNjb3VudElkID0gcmVzW1NUT1JBR0VfS0VZUy5hY3RpdmVBY2NvdW50SWRdIGFzIHN0cmluZyB8IHVuZGVmaW5lZFxuICByZXR1cm4geyBhY2NvdW50cywgYWN0aXZlQWNjb3VudElkIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldEFjdGl2ZUFjY291bnQoYWNjb3VudElkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgW1NUT1JBR0VfS0VZUy5hY3RpdmVBY2NvdW50SWRdOiBhY2NvdW50SWQgfSlcbn1cblxuZnVuY3Rpb24gbmV3SWQoKSB7XG4gIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cHNlcnRBY2NvdW50KGlucHV0OiBPbWl0PFN0b3JlZEFjY291bnQsIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+ICYgUGFydGlhbDxQaWNrPFN0b3JlZEFjY291bnQsIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+Pikge1xuICBjb25zdCB7IGFjY291bnRzLCBhY3RpdmVBY2NvdW50SWQgfSA9IGF3YWl0IGdldEFjY291bnRzKClcblxuICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gIGNvbnN0IGlkID0gaW5wdXQuaWQgPz8gbmV3SWQoKVxuICBjb25zdCBjcmVhdGVkQXQgPSBpbnB1dC5jcmVhdGVkQXQgPz8gbm93XG5cbiAgY29uc3QgbmV4dDogU3RvcmVkQWNjb3VudCA9IHsgLi4uaW5wdXQsIGlkLCBjcmVhdGVkQXQgfVxuICBjb25zdCBleGlzdGluZ0lkeCA9IGFjY291bnRzLmZpbmRJbmRleCgoYSkgPT4gYS5pZCA9PT0gaWQpXG4gIGNvbnN0IG5leHRBY2NvdW50cyA9XG4gICAgZXhpc3RpbmdJZHggPj0gMCA/IGFjY291bnRzLm1hcCgoYSwgaSkgPT4gKGkgPT09IGV4aXN0aW5nSWR4ID8gbmV4dCA6IGEpKSA6IFsuLi5hY2NvdW50cywgbmV4dF1cblxuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgIFtTVE9SQUdFX0tFWVMuYWNjb3VudHNdOiBuZXh0QWNjb3VudHMsXG4gICAgW1NUT1JBR0VfS0VZUy5hY3RpdmVBY2NvdW50SWRdOiBhY3RpdmVBY2NvdW50SWQgPz8gaWRcbiAgfSlcblxuICByZXR1cm4geyBhY2NvdW50OiBuZXh0LCBhY3RpdmVBY2NvdW50SWQ6IGFjdGl2ZUFjY291bnRJZCA/PyBpZCB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVBY2NvdW50KHBhcmFtczoge1xuICBtb2RlOiBBY2NvdW50TW9kZVxuICBzbWFydEFjY291bnRBZGRyZXNzOiBzdHJpbmdcbiAgZ0FkZHJlc3M/OiBzdHJpbmdcbiAgcGhhbnRvbVB1YmxpY0tleUhleD86IHN0cmluZ1xuICBwYXNza2V5Q3JlZGVudGlhbElkPzogc3RyaW5nXG4gIHBhc3NrZXlLZXlEYXRhSGV4Pzogc3RyaW5nXG59KSB7XG4gIHJldHVybiBhd2FpdCB1cHNlcnRBY2NvdW50KHtcbiAgICBtb2RlOiBwYXJhbXMubW9kZSxcbiAgICBzbWFydEFjY291bnRBZGRyZXNzOiBwYXJhbXMuc21hcnRBY2NvdW50QWRkcmVzcyxcbiAgICBnQWRkcmVzczogcGFyYW1zLmdBZGRyZXNzLFxuICAgIHBoYW50b21QdWJsaWNLZXlIZXg6IHBhcmFtcy5waGFudG9tUHVibGljS2V5SGV4LFxuICAgIHBhc3NrZXlDcmVkZW50aWFsSWQ6IHBhcmFtcy5wYXNza2V5Q3JlZGVudGlhbElkLFxuICAgIHBhc3NrZXlLZXlEYXRhSGV4OiBwYXJhbXMucGFzc2tleUtleURhdGFIZXhcbiAgfSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERhcHBQZXJtaXNzaW9ucyhvcmlnaW46IHN0cmluZyk6IFByb21pc2U8RGFwcFBlcm1pc3Npb25bXT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoW1NUT1JBR0VfS0VZUy5kYXBwUGVybWlzc2lvbnNdKVxuICBjb25zdCBzdG9yZSA9IChyZXNbU1RPUkFHRV9LRVlTLmRhcHBQZXJtaXNzaW9uc10gYXMgRGFwcFBlcm1pc3Npb25zU3RvcmUgfCB1bmRlZmluZWQpID8/IHt9XG4gIHJldHVybiBzdG9yZVtvcmlnaW5dID8/IFtdXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXREYXBwUGVybWlzc2lvbnMob3JpZ2luOiBzdHJpbmcsIGFsbG93ZWQ6IERhcHBQZXJtaXNzaW9uW10pOiBQcm9taXNlPERhcHBQZXJtaXNzaW9uW10+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFtTVE9SQUdFX0tFWVMuZGFwcFBlcm1pc3Npb25zXSlcbiAgY29uc3Qgc3RvcmUgPSAocmVzW1NUT1JBR0VfS0VZUy5kYXBwUGVybWlzc2lvbnNdIGFzIERhcHBQZXJtaXNzaW9uc1N0b3JlIHwgdW5kZWZpbmVkKSA/PyB7fVxuICBjb25zdCBuZXh0OiBEYXBwUGVybWlzc2lvbnNTdG9yZSA9IHsgLi4uc3RvcmUsIFtvcmlnaW5dOiBhbGxvd2VkIH1cbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgW1NUT1JBR0VfS0VZUy5kYXBwUGVybWlzc2lvbnNdOiBuZXh0IH0pXG4gIHJldHVybiBhbGxvd2VkXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0UGVuZGluZ0RhcHBSZXF1ZXN0cygpOiBQcm9taXNlPFBlbmRpbmdEYXBwUmVxdWVzdFtdPiB7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbU1RPUkFHRV9LRVlTLnBlbmRpbmdEYXBwUmVxdWVzdHNdKVxuICByZXR1cm4gKHJlc1tTVE9SQUdFX0tFWVMucGVuZGluZ0RhcHBSZXF1ZXN0c10gYXMgUGVuZGluZ0RhcHBSZXF1ZXN0W10gfCB1bmRlZmluZWQpID8/IFtdXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRQZW5kaW5nRGFwcFJlcXVlc3QocmVxOiBQZW5kaW5nRGFwcFJlcXVlc3QpIHtcbiAgY29uc3QgY3VycmVudCA9IGF3YWl0IGxpc3RQZW5kaW5nRGFwcFJlcXVlc3RzKClcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgW1NUT1JBR0VfS0VZUy5wZW5kaW5nRGFwcFJlcXVlc3RzXTogWy4uLmN1cnJlbnQsIHJlcV0gfSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbW92ZVBlbmRpbmdEYXBwUmVxdWVzdChyZXF1ZXN0SWQ6IHN0cmluZykge1xuICBjb25zdCBjdXJyZW50ID0gYXdhaXQgbGlzdFBlbmRpbmdEYXBwUmVxdWVzdHMoKVxuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgIFtTVE9SQUdFX0tFWVMucGVuZGluZ0RhcHBSZXF1ZXN0c106IGN1cnJlbnQuZmlsdGVyKChyKSA9PiByLmlkICE9PSByZXF1ZXN0SWQpXG4gIH0pXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhclNlc3Npb24oKSB7XG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnJlbW92ZShbXG4gICAgU1RPUkFHRV9LRVlTLmFjY291bnRzLFxuICAgIFNUT1JBR0VfS0VZUy5hY3RpdmVBY2NvdW50SWQsXG4gICAgU1RPUkFHRV9LRVlTLnNldHVwU3RhdGUsXG4gICAgU1RPUkFHRV9LRVlTLmxlZ2FjeUFjY291bnRQdWJsaWNLZXksXG4gICAgU1RPUkFHRV9LRVlTLmRhcHBQZXJtaXNzaW9ucyxcbiAgICBTVE9SQUdFX0tFWVMucGVuZGluZ0RhcHBSZXF1ZXN0c1xuICBdKVxufVxuXG4vKipcbiAqIE9wdGlvbmFsIG9uZS10aW1lIG1pZ3JhdGlvbjogaWYgbGVnYWN5IGBsYXRjaC5hY2NvdW50UHVibGljS2V5YCBleGlzdHMgYW5kIG5vIGFjY291bnRzIGFyZSBwcmVzZW50LFxuICogY3JlYXRlIGEgcGxhY2Vob2xkZXIgYWNjb3VudCBmb3IgVUkgY29udGludWl0eS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGVMZWdhY3lQdWJsaWNLZXlJZk5lZWRlZCgpIHtcbiAgY29uc3QgeyBhY2NvdW50cyB9ID0gYXdhaXQgZ2V0QWNjb3VudHMoKVxuICBpZiAoYWNjb3VudHMubGVuZ3RoID4gMCkgcmV0dXJuXG5cbiAgY29uc3QgcmVzID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFtTVE9SQUdFX0tFWVMubGVnYWN5QWNjb3VudFB1YmxpY0tleV0pXG4gIGNvbnN0IHBrID0gcmVzW1NUT1JBR0VfS0VZUy5sZWdhY3lBY2NvdW50UHVibGljS2V5XSBhcyBzdHJpbmcgfCB1bmRlZmluZWRcbiAgaWYgKCFwaykgcmV0dXJuXG5cbiAgLy8gV2UgZG9uJ3Qga25vdyBzbWFydEFjY291bnRBZGRyZXNzOyBrZWVwIGFzIGdBZGRyZXNzIGZvciBub3cgKHRyZWF0ZWQgYXMgZnJlaWdodGVyLWlzaCkuXG4gIGF3YWl0IGNyZWF0ZUFjY291bnQoeyBtb2RlOiBcImZyZWlnaHRlclwiLCBzbWFydEFjY291bnRBZGRyZXNzOiBcIlwiLCBnQWRkcmVzczogcGsgfSlcbn1cblxuIiwiaW1wb3J0IHNyY0NvbnRlbnRzSW5qZWN0b3IgZnJvbSBcInVybDouLi8uLi8uLi9zcmMvY29udGVudHMvaW5qZWN0b3JcIlxuY2hyb21lLnNjcmlwdGluZy5yZWdpc3RlckNvbnRlbnRTY3JpcHRzKFtcbiAge1wiaWRcIjpcInNyY0NvbnRlbnRzSW5qZWN0b3JcIixcImpzXCI6W3NyY0NvbnRlbnRzSW5qZWN0b3Iuc3BsaXQoXCIvXCIpLnBvcCgpLnNwbGl0KFwiP1wiKVswXV0sXCJtYXRjaGVzXCI6W1wiPGFsbF91cmxzPlwiXSxcInJ1bkF0XCI6XCJkb2N1bWVudF9zdGFydFwiLFwid29ybGRcIjpcIk1BSU5cIn1cbl0pLmNhdGNoKF8gPT4ge30pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vaGVscGVycy9idW5kbGUtdXJsJykuZ2V0QnVuZGxlVVJMKCdpd2lGSScpICsgXCIuLi8uLi9pbmplY3Rvci4wNmIzNjEwOS5qc1wiICsgXCI/XCIgKyBEYXRlLm5vdygpOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgYnVuZGxlVVJMID0ge307XG5cbmZ1bmN0aW9uIGdldEJ1bmRsZVVSTENhY2hlZChpZCkge1xuICB2YXIgdmFsdWUgPSBidW5kbGVVUkxbaWRdO1xuXG4gIGlmICghdmFsdWUpIHtcbiAgICB2YWx1ZSA9IGdldEJ1bmRsZVVSTCgpO1xuICAgIGJ1bmRsZVVSTFtpZF0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0QnVuZGxlVVJMKCkge1xuICB0cnkge1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB2YXIgbWF0Y2hlcyA9ICgnJyArIGVyci5zdGFjaykubWF0Y2goLyhodHRwcz98ZmlsZXxmdHB8KGNocm9tZXxtb3p8c2FmYXJpLXdlYiktZXh0ZW5zaW9uKTpcXC9cXC9bXilcXG5dKy9nKTtcblxuICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAvLyBUaGUgZmlyc3QgdHdvIHN0YWNrIGZyYW1lcyB3aWxsIGJlIHRoaXMgZnVuY3Rpb24gYW5kIGdldEJ1bmRsZVVSTENhY2hlZC5cbiAgICAgIC8vIFVzZSB0aGUgM3JkIG9uZSwgd2hpY2ggd2lsbCBiZSBhIHJ1bnRpbWUgaW4gdGhlIG9yaWdpbmFsIGJ1bmRsZS5cbiAgICAgIHJldHVybiBnZXRCYXNlVVJMKG1hdGNoZXNbMl0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAnLyc7XG59XG5cbmZ1bmN0aW9uIGdldEJhc2VVUkwodXJsKSB7XG4gIHJldHVybiAoJycgKyB1cmwpLnJlcGxhY2UoL14oKD86aHR0cHM/fGZpbGV8ZnRwfChjaHJvbWV8bW96fHNhZmFyaS13ZWIpLWV4dGVuc2lvbik6XFwvXFwvLispXFwvW14vXSskLywgJyQxJykgKyAnLyc7XG59IC8vIFRPRE86IFJlcGxhY2UgdXNlcyB3aXRoIGBuZXcgVVJMKHVybCkub3JpZ2luYCB3aGVuIGllMTEgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC5cblxuXG5mdW5jdGlvbiBnZXRPcmlnaW4odXJsKSB7XG4gIHZhciBtYXRjaGVzID0gKCcnICsgdXJsKS5tYXRjaCgvKGh0dHBzP3xmaWxlfGZ0cHwoY2hyb21lfG1venxzYWZhcmktd2ViKS1leHRlbnNpb24pOlxcL1xcL1teL10rLyk7XG5cbiAgaWYgKCFtYXRjaGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdPcmlnaW4gbm90IGZvdW5kJyk7XG4gIH1cblxuICByZXR1cm4gbWF0Y2hlc1swXTtcbn1cblxuZXhwb3J0cy5nZXRCdW5kbGVVUkwgPSBnZXRCdW5kbGVVUkxDYWNoZWQ7XG5leHBvcnRzLmdldEJhc2VVUkwgPSBnZXRCYXNlVVJMO1xuZXhwb3J0cy5nZXRPcmlnaW4gPSBnZXRPcmlnaW47Il0sIm5hbWVzIjpbXSwidmVyc2lvbiI6MywiZmlsZSI6ImluZGV4LmpzLm1hcCJ9
 globalThis.define=__define;  })(globalThis.define);