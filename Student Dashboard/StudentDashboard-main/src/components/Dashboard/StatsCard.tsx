import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  iconColor: string;
  iconBgColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  iconColor, 
  iconBgColor 
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <Icon size={24} className={iconColor} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;