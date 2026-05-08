'use client';


import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNotifications } from '@/hooks/use-notifications';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function NotificationButton({
  variant = 'ghost',
  size = 'icon',
  className,
}: NotificationButtonProps) {
  const {
    isSupported,
    isEnabled,
    permission,
    requestPermission,
    sendNotification,
    disableNotifications,
  } = useNotifications();

  const handleClick = async () => {
    if (!isSupported) {
      toast.error('সমর্থিত নয়', {
        description: 'আপনার ব্রাউজার নোটিফিকেশন সমর্থন করে না',
      });
      return;
    }

    if (isEnabled) {
      // Disable notifications
      disableNotifications();
      toast.info('নোটিফিকেশন বন্ধ', {
        description: 'আপনি আর নোটিফিকেশন পাবেন না',
      });
    } else {
      // Request permission and enable notifications
      const granted = await requestPermission();

      if (granted) {
        toast.success('নোটিফিকেশন সক্রিয়!', {
          description: 'আপনি এখন নতুন স্পট সম্পর্কে জানতে পারবেন',
        });

        // Send a test notification
        setTimeout(() => {
          sendNotification('নতুন স্পট যোগ হয়েছে', {
            body: 'আপনার এলাকায় একটি নতুন ফ্রি খাবারের স্পট যোগ হয়েছে!',
            tag: 'test-notification',
          });
        }, 1000);
      } else if (permission === 'denied') {
        toast.error('অনুমতি প্রত্যাখ্যাত', {
          description: 'ব্রাউজার সেটিংস থেকে নোটিফিকেশন অনুমতি দিন',
        });
      }
    }
  };

  // Determine button state
  const isDisabled = !isSupported;
  const showAsEnabled = isEnabled && permission === 'granted';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isDisabled}
            className={cn(
              'relative',
              showAsEnabled && 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400',
              className
            )}
            aria-label={showAsEnabled ? 'নোটিফিকেশন বন্ধ করুন' : 'নোটিফিকেশন চালু করুন'}
          >
            {showAsEnabled ? (
              <i className="bi bi-bell-fill text-base"></i>
            ) : (
              <i className="bi bi-bell-slash text-base"></i>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {!isSupported
              ? 'ব্রাউজার সমর্থিত নয়'
              : showAsEnabled
                ? 'নোটিফিকেশন বন্ধ করুন'
                : 'নোটিফিকেশন চালু করুন'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
