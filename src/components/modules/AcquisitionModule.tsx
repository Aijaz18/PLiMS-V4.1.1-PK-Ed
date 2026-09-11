import React, { useState } from 'react';
import { ShoppingBag, Plus, Search, FileText, CheckCircle2, Clock, Truck, Building2, Trash2, DollarSign, Filter } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  isbn: string;
  vendorName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  budgetHead: string;
  orderDate: string;
  expectedDate: string;
  status: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

interface VendorProfile {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po_01',
    poNumber: 'PO-2026-881',
    title: 'MIT Press Cognitive Science & Machine Learning Monograph Collection',
    isbn: '9780262039999',
    vendorName: 'Oxford University Press & Global Dist',
    quantity: 15,
    unitPrice: 12000,
    totalPrice: 180000,
    budgetHead: 'CS & AI Research Allocation (2026)',
    orderDate: '2026-07-10',
    expectedDate: '2026-08-15',
    status: 'SHIPPED'
  },
  {
    id: 'po_02',
    poNumber: 'PO-2026-882',
    title: 'IEEE Computer Society Conference Proceedings (2025-2026 Set)',
    isbn: '9781479998888',
    vendorName: 'Pak Book Corporation',
    quantity: 5,
    unitPrice: 45000,
    totalPrice: 225000,
    budgetHead: 'Central Digital Repository Fund',
    orderDate: '2026-07-20',
    expectedDate: '2026-08-25',
    status: 'APPROVED'
  },
  {
    id: 'po_03',
    poNumber: 'PO-2026-883',
    title: 'Principles of Medical Physiology & Pharmacology (12th Edition)',
    isbn: '9780198765432',
    vendorName: 'Paramount Books Pvt Ltd',
    quantity: 25,
    unitPrice: 8500,
    totalPrice: 212500,
    budgetHead: 'Medical Sciences Grant',
    orderDate: '2026-06-15',
    expectedDate: '2026-07-01',
    status: 'DELIVERED'
  }
];

const INITIAL_VENDORS: VendorProfile[] = [
  {
    id: 'v_01',
    name: 'Oxford University Press & Global Dist',
    code: 'VEND-OUP',
    contactPerson: 'Tariq Mahmood',
    email: 'orders@oup-pakistan.com',
    phone: '+92 51 2289900',
    city: 'Islamabad / Karachi',
    rating: 4.9,
    status: 'ACTIVE'
  },
  {
    id: 'v_02',
    name: 'Pak Book Corporation',
    code: 'VEND-PBC',
    contactPerson: 'Syed Ali Shah',
    email: 'info@pakbook.com',
    phone: '+92 42 3588220',
    city: 'Lahore',
    rating: 4.8,
    status: 'ACTIVE'
  },
  {
    id: 'v_03',
    name: 'Paramount Books Pvt Ltd',
    code: 'VEND-PAR',
    contactPerson: 'Zubair Khan',
    email: 'institutional@paramountbooks.com.pk',
    phone: '+92 21 3438100',
    city: 'Karachi',
    rating: 4.7,
    status: 'ACTIVE'
  }
];

export const AcquisitionModule: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [vendors, setVendors] = useState<VendorProfile[]>(INITIAL_VENDORS);
  const [activeTab, setActiveTab] = useState<'POS' | 'VENDORS'>('POS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // New PO Form
  const [poTitle, setPoTitle] = useState('');
  const [poIsbn, setPoIsbn] = useState('');
  const [poVendor, setPoVendor] = useState(vendors[0]?.name || '');
  const [poQty, setPoQty] = useState(1);
  const [poPrice, setPoPrice] = useState(5000);
  const [poBudget, setPoBudget] = useState('Library General Acquisition Grant');

  // New Vendor Form
  const [vName, setVName] = useState('');
  const [vContact, setVContact] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vCity, setVCity] = useState('Islamabad');

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poTitle.trim()) return;

    const newPo: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(880 + Math.random() * 100)}`,
      title: poTitle.trim(),
      isbn: poIsbn || '9780000000000',
      vendorName: poVendor,
      quantity: poQty,
      unitPrice: poPrice,
      totalPrice: poQty * poPrice,
      budgetHead: poBudget,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'PENDING'
    };

    setOrders([newPo, ...orders]);
    setIsPoModalOpen(false);
    setPoTitle('');
    setPoIsbn('');
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) return;

    const newV: VendorProfile = {
      id: `v_${Date.now()}`,
      name: vName.trim(),
      code: `VEND-${vName.substring(0, 3).toUpperCase()}`,
      contactPerson: vContact || 'Procurement Agent',
      email: vEmail || 'contact@vendor.com',
      phone: vPhone || '+92 51 0000000',
      city: vCity,
      rating: 5.0,
      status: 'ACTIVE'
    };

    setVendors([newV, ...vendors]);
    setIsVendorModalOpen(false);
    setVName('');
    setVContact('');
    setVEmail('');
    setVPhone('');
  };

  const handleDeletePo = (id: string) => {
    if (confirm('Are you sure you want to cancel and remove this Purchase Order?')) {
      setOrders(orders.filter(p => p.id !== id));
    }
  };

  const handleUpdatePoStatus = (id: string, status: PurchaseOrder['status']) => {
    setOrders(orders.map(p => (p.id === id ? { ...p, status } : p)));
  };

  const filteredOrders = orders.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSpent = orders.reduce((acc, p) => acc + p.totalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShoppingBag className="h-4 w-4" />
            <span>Procurement & Invoicing Management</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#fafafa]">Acquisitions & Vendor Orders</h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Manage purchase requisitions, publisher invoices, vendor contracts, and departmental budget allocations.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] hover:bg-[#18181b] text-[#fafafa] text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-blue-400" />
            <span>Add Vendor</span>
          </button>
          <button
            onClick={() => setIsPoModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214] space-y-1">
          <div className="text-xs text-[#a1a1aa]">Total PO Commitment</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">PKR {totalSpent.toLocaleString()}</div>
          <div className="text-[10px] text-[#71717a]">3 Approved Budgets Active</div>
        </div>
        <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214] space-y-1">
          <div className="text-xs text-[#a1a1aa]">Active Purchase Orders</div>
          <div className="text-2xl font-bold text-blue-400">{orders.length} Orders</div>
          <div className="text-[10px] text-blue-400">{orders.filter(o => o.status === 'SHIPPED').length} In Transit</div>
        </div>
        <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214] space-y-1">
          <div className="text-xs text-[#a1a1aa]">Registered Vendors</div>
          <div className="text-2xl font-bold text-purple-400">{vendors.length} Publishers</div>
          <div className="text-[10px] text-purple-400">100% Verified Partners</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-2 border-b border-[#27272a] pb-2">
        <button
          onClick={() => setActiveTab('POS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'POS' ? 'bg-emerald-600 text-white shadow-md' : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa]'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Purchase Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('VENDORS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'VENDORS' ? 'bg-blue-600 text-white shadow-md' : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa]'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Vendor Directory ({vendors.length})</span>
        </button>
      </div>

      {activeTab === 'POS' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272a] grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <Search className="h-4 w-4 text-[#a1a1aa] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by PO Number, title, or vendor name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-4">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All PO Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="SHIPPED">Shipped / In-Transit</option>
                <option value="DELIVERED">Delivered & Catalogued</option>
              </select>
            </div>
          </div>

          {/* PO List */}
          <div className="rounded-2xl border border-[#27272a] bg-[#121214] overflow-hidden shadow-xl divide-y divide-[#27272a]">
            {filteredOrders.map(po => (
              <div key={po.id} className="p-5 hover:bg-[#18181b]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
                      {po.poNumber}
                    </span>
                    <span className="text-[10px] text-[#a1a1aa] font-mono">ISBN: {po.isbn}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        po.status === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : po.status === 'SHIPPED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#fafafa]">{po.title}</h3>
                  <div className="text-xs text-[#a1a1aa] flex flex-wrap items-center gap-3">
                    <span>Vendor: <strong className="text-[#fafafa]">{po.vendorName}</strong></span>
                    <span>Qty: <strong className="text-[#fafafa]">{po.quantity} Copies</strong></span>
                    <span>Budget Head: <strong className="text-emerald-400">{po.budgetHead}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 border-[#27272a] pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-emerald-400">PKR {po.totalPrice.toLocaleString()}</div>
                    <div className="text-[10px] text-[#71717a]">Order Date: {po.orderDate}</div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <select
                      value={po.status}
                      onChange={e => handleUpdatePoStatus(po.id, e.target.value as PurchaseOrder['status'])}
                      className="px-2 py-1 rounded-lg bg-[#09090b] border border-[#27272a] text-[10px] font-mono text-[#fafafa] cursor-pointer"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>

                    <button
                      onClick={() => handleDeletePo(po.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                      title="Cancel Purchase Order"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vendors Directory */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
                  {v.code}
                </span>
                <span className="text-xs text-amber-400 font-bold">★ {v.rating} / 5.0</span>
              </div>

              <h3 className="text-sm font-bold text-[#fafafa]">{v.name}</h3>
              <div className="text-xs text-[#a1a1aa] space-y-1 bg-[#09090b] p-3 rounded-xl border border-[#27272a]">
                <div>Contact: <strong className="text-[#fafafa]">{v.contactPerson}</strong></div>
                <div>Email: <strong className="text-blue-400">{v.email}</strong></div>
                <div>Phone: <strong className="text-[#fafafa]">{v.phone}</strong></div>
                <div>Location: <strong className="text-[#fafafa]">{v.city}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add PO Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                <span>Create Purchase Order</span>
              </h2>
              <button onClick={() => setIsPoModalOpen(false)} className="text-[#a1a1aa] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">Book Title / Item Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oxford Companion to Computer Science"
                  value={poTitle}
                  onChange={e => setPoTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">ISBN Number</label>
                  <input
                    type="text"
                    placeholder="9780198765432"
                    value={poIsbn}
                    onChange={e => setPoIsbn(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Vendor Partner</label>
                  <select
                    value={poVendor}
                    onChange={e => setPoVendor(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Quantity (Copies)</label>
                  <input
                    type="number"
                    min={1}
                    value={poQty}
                    onChange={e => setPoQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Unit Price (PKR)</label>
                  <input
                    type="number"
                    min={100}
                    value={poPrice}
                    onChange={e => setPoPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">Budget Allocation Head</label>
                <input
                  type="text"
                  value={poBudget}
                  onChange={e => setPoBudget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#09090b] border border-[#27272a] flex items-center justify-between text-xs">
                <span>Calculated Total PO Amount:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">PKR {(poQty * poPrice).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                <span>Register Vendor Partner</span>
              </h2>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-[#a1a1aa] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">Vendor / Publisher Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elsevier Academic Press"
                  value={vName}
                  onChange={e => setVName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Representative name"
                    value={vContact}
                    onChange={e => setVContact(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">City / Region</label>
                  <input
                    type="text"
                    value={vCity}
                    onChange={e => setVCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={vEmail}
                    onChange={e => setVEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 51 0000000"
                    value={vPhone}
                    onChange={e => setVPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Save Vendor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
