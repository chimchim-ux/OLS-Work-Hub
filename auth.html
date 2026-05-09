<script>
// ============================================================
// auth.html — Session management and role enforcement.
// Session stored in sessionStorage — cleared on tab close.
// ============================================================

var auth = {

  setSession: function(data) {
    sessionStorage.setItem('wh_session', JSON.stringify({
      role:   data.role,
      userId: data.userId,
      name:   data.name,
      code:   data._code || '',  // stored temporarily for API calls
    }));
  },

  getSession: function() {
    try { return JSON.parse(sessionStorage.getItem('wh_session')); }
    catch(e) { return null; }
  },

  clearSession: function() {
    sessionStorage.removeItem('wh_session');
  },

  isRole: function(role) {
    var s = this.getSession();
    if (!s) return false;
    var h = { viewer:1, admin:2, masterAdmin:3 };
    return (h[s.role] || 0) >= (h[role] || 99);
  },

  isMasterAdmin: function() { return this.isRole('masterAdmin'); },
  isAdmin:       function() { return this.isRole('admin'); },

  // Apply role-gated UI: hide elements with data-role attribute
  applyRoles: function() {
    var s = this.getSession();
    if (!s) return;
    var h = { viewer:1, admin:2, masterAdmin:3 };
    var level = h[s.role] || 0;
    document.querySelectorAll('[data-role]').forEach(function(el) {
      var req = h[el.dataset.role] || 99;
      el.style.display = level >= req ? '' : 'none';
    });
  },
};
</script>
