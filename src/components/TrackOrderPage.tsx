import React from 'react';
import { ArrowLeft, PackageCheck, Truck, Warehouse } from 'lucide-react';

interface TrackOrderPageProps {
  onBack: () => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ onBack }) => {
  const [trackingInput, setTrackingInput] = React.useState('');
  const [showTrackingResult, setShowTrackingResult] = React.useState(false);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setShowTrackingResult(true);
  };

  return (
    <section className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/85 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </button>

        <div className="bg-white border border-black/10 rounded-[2.5rem] p-8 md:p-10">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-black/40 mb-2">Order Tracking</p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Track Your Order</h1>
          </div>

          <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter Order ID (e.g. TFIZ-1024)"
              className="flex-1 border border-black/10 rounded-full px-6 py-4 focus:outline-none focus:border-black/30"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-full bg-black text-white font-bold uppercase tracking-widest text-xs hover:bg-black/85 transition-colors"
            >
              Track
            </button>
          </form>

          {showTrackingResult && (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border border-black/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-1">Status</p>
                  <p className="font-black text-lg">In Transit</p>
                </div>
                <div className="rounded-2xl border border-black/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-1">Last Update</p>
                  <p className="font-black text-lg">Hub Scan Completed</p>
                </div>
                <div className="rounded-2xl border border-black/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-1">ETA</p>
                  <p className="font-black text-lg">2-3 Business Days</p>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 p-5 md:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-4">Shipment Timeline</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-black/5 p-4">
                    <Warehouse size={18} className="mb-2" />
                    <p className="font-black text-sm">Order Packed</p>
                    <p className="text-xs text-black/50">Warehouse processed</p>
                  </div>
                  <div className="rounded-xl bg-black/5 p-4">
                    <Truck size={18} className="mb-2" />
                    <p className="font-black text-sm">In Transit</p>
                    <p className="text-xs text-black/50">Moved to local hub</p>
                  </div>
                  <div className="rounded-xl bg-black/5 p-4">
                    <PackageCheck size={18} className="mb-2" />
                    <p className="font-black text-sm">Out for Delivery</p>
                    <p className="text-xs text-black/50">Expected in 48 hours</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

