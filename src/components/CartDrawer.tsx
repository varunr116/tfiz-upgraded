import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  spinDiscountPercent?: number;
  spinDiscountLabel?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  spinDiscountPercent = 0,
  spinDiscountLabel,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * spinDiscountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-black/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} />
              <h2 className="text-xl font-bold">Your Bag ({items.length})</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center">
                  <ShoppingBag size={32} className="opacity-20" />
                </div>
                <p className="text-black/50 font-medium">Your bag is empty.</p>
                <button onClick={onClose} className="text-sm font-bold uppercase tracking-widest hover:text-black/60 transition-colors">
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-24 h-24 bg-black/5 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold">{item.name}</h3>
                        <button onClick={() => onRemove(item.id)} className="text-xs font-bold opacity-30 hover:opacity-100 transition-opacity">
                          Remove
                        </button>
                      </div>
                      <p className="text-sm text-black/50">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-black/10 rounded-full px-2 py-1">
                        <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-black/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-black/50 font-medium">Subtotal</span>
              <span className="text-xl font-bold">₹{subtotal}</span>
            </div>
            {spinDiscountPercent > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-black/60 font-medium">
                  Spin Discount ({spinDiscountLabel || `${spinDiscountPercent}% OFF`})
                </span>
                <span className="font-bold text-green-700">-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-black/50 font-medium">Total</span>
              <span className="text-xl font-bold">₹{total}</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={items.length === 0}
            >
              Checkout
            </button>
            <p className="text-[10px] text-center text-black/30 font-bold uppercase tracking-widest">
              Free shipping on all digital-first orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
