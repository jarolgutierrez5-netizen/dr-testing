export function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function Avatar({ name, hue }) {
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center font-display text-sm text-white shrink-0"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${hue + 40} 70% 35%))` }}>
      {initials(name)}
    </div>
  );
}

export function Pill({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-500/30 text-slate-300",
    green: "border-emerald-400/40 text-emerald-300",
    amber: "border-amber-400/40 text-amber-300",
    purple: "border-fuchsia-400/40 text-fuchsia-300",
  };
  return (
    <div className={`px-3.5 py-2 rounded-full border ${tones[tone]} font-display text-[13px] whitespace-nowrap`}>
      <span className="text-slate-400 font-body font-normal mr-1.5">{label}:</span>{value}
    </div>
  );
}

export function LabelBadge({ text, tone }) {
  const tones = {
    amber: "bg-amber-400/15 border-amber-400/40 text-amber-300",
    purple: "bg-fuchsia-400/15 border-fuchsia-400/40 text-fuchsia-300",
    green: "bg-emerald-400/15 border-emerald-400/40 text-emerald-300",
    slate: "bg-slate-500/10 border-slate-500/30 text-slate-300",
  };
  return <span className={`font-body text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${tones[tone]}`}>{text}</span>;
}

// One dot per recent game, filled if that game had a HR.
export function HrTrend({ games }) {
  return (
    <div className="flex items-center gap-1.5">
      {games.map((g, i) => (
        <div key={i} title={g.hr ? "Homered" : "No HR"}
          className={`w-2.5 h-2.5 rounded-full ${g.hr ? "bg-amber-400" : "bg-slate-600"}`} />
      ))}
      <span className="font-body text-[10px] text-slate-500 ml-1">last {games.length}</span>
    </div>
  );
}

export function SectionIntro({ emoji, label, note }) {
  return (
    <div className="mb-6">
      <h3 className="font-display text-2xl text-slate-50">{emoji} {label}</h3>
      {note && <p className="font-body text-slate-400 text-[13px] mt-1">{note}</p>}
    </div>
  );
}
