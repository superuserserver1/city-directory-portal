'use client';

import { useState } from 'react';
import { Send, Loader2, Mail, Phone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function EnquiryModal() {
  const { isEnquiryModalOpen, toggleEnquiryModal, selectedBusinessId, user, isAuthenticated } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill when user is logged in
  const handleOpen = (open: boolean) => {
    if (open && isAuthenticated && user) {
      setName(user.name);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
    if (!open) {
      setMessage('');
      setPhone('');
    }
    if (!open) toggleEnquiryModal();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!selectedBusinessId) {
      toast.error('No business selected');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/enquiries', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim(),
        businessId: selectedBusinessId,
      });
      toast.success('Enquiry sent successfully!');
      setMessage('');
      setPhone('');
      toggleEnquiryModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isEnquiryModalOpen} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Enquiry</DialogTitle>
          <DialogDescription>
            Have a question? Send an enquiry and the business will respond.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label htmlFor="modal-name">Name *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label htmlFor="modal-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="modal-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number (optional)"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-message">Message *</Label>
            <Textarea
              id="modal-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to know?"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={toggleEnquiryModal}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}