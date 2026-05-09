'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const paymentkey = searchParams.get('paymentkey');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <i className="bi bi-x-circle text-4xl text-red-600"></i>
          </div>
          <CardTitle className="text-2xl text-red-600">পেমেন্ট বাতিল</CardTitle>
          <CardDescription>
            আপনার পেমেন্ট বাতিল করা হয়েছে। কোনো টাকা কাটা হয়নি।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentkey && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">পেমেন্ট কী</p>
              <p className="text-sm font-mono truncate">{paymentkey}</p>
            </div>
          )}
          
          <p className="text-center text-sm text-gray-500">
            আপনি যেকোনো সময় আবার অনুদান করতে পারেন। আপনার সাহায্যে কারো অন্ন হতে পারে।
          </p>

          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link href="/donate">
              <i className="bi bi-arrow-clockwise text-base mr-2"></i>
              আবার চেষ্টা করুন
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <i className="bi bi-arrow-left text-base mr-2"></i>
              হোমপেজে ফিরে যান
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
