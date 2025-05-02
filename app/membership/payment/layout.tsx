import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thanh toán Membership - PreziQ',
  description: 'Thanh toán và kích hoạt gói Membership của bạn trên PreziQ',
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='min-h-screen bg-background'>{children}</div>;
}
