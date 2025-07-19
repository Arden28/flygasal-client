// src/components/DashboardWidget.jsx
export default function DashboardWidget({ title, value, icon: Icon, color }) {
  return (
    <div className={`p-2 rounded-lg bg-${color}-100 flex items-center`}>
      <Icon className="w-8 h-8 text-gray-600 mr-4" />
      <div>
        <h3 className="text-gray-600 fs-4">{title}</h3>
        <p className="text-medium font-bold">{value}</p>
      </div>
    </div>
  );
}