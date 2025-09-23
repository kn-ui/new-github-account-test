import React from 'react';
import { ChevronRight } from 'lucide-react';

interface CourseCardProps {
  title: string;
  instructor: string;
  progress: number;
  onClick?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ title, instructor, progress, onClick }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{instructor}</p>
        </div>
        <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;