import crypto from 'crypto';

// Khóa mã hóa 32 bytes (AES-256) lấy từ biến môi trường hoặc fallback dẫn xuất an toàn
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || process.env.META_APP_SECRET || 'baha-ads-system-default-encryption-secret-key-32b';
const ALGORITHM = 'aes-256-gcm';

function getDerivedKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
}

/**
 * Mã hóa chuỗi nhạy cảm (như Page Access Token, Facebook User Token)
 * Định dạng lưu trữ: iv:authTag:encryptedData (Hex)
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  // Nếu là token mock thì đánh dấu trực tiếp
  if (plainText.startsWith('enc:')) return plainText;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getDerivedKey(), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Giải mã token an toàn ở backend khi cần gọi Meta Graph API
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) return '';
  if (!encryptedText.startsWith('enc:')) {
    // Trả về nếu chưa được mã hóa (dữ liệu cũ/mock)
    return encryptedText;
  }

  try {
    const parts = encryptedText.slice(4).split(':');
    if (parts.length !== 3) return encryptedText;

    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, getDerivedKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('Lỗi giải mã token, sử dụng giá trị gốc nếu có:', (err as any).message);
    return encryptedText;
  }
}

/**
 * Che giấu token khi hiển thị hoặc log (không bao giờ lộ token ra ngoài)
 */
export function maskToken(token: string): string {
  if (!token) return '***';
  if (token.length <= 10) return '***';
  return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
}

