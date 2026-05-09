<script>
// ============================================================
// state.html — In-memory data store
// All pages read from state — never fetch directly.
// Populated once on login via getData, refreshed on demand.
// ============================================================

var state = {
  projects:   [],
  ops:        [],
  tenders:    [],
  history:    [],

  load: function(data) {
    this.projects = data.projects   || [];
    this.ops      = data.operations || [];
    this.tenders  = data.tenders    || [];
    this.history  = data.history    || [];
  },

  refresh: function(onDone) {
    var session = auth.getSession();
    if (!session) return;
    api.getData(session.name, session.code, function(data) {
      if (data && data.success) {
        state.load(data);
        if (typeof onDone === 'function') onDone();
      }
    });
  },

  getById: function(id) {
    var all = this.projects.concat(this.ops).concat(this.tenders);
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  },

  // ── DERIVED: KPI counts ──
  activeProjects:   function() { return this.projects.filter(function(p){ return p.status !== 'Completed'; }).length; },
  activeOps:        function() { return this.ops.filter(function(o){ return o.status !== 'Completed'; }).length; },
  openTenders:      function() { return this.tenders.filter(function(t){ return t.status !== 'Won' && t.status !== 'Lost'; }).length; },
  blockedItems:     function() {
    return this.projects.filter(function(p){ return p.status === 'Blocked'; }).length
         + this.ops.filter(function(o){ return o.status === 'Blocked'; }).length;
  },

  // ── DERIVED: Portfolio Health (excludes Completed) ──
  portfolioHealth: function() {
    var active = this.projects.concat(this.ops).filter(function(x){ return x.status !== 'Completed'; });
    var onTrack = active.filter(function(x){ return x.status === 'On Track'; }).length;
    var waiting = active.filter(function(x){ return x.status === 'Waiting';  }).length;
    var blocked = active.filter(function(x){ return x.status === 'Blocked';  }).length;
    return { total: active.length, onTrack: onTrack, waiting: waiting, blocked: blocked };
  },

  // ── DERIVED: Tender Pipeline counts ──
  tenderPipeline: function(period) {
    var now   = new Date();
    var start = period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), 0, 1);
    var end   = period === 'month' ? new Date(now.getFullYear(), now.getMonth()+1, 0) : new Date(now.getFullYear(), 11, 31);
    var filtered = this.tenders.filter(function(t) {
      var d = new Date(t.deadline);
      return d >= start && d <= end;
    });
    var counts = { Upcoming:0, Submitted:0, Negotiating:0, Won:0, Lost:0 };
    filtered.forEach(function(t){ if (counts[t.status] !== undefined) counts[t.status]++; });
    return counts;
  },

  // ── DERIVED: This Week's Focus (max 6) ──
  focus: function() {
    var today  = new Date();
    var in14   = new Date(today); in14.setDate(today.getDate() + 14);
    var items  = [];

    // Projects deadline ≤ 14 days
    this.projects.filter(function(p){
      if (p.status === 'Completed') return false;
      var d = new Date(p.deadline);
      return d >= today && d <= in14;
    }).forEach(function(p){ items.push({ type:'PRJ', entity:p, sort: new Date(p.deadline) }); });

    // Ops Waiting/Blocked
    this.ops.filter(function(o){
      return o.status === 'Waiting' || o.status === 'Blocked';
    }).forEach(function(o){ items.push({ type:'OPS', entity:o, sort: new Date(o.deadline || '9999') }); });

    // Tenders with next upcoming milestone
    this.tenders.forEach(function(t) {
      if (!t.milestones || !t.milestones.length) return;
      var upcoming = t.milestones.filter(function(m){ return new Date(m.deadline) >= today; });
      if (!upcoming.length) return;
      upcoming.sort(function(a,b){ return new Date(a.deadline)-new Date(b.deadline); });
      items.push({ type:'TND', entity:t, milestone:upcoming[0], sort: new Date(upcoming[0].deadline) });
    });

    items.sort(function(a,b){ return a.sort - b.sort; });
    return items.slice(0, 6);
  },

  // ── GROUP by client ──
  groupByClient: function(arr) {
    var groups = {};
    var order  = [];
    arr.forEach(function(item) {
      if (!groups[item.client]) { groups[item.client] = []; order.push(item.client); }
      groups[item.client].push(item);
    });
    return order.map(function(c){ return { client:c, items:groups[c] }; });
  },
};
</script>
