import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductsCatalogProps {
  products: Product[];
  categoryFilters: string[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const genderOptions: Array<'Men' | 'Women'> = ['Men', 'Women'];
const priceBands = [
  { id: 'p1', label: '₹ 0 - ₹ 149', min: 0, max: 149 },
  { id: 'p2', label: '₹ 150 - ₹ 249', min: 150, max: 249 },
  { id: 'p3', label: '₹ 250 - ₹ 349', min: 250, max: 349 },
  { id: 'p4', label: '₹ 350 - ₹ 499', min: 350, max: 499 },
  { id: 'p5', label: '₹ 500+', min: 500, max: Infinity },
];

const parseDiscount = (product: Product) => Number((product.discountLabel || '').match(/\d+/)?.[0] || 0);
const getGender = (product: Product): 'Men' | 'Women' =>
  product.gender ?? (['T-shirts', 'Hoodies', 'Caps'].includes(product.category) ? 'Men' : 'Women');

export const ProductsCatalog: React.FC<ProductsCatalogProps> = ({
  products,
  categoryFilters,
  onAddToCart,
  onViewDetails,
}) => {
  const categories = categoryFilters.filter((c) => c !== 'All');
  const [query, setQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = React.useState<Array<'Men' | 'Women'>>([]);
  const [selectedBand, setSelectedBand] = React.useState<string>('');
  const [sortBy, setSortBy] = React.useState<'newest' | 'priceLow' | 'priceHigh' | 'ratingHigh' | 'discountHigh'>('newest');

  const toggleValue = (value: string, list: string[], setList: (arr: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };
  const toggleGender = (gender: 'Men' | 'Women') => {
    setSelectedGenders((prev) => (prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]));
  };

  const filtered = React.useMemo(() => {
    const band = priceBands.find((b) => b.id === selectedBand);
    let list = products.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const matchesGender = selectedGenders.length === 0 || selectedGenders.includes(getGender(p));
      const matchesBand = !band || (p.price >= band.min && p.price <= band.max);
      return matchesQuery && matchesCategory && matchesGender && matchesBand;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'priceLow':
          return a.price - b.price;
        case 'priceHigh':
          return b.price - a.price;
        case 'ratingHigh':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'discountHigh':
          return parseDiscount(b) - parseDiscount(a);
        default:
          return Number(b.id) - Number(a.id);
      }
    });

    return list;
  }, [products, query, selectedCategories, selectedGenders, selectedBand, sortBy]);

  const byCategoryMobile = React.useMemo(
    () =>
      categories.map((category) => ({
        category,
        items: filtered.filter((p) => p.category === category),
      })),
    [categories, filtered]
  );

  return (
    <section className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-black mb-4 uppercase">Products</h2>
          <p className="text-black/50 font-medium max-w-2xl">Explore all categories with sorting and smart filters.</p>
        </div>

        <div className="md:hidden space-y-14">
          {byCategoryMobile.map(({ category, items }) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-black uppercase tracking-[0.2em]">{category}</h3>
                <span className="flex-1 h-px bg-black/10" />
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent z-10" />
                <div className="overflow-x-auto no-scrollbar pb-2">
                  <div className="flex gap-6">
                    {items.length > 0 ? (
                      items.map((product, index) => (
                        <div key={product.id} className="min-w-[82vw] max-w-[82vw]">
                          <ProductCard
                            product={product}
                            onAddToCart={onAddToCart}
                            onViewDetails={onViewDetails}
                            index={index}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-black/40 font-medium">No products in this category.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:grid grid-cols-[300px_minmax(0,1fr)] gap-8 items-start">
          <aside className="bg-white border border-black/10 rounded-2xl p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={16} />
              <h3 className="text-xs font-black uppercase tracking-[0.25em]">Filters</h3>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70 mb-2">Categories</p>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for categories"
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-3"
                />
                <div className="space-y-1.5 max-h-44 overflow-auto no-scrollbar">
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <label key={cat} className="flex items-center justify-between text-sm text-black/70">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat)}
                            onChange={() => toggleValue(cat, selectedCategories, setSelectedCategories)}
                          />
                          {cat}
                        </span>
                        <span className="text-xs text-black/40">{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70 mb-2">Gender</p>
                <div className="space-y-1.5">
                  {genderOptions.map((gender) => (
                    <label key={gender} className="flex items-center gap-2 text-sm text-black/70">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes(gender)}
                        onChange={() => toggleGender(gender)}
                      />
                      {gender}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70 mb-2">Prices</p>
                <div className="space-y-1.5">
                  {priceBands.map((band) => (
                    <label key={band.id} className="flex items-center gap-2 text-sm text-black/70">
                      <input
                        type="radio"
                        name="priceBand"
                        checked={selectedBand === band.id}
                        onChange={() => setSelectedBand(selectedBand === band.id ? '' : band.id)}
                      />
                      {band.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-black/60">{filtered.length} products</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-black/10 rounded-full px-4 py-2 text-sm font-medium"
              >
                <option value="newest">Newest</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="ratingHigh">Top Rated</option>
                <option value="discountHigh">Highest Discount</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-20">
              {filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

