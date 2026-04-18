import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, CheckCircle, XCircle, Clock, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ReturnsPolicy = () => {
  useEffect(() => {
    document.title = 'Returns & Refund Policy - SellMate360 | Easy Returns';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about SellMate360\'s hassle-free return and refund policy. 7-day return window, easy process, and quick refunds for eligible products.');
    }
  }, []);

  const eligibleReturns = [
    'Defective or damaged products',
    'Wrong product delivered',
    'Product significantly different from description',
    'Missing parts or accessories',
    'Manufacturing defects',
  ];

  const nonEligibleReturns = [
    'Products used or damaged by the customer',
    'Personal care and hygiene products (opened)',
    'Underwear, swimwear, and intimate apparel',
    'Customized or personalized items',
    'Perishable goods and food items',
    'Products with removed tags or labels',
    'Software, digital products, or gift cards',
  ];

  const returnProcess = [
    { step: 1, title: 'Request Return', description: 'Submit a return request within 7 days of delivery via your account or WhatsApp' },
    { step: 2, title: 'Approval', description: 'Our team will review and approve your request within 24 hours' },
    { step: 3, title: 'Ship Back', description: 'Pack the item securely and ship it back using our provided label' },
    { step: 4, title: 'Inspection', description: 'We inspect the returned item upon receipt (1-2 business days)' },
    { step: 5, title: 'Refund', description: 'Refund processed to your original payment method within 5-7 business days' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <RotateCcw className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Returns & Refund Policy</h1>
            <p className="text-lg opacity-90">
              We want you to be completely satisfied with your purchase. If you're not happy, we'll make it right.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: '7-Day Returns', desc: 'Return window from delivery' },
              { icon: Package, title: 'Free Returns', desc: 'On defective products' },
              { icon: RotateCcw, title: 'Quick Refunds', desc: '5-7 business days' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Return Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-center mb-8">How to Return an Item</h2>
            <div className="grid md:grid-cols-5 gap-4">
              {returnProcess.map((step, index) => (
                <div key={step.step} className="relative">
                  <Card className="h-full text-center">
                    <CardContent className="pt-6">
                      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                        {step.step}
                      </div>
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  {index < returnProcess.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Eligible Returns */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    Eligible for Returns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {eligibleReturns.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Non-Eligible Returns */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Not Eligible for Returns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {nonEligibleReturns.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Refund Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle>Refund Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Refund Methods</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong>Original Payment Method:</strong> Refund to the card or account used for purchase</li>
                    <li>• <strong>Store Credit:</strong> Instant credit to your SellMate360 account (10% bonus)</li>
                    <li>• <strong>Bank Transfer:</strong> Direct transfer to your bank account (COD orders)</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Refund Timeline</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <Badge className="mb-2">Store Credit</Badge>
                      <p className="text-sm text-muted-foreground">Instant upon approval</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <Badge variant="secondary" className="mb-2">Bank Transfer</Badge>
                      <p className="text-sm text-muted-foreground">3-5 business days</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <Badge variant="outline" className="mb-2">Card Refund</Badge>
                      <p className="text-sm text-muted-foreground">5-7 business days</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-warning/10 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Important Note</p>
                      <p className="text-sm text-muted-foreground">
                        Original shipping charges are non-refundable unless the return is due to our error. 
                        For exchanges, additional shipping charges may apply based on your location.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ReturnsPolicy;
