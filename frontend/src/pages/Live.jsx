import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useSites } from '../hooks/useSites.js';
import { useLiveAnalytics } from '../hooks/useLiveAnalytics.js';
import { fetchLiveVisitors } from '../services/dashboardApi.js';
import SiteSelector from '../components/SiteSelector.jsx';
import MetricCard from '../components/MetricCard.jsx';

function timeAgo(timestamp) {
  const seconds = Math.round((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

export default function Live() {
  const { sites, selectedSiteId, setSelectedSiteId, loading: sitesLoading } = useSites();
  const { activeVisitors, recentEvents } = useLiveAnalytics(selectedSiteId);
  const [initialDetails, setInitialDetails] = useState([]);

  useEffect(() => {
    if (!selectedSiteId) return;
    fetchLiveVisitors(selectedSiteId).then((data) => setInitialDetails(data.details || []));
  }, [selectedSiteId]);

  if (sitesLoading) return <p style={{ color: '#9598a6' }}>Loading...</p>;

  if (sites.length === 0) {
    return <div className="card empty-state">Set up a site first to see live data.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live</h1>
          <div className="page-subtitle">Real-time visitor activity</div>
        </div>
        <SiteSelector sites={sites} selectedSiteId={selectedSiteId} onChange={setSelectedSiteId} />
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <MetricCard label="Active visitors right now" value={activeVisitors} icon={<Users size={14} />} live />
      </div>

      <div className="card">
        <h3 className="card-title">Live event feed</h3>
        {recentEvents.length === 0 ? (
          <p style={{ color: '#9598a6', fontSize: 13 }}>
            Waiting for activity... open your tracked site in another tab to see events appear here.
          </p>
        ) : (
          <div>
            {recentEvents.map((e, i) => (
              <div className="live-feed-item" key={i}>
                <div>
                  <span className={`badge ${e.type === 'pageview' ? 'badge-pageview' : 'badge-event'}`}>
                    {e.type === 'pageview' ? 'View' : 'Event'}
                  </span>{' '}
                  {e.type === 'pageview' ? e.path : e.eventName}
                  {e.type === 'pageview' && e.country && e.country !== 'unknown' && (
                    <span style={{ color: '#9598a6' }}> · {e.country}</span>
                  )}
                </div>
                <div style={{ color: '#9598a6' }}>{timeAgo(e.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {initialDetails.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title">Currently active pages</h3>
          <table>
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Page</th>
              </tr>
            </thead>
            <tbody>
              {initialDetails.map((v) => (
                <tr key={v.visitorId}>
                  <td>{v.visitorId.slice(0, 8)}...</td>
                  <td>{v.page}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
