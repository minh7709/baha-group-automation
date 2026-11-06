import fs from 'fs';
import path from 'path';
import { CampaignData } from './types';
import { INITIAL_CAMPAIGNS } from './default-scenarios';
import { getPrisma } from './prisma';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'campaigns.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PAGES_FILE = path.join(DATA_DIR, 'connected_pages.json');
const POSTS_FILE = path.join(DATA_DIR, 'facebook_posts.json');
const USE_LOCAL_FILE_STORAGE = process.env.VERCEL !== '1' && process.env.READ_ONLY_FILESYSTEM !== 'true';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'USER' | 'FOUNDER' | 'ADMIN';
  emailVerified: boolean;
  verificationToken?: string;
  tokenExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedPageRecord {
  id: string;
  pageId: string;
  pageName: string;
  pageCategory?: string;
  pageAccessToken: string;
  instagramId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacebookPostStorageRecord {
  id: string;
  pageId: string;
  pageName: string;
  message: string;
  createdTime: string;
  permalinkUrl?: string;
  fullPicture?: string;
  statusType?: string;
  comments: number;
  reactions: number;
  shares: number;
  isMock: boolean;
  syncedAt: string;
}

function ensureDataFiles() {
  if (!USE_LOCAL_FILE_STORAGE) {
    return;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_CAMPAIGNS, null, 2), 'utf-8');
    }
    if (!fs.existsSync(USERS_FILE)) {
      const defaultFounder: UserRecord = {
      id: 'usr-founder-baha',
      email: 'founder@bahagroup.vn',
      name: 'Diệu BaHa (Founder)',
      passwordHash: '$2a$10$wT3W4mZgP6o9U1QY1eGZgOUqV4L3v4Rz9Y2dG0q1w7L6o8v5a4m6', // password: 123456 (demo)
      role: 'FOUNDER',
      emailVerified: true,
      createdAt: '2026-11-03T14:00:00+07:00',
      updatedAt: '2026-11-03T14:00:00+07:00',
      };
      fs.writeFileSync(USERS_FILE, JSON.stringify([defaultFounder], null, 2), 'utf-8');
    }
    if (!fs.existsSync(PAGES_FILE)) {
      const defaultPages: ConnectedPageRecord[] = [
      {
        id: 'page-1',
        pageId: '102938475610293',
        pageName: 'Diệu BaHa - Quản Trị Thực Chiến',
        pageCategory: 'Kinh doanh & Đào tạo',
        pageAccessToken: 'EAAGm0PXqB_mock_token_102938475610293',
        userId: 'usr-founder-baha',
        createdAt: '2026-11-03T14:00:00+07:00',
        updatedAt: '2026-11-03T14:00:00+07:00',
      },
      {
        id: 'page-2',
        pageId: '102938475610294',
        pageName: 'Baha Homes - Thiết Kế Thi Công Nội Thất',
        pageCategory: 'Thiết kế & Kiến trúc',
        pageAccessToken: 'EAAGm0PXqB_mock_token_102938475610294',
        userId: 'usr-founder-baha',
        createdAt: '2026-11-03T14:00:00+07:00',
        updatedAt: '2026-11-03T14:00:00+07:00',
      },
      {
        id: 'page-3',
        pageId: '102938475610295',
        pageName: 'Diệu BaHa - Spa & Thẩm Mỹ Viện TP.HCM',
        pageCategory: 'Sắc đẹp & Sức khỏe',
        pageAccessToken: 'EAAGm0PXqB_mock_token_102938475610295',
        userId: 'usr-founder-baha',
        createdAt: '2026-11-03T14:00:00+07:00',
        updatedAt: '2026-11-03T14:00:00+07:00',
      },
      ];
      fs.writeFileSync(PAGES_FILE, JSON.stringify(defaultPages, null, 2), 'utf-8');
    }
    if (!fs.existsSync(POSTS_FILE)) {
      fs.writeFileSync(POSTS_FILE, '[]', 'utf-8');
    }
  } catch (error: any) {
    if (error?.code !== 'EROFS' && error?.code !== 'EACCES') {
      throw error;
    }
  }
}

function writeLocalFile(filePath: string, value: string): boolean {
  if (!USE_LOCAL_FILE_STORAGE) {
    return false;
  }

  try {
    fs.writeFileSync(filePath, value, 'utf-8');
    return true;
  } catch (error: any) {
    if (error?.code !== 'EROFS' && error?.code !== 'EACCES') {
      console.warn(`Không thể ghi file local ${filePath}:`, error?.message || error);
    }
    return false;
  }
}

// ---------------- CAMPAIGN STORAGE ----------------
export function getAllCampaigns(): CampaignData[] {
  try {
    ensureDataFiles();
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Lỗi đọc dữ liệu campaigns:", err);
    return INITIAL_CAMPAIGNS;
  }
}

export function getCampaignById(id: string): CampaignData | undefined {
  const campaigns = getAllCampaigns();
  return campaigns.find((c) => c.id === id || c.code === id);
}

export async function getCampaignByIdAsync(id: string): Promise<CampaignData | undefined> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const campaign = await prisma.campaign.findFirst({
        where: { OR: [{ id }, { code: id }] },
      });
      if (campaign) {
        return {
          ...campaign,
          description: campaign.description || '',
          imageUrl: campaign.imageUrl || undefined,
          objective: campaign.objective as CampaignData['objective'],
          specialCategory: campaign.specialCategory as CampaignData['specialCategory'],
          targetInterests: campaign.targetInterests ? JSON.parse(campaign.targetInterests) : [],
          targetGender: campaign.targetGender as CampaignData['targetGender'],
          callToAction: campaign.callToAction,
          status: campaign.status as CampaignData['status'],
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate.toISOString(),
          pageId: campaign.pageId || undefined,
          facebookPostId: campaign.facebookPostId || undefined,
          adAccountId: undefined,
          approvalCode: campaign.approvalCode || undefined,
          fingerprint: campaign.fingerprint || undefined,
          approvedBy: campaign.approvedBy || undefined,
          approvedAt: campaign.approvedAt?.toISOString(),
          metaCampaignId: campaign.metaCampaignId || undefined,
          metaAdSetId: campaign.metaAdSetId || undefined,
          metaCreativeId: campaign.metaCreativeId || undefined,
          metaAdId: campaign.metaAdId || undefined,
          telegramSentAt: campaign.telegramSentAt?.toISOString(),
          lastError: campaign.lastError || undefined,
          errorStep: campaign.errorStep || undefined,
          metaInsightsAt: undefined,
          createdAt: campaign.createdAt.toISOString(),
          updatedAt: campaign.updatedAt.toISOString(),
        };
      }
    } catch (error: any) {
      console.warn('Không đọc được Campaign từ Prisma, dùng JSON fallback:', error.message);
    }
  }
  return getCampaignById(id);
}

export function saveCampaign(campaign: CampaignData): CampaignData {
  ensureDataFiles();
  const campaigns = getAllCampaigns();
  const index = campaigns.findIndex((c) => c.id === campaign.id);

  if (index >= 0) {
    campaigns[index] = { ...campaign, updatedAt: new Date().toISOString() };
  } else {
    campaigns.unshift({ ...campaign, updatedAt: new Date().toISOString() });
  }

  writeLocalFile(DATA_FILE, JSON.stringify(campaigns, null, 2));

  // Đồng bộ thời gian thực vào SQLite via Prisma (Không dùng mock)
  const prisma = getPrisma();
  if (prisma) {
    prisma.campaign.upsert({
      where: { id: campaign.id },
      update: {
        code: campaign.code,
        name: campaign.name,
        description: campaign.description || null,
        imageUrl: campaign.imageUrl || null,
        objective: campaign.objective,
        objectiveText: campaign.objectiveText,
        specialCategory: campaign.specialCategory || 'NONE',
        location: campaign.location,
        radiusKm: Number(campaign.radiusKm || 15),
        targetAge: campaign.targetAge || '25 - 45',
        targetGender: campaign.targetGender || 'ALL',
        targetInterests: JSON.stringify(campaign.targetInterests || []),
        dailyBudget: Number(campaign.dailyBudget),
        durationDays: Number(campaign.durationDays),
        totalBudget: Number(campaign.totalBudget),
        maxEstimatedSpend: Number(campaign.maxEstimatedSpend),
        startDate: new Date(campaign.startDate || Date.now()),
        endDate: new Date(campaign.endDate || Date.now()),
        headline: campaign.headline,
        primaryText: campaign.primaryText,
        callToAction: campaign.callToAction || 'SEND_MESSAGE',
        pageName: campaign.pageName,
        pageId: campaign.pageId || null,
        facebookPostId: campaign.facebookPostId || null,
        status: campaign.status,
        version: Number(campaign.version || 1),
        approvalCode: campaign.approvalCode || null,
        fingerprint: campaign.fingerprint || null,
        approvedBy: campaign.approvedBy || null,
        approvedAt: campaign.approvedAt ? new Date(campaign.approvedAt) : null,
        metaCampaignId: campaign.metaCampaignId || null,
        metaAdSetId: campaign.metaAdSetId || null,
        metaCreativeId: campaign.metaCreativeId || null,
        metaAdId: campaign.metaAdId || null,
        isMock: Boolean(campaign.isMock),
        telegramSent: Boolean(campaign.telegramSent),
        telegramSentAt: campaign.telegramSentAt ? new Date(campaign.telegramSentAt) : null,
      },
      create: {
        id: campaign.id,
        code: campaign.code,
        name: campaign.name,
        description: campaign.description || null,
        imageUrl: campaign.imageUrl || null,
        objective: campaign.objective,
        objectiveText: campaign.objectiveText,
        specialCategory: campaign.specialCategory || 'NONE',
        location: campaign.location,
        radiusKm: Number(campaign.radiusKm || 15),
        targetAge: campaign.targetAge || '25 - 45',
        targetGender: campaign.targetGender || 'ALL',
        targetInterests: JSON.stringify(campaign.targetInterests || []),
        dailyBudget: Number(campaign.dailyBudget),
        durationDays: Number(campaign.durationDays),
        totalBudget: Number(campaign.totalBudget),
        maxEstimatedSpend: Number(campaign.maxEstimatedSpend),
        startDate: new Date(campaign.startDate || Date.now()),
        endDate: new Date(campaign.endDate || Date.now()),
        headline: campaign.headline,
        primaryText: campaign.primaryText,
        callToAction: campaign.callToAction || 'SEND_MESSAGE',
        pageName: campaign.pageName,
        pageId: campaign.pageId || null,
        facebookPostId: campaign.facebookPostId || null,
        status: campaign.status,
        version: Number(campaign.version || 1),
        approvalCode: campaign.approvalCode || null,
        fingerprint: campaign.fingerprint || null,
        approvedBy: campaign.approvedBy || null,
        approvedAt: campaign.approvedAt ? new Date(campaign.approvedAt) : null,
        metaCampaignId: campaign.metaCampaignId || null,
        metaAdSetId: campaign.metaAdSetId || null,
        metaCreativeId: campaign.metaCreativeId || null,
        metaAdId: campaign.metaAdId || null,
        isMock: Boolean(campaign.isMock),
        telegramSent: Boolean(campaign.telegramSent),
        telegramSentAt: campaign.telegramSentAt ? new Date(campaign.telegramSentAt) : null,
      },
    }).catch((e: any) => console.warn('Lỗi ghi Prisma Campaign:', e.message));
  }

  return campaign;
}

export function deleteCampaign(id: string): boolean {
  ensureDataFiles();
  const campaigns = getAllCampaigns();
  const filtered = campaigns.filter((c) => c.id !== id && c.code !== id);
  if (filtered.length !== campaigns.length) {
    writeLocalFile(DATA_FILE, JSON.stringify(filtered, null, 2));
    const prisma = getPrisma();
    if (prisma) {
      prisma.campaign.deleteMany({ where: { OR: [{ id }, { code: id }] } })
        .catch((e: any) => console.warn('Lỗi xóa Prisma Campaign:', e.message));
    }
    return true;
  }
  return false;
}

// ---------------- USER AUTH STORAGE ----------------
export function getAllUsers(): UserRecord[] {
  try {
    ensureDataFiles();
    const content = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Lỗi đọc users:", err);
    return [];
  }
}

export function getUserByEmail(email: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function getUserById(id: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

export function saveUser(user: UserRecord): UserRecord {
  ensureDataFiles();
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === user.id);

  if (index >= 0) {
    users[index] = { ...user, updatedAt: new Date().toISOString() };
  } else {
    users.push({ ...user, updatedAt: new Date().toISOString() });
  }

  writeLocalFile(USERS_FILE, JSON.stringify(users, null, 2));

  // Đồng bộ User vào SQLite via Prisma
  const prisma = getPrisma();
  if (prisma) {
    prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        emailVerified: user.emailVerified,
        verificationToken: user.verificationToken || null,
        tokenExpiry: user.tokenExpiry ? new Date(user.tokenExpiry) : null,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        emailVerified: user.emailVerified,
        verificationToken: user.verificationToken || null,
        tokenExpiry: user.tokenExpiry ? new Date(user.tokenExpiry) : null,
      },
    }).catch((e: any) => console.warn('Lỗi ghi Prisma User:', e.message));
  }

  return user;
}

// ---------------- MULTI-TENANT CONNECTED PAGES STORAGE ----------------
export function getAllConnectedPages(): ConnectedPageRecord[] {
  try {
    ensureDataFiles();
    const content = fs.readFileSync(PAGES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Lỗi đọc connected pages:", err);
    return [];
  }

}

function mapConnectedPage(page: {
    id: string;
    pageId: string;
    pageName: string;
    pageCategory: string | null;
    pageAccessToken: string;
    instagramId: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}): ConnectedPageRecord {
  return {
    id: page.id,
    pageId: page.pageId,
    pageName: page.pageName,
    pageCategory: page.pageCategory || undefined,
    pageAccessToken: page.pageAccessToken,
    instagramId: page.instagramId || undefined,
    userId: page.userId,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function getAllConnectedPagesAsync(): Promise<ConnectedPageRecord[]> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const pages = await prisma.connectedPage.findMany({ orderBy: { updatedAt: 'desc' } });
      return pages.map(mapConnectedPage);
    } catch (error: any) {
      console.warn('Không đọc được ConnectedPage từ Prisma, dùng JSON fallback:', error.message);
    }
  }
  return getAllConnectedPages();
}

export async function getConnectedPageByIdAsync(pageId: string): Promise<ConnectedPageRecord | undefined> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const page = await prisma.connectedPage.findFirst({
        where: { OR: [{ pageId }, { id: pageId }] },
      });
      if (page) return mapConnectedPage(page);
    } catch (error: any) {
      console.warn('Không đọc được ConnectedPage từ Prisma:', error.message);
    }
  }
  return getConnectedPageById(pageId);
}

export function getConnectedPagesByUser(userId?: string): ConnectedPageRecord[] {
  const pages = getAllConnectedPages();
  if (!userId) return pages;
  return pages.filter((p) => p.userId === userId || p.userId === 'usr-founder-baha');
}

export function getConnectedPageById(pageId: string): ConnectedPageRecord | undefined {
  const pages = getAllConnectedPages();
  return pages.find((p) => p.pageId === pageId || p.id === pageId);
}

export async function saveConnectedPage(page: ConnectedPageRecord): Promise<ConnectedPageRecord> {
  ensureDataFiles();
  const pages = getAllConnectedPages();
  const index = pages.findIndex(
    (p) => p.userId === page.userId && p.pageId === page.pageId
  );

  if (index >= 0) {
    pages[index] = { ...page, updatedAt: new Date().toISOString() };
  } else {
    pages.unshift({ ...page, updatedAt: new Date().toISOString() });
  }

  writeLocalFile(PAGES_FILE, JSON.stringify(pages, null, 2));

  // Đồng bộ ConnectedPage vào SQLite via Prisma
  const prisma = getPrisma();
  if (prisma) {
    await prisma.connectedPage.upsert({
      where: { id: page.id },
      update: {
        pageId: page.pageId,
        pageName: page.pageName,
        pageCategory: page.pageCategory || null,
        pageAccessToken: page.pageAccessToken,
        instagramId: page.instagramId || null,
        userId: page.userId,
      },
      create: {
        id: page.id,
        pageId: page.pageId,
        pageName: page.pageName,
        pageCategory: page.pageCategory || null,
        pageAccessToken: page.pageAccessToken,
        instagramId: page.instagramId || null,
        userId: page.userId,
      },
    }).catch((e: any) => {
      console.warn('Lỗi ghi Prisma ConnectedPage:', e.message);
      throw e;
    });
  }

  return page;
}

export function deleteConnectedPage(id: string): boolean {
  ensureDataFiles();
  const pages = getAllConnectedPages();
  const filtered = pages.filter((p) => p.id !== id && p.pageId !== id);
  if (filtered.length !== pages.length) {
    writeLocalFile(PAGES_FILE, JSON.stringify(filtered, null, 2));
    const prisma = getPrisma();
    if (prisma) {
      prisma.connectedPage.deleteMany({ where: { OR: [{ id }, { pageId: id }] } })
        .catch((e: any) => console.warn('Lỗi xóa Prisma ConnectedPage:', e.message));
    }

    return true;
  }
  return false;
}

export async function getFacebookPosts(pageId?: string): Promise<FacebookPostStorageRecord[]> {
  ensureDataFiles();
  const prisma = getPrisma();
  if (prisma) {
    try {
      const posts = await prisma.facebookPost.findMany({
        where: pageId ? { pageId } : undefined,
        orderBy: { createdTime: 'desc' },
        take: 5000,
      });
      return posts.map((post) => ({
        id: post.postId,
        pageId: post.pageId,
        pageName: post.pageName,
        message: post.message,
        createdTime: post.createdTime.toISOString(),
        permalinkUrl: post.permalinkUrl || undefined,
        fullPicture: post.fullPicture || undefined,
        statusType: post.statusType || undefined,
        comments: post.comments,
        reactions: post.reactions,
        shares: post.shares,
        isMock: post.isMock,
        syncedAt: post.syncedAt.toISOString(),
      }));
    } catch (err) {
      console.warn('Không đọc được FacebookPost từ Prisma, dùng JSON fallback:', (err as any).message);
    }
  }
  try {
    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8')) as FacebookPostStorageRecord[];
    return pageId ? posts.filter((post) => post.pageId === pageId) : posts;
  } catch (err) {
    console.error('Lỗi đọc bài đăng Facebook:', err);
    return [];
  }
}

export async function saveFacebookPosts(posts: FacebookPostStorageRecord[]): Promise<FacebookPostStorageRecord[]> {
  ensureDataFiles();
  const existing = await getFacebookPosts();
  const byId = new Map(existing.map((post) => [post.id, post]));
  posts.forEach((post) => byId.set(post.id, post));
  const merged = Array.from(byId.values())
    .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
    .slice(0, 5000);
  writeLocalFile(POSTS_FILE, JSON.stringify(merged, null, 2));
  const prisma = getPrisma();
  if (prisma) {
    try {
      await Promise.all(posts.map((post) => prisma.facebookPost.upsert({
        where: { pageId_postId: { pageId: post.pageId, postId: post.id } },
        update: {
          pageName: post.pageName,
          message: post.message,
          createdTime: new Date(post.createdTime),
          permalinkUrl: post.permalinkUrl || null,
          fullPicture: post.fullPicture || null,
          statusType: post.statusType || null,
          comments: post.comments,
          reactions: post.reactions,
          shares: post.shares,
          isMock: post.isMock,
          syncedAt: new Date(post.syncedAt),
        },
        create: {
          postId: post.id,
          pageId: post.pageId,
          pageName: post.pageName,
          message: post.message,
          createdTime: new Date(post.createdTime),
          permalinkUrl: post.permalinkUrl || null,
          fullPicture: post.fullPicture || null,
          statusType: post.statusType || null,
          comments: post.comments,
          reactions: post.reactions,
          shares: post.shares,
          isMock: post.isMock,
          syncedAt: new Date(post.syncedAt),
        },
      })));
    } catch (err) {
      console.warn('Lỗi ghi FacebookPost vào Prisma:', (err as any).message);
    }
  }
  return posts;
}
