/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Search, 
  Download,
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Shield,
  UserPlus,
  FileSpreadsheet,
  User,
  Eye,
  Award
} from 'lucide-react';
import { userService, studentMetaService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CSVUpload from '@/components/ui/CSVUpload';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: any; // Timestamp from Firestore
  deliveryMethod?: string;
  studentGroup?: string;
  programType?: string;
  classSection?: string;
}

const UserManager = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const { createUser, userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterRole, setFilterRole] = useState('all'); // 'all', 'student', 'teacher', 'admin', 'super_admin' 
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false); // New state for edit dialog
  const [editingUser, setEditingUser] = useState<User | null>(null); // New state for user being edited
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; role: string } | null>(null);
  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    role: 'student' as 'student' | 'teacher' | 'admin' | 'super_admin',
    password: '',
    deliveryMethod: '',
    studentGroup: '',
    programType: '',
    classSection: ''
  });
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [isCreatingUser, setIsCreatingUser] = useState(false); // Loading state for user creation
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [studentMeta, setStudentMeta] = useState<{ deliveryMethods: string[]; studentGroups: string[]; programTypes: string[]; classSections: string[] }>({ deliveryMethods: [], studentGroups: [], programTypes: [], classSections: [] });
  const [customMetaInputs, setCustomMetaInputs] = useState<{ deliveryMethod: string; studentGroup: string; programType: string; classSection: string }>({ deliveryMethod: '', studentGroup: '', programType: '', classSection: '' });

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalStudents = users.filter(u => u.role === 'student').length;

  useEffect(() => {
    fetchUsers();
  }, [showArchived]);

  // Load student metadata presets when the add-user dialog opens
  useEffect(() => {
    if (isAddUserOpen) {
      (async () => {
        try {
          const opts = await studentMetaService.getOptions();
          setStudentMeta(opts);
        } catch (e) {
          console.error('Failed to load student meta options', e);
        }
      })();
    }
  }, [isAddUserOpen]);

  const addCustomMeta = async (kind: 'deliveryMethods' | 'studentGroups' | 'programTypes' | 'classSections') => {
    const mapKeyToInput: Record<typeof kind, keyof typeof customMetaInputs> = {
      deliveryMethods: 'deliveryMethod',
      studentGroups: 'studentGroup',
      programTypes: 'programType',
      classSections: 'classSection',
    };
    const inputKey = mapKeyToInput[kind];
    const value = customMetaInputs[inputKey].trim();
    if (!value) return;
    try {
      await studentMetaService.addOption(kind as any, value);
      const updated = await studentMetaService.getOptions();
      setStudentMeta(updated);
      setNewUser(prev => ({ ...prev, [inputKey]: value }));
      setCustomMetaInputs(prev => ({ ...prev, [inputKey]: '' }));
    } catch (e) {
      console.error('Failed to add option', e);
      alert('Failed to add option');
    }
  };

  useEffect(() => {
    const filtered = users.filter(user =>
      (user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterRole === 'all' || user.role === filterRole)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users, filterRole]);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = showArchived 
        ? await userService.getAllUsersIncludingInactive()
        : await userService.getUsers();
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string, userRole: string) => {
    if (userRole === 'admin' || userRole === 'super_admin') {
      alert(t('users.cannotDeleteAdmin'));
      return;
    }
    
    setUserToDelete({ id: userId, name: userName, role: userRole });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await userService.deleteUser(userToDelete.id);
      fetchUsers();
    } catch (error) {
      console.error(t('users.errors.deleteFailed'), error);
    }
  };

  const handleAddUser = async () => {
    setIsCreatingUser(true); // Start loading
    try {
      // Enforce role restrictions: Admin can only create teachers and students
      const creatorRole = userProfile?.role;
      const allowedForAdmin = ['student','teacher'];
      if (creatorRole === 'admin' && !allowedForAdmin.includes(newUser.role)) {
        alert('Admins can only create Teachers and Students');
        return;
      }
      // SOLUTION: Use secondary Firebase auth to prevent admin redirects
      // 
      // Problem: When admin creates users with createUserWithEmailAndPassword,
      // Firebase automatically signs in the new user, triggering onAuthStateChanged
      // and causing unwanted redirects to the new user's dashboard.
      //
      // Solution: Use a separate Firebase app instance (secondaryAuth) for user creation.
      // This keeps the main app's auth state unchanged, preventing redirects.
      
      // Set a flag to suppress auth redirects during user creation (extra safety)
      sessionStorage.setItem('suppressAuthRedirect', 'true');
      
      const defaultPasswords = {
        student: 'student123',
        teacher: 'teacher123',
        admin: 'admin123',
        super_admin: 'superadmin123'
      };
      const password = defaultPasswords[newUser.role];

      // Use secondary auth to create user - this prevents the main app from being affected
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newUser.email, 
        password
      );
      
      // Create Firestore user profile using the UID from secondary auth
      const studentData = newUser.role === 'student' ? {
        ...(newUser.deliveryMethod && { deliveryMethod: newUser.deliveryMethod }),
        ...(newUser.studentGroup && { studentGroup: newUser.studentGroup }),
        ...(newUser.programType && { programType: newUser.programType }),
        ...(newUser.classSection && { classSection: newUser.classSection }),
      } : {};

      await userService.createUser({
        displayName: newUser.displayName,
        email: newUser.email,
        role: newUser.role,
        isActive: true,
        uid: userCredential.user.uid,
        passwordChanged: false, // New users must change their password
        ...studentData
      });
      
      // Immediately sign out from secondary auth to clean up
      await signOut(secondaryAuth);
      
      // Clear the suppress flag
      sessionStorage.removeItem('suppressAuthRedirect');
      
      setIsAddUserOpen(false);
      setNewUser({ displayName: '', email: '', role: 'student', password: '', deliveryMethod: '', studentGroup: '', programType: '', classSection: '' });
      fetchUsers();
    } catch (error: any) {
      // Clear the suppress flag on error
      sessionStorage.removeItem('suppressAuthRedirect');
      
      // Handle specific Firebase auth errors with user-friendly messages
      let errorMessage = 'An error occurred while creating the user.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = `The email "${newUser.email}" is already registered. Please use a different email address.`;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error message
      alert(errorMessage);
      console.error('Error creating user:', error);
    } finally {
      setIsCreatingUser(false); // Stop loading
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      setIsUpdatingUser(true);
      const updateData: any = {
        displayName: editingUser.displayName,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive,
      };
      
      // Add student-specific fields if the user is a student
      if (editingUser.role === 'student') {
        updateData.deliveryMethod = editingUser.deliveryMethod ?? null;
        updateData.studentGroup = editingUser.studentGroup ?? null;
        updateData.programType = editingUser.programType ?? null;
        updateData.classSection = editingUser.classSection ?? null;
      }
      
      await userService.updateUser(editingUser.id, updateData);
      setIsEditUserOpen(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Created At'],
      ...filteredUsers.map(user => [
        user.displayName,
        user.email,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        user.createdAt instanceof Date ? user.createdAt.toLocaleDateString() : user.createdAt.toDate().toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Access control - only admins and super_admins can access
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only administrators can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading || isNavigating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text={loading ? "Loading users..." : "Navigating..."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title={t('nav.userManagement')}
        subtitle={t('users.subtitle')}
      >
        <div className="flex gap-3 mt-4 lg:mt-0">
          <Button onClick={exportUsers} className="bg-white text-blue-600 hover:bg-blue-50 transition-all duration-300">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            {t('users.export')}
          </Button>
          <Dialog open={isAddUserOpen} onOpenChange={(o) => { 
            if (!isCreatingUser) {
              setIsAddUserOpen(o); 
              if (!o) setMode('single'); 
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-white text-blue-600 hover:bg-blue-50 transition-all duration-300">
                <UserPlus className="h-5 w-5 mr-2" />
                {t('users.add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    {t('users.addMany')}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <button className={`px-3 py-1 rounded ${mode==='single' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setMode('single')}>{t('users.mode.single')}</button>
                    <button className={`px-3 py-1 rounded ${mode==='bulk' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setMode('bulk')}>{t('users.mode.bulk')}</button>
                  </div>
                </div>
                <DialogDescription>
                  {mode==='single' ? t('users.singleDescription') : t('users.bulkDescription')}
                </DialogDescription>
              </DialogHeader>
              {mode==='single' ? (
                <>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="displayName" className="text-right">{t('users.form.name')}</Label>
                      <Input
                        id="displayName"
                        value={newUser.displayName}
                        onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                        className="col-span-3"
                        placeholder={t('users.form.name_placeholder')}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">{t('auth.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="col-span-3"
                        placeholder={t('auth.email_placeholder')}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">{t('users.table.role')}</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as any})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">{t('users.roles.student')}</SelectItem>
                          <SelectItem value="teacher">{t('users.roles.teacher')}</SelectItem>
                          {userProfile?.role === 'super_admin' && (
                            <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                          )}
                          {/* Super admin creation is not exposed here to admins */}
                        </SelectContent>
                      </Select>
                    </div>

                    {newUser.role === 'student' && (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Delivery Method</Label>
                          <div className="col-span-3 flex items-center gap-2">
                            <Select value={newUser.deliveryMethod} onValueChange={(v)=> setNewUser(prev=>({...prev, deliveryMethod: v}))}>
                              <SelectTrigger className="w-56"><SelectValue placeholder="Optional: select or add" /></SelectTrigger>
                              <SelectContent>
                                {studentMeta.deliveryMethods.map(dm => (
                                  <SelectItem key={dm} value={dm}>{dm}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input placeholder="Add new" value={customMetaInputs.deliveryMethod} onChange={(e)=> setCustomMetaInputs(prev=> ({...prev, deliveryMethod: e.target.value}))} className="w-40" />
                            <Button type="button" variant="outline" onClick={()=> addCustomMeta('deliveryMethods')}>Add</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Student Group</Label>
                          <div className="col-span-3 flex items-center gap-2">
                            <Select value={newUser.studentGroup} onValueChange={(v)=> setNewUser(prev=>({...prev, studentGroup: v}))}>
                              <SelectTrigger className="w-56"><SelectValue placeholder="Optional: select or add" /></SelectTrigger>
                              <SelectContent>
                                {studentMeta.studentGroups.map(sg => (
                                  <SelectItem key={sg} value={sg}>{sg}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input placeholder="Add new" value={customMetaInputs.studentGroup} onChange={(e)=> setCustomMetaInputs(prev=> ({...prev, studentGroup: e.target.value}))} className="w-40" />
                            <Button type="button" variant="outline" onClick={()=> addCustomMeta('studentGroups')}>Add</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Program Type</Label>
                          <div className="col-span-3 flex items-center gap-2">
                            <Select value={newUser.programType} onValueChange={(v)=> setNewUser(prev=>({...prev, programType: v}))}>
                              <SelectTrigger className="w-56"><SelectValue placeholder="Optional: select or add" /></SelectTrigger>
                              <SelectContent>
                                {studentMeta.programTypes.map(pt => (
                                  <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input placeholder="Add new" value={customMetaInputs.programType} onChange={(e)=> setCustomMetaInputs(prev=> ({...prev, programType: e.target.value}))} className="w-40" />
                            <Button type="button" variant="outline" onClick={()=> addCustomMeta('programTypes')}>Add</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Class Section</Label>
                          <div className="col-span-3 flex items-center gap-2">
                            <Select value={newUser.classSection} onValueChange={(v)=> setNewUser(prev=>({...prev, classSection: v}))}>
                              <SelectTrigger className="w-56"><SelectValue placeholder="Optional: select or add" /></SelectTrigger>
                              <SelectContent>
                                {studentMeta.classSections.map(cs => (
                                  <SelectItem key={cs} value={cs}>{cs}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input placeholder="Add new" value={customMetaInputs.classSection} onChange={(e)=> setCustomMetaInputs(prev=> ({...prev, classSection: e.target.value}))} className="w-40" />
                            <Button type="button" variant="outline" onClick={()=> addCustomMeta('classSections')}>Add</Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <LoadingButton 
                      type="submit" 
                      onClick={handleAddUser} 
                      loading={isCreatingUser}
                      loadingText="Creating User…"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {t('users.create')}
                    </LoadingButton>
                  </DialogFooter>
                </>
              ) : (
                <div className="py-2">
                  <CSVUpload 
                    onUsersCreated={(count) => { setIsAddUserOpen(false); fetchUsers(); }}
                    onError={(msg) => console.error(msg)}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  {t('users.edit')}
                </DialogTitle>
                <DialogDescription>
                  {t('users.updateFor', { name: editingUser?.displayName || t('users.thisUser') })}
                </DialogDescription>
              </DialogHeader>
              {editingUser && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editDisplayName" className="text-right">{t('users.form.name')}</Label>
                    <Input
                      id="editDisplayName"
                      value={editingUser.displayName}
                      onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editEmail" className="text-right">{t('auth.email')}</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editRole" className="text-right">{t('users.table.role')}</Label>
                    <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value as any})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">{t('users.roles.student')}</SelectItem>
                        <SelectItem value="teacher">{t('users.roles.teacher')}</SelectItem>
                        <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                        <SelectItem value="super_admin">{t('users.roles.super_admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editIsActive" className="text-right">{t('users.table.status')}</Label>
                    <Select value={editingUser.isActive ? 'active' : 'inactive'} onValueChange={(value) => setEditingUser({...editingUser, isActive: value === 'active'})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('users.status.active')}</SelectItem>
                        <SelectItem value="inactive">{t('users.status.inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editingUser.role === 'student' && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editDeliveryMethod" className="text-right">Delivery Method</Label>
                        <Select value={editingUser.deliveryMethod || ''} onValueChange={(value) => setEditingUser({...editingUser, deliveryMethod: value})}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Optional: select delivery method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editStudentGroup" className="text-right">Student Group</Label>
                        <Input
                          id="editStudentGroup"
                          value={editingUser.studentGroup || ''}
                          onChange={(e) => setEditingUser({...editingUser, studentGroup: e.target.value})}
                          className="col-span-3"
                          placeholder="Optional"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editProgramType" className="text-right">Program Type</Label>
                        <Select value={editingUser.programType || ''} onValueChange={(value) => setEditingUser({...editingUser, programType: value})}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Optional: select program type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="undergraduate">Undergraduate</SelectItem>
                            <SelectItem value="graduate">Graduate</SelectItem>
                            <SelectItem value="postgraduate">Postgraduate</SelectItem>
                            <SelectItem value="certificate">Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editClassSection" className="text-right">Class Section</Label>
                        <Input
                          id="editClassSection"
                          value={editingUser.classSection || ''}
                          onChange={(e) => setEditingUser({...editingUser, classSection: e.target.value})}
                          className="col-span-3"
                          placeholder="Optional"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
              <DialogFooter>
                <LoadingButton type="submit" onClick={handleUpdateUser} className="bg-blue-600 hover:bg-blue-700" loading={isUpdatingUser} loadingText="Saving…">
                  {t('users.saveChanges')}
                </LoadingButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('users.stats.totalUsers')}</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('users.stats.activeUsers')}</p>
                  <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('users.stats.teachers')}</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('users.stats.students')}</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('users.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('users.filterByRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users.roles.all')}</SelectItem>
                  <SelectItem value="student">{t('users.roles.student')}</SelectItem>
                  <SelectItem value="teacher">{t('users.roles.teacher')}</SelectItem>
                  <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                  <SelectItem value="super_admin">{t('users.roles.super_admin')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showArchived ? "default" : "outline"}
                onClick={() => setShowArchived(!showArchived)}
                className="whitespace-nowrap"
              >
                {showArchived ? "Hide Archived" : "Show Archived"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              {t('users.all')} ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-900">{t('users.table.user')}</TableHead>
                  <TableHead className="font-semibold text-gray-900">{t('users.table.role')}</TableHead>
                  <TableHead className="font-semibold text-gray-900">{t('users.table.status')}</TableHead>
                  <TableHead className="font-semibold text-gray-900">{t('users.table.created')}</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-gray-200">
                          <AvatarImage src="" alt={user.displayName} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                            {user.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{user.displayName}</div>
                          <div className="text-sm text-gray-500 truncate">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : user.role === 'teacher' ? 'secondary' : user.role === 'super_admin' ? 'destructive' : 'outline'}
                        className="flex items-center gap-1"
                      >
                        {user.role === 'admin' && <Shield className="h-3 w-3" />}
                        {user.role === 'super_admin' && <Eye className="h-3 w-3" />}
                        {user.role === 'teacher' && <BookOpen className="h-3 w-3" />}
                        {user.role === 'student' && <GraduationCap className="h-3 w-3" />}
                        {t(`users.roles.${user.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={user.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
                      >
                        {user.isActive ? t('users.status.active') : t('users.status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {user.createdAt instanceof Date ? user.createdAt.toLocaleDateString() : user.createdAt.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditClick(user)}>
                            <User className="h-4 w-4 mr-2" />
                            {t('admin.recentUsers.edit')}
                          </DropdownMenuItem>
                          {user.role === 'student' && (
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => {
                                setIsNavigating(true);
                                navigate(`/dashboard/admin-student-grades/${user.id}`);
                              }}
                            >
                              <Award className="h-4 w-4 mr-2" />
                              View Grades
                            </DropdownMenuItem>
                          )}
                          {user.role !== 'super_admin' && user.isActive && (
                            <DropdownMenuItem 
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleDeleteUser(user.id, user.displayName, user.role)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              {t('users.delete')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDeleteUser}
        title={t('users.confirmDelete')}
        description={`${t('users.confirmDelete')} ${userToDelete?.name}?`}
        confirmText={t('users.delete')}
        variant="destructive"
      />
    </div>
  );
};

export default UserManager;
