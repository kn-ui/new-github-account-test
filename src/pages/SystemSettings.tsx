import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Bell, 
  Shield, 
  BarChart3, 
  Link, 
  Activity,
  Eye,
  Download,
  Save,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('activity-logs');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const tabs = [
    { id: 'activity-logs', label: 'User Activity Logs', icon: Activity },
    { id: 'notifications', label: 'System Notifications', icon: Bell },
    { id: 'access-control', label: 'Role-Based Access', icon: Shield },
    { id: 'reports', label: 'Report Generation', icon: BarChart3 },
    { id: 'integrations', label: 'System Integration', icon: Link },
  ];

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const generateActivityLog = async () => {
    try {
      setGenerating(true);
      // Simulate generating activity log
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Activity log generated successfully');
    } catch (error) {
      toast.error('Failed to generate activity log');
    } finally {
      setGenerating(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setSending(true);
      // Simulate sending test notification
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Test notification sent successfully');
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <LoadingButton onClick={handleSaveSettings} loading={loading} loadingText="Saving…">
            Save All Settings
          </LoadingButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* User Activity Logs */}
        {activeTab === 'activity-logs' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>User Activity Logs</span>
                </CardTitle>
                <CardDescription>
                  Monitor and export user activity across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Log Retention Period</Label>
                    <Select defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Log Level</Label>
                    <Select defaultValue="info">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Auto-export Frequency</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <LoadingButton onClick={generateActivityLog} loading={generating} loadingText="Generating…">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Activity Log
                  </LoadingButton>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Recent Logs
                  </Button>
                </div>

                {/* Sample Activity Log */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Recent Activity (Last 24 hours)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>User login: john.doe@example.com</span>
                      <span className="text-gray-500">2 minutes ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Course created: "Advanced Mathematics"</span>
                      <span className="text-gray-500">15 minutes ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User registration: jane.smith@example.com</span>
                      <span className="text-gray-500">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* System Notifications */}
        {activeTab === 'notifications' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>System Notifications</span>
                </CardTitle>
                <CardDescription>
                  Configure system-wide notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Send notifications via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-500">Send push notifications to users</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Send notifications via SMS</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>System Maintenance Notifications</Label>
                    <Textarea 
                      placeholder="Enter system maintenance notification message"
                      defaultValue="System will be under maintenance from 2:00 AM to 4:00 AM EST. We apologize for any inconvenience."
                    />
                  </div>
                  
                  <div>
                    <Label>Emergency Contact Email</Label>
                    <Input 
                      type="email" 
                      placeholder="admin@example.com"
                      defaultValue="admin@example.com"
                    />
                  </div>
                </div>

                <LoadingButton onClick={sendTestNotification} variant="outline" loading={sending} loadingText="Sending…">
                  <Bell className="h-4 w-4 mr-2" />
                  Send Test Notification
                </LoadingButton>
              </CardContent>
            </Card>
          </>
        )}

        {/* Role-Based Access Control */}
        {activeTab === 'access-control' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Role-Based Access Control</span>
                </CardTitle>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Admin Permissions</h4>
                    <div className="space-y-2">
                      {['User Management', 'Course Management', 'System Settings', 'Reports', 'Event Management'].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Switch defaultChecked />
                          <span className="text-sm">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Teacher Permissions</h4>
                    <div className="space-y-2">
                      {['Course Creation', 'Student Management', 'Assignment Management', 'Grading', 'Course Materials'].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Switch defaultChecked />
                          <span className="text-sm">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Custom Role Creation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Role Name</Label>
                      <Input placeholder="e.g., Moderator" />
                    </div>
                    <div>
                      <Label>Role Description</Label>
                      <Input placeholder="Description of the role" />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline">Create Role</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Report Generation */}
        {activeTab === 'reports' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Report Generation</span>
                </CardTitle>
                <CardDescription>
                  Configure automated report generation and delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Automated Reports</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Daily System Health Report</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weekly User Activity Summary</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Monthly Course Performance Report</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Quarterly Financial Summary</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Report Delivery</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Delivery Email</Label>
                        <Input type="email" placeholder="reports@example.com" />
                      </div>
                      <div>
                        <Label>Delivery Time</Label>
                        <Select defaultValue="09:00">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="06:00">6:00 AM</SelectItem>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="18:00">6:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Report Format</Label>
                        <Select defaultValue="pdf">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* System Integration */}
        {activeTab === 'integrations' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="h-5 w-5" />
                  <span>System Integration</span>
                </CardTitle>
                <CardDescription>
                  Configure integrations with external systems and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Google Workspace Integration</h4>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Sync with Google Calendar, Drive, and Classroom
                    </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Configure</Button>
                      <Button variant="outline" size="sm">Disconnect</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Microsoft 365 Integration</h4>
                      <Badge variant="secondary">Not Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Integrate with Teams, SharePoint, and OneDrive
                    </p>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Payment Gateway</h4>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Stripe payment processing integration
                    </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Configure</Button>
                      <Button variant="outline" size="sm">View Transactions</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Email Service</h4>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      SendGrid email delivery service
                    </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Configure</Button>
                      <Button variant="outline" size="sm">View Analytics</Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">API Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>API Key</Label>
                      <Input placeholder="Enter API key" type="password" />
                    </div>
                    <div>
                      <Label>Webhook URL</Label>
                      <Input placeholder="https://example.com/webhook" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm">Generate New API Key</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}