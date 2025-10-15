import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminActivityService, userService, FirestoreUser } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminActivity, ActivityFilter, adminActivityService as activityService } from '@/lib/adminActivityService';
import { Activity, Search, Filter, Calendar, Users, FileText, Settings } from 'lucide-react';

export default function ManageAdmins() {
  const { userProfile } = useAuth();
  const [admins, setAdmins] = useState<FirestoreUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<FirestoreUser | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [activityFilters, setActivityFilters] = useState<ActivityFilter>({});
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [selectedAdminFilter, setSelectedAdminFilter] = useState('all');

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'super_admin') return;
    loadAdmins();
    loadActivities();
    loadActivityStats();
  }, [userProfile]);

  const loadAdmins = async () => {
    try {
      const all = await userService.getAllUsersIncludingInactive(1000);
      setAdmins(all.filter(u => u.role === 'admin'));
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadActivities = async () => {
    try {
      setLoadingActivities(true);
      const filters: ActivityFilter = {};
      
      if (selectedAdminFilter !== 'all') {
        filters.adminId = selectedAdminFilter;
      }
      if (selectedAction !== 'all') {
        filters.action = selectedAction as any;
      }
      if (selectedResource !== 'all') {
        filters.resource = selectedResource as any;
      }
      if (searchTerm) {
        filters.searchTerm = searchTerm;
      }
      
      const activities = await activityService.getActivities(filters, 100);
      setActivities(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadActivityStats = async () => {
    try {
      const stats = await activityService.getActivityStats();
      setActivityStats(stats);
    } catch (error) {
      console.error('Error loading activity stats:', error);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [selectedAdminFilter, selectedAction, selectedResource, searchTerm]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '🟢';
      case 'UPDATE': return '🟡';
      case 'DELETE': return '🔴';
      default: return '⚪';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'COURSE': return <FileText className="h-4 w-4" />;
      case 'USER': return <Users className="h-4 w-4" />;
      case 'EVENT': return <Calendar className="h-4 w-4" />;
      case 'ANNOUNCEMENT': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (!userProfile || userProfile.role !== 'super_admin') {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Manage Admins & Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admins" className="w-full">
              <TabsList>
                <TabsTrigger value="admins">Admins</TabsTrigger>
                <TabsTrigger value="activities">Activity Log</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="admins" className="mt-4">
                <div className="flex justify-between mb-4">
                  <div className="text-sm text-gray-600">Total Admins: {admins.length}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {admins.map(a => (
                    <div key={a.id} className="p-3 border rounded bg-white">
                      <div className="font-semibold text-gray-800">{a.displayName}</div>
                      <div className="text-sm text-gray-600">{a.email}</div>
                      <div className="text-xs text-gray-500">{a.id}</div>
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedAdminFilter(a.id!)}
                        >
                          View Activity
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activities" className="mt-4">
                {/* Activity Filters */}
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Filter className="h-5 w-5" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Admin Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Admin</Label>
                        <Select value={selectedAdminFilter} onValueChange={setSelectedAdminFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Admins" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Admins</SelectItem>
                            {admins.map(admin => (
                              <SelectItem key={admin.id} value={admin.id!}>
                                {admin.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Action</Label>
                        <Select value={selectedAction} onValueChange={setSelectedAction}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Actions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="CREATE">Create</SelectItem>
                            <SelectItem value="UPDATE">Update</SelectItem>
                            <SelectItem value="DELETE">Delete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Resource Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Resource</Label>
                        <Select value={selectedResource} onValueChange={setSelectedResource}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Resources" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Resources</SelectItem>
                            <SelectItem value="COURSE">Courses</SelectItem>
                            <SelectItem value="USER">Users</SelectItem>
                            <SelectItem value="EVENT">Events</SelectItem>
                            <SelectItem value="ANNOUNCEMENT">Announcements</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Admin Activities
                      </span>
                      <Badge variant="outline">{activities.length} activities</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingActivities ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading activities...</p>
                      </div>
                    ) : activities.length > 0 ? (
                      <div className="space-y-3">
                        {activities.map(activity => (
                          <div key={activity.id} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getActionIcon(activity.action)}</span>
                                  {getResourceIcon(activity.resource)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900">{activity.adminName}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {activity.action}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {activity.resource}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {activity.action.toLowerCase()}d <strong>{activity.resourceName}</strong>
                                  </div>
                                  {activity.details && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {activity.details}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">
                                  {activity.timestamp.toDate().toLocaleString()}
                                </div>
                                {activity.ipAddress && activity.ipAddress !== 'unknown' && (
                                  <div className="text-xs text-gray-400">
                                    IP: {activity.ipAddress}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No activities found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                {activityStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Activities */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Total Activities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                          {activityStats.totalActivities}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Activities by Action */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">By Action</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(activityStats.activitiesByAction).map(([action, count]) => (
                            <div key={action} className="flex justify-between items-center">
                              <span className="flex items-center gap-2">
                                <span>{getActionIcon(action)}</span>
                                {action}
                              </span>
                              <Badge variant="outline">{count as number}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Activities by Resource */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">By Resource</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(activityStats.activitiesByResource).map(([resource, count]) => (
                            <div key={resource} className="flex justify-between items-center">
                              <span className="flex items-center gap-2">
                                {getResourceIcon(resource)}
                                {resource}
                              </span>
                              <Badge variant="outline">{count as number}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading statistics...</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
