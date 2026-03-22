// packages/database/seed/seed_plate_vin_map.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPlateVinMap() {
  const mappings = [
    { plate: 'KCA123A', plateDisplay: 'KCA 123A', vin: 'JTDBR32E540012345', confidence: 0.97, source: 'scraper' as const },
    { plate: 'KCB456B', plateDisplay: 'KCB 456B', vin: 'JN1TBNT30Z0000123', confidence: 0.95, source: 'scraper' as const },
    { plate: 'KBZ789C', plateDisplay: 'KBZ 789C', vin: 'JTDBR32E540067890', confidence: 0.90, source: 'scraper' as const },
    { plate: 'KCC234D', plateDisplay: 'KCC 234D', vin: 'JF1SJ5LC5DG123456', confidence: 0.92, source: 'scraper' as const },
    { plate: 'KCD567E', plateDisplay: 'KCD 567E', vin: 'JHMGE8H59DC012345', confidence: 0.88, source: 'scraper' as const },
    { plate: 'KCE890F', plateDisplay: 'KCE 890F', vin: 'JMZ6GG1R2D0123456', confidence: 0.91, source: 'scraper' as const },
    { plate: 'KBY345G', plateDisplay: 'KBY 345G', vin: 'JTDKN3DU5A0012345', confidence: 0.85, source: 'scraper' as const },
    { plate: 'KCF678H', plateDisplay: 'KCF 678H', vin: 'JA4AZ3A38EZ012345', confidence: 0.93, source: 'scraper' as const },
    { plate: 'KCG901J', plateDisplay: 'KCG 901J', vin: 'WBA3A5C55FK123456', confidence: 0.89, source: 'scraper' as const },
    { plate: 'KBX234K', plateDisplay: 'KBX 234K', vin: 'JTDBR32E540099999', confidence: 0.86, source: 'scraper' as const },
    { plate: 'KCH567L', plateDisplay: 'KCH 567L', vin: 'JN1TANT31U0012345', confidence: 0.94, source: 'scraper' as const },
    { plate: 'KBW890M', plateDisplay: 'KBW 890M', vin: 'JTDKN3DU8C0045678', confidence: 0.87, source: 'scraper' as const },
    { plate: 'KCJ123N', plateDisplay: 'KCJ 123N', vin: 'JF2SJAEC4DH012345', confidence: 0.90, source: 'scraper' as const },
    { plate: 'KCK456P', plateDisplay: 'KCK 456P', vin: 'JTEBU5JR5D5012345', confidence: 0.96, source: 'scraper' as const },
    { plate: 'KCL789Q', plateDisplay: 'KCL 789Q', vin: 'WDD2040462A012345', confidence: 0.88, source: 'scraper' as const },
    { plate: 'KCM234R', plateDisplay: 'KCM 234R', vin: 'KMH123456789ABCDE', confidence: 0.91, source: 'scraper' as const },
    { plate: 'KCN567S', plateDisplay: 'KCN 567S', vin: 'JAANP81E1YZ012345', confidence: 0.93, source: 'scraper' as const },
    { plate: 'KCP890T', plateDisplay: 'KCP 890T', vin: 'JTDBR32E890123456', confidence: 0.92, source: 'scraper' as const },
    { plate: 'KCQ123U', plateDisplay: 'KCQ 123U', vin: 'JN1HBNT30Z0098765', confidence: 0.89, source: 'scraper' as const },
    { plate: 'KCR456V', plateDisplay: 'KCR 456V', vin: 'JHMFC1F34DX012345', confidence: 0.94, source: 'scraper' as const },
    { plate: 'KCS789W', plateDisplay: 'KCS 789W', vin: 'JTDKN3DU1E0078901', confidence: 0.90, source: 'scraper' as const },
  ];

  for (const m of mappings) {
    await prisma.plateVinMap.create({ data: m });
  }

  console.log(`✅ Seeded ${mappings.length} plate→VIN mappings`);
}
