import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { ArtistProfile, Product } from '../types';

interface ArtistPageProps {
  artist: ArtistProfile;
  products: Product[];
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ArtistPage: React.FC<ArtistPageProps> = ({ artist, products, onBack, onSelectProduct }) => {
  return (
    <section className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/85 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 sm:p-10 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <img
              src={artist.avatar}
              alt={artist.name}
              className="w-24 h-24 rounded-full object-cover border border-black/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.3em] mb-2">
                Artist Profile
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{artist.name}</h1>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/50 mt-1">
                @{artist.handle} - {artist.specialty}
              </p>
              <p className="text-black/65 mt-4 leading-relaxed max-w-3xl">{artist.bio}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Works by {artist.name}
          </h2>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-black/40">
            {products.length} products
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelectProduct(product)}
              className="text-left bg-white rounded-[2rem] overflow-hidden border border-black/5 hover:shadow-2xl transition-all"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-6">
                <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.3em] mb-2">
                  {product.category}
                </p>
                <h3 className="text-xl font-black uppercase italic tracking-tight mb-3">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black italic tracking-tighter">₹{product.price}</span>
                  <span className="flex items-center gap-1.5 text-xs font-black bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <Star size={12} className="fill-black text-black" />
                    {(product.rating ?? 4.5).toFixed(1)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

