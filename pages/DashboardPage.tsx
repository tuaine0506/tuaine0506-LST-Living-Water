
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GROUP_NAMES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Hash, ShoppingBag, Key, Check, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { GroupName } from '../types';

const DashboardPage: React.FC = () => {
  const { orders, changePassword, isDeliveryEnabled, toggleDeliveryEnabled, resetProducts } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Handle strings with commas or quotes
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportOrders = () => {
    const exportData = orders.map(order => ({
      'Order ID': order.id,
      'Order Number': order.orderNumber,
      'Date': new Date(order.orderDate).toLocaleDateString(),
      'Customer Name': order.customerName,
      'Email': order.customerEmail || '',
      'Phone': order.customerContact,
      'Total Price': order.totalPrice,
      'Status': order.isFulfilled ? 'Fulfilled' : 'Pending',
      'Delivery Option': order.deliveryOption,
      'Address': order.deliveryAddress || '',
      'Zelle Conf': order.zelleConfirmationNumber,
      'Items': order.items.map(i => `${i.quantity}x ${i.productName}`).join('; '),
      'Group': order.assignedGroup
    }));
    downloadCSV(exportData, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportProfiles = () => {
    // Derive unique profiles from orders
    const profilesMap = new Map();
    orders.forEach(order => {
      const key = order.customerEmail || order.customerContact;
      if (!profilesMap.has(key)) {
        profilesMap.set(key, {
          'Name': order.customerName,
          'Email': order.customerEmail || '',
          'Phone': order.customerContact,
          'Address': order.deliveryAddress || '',
          'First Order': new Date(order.orderDate).toLocaleDateString(),
          'Last Order': new Date(order.orderDate).toLocaleDateString(),
          'Total Orders': 0,
          'Total Spent': 0
        });
      }
      
      const profile = profilesMap.get(key);
      profile['Total Orders'] += 1;
      profile['Total Spent'] += order.totalPrice;
      if (new Date(order.orderDate) > new Date(profile['Last Order'])) {
        profile['Last Order'] = new Date(order.orderDate).toLocaleDateString();
      }
      // Update address if newer order has one
      if (order.deliveryAddress) {
         profile['Address'] = order.deliveryAddress;
      }
    });

    const exportData = Array.from(profilesMap.values());
    downloadCSV(exportData, `profiles_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordStatus('error');
      setErrorMessage('Passwords do not match or are empty.');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } else {
      setPasswordStatus('error');
      setErrorMessage(result.error || 'Failed to change password.');
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
        
        <div className="max-w-md space-y-8">
          {/* Data Export Section */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet size={18} /> Data Export
            </h3>
            <p className="text-xs text-blue-700 mb-4">Export data to CSV format (compatible with Google Sheets & Excel).</p>
            <div className="flex gap-3">
              <button
                onClick={handleExportOrders}
                className="flex-1 bg-white text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={14} /> Export Orders
              </button>
              <button
                onClick={handleExportProfiles}
                className="flex-1 bg-white text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={14} /> Export Profiles
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-brand-brown">Enable Delivery Option</h3>
              <p className="text-xs text-gray-500">Allow customers to choose delivery at checkout.</p>
            </div>
            <button
              onClick={toggleDeliveryEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 shrink-0 ${isDeliveryEnabled ? 'bg-brand-green' : 'bg-gray-300'}`}
            >
              <span
                className={`${isDeliveryEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <h3 className="font-bold text-orange-800">Product Defaults</h3>
            <p className="text-xs text-orange-700 mb-3">Reset all products to their default availability (Only Lemon Ginger active).</p>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to reset all products to default availability?')) {
                  const res = await resetProducts();
                  if (res.success) alert('Products reset successfully!');
                  else alert(res.error || 'Failed to reset products.');
                }
              }}
              className="bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition-all shadow-sm active:scale-95"
            >
              Reset to Defaults
            </button>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-brand-brown mb-2 uppercase tracking-wide">Change Admin Password</label>
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordStatus('idle');
                  }}
                  placeholder="Current password"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordStatus('idle');
                  }}
                  placeholder="New password"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                  required
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
                  required
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
                <AlertCircle size={18} /> {errorMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
