// apps/web/src/components/report/SpecsEquipment.tsx

interface OptionCode {
  code: string;
  category: string;
  value: string;
}

interface SpecsEquipmentData {
  make?: string;
  model?: string;
  year?: number;
  bodyType?: string;
  engineCc?: number;
  powerKw?: number;
  transmission?: string;
  driveLayout?: string;
  fuelType?: string;
  steeringSide?: string;
  emissionStandard?: string;
  countryOfFirstReg?: string;
  plantCountry?: string;
  importCountry?: string;
  importDate?: string;
  kraCleared?: boolean;
  japanAuctionGrade?: string;
  japanAuctionMileage?: number;
  optionCodes?: OptionCode[];
}

const AUCTION_GRADE_META: Record<string, { color: string; label: string }> = {
  '5':   { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Excellent' },
  '4.5': { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Very Good' },
  '4':   { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',          label: 'Good' },
  '3.5': { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',       label: 'Average' },
  '3':   { color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',    label: 'Below Average' },
};

export function SpecsEquipment({ data }: { data: SpecsEquipmentData }) {
  const specs = [
    { label: 'Make', value: data.make },
    { label: 'Model', value: data.model },
    { label: 'Year', value: data.year },
    { label: 'Body Type', value: data.bodyType },
    { label: 'Engine', value: data.engineCc ? `${data.engineCc}cc` : undefined },
    { label: 'Power', value: data.powerKw ? `${data.powerKw} kW (${Math.round(data.powerKw * 1.341)} hp)` : undefined },
    { label: 'Transmission', value: data.transmission },
    { label: 'Drive', value: data.driveLayout },
    { label: 'Fuel', value: data.fuelType },
    { label: 'Steering', value: data.steeringSide },
    { label: 'Emissions', value: data.emissionStandard },
    { label: 'Plant country', value: data.plantCountry },
    { label: 'First reg. country', value: data.countryOfFirstReg },
    { label: 'Import from', value: data.importCountry },
    { label: 'Import date', value: data.importDate ? new Date(data.importDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' }) : undefined },
    { label: 'KRA Cleared', value: data.kraCleared !== undefined ? (data.kraCleared ? 'Yes ✓' : 'No') : undefined },
  ].filter(s => s.value !== undefined && s.value !== null);

  const grade = data.japanAuctionGrade;
  const gradeStyle = grade ? AUCTION_GRADE_META[grade] || AUCTION_GRADE_META['3'] : null;

  const categories = [...new Set((data.optionCodes || []).map(o => o.category))];

  return (
    <div className="p-6 space-y-6">
      {/* Japan Auction Grade — prominent if JDM */}
      {grade && gradeStyle && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${gradeStyle.color}`}>
          <div className="shrink-0">
            <p className="text-3xl font-bold">{grade}</p>
          </div>
          <div>
            <p className="font-semibold">Japan Auction Grade: {gradeStyle.label}</p>
            <p className="text-sm opacity-80">
              Graded at export — {gradeStyle.label.toLowerCase()} condition
              {data.japanAuctionMileage
                ? `. Mileage at auction: ${data.japanAuctionMileage.toLocaleString()} km`
                : ''}
            </p>
          </div>
          <span className="ml-auto text-2xl">🇯🇵</span>
        </div>
      )}

      {/* Basic specs grid */}
      <div>
        <p className="text-xs text-cc-muted uppercase tracking-wide font-medium mb-3">Vehicle Specifications</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {specs.map(s => (
            <div key={s.label} className="cc-card-2 px-3 py-2.5">
              <p className="text-xs text-cc-muted">{s.label}</p>
              <p className="text-sm font-medium text-cc-text mt-0.5">{String(s.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Option codes — grouped by category */}
      {data.optionCodes && data.optionCodes.length > 0 && (
        <div>
          <p className="text-xs text-cc-muted uppercase tracking-wide font-medium mb-3">
            Factory Equipment ({data.optionCodes.length} options decoded from VIN)
          </p>
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat}>
                <p className="text-xs text-cc-faint mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {data.optionCodes!
                    .filter(o => o.category === cat)
                    .map((opt, i) => (
                      <span
                        key={i}
                        className="cc-pill bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs"
                        title={opt.code}
                      >
                        {opt.value}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
