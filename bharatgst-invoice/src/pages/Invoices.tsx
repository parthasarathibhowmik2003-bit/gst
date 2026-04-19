import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Eye, 
  CheckCircle,
  Clock,
  Trash2,
  FileText
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, cn, generateInvoiceNumber } from '../lib/utils';
import { Invoice, Customer, Product, InvoiceItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { calculateTotals } from '../lib/gst';
import { exportInvoiceToPDF } from '../lib/pdfExporter';

export default function Invoices() {
  const { user, profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isInterState, setIsInterState] = useState(false);
  const [status, setStatus] = useState<'unpaid' | 'paid' | 'partial'>('unpaid');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchInvoices();
    fetchCustomersAndProducts();
  }, [user]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'invoices'), where('creatorId', '==', user?.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Invoice));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndProducts = async () => {
    if (!user) return;
    const custSnap = await getDocs(query(collection(db, 'customers'), where('creatorId', '==', user.uid)));
    setAllCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Customer));
    
    const prodSnap = await getDocs(query(collection(db, 'products'), where('creatorId', '==', user.uid)));
    setAllProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
  };

  const addItem = () => {
    setInvoiceItems([...invoiceItems, { name: '', quantity: 1, price: 0, gstRate: 18 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = async () => {
    if (!user || !selectedCustomer || invoiceItems.length === 0) return;
    setSaving(true);
    
    const totals = calculateTotals(invoiceItems, isInterState);
    const invoiceNumber = generateInvoiceNumber(invoices.length);

    try {
      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber,
        date: new Date().toISOString(),
        customerId: selectedCustomer.id!,
        customerName: selectedCustomer.name,
        customerGstin: selectedCustomer.gstin,
        customerAddress: selectedCustomer.address,
        customerPhone: selectedCustomer.phone,
        items: invoiceItems,
        subtotal: totals.subtotal,
        cgstTotal: totals.cgst,
        sgstTotal: totals.sgst,
        igstTotal: totals.igst,
        grandTotal: totals.grandTotal,
        status,
        paymentMethod: 'upi',
        creatorId: user.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'invoices'), invoiceData);
      setIsFormOpen(false);
      resetForm();
      fetchInvoices();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setInvoiceItems([]);
    setIsInterState(false);
    setStatus('unpaid');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    await deleteDoc(doc(db, 'invoices', id));
    fetchInvoices();
  };

  const totals = calculateTotals(invoiceItems, isInterState);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
            <p className="text-slate-500 text-xs">Manage your sales records and GST billing</p>
          </div>
          <div className="hidden md:flex gap-2">
            <span className="badge badge-success">ACTIVE</span>
            <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded text-slate-400 uppercase tracking-tighter">V2.4</span>
          </div>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm shadow-accent/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          + New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-1 focus:ring-accent/30 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors">
            Filters
          </button>
          <button className="flex-1 md:flex-none px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors">
            Export JSON
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="p-4 border-b">No.</th>
                <th className="p-4 border-b">Customer</th>
                <th className="p-4 border-b">Date</th>
                <th className="p-4 border-b text-right">GST Amount</th>
                <th className="p-4 border-b text-right">Grand Total</th>
                <th className="p-4 border-b text-center">Status</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {invoices.filter(inv => 
                inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 group">
                  <td className="p-4 font-mono text-[10px] text-slate-500">{inv.invoiceNumber}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 leading-tight">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{inv.customerGstin || 'No GSTIN'}</p>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 text-right text-slate-600 font-medium">
                    {formatCurrency(inv.igstTotal || (inv.cgstTotal + inv.sgstTotal))}
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "badge",
                      inv.status === 'paid' ? "badge-success" : "badge-warning"
                    )}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => exportInvoiceToPDF(inv, profile!)}
                        className="p-1.5 text-slate-400 hover:text-accent hover:bg-green-50 rounded transition-colors"
                        title="Export PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(inv.id!)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create New Tax Invoice</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Select Customer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Customer</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00C853]/20 transition-all"
                      onChange={(e) => {
                        const cust = allCustomers.find(c => c.id === e.target.value);
                        setSelectedCustomer(cust || null);
                      }}
                      value={selectedCustomer?.id || ''}
                    >
                      <option value="">-- Choose Customer --</option>
                      {allCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button className="text-xs text-[#00C853] font-bold">+ Add New Customer</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tax Type</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setIsInterState(false)}
                        className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", !isInterState ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                      >
                        Intra-state (CGST + SGST)
                      </button>
                      <button 
                        onClick={() => setIsInterState(true)}
                        className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", isInterState ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                      >
                        Inter-state (IGST)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Line Items</label>
                    <button onClick={addItem} className="text-sm text-[#00C853] font-bold flex items-center gap-1">
                      <Plus size={16} /> Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 p-4 rounded-xl relative group">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                          <input 
                            type="text" 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00C853]/20"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                          <input 
                            type="number" 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00C853]/20"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Price</label>
                          <input 
                            type="number" 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00C853]/20"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">GST %</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00C853]/20"
                            value={item.gstRate}
                            onChange={(e) => updateItem(index, 'gstRate', parseInt(e.target.value))}
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => removeItem(index)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {invoiceItems.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-slate-400 text-sm">Add some items to get started.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700">Additional Info</label>
                    <textarea 
                      placeholder="Notes, Terms, Bank Details etc."
                      className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-[#00C853]/20 text-sm"
                    ></textarea>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 text-block">Initial Status</label>
                       <div className="flex gap-2">
                          {['unpaid', 'paid'].map(s => (
                            <button
                              key={s}
                              onClick={() => setStatus(s as any)}
                              className={cn(
                                "flex-1 py-2 px-4 rounded-xl text-xs font-bold border transition-all truncate uppercase tracking-wider",
                                status === s ? "bg-[#0A2540] text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-[#00C853]"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {!isInterState ? (
                      <>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>CGST</span>
                          <span className="font-semibold">{formatCurrency(totals.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>SGST</span>
                          <span className="font-semibold">{formatCurrency(totals.sgst)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>IGST</span>
                        <span className="font-semibold">{formatCurrency(totals.igst)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-900">Total Amount</span>
                      <span className="text-2xl font-black text-[#00C853]">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveInvoice}
                  disabled={saving || !selectedCustomer || invoiceItems.length === 0}
                  className="bg-[#0A2540] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#143e69] transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create & Save Invoice'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
