import React from 'react';
import { X, ShoppingBag, ChevronRight } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md hover:bg-black hover:text-white rounded-full transition-all"
        >
          <X size={24} />
        </button>

        <div className="md:w-1/2 h-80 md:h-auto overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-2 block">
                  {product.category}
                </span>
                <h2 className="text-4xl font-extrabold tracking-tighter mb-2">{product.name}</h2>
                <span className="text-2xl font-bold">₹{product.price}</span>
              </div>
              {product.isLimited && (
                <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Limited
                </span>
              )}
            </div>
            <p className="text-black/60 leading-relaxed mb-8">
              {product.description}
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-black/5 rounded-full flex items-center justify-center">
                  <ChevronRight size={12} className="text-black/30" />
                </div>
                <span className="text-sm font-medium">Digital-first authentication</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-black/5 rounded-full flex items-center justify-center">
                  <ChevronRight size={12} className="text-black/30" />
                </div>
                <span className="text-sm font-medium">Sustainable materials & production</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex-1 bg-black text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-black/80 transition-all"
            >
              <ShoppingBag size={20} />
              Add to Bag
            </button>
            <button className="flex-1 border border-black/10 py-4 rounded-full font-bold hover:bg-black/5 transition-colors">
              Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
