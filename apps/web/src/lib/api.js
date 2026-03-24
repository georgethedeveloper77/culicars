"use strict";
// apps/web/src/lib/api.ts
// All API calls unwrap the { success, data } envelope returned by the Express API.
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordNtsaConsent = exports.getCreditLedger = exports.getWalletBalance = exports.getPaymentStatus = exports.initiatePayment = exports.getPaymentProviders = exports.getCreditPacks = exports.submitContribution = exports.markRecovered = exports.getStolenByPlate = exports.submitStolenReport = exports.unlockReport = exports.getReportByVin = exports.getReport = exports.searchVehicles = void 0;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.culicars.com';
async function apiFetch(path, options = {}, token) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}
// Unwrap { success, data } envelope used by all API routes
async function apiGet(path, token) {
    const res = await apiFetch(path, {}, token);
    return res.data;
}
async function apiPost(path, body, token) {
    const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) }, token);
    return res.data;
}
const searchVehicles = async (q, token) => apiGet(`/search?q=${encodeURIComponent(q)}&type=auto`, token);
exports.searchVehicles = searchVehicles;
const getReport = async (id, token) => apiGet(`/reports/${id}`, token);
exports.getReport = getReport;
const getReportByVin = async (vin, token) => apiGet(`/reports/by-vin/${vin}`, token);
exports.getReportByVin = getReportByVin;
const unlockReport = async (id, token) => apiPost(`/reports/${id}/unlock`, {}, token);
exports.unlockReport = unlockReport;
const submitStolenReport = async (data) => apiPost('/stolen-reports', data);
exports.submitStolenReport = submitStolenReport;
const getStolenByPlate = async (plate) => apiGet(`/stolen-reports/plate/${plate}`);
exports.getStolenByPlate = getStolenByPlate;
const markRecovered = async (id, data, token) => apiPost(`/stolen-reports/${id}/recovered`, data, token);
exports.markRecovered = markRecovered;
const submitContribution = async (data, token) => apiPost('/contributions', data, token);
exports.submitContribution = submitContribution;
const getCreditPacks = async () => apiGet('/payments/packs');
exports.getCreditPacks = getCreditPacks;
const getPaymentProviders = async () => apiGet('/payments/providers');
exports.getPaymentProviders = getPaymentProviders;
const initiatePayment = async (data, token) => apiPost('/payments/initiate', data, token);
exports.initiatePayment = initiatePayment;
const getPaymentStatus = async (id, token) => apiGet(`/payments/${id}/status`, token);
exports.getPaymentStatus = getPaymentStatus;
const getWalletBalance = async (token) => apiGet('/credits/balance', token);
exports.getWalletBalance = getWalletBalance;
const getCreditLedger = async (token) => apiGet('/credits/ledger', token);
exports.getCreditLedger = getCreditLedger;
// ── NTSA Consent ──────────────────────────────────────────────────────────────
const recordNtsaConsent = async (data, token) => apiPost('/ntsa/consent', data, token);
exports.recordNtsaConsent = recordNtsaConsent;
