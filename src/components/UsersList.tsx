/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  BookOpen,
  Crown
} from 'lucide-react';
import { userService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useI18n } from '@/contexts/I18nContext';
import { Trash2, Edit } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: any;
}

interface UsersListProps {
  readOnly?: boolean;
}

export const UsersList: React.FC<UsersListProps> = ({ readOnly }) => {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ displayName: '', email: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [editAdminOpen, setEditAdminOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [editAdmin, setEditAdmin] = useState({ displayName: '', email: '', role: 'admin' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getUsers(1000);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && user.isActive) ||
                           (filterStatus === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    setFilteredUsers(filtered);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'admin': return <Shield className="h-4 w-4 text-red-600" />;
      case 'teacher': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'student': return <GraduationCap className="h-4 w-4 text-green-600" />;
      default: return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const handleEditAdmin = (user: User) => {
    setEditingAdmin(user);
    setEditAdmin({
      displayName: user.displayName,
      email: user.email,
      role: user.role
    });
    setEditAdminOpen(true);
  };

  const handleDeleteAdmin = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const updateAdmin = async () => {
    if (!editingAdmin) return;
    
    setIsUpdating(true);
    try {
      await userService.updateUser(editingAdmin.id, {
        displayName: editAdmin.displayName,
        email: editAdmin.email,
        role: editAdmin.role as any
      });
      
      setEditAdminOpen(false);
      setEditingAdmin(null);
      setEditAdmin({ displayName: '', email: '', role: 'admin' });
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Failed to update admin');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteAdmin = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await userService.deleteUser(userToDelete.id);
      
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            Loading Users...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-900">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            {t('users.all')} ({filteredUsers.length})
            {(userProfile?.role === 'super_admin') && (
              <button
                className="ml-auto px-3 py-1 text-sm rounded border bg-white hover:bg-blue-50"
                onClick={() => setAddAdminOpen(true)}
              >
                Add Admin
              </button>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Role</label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {user.displayName || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={`flex items-center gap-1 ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize text-xs font-medium">
                        {user.role?.replace('_', ' ')}
                      </span>
                    </Badge>
                    
                    <Badge className={`flex items-center gap-1 ${getStatusColor(user.isActive)}`}>
                      {user.isActive ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </Badge>
                  </div>

                  {/* Created Date */}
                  <div className="mt-3 text-xs text-gray-500">
                    Joined: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </div>
                  
                  {/* Admin Actions - only show for super_admin on admin users */}
                  {userProfile?.role === 'super_admin' && user.role === 'admin' && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAdmin(user)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAdmin(user)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Footer */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'super_admin').length}
              </div>
              <div className="text-sm text-gray-600">Super Admins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-600">Admins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'teacher').length}
              </div>
              <div className="text-sm text-gray-600">Teachers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'student').length}
              </div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Add Admin
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adminName" className="text-right">Name</Label>
              <Input id="adminName" className="col-span-3" value={newAdmin.displayName} onChange={(e)=> setNewAdmin({ ...newAdmin, displayName: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adminEmail" className="text-right">Email</Label>
              <Input id="adminEmail" type="email" className="col-span-3" value={newAdmin.email} onChange={(e)=> setNewAdmin({ ...newAdmin, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setAddAdminOpen(false)}>Cancel</Button>
            <Button disabled={isCreating} onClick={async ()=>{
              setIsCreating(true);
              try {
                // Create admin account via secondary auth
                const password = 'admin123';
                const cred = await createUserWithEmailAndPassword(secondaryAuth, newAdmin.email, password);
                await userService.createUser({
                  uid: cred.user.uid,
                  displayName: newAdmin.displayName,
                  email: newAdmin.email,
                  role: 'admin' as any,
                  isActive: true,
                  passwordChanged: false,
                  createdAt: undefined as any, // set by service
                  updatedAt: undefined as any,
                } as any);
                await signOut(secondaryAuth);
                setAddAdminOpen(false);
                setNewAdmin({ displayName: '', email: '' });
                // Refresh list
                const usersData = await userService.getUsers(1000);
                setUsers(usersData);
              } catch (e) {
                alert('Failed to create admin');
              } finally {
                setIsCreating(false);
              }
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Admin Dialog */}
      <Dialog open={editAdminOpen} onOpenChange={setEditAdminOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAdminName" className="text-right">Name</Label>
              <Input 
                id="editAdminName" 
                className="col-span-3" 
                value={editAdmin.displayName} 
                onChange={(e) => setEditAdmin({ ...editAdmin, displayName: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAdminEmail" className="text-right">Email</Label>
              <Input 
                id="editAdminEmail" 
                type="email" 
                className="col-span-3" 
                value={editAdmin.email} 
                onChange={(e) => setEditAdmin({ ...editAdmin, email: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAdminRole" className="text-right">Role</Label>
              <Select value={editAdmin.role} onValueChange={(value) => setEditAdmin({ ...editAdmin, role: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdminOpen(false)}>Cancel</Button>
            <Button disabled={isUpdating} onClick={updateAdmin}>
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Admin"
        description={`Are you sure you want to delete "${userToDelete?.displayName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={deleteAdmin}
        disabled={isDeleting}
      />
    </div>
  );
};