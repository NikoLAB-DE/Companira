import React, { useState } from 'react';
import ProfileForm from '../components/profile/ProfileForm';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import DeleteAccountDialog from '../components/profile/DeleteAccountDialog'; // Import the new dialog

const ProfilePage: React.FC = () => {
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const { user, signOut, loading: authLoading } = useAuth(); // Get user, signOut, loading state
  const [showJson, setShowJson] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Placeholder for the actual Supabase function call
  const handleDeleteAccountConfirm = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError(null);
    console.log("Attempting to delete account for user:", user.id);

    try {
      // **IMPORTANT**: Replace this with the actual call to your Supabase function
      // Example: const { error } = await supabase.rpc('delete_user_account');
      // Simulate network delay and potential error
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const shouldSimulateError = false; // Set to true to test error handling

      if (shouldSimulateError) {
         throw new Error("Simulated backend error during account deletion.");
      }

      console.log("Account deletion function called successfully (simulated).");

      // If deletion is successful on the backend, sign the user out
      await signOut();
      // No need to close dialog here, sign out triggers redirect/state change
      // setIsDeleteDialogOpen(false); // Not strictly needed

    } catch (error: any) {
      console.error("Error deleting account:", error);
      setDeleteError(error.message || "An unexpected error occurred. Please try again.");
      setIsDeleting(false); // Stop loading state on error
    } 
    // No finally block needed for setIsDeleting(false) because signOut navigates away
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <p className="text-muted-foreground mb-6">
        Customize your experience by setting your preferences. These settings help tailor the assistant's responses and interactions.
      </p>
      
      {/* Pass the function to open the delete dialog */}
      <ProfileForm onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)} />

      {/* Section to display current profile JSON */}
      <div className="mt-8">
        <Button
          variant="outline"
          onClick={() => setShowJson(!showJson)}
          className="mb-4"
        >
          {showJson ? 'Hide' : 'Show'} Current Profile Data (JSON for DB Setup)
        </Button>

        {showJson && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Profile State (Local)</CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading && <p>Loading profile...</p>}
              {profileError && <p className="text-red-500">Error loading profile: {profileError}</p>}
              {profile && !profileLoading && !profileError && (
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              )}
              {!profile && !profileLoading && !profileError && (
                 <p className="text-muted-foreground">No profile data available yet. Fill and save the form.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Account Dialog */}
      {user?.email && (
         <DeleteAccountDialog
           isOpen={isDeleteDialogOpen}
           onClose={() => setIsDeleteDialogOpen(false)}
           onConfirm={handleDeleteAccountConfirm}
           userEmail={user.email}
           isLoading={isDeleting} // Pass loading state
           error={deleteError} // Pass error state
         />
      )}
    </div>
  );
};

export default ProfilePage;
