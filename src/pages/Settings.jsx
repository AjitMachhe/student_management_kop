import React, { useEffect, useState } from 'react';
import { User, Lock, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setMobileNumber(profile.mobile_number || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          mobile_number: mobileNumber.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success('Profile details updated.');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account & System Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage your administrator profile information and security credentials
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="card-panel p-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Administrator Profile</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
            <div>
              <label className="label-text">Email Address (Login ID)</label>
              <input type="email" disabled value={user?.email || ''} className="input-field" />
            </div>

            <div>
              <label className="label-text">Access Role</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold capitalize text-blue-700">
                <Shield className="h-4 w-4" />
                {profile?.role || 'admin'}
              </div>
            </div>

            <div>
              <label className="label-text">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Mobile Number</label>
              <input
                type="text"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit contact number"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={savingProfile} className="btn-primary">
              <Save className="h-4 w-4" />
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security / Password Card */}
        <div className="card-panel p-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <Lock className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div>
              <label className="label-text">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={updatingPassword} className="btn-primary">
              <Lock className="h-4 w-4" />
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}