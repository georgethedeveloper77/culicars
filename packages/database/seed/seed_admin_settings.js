"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminSettings = seedAdminSettings;
// packages/database/seed/seed_admin_settings.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedAdminSettings() {
    const settings = [
        {
            key: 'platform_name',
            value: JSON.stringify('CuliCars'),
            description: 'Platform display name',
        },
        {
            key: 'credit_packs',
            value: JSON.stringify([
                { id: 'culicars_credits_1', credits: 1, priceKes: 150, priceUsd: 1.00, label: '1 Credit' },
                { id: 'culicars_credits_3', credits: 3, priceKes: 400, priceUsd: 3.00, label: '3 Credits' },
                { id: 'culicars_credits_5', credits: 5, priceKes: 600, priceUsd: 5.00, label: '5 Credits (Most Popular)' },
                { id: 'culicars_credits_10', credits: 10, priceKes: 1000, priceUsd: 9.00, label: '10 Credits (Dealer Pack)' },
            ]),
            description: 'Available credit packs for purchase',
        },
        {
            key: 'unlock_cost',
            value: JSON.stringify({ creditsPerReport: 1 }),
            description: 'Credits required to unlock a full report',
        },
        {
            key: 'kenya_counties',
            value: JSON.stringify([
                'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
                'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
                'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
                'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
                'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
                'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
                'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
                'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
                'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu',
                'Vihiga', 'Wajir', 'West Pokot',
            ]),
            description: 'All 47 Kenya counties for dropdowns',
        },
        {
            key: 'feature_flags',
            value: JSON.stringify({
                stolen_reporting_enabled: true,
                ntsa_cor_fetch_enabled: true,
                contributions_enabled: true,
                ocr_enabled: true,
            }),
            description: 'Feature toggles',
        },
        {
            key: 'scraper_config',
            value: JSON.stringify({
                concurrency: 3,
                delayMs: 1500,
                userAgent: 'CuliCarsBot/1.0',
            }),
            description: 'Default scraper configuration',
        },
        {
            key: 'free_sections',
            value: JSON.stringify(['IDENTITY', 'SPECS_EQUIPMENT', 'STOLEN_REPORTS']),
            description: 'Report sections shown free (is_locked=false)',
        },
    ];
    for (const s of settings) {
        await prisma.adminSetting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }
    console.log(`✅ Seeded ${settings.length} admin settings`);
}
