import React, { useState } from 'react';
import { Save, Building2, CreditCard, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [gstin, setGstin] = useState(profile?.gstin || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bankName, setBankName] = useState(profile?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(profile?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(profile?.ifscCode || '');
  const [upiId, setUpiId] = useState(profile?.upiId || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess(false);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        businessName,
        gstin,
        address,
        phone,
        email: user.email,
        bankName,
        accountNumber,
        ifscCode,
        upiId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your business profile and bank details for invoices.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Business Info */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 text-[#0A2540]">
            <Building2 className="w-5 h-5" />
            <h2 className="font-bold">Business Profile</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business Name</label>
              <input 
                required 
                value={businessName} 
                onChange={e => setBusinessName(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" 
                placeholder="E.g. Apple Inc."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">GSTIN Number</label>
              <input 
                required 
                value={gstin} 
                onChange={e => setGstin(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" 
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
               <input 
                 value={phone} 
                 onChange={e => setPhone(e.target.value)} 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" 
                 placeholder="+91 9876543210"
               />
            </div>
            <div className="md:col-span-2 space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business Address</label>
               <textarea 
                 value={address} 
                 onChange={e => setAddress(e.target.value)} 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20 min-h-[100px]" 
                 placeholder="Full registered address"
               />
            </div>
          </div>
        </section>

        {/* Bank Info */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 text-[#0A2540]">
            <CreditCard className="w-5 h-5" />
            <h2 className="font-bold">Banking & Payments</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Name</label>
              <input 
                value={bankName} 
                onChange={e => setBankName(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" 
                placeholder="HDFC Bank"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Number</label>
              <input 
                value={accountNumber} 
                onChange={e => setAccountNumber(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" 
                placeholder="5010023..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">IFSC Code</label>
              <input 
                value={ifscCode} 
                onChange={e => setIfscCode(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" 
                placeholder="HDFC0000123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">UPI ID</label>
              <input 
                value={upiId} 
                onChange={e => setUpiId(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" 
                placeholder="business@upi"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-4 bg-white p-4 rounded-2xl border border-slate-200 sticky bottom-6 z-10 shadow-lg px-8">
           {success && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-[#00C853] flex items-center gap-2 font-bold text-sm">
               <CheckCircle2 size={18} />
               Changes saved successfully!
             </motion.div>
           )}
           <button 
             type="submit" 
             disabled={loading}
             className="bg-[#00C853] text-white px-10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:bg-[#00b049] transition-all disabled:opacity-50 min-w-[160px]"
           >
             {loading ? 'Saving...' : (
               <>
                 <Save size={20} />
                 Save Settings
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
