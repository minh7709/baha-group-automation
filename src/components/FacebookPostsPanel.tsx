'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, MessageCircle, Heart, Share2 } from 'lucide-react';

interface PageItem {
  pageId: string;
  pageName: string;
}

interface PostItem {
  id: string;
  pageName: string;
  message: string;
  createdTime: string;
  permalinkUrl?: string;
  fullPicture?: string;
  comments: number;
  reactions: number;
  shares: number;
  isMock: boolean;
}

export const FacebookPostsPanel: React.FC = () => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pageId, setPageId] = useState('');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadPages = async () => {
    const res = await fetch('/api/pages');
    const data = await res.json();
    if (data.success) {
      setPages(data.pages || []);
      if (!pageId && data.pages?.[0]) setPageId(data.pages[0].pageId);
    }
  };

  const loadPosts = async (sync: boolean) => {
    if (!pageId) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/facebook/posts?pageId=${encodeURIComponent(pageId)}&sync=${sync}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể tải bài đăng.');
      setPosts(data.posts || []);
      setMessage(sync ? 'Đã đồng bộ bài đăng mới nhất từ Facebook.' : '');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (pageId) loadPosts(false).catch((error) => setMessage(error.message));
  }, [pageId]);

  return (
    <section className="w-full bg-[#131722] border border-[#232b3d] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">FACEBOOK GRAPH API</span>
          <h3 className="text-lg font-bold text-gray-100">Quản lý bài đăng Fanpage</h3>
          <p className="text-xs text-gray-400">Đồng bộ nội dung và số liệu tương tác từ Fanpage đã liên kết.</p>
        </div>
        <div className="flex gap-2">
          <select value={pageId} onChange={(event) => setPageId(event.target.value)} className="bg-[#0c0f17] border border-[#273248] rounded-lg px-3 py-2 text-xs text-gray-200">
            <option value="">Chọn Fanpage</option>
            {pages.map((page) => <option key={page.pageId} value={page.pageId}>{page.pageName}</option>)}
          </select>
          <button type="button" disabled={!pageId || loading} onClick={() => loadPosts(true)} className="px-3 py-2 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 text-xs font-semibold disabled:opacity-50">
            <RefreshCw className={`inline w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Đồng bộ
          </button>
        </div>
      </div>
      {message && <p className="text-xs text-sky-300">{message}</p>}
      {!pageId ? <p className="text-sm text-gray-500">Chưa có Fanpage được liên kết.</p> : posts.length === 0 ? <p className="text-sm text-gray-500">Chưa có dữ liệu. Bấm Đồng bộ để lấy bài đăng từ Facebook.</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-[#26334a] bg-[#0e121a] overflow-hidden">
              {post.fullPicture && <img src={post.fullPicture} alt="" className="w-full h-36 object-cover" />}
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>{new Date(post.createdTime).toLocaleString('vi-VN')}</span>
                  {post.permalinkUrl && <a href={post.permalinkUrl} target="_blank" rel="noreferrer" className="text-sky-400"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
                <p className="text-sm text-gray-200 whitespace-pre-wrap line-clamp-4">{post.message || '(Bài đăng không có nội dung văn bản)'}</p>
                <div className="flex gap-3 text-[11px] text-gray-400">
                  <span><Heart className="inline w-3 h-3 mr-1" />{post.reactions}</span>
                  <span><MessageCircle className="inline w-3 h-3 mr-1" />{post.comments}</span>
                  <span><Share2 className="inline w-3 h-3 mr-1" />{post.shares}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

