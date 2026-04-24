import React, { useState } from 'react';
import { X, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onLogin(password);
    if (ok) {
      setPassword('');
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-black/5 flex justify-between items-center bg-black text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Lock size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-black italic tracking-tighter uppercase">Admin Access</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-10">
              <p className="text-black/50 font-medium mb-8 text-center">
                Enter the administrative password to access the inventory management systems.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      autoFocus
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                      }}
                      placeholder="Enter password"
                      className={`w-full bg-black/5 border ${error ? 'border-red-500' : 'border-transparent'} rounded-2xl px-6 py-5 focus:outline-none focus:border-black/20 transition-all text-center text-lg font-bold tracking-widest`}
                    />
                  </div>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2"
                    >
                      <AlertCircle size={12} /> Access Denied. Invalid Credentials.
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform group"
                >
                  Authorize Access <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-black/5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">
                  Secure Terminal v2.4.0 // TFiZ Digital Infrastructure
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
