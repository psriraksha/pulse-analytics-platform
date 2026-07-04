import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Eye, Users, MousePointerClick, Clock, Download, FileText } from 'lucide-react';
import { useSites } from '../hooks/useSites.js';
import { fetchDashboard, getPdfExportUrl, downloadCsv } from '../services/dashboardApi.js';
import SiteSelector from '../components/SiteSelector.jsx';
import MetricCard from '../components/MetricCard.jsx';

const COLORS = ['#6366f1', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#22d3ee'];
const RANGES = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
];

function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export default function Dashboard() {
  const { sites, selectedSiteId, setSelectedSiteId, loading: sitesLoading } = useSites();
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedSiteId) return;
    setLoading(true);
    fetchDashboard(selectedSiteId, range)
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedSiteId, range]);

  async function handleCsvDownload(type) {
    const blob = await downloadCsv(selectedSiteId, type, range);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${selectedSiteId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (sitesLoading) return <p style={{ color: '#9598a6' }}>Loading...</p>;

  if (sites.length === 0) {
    return (
      <div className="card empty-state">
        <p>You don't have any sites set up yet.</p>
        <a href="/setup" className="btn" style={{ display: 'inline-flex', marginTop: 12 }}>
          Go to Setup
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Overview of your site's traffic and engagement</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <SiteSelector sites={sites} selectedSiteId={selectedSiteId} onChange={setSelectedSiteId} />
          <div className="range-tabs">
            {RANGES.map((r) => (
              <button
                key={r.value}
                className={`range-tab ${range === r.value ? 'active' : ''}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <a className="btn btn-secondary" href={getPdfExportUrl(selectedSiteId, range)} target="_blank" rel="noreferrer">
            <FileText size={15} /> PDF
          </a>
          <button className="btn btn-secondary" onClick={() => handleCsvDownload('timeseries')}>
            <Download size={15} /> CSV
          </button>
        </div>
      </div>

      {loading || !data ? (
        <p style={{ color: '#9598a6' }}>Loading dashboard...</p>
      ) : (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Page Views"
              value={data.overview.totalPageViews.toLocaleString()}
              icon={<Eye size={14} />}
            />
            <MetricCard
              label="Unique Visitors"
              value={data.overview.uniqueVisitors.toLocaleString()}
              icon={<Users size={14} />}
            />
            <MetricCard
              label="Bounce Rate"
              value={`${data.overview.bounceRate}%`}
              icon={<MousePointerClick size={14} />}
            />
            <MetricCard
              label="Avg. Session"
              value={formatDuration(data.overview.avgSessionDurationMs)}
              icon={<Clock size={14} />}
            />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Traffic over time</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.timeSeries}>
                <CartesianGrid stroke="#262b38" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#9598a6" fontSize={12} />
                <YAxis stroke="#9598a6" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#171a23', border: '1px solid #262b38', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e9ed' }}
                />
                <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} name="Page Views" />
                <Line
                  type="monotone"
                  dataKey="uniqueVisitors"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  name="Unique Visitors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-grid">
            <div className="card">
              <h3 className="card-title">Top pages</h3>
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th style={{ textAlign: 'right' }}>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((p) => (
                    <tr key={p.path}>
                      <td>{p.path}</td>
                      <td style={{ textAlign: 'right' }}>{p.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className="card-title">Devices</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.deviceBreakdown}
                    dataKey="count"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                  >
                    {data.deviceBreakdown.map((entry, i) => (
                      <Cell key={entry.device} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#171a23', border: '1px solid #262b38' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, fontSize: 12 }}>
                {data.deviceBreakdown.map((d, i) => (
                  <div key={d.device} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: COLORS[i % COLORS.length],
                        display: 'inline-block',
                      }}
                    />
                    {d.device}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-grid-2">
            <div className="card">
              <h3 className="card-title">Browsers</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.browserBreakdown}>
                  <CartesianGrid stroke="#262b38" strokeDasharray="3 3" />
                  <XAxis dataKey="browser" stroke="#9598a6" fontSize={12} />
                  <YAxis stroke="#9598a6" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#171a23', border: '1px solid #262b38' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="card-title">Top referrers</h3>
              {data.topReferrers.length === 0 ? (
                <p style={{ color: '#9598a6', fontSize: 13 }}>No referrer traffic yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th style={{ textAlign: 'right' }}>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topReferrers.map((r) => (
                      <tr key={r.referrer}>
                        <td>{r.referrer}</td>
                        <td style={{ textAlign: 'right' }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Top custom events</h3>
            {data.topEvents.length === 0 ? (
              <p style={{ color: '#9598a6', fontSize: 13 }}>
                No custom events recorded yet. Add <code>data-analytics-event</code> attributes to your buttons and forms.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEvents.map((e) => (
                    <tr key={e.eventName}>
                      <td>{e.eventName}</td>
                      <td style={{ textAlign: 'right' }}>{e.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
