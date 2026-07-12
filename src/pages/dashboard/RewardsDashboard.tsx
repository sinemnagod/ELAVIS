import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { readStorage, writeStorage, userStorageKeys } from "@/lib/storage";

interface RewardItem {
  id: string;
  title: string;
  description: string;
  costPoints: number;
  unlocked: boolean;
}

export function RewardsDashboard() {
  const { showToast } = useToast();
  const { session } = useAuth();
  const userId = session?.user?.id || "guest";

  const [points, setPoints] = useState(() => readStorage(userStorageKeys.rewardsPoints(userId), 1450));

  useEffect(() => {
    writeStorage(userStorageKeys.rewardsPoints(userId), points);
  }, [points, userId]);

  const [rewards, setRewards] = useState<RewardItem[]>([
    {
      id: "rew-01",
      title: "100 kWh Free Charging",
      description: "Complementary charging credits at any public EVALIS Supercharger terminal.",
      costPoints: 800,
      unlocked: true
    },
    {
      id: "rew-02",
      title: "Custom Alcantara Key Case",
      description: "Premium handcrafted key fob protective case matching your vehicle's trim.",
      costPoints: 1200,
      unlocked: true
    },
    {
      id: "rew-03",
      title: "Cabin Air Filter Replacement",
      description: "High-efficiency HEPA cabin filter package delivered and fitted at your showroom.",
      costPoints: 2000,
      unlocked: false
    }
  ]);

  const handleRedeem = (reward: RewardItem) => {
    if (points < reward.costPoints) {
      showToast("Insufficient green points to redeem this reward", "error");
      return;
    }

    setPoints((prev) => prev - reward.costPoints);
    showToast(`Successfully redeemed: ${reward.title}! Check your email for details.`, "success");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-light uppercase tracking-widest text-slate-100">Green Rewards</h1>
        <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
          Redeem point metrics accrued from off-peak charging schedules and zero-emission highway travel.
        </p>
      </div>

      {/* Point Balance Header */}
      <div className="border border-white/5 bg-[#0b0f19]/40 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -right-20 -top-20 w-44 h-44 bg-accent/10 rounded-full blur-2xl" />
        
        <div className="space-y-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-mono">Point Ledger</span>
          <span className="text-4xl font-extralight text-accent block font-orbitron">{points} pts</span>
          <span className="text-[9px] text-slate-400 block leading-tight font-light mt-1">
            You earned +120 points this week. Keep up off-peak charging!
          </span>
        </div>

        <div className="flex gap-4 text-xs font-mono text-slate-400">
          <div className="border-r border-white/10 pr-4">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block">ICE Fuel Saved</span>
            <span className="text-md font-semibold text-slate-200 mt-1 block">420 Liters</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Emissions Avoided</span>
            <span className="text-md font-semibold text-slate-200 mt-1 block">988 kg CO2</span>
          </div>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-light uppercase tracking-widest text-slate-400">Redeemable Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const canAfford = points >= reward.costPoints;
            
            return (
              <div
                key={reward.id}
                className={`border rounded-3xl p-6 flex flex-col justify-between transition duration-300 ${
                  canAfford 
                    ? "border-white/5 bg-[#0b0f19]/40 hover:border-accent/30" 
                    : "border-white/5 bg-[#0b0f19]/10 opacity-70"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold">{reward.title}</h3>
                    <span className="text-xs font-semibold text-accent font-mono shrink-0">{reward.costPoints} pts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light leading-relaxed">{reward.description}</p>
                </div>

                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford}
                  className={`mt-6 w-full py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition cursor-pointer ${
                    canAfford 
                      ? "bg-white text-black hover:bg-slate-200" 
                      : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {canAfford ? "Redeem Reward" : "Locked (Insufficient points)"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
