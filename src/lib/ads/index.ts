import { AdsPlatformAdapter } from './types';
import { MockAdsAdapter } from './mock-adapter';
import { MetaAdsAdapter } from './meta-adapter';

export * from './types';
export * from './mock-adapter';
export * from './meta-adapter';

/**
 * Factory cung cấp Adapter phù hợp theo cấu hình môi trường hoặc yêu cầu
 */
export function getAdsAdapter(modeOverride?: 'MOCK' | 'REAL'): AdsPlatformAdapter {
  const currentMode = modeOverride || process.env.META_API_MODE || 'MOCK';

  if (currentMode === 'REAL') {
    return new MetaAdsAdapter();
  }

  return new MockAdsAdapter();
}

