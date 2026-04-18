import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { usePublicCompany } from '@/hooks/usePublicStoreSettings';

export default function WhatsAppButton() {
  const { company } = usePublicCompany();
  const phoneNumber = company?.whatsapp || company?.phone || '+94771234567';
  const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
  const message = encodeURIComponent('Hi! I have a question about your products.');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#20bd5a] transition-colors"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <MessageCircle className="h-6 w-6 fill-current" />
      <span className="hidden sm:inline font-medium">Chat with us</span>
    </motion.a>
  );
}
