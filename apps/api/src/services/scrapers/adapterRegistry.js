"use strict";
// apps/api/src/services/scrapers/adapterRegistry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnabledAdapters = getEnabledAdapters;
exports.getAdapterByName = getAdapterByName;
const ntsaCorAdapter_1 = require("./ntsaCorAdapter");
const beForwardAdapter_1 = require("./beForwardAdapter");
const sbtAdapter_1 = require("./sbtAdapter");
/**
 * Master list of all vehicle data source adapters.
 * Ordered by confidence descending — highest-confidence sources resolve field conflicts.
 * Add new adapters here; they are automatically picked up by rawDataProcessor.
 */
const ALL_ADAPTERS = [
    new ntsaCorAdapter_1.NtsaCorAdapter(), // confidence 1.0
    new beForwardAdapter_1.BeForwardAdapter(), // confidence 0.85
    new sbtAdapter_1.SbtAdapter(), // confidence 0.80
];
function getEnabledAdapters() {
    return ALL_ADAPTERS.filter((a) => a.isEnabled());
}
function getAdapterByName(name) {
    return ALL_ADAPTERS.find((a) => a.sourceName === name);
}
