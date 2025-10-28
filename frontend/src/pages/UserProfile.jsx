import { useState, useEffect } from 'react';
import { Card, Title, TextInput, Button } from '@tremor/react';
import { userService } from '../services';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Catch id from local storage or session
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      console.log(`Fetching profile for user ID: ${userId}`);
      // Use userService instead of direct fetch
      const data = await userService.getUserById(userId);
      setProfile(prev => ({
        ...prev,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
      }));
    } catch (err) {
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUpdating(true);

    // Basic validation
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      setError('New passwords do not match');
      setUpdating(false);
      return;
    }

    try {
      // Get user ID from local storage or session
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      // Prepare profile data
      const profileData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        currentPassword: profile.currentPassword,
        newPassword: profile.newPassword,
      };
      // Update profile and password in one call
      await userService.updateProfileAndPassword(profileData, userId);

      setSuccess('Profile updated successfully');
      setProfile(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-10 w-full">
      <Title>Profile Settings</Title>
      
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="mt-1">
                <TextInput
                  id="first_name"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleInputChange}
                  required
                  disabled={updating}
                />
              </div>
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="mt-1">
                <TextInput
                  id="last_name"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleInputChange}
                  required
                  disabled={updating}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <TextInput
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleInputChange}
                required
                disabled={updating}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <Title>Change Password</Title>
            
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="mt-1">
                  <TextInput
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={profile.currentPassword}
                    onChange={handleInputChange}
                    disabled={updating}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <TextInput
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={profile.newPassword}
                    onChange={handleInputChange}
                    disabled={updating}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <TextInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={profile.confirmPassword}
                    onChange={handleInputChange}
                    disabled={updating}
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm">{success}</div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={updating}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}