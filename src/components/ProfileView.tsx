// Profile View Component
const ProfileView = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    name: currentInvestor?.name || '',
    email: currentInvestor?.email || '',
    phone: currentInvestor?.phone || '',
    nationality: currentInvestor?.nationality || '',
    birthDate: currentInvestor?.birthDate || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileForm.email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
        setIsSaving(false);
        return;
      }

      const updatedInvestor = {
        ...currentInvestor,
        ...profileForm
      };

      await makeAPIRequest('updateInvestor', { data: updatedInvestor });
      
      setCurrentInvestor(updatedInvestor as Investor);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setMessage(null);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (currentInvestor?.password !== passwordForm.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is incorrect' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsSaving(true);

    try {
      const updatedInvestor = {
        ...currentInvestor,
        password: passwordForm.newPassword
      };

      await makeAPIRequest('updateInvestor', { data: updatedInvestor });
      
      setCurrentInvestor(updatedInvestor as Investor);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-email">Email Address</Label>
              <Input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-phone">Phone Number</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-nationality">Nationality</Label>
              <Input
                id="profile-nationality"
                value={profileForm.nationality}
                onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="profile-birthdate">Date of Birth</Label>
              <Input
                id="profile-birthdate"
                type="date"
                value={profileForm.birthDate}
                onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div>
              <Label>Account ID</Label>
              <Input
                value={currentInvestor?.id || ''}
                disabled
                className="bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleProfileUpdate}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setProfileForm({
                    name: currentInvestor?.name || '',
                    email: currentInvestor?.email || '',
                    phone: currentInvestor?.phone || '',
                    nationality: currentInvestor?.nationality || '',
                    birthDate: currentInvestor?.birthDate || ''
                  });
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handlePasswordChange}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Account Statistics</CardTitle>
          <CardDescription>Your account activity summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">Total Properties</p>
              <p className="text-2xl font-bold text-blue-900">{units.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 mb-1">Documents</p>
              <p className="text-2xl font-bold text-green-900">{documents.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700 mb-1">Portfolio Value</p>
              <p className="text-2xl font-bold text-purple-900">
                ${(totalPortfolioValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700 mb-1">Account Age</p>
              <p className="text-2xl font-bold text-orange-900">
                {currentInvestor?.createdAt 
                  ? Math.floor((Date.now() - new Date(currentInvestor.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
                  : 0} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};