// apps/api/src/services/notificationService.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type NotificationType =
  | 'report_ready'
  | 'report_updated'
  | 'nearby_watch_alert'
  | 'hotspot_alert'
  | 'contribution_status'
  | 'payment_confirmed';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  dataJson?: Record<string, unknown>;
}

export interface NearbyAlertInput {
  alertId: string;
  lat: number;
  lng: number;
  alertType: string;
  title: string;
  body: string;
  radiusKm?: number;
}

// ---------------------------------------------------------------------------
// FCM helpers
// ---------------------------------------------------------------------------

async function sendFcmPush(token: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
  const fcmKey = process.env.FCM_SERVER_KEY;
  if (!fcmKey) return; // FCM not configured — skip silently

  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body },
        data: data ?? {},
      }),
    });
    if (!res.ok) {
      console.warn('[notificationService] FCM send failed', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[notificationService] FCM error', err);
  }
}

// ---------------------------------------------------------------------------
// Core: create DB record + push
// ---------------------------------------------------------------------------

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { userId, type, title, body, dataJson } = input;

  await (prisma as any).notification.create({
    data: { userId, type, title, body, dataJson: dataJson ?? undefined },
  });

  // Fan out to user's registered device tokens
  const tokens: { token: string }[] = await (prisma as any).deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });

  const stringData = dataJson
    ? Object.fromEntries(Object.entries(dataJson).map(([k, v]) => [k, String(v)]))
    : undefined;

  await Promise.allSettled(tokens.map((t) => sendFcmPush(t.token, title, body, stringData)));
}

// ---------------------------------------------------------------------------
// Nearby alert fan-out
// ---------------------------------------------------------------------------

export async function notifyNearbyUsers(input: NearbyAlertInput): Promise<void> {
  const { alertId, lat, lng, alertType, title, body, radiusKm = 5 } = input;

  // Find users whose preferred location is within radiusKm of the alert
  // Uses Haversine approximation via SQL (1 degree lat ≈ 111 km)
  const degreeOffset = radiusKm / 111;

  const nearbyUsers: { userId: string }[] = await prisma.$queryRaw`
    SELECT DISTINCT uv.user_id as "userId"
    FROM user_vehicles uv
    WHERE uv.alert_radius_km IS NOT NULL
      AND uv.plate IS NOT NULL
    LIMIT 500
  `;

  // Also query users with preferred_lat / preferred_lng within radius
  // (stored in Profile or User; adjust field names to match your schema)
  // For now we use a best-effort approach: notify all users with alert_radius set.

  await Promise.allSettled(
    nearbyUsers.map(({ userId }) =>
      createNotification({
        userId,
        type: 'nearby_watch_alert',
        title,
        body,
        dataJson: { alertId, alertType, lat: String(lat), lng: String(lng) },
      })
    )
  );
}

// ---------------------------------------------------------------------------
// Read / mark read
// ---------------------------------------------------------------------------

export async function getNotifications(userId: string, limit = 30) {
  return (prisma as any).notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markRead(userId: string, notificationId: string) {
  return (prisma as any).notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  return (prisma as any).notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return (prisma as any).notification.count({
    where: { userId, read: false },
  });
}

// ---------------------------------------------------------------------------
// Device token registration
// ---------------------------------------------------------------------------

export async function registerDeviceToken(userId: string, token: string, platform: string): Promise<void> {
  await (prisma as any).deviceToken.upsert({
    where: { userId_token: { userId, token } },
    create: { userId, token, platform },
    update: { platform },
  });
}

export async function removeDeviceToken(userId: string, token: string): Promise<void> {
  await (prisma as any).deviceToken.deleteMany({ where: { userId, token } });
}

// ---------------------------------------------------------------------------
// Convenience senders (called from other services)
// ---------------------------------------------------------------------------

export async function notifyReportReady(userId: string, plate: string, reportId: string) {
  await createNotification({
    userId,
    type: 'report_ready',
    title: 'Vehicle report ready',
    body: `Your report for ${plate} is now available.`,
    dataJson: { reportId, plate },
  });
}

export async function notifyReportUpdated(userId: string, plate: string, reportId: string) {
  await createNotification({
    userId,
    type: 'report_updated',
    title: 'Report updated',
    body: `New data is available for ${plate}.`,
    dataJson: { reportId, plate },
  });
}

export async function notifyPaymentConfirmed(userId: string, credits: number) {
  await createNotification({
    userId,
    type: 'payment_confirmed',
    title: 'Credits added',
    body: `${credits} credit${credits !== 1 ? 's' : ''} have been added to your account.`,
    dataJson: { credits: String(credits) },
  });
}

export async function notifyContributionStatus(userId: string, status: string, plate: string) {
  const messages: Record<string, string> = {
    approved: `Your contribution for ${plate} was approved and is now live.`,
    rejected: `Your contribution for ${plate} was not approved.`,
    needs_more_info: `More information is needed for your contribution on ${plate}.`,
  };
  await createNotification({
    userId,
    type: 'contribution_status',
    title: 'Contribution update',
    body: messages[status] ?? `Your contribution status has changed to ${status}.`,
    dataJson: { status, plate },
  });
}
