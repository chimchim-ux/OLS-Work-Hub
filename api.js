// ============================================================
// js/api.js — All backend calls in one place.
// Change API_URL here and nowhere else.
// CRITICAL:
// - Access code is NEVER stored in session (Auth Blueprint §7)
// - Protected calls require explicit useID + code params
// - Login identifier is useID (lowercase: "chim", "tih"), NOT display Name
// - Backend expects param name "name" for the useID value
// - Backend returns UPPERCASE field names (ID, Client, Status, estRevenue)
// ============================================================

var API_URL = 'https://script.google.com/macros/s/AKfycbzREK-f4OAp7El-Y31ReM5w8yoFMsPFTra3kL5ooHf_UYC6CQWvIZ351Clr0UuF9hVdkg/exec';

var api = {

  // ── INTERNAL: Auth helper (session contains role, userId=useID, name=displayName ONLY)
  // code is NEVER in session — caller manages it in memory
  _auth: function() {
    var s = auth.getSession();
    return s ? { 
      role: s.role, 
      userId: s.userId,  // useID from USERS tab (e.g., "chim") — login identifier
      name: s.name       // Display Name from USERS tab (e.g., "Ami") — UI only
    } : {};
  },

  // ── INTERNAL: GET request with cache-busting
  _get: function(params, cb) {
    params.t = Date.now(); // cache-bust
    var qs = Object.keys(params).map(function(k){ 
      return k + '=' + encodeURIComponent(params[k]); 
    }).join('&');
    
    fetch(API_URL + '?' + qs)
      .then(function(r){ return r.json(); })
      .then(cb)
      .catch(function(e){ 
        console.error('API GET error', e); 
        if (cb) cb({ success:false, error:e.message }); 
      });
  },

  // ── INTERNAL: POST request (NO auto code injection)
  _post: function(payload, cb) {
    var authData = this._auth();
    // Inject userId/name from session if available (code must be passed explicitly)
    if (authData.userId) payload.userId = authData.userId;
    if (authData.name) payload.name = authData.name;
    
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function(r){ return r.json(); })
      .then(cb)
      .catch(function(e){ 
        console.error('API POST error', e); 
        if (cb) cb({ success:false, error:e.message }); 
      });
  },

  // ── PUBLIC ENDPOINTS (no auth required) ──

  health: function(cb) {
    this._get({ action:'health' }, cb);
  },

  getUsers: function(cb) {
    this._get({ action:'getUsers' }, cb);
  },

  // Login: useID is the lowercase identifier from USERS tab (e.g., "chim")
  // Backend expects param "name" to carry the useID value
  login: function(useID, code, cb) {
    this._get({ action:'login', name:useID, code:code }, cb);
  },

  // ── PROTECTED GET ENDPOINTS (explicit useID+code required) ──
  // Code is NOT in session — caller must pass it from login flow

  getData: function(useID, code, cb) {
    this._get({ action:'getData', name:useID, code:code }, cb);
  },

  getSettings: function(useID, code, cb) {
    this._get({ action:'getSettings', name:useID, code:code }, cb);
  },

  // ── PROTECTED POST ENDPOINTS (role-gated + explicit code) ──

  sync: function(entity, payload, useID, code, cb) {
    // Allow backward-compatible signature: sync(entity, payload, cb)
    if (typeof useID === 'function') { cb = useID; useID = null; code = null; }
    else if (typeof code === 'function') { cb = code; code = null; }
    
    payload.action = 'sync';
    payload.entity = entity;
    if (useID) payload.name = useID;  // backend expects 'name' param for useID value
    if (code) payload.code = code;
    
    this._post(payload, cb);
  },

  delete: function(entity, id, useID, code, cb) {
    // Role guard per Main Blueprint §2: Master Admin only
    if (!auth.isRole('masterAdmin')) {
      console.warn('Delete requires masterAdmin role');
      if (cb) cb({ success:false, error:'Permission denied' });
      return;
    }
    // Allow backward-compatible signature
    if (typeof useID === 'function') { cb = useID; useID = null; code = null; }
    else if (typeof code === 'function') { cb = code; code = null; }
    
    var payload = { action:'delete', entity:entity, id:id };
    if (useID) payload.name = useID;
    if (code) payload.code = code;
    
    this._post(payload, cb);
  },

  override: function(entity, payload, useID, code, cb) {
    // Role guard per Main Blueprint §2: Master Admin only
    if (!auth.isRole('masterAdmin')) {
      console.warn('Override requires masterAdmin role');
      if (cb) cb({ success:false, error:'Permission denied' });
      return;
    }
    // Allow backward-compatible signature
    if (typeof useID === 'function') { cb = useID; useID = null; code = null; }
    else if (typeof code === 'function') { cb = code; code = null; }
    
    payload.action = 'override';
    payload.entity = entity;
    if (useID) payload.name = useID;
    if (code) payload.code = code;
    
    this._post(payload, cb);
  },

  // ── ACTIVITY LOGGING (fire-and-forget) ──
  // logAction param renamed to avoid shadowing 'action' payload key

  logActivity: function(logAction, type, itemId, client, summary, useID, code) {
    // Allow minimal signature for internal use
    if (typeof useID !== 'string') {
      var a = this._auth();
      useID = a.userId;  // use userId (useID) for logging
    }
    
    this._post({ 
      action: 'logActivity', 
      logAction: logAction,   // ✅ distinct key to avoid shadowing 'action'
      type: type, 
      itemId: itemId, 
      client: client, 
      summary: summary,
      name: useID,            // backend expects 'name' param for useID value
      code: code
    }, function(resp) {
      if (resp && !resp.success) {
        console.warn('Activity log failed:', resp.error);
      }
    });
  },

  // ── SETTINGS & USER MANAGEMENT (Master Admin only) ──

  updateSettings: function(key, value, useID, code, cb) {
    if (!auth.isRole('masterAdmin')) {
      console.warn('updateSettings requires masterAdmin role');
      if (cb) cb({ success:false, error:'Permission denied' });
      return;
    }
    if (typeof useID === 'function') { cb = useID; useID = null; code = null; }
    else if (typeof code === 'function') { cb = code; code = null; }
    
    this._post({ 
      action:'updateSettings', 
      key:key, 
      value:value, 
      name:useID, 
      code:code 
    }, cb);
  },

  updateUser: function(userAction, payload, useID, code, cb) {
    if (!auth.isRole('masterAdmin')) {
      console.warn('updateUser requires masterAdmin role');
      if (cb) cb({ success:false, error:'Permission denied' });
      return;
    }
    if (typeof useID === 'function') { cb = useID; useID = null; code = null; }
    else if (typeof code === 'function') { cb = code; code = null; }
    
    payload.action = 'updateUser';
    payload.userAction = userAction;
    if (useID) payload.name = useID;
    if (code) payload.code = code;
    
    this._post(payload, cb);
  },

  // ── CONVENIENCE: Session-aware wrappers (use with caution) ──
  // These assume caller manages code in memory (NOT session)

  getDataWithSession: function(code, cb) {
    var s = auth.getSession();
    if (!s || !s.userId) {
      if (cb) cb({ success:false, error:'Not authenticated' });
      return;
    }
    // Caller must supply code explicitly — it is NOT in session
    this.getData(s.userId, code, cb);
  },

  // ── UTILITY: Refresh all data via state module ──
  refreshAll: function(code, cb) {
    var s = auth.getSession();
    if (!s || !s.userId) {
      if (cb) cb({ success:false, error:'Not authenticated' });
      return;
    }
    if (typeof state !== 'undefined' && typeof state.refresh === 'function') {
      state.refresh(s.userId, code, cb);
    } else {
      this.getData(s.userId, code, cb);
    }
  }
};
