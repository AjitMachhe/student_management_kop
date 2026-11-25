import React, { useEffect, useState } from 'react';
import { User, Lock, Save, Shield, Building2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../services/organizationService';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();

  const [orgSettings, setOrgSettings] = useState({
    id: null,
    org_name: 'Perfect Publication, Kolhapur',
    org_name_marathi: 'परफेक्ट पब्लिकेशन, कोल्हापूर',
    exam_title: 'Maharashtra State Talent Search Examination',
    exam_title_marathi: 'महाराष्ट्र स्टेट टॅलेंट सर्च (प्रज्ञा शोध) परीक्षा',
    exam_short_code: 'M.S.T.S EXAM',
    academic_year: '2026-27',
    exam_date: '22 March 2026',
    logo_url: '',
    controller_signature_url: '',
    controller_title: 'परीक्षा प्रमुख / Exam Controller',
    hall_ticket_notice:
      'Parents and teachers are responsible for bringing their students/children to the examination center and picking them up after the exam is over. Please note this.',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [savingOrg, setSavingOrg] = useState(false);

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

  useEffect(() => {
    getOrganizationSettings()
      .then((data) => {
        if (data) {
          setOrgSettings(data);
          setLogoPreview(data.logo_url || '');
        }
      })
      .catch((err) => toast.error(err.message || 'Could not load organization settings.'));
  }, []);

  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveOrgSettings = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      let targetId = orgSettings.id;
      if (!targetId) {
        const fresh = await getOrganizationSettings();
        targetId = fresh.id;
      }

      const updated = await updateOrganizationSettings(
        targetId,
        {
          org_name: orgSettings.org_name,
          org_name_marathi: orgSettings.org_name_marathi,
          exam_title: orgSettings.exam_title,
          exam_title_marathi: orgSettings.exam_title_marathi,
          exam_short_code: orgSettings.exam_short_code,
          academic_year: orgSettings.academic_year,
          exam_date: orgSettings.exam_date,
          controller_title: orgSettings.controller_title,
          hall_ticket_notice: orgSettings.hall_ticket_notice,
          logo_url: orgSettings.logo_url,
          controller_signature_url: orgSettings.controller_signature_url,
        },
        logoFile,
        signatureFile
      );

      setOrgSettings(updated);
      setLogoPreview(updated.logo_url || '');
      setLogoFile(null);
      setSignatureFile(null);
      toast.success('Logo & organization branding saved!');
      window.dispatchEvent(new Event('org-branding-updated'));
    } catch (err) {
      toast.error(err.message || 'Failed to save logo & branding.');
    } finally {
      setSavingOrg(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-900">Organization Logo &amp; Account Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Upload your customer logo, exam title, hall ticket notice, and manage account security
        </p>
      </div>

      {/* Organization Logo & Branding Card (Always Visible) */}
      <div className="card-panel p-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Customer Logo &amp; Exam Branding (Sidebar, Hall Tickets &amp; Certificates)
            </h2>
            <p className="text-xs text-slate-500">
              Upload your organization logo and signature to brand all generated PDFs
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveOrgSettings} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Logo Upload Box */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
              <label className="label-text text-blue-800">1. Organization Logo (PNG/JPG) *</label>
              <div className="mt-2 flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-[10px] text-slate-400">
                    No Logo
                  </div>
                )}
                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-400 bg-white px-3 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
                  <UploadCloud className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {logoFile ? logoFile.name : 'Choose Logo File...'}
                  </span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={handleLogoPick}
                  />
                </label>
              </div>
            </div>

            {/* Controller Signature Upload */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <label className="label-text">2. Exam Controller Signature</label>
              <div className="mt-2 flex items-center gap-3">
                {orgSettings.controller_signature_url && (
                  <img
                    src={orgSettings.controller_signature_url}
                    alt="Signature"
                    className="h-14 w-20 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1"
                  />
                )}
                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-600 hover:border-blue-500">
                  <UploadCloud className="h-4 w-4 shrink-0 text-blue-600" />
                  <span className="truncate">
                    {signatureFile ? signatureFile.name : 'Choose Signature...'}
                  </span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="label-text">3. Exam Short Code / Seal Text</label>
              <input
                type="text"
                value={orgSettings.exam_short_code || ''}
                onChange={(e) =>
                  setOrgSettings({ ...orgSettings, exam_short_code: e.target.value })
                }
                placeholder="M.S.T.S EXAM"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Organization Name (English) *</label>
              <input
                type="text"
                required
                value={orgSettings.org_name || ''}
                onChange={(e) => setOrgSettings({ ...orgSettings, org_name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Organization Name (Marathi)</label>
              <input
                type="text"
                value={orgSettings.org_name_marathi || ''}
                onChange={(e) =>
                  setOrgSettings({ ...orgSettings, org_name_marathi: e.target.value })
                }
                placeholder="परफेक्ट पब्लिकेशन, कोल्हापूर"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Controller Designation Title</label>
              <input
                type="text"
                value={orgSettings.controller_title || ''}
                onChange={(e) =>
                  setOrgSettings({ ...orgSettings, controller_title: e.target.value })
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Examination Title (English) *</label>
              <input
                type="text"
                required
                value={orgSettings.exam_title || ''}
                onChange={(e) => setOrgSettings({ ...orgSettings, exam_title: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Examination Title (Marathi)</label>
              <input
                type="text"
                value={orgSettings.exam_title_marathi || ''}
                onChange={(e) =>
                  setOrgSettings({ ...orgSettings, exam_title_marathi: e.target.value })
                }
                placeholder="महाराष्ट्र स्टेट टॅलेंट सर्च (प्रज्ञा शोध) परीक्षा"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-text">Academic Year</label>
                <input
                  type="text"
                  value={orgSettings.academic_year || ''}
                  onChange={(e) =>
                    setOrgSettings({ ...orgSettings, academic_year: e.target.value })
                  }
                  placeholder="2026-27"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Exam Date</label>
                <input
                  type="text"
                  value={orgSettings.exam_date || ''}
                  onChange={(e) => setOrgSettings({ ...orgSettings, exam_date: e.target.value })}
                  placeholder="22 March 2026"
                  className="input-field"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label-text">Hall Ticket Notice Text</label>
              <input
                type="text"
                value={orgSettings.hall_ticket_notice || ''}
                onChange={(e) =>
                  setOrgSettings({ ...orgSettings, hall_ticket_notice: e.target.value })
                }
                className="input-field"
              />
            </div>
          </div>

          <button type="submit" disabled={savingOrg} className="btn-primary">
            <Save className="h-4 w-4" />
            {savingOrg ? 'Uploading & Saving...' : 'Save Logo & Organization Settings'}
          </button>
        </form>
      </div>

      {/* Profile & Password Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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