import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckSquare, AlertTriangle, Scale, ShoppingCart, Truck, CreditCard, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const TermsConditions = () => {
  useEffect(() => {
    document.title = 'Terms & Conditions - SellMate360 | Usage Terms';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read SellMate360\'s terms and conditions. Understand your rights and responsibilities when using our e-commerce platform and services.');
    }
  }, []);

  const termsCategories = [
    {
      icon: CheckSquare,
      title: 'General Terms',
      items: [
        {
          term: 'Acceptance of Terms',
          content: 'By accessing or using the SellMate360 website, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms, you may not access or use our services.',
        },
        {
          term: 'Eligibility',
          content: 'You must be at least 18 years old to use our services. By using this website, you represent that you are at least 18 years of age or have the consent of a parent or guardian.',
        },
        {
          term: 'Account Registration',
          content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.',
        },
        {
          term: 'Modifications',
          content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of modified terms.',
        },
      ],
    },
    {
      icon: ShoppingCart,
      title: 'Orders & Purchases',
      items: [
        {
          term: 'Order Acceptance',
          content: 'All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including errors in product or pricing information.',
        },
        {
          term: 'Pricing',
          content: 'All prices are in Sri Lankan Rupees (LKR) and are subject to change without notice. Prices do not include delivery charges unless otherwise stated.',
        },
        {
          term: 'Product Availability',
          content: 'Product availability is subject to change. In case of unavailability after order placement, we will notify you and offer alternatives or a full refund.',
        },
        {
          term: 'Order Cancellation',
          content: 'You may cancel your order before it is dispatched. Once dispatched, cancellation requests will be treated as return requests subject to our return policy.',
        },
      ],
    },
    {
      icon: CreditCard,
      title: 'Payment Terms',
      items: [
        {
          term: 'Payment Methods',
          content: 'We accept Cash on Delivery (COD), bank transfers, and online payments. All online payments are processed through secure, encrypted payment gateways.',
        },
        {
          term: 'COD Policy',
          content: 'COD is available for orders up to Rs. 50,000. A COD fee of Rs. 50 applies. Please have the exact amount ready as our delivery partners may not carry change.',
        },
        {
          term: 'Failed Payments',
          content: 'If a payment fails or is declined, your order will not be processed. You may retry with a different payment method or contact our support team.',
        },
        {
          term: 'Refunds',
          content: 'Refunds for eligible returns will be processed within 5-7 business days to the original payment method. COD refunds will be via bank transfer.',
        },
      ],
    },
    {
      icon: Truck,
      title: 'Delivery Terms',
      items: [
        {
          term: 'Delivery Timeframes',
          content: 'Estimated delivery times are 1-4 business days depending on your location. These are estimates and not guaranteed delivery dates.',
        },
        {
          term: 'Delivery Attempts',
          content: 'Our courier partners will attempt delivery 2-3 times. Failed deliveries due to customer unavailability may result in return shipping and additional charges.',
        },
        {
          term: 'Risk of Loss',
          content: 'Risk of loss and title for items purchased pass to you upon delivery. Please inspect packages upon receipt and report any damage immediately.',
        },
        {
          term: 'Delivery Restrictions',
          content: 'We deliver island-wide to all 25 districts. P.O. Box addresses are not accepted. Some remote areas may have extended delivery times.',
        },
      ],
    },
    {
      icon: Scale,
      title: 'Intellectual Property',
      items: [
        {
          term: 'Ownership',
          content: 'All content on this website, including text, graphics, logos, images, and software, is the property of SellMate360 or its content suppliers and protected by intellectual property laws.',
        },
        {
          term: 'Limited License',
          content: 'You are granted a limited, non-exclusive license to access and use the website for personal, non-commercial purposes. This license does not include resale or commercial use.',
        },
        {
          term: 'Prohibited Uses',
          content: 'You may not reproduce, duplicate, copy, sell, or exploit any portion of the website without express written permission from SellMate360.',
        },
      ],
    },
    {
      icon: AlertTriangle,
      title: 'Limitations & Liability',
      items: [
        {
          term: 'Disclaimer of Warranties',
          content: 'Products are provided "as is" without any warranties, express or implied. We do not warrant that products will meet your expectations or be error-free.',
        },
        {
          term: 'Limitation of Liability',
          content: 'SellMate360 shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services or products.',
        },
        {
          term: 'Maximum Liability',
          content: 'Our maximum liability shall be limited to the amount paid by you for the product or service giving rise to the claim.',
        },
        {
          term: 'Force Majeure',
          content: 'We shall not be liable for delays or failures in performance resulting from circumstances beyond our reasonable control, including natural disasters, strikes, or government actions.',
        },
      ],
    },
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
            <FileText className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
            <p className="text-lg opacity-90">
              Please read these terms carefully before using our services.
            </p>
            <p className="text-sm mt-4 opacity-75">Last updated: January 2026</p>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground">
              Welcome to SellMate360. These Terms and Conditions govern your use of our website and 
              the purchase of products from our platform. By accessing this website or placing an order, 
              you agree to be bound by these terms.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {termsCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.items.map((item, itemIndex) => (
                        <AccordionItem key={itemIndex} value={`${category.title}-${itemIndex}`}>
                          <AccordionTrigger className="text-left font-medium">
                            {item.term}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.content}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Dispute Resolution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    Dispute Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Any disputes arising from these terms or your use of our services shall be resolved as follows:
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">1. Informal Resolution</h4>
                      <p className="text-sm text-muted-foreground">
                        We encourage you to contact our customer service team first to resolve any issues amicably.
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold">2. Mediation</h4>
                      <p className="text-sm text-muted-foreground">
                        If informal resolution fails, disputes may be submitted to mediation under the rules of the Sri Lanka Mediation Boards.
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold">3. Governing Law</h4>
                      <p className="text-sm text-muted-foreground">
                        These terms shall be governed by and construed in accordance with the laws of Sri Lanka. 
                        Any legal proceedings shall be conducted in the courts of Colombo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-primary/5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3">Questions About These Terms?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about our Terms and Conditions, please contact us:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> legal@sellmate360.lk</p>
                    <p><strong>Phone:</strong> +94 11 234 5678</p>
                    <p><strong>Address:</strong> 123 Commerce Street, Colombo 03, Sri Lanka</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsConditions;
