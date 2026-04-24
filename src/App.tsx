import React, { useState, useMemo, useEffect, useCallback, Component } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { ProductPage } from './components/ProductPage';
import { ArtistPage } from './components/ArtistPage';
import { ProductsCatalog } from './components/ProductsCatalog';
import { TrackOrderPage } from './components/TrackOrderPage';
import SuperheroARView from "./ar/SuperheroARView"
import { CheckoutModal } from './components/CheckoutModal';
import { products as initialProducts } from './data/products';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SpinWheel, SpinResult } from './components/SpinWheel';
import { Product, CartItem, ArtistProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Instagram, 
  Twitter, 
  Github,
  ChevronRight,
  ShoppingBag,
  Settings,
  Lock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, query, doc, getDoc, setDoc, Timestamp, addDoc } from 'firebase/firestore';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-black text-white p-12 rounded-[40px] text-center shadow-2xl">
            <AlertTriangle size={64} className="mx-auto mb-8 text-red-600" />
            <h1 className="text-4xl font-black italic tracking-tighter mb-6 uppercase">SYSTEM ERROR</h1>
            <p className="text-white/60 mb-10 font-medium">
              An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black py-4 rounded-full font-bold hover:scale-105 transition-transform"
            >
              REFRESH SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const categoryFilters = ['All', 'T-shirts', 'Caps', 'Hoodies', 'Paintings', 'Wall Frames', 'Terrarium', 'Fan Made'];

  const [productList, setProductList] = useState<Product[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'products' | 'tracking'>('home');
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  const [arLensProduct, setArLensProduct] = useState<Product | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [spinDiscount, setSpinDiscount] = useState<SpinResult | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Products Listener
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // If no products in DB yet, seed with initial products (only for first time)
      if (productsData.length === 0 && initialProducts.length > 0) {
        setProductList(initialProducts);
      } else {
        setProductList(productsData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  const heroSlides = [
    {
      title1: "TFi",
      title2: "ZINDABAD",
      title3: "",
      subtitle: "THE FUTURE OF FASHION IS HERE. EXPERIENCE THE BLEND OF TRADITION AND TECHNOLOGY."
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
    showToast(`Added ${product.name} to bag`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProductList(newProducts);
  };

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  const resetScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const normalizePath = useCallback((rawPath: string) => {
    if (!rawPath || rawPath === '#') return '/';
    const withoutHash = rawPath.startsWith('#') ? rawPath.slice(1) : rawPath;
    if (!withoutHash || withoutHash === '/') return '/';
    return withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  }, []);

  const getCurrentPath = useCallback(() => {
    return normalizePath(window.location.hash);
  }, [normalizePath]);

  const navigateTo = useCallback((path: string, replace = false) => {
    const normalized = normalizePath(path);
    const nextHash = `#${normalized}`;
    if (replace) {
      window.history.replaceState(null, '', nextHash);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    if (window.location.hash === nextHash) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    window.location.hash = normalized;
  }, [normalizePath]);

  const applyRoute = useCallback((path: string) => {
    const route = normalizePath(path);

    if (route === '/') {
      setIsAdminView(false);
      setSelectedProduct(null);
      setSelectedArtist(null);
      setArLensProduct(null);
      setCurrentView('home');
      resetScrollToTop();
      return;
    }

    if (route === '/products') {
      setIsAdminView(false);
      setSelectedProduct(null);
      setSelectedArtist(null);
      setArLensProduct(null);
      setCurrentView('products');
      resetScrollToTop();
      return;
    }

    if (route === '/track-order') {
      setIsAdminView(false);
      setSelectedProduct(null);
      setSelectedArtist(null);
      setArLensProduct(null);
      setCurrentView('tracking');
      resetScrollToTop();
      return;
    }

    if (route === '/collections') {
      setIsAdminView(false);
      setSelectedProduct(null);
      setSelectedArtist(null);
      setArLensProduct(null);
      setCurrentView('home');
      resetScrollToTop();
      setTimeout(() => scrollToSection('shop'), 60);
      return;
    }

    if (route === '/about') {
      setIsAdminView(false);
      setSelectedProduct(null);
      setSelectedArtist(null);
      setArLensProduct(null);
      setCurrentView('home');
      resetScrollToTop();
      setTimeout(() => scrollToSection('about'), 60);
      return;
    }

    if (route.startsWith('/arlens/')) {
      const id = decodeURIComponent(route.replace('/arlens/', ''));
      const product = productList.find((p) => p.id === id && p.arReady);
      if (!product) {
        if (productList.length > 0) navigateTo('/products', true);
        return;
      }
      setIsAdminView(false);
      setSelectedArtist(null);
      setSelectedProduct(product);
      setArLensProduct(product);
      setCurrentView('products');
      resetScrollToTop();
      return;
    }

    if (route.startsWith('/product/')) {
      const id = decodeURIComponent(route.replace('/product/', ''));
      const product = productList.find((p) => p.id === id);
      if (!product) {
        if (productList.length > 0) navigateTo('/products', true);
        return;
      }
      setIsAdminView(false);
      setSelectedArtist(null);
      setSelectedProduct(product);
      setArLensProduct(null);
      setCurrentView('products');
      resetScrollToTop();
      return;
    }

    if (route.startsWith('/artist/')) {
      const handle = decodeURIComponent(route.replace('/artist/', ''));
      const artistProduct = productList.find((p) => p.artist?.handle === handle);
      if (!artistProduct?.artist) {
        if (productList.length > 0) navigateTo('/products', true);
        return;
      }
      setIsAdminView(false);
      setSelectedProduct(null);
      setSelectedArtist(artistProduct.artist);
      setArLensProduct(null);
      setCurrentView('products');
      resetScrollToTop();
      return;
    }

    if (route === '/admin') {
      if (isAdminAuthenticated) {
        setSelectedProduct(null);
        setSelectedArtist(null);
        setArLensProduct(null);
        setCurrentView('home');
        setIsAdminView(true);
        resetScrollToTop();
      } else {
        setIsAdminView(false);
        setIsLoginModalOpen(true);
        navigateTo('/', true);
      }
      return;
    }

    navigateTo('/', true);
  }, [isAdminAuthenticated, navigateTo, normalizePath, productList, resetScrollToTop, scrollToSection]);

  useEffect(() => {
    const handleRouteChange = () => applyRoute(getCurrentPath());
    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, [applyRoute, getCurrentPath]);

  const openProductPage = (product: Product) => {
    navigateTo(`/product/${encodeURIComponent(product.id)}`);
  };

  const openArtistPage = (artist: ArtistProfile) => {
    navigateTo(`/artist/${encodeURIComponent(artist.handle)}`);
  };

  const openARLens = (product: Product) => {
    if (!product.arReady) return;
    navigateTo(`/arlens/${encodeURIComponent(product.id)}`);
  };

  const closeArtistPage = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/products', true);
    }
  };

  const closeProductPage = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/products', true);
    }
  };

  const closeARLens = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (selectedProduct) {
      navigateTo(`/product/${encodeURIComponent(selectedProduct.id)}`, true);
    } else {
      navigateTo('/products', true);
    }
  };

  const goHome = () => {
    navigateTo('/');
  };

  const goCollections = () => {
    navigateTo('/collections');
  };

  const goAbout = () => {
    navigateTo('/about');
  };

  const goProducts = () => {
    navigateTo('/products');
  };

  const goTracking = () => {
    navigateTo('/track-order');
  };

  const goARLens = () => {
    const arProduct = productList.find((p) => p.arReady);
    if (!arProduct) {
      showToast('AR Lens is not available right now.', 'error');
      return;
    }
    openARLens(arProduct);
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      navigateTo(isAdminView ? '/' : '/admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleAdminPasswordLogin = (password: string) => {
    // NOTE: For a real app, this should be validated on a backend.
    const isValid = password === 'admin123';
    if (isValid) {
      setIsAdminAuthenticated(true);
      setIsLoginModalOpen(false);
      navigateTo('/admin');
    }
    return isValid;
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: newsletterEmail,
        createdAt: Timestamp.now()
      });
      showToast('Successfully joined the revolution!');
      setNewsletterEmail('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'subscribers');
      showToast('Failed to join. Please try again.', 'error');
    }
  };

  const handleSpinWin = (result: SpinResult) => {
    if (result.value > 0) {
      setSpinDiscount(result);
      showToast(`${result.label} unlocked and applied at checkout`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-black border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
        <Navbar
          cartCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          onHomeClick={goHome}
          onCollectionsClick={goCollections}
          onProductsClick={goProducts}
          onAboutClick={goAbout}
          onARLensClick={goARLens}
        />

        <main>
          <AnimatePresence mode="wait">
            {isAdminView ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                <AdminPanel
                  products={productList}
                  onUpdateProducts={handleUpdateProducts}
                  onClose={goHome}
                />
              </motion.div>
            ) : selectedProduct ? (
              <motion.div
                key="product-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                <ProductPage
                  product={selectedProduct}
                  onBack={closeProductPage}
                  onAddToCart={addToCart}
                  onOpenArtist={openArtistPage}
                  onOpenARLens={openARLens}
                />
              </motion.div>
            ) : selectedArtist ? (
              <motion.div
                key="artist-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                <ArtistPage
                  artist={selectedArtist}
                  products={productList.filter(
                    (product) =>
                      product.artist?.handle === selectedArtist.handle,
                  )}
                  onBack={closeArtistPage}
                  onSelectProduct={openProductPage}
                />
              </motion.div>
            ) : currentView === "products" ? (
              <motion.div
                key="products-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                <ProductsCatalog
                  products={productList}
                  categoryFilters={categoryFilters}
                  onAddToCart={addToCart}
                  onViewDetails={openProductPage}
                />
              </motion.div>
            ) : currentView === "tracking" ? (
              <motion.div
                key="tracking-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                <TrackOrderPage onBack={goHome} />
              </motion.div>
            ) : (
              <motion.div
                key="store"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}>
                {/* Hero Section */}
                <section className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto bg-black rounded-[28px] sm:rounded-[40px] p-6 sm:p-8 md:p-20 lg:p-24 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 max-w-4xl">
                        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[120px] font-black italic tracking-tighter leading-[0.85] mb-8 sm:mb-12 flex flex-col">
                          <span
                            className="text-white glitch"
                            data-text={heroSlides[currentSlide].title1}>
                            {heroSlides[currentSlide].title1}
                          </span>
                          <span
                            className="text-red-600 glitch"
                            data-text={heroSlides[currentSlide].title2}>
                            {heroSlides[currentSlide].title2}
                          </span>
                          <span className="bg-gradient-to-r from-red-500 via-red-700 to-red-900 bg-clip-text text-transparent">
                            {heroSlides[currentSlide].title3}
                          </span>
                        </h1>

                        <div className="max-w-xl">
                          <p className="text-[11px] sm:text-xs md:text-sm font-bold text-white/60 uppercase tracking-widest leading-relaxed mb-8 sm:mb-12">
                            {heroSlides[currentSlide].subtitle}
                          </p>

                          <div className="flex flex-col sm:flex-row gap-4">
                            <button
                              type="button"
                              onClick={goARLens}
                              className="w-full sm:w-auto bg-white text-black px-8 sm:px-10 py-4 rounded-full font-bold flex items-center justify-center gap-2 group hover:scale-105 hover:text-black/80 transition-transform">
                              Try AR{" "}
                              <ArrowRight
                                size={20}
                                className="group-hover:translate-x-1 transition-transform"
                              />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Slide Indicators */}
                    <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20 flex gap-2">
                      {heroSlides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`h-1 transition-all duration-300 rounded-full ${idx === currentSlide ? "w-8 bg-white" : "w-2 bg-white/20"}`}
                        />
                      ))}
                    </div>

                    {/* Subtle background glow */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full pointer-events-none opacity-20">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-800 rounded-full blur-[120px]" />
                    </div>
                  </motion.div>
                </section>

                {/* Spin & Win Section */}
                <SpinWheel onWin={handleSpinWin} />

                {/* Shop Section */}
                <section id="shop" className="py-24 max-w-7xl mx-auto px-6">
                  <div className="mb-12">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-black mb-4 uppercase">
                      THE COLLECTION
                    </h2>
                    <p className="text-black/50 font-medium max-w-md">
                      Browse our latest drop of digital-enhanced apparel and
                      accessories.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-20">
                    {productList.slice(0, 6).map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        onViewDetails={openProductPage}
                        index={index}
                      />
                    ))}
                  </div>

                  <div className="mt-12 flex justify-center">
                    <button
                      type="button"
                      onClick={goProducts}
                      className="px-10 py-4 rounded-full bg-black text-white font-bold uppercase tracking-[0.2em] text-sm hover:bg-black/85 transition-colors">
                      View All Products
                    </button>
                  </div>
                </section>

                {/* Newsletter / About Section */}
                <section id="about" className="py-24 relative overflow-hidden">
                  <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="bg-black rounded-[40px] p-12 md:p-24 text-center text-white">
                      <motion.div
                        whileInView={{ opacity: 1, scale: 1 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        viewport={{ once: true }}>
                        <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-8 uppercase">
                          JOIN THE <br />
                          REVOLUTION
                        </h2>
                        <p className="text-lg text-white/60 max-w-xl mx-auto mb-12">
                          Be the first to know when we drop our next collection.
                          Early access members get exclusive benefits and
                          airdrops.
                        </p>
                        <form
                          className="max-w-md mx-auto flex flex-col sm:flex-row gap-4"
                          onSubmit={handleNewsletterSubmit}>
                          <input
                            type="email"
                            required
                            placeholder="Enter your email"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-4 focus:outline-none focus:border-white/50 transition-colors"
                          />
                          <button
                            type="submit"
                            className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-white/90 transition-colors">
                            Join Now
                          </button>
                        </form>
                      </motion.div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="py-20 border-t border-black/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-20">
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black italic tracking-tighter leading-none">
                      TFiZ
                    </span>
                    <button
                      onClick={handleAdminAccess}
                      className="px-6 py-2.5 bg-black text-white rounded-full hover:scale-105 transition-all flex items-center gap-3 group text-sm">
                      <Lock size={14} className="group-hover:text-white/80" />
                      <span className="font-black italic tracking-tighter">
                        ADMIN CONSOLE
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-black/50 max-w-xs leading-relaxed">
                  Redefining fashion for the digital age. Wear the future,
                  today.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-6">Platform</h4>
                <ul className="space-y-4 text-black/50 text-sm">
                  <li>
                    <a href="#" className="hover:text-black transition-colors">
                      Marketplace
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-black transition-colors">
                      Collections
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-black transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={goTracking}
                      className="hover:text-black transition-colors">
                      Track Order
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-6">Connect</h4>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-black text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-black transition-all duration-300">
                    <Instagram size={18} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-black text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-black transition-all duration-300">
                    <Twitter size={18} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-black text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-black transition-all duration-300">
                    <Github size={18} />
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-10 pb-10 px-6 border-t border-black/5 text-xs text-white font-bold uppercase tracking-widest bg-black rounded-2xl mt-10">
              <p>© 2026 TFiZ PLATFORM. ALL RIGHTS RESERVED.</p>
              <div className="flex gap-8 mt-4 md:mt-0 items-center">
                <a href="#" className="hover:text-white/70 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white/70 transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          spinDiscountPercent={spinDiscount?.value ?? 0}
          spinDiscountLabel={spinDiscount?.label}
          onCheckout={() => {
            setIsCartOpen(false)
            setIsCheckoutOpen(true)
          }}
        />

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cartItems}
          spinDiscountPercent={spinDiscount?.value ?? 0}
          spinDiscountLabel={spinDiscount?.label}
          onSuccess={() => {
            // Clear cart after successful checkout
            setTimeout(() => {
              setCartItems([])
              setSpinDiscount(null)
            }, 2000)
          }}
        />

        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleAdminPasswordLogin}
        />

        {arLensProduct && <SuperheroARView onClose={closeARLens} />}

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 50, x: "-50%" }}
              className={`fixed bottom-10 left-1/2 z-[200] px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md ${
                toast.type === "success"
                  ? "bg-black/90 text-white"
                  : "bg-red-600/90 text-white"
              }`}>
              {toast.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  )
};

export default App;
