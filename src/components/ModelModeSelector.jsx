import { Shirt, User, Check } from "lucide-react";

export default function ModelModeSelector({ mode, onChange, compact = false }) {
  const modes = [
    { id: "atasan", name: "Atasan", icon: Shirt },
    { id: "full", name: "Full", icon: User },
  ];

  if (compact) {
    return (
      <div className="flex bg-black/50 backdrop-blur-md rounded-full p-1">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === m.id
                  ? "bg-amber-500 text-white"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl">
      <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Mode</p>
      <div className="flex gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                mode === m.id
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{m.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
