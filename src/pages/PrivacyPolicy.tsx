import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Bell, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - SellMate360 | Your Data, Protected';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read SellMate360\'s privacy policy. Learn how we collect, use, and protect your personal information when you shop with us.');
    }
  }, []);

  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          text: 'When you create an account, place an order, or contact us, we collect information such as your name, email address, phone number, shipping address, and payment details.',
        },
        {
          subtitle: 'Automatically Collected Information',
          text: 'We automatically collect certain information when you visit our website, including your IP address, browser type, device information, and browsing behavior through cookies and similar technologies.',
        },
        {
          subtitle: 'Transaction Information',
          text: 'We keep records of your purchases, order history, payment methods, and delivery preferences to improve your shopping experience.',
        },
      ],
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: [
        {
          subtitle: 'Order Processing',
          text: 'To process and fulfill your orders, send order confirmations, and provide delivery updates via SMS and email.',
        },
        {
          subtitle: 'Customer Service',
          text: 'To respond to your inquiries, handle complaints, and provide technical support.',
        },
        {
          subtitle: 'Marketing Communications',
          text: 'With your consent, we may send promotional emails, SMS, and notifications about new products, special offers, and exclusive deals.',
        },
        {
          subtitle: 'Service Improvement',
          text: 'To analyze usage patterns, improve our website and services, and develop new features based on customer needs.',
        },
      ],
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: [
        {
          subtitle: 'Encryption',
          text: 'All sensitive data, including payment information, is encrypted using industry-standard SSL/TLS encryption during transmission.',
        },
        {
          subtitle: 'Access Controls',
          text: 'We implement strict access controls to ensure only authorized personnel can access your personal information, and only when necessary.',
        },
        {
          subtitle: 'Regular Audits',
          text: 'We conduct regular security audits and updates to protect against unauthorized access, data breaches, and other security threats.',
        },
      ],
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: [
        {
          subtitle: 'Access & Correction',
          text: 'You have the right to access your personal information and request corrections to any inaccurate data.',
        },
        {
          subtitle: 'Data Deletion',
          text: 'You can request deletion of your personal data, subject to legal retention requirements and legitimate business interests.',
        },
        {
          subtitle: 'Opt-Out',
          text: 'You can opt out of marketing communications at any time by clicking the unsubscribe link or contacting our support team.',
        },
        {
          subtitle: 'Data Portability',
          text: 'Upon request, we can provide your personal data in a structured, commonly used format for transfer to another service.',
        },
      ],
    },
    {
      icon: Bell,
      title: 'Cookies & Tracking',
      content: [
        {
          subtitle: 'Essential Cookies',
          text: 'Required for basic website functionality, such as maintaining your shopping cart and login session.',
        },
        {
          subtitle: 'Analytics Cookies',
          text: 'Help us understand how visitors interact with our website to improve user experience and performance.',
        },
        {
          subtitle: 'Marketing Cookies',
          text: 'Used to deliver personalized advertisements and track the effectiveness of our marketing campaigns.',
        },
        {
          subtitle: 'Cookie Management',
          text: 'You can manage your cookie preferences through your browser settings or our cookie consent banner.',
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
            <Shield className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg opacity-90">
              Your privacy matters to us. Learn how we collect, use, and protect your personal information.
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
              SellMate360 ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you visit our website or make a purchase. Please read this policy carefully.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.content.map((item, itemIndex) => (
                      <div key={item.subtitle}>
                        <h3 className="font-semibold mb-1">{item.subtitle}</h3>
                        <p className="text-muted-foreground text-sm">{item.text}</p>
                        {itemIndex < section.content.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Third-Party Sharing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Third-Party Sharing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    We may share your information with trusted third parties in the following circumstances:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong>Delivery Partners:</strong> To fulfill and deliver your orders</li>
                    <li>• <strong>Payment Processors:</strong> To process your transactions securely</li>
                    <li>• <strong>Analytics Providers:</strong> To help us understand and improve our services</li>
                    <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  </ul>
                  <p className="text-muted-foreground">
                    We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
                  </p>
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
                  <h3 className="font-semibold text-lg mb-3">Questions About This Policy?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions or concerns about our privacy practices, please contact us:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> privacy@sellmate360.lk</p>
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

export default PrivacyPolicy;
