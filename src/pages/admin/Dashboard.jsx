// src/pages/Dashboard.jsx
import { UsersIcon, CurrencyDollarIcon, ChartBarIcon, PaperClipIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import DashboardWidget from '../../components/admin/DashboardWidget';
import SalesChart from '../../components/admin/SalesChart';

export default function Dashboard() {
  return (
    <div className='p-3'>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
        <DashboardWidget title="Total Users" value="23" icon={UsersIcon} color="blue" />
        <DashboardWidget title="Bookings" value="74" icon={ListBulletIcon} color="green" />
        <DashboardWidget title="Cancelled Bookings" value="124" icon={PaperClipIcon} color="green" />
        <DashboardWidget title="Revenue" value="$56,576" icon={ChartBarIcon} color="yellow" />
        <DashboardWidget title="Unpaid Bookings" value="24" icon={PaperClipIcon} color="green" />
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <SalesChart />
      </div>
    </div>
  );
}