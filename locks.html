<script>
// ============================================================
// locks.html — Edit lock management.
// Open on modal → clear on save/cancel.
// Conflict check: compare Updated timestamps.
// ============================================================

var locks = {
  _pending: null, // { entity, payload } for override flow

  open: function(itemId) {
    // Fire-and-forget: log that this user opened the record
    api.logActivity('EDIT', 'lock', itemId, '', 'Opened for editing');
  },

  clear: function(itemId) {
    // No-op on frontend — backend clears on sync/delete
    // Kept for future explicit EDITLOCKS endpoint
  },

  // Called after a sync returns conflict:true
  // Stores payload so Override button can retry
  storeConflict: function(entity, payload) {
    this._pending = { entity:entity, payload:payload };
    document.getElementById('conflictModal').classList.add('open');
    document.getElementById('conflictOverride').onclick = function() {
      locks.doOverride();
    };
  },

  doOverride: function() {
    if (!this._pending) return;
    var e = this._pending.entity;
    var p = this._pending.payload;
    this._pending = null;
    document.getElementById('conflictModal').classList.remove('open');
    api.override(e, p, function(data) {
      if (data.success) {
        utils.toast('Override saved.', 'success');
        closeModal();
        state.refresh(function(){ renderCurrentPage(); });
      } else {
        utils.toast('Override failed: ' + data.error, 'error');
      }
    });
  },
};

function closeConflict() {
  locks._pending = null;
  document.getElementById('conflictModal').classList.remove('open');
}
</script>
