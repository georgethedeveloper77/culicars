"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeader = PageHeader;
// apps/admin/src/components/ui/PageHeader.tsx
const react_1 = __importDefault(require("react"));
function PageHeader({ title, description, actions }) {
    return (<div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{title}</h1>
        {description && (<p className="text-sm text-zinc-500 mt-1">{description}</p>)}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>);
}
