import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicCMSPage } from '@/hooks/usePublicCMS';
import SEOMeta from '@/components/SEOMeta';
import { format } from 'date-fns';

export default function CMSPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, isError } = usePublicCMSPage(slug || '');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl py-16 px-4">
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-4 w-40 mb-8" />
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (isError || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-24 px-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-muted">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            This page doesn't exist or hasn't been published yet.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        pageType="custom"
        titleOverride={page.meta_title || page.title}
        descriptionOverride={page.meta_description || undefined}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Header */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto max-w-3xl py-12 px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span>/</span>
                <span>{page.title}</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{page.title}</h1>
              {page.published_at && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Last updated {format(new Date(page.updated_at), 'MMMM d, yyyy')}
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          className="container mx-auto max-w-3xl py-12 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:no-underline
              prose-ul:my-4 prose-li:text-muted-foreground
              prose-strong:text-foreground prose-strong:font-semibold"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t">
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
