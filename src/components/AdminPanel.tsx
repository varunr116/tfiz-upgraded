import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Image as ImageIcon,
  Tag,
  DollarSign,
  FileText,
  LayoutGrid,
  List,
  Search,
  AlertCircle,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface AdminPanelProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ products, onUpdateProducts, onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Orders
  useEffect(() => {
    if (activeTab === 'orders') {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: 'T-shirts',
    image: '',
    description: '',
    isLimited: false
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      category: 'T-shirts',
      image: '',
      description: '',
      isLimited: false
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        const productRef = doc(db, 'products', editingId);
        await updateDoc(productRef, formData);
      } else {
        await addDoc(collection(db, 'products'), formData);
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'products');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-3 hover:bg-black/5 rounded-full transition-colors text-black/60 hover:text-black"
            title="Back to Store"
          >
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Platform Console</h2>
            <div className="flex items-center gap-4">
              <p className="text-black/50 font-medium">Manage your digital ecosystem.</p>
              <button 
                onClick={handleLogout} 
                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors border-l border-black/10 pl-4 flex items-center gap-2"
              >
                <LogOut size={12} /> Logout Session
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-black/5 p-1 rounded-full mr-4">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-black text-white shadow-lg' : 'text-black/40 hover:text-black/60'}`}
            >
              Inventory
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-black text-white shadow-lg' : 'text-black/40 hover:text-black/60'}`}
            >
              Orders
            </button>
          </div>
          {activeTab === 'inventory' && (
            <>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 bg-black/5 border border-transparent rounded-full focus:outline-none focus:border-black/20 transition-colors w-64"
                />
              </div>
              <div className="flex bg-black/5 p-1 rounded-full">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-black/30'}`}
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-black/30'}`}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-black text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Plus size={20} /> Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
              >
                <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-black/5 flex justify-between items-center">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                      {editingId ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <button onClick={resetForm} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-black/50 flex items-center gap-2">
                          <Tag size={14} /> Product Name
                        </label>
                        <input 
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-black/5 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-black/20 transition-colors"
                          placeholder="e.g. NEON OVERLAY"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-black/50 flex items-center gap-2">
                          <DollarSign size={14} /> Price (INR)
                        </label>
                        <input 
                          required
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full bg-black/5 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-black/20 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-black/50 flex items-center gap-2">
                          <LayoutGrid size={14} /> Category
                        </label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                          className="w-full bg-black/5 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-black/20 transition-colors appearance-none"
                        >
                          <option value="T-shirts">T-shirts</option>
                          <option value="Caps">Caps</option>
                          <option value="Hoodies">Hoodies</option>
                          <option value="Paintings">Paintings</option>
                          <option value="Wall Frames">Wall Frames</option>
                          <option value="Terrarium">Terrarium</option>
                          <option value="Fan Made">Fan Made</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-black/50 flex items-center gap-2">
                          <ImageIcon size={14} /> Image URL
                        </label>
                        <input 
                          required
                          type="url"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="w-full bg-black/5 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-black/20 transition-colors"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-black/50 flex items-center gap-2">
                        <FileText size={14} /> Description
                      </label>
                      <textarea 
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-black/5 border border-transparent rounded-2xl px-6 py-4 focus:outline-none focus:border-black/20 transition-colors h-32 resize-none"
                        placeholder="Describe the product..."
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="isLimited"
                        checked={formData.isLimited}
                        onChange={(e) => setFormData({ ...formData, isLimited: e.target.checked })}
                        className="w-5 h-5 rounded border-black/10 text-black focus:ring-black"
                      />
                      <label htmlFor="isLimited" className="text-sm font-bold uppercase tracking-widest cursor-pointer">
                        Limited Edition Release
                      </label>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-black text-white py-5 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><Save size={20} /> {editingId ? 'Update Product' : 'Create Product'}</>
                        )}
                      </button>
                      <button 
                        type="button"
                        onClick={resetForm}
                        className="px-10 py-5 border border-black/10 rounded-full font-bold hover:bg-black/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {viewMode === 'list' ? (
            <div className="bg-white border border-black/5 rounded-[40px] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/5 text-xs font-bold uppercase tracking-widest text-black/50">
                    <th className="px-8 py-6">Product</th>
                    <th className="px-8 py-6">Category</th>
                    <th className="px-8 py-6">Price (₹)</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="group hover:bg-black/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold">{product.name}</div>
                            <div className="text-xs text-black/40 truncate max-w-[200px]">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-bold">
                        ₹{product.price}
                      </td>
                      <td className="px-8 py-6">
                        {product.isLimited ? (
                          <span className="text-[10px] font-black italic uppercase tracking-tighter bg-black text-white px-2 py-1 rounded">
                            Limited
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/60 hover:text-black"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center">
                  <AlertCircle className="mx-auto mb-4 text-black/20" size={48} />
                  <p className="text-black/40 font-bold uppercase tracking-widest">No products found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map(product => (
                <div key={product.id} className="group bg-white border border-black/5 rounded-[40px] overflow-hidden hover:shadow-xl transition-all">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="w-12 h-12 bg-white text-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl">{product.name}</h3>
                      <span className="font-bold">${product.price}</span>
                    </div>
                    <p className="text-sm text-black/50 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full">
                        {product.category}
                      </span>
                      {product.isLimited && (
                        <span className="text-[10px] font-black italic uppercase tracking-tighter bg-black text-white px-3 py-1 rounded-full">
                          Limited
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full p-20 text-center bg-black/5 rounded-[40px]">
                  <AlertCircle className="mx-auto mb-4 text-black/20" size={48} />
                  <p className="text-black/40 font-bold uppercase tracking-widest">No products found</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
                <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-black/5 rounded-[40px] p-8 hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center text-black/40">
                    <Package size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold uppercase tracking-tighter">Order #{order.id.slice(-6)}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-black/40 font-medium">
                      <span className="flex items-center gap-1"><Clock size={12} /> {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleString() : 'Just now'}</span>
                      <span>User: {order.userEmail || order.userId.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-black/30 mb-1">Total Amount</div>
                    <div className="text-2xl font-black italic tracking-tighter">₹{order.total}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all"
                      title="Mark as Completed"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all"
                      title="Cancel Order"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/30">Shipping Details</h4>
                  <div className="bg-black/5 p-6 rounded-3xl space-y-2">
                    <p className="text-sm font-bold">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                    <p className="text-sm text-black/60">{order.shippingAddress?.address}</p>
                    <p className="text-sm text-black/60">{order.shippingAddress?.city}, {order.shippingAddress?.zipCode}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/30">Order Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-black/5 rounded-2xl">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-xs">
                          {item.quantity}x
                        </div>
                        <div>
                          <div className="font-bold text-sm truncate max-w-[120px]">{item.name}</div>
                          <div className="text-xs text-black/40">₹{item.price} each</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-20 text-center bg-black/5 rounded-[40px]">
              <Package className="mx-auto mb-4 text-black/20" size={48} />
              <p className="text-black/40 font-bold uppercase tracking-widest">No orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
