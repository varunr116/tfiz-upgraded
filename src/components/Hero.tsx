import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-paper">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full spotlight opacity-5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ink/5 rounded-full blur-3xl opacity-30 animate-aura" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ink/5 rounded-full blur-3xl opacity-30 animate-aura" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
        
        {/* AR Pulse Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-ink/5 rounded-full animate-ar-pulse opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-ink/10 rounded-full animate-ar-pulse opacity-30" style={{ animationDelay: '-1.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink/5 border border-ink/10 text-ink text-xs font-bold uppercase tracking-widest mb-8 animate-bounce-subtle"
        >
          <Zap size={14} />
          Wear the Digital
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-7xl md:text-9xl lg:text-[14rem] font-experimental font-extrabold italic tracking-tighter mb-8 leading-[0.8] text-ink uppercase animate-glitch"
        >
          TF<span className="lowercase">i</span>Z <br />
          ZINDABAD
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-ink/60 mb-12 font-medium"
        >
          Step into the spotlight with apparel that blends theatrical drama with cutting-edge technology.
          Your digital performance starts here.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="w-full sm:w-auto px-12 py-5 bg-ink text-paper rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-ink/90 transition-all group shadow-sm">
            Explore Collection
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[1px] bg-ink/5 animate-scan-line" />
      </div>
    </section>
  );
};
