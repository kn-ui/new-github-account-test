import React from 'react';

type ColorOption = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'yellow' | 'pink' | 'teal' | 'cyan' | 'indigo' | 'white' | 'gray';

interface DashboardHeroProps {
  title: string;
  subtitle: string;
  color?: ColorOption;
  children?: React.ReactNode; // Add children prop
}

const DashboardHero: React.FC<DashboardHeroProps> = ({ 
  title, 
  subtitle, 
  color = 'white',
  children
}) => {
const colorMap: Record<ColorOption, string> = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-700',
    green: 'bg-gradient-to-r from-green-500 to-green-700',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-700',
    red: 'bg-gradient-to-r from-red-500 to-red-700',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-700',
    yellow: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    pink: 'bg-gradient-to-r from-pink-500 to-pink-700',
    teal: 'bg-gradient-to-r from-teal-500 to-teal-700',
    cyan: 'bg-gradient-to-r from-cyan-500 to-cyan-700',
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-700',
    white: 'bg-gradient-to-r from-gray-100 to-gray-300',
    gray: 'bg-gradient-to-r from-gray-500 to-gray-700',
  };

return (
  <div className={`${colorMap[color]} text-black-100 mb-8 rounded-xl`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row items-center justify-between text-center lg:text-left">
        <div>
          <h1 className="text-3xl ">{title}</h1>
          <p className="text-sm sm:text-base text-black-100 max-w-2xl mt-2">
            {subtitle}
          </p>
        </div>
        {children && <div className="mt-4 lg:mt-0 flex-shrink-0">{children}</div>}
      </div>
    </div>
  </div>
);
};

export default DashboardHero;