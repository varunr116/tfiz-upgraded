export interface ArtistProfile {
  name: string;
  handle: string;
  bio: string;
  specialty: string;
  avatar: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'T-shirts' | 'Caps' | 'Hoodies' | 'Paintings' | 'Wall Frames' | 'Terrarium' | 'Fan Made';
  gender?: 'Men' | 'Women';
  image: string;
  gallery?: string[];
  description: string;
  isLimited?: boolean;
  inStock?: boolean;
  discountLabel?: string;
  arReady?: boolean;
  rating?: number;
  artist?: ArtistProfile;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
  };
}
