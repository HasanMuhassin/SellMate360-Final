import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAnnouncements } from '@/hooks/useContent';

export default function AnnouncementBanner() {
  const { data: announcements = [] } = useAnnouncements();
  const location = useLocation();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]');
    } catch {
      return [];
    }
  });

  const currentPage = location.pathname.replace('/', '') || 'home';

  const now = new Date();

  const activeTop = announcements
    .filter((a) => {
      if (!a.is_active) return false;
      if (dismissed.includes(a.id)) return false;
      if (new Date(a.starts_at) > now) return false;
      if (a.ends_at && new Date(a.ends_at) < now) return false;
      if (a.position !== 'top') return false;

      const pages = a.target_pages || ['all'];
      if (pages.includes('all')) return true;
      return pages.some((p) => currentPage.startsWith(p));
    })
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const activeBottom = announcements
    .filter((a) => {
      if (!a.is_active) return false;
      if (dismissed.includes(a.id)) return false;
      if (new Date(a.starts_at) > now) return false;
      if (a.ends_at && new Date(a.ends_at) < now) return false;
      if (a.position !== 'bottom') return false;

      const pages = a.target_pages || ['all'];
      if (pages.includes('all')) return true;
      return pages.some((p) => currentPage.startsWith(p));
    })
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const dismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    try {
      sessionStorage.setItem('dismissed_announcements', JSON.stringify(updated));
    } catch {}
  };

  if (activeTop.length === 0 && activeBottom.length === 0) return null;

  const renderBanner = (announcement: typeof announcements[0]) => (
    <div
      key={announcement.id}
      className="relative flex items-center justify-center gap-4 px-4 py-2.5 text-sm font-medium"
      style={{
        backgroundColor: announcement.background_color || 'hsl(var(--primary))',
        color: announcement.text_color || 'hsl(var(--primary-foreground))',
      }}
    >
      <span>
        {announcement.message}
        {announcement.link && (
          <a
            href={announcement.link}
            className="ml-2 underline underline-offset-2 hover:no-underline font-semibold"
          >
            {announcement.link_text || 'Learn More'}
          </a>
        )}
      </span>

      {announcement.show_close_button && (
        <button
          onClick={() => dismiss(announcement.id)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Top banners */}
      {activeTop.length > 0 && (
        <div id="announcement-top" className="w-full">
          {activeTop.map(renderBanner)}
        </div>
      )}

      {/* Bottom banners — rendered as fixed footer-above bar */}
      {activeBottom.length > 0 && (
        <div id="announcement-bottom" className="fixed bottom-0 left-0 right-0 z-50 w-full">
          {activeBottom.map(renderBanner)}
        </div>
      )}
    </>
  );
}
