import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { passwordResetService } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Key, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordResetRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PasswordResetRequest({ open, onOpenChange }: PasswordResetRequestProps) {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!currentUser || !userProfile) {
      toast.error('You must be logged in to request a password reset');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the password reset request');
      return;
    }

    try {
      setSubmitting(true);
      await passwordResetService.createPasswordResetRequest({
        userId: currentUser.uid,
        userEmail: userProfile.email || currentUser.email || '',
        userName: userProfile.displayName || 'Unknown User',
        userRole: userProfile.role,
        requestedBy: currentUser.uid,
        reason: reason.trim()
      });

      toast.success('Password reset request submitted successfully. An administrator will review your request.');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting password reset request:', error);
      toast.error('Failed to submit password reset request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Request Password Reset
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Password Reset Process</p>
                <p>Your request will be sent to an administrator who will review and process it. You will be contacted once your password has been reset.</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="userInfo">Your Information</Label>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p><strong>Name:</strong> {userProfile?.displayName || 'Unknown User'}</p>
              <p><strong>Email:</strong> {userProfile?.email || currentUser?.email}</p>
              <p><strong>Role:</strong> {userProfile?.role}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Password Reset *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need a password reset (e.g., forgot password, security concern, etc.)"
              rows={4}
              required
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest}
            disabled={!reason.trim() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}