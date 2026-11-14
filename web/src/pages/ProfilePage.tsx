import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  User,
  Award,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
  Send,
  Check,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user: currentUser, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  // Email verification state
  const [emailCode, setEmailCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);

  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/users/${handle}`);
        if (data.success) {
          setProfile(data.user);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
    loadProfile();
  }, [handle]);

  useEffect(() => {
    if (currentUser?.phone) {
      setPhoneNumber(currentUser.phone);
    }
  }, [currentUser]);

  const handleExport = async () => {
    try {
      const data = await apiRequest('/users/account/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dagna_data_export_${handle}.json`;
      a.click();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your account? This action is irreversible.')) return;
    try {
      await apiRequest('/users/account', { method: 'DELETE' });
      alert('Account deleted.');
      logout();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendEmailCode = async () => {
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const data = await apiRequest('/auth/email/send-code', { method: 'POST' });
      setEmailMsg({ text: data.message || 'Verification code sent to your email.' });
      setShowEmailInput(true);
    } catch (err: any) {
      setEmailMsg({ text: err.message || 'Failed to send email code', isError: true });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!emailCode.trim()) return;
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const data = await apiRequest('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({ code: emailCode.trim() }),
      });
      setEmailMsg({ text: data.message || 'Email verified successfully!' });
      setShowEmailInput(false);
      await refreshUser();
    } catch (err: any) {
      setEmailMsg({ text: err.message || 'Verification failed', isError: true });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      setPhoneMsg({ text: 'Please enter a valid phone number (e.g. 0912345678)', isError: true });
      return;
    }
    setPhoneLoading(true);
    setPhoneMsg(null);
    try {
      const data = await apiRequest('/auth/phone/send-code', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber.trim() }),
      });
      setPhoneMsg({ text: data.message || 'SMS OTP sent via AfroMessage.' });
      setShowPhoneInput(true);
    } catch (err: any) {
      setPhoneMsg({ text: err.message || 'Failed to send SMS OTP', isError: true });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneCode.trim()) return;
    setPhoneLoading(true);
    setPhoneMsg(null);
    try {
      const data = await apiRequest('/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ code: phoneCode.trim() }),
      });
      setPhoneMsg({ text: data.message || 'Phone number verified successfully!' });
      setShowPhoneInput(false);
      await refreshUser();
    } catch (err: any) {
      setPhoneMsg({ text: err.message || 'Verification failed', isError: true });
    } finally {
      setPhoneLoading(false);
    }
  };

  if (!profile) {
    return <div className="text-center py-20 text-slate-500">Loading profile...</div>;
  }

  const isSelf = currentUser && currentUser.handle === handle;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Profile Header */}
      <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-2xl">
            {profile.displayName[0]}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              {currentUser?.isEmailVerified && (
                <span title="Email Verified" className="text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 inline" />
                </span>
              )}
              {currentUser?.isPhoneVerified && (
                <span title="Phone Verified" className="text-sky-400">
                  <Phone className="w-4 h-4 inline" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">@{profile.handle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-center font-mono">
          <div>
            <div className="text-2xl font-bold text-sky-400">{profile.rating}</div>
            <div className="text-xs text-slate-400 uppercase">Rating</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{profile.solvedCount || 0}</div>
            <div className="text-xs text-slate-400 uppercase">Solved</div>
          </div>
        </div>
      </div>

      {/* Security & Verification Panel (Self Only) */}
      {isSelf && (
        <div className="bg-slate-800/50 border border-slate-700/80 p-6 rounded-xl space-y-6">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Account Verification & Security</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Verification Box */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Email Verification</span>
                </div>
                {currentUser?.isEmailVerified ? (
                  <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>VERIFIED</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" />
                    <span>UNVERIFIED</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">{currentUser?.email}</p>

              {!currentUser?.isEmailVerified && (
                <div className="space-y-2 pt-2">
                  {!showEmailInput ? (
                    <button
                      onClick={handleSendEmailCode}
                      disabled={emailLoading}
                      className="w-full text-xs font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{emailLoading ? 'Sending...' : 'Send Verification Code (Gmail)'}</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit code"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-sky-500 font-mono tracking-widest text-center"
                        />
                        <button
                          onClick={handleVerifyEmailCode}
                          disabled={emailLoading || emailCode.length !== 6}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                      </div>
                      <button
                        onClick={handleSendEmailCode}
                        disabled={emailLoading}
                        className="text-[11px] text-slate-400 hover:text-sky-300 transition block"
                      >
                        Resend code
                      </button>
                    </div>
                  )}

                  {emailMsg && (
                    <p className={`text-[11px] ${emailMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                      {emailMsg.text}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Phone Verification Box */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <Phone className="w-4 h-4 text-sky-400" />
                  <span>Phone Verification</span>
                </div>
                {currentUser?.isPhoneVerified ? (
                  <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>VERIFIED</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" />
                    <span>UNVERIFIED</span>
                  </span>
                )}
              </div>

              {!currentUser?.isPhoneVerified ? (
                <div className="space-y-2">
                  <input
                    type="tel"
                    placeholder="e.g. 0912345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
                  />

                  {!showPhoneInput ? (
                    <button
                      onClick={handleSendPhoneCode}
                      disabled={phoneLoading || !phoneNumber.trim()}
                      className="w-full text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{phoneLoading ? 'Sending...' : 'Send SMS OTP (AfroMessage)'}</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit SMS OTP"
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-sky-500 font-mono tracking-widest text-center"
                        />
                        <button
                          onClick={handleVerifyPhoneCode}
                          disabled={phoneLoading || phoneCode.length !== 6}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                      </div>
                      <button
                        onClick={handleSendPhoneCode}
                        disabled={phoneLoading}
                        className="text-[11px] text-slate-400 hover:text-sky-300 transition block"
                      >
                        Resend SMS OTP
                      </button>
                    </div>
                  )}

                  {phoneMsg && (
                    <p className={`text-[11px] ${phoneMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                      {phoneMsg.text}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-mono">{currentUser?.phone || 'Verified'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating History */}
      <div className="bg-slate-800/40 border border-slate-700/80 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Contest Rating Progression</span>
        </h3>

        {profile.ratingHistory.length === 0 ? (
          <p className="text-xs text-slate-500">No rated contest participation yet.</p>
        ) : (
          <div className="space-y-2">
            {profile.ratingHistory.map((rh: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-white font-semibold">{rh.contestTitle}</span>
                <span className="text-slate-400">Rank: #{rh.rank}</span>
                <span className={rh.delta >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {rh.delta >= 0 ? `+${rh.delta}` : rh.delta}
                </span>
                <span className="text-sky-300 font-bold">{rh.newRating}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings / Privacy Export & Delete (if viewing own profile) */}
      {isSelf && (
        <div className="bg-slate-800/40 border border-slate-700/80 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono">Privacy & GDPR Controls</h3>
          <div className="flex space-x-4">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Account Data (JSON)</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
