import { forwardRef } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { RTInfo } from '@/hooks/useSettings';
import { CheckCircle2, ShieldCheck, MapPin, Phone, Calendar as CalendarIcon, Hash, QrCode } from 'lucide-react';

interface PaymentReceiptProps {
  payment: {
    id: string;
    amount: number;
    months: string[];
    notes: string | null;
    created_at: string;
    residents?: {
      name: string;
      address: string;
      property_type: string;
    } | null;
  };
  rtInfo?: RTInfo;
}

const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ payment, rtInfo }, ref) => {
    const rtName = rtInfo?.name || 'RT 001 RW 002';
    const rtAddress = rtInfo?.address || 'Perumahan Griya Asri';
    const rtContact = rtInfo?.contact || '';

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const getPropertyTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        occupied: 'Berpenghuni',
        empty_house: 'Rumah Kosong',
        empty_land: 'Lahan Kosong',
      };
      return labels[type] || type;
    };

    const receiptNumber = `KWT-${format(new Date(payment.created_at), 'yyyyMMdd')}-${payment.id.slice(0, 6).toUpperCase()}`;

    return (
      <div
        ref={ref}
        className="bg-white text-slate-900 p-0 min-h-[500px] w-full max-w-2xl mx-auto shadow-2xl relative overflow-hidden font-sans border border-slate-200"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Decorative Top Bar */}
        <div className="h-2 bg-primary w-full" />

        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-primary">{rtName}</h1>
              </div>
              <div className="space-y-1 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{rtAddress}</span>
                </div>
                {rtContact && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{rtContact}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-success/10 text-success px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-2 border border-success/20">
                Lunas / Paid
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Diterbitkan pada {format(new Date(payment.created_at), 'HH:mm', { locale: id })} WIB
              </div>
            </div>
          </div>

          <div className="relative">
            {/* watermark stamp */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-12deg]">
              <CheckCircle2 className="w-[300px] h-[300px] text-primary" />
            </div>

            {/* Receipt Title & Number */}
            <div className="flex flex-col items-center mb-10 space-y-2">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Kwitansi Pembayaran</h2>
              <div className="h-1 w-12 bg-primary rounded-full" />
              <div className="flex items-center gap-4 text-sm mt-4 font-medium">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md text-slate-600">
                  <Hash className="h-3.5 w-3.5" />
                  <span>{receiptNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md text-slate-600">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>{format(new Date(payment.created_at), 'd MMMM yyyy', { locale: id })}</span>
                </div>
              </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Informasi Warga</h3>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Nama Lengkap</p>
                    <p className="text-base font-bold text-slate-800">{payment.residents?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Alamat Unit</p>
                    <p className="text-sm font-medium text-slate-700 leading-snug">{payment.residents?.address || '-'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                      {getPropertyTypeLabel(payment.residents?.property_type || 'occupied')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Rincian Pembayaran</h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Keterangan</p>
                        <p className="text-sm font-bold text-slate-800">Iuran Bulanan</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Bulan: <span className="text-primary font-semibold">{payment.months.join(', ')}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm min-w-[60px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Qty</p>
                        <p className="text-sm font-black text-primary">{payment.months.length}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Bln</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Nominal</p>
                      <p className="text-2xl font-black text-primary">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
              </div>
            </div>

            {/* Notes Section */}
            {payment.notes && (
              <div className="mb-10">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Catatan Tambahan</h3>
                <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-primary italic text-sm text-slate-600">
                  "{payment.notes}"
                </div>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
              <div className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed">
                <p>Kwitansi ini dihasilkan secara sistem dan merupakan bukti pembayaran yang sah.</p>
                <p className="mt-1">ID Transaksi: {payment.id}</p>
              </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white p-1.5 rounded-xl border-2 border-slate-100 mb-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative group">
                      <div className="w-20 h-20 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                        {/* Mock QR Code Pattern */}
                        <div className="grid grid-cols-5 gap-0.5 w-[85%] h-[85%]">
                          {[...Array(25)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`${(i % 3 === 0 || i % 7 === 0 || [0,1,2,5,10,20,21,22,24].includes(i)) ? 'bg-white' : 'bg-transparent'} rounded-[1px]`} 
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white p-1 rounded-sm shadow-sm">
                            <QrCode className="w-6 h-6 text-slate-900" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1">
                        <div className="bg-success text-white p-0.5 rounded-full shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Digital Signature</p>
                    <p className="text-xs font-bold text-slate-800">{rtName}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-mono opacity-60">VERIFIED-ID:{payment.id.slice(0,8)}</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
        
        {/* Bottom pattern */}
        <div className="h-1.5 bg-primary/10 w-full flex">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`h-full flex-1 ${i % 2 === 0 ? 'bg-primary' : 'bg-transparent'}`} />
          ))}
        </div>
      </div>
    );
  }
);

PaymentReceipt.displayName = 'PaymentReceipt';

export { PaymentReceipt };

