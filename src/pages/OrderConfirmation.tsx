import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, MessageCircle, Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();

  const whatsappMessage = encodeURIComponent(
    `Hi! I just placed an order. Order number: ${orderNumber}. I'd like to confirm my order details.`
  );
  const whatsappUrl = `https://wa.me/+94771234567?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16">
      <div className="container max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-success-foreground" />
          </motion.div>

          {/* Message */}
          <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Your order has been placed successfully
          </p>

          {/* Order Number */}
          <div className="bg-muted p-6 rounded-xl mb-8">
            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
            <p className="text-2xl font-bold text-primary">{orderNumber}</p>
          </div>

          {/* Delivery Timeline */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Estimated Delivery</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Your order will be delivered within 1-3 business days
            </p>
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center mx-auto mb-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-xs">Confirmed</span>
              </div>
              <div className="flex-1 flex items-center">
                <div className="h-0.5 w-full bg-muted mx-2"></div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-1">
                  2
                </div>
                <span className="text-xs">Packed</span>
              </div>
              <div className="flex-1 flex items-center">
                <div className="h-0.5 w-full bg-muted mx-2"></div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-1">
                  3
                </div>
                <span className="text-xs">Shipped</span>
              </div>
              <div className="flex-1 flex items-center">
                <div className="h-0.5 w-full bg-muted mx-2"></div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-1">
                  4
                </div>
                <span className="text-xs">Delivered</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              asChild
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a]"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Us on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/track-order">
                Track Your Order
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
