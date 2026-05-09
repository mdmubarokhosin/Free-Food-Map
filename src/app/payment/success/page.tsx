'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { queryBohudurPayment, executeBohudurPayment } from '@/lib/bohudur-payment';
import { addDonation } from '@/lib/firebase-service';
import type { Donation } from '@/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentkey = searchParams.get('paymentkey') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentInfo, setPaymentInfo] = useState<{ name: string; amount: number; email: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!paymentkey) {
      setStatus('error');
      setErrorMessage('পেমেন্ট কী পাওয়া যায়নি');
      return;
    }

    const processPayment = async () => {
      try {
        // Step 1: Query payment status
        const queryResult = await queryBohudurPayment(paymentkey);
        
        setPaymentInfo({
          name: queryResult.full_name || 'দাতা',
          amount: queryResult.amount || 0,
          email: queryResult.email || '',
        });

        if (queryResult.status === 'EXECUTED') {
          // Already executed
          setStatus('success');
          return;
        }

        if (queryResult.status === 'COMPLETED') {
          // Need to execute
          const execResult = await executeBohudurPayment(paymentkey);
          
          // Save donation to Firebase
          if (execResult.amount) {
            await addDonation({
              donorName: execResult.full_name || queryResult.full_name || 'বেনামী দাতা',
              donorPhone: '',
              amount: execResult.amount,
              currency: 'BDT',
              method: 'bohudur',
              status: 'confirmed',
              transactionId: paymentkey,
              message: 'Bohudur পেমেন্ট',
            });
          }
          
          setStatus('success');
          return;
        }

        if (queryResult.status === 'PENDING') {
          setStatus('error');
          setErrorMessage('পেমেন্ট এখনো সম্পন্ন হয়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।');
          return;
        }

        if (queryResult.status === 'CANCELLED') {
          setStatus('error');
          setErrorMessage('পেমেন্ট বাতিল করা হয়েছে।');
          return;
        }

        setStatus('success');
      } catch (err) {
        console.error('Payment processing error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'পেমেন্ট প্রক্রিয়াকরণে সমস্যা হয়েছে।');
      }
    };

    processPayment();
  }, [paymentkey]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">পেমেন্ট যাচাই হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <i className="bi bi-exclamation-triangle text-4xl text-amber-600"></i>
            </div>
            <CardTitle className="text-xl text-gray-900">পেমেন্ট যাচাই</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentkey && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">পেমেন্ট কী</p>
                <p className="text-xs font-mono truncate">{paymentkey}</p>
              </div>
            )}
            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-fade-in">
            <i className="bi bi-check-circle text-4xl text-green-600"></i>
          </div>
          <CardTitle className="text-2xl text-green-600">পেমেন্ট সফল! 🎉</CardTitle>
          <CardDescription>
            আপনার দান সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentInfo && (
            <div className="bg-green-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">দাতার নাম</span>
                <span className="font-semibold text-gray-900">{paymentInfo.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">পরিমাণ</span>
                <span className="font-bold text-green-600">৳{paymentInfo.amount.toLocaleString("bn-BD")}</span>
              </div>
              {paymentInfo.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ইমেইল</span>
                  <span className="text-gray-700">{paymentInfo.email}</span>
                </div>
              )}
            </div>
          )}
          
          {paymentkey && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">পেমেন্ট কী</p>
              <p className="text-xs font-mono truncate">{paymentkey}</p>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-xs text-gray-400">আপনার অনুদান দরিদ্রদের খাবার বিতরণে ব্যবহৃত হবে</p>
          </div>
          
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
