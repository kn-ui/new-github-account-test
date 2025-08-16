import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface AnalyticsChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  data: ChartData[];
  title: string;
  height?: number;
  colors?: string[];
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  dataKeys?: string[];
}

const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsChart({
  type,
  data,
  title,
  height = 300,
  colors = defaultColors,
  xAxisDataKey = 'name',
  yAxisDataKey = 'value',
  dataKeys = ['value'],
}: AnalyticsChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length] }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yAxisDataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

// Predefined chart components for common use cases
export function EnrollmentTrendChart({ data }: { data: ChartData[] }) {
  return (
    <AnalyticsChart
      type="line"
      data={data}
      title="Student Enrollment Trends"
      dataKeys={['enrollments']}
      colors={['#3b82f6']}
    />
  );
}

export function CourseCompletionChart({ data }: { data: ChartData[] }) {
  return (
    <AnalyticsChart
      type="bar"
      data={data}
      title="Course Completion Rates"
      dataKeys={['completionRate']}
      colors={['#10b981']}
    />
  );
}

export function UserActivityChart({ data }: { data: ChartData[] }) {
  return (
    <AnalyticsChart
      type="area"
      data={data}
      title="User Activity Over Time"
      dataKeys={['activeUsers']}
      colors={['#8b5cf6']}
    />
  );
}

export function RoleDistributionChart({ data }: { data: ChartData[] }) {
  return (
    <AnalyticsChart
      type="pie"
      data={data}
      title="User Role Distribution"
      colors={['#3b82f6', '#10b981', '#f59e0b']}
    />
  );
}