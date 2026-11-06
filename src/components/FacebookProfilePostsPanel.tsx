'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, MessageCircle, Heart, Share2 } from 'lucide-react';

interface ProfilePost {
  id: string;
  message: string;
  createdTime?: string;
  permalinkUrl?: string;
  fullPicture?: string;
  comments?: number;
  reactions?: number;
  shares?: number;
}

interface FacebookProfilePostsPanelProps {
  onCreateAdDraft?: (campaign: any) => void;
}

export const FacebookProfilePostsPanel: React.FC<FacebookProfilePostsPanelProps> = ({ onCreateAdDraft }) => {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pages, setPages] = useState<Array<{ pageId: string; pageName: string }>>([]);
  const [creatingPostId, setCreatingPostId] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/facebook/profile/posts?limit=25', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể đọc bài viết cá nhân.');
      }
      setPosts(data.posts || []);
      if ((data.posts || []).length === 0) {
        setMessage('Meta không trả về bài viết hoặc tài khoản không có bài viết đủ điều kiện.');
      }
    } catch (error: any) {
      setPosts([]);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDraftFromProfilePost = async (post: ProfilePost) => {
    if (!pages[0]) {
      setMessage('Hãy kết nối ít nhất một Fanpage để dùng nội dung profile làm bản nháp quảng cáo.');
      return;
    }
    setCreatingPostId(post.id);
    setMessage('');
    try {
      const response = await fetch('/api/campaigns/from-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'profile',
          postId: post.id,
          pageId: pages[0].pageId,
          profilePost: {
            ...post,
            pageId: pages[0].pageId,
            pageName: pages[0].pageName,
            comments: post.comments || 0,
            reactions: post.reactions || 0,
            shares: post.shares || 0,
            isMock: false,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Không thể tạo bản nháp quảng cáo.');
      onCreateAdDraft?.(data.campaign);
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setCreatingPostId(null);
    }
  };

  useEffect(() => {
    fetch('/api/pages')
      .then((response) => response.json())
      .then((data) => setPages(data.success ? data.pages || [] : []))
      .catch(() => setPages([]));
    loadPosts().catch((error) => setMessage(error.message));
  }, []);

  return (
    <section className="w-full bg-[#131722] border border-[#232b3d] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">FACEBOOK PROFILE</span>
          <h3 className="text-lg font-bold text-gray-100">Bài đăng Facebook</h3>
          <p className="text-xs text-gray-400">Danh sách profile dùng cùng giao diện với bài đăng Fanpage.</p>
        </div>
        <button type="button" onClick={loadPosts} disabled={loading} className="px-3 py-2 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 text-xs font-semibold disabled:opacity-50">
          <RefreshCw className={`inline w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Tải lại
        </button>
      </div>
      {message && <p className="text-xs text-amber-300">{message}</p>}
      {posts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-[#26334a] bg-[#0e121a] overflow-hidden">
              {post.fullPicture && <img src={post.fullPicture} alt="" className="w-full h-36 object-cover" />}
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>{post.createdTime ? new Date(post.createdTime).toLocaleString('vi-VN') : ''}</span>
                  {post.permalinkUrl && <a href={post.permalinkUrl} target="_blank" rel="noreferrer" className="text-blue-400"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{post.message || '(Bài viết không có nội dung văn bản)'}</p>
                <div className="flex gap-3 text-[11px] text-gray-400">
                  <span><Heart className="inline w-3 h-3 mr-1" />{post.reactions || 0}</span>
                  <span><MessageCircle className="inline w-3 h-3 mr-1" />{post.comments || 0}</span>
                  <span><Share2 className="inline w-3 h-3 mr-1" />{post.shares || 0}</span>
                </div>
                <button
                  type="button"
                  disabled={creatingPostId !== null || pages.length === 0}
                  onClick={() => createDraftFromProfilePost(post)}
                  className="w-full mt-3 min-h-10 py-2.5 rounded-lg bg-emerald-600 text-white border border-emerald-400 text-sm font-bold shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 disabled:opacity-60"
                >
                  {creatingPostId === post.id ? 'Đang tạo bản nháp...' : 'Chọn bài này để quảng cáo'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
