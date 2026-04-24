import React from 'react';
import { ShoppingBag, Sparkles, Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails, index = 0 }) => {
  const inStock = product.inStock ?? true;
  const rating = product.rating ?? 4.5;

  return (
    <div
      onClick={() => onViewDetails(product)}
      className={`group cursor-pointer bg-white rounded-[3.5rem] overflow-hidden border border-gray-100 transition-all duration-700 animate-in fade-in slide-in-from-bottom-12 ${
        inStock ? 'hover:border-black/5 hover:shadow-3xl' : 'opacity-60 grayscale'
      }`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-all duration-1000 ${
            inStock ? 'md:grayscale md:group-hover:grayscale-0 md:group-hover:scale-110' : 'grayscale'
          }`}
          referrerPolicy="no-referrer"
        />

        <div className="absolute top-6 left-6 flex flex-col gap-2.5">
          {!inStock && (
            <span className="bg-red-500 text-white text-[10px] font-black px-6 py-3 rounded-full uppercase tracking-[0.3em] shadow-2xl animate-pulse">
              Sold Out
            </span>
          )}
          {product.discountLabel && (
            <span className="bg-black text-white text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-widest shadow-2xl">
              {product.discountLabel}
            </span>
          )}
          {product.arReady && (
            <span className="bg-white/95 backdrop-blur-xl text-black text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-widest flex items-center gap-2.5 border border-black/5 shadow-2xl">
              <Sparkles size={12} />
              AR Ready
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (inStock) onAddToCart(product);
          }}
          disabled={!inStock}
          className="absolute bottom-10 right-10 w-20 h-20 bg-black text-white shadow-2xl rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-6 group-hover:translate-y-0 active:scale-90 hover:bg-zinc-800 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={24} />
        </button>
      </div>

      <div className="p-12">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">
            {product.category}
          </span>
          <span className="flex-1 h-px bg-gray-50" />
        </div>

        {product.artist && (
          <p className="text-[11px] text-black/45 font-bold mb-3">
            By {product.artist.name}
          </p>
        )}

        <h3 className="text-3xl font-black text-gray-900 mb-6 uppercase italic leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-black group-hover:to-gray-400 transition-all">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-4xl font-black text-gray-900 tracking-tighter italic">
            ₹{product.price}
          </span>
          <span className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-100">
            <Star size={14} className="fill-black text-black" />
            <span className="text-xs font-black">{rating.toFixed(1)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
