'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface ProfilePost {
  id: string;
  message: string;
  createdTime?: string;
  permalinkUrl?: string;
  fullPicture?: string;
}

export const FacebookProfilePostsPanel: React.FC = () => {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  useEffect(() => {
    loadPosts().catch((error) => setMessage(error.message));
  }, []);

  return (
    <section className="w-full bg-[#131722] border border-[#232b3d] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">FACEBOOK PROFILE</span>
          <h3 className="text-lg font-bold text-gray-100">Bài viết cá nhân</h3>
          <p className="text-xs text-gray-400">Đọc dữ liệu profile bằng User Access Token và quyền user_posts.</p>
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
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
