import React from 'react';
import { ShoppingBag, Menu, X, Search, Heart, Camera } from 'lucide-react';
import logoImage from '../../logo.jpeg';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onHomeClick: () => void;
  onCollectionsClick: () => void;
  onProductsClick: () => void;
  onAboutClick: () => void;
  onARLensClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onCartClick,
  onHomeClick,
  onCollectionsClick,
  onProductsClick,
  onAboutClick,
  onARLensClick,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [processedLogo, setProcessedLogo] = React.useState<string>(logoImage);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const img = new Image();
    img.src = logoImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Remove near-black background while preserving colored logo pixels.
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r < 40 && g < 40 && b < 40) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedLogo(canvas.toDataURL('image/png'));
    };
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md py-4 border-b border-black/5' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onHomeClick}
            className="flex items-center gap-3 focus:outline-none"
          >
            <span className="h-14 w-14 flex items-center justify-center">
              <img
                src={processedLogo}
                alt="TFiZ logo"
                className="h-full w-full object-contain object-center scale-125"
              />
            </span>
            <span className="text-3xl font-black italic tracking-tighter leading-none">
              TFiZ
            </span>
          </button>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={onProductsClick}
            className="text-sm font-medium hover:text-black/60 transition-colors"
          >
            Products
          </button>
          <button
            onClick={onCollectionsClick}
            className="text-sm font-medium hover:text-black/60 transition-colors"
          >
            Collections
          </button>
          <button
            onClick={onAboutClick}
            className="text-sm font-medium hover:text-black/60 transition-colors"
          >
            About
          </button>
          <button
            onClick={onARLensClick}
            className="text-sm font-medium hover:text-black/60 transition-colors inline-flex items-center gap-2"
          >
            <Camera size={15} />
            AR Lens
          </button>
          
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-black/10">
            <button className="p-2 hover:bg-black/5 rounded-full transition-colors" aria-label="Search">
              <Search size={20} />
            </button>
            <button className="p-2 hover:bg-black/5 rounded-full transition-colors" aria-label="Interest">
              <Heart size={20} />
            </button>
            <button 
              onClick={onCartClick}
              className="relative p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onARLensClick}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
            aria-label="Open AR Lens"
          >
            <Camera size={20} />
          </button>
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors" aria-label="Search">
            <Search size={20} />
          </button>
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors" aria-label="Interest">
            <Heart size={20} />
          </button>
          <button onClick={onCartClick} className="relative p-2">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-black/5 p-6 md:hidden">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                onProductsClick();
                setIsMenuOpen(false);
              }}
              className="text-left text-lg font-bold"
            >
              Products
            </button>
            <button
              onClick={() => {
                onCollectionsClick();
                setIsMenuOpen(false);
              }}
              className="text-left text-lg font-bold"
            >
              Collections
            </button>
            <button
              onClick={() => {
                onAboutClick();
                setIsMenuOpen(false);
              }}
              className="text-left text-lg font-bold"
            >
              About
            </button>
            <button
              onClick={() => {
                onARLensClick();
                setIsMenuOpen(false);
              }}
              className="text-left text-lg font-bold inline-flex items-center gap-2"
            >
              <Camera size={18} />
              AR Lens
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
