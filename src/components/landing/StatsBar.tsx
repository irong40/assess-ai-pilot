
import { Sparkles, Eye, Target, Users } from "lucide-react";

const StatsBar = () => {
  const stats = [
    { number: "Early", label: "Development", icon: <Sparkles className="h-5 w-5" /> },
    { number: "Live", label: "Demo", icon: <Eye className="h-5 w-5" /> },
    { number: "Direct", label: "Input", icon: <Target className="h-5 w-5" /> },
    { number: "Free", label: "Access", icon: <Users className="h-5 w-5" /> }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
      {stats.map((stat, index) => (
        <div key={index} className="text-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-center mb-2">
            <div className="text-blue-400">{stat.icon}</div>
          </div>
          <div className="text-2xl font-bold text-white">{stat.number}</div>
          <div className="text-sm text-slate-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
