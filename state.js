// ============================================================
// js/state.js — In-memory data store
// All pages read from state — never fetch directly.
// Populated once on login via getData, refreshed on demand.
// CRITICAL: Backend returns UPPERCASE field names (ID, Client, Status, etc.)
// ============================================================

var state = {
  projects:   [],
  ops:        [],
  tenders:    [],
  history:    [],
  _loading:   false,
  _lastRefresh: null,

  // ── LOAD: Populate arrays from getData response ──
  load: function(data) {
    if (!data) return;
    // Backend returns uppercase keys; defensive fallback to lowercase
    this.projects = data.projects || data.Projects || [];
    this.ops      = data.operations || data.Operations || [];
    this.tenders  = data.tenders || data.Tenders || [];
    this.history  = data.history || data.History || [];
    this._lastRefresh = new Date();
  },

  // ── REFRESH: Re-fetch all data from backend ──
  // Signature: refresh(useID, code, onDone) OR refresh(onDone)
  // Caller must supply code explicitly — it is NOT in session
  refresh: function(useID, code, onDone) {
    // Handle flexible argument order
    if (typeof useID === 'function') { onDone = useID; useID = null; code = null; }
    else if (typeof code === 'function') { onDone = code; code = null; }
    
    var session = auth.getSession();
    if (!session) {
      console.warn('Refresh failed: no session');
      if (typeof onDone === 'function') onDone('Not authenticated');
      return;
    }
    
    var authUseID = useID || session.userId; // session.userId = useID from USERS tab
    // code must be supplied by caller if backend requires it
    if (!code) {
      console.warn('Refresh called without code — ensure backend accepts name-only or supply code');
    }
    
    this._loading = true;
    api.getData(authUseID, code, function(data) {
      state._loading = false;
      if (data && data.success) {
        state.load(data);
        if (typeof onDone === 'function') onDone(null, data);
      } else {
        var err = (data && data.error) ? data.error : 'Refresh failed';
        console.warn('State refresh error:', err);
        if (typeof onDone === 'function') onDone(err);
      }
    });
  },

  // ── LOOKUP: Find record by ID across all entities ──
  getById: function(id) {
    if (!id) return null;
    var all = this.projects.concat(this.ops).concat(this.tenders);
    for (var i = 0; i < all.length; i++) {
      if (all[i].ID === id) return all[i]; // ✅ Uppercase ID per schema
    }
    return null;
  },

  // ── STATUS: Loading state helpers ──
  isLoading: function() { return this._loading; },
  getLastRefresh: function() { return this._lastRefresh; },

  // ── DERIVED: KPI counts ──
  activeProjects: function() {
    return this.projects.filter(function(p){ return p.Status !== 'Completed'; }).length;
  },
  activeOps: function() {
    return this.ops.filter(function(o){ return o.Status !== 'Completed'; }).length;
  },
  openTenders: function() {
    return this.tenders.filter(function(t){ 
      return t.Status !== 'Won' && t.Status !== 'Lost'; 
    }).length;
  },
  blockedItems: function() {
    return this.projects.filter(function(p){ return p.Status === 'Blocked'; }).length
         + this.ops.filter(function(o){ return o.Status === 'Blocked'; }).length;
  },

  // ── DERIVED: Portfolio Health (excludes Completed) ──
  portfolioHealth: function() {
    var active = this.projects.concat(this.ops).filter(function(x){ return x.Status !== 'Completed'; });
    return {
      total: active.length,
      onTrack: active.filter(function(x){ return x.Status === 'On Track'; }).length,
      waiting: active.filter(function(x){ return x.Status === 'Waiting';  }).length,
      blocked: active.filter(function(x){ return x.Status === 'Blocked';  }).length
    };
  },

  // ── DERIVED: Tender Pipeline counts (filtered by period) ──
  tenderPipeline: function(period) {
    var now   = new Date();
    var start = period === 'month' 
      ? new Date(now.getFullYear(), now.getMonth(), 1) 
      : new Date(now.getFullYear(), 0, 1);
    var end   = period === 'month' 
      ? new Date(now.getFullYear(), now.getMonth()+1, 0) 
      : new Date(now.getFullYear(), 11, 31);
    
    var filtered = this.tenders.filter(function(t) {
      if (!t.Deadline) return false;
      var d = new Date(t.Deadline);
      return !isNaN(d) && d >= start && d <= end;
    });
    
    var counts = { Upcoming:0, Submitted:0, Negotiating:0, Won:0, Lost:0 };
    filtered.forEach(function(t){ 
      if (counts[t.Status] !== undefined) counts[t.Status]++; 
    });
    return counts;
  },

  // ── DERIVED: This Week's Focus (max 6 items) ──
  focus: function() {
    var today  = new Date();
    var in14   = new Date(today); in14.setDate(today.getDate() + 14);
    var items  = [];
    var farFuture = new Date(9999, 11, 31); // ✅ Valid far-future date

    // Projects: deadline ≤ 14 days, not Completed
    this.projects.filter(function(p){
      if (p.Status === 'Completed') return false;
      if (!p.Deadline) return false;
      var d = new Date(p.Deadline);
      return !isNaN(d) && d >= today && d <= in14;
    }).forEach(function(p){ 
      items.push({ type:'PRJ', entity:p, sort: new Date(p.Deadline) }); 
    });

    // Ops: Waiting or Blocked status
    this.ops.filter(function(o){
      return o.Status === 'Waiting' || o.Status === 'Blocked';
    }).forEach(function(o){ 
      var sortDate = o.Deadline ? new Date(o.Deadline) : farFuture;
      items.push({ type:'OPS', entity:o, sort: sortDate }); 
    });

    // Tenders: next upcoming milestone (schema: milestones[{ label, date }])
    this.tenders.forEach(function(t) {
      if (!t.milestones || !Array.isArray(t.milestones) || !t.milestones.length) return;
      var upcoming = t.milestones.filter(function(m){ 
        if (!m.date) return false;
        var d = new Date(m.date);
        return !isNaN(d) && d >= today;
      });
      if (!upcoming.length) return;
      upcoming.sort(function(a,b){ return new Date(a.date) - new Date(b.date); });
      items.push({ 
        type:'TND', 
        entity:t, 
        milestone: upcoming[0], 
        sort: new Date(upcoming[0].date) // ✅ 'date' per schema, not 'deadline'
      });
    });

    items.sort(function(a,b){ return a.sort - b.sort; });
    return items.slice(0, 6);
  },

  // ── GROUP by client (uppercase 'Client' per schema) ──
  groupByClient: function(arr) {
    if (!Array.isArray(arr)) return [];
    var groups = {};
    var order  = [];
    arr.forEach(function(item) {
      var client = item.Client; // ✅ Uppercase per schema
      if (!client) client = 'Unknown';
      if (!groups[client]) { groups[client] = []; order.push(client); }
      groups[client].push(item);
    });
    return order.map(function(c){ return { client:c, items:groups[c] }; });
  },

  // ── REVENUE HELPERS (per Main Blueprint §15) ──
  // Sum estRevenue by service line for a given entity type
  revenueByService: function(entityType) {
    var source = entityType === 'ops' ? this.ops : 
                 entityType === 'projects' ? this.projects : 
                 entityType === 'tenders' ? this.tenders : [];
    var totals = {};
    source.forEach(function(item) {
      var svc = item.Service || 'Other';
      var rev = item.estRevenue || 0;
      totals[svc] = (totals[svc] || 0) + rev;
    });
    return totals;
  },

  // Conversion rate per client: opsRevenue / (ops + pipeline) * 100
  clientConversion: function(clientName) {
    var opsRev = this.ops.filter(function(o){ return o.Client === clientName; })
      .reduce(function(sum, o){ return sum + (o.estRevenue||0); }, 0);
    var pipeRev = this.projects.filter(function(p){ return p.Client === clientName; })
      .reduce(function(sum, p){ return sum + (p.estRevenue||0); }, 0) +
      this.tenders.filter(function(t){ return t.Client === clientName; })
      .reduce(function(sum, t){ return sum + (t.estRevenue||0); }, 0);
    var total = opsRev + pipeRev;
    return total > 0 ? Math.round((opsRev / total) * 100) : 0;
  }
};
