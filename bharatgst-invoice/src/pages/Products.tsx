import React, { useEffect, useState } from 'react';
import { Plus, Search, Tag, IndianRupee, Trash2, Edit2, Package } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    const q = query(collection(db, 'products'), where('creatorId', '==', user?.uid));
    const snap = await getDocs(q);
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const data = { name, price: parseFloat(price), gstRate, creatorId: user.uid };
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
      } else {
        await addDoc(collection(db, 'products'), data);
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setGstRate(18);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete product?')) return;
    await deleteDoc(doc(db, 'products', id));
    fetchProducts();
  };

  const openEdit = (product: Product) => {
    setName(product.name);
    setPrice(product.price.toString());
    setGstRate(product.gstRate);
    setEditingId(product.id!);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm">Manage your products and services with pre-set GST rates</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#0A2540] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-[#143e69] transition-all"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00C853]/10 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
          <motion.div 
            layout
            key={product.id} 
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow"
          >
             <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                <Package size={20} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(product)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(product.id!)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-900 mb-1">{product.name}</h3>
            <div className="flex items-center gap-2 mb-3">
               <span className="px-2 py-0.5 bg-green-50 text-[#00C853] text-[10px] font-bold rounded uppercase tracking-wider">{product.gstRate}% GST</span>
            </div>
            
            <div className="pt-3 border-t border-slate-50">
              <p className="text-xl font-black text-slate-900">{formatCurrency(product.price)}</p>
              <p className="text-[10px] text-slate-400 font-medium">BASIC PRICE</p>
            </div>
          </motion.div>
        ))}

        {products.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 italic">Inventory is empty.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)}><Plus className="rotate-45" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Base Price (INR)</label>
                  <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">GST Rate %</label>
                  <select value={gstRate} onChange={e => setGstRate(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20">
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-[#0A2540] text-white font-bold rounded-xl mt-4">
                  {editingId ? 'Update Product' : 'Save Product'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
