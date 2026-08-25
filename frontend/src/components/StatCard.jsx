export default function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon${accent ? ' accent' : ''}`}>
        <Icon size={18} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
