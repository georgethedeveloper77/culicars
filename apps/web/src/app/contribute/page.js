"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContributePage;
// apps/web/src/app/contribute/page.tsx
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function ContributePage() {
    const [vin, setVin] = (0, react_1.useState)('');
    const [plate, setPlate] = (0, react_1.useState)('');
    const router = (0, navigation_1.useRouter)();
    const handleSubmit = () => {
        const v = vin.trim().toUpperCase();
        if (v.length === 17)
            router.push(`/contribute/${v}`);
        else if (plate.trim())
            router.push(`/search?q=${encodeURIComponent(plate.trim())}`);
    };
    return (<div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cc-text mb-2">Contribute Vehicle Data</h1>
        <p className="text-cc-muted">
          Help build Kenya's most accurate vehicle database. Submit service records, damage reports,
          mileage readings, or photos. Every contribution improves reports for all buyers.
        </p>
      </div>

      <div className="cc-card p-6 space-y-4">
        <div>
          <label className="cc-label">VIN (if known)</label>
          <input className="cc-input font-mono uppercase" value={vin} onChange={e => setVin(e.target.value.toUpperCase())} placeholder="17-character VIN" maxLength={17}/>
        </div>
        <div>
          <label className="cc-label">Or search by plate</label>
          <input className="cc-input font-mono uppercase tracking-widest" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="KCA 123A"/>
        </div>
        <button onClick={handleSubmit} className="cc-btn-primary w-full">
          Find vehicle to contribute to →
        </button>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {[
            { icon: '📏', title: 'Mileage record', desc: 'Odometer reading with date and source' },
            { icon: '💥', title: 'Damage report', desc: 'Accident or damage with location and photos' },
            { icon: '🔧', title: 'Service record', desc: 'Garage visit, work done, mileage at service' },
            { icon: '👤', title: 'Ownership info', desc: 'Transfer details or registration document' },
            { icon: '📷', title: 'Photos', desc: 'Real photos of the vehicle from any angle' },
            { icon: '📋', title: 'General note', desc: 'Any other relevant vehicle history information' },
        ].map(item => (<div key={item.title} className="cc-card-2 p-4 flex items-start gap-3">
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className="text-sm font-medium text-cc-text">{item.title}</p>
              <p className="text-xs text-cc-muted mt-0.5">{item.desc}</p>
            </div>
          </div>))}
      </div>
    </div>);
}
