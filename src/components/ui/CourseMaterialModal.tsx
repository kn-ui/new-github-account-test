import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { courseMaterialService } from '@/lib/firestore';
import { toast } from 'sonner';

interface CourseMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  onMaterialAdded: () => void;
}

export default function CourseMaterialModal({ 
  isOpen, 
  onClose, 
  courseId, 
  courseTitle, 
  onMaterialAdded 
}: CourseMaterialModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'document' | 'video' | 'link' | 'other'>('document');
  const [fileUrl, setFileUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (type === 'link' && !externalLink.trim()) {
      toast.error('Please provide a link for link type materials');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const materialData = {
        courseId,
        title: title.trim(),
        description: description.trim(),
        type,
        ...(fileUrl && { fileUrl: fileUrl.trim() }),
        ...(externalLink && { externalLink: externalLink.trim() }),
      };

      await courseMaterialService.createCourseMaterial(materialData);
      
      toast.success('Course material added successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('document');
      setFileUrl('');
      setExternalLink('');
      
      onMaterialAdded();
      onClose();
    } catch (error) {
      console.error('Error adding course material:', error);
      toast.error('Failed to add course material. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('document');
    setFileUrl('');
    setExternalLink('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Course Material - {courseTitle}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the course material"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="link">External Link</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'document' && (
            <div>
              <Label htmlFor="fileUrl">File URL (Optional)</Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/file.pdf"
                type="url"
              />
            </div>
          )}

          {type === 'video' && (
            <div>
              <Label htmlFor="fileUrl">Video URL (Optional)</Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                type="url"
              />
            </div>
          )}

          {type === 'link' && (
            <div>
              <Label htmlFor="externalLink">External Link *</Label>
              <Input
                id="externalLink"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://example.com/resource"
                type="url"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}