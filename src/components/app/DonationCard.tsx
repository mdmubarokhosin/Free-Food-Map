'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Bengali number converter
function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

export interface DonationTier {
  id: string;
  name: string;
  nameEn: string;
  minAmount: number;
  maxAmount: number;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
}

export const DONATION_TIERS: DonationTier[] = [
  {
    id: 'basic',
    name: 'সাধারণ',
    nameEn: 'Basic Supporter',
    minAmount: 100,
    maxAmount: 499,
    description: 'প্রাথমিক সমর্থক হিসেবে অবদান রাখুন',
    benefits: ['ধন্যবাদ ইমেইল', 'ডোনার ওয়ালে নাম প্রদর্শন'],
    icon: <i className="bi bi-heart text-lg"></i>,
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  {
    id: 'helper',
    name: 'সহায়ক',
    nameEn: 'Helper',
    minAmount: 500,
    maxAmount: 1999,
    description: 'সহায়ক ব্যাজ সহ আরও বেশি সাহায্য করুন',
    benefits: ['সহায়ক ব্যাজ', 'ডোনার ওয়ালে নাম প্রদর্শন', 'মাসিক আপডেট নিউজলেটার'],
    icon: <i className="bi bi-gift text-lg"></i>,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'sponsor',
    name: 'পৃষ্ঠপোষক',
    nameEn: 'Sponsor',
    minAmount: 2000,
    maxAmount: 4999,
    description: 'পৃষ্ঠপোষক ব্যাজ ও বিশেষ স্বীকৃতি',
    benefits: ['পৃষ্ঠপোষক ব্যাজ', 'হোমপেজে নাম প্রদর্শন', 'বিশেষ স্বীকৃতি', 'প্রায়োরিটি সাপোর্ট'],
    icon: <i className="bi bi-star-fill text-lg"></i>,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    popular: true,
  },
  {
    id: 'major',
    name: 'দাতা',
    nameEn: 'Major Donor',
    minAmount: 5000,
    maxAmount: 999999,
    description: 'প্রধান দাতা হিসেবে বিশেষ সম্মাননা',
    benefits: ['দাতা ব্যাজ', 'হোমপেজে বিশেষ স্থান', 'বার্ষিক রিপোর্ট', 'সরাসরি যোগাযোগ', 'বিশেষ ইভেন্ট আমন্ত্রণ'],
    icon: <i className="bi bi-building text-lg"></i>,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
];

interface DonationCardProps {
  tier: DonationTier;
  onSelect: (tier: DonationTier) => void;
}

export default function DonationCard({ tier, onSelect }: DonationCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: tier.minAmount.toString(),
    message: '',
    anonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseInt(formData.amount);
    if (amount < tier.minAmount || amount > tier.maxAmount) {
      toast.error(`দানের পরিমাণ ৳${toBengaliNumber(tier.minAmount)} থেকে ৳${toBengaliNumber(tier.maxAmount)} এর মধ্যে হতে হবে`);
      return;
    }

    if (!formData.email) {
      toast.error('ইমেইল প্রয়োজন');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.anonymous ? 'বেনামী দাতা' : formData.name,
          email: formData.email,
          amount: amount,
          type: 'donation',
          tier: tier.id,
          message: formData.message,
          anonymous: formData.anonymous,
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        toast.success('পেমেন্ট পেজে রিডাইরেক্ট হচ্ছে...');
        // Redirect to Bohudur payment page
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.error || 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('পেমেন্ট তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      amount: tier.minAmount.toString(),
      message: '',
      anonymous: false,
    });
  };

  return (
    <Card
      className={`relative transition-all duration-300 hover:shadow-lg ${
        tier.popular ? 'ring-2 ring-purple-500 dark:ring-purple-400 sm:scale-105' : ''
      } ${tier.bgColor} ${tier.borderColor} border`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-purple-500 text-white text-xs px-3 py-1">
            জনপ্রিয়
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div className={`mx-auto mb-2 p-3 rounded-full ${tier.bgColor} ${tier.color}`}>
          {tier.icon}
        </div>
        <CardTitle className={`text-xl ${tier.color}`}>{tier.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {tier.nameEn}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div>
          <span className="text-3xl font-bold text-foreground">
            ৳{toBengaliNumber(tier.minAmount)}
          </span>
          {tier.maxAmount < 100000 && (
            <span className="text-lg text-muted-foreground">
              {' '}- ৳{toBengaliNumber(tier.maxAmount)}
            </span>
          )}
          {tier.maxAmount >= 100000 && (
            <span className="text-lg text-muted-foreground">+</span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{tier.description}</p>

        <ul className="space-y-2 text-left">
          {tier.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <i className={`bi bi-check-lg text-sm ${tier.color} shrink-0`}></i>
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2">
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              className={`w-full ${
                tier.popular
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-foreground/90 hover:bg-foreground text-background'
              }`}
              onClick={() => onSelect(tier)}
            >
              <i className="bi bi-heart text-sm mr-2"></i>
              দান করুন
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <i className="bi bi-wallet2 text-green-600 text-base"></i>
                {tier.name} - দান করুন
              </DialogTitle>
              <DialogDescription className="text-center">
                বহুদূর পেমেন্ট গেটওয়ে দিয়ে সহজেই দান করুন
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">দানের পরিমাণ (৳)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  min={tier.minAmount}
                  max={tier.maxAmount}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  সর্বনিম্ন: ৳{toBengaliNumber(tier.minAmount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">আপনার নাম</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="আপনার নাম লিখুন"
                  disabled={formData.anonymous}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">বার্তা (ঐচ্ছিক)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="আপনার বার্তা লিখুন..."
                  rows={2}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.anonymous}
                  onCheckedChange={(checked) => setFormData({ ...formData, anonymous: !!checked })}
                />
                <span className="text-sm">বেনামে দান করতে চাই</span>
              </label>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                  <i className="bi bi-wallet2 text-sm"></i>
                  <span className="text-sm font-medium">নিরাপদ পেমেন্ট</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-500">
                  bKash, Nagad, Rocket, ক্রেডিট/ডেবিট কার্ড সহ ২০+ পেমেন্ট মেথড
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="bi bi-arrow-repeat text-sm mr-2 animate-spin"></i>
                    প্রসেসিং...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-up-right text-sm mr-2"></i>
                    পেমেন্ট করুন
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                পেমেন্ট সম্পন্ন হলে আপনাকে স্বয়ংক্রিয়ভাবে রিডাইরেক্ট করা হবে
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
