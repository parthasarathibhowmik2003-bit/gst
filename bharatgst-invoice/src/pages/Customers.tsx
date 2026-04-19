import React, { useEffect, useState } from 'react';
import { Plus, Search, User, Phone, MapPin, Hash, Trash2, Edit2, Users } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    setLoading(true);
    const q = query(collection(db, 'customers'), where('creatorId', '==', user?.uid));
    const snap = await getDocs(q);
    setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Customer));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const data = { name, phone, gstin, address, creatorId: user.uid };
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'customers', editingId), data);
      } else {
        await addDoc(collection(db, 'customers'), data);
      }
      setIsModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setGstin('');
    setAddress('');
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete customer?')) return;
    await deleteDoc(doc(db, 'customers', id));
    fetchCustomers();
  };

  const openEdit = (customer: Customer) => {
    setName(customer.name);
    setPhone(customer.phone);
    setGstin(customer.gstin || '');
    setAddress(customer.address || '');
    setEditingId(customer.id!);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 text-sm">Keep track of your clients and their GST details</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#0A2540] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-[#143e69] transition-all"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00C853]/10 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((customer) => (
          <motion.div 
            layout
            key={customer.id} 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <User size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(customer)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(customer.id!)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{customer.name}</h3>
            {customer.gstin && <p className="text-xs font-bold text-[#00C853] mb-4 uppercase">{customer.gstin}</p>}
            {!customer.gstin && <p className="text-xs font-semibold text-slate-400 mb-4 uppercase">Unregistered</p>}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Phone size={14} className="shrink-0" />
                <span>{customer.phone || 'No phone'}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-500 text-sm">
                <MapPin size={14} className="shrink-0 mt-1" />
                <span className="line-clamp-2">{customer.address || 'No address provided'}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {customers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 italic">No customers added yet.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg">{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
                <button onClick={() => setIsModalOpen(false)}><Plus className="rotate-45" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">GSTIN (Optional)</label>
                  <input value={gstin} onChange={e => setGstin(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20 min-h-[100px]" />
                </div>
                <button type="submit" className="w-full py-3 bg-[#00C853] text-white font-bold rounded-xl mt-4 shadow-lg shadow-green-500/20">
                  {editingId ? 'Update Customer' : 'Save Customer'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
