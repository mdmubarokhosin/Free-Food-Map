'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';

interface ReportModalProps {
  spotId: string;
  spotName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REPORT_TYPES = [
  { value: 'wrong_info', label: 'ভুল তথ্য' },
  { value: 'spot_closed', label: 'স্পট বন্ধ হয়ে গেছে' },
  { value: 'spam_fraud', label: 'স্প্যাম/প্রতারণা' },
  { value: 'inappropriate', label: 'অশ্লীল বিষয়বস্তু' },
  { value: 'other', label: 'অন্যান্য' },
] as const;

type ReportType = typeof REPORT_TYPES[number]['value'];

export default function ReportModal({
  spotId,
  spotName,
  open,
  onOpenChange,
}: ReportModalProps) {
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportType) {
      toast({
        title: 'রিপোর্ট টাইপ নির্বাচন করুন',
        description: 'অনুগ্রহ করে একটি রিপোর্ট টাইপ নির্বাচন করুন',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId,
          spotName,
          reportType,
          details: details.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast({
          title: 'রিপোর্ট করতে সমস্যা হয়েছে',
          description: data.error || 'আবার চেষ্টা করুন',
          variant: 'destructive',
        });
        return;
      }

      // Show success toast
      toast({
        title: 'রিপোর্ট সফল হয়েছে',
        description: 'আপনার রিপোর্ট আমাদের কাছে পৌঁছে গেছে। ধন্যবাদ!',
      });

      // Reset form and close modal
      setReportType('');
      setDetails('');
      onOpenChange(false);
    } catch {
      toast({
        title: 'রিপোর্ট করতে সমস্যা হয়েছে',
        description: 'আবার চেষ্টা করুন',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReportType('');
    setDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <i className="bi bi-exclamation-triangle text-amber-500 text-lg"></i>
            সমস্যা রিপোর্ট করুন
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            <span className="font-medium text-foreground">{spotName}</span> স্পটটির জন্য সমস্যা রিপোর্ট করুন
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">রিপোর্টের ধরন *</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
              className="space-y-2"
            >
              {REPORT_TYPES.map((type) => (
                <div
                  key={type.value}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setReportType(type.value)}
                >
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label
                    htmlFor={type.value}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm font-medium">
              বিস্তারিত বর্ণনা
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="সমস্যার বিস্তারিত লিখুন (ঐচ্ছিক)..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              আপনার প্রদত্ত তথ্য আমাদের এই সমস্যা তদন্তে সাহায্য করবে
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              disabled={loading || !reportType}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading && <i className="bi bi-arrow-repeat mr-2 text-sm animate-spin"></i>}
              রিপোর্ট করুন
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
