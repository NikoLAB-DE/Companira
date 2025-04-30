import React, { useState } from 'react';
    import ProfileForm from '../components/profile/ProfileForm';
    import { useProfile } from '../contexts/ProfileContext';
    import { useAuth } from '../contexts/AuthContext';
    import { useAdmin } from '../contexts/AdminContext'; // Import useAdmin
    import { Button } from '../components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
    import DeleteAccountDialog from '../components/profile/DeleteAccountDialog';
    import { supabase } from '../lib/supabase'; // Import supabase client

    const ProfilePage: React.FC = () => {
      const { profile, loading: profileLoading, error: profileError } = useProfile();
      const { user, signOut, loading: authLoading } = useAuth();
      const { isAdmin } = useAdmin(); // Get admin state
      const [showJson, setShowJson] = useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [deleteError, setDeleteError] = useState<string | null>(null);
      const [isDeleting, setIsDeleting] = useState(false);

      const handleDeleteAccountConfirm = async () => {
        // console.log("[handleDeleteAccountConfirm] Function called."); // Log: Function start

        if (!user) {
          console.error("[handleDeleteAccountConfirm] Error: User object is null or undefined."); // Log: User check failed
          setDeleteError("User session not found. Please log in again.");
          setIsDeleting(false); // Ensure loading stops if user is somehow null
          return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        // console.log(`[handleDeleteAccountConfirm] Attempting deletion for user ID: ${user.id}`); // Log: User ID

        try {
          // console.log("[handleDeleteAccountConfirm] Entering TRY block. Calling supabase.rpc..."); // Log: Before RPC call
          const { error: rpcError, data } = await supabase.rpc('delete_user_account', { uid: user.id });
          // console.log("[handleDeleteAccountConfirm] supabase.rpc call finished."); // Log: After RPC call
          // console.log("[handleDeleteAccountConfirm] RPC Response Data:", data); // Log: RPC response data
          // console.log("[handleDeleteAccountConfirm] RPC Response Error:", rpcError); // Log: RPC response error

          if (rpcError) {
            console.error("[handleDeleteAccountConfirm] RPC Error detected:", rpcError); // Log: RPC error details
            // Try to provide a more specific error message if possible
            let userMessage = rpcError.message || "Failed to delete account via RPC.";
            if (rpcError.code === '42501') { // Example: Check for permission denied error code
              userMessage = "Permission denied. Unable to delete account. Please contact support.";
            }
            throw new Error(userMessage);
          }

          // console.log("[handleDeleteAccountConfirm] RPC call successful. Proceeding to sign out."); // Log: RPC success
          await signOut();
          // console.log("[handleDeleteAccountConfirm] Sign out successful."); // Log: Sign out success
          // No need to close dialog here, signOut navigation handles it

        } catch (error: any) {
          console.error("[handleDeleteAccountConfirm] CATCH block error:", error); // Log: Catch block
          setDeleteError(error.message || "An unexpected error occurred during account deletion.");
          setIsDeleting(false); // Stop loading indicator on error
        }
        // No finally block needed here for isDeleting state
      };

      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
          <p className="text-muted-foreground mb-6">
            Customize your experience by setting your preferences. These settings help tailor the assistant's responses and interactions.
          </p>

          <ProfileForm onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)} />

          {/* Section to display current profile JSON - Conditionally render based on isAdmin */}
          {isAdmin && user && ( // Only show for logged-in admins
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
          )}

          {/* Delete Account Dialog */}
          {user?.email && (
             <DeleteAccountDialog
               isOpen={isDeleteDialogOpen}
               onClose={() => setIsDeleteDialogOpen(false)}
               onConfirm={handleDeleteAccountConfirm}
               userEmail={user.email}
               isLoading={isDeleting} // Pass the loading state
               error={deleteError}     // Pass the error state
             />
          )}
        </div>
      );
    };

    export default ProfilePage;
