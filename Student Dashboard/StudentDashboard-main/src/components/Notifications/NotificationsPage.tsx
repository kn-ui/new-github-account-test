import React, { useState } from 'react';
import { Bell, ArrowLeft } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const notifications = [
    {
      id: 1,
      title: 'Notification 1',
      time: '45 min ago',
      content: {
        title: 'New Assignment',
        description: 'Write a paper analyzing one major doctrine from Systematic Theology (e.g., the Trinity, Salvation, Christology, or Eschatology). Explain the biblical foundation, historical development, and contemporary relevance of the doctrine. Support your work with scripture references, theological sources, and clear reasoning.'
      },
      read: false
    },
    {
      id: 2,
      title: 'Notification 2',
      time: '1 day ago',
      content: {
        title: 'Grade Released',
        description: 'Your grade for the recent assignment has been released. Please check your grades section for details.'
      },
      read: false
    },
    {
      id: 3,
      title: 'Notification 3',
      time: '1 day ago',
      content: {
        title: 'Upcoming Exam',
        description: 'Reminder: Your Church History exam is scheduled for next week. Please prepare accordingly.'
      },
      read: true
    },
    {
      id: 4,
      title: 'Notification 4',
      time: '5 weeks ago',
      content: {
        title: 'Course Update',
        description: 'There have been updates to your course materials. Please review the latest resources.'
      },
      read: true
    }
  ];

  if (selectedNotification) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedNotification(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification</h1>
          </div>
        </div>

        {/* Notification Detail */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedNotification.content.title}
            </h2>
            <p className="text-sm text-gray-500">{selectedNotification.time}</p>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {selectedNotification.content.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification</h1>
      </div>

      {/* Notifications List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => setSelectedNotification(notification)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors text-left ${
                    notification.read 
                      ? 'hover:bg-gray-50' 
                      : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    notification.read ? 'bg-gray-100' : 'bg-blue-100'
                  }`}>
                    <Bell size={18} className={notification.read ? 'text-gray-400' : 'text-blue-600'} />
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${
                      notification.read ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500">{notification.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a notification to view details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;