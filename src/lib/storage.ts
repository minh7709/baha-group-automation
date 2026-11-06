import fs from 'fs';
import path from 'path';
import { CampaignData } from './types';
import { INITIAL_CAMPAIGNS } from './default-scenarios';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'campaigns.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

  function ensureDataFiles() {
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

  export function saveCampaign(campaign: CampaignData): CampaignData {
    ensureDataFiles();
    const campaigns = getAllCampaigns();
    const index = campaigns.findIndex((c) => c.id === campaign.id);

    if (index >= 0) {
      campaigns[index] = { ...campaign, updatedAt: new Date().toISOString() };
    } else {
      campaigns.unshift({ ...campaign, updatedAt: new Date().toISOString() });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(campaigns, null, 2), 'utf-8');
    return campaign;
  }

  export function deleteCampaign(id: string): boolean {
    ensureDataFiles();
    const campaigns = getAllCampaigns();
    const filtered = campaigns.filter((c) => c.id !== id && c.code !== id);
    if (filtered.length !== campaigns.length) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
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

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return user;
  }
