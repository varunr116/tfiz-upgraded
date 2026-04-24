import React, { useState } from 'react';
import { X, CreditCard, Truck, CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: () => void;
  spinDiscountPercent?: number;
  spinDiscountLabel?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess,
  spinDiscountPercent = 0,
  spinDiscountLabel,
}) => {
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * spinDiscountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'info') {
      setStep('payment');
    } else if (step === 'payment') {
      setIsSubmitting(true);
      try {
        const user = auth.currentUser;
        
        const orderData = {
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || formData.email,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          total: total,
          discount: spinDiscountPercent > 0 ? {
            label: spinDiscountLabel || `${spinDiscountPercent}% OFF`,
            percent: spinDiscountPercent,
            amount: discountAmount,
          } : null,
          status: 'pending',
          createdAt: Timestamp.now(),
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode
          }
        };

        const docRef = await addDoc(collection(db, 'orders'), orderData);
        setOrderId(docRef.id);
        setStep('success');
        onSuccess();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'orders');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {step === 'success' ? 'Order Confirmed' : 'Checkout'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tighter mb-2">THANK YOU FOR YOUR ORDER</h3>
                  <p className="text-black/50">Your digital-first items are being prepared. You'll receive a confirmation email shortly.</p>
                </div>
                <div className="bg-black/5 p-6 rounded-2xl text-left max-w-sm mx-auto">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold opacity-30 uppercase tracking-widest">Order Number</span>
                    <span className="text-xs font-bold">#{orderId?.slice(-6).toUpperCase() || 'TFZ-99281'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold opacity-30 uppercase tracking-widest">Total Paid</span>
                    <span className="text-xs font-bold">₹{total}</span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-black/80 transition-all"
                >
                  Back to Shop
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid md:grid-cols-2 gap-12"
              >
                {/* Form Side */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex gap-4 mb-8">
                    <div className={`flex-1 h-1 rounded-full ${step === 'info' ? 'bg-black' : 'bg-black/10'}`} />
                    <div className={`flex-1 h-1 rounded-full ${step === 'payment' ? 'bg-black' : 'bg-black/10'}`} />
                  </div>

                  {step === 'info' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Truck size={18} className="opacity-30" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-30">Shipping Information</span>
                      </div>
                      <input 
                        required
                        name="email"
                        type="email" 
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                      />
                      <div className="flex gap-4">
                        <input 
                          required
                          name="firstName"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-1/2 bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                        />
                        <input 
                          required
                          name="lastName"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-1/2 bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                        />
                      </div>
                      <input 
                        required
                        name="address"
                        placeholder="Shipping Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                      />
                      <div className="flex gap-4">
                        <input 
                          required
                          name="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-2/3 bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                        />
                        <input 
                          required
                          name="zipCode"
                          placeholder="Zip"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="w-1/3 bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard size={18} className="opacity-30" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-30">Payment Details</span>
                      </div>
                      <div className="bg-black text-white p-6 rounded-2xl mb-6 relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-8">
                            <div className="w-10 h-6 bg-white/20 rounded" />
                            <ShieldCheck size={20} className="opacity-50" />
                          </div>
                          <p className="text-lg font-mono tracking-widest mb-4">
                            {formData.cardNumber || '•••• •••• •••• ••••'}
                          </p>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                            <span>Card Holder</span>
                            <span>Expires</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>{formData.firstName} {formData.lastName}</span>
                            <span>{formData.expiry || 'MM/YY'}</span>
                          </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                      </div>
                      <input 
                        required
                        name="cardNumber"
                        placeholder="Card Number"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                      />
                      <div className="flex gap-4">
                        <input 
                          required
                          name="expiry"
                          placeholder="MM/YY"
                          value={formData.expiry}
                          onChange={handleInputChange}
                          className="w-1/2 bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                        />
                        <input 
                          required
                          name="cvv"
                          placeholder="CVV"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className="w-1/2 bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/20 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-4">
                    {step === 'payment' && (
                      <button 
                        type="button"
                        onClick={() => setStep('info')}
                        className="flex-1 border border-black/10 py-4 rounded-full font-bold hover:bg-black/5 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-black text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-black/80 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          {step === 'info' ? 'Continue to Payment' : `Pay ₹${total}`}
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Summary Side */}
                <div className="bg-black/5 rounded-3xl p-6 md:p-8 h-fit">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-30 mb-6">Order Summary</h3>
                  <div className="space-y-4 mb-8 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-black/5">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-[10px] opacity-50">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-6 border-t border-black/10">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-50">Subtotal</span>
                      <span className="font-bold">₹{subtotal}</span>
                    </div>
                    {spinDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="opacity-50">Spin Discount ({spinDiscountLabel || `${spinDiscountPercent}% OFF`})</span>
                        <span className="font-bold text-green-700">-₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="opacity-50">Shipping</span>
                      <span className="font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-4">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
