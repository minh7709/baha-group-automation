import { AdsPlatformAdapter } from './types';
import { MockAdsAdapter } from './mock-adapter';
import { MetaAdsAdapter } from './meta-adapter';
import { isRealMetaToken } from '../facebook';
import { decryptToken } from '../crypto';

export * from './types';
export * from './mock-adapter';
export * from './meta-adapter';

/**
 * Factory cung cấp Adapter phù hợp theo cấu hình môi trường hoặc yêu cầu
 */
export function getAdsAdapter(
  modeOverride?: 'MOCK' | 'REAL',
  config?: { pageId?: string; adAccountId?: string; accessToken?: string }
): AdsPlatformAdapter {
  const currentMode = modeOverride || process.env.META_API_MODE || 'MOCK';

  if (currentMode === 'REAL') {
    const rawToken = config?.accessToken || process.env.META_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || '';
    const token = decryptToken(rawToken);
    const adAccountId = config?.adAccountId || process.env.META_AD_ACCOUNT_ID || '';

    // Không fallback sang MOCK khi người dùng đã chọn REAL: lỗi cấu hình phải
    // được trả rõ ràng để không tạo cảm giác đã gọi Meta thật.
    if (!token || !isRealMetaToken(token) || !adAccountId) {
      console.warn('getAdsAdapter: META_API_MODE là REAL nhưng thiếu META_ACCESS_TOKEN hợp lệ hoặc META_AD_ACCOUNT_ID.');
      return new MetaAdsAdapter({ ...config, accessToken: '', adAccountId });
    }

    return new MetaAdsAdapter({ ...config, accessToken: token, adAccountId });
  }

  return new MockAdsAdapter();
}
