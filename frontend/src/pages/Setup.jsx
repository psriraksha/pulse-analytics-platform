import { useEffect, useState } from 'react';
import { fetchSites, createSite } from '../services/dashboardApi.js';
import { API_BASE_URL } from '../services/api.js';
import { Copy, Check, Plus } from 'lucide-react';

export default function Setup() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    setLoading(true);
    try {
      const data = await fetchSites();
      setSites(data);
    } finally {
      setLoading(false);
    }
  }

  function snippetFor(siteId) {
    return `<script src="${API_BASE_URL}/tracker.js?siteId=${siteId}"></script>`;
  }

  function handleCopy(siteId) {
    navigator.clipboard.writeText(snippetFor(siteId));
    setCopiedId(siteId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCreateSite(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await createSite(form);
      setForm({ name: '', domain: '' });
      setShowForm(false);
      await loadSites();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create site');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Setup</h1>
          <div className="page-subtitle">Embed the tracking script on your site to start collecting data</div>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Add site
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Add a new site</h3>
          <form onSubmit={handleCreateSite}>
            <div className="form-group">
              <label className="form-label">Site name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Domain</label>
              <input
                className="form-input"
                placeholder="blog.example.com"
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                required
              />
            </div>
            <button className="btn" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create site'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9598a6' }}>Loading sites...</p>
      ) : sites.length === 0 ? (
        <div className="card empty-state">No sites yet. Add one to get your tracking script.</div>
      ) : (
        sites.map((site) => (
          <div className="card" key={site.siteId} style={{ marginBottom: 16 }}>
            <h3 className="card-title">
              {site.name} <span style={{ color: '#9598a6', fontWeight: 400 }}>— {site.domain}</span>
            </h3>
            <p style={{ fontSize: 13, color: '#9598a6', marginTop: -8 }}>
              Paste this snippet just before the closing <code>&lt;/body&gt;</code> tag on every page you want to track.
            </p>
            <div className="tracking-snippet">{snippetFor(site.siteId)}</div>
            <button
              className="btn btn-secondary"
              style={{ marginTop: 12 }}
              onClick={() => handleCopy(site.siteId)}
            >
              {copiedId === site.siteId ? (
                <>
                  <Check size={15} /> Copied
                </>
              ) : (
                <>
                  <Copy size={15} /> Copy snippet
                </>
              )}
            </button>

            <details style={{ marginTop: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: '#9598a6' }}>
                Track custom events manually
              </summary>
              <p style={{ fontSize: 13, color: '#9598a6', marginTop: 8 }}>
                Use <code>data-analytics-event</code> on any clickable element, or call the JS API directly:
              </p>
              <div className="tracking-snippet">{`<button data-analytics-event="signup_clicked">Sign up</button>

// or in JavaScript:
window.Analytics.track('signup_clicked', { plan: 'pro' });`}</div>
            </details>
          </div>
        ))
      )}
    </div>
  );
}
