import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Award, Heart, Truck, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AboutUs = () => {
  useEffect(() => {
    document.title = 'About Us - SellMate360 | Your Trusted E-Commerce Partner';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about SellMate360 - Sri Lanka\'s leading e-commerce platform offering quality products with island-wide delivery and exceptional customer service.');
    }
  }, []);

  const values = [
    { icon: Heart, title: 'Customer First', description: 'We prioritize customer satisfaction in everything we do.' },
    { icon: Award, title: 'Quality Assured', description: 'Every product is carefully selected and quality checked.' },
    { icon: Truck, title: 'Fast Delivery', description: 'Island-wide delivery within 1-3 business days.' },
    { icon: Shield, title: 'Secure Shopping', description: 'Your data and transactions are always protected.' },
  ];

  const stats = [
    { value: '50,000+', label: 'Happy Customers' },
    { value: '10,000+', label: 'Products' },
    { value: '25', label: 'Districts Covered' },
    { value: '99%', label: 'Satisfaction Rate' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-6">About SellMate360</h1>
            <p className="text-lg md:text-xl opacity-90">
              Your trusted e-commerce partner, delivering quality products across Sri Lanka with exceptional service and care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in 2020, SellMate360 began with a simple mission: to make quality products accessible to everyone in Sri Lanka, regardless of their location.
                </p>
                <p>
                  What started as a small online store has grown into one of the country's most trusted e-commerce platforms, serving thousands of customers across all 25 districts.
                </p>
                <p>
                  We believe in the power of technology to transform lives, and we're committed to providing a seamless shopping experience that saves you time and money.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-muted rounded-2xl p-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                Our Mission
              </h2>
              <p className="text-muted-foreground mb-6">
                To revolutionize e-commerce in Sri Lanka by providing an unparalleled shopping experience with quality products, competitive prices, and exceptional customer service.
              </p>
              <h3 className="font-semibold text-lg mb-3">Our Vision</h3>
              <p className="text-muted-foreground">
                To become Sri Lanka's most loved and trusted online shopping destination, setting new standards for convenience, reliability, and customer satisfaction.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
