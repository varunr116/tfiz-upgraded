import React from 'react';
import { ArrowLeft, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { ArtistProfile, Product } from '../types';

interface ProductPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onOpenArtist: (artist: ArtistProfile) => void;
  onOpenARLens: (product: Product) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ product, onBack, onAddToCart, onOpenArtist, onOpenARLens }) => {
  const inStock = product.inStock ?? true;
  const rating = product.rating ?? 4.5;
  const [selectedSize, setSelectedSize] = React.useState<'S' | 'M' | 'L' | 'XL'>('M');
  const [quantity, setQuantity] = React.useState(1);

  const gallery = React.useMemo(() => {
    const fallback = [
      product.image,
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=900',
    ];
    const images = product.gallery && product.gallery.length > 0 ? [product.image, ...product.gallery] : fallback;
    return images.slice(0, 4);
  }, [product]);

  const [selectedImage, setSelectedImage] = React.useState(gallery[0]);

  React.useEffect(() => {
    setSelectedImage(gallery[0]);
    setSelectedSize('M');
    setQuantity(1);
  }, [product.id, gallery]);

  return (
    <section className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/85 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Collection
        </button>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="rounded-[2.25rem] overflow-hidden border border-black/5 bg-gray-50 mb-4">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {gallery.map((img, idx) => (
                <button
                  key={`${product.id}-gallery-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`rounded-2xl overflow-hidden border transition-all ${
                    selectedImage === img ? 'border-black shadow-lg' : 'border-black/5'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full aspect-square object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 sm:p-10 lg:sticky lg:top-24">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mb-3">
              {product.category}
            </p>
            <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-black italic tracking-tighter">₹{product.price}</span>
              <span className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-100">
                <Star size={14} className="fill-black text-black" />
                <span className="text-xs font-black">{rating.toFixed(1)}</span>
              </span>
            </div>

            <p className="text-black/60 leading-relaxed mb-8">{product.description}</p>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/40 mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {(['S', 'M', 'L', 'XL'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 rounded-lg border text-xs font-black transition-colors ${
                        selectedSize === size ? 'bg-black text-white border-black' : 'bg-white border-black/15'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/40 mb-2">Quantity</p>
                <div className="inline-flex items-center border border-black/15 rounded-full px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full hover:bg-black/5"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-black">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-full hover:bg-black/5"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              {!inStock && (
                <span className="bg-red-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                  Sold Out
                </span>
              )}
              {product.discountLabel && (
                <span className="bg-black text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                  {product.discountLabel}
                </span>
              )}
              {product.arReady && (
                <span className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-black/10 flex items-center gap-2">
                  <Sparkles size={12} />
                  AR Ready
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  for (let i = 0; i < quantity; i += 1) onAddToCart(product);
                }}
                disabled={!inStock}
                className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-black/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={18} />
                {inStock ? 'Add to Bag' : 'Out of Stock'}
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-4 border border-black/15 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-black/5 transition-colors"
              >
                Add to Wishlist
              </button>
              {product.arReady && (
                <button
                  type="button"
                  onClick={() => onOpenARLens(product)}
                  className="w-full sm:w-auto px-8 py-4 border border-black rounded-full font-bold uppercase tracking-widest text-sm bg-black text-white hover:bg-black/85 transition-colors"
                >
                  Open AR Lens
                </button>
              )}
            </div>
          </div>
        </div>

        {product.artist && (
          <div className="mt-10 bg-white rounded-[2.5rem] border border-black/5 p-8 sm:p-10">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.35em] mb-6">
              Artist Profile
            </p>
            <button
              type="button"
              onClick={() => onOpenArtist(product.artist!)}
              className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-black/[0.02] rounded-2xl p-2 transition-colors"
            >
              <img
                src={product.artist.avatar}
                alt={product.artist.name}
                className="w-20 h-20 rounded-full object-cover border border-black/10"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-2xl font-black tracking-tight">{product.artist.name}</h3>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-black/40 mt-1">
                  @{product.artist.handle} - {product.artist.specialty}
                </p>
                <p className="text-black/60 mt-3 leading-relaxed">{product.artist.bio}</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

