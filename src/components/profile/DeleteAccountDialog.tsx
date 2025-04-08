import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from 'lucide-react'; // Import icons

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; // Make it async to handle loading state
  userEmail: string;
  isLoading: boolean; // Receive loading state
  error: string | null; // Receive error state
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  isLoading,
  error,
}) => {
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset confirmation state when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationEmail('');
      setIsConfirmed(false);
    }
  }, [isOpen]);

  // Check if typed email matches
  useEffect(() => {
    setIsConfirmed(confirmationEmail.trim().toLowerCase() === userEmail.toLowerCase());
  }, [confirmationEmail, userEmail]);

  const handleConfirmClick = async () => {
    if (isConfirmed && !isLoading) {
      await onConfirm();
      // Don't close here, let the parent handle it after successful sign-out/redirect
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center">
             <AlertCircle className="mr-2 h-5 w-5" /> Are you absolutely sure?
          </DialogTitle>
          <DialogDescription>
            This action <strong className="text-destructive">cannot</strong> be undone. This will permanently delete your account, profile, chat history, and all associated data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            To confirm deletion, please type your email address (<code className="bg-muted px-1 py-0.5 rounded">{userEmail}</code>) in the box below.
          </p>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email-confirm" className="text-right sr-only"> {/* Hide label visually */}
              Email
            </Label>
            <Input
              id="email-confirm"
              value={confirmationEmail}
              onChange={(e) => setConfirmationEmail(e.target.value)}
              placeholder="Type your email to confirm"
              className="col-span-4"
              disabled={isLoading} // Disable input while loading
            />
          </div>
           {/* Display Error Message */}
           {error && (
             <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-300">
               Error: {error}
             </p>
           )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between"> {/* Add gap and adjust justification */}
           <DialogClose asChild>
             <Button variant="outline" onClick={onClose} disabled={isLoading}>
               Cancel
             </Button>
           </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={!isConfirmed || isLoading} // Disable if not confirmed or loading
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              'Yes, Delete My Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
