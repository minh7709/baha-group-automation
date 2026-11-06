// src/lib/facebook.ts
// Dựa trên tài liệu h_ng_d_n_code_t_ng_ng_b_i_meta_graph_api.md

export interface PostPayload {
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  scheduledTime?: number; // Unix timestamp tính bằng giây
  pageId?: string;
  accessToken?: string;
}

export interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  isMock: boolean;
  message?: string;
  error?: string;
}

export interface FacebookPostRecord {
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

/**
 * Kiểm tra xem token có phải là token thật của Meta hay chỉ là token mô phỏng (Mock)
 */
export function isRealMetaToken(token?: string): boolean {
  if (!token) return false;
  const t = token.trim();
  const lower = t.toLowerCase();
  if (lower.includes('mock') || lower.includes('test') || lower.startsWith('eaagm0pxqb_mock')) {
    return false;
  }
  return t.startsWith('EAA') && t.length > 50;
}

export class FacebookService {
  private defaultPageId: string;
  private defaultAccessToken: string;
  private apiVersion: string;

  constructor() {
    this.defaultPageId = process.env.FB_PAGE_ID || '';
    this.defaultAccessToken = process.env.FB_PAGE_ACCESS_TOKEN || '';
    this.apiVersion = process.env.FB_GRAPH_VERSION || 'v21.0';
  }

  async listPagePosts(pageId: string, accessToken: string, limit = 25): Promise<FacebookPostRecord[]> {
    if (!pageId || !accessToken) {
      throw new Error('Thiếu Page ID hoặc Page Access Token để đồng bộ bài đăng.');
    }

    if (!isRealMetaToken(accessToken)) {
      return [];
    }

    const fields = [
      'id',
      'message',
      'created_time',
      'permalink_url',
      'full_picture',
      'status_type',
      'shares',
      'comments.limit(0).summary(true)',
      'reactions.limit(0).summary(true)',
    ].join(',');
    const url = `https://graph.facebook.com/${this.apiVersion}/${pageId}/posts?${new URLSearchParams({
      fields,
      limit: String(Math.min(Math.max(limit, 1), 100)),
      access_token: accessToken,
    })}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Không thể lấy bài đăng từ Facebook Graph API.');
    }

    return (data.data || []).map((post: any) => ({
      id: post.id,
      pageId,
      pageName: '',
      message: post.message || '',
      createdTime: post.created_time,
      permalinkUrl: post.permalink_url,
      fullPicture: post.full_picture,
      statusType: post.status_type,
      comments: Number(post.comments?.summary?.total_count || 0),
      reactions: Number(post.reactions?.summary?.total_count || 0),
      shares: Number(post.shares?.count || 0),
      isMock: false,
      syncedAt: new Date().toISOString(),
    }));
  }

  /**
   * Đăng bài Text hoặc Link lên Feed Fanpage
   */
  async postTextOrLink(
    message: string, 
    linkUrl?: string, 
    scheduledTime?: number,
    pageId?: string,
    accessToken?: string
  ): Promise<PostResult> {
    const targetPageId = pageId || this.defaultPageId;
    const targetToken = accessToken || this.defaultAccessToken;

    // Chế độ MÔ PHỎNG AN TOÀN nếu chưa có Page Token thật hoặc token là mock (chống lỗi Malformed access token)
    if (!targetPageId || !targetToken || !isRealMetaToken(targetToken)) {
      await new Promise((r) => setTimeout(r, 600)); // Giả lập độ trễ mạng
      const mockPostId = `${targetPageId || '102938475610293'}_${Date.now()}`;
      return {
        success: true,
        isMock: true,
        postId: mockPostId,
        postUrl: `https://facebook.com/${mockPostId}`,
        message: scheduledTime
          ? `[MÔ PHỎNG] Đã lên lịch đăng bài Text thành công vào lúc ${new Date(scheduledTime * 1000).toLocaleString('vi-VN')}!`
          : '[MÔ PHỎNG] Đã đăng bài viết dạng Text lên Fanpage thành công (Chế độ mô phỏng chuẩn Graph API v21.0)!',
      };
    }

    // CHẾ ĐỘ THẬT: GỌI META GRAPH API v21.0
    const url = `https://graph.facebook.com/${this.apiVersion}/${targetPageId}/feed`;
    const bodyPayload: Record<string, any> = {
      message,
      access_token: targetToken,
    };

    if (linkUrl) bodyPayload.link = linkUrl;
    if (scheduledTime) {
      bodyPayload.published = false;
      bodyPayload.scheduled_publish_time = scheduledTime;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          isMock: false,
          error: data.error?.message || 'Lỗi không xác định từ Facebook API',
        };
      }

      return {
        success: true,
        isMock: false,
        postId: data.id,
        postUrl: `https://facebook.com/${data.id}`,
        message: scheduledTime ? 'Lên lịch bài viết thành công!' : 'Đã đăng bài viết lên Fanpage thật thành công!',
      };
    } catch (err: any) {
      return {
        success: false,
        isMock: false,
        error: err.message || 'Lỗi kết nối máy chủ Facebook',
      };
    }
  }

  /**
   * Đăng bài kèm Hình Ảnh (Photo Upload with Caption)
   */
  async postPhoto(
    message: string, 
    imageUrl: string, 
    scheduledTime?: number,
    pageId?: string,
    accessToken?: string
  ): Promise<PostResult> {
    const targetPageId = pageId || this.defaultPageId;
    const targetToken = accessToken || this.defaultAccessToken;

    // Chế độ MÔ PHỎNG AN TOÀN nếu chưa có Page Token thật hoặc token là mock (chống lỗi Malformed access token)
    if (!targetPageId || !targetToken || !isRealMetaToken(targetToken)) {
      await new Promise((r) => setTimeout(r, 700));
      const mockPostId = `${targetPageId || '102938475610293'}_${Date.now()}`;
      return {
        success: true,
        isMock: true,
        postId: mockPostId,
        postUrl: `https://facebook.com/${mockPostId}`,
        message: scheduledTime
          ? `[MÔ PHỎNG] Đã lên lịch đăng ảnh kèm Caption thành công vào lúc ${new Date(scheduledTime * 1000).toLocaleString('vi-VN')}!`
          : '[MÔ PHỎNG] Đã upload và đăng ảnh kèm Caption lên Fanpage thành công (0đ)!',
      };
    }

    // CHẾ ĐỘ THẬT: GỌI META GRAPH API v21.0
    const url = `https://graph.facebook.com/${this.apiVersion}/${targetPageId}/photos`;
    const bodyPayload: Record<string, any> = {
      url: imageUrl,
      caption: message,
      access_token: targetToken,
    };

    if (scheduledTime) {
      bodyPayload.published = false;
      bodyPayload.scheduled_publish_time = scheduledTime;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          isMock: false,
          error: data.error?.message || 'Lỗi khi upload ảnh lên Facebook',
        };
      }

      const finalId = data.post_id || data.id;
      return {
        success: true,
        isMock: false,
        postId: finalId,
        postUrl: `https://facebook.com/${finalId}`,
        message: scheduledTime ? 'Lên lịch bài viết kèm ảnh thành công!' : 'Đã đăng ảnh lên Fanpage thật thành công!',
      };
    } catch (err: any) {
      return {
        success: false,
        isMock: false,
        error: err.message || 'Lỗi kết nối khi gửi ảnh lên Facebook',
      };
    }
  }

  /**
   * Điều phối chính: Tự nhận diện loại bài đăng
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    if (payload.imageUrl && payload.imageUrl.trim() !== '') {
      return this.postPhoto(
        payload.message, 
        payload.imageUrl, 
        payload.scheduledTime, 
        payload.pageId, 
        payload.accessToken
      );
    }
    return this.postTextOrLink(
      payload.message, 
      payload.linkUrl, 
      payload.scheduledTime, 
      payload.pageId, 
      payload.accessToken
    );
  }
}
