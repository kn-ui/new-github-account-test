import React, { useState } from 'react';
import { passwordResetService, userService } from '@/lib/firestore';
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
import { Key, AlertCircle, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordResetRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PasswordResetRequest({ open, onOpenChange }: PasswordResetRequestProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!email.trim() || !fullName.trim() || !reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      
      // Try to find user by email to get their details
      let userDetails = null;
      try {
        const users = await userService.getUsers(1000);
        userDetails = users.find(user => 
          user.email?.toLowerCase() === email.trim().toLowerCase()
        );
      } catch (error) {
        console.warn('Could not fetch user details:', error);
      }

      // Create password reset request
      await passwordResetService.createPasswordResetRequest({
        userId: userDetails?.id || 'unknown',
        userEmail: email.trim(),
        userName: userDetails?.displayName || fullName.trim(),
        userRole: userDetails?.role || 'unknown',
        requestedBy: userDetails?.id || 'unknown',
        reason: reason.trim()
      });

      toast.success('Password reset request submitted successfully. An administrator will review your request and contact you via email.');
      setEmail('');
      setFullName('');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting password reset request:', error);
      toast.error('Failed to submit password reset request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFullName('');
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Password Reset Process</p>
                <p>Your request will be sent to an administrator who will review and process it. You will be contacted via email once your password has been reset.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="pl-10"
                  required
                />
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

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p><strong>Important:</strong> Make sure to use the same email address that's associated with your account. If you're unsure, contact your system administrator directly.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest}
            disabled={!email.trim() || !fullName.trim() || !reason.trim() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}