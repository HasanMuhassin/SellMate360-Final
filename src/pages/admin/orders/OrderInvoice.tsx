import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { useAdminOrder } from '@/hooks/useAdminOrders';
import { Loader2 } from 'lucide-react';

const formatCurrency = (amount: any) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(num);
};

export default function OrderInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useAdminOrder(id || '');
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!invoiceRef.current || !order) return;
    const element = invoiceRef.current;
    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: `Invoice_${order.order_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <Button onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const itemsTotal = order.items?.reduce((sum, item) => {
    const price = Number(item.unit_price) || 0;
    const quantity = Number(item.quantity) || 0;
    const itemTotal = Number(item.total_price) || (price * quantity);
    return sum + itemTotal;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
      {/* Controls - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center px-4 print:hidden">
        <Button variant="ghost" onClick={() => navigate(`/admin/orders/${order.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Order
        </Button>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Container - Styled to look like an A4 page */}
      <div 
        ref={invoiceRef}
        className="max-w-[210mm] mx-auto bg-white p-[20mm] shadow-lg print:shadow-none print:m-0 print:p-0"
        style={{ minHeight: '297mm' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SellMate360</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Your trusted partner in e-commerce
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-200 uppercase tracking-widest mb-2">Invoice</h2>
            <p className="text-gray-900 font-semibold text-lg">{order.order_number}</p>
            <p className="text-gray-500 text-sm mt-1">
              Date: {format(new Date(order.created_at), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="flex justify-between mb-12">
          <div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Billed To</h3>
            <p className="text-gray-900 font-medium">{order.shipping_name}</p>
            {order.shipping_email && <p className="text-gray-600 text-sm mt-1">{order.shipping_email}</p>}
            <p className="text-gray-600 text-sm mt-1">{order.shipping_phone}</p>
          </div>
          <div className="text-right">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Shipped To</h3>
            <p className="text-gray-600 text-sm max-w-[200px] ml-auto">
              {order.shipping_street},<br />
              {order.shipping_city},<br />
              {order.shipping_district}
            </p>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 text-gray-500 text-sm font-semibold uppercase tracking-wider w-1/2">Item</th>
                <th className="py-3 text-gray-500 text-sm font-semibold uppercase tracking-wider text-center w-1/6">Qty</th>
                <th className="py-3 text-gray-500 text-sm font-semibold uppercase tracking-wider text-right w-1/6">Price</th>
                <th className="py-3 text-gray-500 text-sm font-semibold uppercase tracking-wider text-right w-1/6">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item, index) => {
                const price = Number(item.unit_price) || 0;
                const quantity = Number(item.quantity) || 0;
                const itemTotal = Number(item.total_price) || (price * quantity);

                return (
                <tr key={item.id || index}>
                  <td className="py-4 text-gray-900 font-medium">{item.product_name}</td>
                  <td className="py-4 text-gray-600 text-center">{quantity}</td>
                  <td className="py-4 text-gray-600 text-right">{formatCurrency(price)}</td>
                  <td className="py-4 text-gray-900 text-right font-medium">{formatCurrency(itemTotal)}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Total Calculation */}
        <div className="flex justify-end mb-12">
          <div className="w-1/2 max-w-xs">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 font-medium">{formatCurrency(itemsTotal)}</span>
            </div>
            {/* If there's shipping/tax difference, display it here, assuming total is different */}
            {order.total !== itemsTotal && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Shipping/Fees</span>
                <span className="text-gray-900 font-medium">{formatCurrency(order.total - itemsTotal)}</span>
              </div>
            )}
            <div className="flex justify-between py-4">
              <span className="text-gray-900 font-bold text-lg">Total Amount</span>
              <span className="text-primary font-bold text-lg">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 text-center text-gray-500 text-sm">
          <p className="font-medium text-gray-700 mb-1">Thank you for your business!</p>
          <p>If you have any questions about this invoice, please contact support at support@sellmate360.lk</p>
        </div>
      </div>
    </div>
  );
}
