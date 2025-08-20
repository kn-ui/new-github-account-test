import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assignmentService, courseService, FirestoreAssignment } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TeacherAssignments() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<FirestoreAssignment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FirestoreAssignment | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    maxPoints: 100,
    instructions: ''
  });

  useEffect(() => {
    loadData();
  }, [currentUser?.uid]);

  const loadData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const [teacherCourses, teacherAssignments] = await Promise.all([
        courseService.getCoursesByInstructor(currentUser.uid),
        assignmentService.getAssignmentsByInstructor(currentUser.uid)
      ]);
      
      setCourses(teacherCourses);
      setAssignments(teacherAssignments);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingAssignment(null);
    setForm({
      title: '',
      description: '',
      courseId: '',
      dueDate: '',
      maxPoints: 100,
      instructions: ''
    });
    setShowDialog(true);
  };

  const openEdit = (assignment: FirestoreAssignment) => {
    setEditingAssignment(assignment);
    const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate as any);
    const formattedDate = dueDate.toISOString().split('T')[0];
    
    setForm({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      dueDate: formattedDate,
      maxPoints: assignment.maxPoints || 100,
      instructions: assignment.instructions || ''
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.description || !form.courseId || !form.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        courseId: form.courseId,
        dueDate: new Date(form.dueDate) as any,
        maxPoints: form.maxPoints,
        instructions: form.instructions,
        instructorId: currentUser?.uid
      };

      if (editingAssignment) {
        await assignmentService.updateAssignment(editingAssignment.id, payload as any);
        toast.success('Assignment updated successfully');
      } else {
        await assignmentService.createAssignment(payload as any);
        toast.success('Assignment created successfully');
      }

      setShowDialog(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast.error('Failed to save assignment');
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await assignmentService.deleteAssignment(assignmentId);
      toast.success('Assignment deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const getStatusColor = (dueDate: any) => {
    if (!dueDate) return 'bg-gray-100 text-gray-800';
    
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-100 text-red-800';
    if (diffDays <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (dueDate: any) => {
    if (!dueDate) return 'No due date';
    
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 3) return `Due in ${diffDays} days`;
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
              <p className="text-gray-600">Manage assignments for your courses</p>
            </div>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-600 mb-4">Create your first assignment to get started</p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => {
              const course = courses.find(c => c.id === assignment.courseId);
              return (
                <div key={assignment.id} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                        <Badge variant={assignment.maxPoints >= 100 ? 'default' : 'secondary'}>
                          {assignment.maxPoints} points
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{course?.title || 'Unknown Course'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{assignment.dueDate ? getStatusText(assignment.dueDate) : 'No due date'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>0 submissions</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(assignment.dueDate)}>
                        {assignment.dueDate ? getStatusText(assignment.dueDate) : 'No due date'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => openEdit(assignment)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(assignment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select value={form.courseId} onValueChange={(value) => setForm({ ...form, courseId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maxPoints">Max Points *</Label>
                <Input
                  id="maxPoints"
                  type="number"
                  min="1"
                  value={form.maxPoints}
                  onChange={(e) => setForm({ ...form, maxPoints: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter assignment title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter assignment description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Enter detailed instructions for students"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}