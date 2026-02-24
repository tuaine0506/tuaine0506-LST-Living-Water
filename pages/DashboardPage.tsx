
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GROUP_NAMES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Hash, ShoppingBag, Key, Check, AlertCircle } from 'lucide-react';
import { GroupName } from '../types';

const DashboardPage: React.FC = () => {
  const { orders, changePassword } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      changePassword(newPassword);
      setPasswordStatus('success');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } else {
      setPasswordStatus('error');
    }
  };

  const salesData = useMemo(() => {
    const dataByGroup = GROUP_NAMES.reduce((acc, groupName) => {
      acc[groupName] = { name: groupName.split('(')[0].trim(), sales: 0, orders: 0 };
      return acc;
    }, {} as Record<GroupName, {name: string, sales: number, orders: number}>);

    orders.forEach(order => {
      if (dataByGroup[order.assignedGroup]) {
        dataByGroup[order.assignedGroup].sales += order.totalPrice;
        dataByGroup[order.assignedGroup].orders += 1;
      }
    });

    return Object.values(dataByGroup);
  }, [orders]);

  const totalSales = salesData.reduce((sum, group) => sum + group.sales, 0);
  const totalOrders = salesData.reduce((sum, group) => sum + group.orders, 0);

  const StatCard = ({ icon, title, value, color }: {icon: React.ReactNode, title: string, value: string | number, color: string}) => (
    <div className="bg-white p-6 rounded-xl shadow-md border flex items-start">
        <div className={`mr-4 p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-brand-green">{value}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-center">Fundraiser Dashboard</h1>
        <p className="text-center text-brand-brown mt-2">An overview of our fundraising progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            icon={<DollarSign className="h-6 w-6 text-green-800"/>} 
            title="Total Revenue" 
            value={`$${totalSales.toFixed(2)}`}
            color="bg-green-100"
        />
        <StatCard 
            icon={<ShoppingBag className="h-6 w-6 text-blue-800"/>} 
            title="Total Orders" 
            value={totalOrders}
            color="bg-blue-100"
        />
        <StatCard 
            icon={<Hash className="h-6 w-6 text-orange-800"/>} 
            title="Avg. Order Value" 
            value={totalOrders > 0 ? `$${(totalSales / totalOrders).toFixed(2)}` : '$0.00'}
            color="bg-orange-100"
        />
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
        <h2 className="text-2xl font-bold text-brand-green font-serif mb-4">Sales by Group</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={salesData}
              margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number | string | undefined) => value !== undefined ? `$${Number(value).toFixed(2)}` : ''} />
              <Legend />
              <Bar dataKey="sales" fill="#E07A5F" name="Sales Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admin Settings Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
        <div className="flex items-center gap-3 mb-6">
          <Key className="text-brand-orange" size={24} />
          <h2 className="text-2xl font-bold text-brand-green font-serif">Admin Settings</h2>
        </div>
        
        <div className="max-w-md">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-brand-brown mb-2 uppercase tracking-wide">Change Admin Password</label>
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordStatus('idle');
                  }}
                  placeholder="New password"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordStatus('idle');
                  }}
                  placeholder="Confirm new password"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className="bg-brand-green text-white font-bold py-3 px-6 rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              Update Password
            </button>

            {passwordStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-bounce">
                <Check size={18} /> Password updated successfully!
              </div>
            )}
            {passwordStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <AlertCircle size={18} /> Passwords do not match or are empty.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
