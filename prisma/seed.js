const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang di chuyển dữ liệu vào SQLite dev.db ---');
  
  // 1. Seed Users
  const usersFile = path.join(__dirname, '../data/users.json');
  if (fs.existsSync(usersFile)) {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          emailVerified: u.emailVerified,
          verificationToken: u.verificationToken || null,
          tokenExpiry: u.tokenExpiry ? new Date(u.tokenExpiry) : null,
        },
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          emailVerified: u.emailVerified,
          verificationToken: u.verificationToken || null,
          tokenExpiry: u.tokenExpiry ? new Date(u.tokenExpiry) : null,
          createdAt: new Date(u.createdAt || Date.now()),
          updatedAt: new Date(u.updatedAt || Date.now()),
        },
      });
      console.log(`✓ User synced: ${u.email}`);
    }
  }

  // 2. Seed Connected Pages
  const pagesFile = path.join(__dirname, '../data/connected_pages.json');
  if (fs.existsSync(pagesFile)) {
    const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf-8'));
    for (const p of pages) {
      await prisma.connectedPage.upsert({
        where: { id: p.id },
        update: {
          pageId: p.pageId,
          pageName: p.pageName,
          pageCategory: p.pageCategory || null,
          pageAccessToken: p.pageAccessToken,
          instagramId: p.instagramId || null,
          userId: p.userId,
        },
        create: {
          id: p.id,
          pageId: p.pageId,
          pageName: p.pageName,
          pageCategory: p.pageCategory || null,
          pageAccessToken: p.pageAccessToken,
          instagramId: p.instagramId || null,
          userId: p.userId,
          createdAt: new Date(p.createdAt || Date.now()),
          updatedAt: new Date(p.updatedAt || Date.now()),
        },
      });
      console.log(`✓ ConnectedPage synced: ${p.pageName} (${p.pageId})`);
    }
  }

  // 3. Seed Campaigns
  const campaignsFile = path.join(__dirname, '../data/campaigns.json');
  if (fs.existsSync(campaignsFile)) {
    const campaigns = JSON.parse(fs.readFileSync(campaignsFile, 'utf-8'));
    for (const c of campaigns) {
      await prisma.campaign.upsert({
        where: { id: c.id },
        update: {
          code: c.code,
          name: c.name,
          description: c.description || null,
          imageUrl: c.imageUrl || null,
          objective: c.objective,
          objectiveText: c.objectiveText,
          specialCategory: c.specialCategory || 'NONE',
          location: c.location,
          radiusKm: Number(c.radiusKm || 15),
          targetAge: c.targetAge || '25 - 45',
          targetGender: c.targetGender || 'ALL',
          targetInterests: JSON.stringify(c.targetInterests || []),
          dailyBudget: Number(c.dailyBudget),
          durationDays: Number(c.durationDays),
          totalBudget: Number(c.totalBudget),
          maxEstimatedSpend: Number(c.maxEstimatedSpend),
          startDate: new Date(c.startDate || Date.now()),
          endDate: new Date(c.endDate || Date.now()),
          headline: c.headline,
          primaryText: c.primaryText,
          callToAction: c.callToAction || 'SEND_MESSAGE',
          pageName: c.pageName,
          status: c.status,
          version: Number(c.version || 1),
          approvalCode: c.approvalCode || null,
          fingerprint: c.fingerprint || null,
          approvedBy: c.approvedBy || null,
          approvedAt: c.approvedAt ? new Date(c.approvedAt) : null,
          metaCampaignId: c.metaCampaignId || null,
          metaAdSetId: c.metaAdSetId || null,
          metaCreativeId: c.metaCreativeId || null,
          metaAdId: c.metaAdId || null,
          isMock: Boolean(c.isMock),
          telegramSent: Boolean(c.telegramSent),
          telegramSentAt: c.telegramSentAt ? new Date(c.telegramSentAt) : null,
        },
        create: {
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description || null,
          imageUrl: c.imageUrl || null,
          objective: c.objective,
          objectiveText: c.objectiveText,
          specialCategory: c.specialCategory || 'NONE',
          location: c.location,
          radiusKm: Number(c.radiusKm || 15),
          targetAge: c.targetAge || '25 - 45',
          targetGender: c.targetGender || 'ALL',
          targetInterests: JSON.stringify(c.targetInterests || []),
          dailyBudget: Number(c.dailyBudget),
          durationDays: Number(c.durationDays),
          totalBudget: Number(c.totalBudget),
          maxEstimatedSpend: Number(c.maxEstimatedSpend),
          startDate: new Date(c.startDate || Date.now()),
          endDate: new Date(c.endDate || Date.now()),
          headline: c.headline,
          primaryText: c.primaryText,
          callToAction: c.callToAction || 'SEND_MESSAGE',
          pageName: c.pageName,
          status: c.status,
          version: Number(c.version || 1),
          approvalCode: c.approvalCode || null,
          fingerprint: c.fingerprint || null,
          approvedBy: c.approvedBy || null,
          approvedAt: c.approvedAt ? new Date(c.approvedAt) : null,
          metaCampaignId: c.metaCampaignId || null,
          metaAdSetId: c.metaAdSetId || null,
          metaCreativeId: c.metaCreativeId || null,
          metaAdId: c.metaAdId || null,
          isMock: Boolean(c.isMock),
          telegramSent: Boolean(c.telegramSent),
          telegramSentAt: c.telegramSentAt ? new Date(c.telegramSentAt) : null,
          createdAt: new Date(c.createdAt || Date.now()),
          updatedAt: new Date(c.updatedAt || Date.now()),
        },
      });
      console.log(`✓ Campaign synced: ${c.code} - ${c.name}`);
    }
  }

  const uCount = await prisma.user.count();
  const pCount = await prisma.connectedPage.count();
  const cCount = await prisma.campaign.count();

  console.log(`\n🎉 HOÀN THÀNH ĐỒNG BỘ CƠ SỞ DỮ LIỆU SQLITE dev.db:`);
  console.log(`- Người dùng (Users): ${uCount}`);
  console.log(`- Fanpage đã kết nối (ConnectedPages): ${pCount}`);
  console.log(`- Chiến dịch (Campaigns): ${cCount}`);
}

main()
  .catch(e => {
    console.error('Lỗi seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

