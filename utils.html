<script>
// ============================================================
// utils.html — Shared frontend helpers.
// Used across multiple page files.
// ============================================================

var utils = {

  // IDR formatter: 800000000 → "IDR 800M"
  formatIDR: function(n) {
    n = Number(n) || 0;
    if (n === 0) return '—';
    if (n >= 1e12) return 'IDR ' + (n/1e12).toFixed(1).replace(/\.0$/,'') + 'T';
    if (n >= 1e9)  return 'IDR ' + (n/1e9 ).toFixed(1).replace(/\.0$/,'') + 'b';
    if (n >= 1e6)  return 'IDR ' + (n/1e6 ).toFixed(0) + 'M';
    return 'IDR ' + n.toLocaleString();
  },

  // Date formatter: "2026-05-14" → "14 May 2026"
  formatDate: function(str) {
    if (!str) return '—';
    var d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  },

  // Short date: "14 May"
  shortDate: function(str) {
    if (!str) return '—';
    var d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
  },

  // Days from today (negative = past)
  daysUntil: function(str) {
    if (!str) return null;
    var d = new Date(str); d.setHours(0,0,0,0);
    var t = new Date();    t.setHours(0,0,0,0);
    return Math.round((d - t) / 86400000);
  },

  // Deadline delta HTML: "+5d", "-9d"
  deadlineDelta: function(str) {
    var days = this.daysUntil(str);
    if (days === null) return '';
    var cls = days < 0 ? 'dl-past' : days <= 7 ? 'dl-near' : days <= 14 ? 'dl-mid' : 'dl-ok';
    var label = (days >= 0 ? '+' : '') + days + 'd';
    return '<span class="dl-delta ' + cls + '">' + label + '</span>';
  },

  // Status pill HTML
  statusPill: function(status) {
    var map = {
      'On Track':    'pill-ontrack',
      'Waiting':     'pill-waiting',
      'Blocked':     'pill-blocked',
      'Completed':   'pill-completed',
      'Upcoming':    'pill-upcoming',
      'Submitted':   'pill-submitted',
      'Negotiating': 'pill-negotiating',
      'Won':         'pill-won',
      'Lost':        'pill-lost',
    };
    var cls = map[status] || 'pill-completed';
    return '<span class="pill ' + cls + '"><span class="pill-dot"></span>' + status + '</span>';
  },

  // Action badge HTML
  actionBadge: function(action) {
    var map = {
      'CREATE':   'ab-create', 'EDIT':     'ab-edit',
      'STATUS':   'ab-status', 'DELETE':   'ab-delete',
      'LOGIN':    'ab-login',  'OVERRIDE': 'ab-override',
    };
    return '<span class="ab ' + (map[action]||'ab-login') + '">' + action + '</span>';
  },

  // Service badge
  svcBadge: function(svc) {
    return '<span class="svc">' + (svc || '—') + '</span>';
  },

  // Entity badge
  entityBadge: function(type) {
    var map = { PRJ:'eb-prj', OPS:'eb-ops', TND:'eb-tnd' };
    return '<span class="eb ' + (map[type]||'eb-prj') + '">' + type + '</span>';
  },

  // Navigate to a page
  nav: function(page) {
    var pages = ['dashboard','projects','operations','tenders','report','history','settings'];
    pages.forEach(function(id) {
      var el = document.getElementById('page-' + id);
      if (el) el.classList.toggle('active', id === page);
      var nb = document.getElementById('nav-' + id);
      if (nb) nb.classList.toggle('active', id === page);
    });
  },

  // Toggle client group collapse
  toggleGroup: function(hdr) {
    var chev = hdr.querySelector('.client-chev');
    var tbl  = hdr.nextElementSibling;
    var open = !chev.classList.contains('closed');
    chev.classList.toggle('closed', open);
    if (tbl) tbl.style.display = open ? 'none' : '';
  },

  // Show toast message (simple)
  toast: function(msg, type) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:'+(type==='error'?'#E05252':'#8BC34A')+';color:#0A0A0A;padding:10px 16px;font-size:12px;font-weight:600;z-index:999;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ document.body.removeChild(t); }, 3000);
  },
};

// Global shorthand
function nav(page){ utils.nav(page); }
function toggleGroup(hdr){ utils.toggleGroup(hdr); }
</script>
