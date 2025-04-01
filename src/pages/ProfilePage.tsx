import React, { useState } from 'react';
import ProfileForm from '../components/profile/ProfileForm';
import { useProfile } from '../contexts/ProfileContext';
import { Button } from '../components/ui/button'; // Import Button
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'; // Import Card components

const ProfilePage: React.FC = () => {
  const { profile, loading, error } = useProfile(); // Get profile data from context
  const [showJson, setShowJson] = useState(false); // State to toggle JSON visibility

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <p className="text-muted-foreground mb-6">
        Customize your experience by setting your preferences. These settings help tailor the assistant's responses and interactions.
      </p>
      <ProfileForm />

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
              {loading && <p>Loading profile...</p>}
              {error && <p className="text-red-500">Error loading profile: {error}</p>}
              {profile && !loading && !error && (
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              )}
              {!profile && !loading && !error && (
                 <p className="text-muted-foreground">No profile data available yet. Fill and save the form.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
