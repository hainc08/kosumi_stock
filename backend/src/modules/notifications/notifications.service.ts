import { prisma } from '../../config/database';

export async function getMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(id: string, userId: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw { code: 'NOT_FOUND', message: 'Notification khong ton tai', status: 404 };
  if (existing.userId !== userId) throw { code: 'FORBIDDEN', message: 'Khong du quyen', status: 403 };

  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
