import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Clock, MapPin, Package, CreditCard, AlertCircle, CheckCircle, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { usePublicPaymentMethods, usePublicBranches } from '@/hooks/usePublicStoreSettings';

const DeliveryInfo = () => {
  const { methods: paymentMethods } = usePublicPaymentMethods();
  const { branches } = usePublicBranches();

  useEffect(() => {
    document.title = 'Delivery Information - SellMate360 | Island-wide Delivery';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about SellMate360\'s island-wide delivery service. We deliver to all 25 districts in Sri Lanka within 1-3 business days with COD and prepaid options.');
    }
  }, []);

  const deliveryZones = [
    { zone: 'Colombo & Suburbs', time: '1 Day', fee: 'Rs. 300' },
    { zone: 'Western Province', time: '1-2 Days', fee: 'Rs. 350' },
    { zone: 'Central, Southern, North Western', time: '2-3 Days', fee: 'Rs. 400' },
    { zone: 'Northern, Eastern, Uva, Sabaragamuwa', time: '2-4 Days', fee: 'Rs. 450' },
  ];

  const fallbackPaymentMethods = [
    { name: 'Cash on Delivery (COD)', instructions: 'Pay when you receive your order', processing_fee: 50, fee_type: 'fixed' },
    { name: 'Bank Deposit', instructions: 'Transfer to our bank account before dispatch', processing_fee: 0, fee_type: 'fixed' },
    { name: 'Online Payment', instructions: 'Pay via card or online banking', processing_fee: 0, fee_type: 'fixed' },
  ];

  const displayPaymentMethods = paymentMethods.length > 0
    ? paymentMethods.map(m => ({
        name: m.name,
        description: m.instructions || '',
        fee: m.processing_fee > 0
          ? m.fee_type === 'percentage' ? `+${m.processing_fee}%` : `+ Rs. ${m.processing_fee}`
          : 'Free',
      }))
    : fallbackPaymentMethods.map(m => ({
        name: m.name,
        description: m.instructions,
        fee: m.processing_fee > 0 ? `+ Rs. ${m.processing_fee}` : 'Free',
      }));

  const pickupBranches = branches.filter(b => b.is_pickup_location);

  const faqs = [
    {
      question: 'How do I track my order?',
      answer: 'Once your order is dispatched, you\'ll receive an SMS with the tracking number and courier details. You can also track your order on our website using your order number or phone number.',
    },
    {
      question: 'Can I change my delivery address after placing an order?',
      answer: 'Yes, you can change your delivery address before your order is dispatched. Contact our support team via WhatsApp or call us immediately after placing your order.',
    },
    {
      question: 'What if I\'m not available to receive my order?',
      answer: 'Our courier will attempt delivery 2-3 times. You can also request delivery to a neighbor or alternative address. For COD orders, someone must be available to make the payment.',
    },
    {
      question: 'Do you deliver to P.O. Box addresses?',
      answer: 'No, we only deliver to physical addresses where someone can receive the package and sign for delivery.',
    },
    {
      question: 'Is there a weight limit for orders?',
      answer: 'Standard delivery applies to orders up to 10kg. For heavier items or bulk orders, additional charges may apply. Contact us for special delivery arrangements.',
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
            <Truck className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Delivery Information</h1>
            <p className="text-lg opacity-90">
              Fast, reliable island-wide delivery to all 25 districts in Sri Lanka
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Island-wide', desc: 'All 25 districts' },
              { icon: Clock, title: '1-3 Days', desc: 'Fast delivery' },
              { icon: Package, title: 'Safe Packaging', desc: 'Secure handling' },
              { icon: CreditCard, title: 'COD Available', desc: 'Pay on delivery' },
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
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Delivery Zones */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Zones & Timeframes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deliveryZones.map((zone, index) => (
                      <div key={zone.zone}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{zone.zone}</h4>
                            <p className="text-sm text-muted-foreground">Estimated: {zone.time}</p>
                          </div>
                          <Badge variant="secondary">{zone.fee}</Badge>
                        </div>
                        {index < deliveryZones.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-success/10 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-success">Free Delivery</p>
                        <p className="text-sm text-muted-foreground">On all orders above Rs. 5,000</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayPaymentMethods.map((method, index) => (
                      <div key={method.name}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{method.name}</h4>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          <Badge variant={method.fee === 'Free' ? 'default' : 'outline'}>
                            {method.fee}
                          </Badge>
                        </div>
                        {index < displayPaymentMethods.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-warning/10 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">COD Note</p>
                        <p className="text-sm text-muted-foreground">
                          Please have the exact amount ready. Our delivery partners may not carry change.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Pickup Locations from Branches */}
          {pickupBranches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Pickup Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pickupBranches.map((branch) => (
                      <div key={branch.id} className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold">{branch.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{branch.address}</p>
                        <p className="text-sm text-muted-foreground">{branch.city}, {branch.district}</p>
                        {branch.phone && (
                          <p className="text-sm text-primary mt-2">{branch.phone}</p>
                        )}
                        {branch.accepts_returns && (
                          <Badge variant="secondary" className="mt-2 text-xs">Accepts Returns</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DeliveryInfo;
