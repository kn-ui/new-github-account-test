import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationItemProps {
  title: string;
  time: string;
  read?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ title, time, read = false }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
      read ? 'hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
    }`}>
      <div className={`w-2 h-2 rounded-full ${read ? 'bg-gray-300' : 'bg-blue-600'}`}></div>
      <Bell size={16} className={read ? 'text-gray-400' : 'text-blue-600'} />
      <div className="flex-1">
        <p className={`text-sm ${read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
};

export default NotificationItem;