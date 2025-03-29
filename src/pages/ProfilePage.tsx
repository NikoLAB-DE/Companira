import React from 'react';
import ProfileForm from '../components/profile/ProfileForm';

const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <p className="text-gray-600 mb-8">
        Customize how Companira works for you. Your preferences help tailor the experience to your needs.
      </p>
      
      <ProfileForm />
    </div>
  );
};

export default ProfilePage;
