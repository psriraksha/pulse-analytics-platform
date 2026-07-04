export default function MetricCard({ label, value, icon, live = false }) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        {live && <span className="metric-live-dot" />}
        {icon}
        {label}
      </div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
