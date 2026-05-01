import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { usePublicFAQs } from '@/hooks/useFAQs';
import SEOMeta from '@/components/SEOMeta';

export default function FAQPage() {
  const { data: groups = [], isLoading } = usePublicFAQs();
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  const filtered = groups
    .map((g) => ({
      ...g,
      faqs: g.faqs.filter(
        (f) =>
          !search ||
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((g) => g.faqs.length > 0);

  const totalFAQs = groups.reduce((acc, g) => acc + g.faqs.length, 0);

  return (
    <>
      <SEOMeta
        pageType="faq"
        titleOverride="Frequently Asked Questions | SellMate360"
        descriptionOverride="Find answers to common questions about ordering, delivery, returns, and more."
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto max-w-4xl py-16 px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-5">
                <div className="p-4 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <HelpCircle className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                Frequently Asked Questions
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Can't find what you're looking for? We're here to help.
              </p>

              {/* Search */}
              <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  className="pl-11 h-12 text-base rounded-xl border-border/60 shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto max-w-4xl py-12 px-4">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-7 w-48 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => <Skeleton key={j} className="h-14 w-full rounded-xl" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try a different search term or browse all categories.
              </p>
              {search && (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear Search
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-10">
              {filtered.map((group, gi) => (
                <motion.div
                  key={group.category.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: gi * 0.08 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-xl font-bold text-foreground">
                      {group.category.name}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {group.faqs.length} {group.faqs.length === 1 ? 'question' : 'questions'}
                    </Badge>
                  </div>
                  {group.category.description && (
                    <p className="text-muted-foreground text-sm mb-4 -mt-2">
                      {group.category.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {group.faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="border border-border/60 rounded-xl overflow-hidden bg-card hover:border-border transition-colors"
                      >
                        <button
                          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-foreground"
                          onClick={() => toggle(faq.id)}
                          aria-expanded={openId === faq.id}
                        >
                          <span>{faq.question}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {openId === faq.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {openId === faq.id && (
                            <motion.div
                              key="answer"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <div
                                className="px-5 pb-5 pt-0 text-muted-foreground leading-relaxed text-sm prose prose-neutral dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: faq.answer }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Contact CTA */}
          {!isLoading && (
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-muted/40 border-border/50">
                <CardContent className="py-10 text-center">
                  <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
                    Our support team is ready to help. Get in touch and we'll respond within 24 hours.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                      <Link to="/contact">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Support
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="https://wa.me" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp Us
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
