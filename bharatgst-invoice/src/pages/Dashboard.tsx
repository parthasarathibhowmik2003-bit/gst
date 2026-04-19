import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  IndianRupee,
  FileText
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { Invoice } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidInvoices: 0,
    unpaidCount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const q = query(
          collection(db, 'invoices'), 
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const invoices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Invoice);
        
        setRecentInvoices(invoices.slice(0, 5));

        const totals = invoices.reduce((acc, inv) => {
          if (inv.status === 'paid') {
            acc.totalRevenue += inv.grandTotal;
            acc.paidInvoices++;
          } else {
            acc.pendingPayments += inv.grandTotal;
            acc.unpaidCount++;
          }
          return acc;
        }, { totalRevenue: 0, pendingPayments: 0, paidInvoices: 0, unpaidCount: 0 });

        setStats(totals);

        // Group by month for chart
        const monthlyData: { [key: string]: number } = {};
        invoices.forEach(inv => {
          const date = new Date(inv.createdAt);
          const month = date.toLocaleString('en-US', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + inv.grandTotal;
        });

        const formattedChartData = Object.entries(monthlyData).map(([name, total]) => ({ name, total }));
        setChartData(formattedChartData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const cards = [
    { name: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee, color: 'bg-green-100 text-green-700', trend: '+12.5%' },
    { name: 'Pending Payments', value: formatCurrency(stats.pendingPayments), icon: Clock, color: 'bg-orange-100 text-orange-700', trend: `${stats.unpaidCount} Invoices` },
    { name: 'Paid Invoices', value: stats.paidInvoices.toString(), icon: CheckCircle2, color: 'bg-blue-100 text-blue-700', trend: 'Completed' },
    { name: 'Active Invoices', value: (stats.paidInvoices + stats.unpaidCount).toString(), icon: FileText, color: 'bg-purple-100 text-purple-700', trend: 'Total' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
    </div>
    <div className="h-96 bg-slate-200 rounded-xl"></div>
  </div>;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business Overview</h1>
        <p className="text-slate-500">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.name} className="card-stat">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.name}</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                card.name.includes('Revenue') ? "bg-green-50 text-accent" : 
                card.name.includes('Pending') ? "bg-amber-50 text-amber-600" :
                "bg-blue-50 text-blue-600"
              )}>
                {card.trend}
              </span>
              {card.name.includes('Pending') && (
                <span className="text-[10px] text-slate-400 italic">8 pending payments</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Revenue Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Revenue Analysis</h3>
            <div className="flex gap-1">
              <button className="px-2 py-1 text-[10px] bg-slate-100 rounded font-bold">6M</button>
              <button className="px-2 py-1 text-[10px] text-slate-400 rounded font-bold">1Y</button>
            </div>
          </div>
          <div className="p-4 pt-8">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C853" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dx={-10} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                  />
                  <Area type="monotone" dataKey="total" stroke="#00C853" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Data Support */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
           {/* GST Summary Mockup for style */}
           <div className="bg-slate-900 p-5 rounded-xl text-white shadow-xl overflow-hidden relative">
             <div className="relative z-10">
              <h4 className="text-sm font-bold mb-1">GST Summary (GSTR-1)</h4>
              <p className="text-[10px] text-slate-400 mb-4">Ready for Filing • April Period</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs border-b border-slate-800 pb-2 text-slate-300">
                  <span>B2B Invoices</span>
                  <span className="font-mono">{recentInvoices.length} Items</span>
                </div>
                <div className="flex justify-between text-xs border-b border-slate-800 pb-2 text-slate-300">
                  <span>Total Output Tax</span>
                  <span className="text-accent font-bold">₹34,680</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Credit Available (ITC)</span>
                  <span className="text-amber-400 font-bold">₹18,200</span>
                </div>
              </div>
              <button className="w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
                Download Excel Report
              </button>
             </div>
             <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
               <div className="w-32 h-32 border-8 border-white rounded-full"></div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h4>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/invoices')}
                className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
              >
                + New GST Invoice
              </button>
              <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Support Feature</p>
                  <p className="text-xs font-medium">Smart Voice Entry</p>
                </div>
                <div className="w-5 h-5 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-[8px] animate-pulse">●</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Full Width Table Style */}
        <div className="col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Recent Transactions</h3>
            <button className="text-accent text-[10px] font-bold uppercase tracking-wider hover:underline">View All Records</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="p-4 border-b">ID</th>
                  <th className="p-4 border-b">Customer</th>
                  <th className="p-4 border-b text-right">Grand Total</th>
                  <th className="p-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentInvoices.length > 0 ? recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100">
                    <td className="p-4 font-mono text-[10px] text-slate-500">{inv.invoiceNumber}</td>
                    <td className="p-4 font-medium text-slate-900">{inv.customerName}</td>
                    <td className="p-4 text-right font-bold text-slate-700">{formatCurrency(inv.grandTotal)}</td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "badge",
                        inv.status === 'paid' ? "badge-success" : "badge-warning"
                      )}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs italic">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
