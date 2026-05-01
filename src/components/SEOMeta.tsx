import { useEffect } from 'react';
import { usePageSEO } from '@/hooks/usePageSEO';

interface SEOMetaProps {
  pageType: string;
  /** Override title (e.g. product name for product pages) */
  titleOverride?: string;
  /** Override description */
  descriptionOverride?: string;
  /** Override OG image */
  imageOverride?: string;
}

/** Applies SEO meta tags from the seo_settings table to the document head. */
export default function SEOMeta({ pageType, titleOverride, descriptionOverride, imageOverride }: SEOMetaProps) {
  const { data: seo } = usePageSEO(pageType);

  useEffect(() => {
    const title = titleOverride || seo?.meta_title || 'SellMate360';
    const description = descriptionOverride || seo?.meta_description || 'Shop the best products online.';
    const ogTitle = seo?.og_title || title;
    const ogDesc = seo?.og_description || description;
    const ogImage = imageOverride || seo?.og_image || '';
    const robots = seo?.robots_directive || 'index,follow';
    const canonical = seo?.canonical_url || '';

    // Title
    document.title = title;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    setMeta('description', description);
    setMeta('robots', robots);
    setMeta('og:title', ogTitle, 'property');
    setMeta('og:description', ogDesc, 'property');
    setMeta('og:type', 'website', 'property');
    if (ogImage) setMeta('og:image', ogImage, 'property');
    if (canonical) setLink('canonical', canonical);

    // Structured data
    if (seo?.structured_data) {
      try {
        JSON.parse(seo.structured_data); // validate
        let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.textContent = seo.structured_data;
      } catch {}
    }
  }, [seo, titleOverride, descriptionOverride, imageOverride, pageType]);

  return null;
}
