export default function SiteSelector({ sites, selectedSiteId, onChange }) {
  if (!sites || sites.length === 0) return null;

  return (
    <select
      className="form-input"
      style={{ width: 'auto', minWidth: 180 }}
      value={selectedSiteId || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {sites.map((s) => (
        <option key={s.siteId} value={s.siteId}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
