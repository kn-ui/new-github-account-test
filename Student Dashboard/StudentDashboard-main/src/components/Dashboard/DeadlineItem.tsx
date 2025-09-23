import React from 'react';
import { FileText, Calendar } from 'lucide-react';

interface DeadlineItemProps {
  title: string;
  course: string;
  date: string;
  type: 'assignment' | 'exam';
  onClick?: () => void;
}

const DeadlineItem: React.FC<DeadlineItemProps> = ({ title, course, date, type, onClick }) => {
  const isOverdue = new Date(date) < new Date();
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={onClick}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        type === 'assignment' ? 'bg-blue-100' : 'bg-red-100'
      }`}>
        {type === 'assignment' ? 
          <FileText size={18} className="text-blue-600" /> :
          <Calendar size={18} className="text-red-600" />
        }
      </div>
      
      <div className="flex-1">
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-sm text-gray-600">{course}</p>
      </div>
      
      <div className="text-right">
        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
          {date}
        </p>
        <p className={`text-xs capitalize ${
          type === 'assignment' ? 'text-blue-600' : 'text-red-600'
        }`}>
          {type}
        </p>
      </div>
    </div>
  );
};

export default DeadlineItem;