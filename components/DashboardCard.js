export default function DashboardCard({ title, value, icon, color, trend, subtitle }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:border-primary-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                trend.type === 'up' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {trend.type === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} ml-4`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm">
            <span className={`mr-2 ${trend.type === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend.type === 'up' ? 'Peningkatan' : 'Penurunan'} dari bulan lalu
            </span>
          </div>
        </div>
      )}
    </div>
  );
}