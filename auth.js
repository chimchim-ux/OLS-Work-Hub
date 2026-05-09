// ============================================================
// js/auth.js — Session management and role enforcement.
// Session stored in sessionStorage — cleared on tab close.
// CRITICAL: 
// - Login identifier is useID (lowercase, e.g., "chim"), NOT display name
// - Access code is NEVER stored in session
// - Session.userId = useID from USERS tab
// ============================================================

var auth = {

  // ── SESSION MANAGEMENT ──

  setSession: function(data) {
    // data expected from login response:
    // { role: "masterAdmin", userId: "chim", name: "Ami" }
    // NOTE: userId = useID from USERS tab (login identifier)
    //       name = display name for UI only
    sessionStorage.setItem('wh_session', JSON.stringify({
      role:   data.role,
      userId: data.userId,  // useID from sheet (e.g., "chim")
      name:   data.name,    // Display name (e.g., "Ami")
    }));
  },

  getSession: function() {
    try {
      var raw = sessionStorage.getItem('wh_session');
      return raw ? JSON.parse(raw) : null;
    }
    catch(e) {
      console.warn('Session parse failed', e);
      return null;
    }
  },

  clearSession: function() {
    sessionStorage.removeItem('wh_session');
  },

  // ── ROLE CHECKS (hierarchy: viewer < admin < masterAdmin) ──

  isRole: function(role) {
    var s = this.getSession();
    if (!s || !s.role) return false;
    var hierarchy = { viewer: 1, admin: 2, masterAdmin: 3 };
    var currentLevel = hierarchy[s.role] || 0;
    var requiredLevel = hierarchy[role] || 99;
    return currentLevel >= requiredLevel;
  },

  isMasterAdmin: function() { return this.isRole('masterAdmin'); },
  isAdmin:       function() { return this.isRole('admin'); },
  isViewer:      function() { return this.isRole('viewer'); },

  // ── PROGRAMMATIC GUARD ──

  requireRole: function(role) {
    if (!this.isRole(role)) {
      var s = this.getSession();
      var msg = 'Access denied. Required role: ' + role + (s ? ', current: ' + s.role : ', not authenticated');
      console.warn(msg);
      throw new Error(msg);
    }
  },

  // ── UI GATING ──

  applyRoles: function() {
    var s = this.getSession();
    if (!s || !s.role) return;

    var hierarchy = { viewer: 1, admin: 2, masterAdmin: 3 };
    var currentLevel = hierarchy[s.role] || 0;

    document.querySelectorAll('[data-role]').forEach(function(el) {
      var requiredRole = el.dataset.role;
      var requiredLevel = hierarchy[requiredRole] || 99;
      if (currentLevel >= requiredLevel) {
        el.removeAttribute('hidden');
        el.style.display = '';
      } else {
        el.setAttribute('hidden', '');
        el.style.display = 'none';
      }
    });
  },

  // ── CONVENIENCE: Get current user info ──

  getCurrentUser: function() {
    var s = this.getSession();
    return s ? { 
      userId: s.userId,  // useID (login identifier, e.g., "chim")
      name: s.name,      // Display name (e.g., "Ami")
      role: s.role 
    } : null;
  },

  // ── DEBUG (dev only) ──

  _debug: function() {
    console.log('Session:', this.getSession());
    console.log('Is Master Admin:', this.isMasterAdmin());
    console.log('Is Admin:', this.isAdmin());
    console.log('Is Viewer:', this.isViewer());
  }
};
