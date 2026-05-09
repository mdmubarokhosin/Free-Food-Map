// Bohudur Payment Gateway Service
// Reads API key from Firebase settings

import { database } from './firebase';
import { ref, get } from 'firebase/database';

const BOHUDUR_BASE_URL = 'https://request.bohudur.one';

interface BohudurCreatePaymentRequest {
  full_name: string;
  email: string;
  amount: number;
  return_type: 'GET';
  redirect_url: string;
  cancel_url: string;
  metadata: Record<string, string>;
  webhook: {
    success: string;
    cancel: string;
  };
}

interface BohudurCreatePaymentResponse {
  responseCode: number;
  paymentkey: string;
  payment_url: string;
  status: string;
}

interface BohudurQueryResponse {
  status: 'PENDING' | 'COMPLETED' | 'EXECUTED' | 'CANCELLED';
  paymentkey: string;
  full_name?: string;
  email?: string;
  amount?: number;
  created_at?: string;
  updated_at?: string;
}

async function getBohudurApiKey(): Promise<string> {
  try {
    const settingsRef = ref(database, 'settings/bohudur/apiKey');
    const snapshot = await get(settingsRef);
    if (!snapshot.exists()) return '';
    return snapshot.val() as string;
  } catch {
    return '';
  }
}

/**
 * Create a payment via Bohudur gateway.
 * Returns payment_url on success.
 */
export async function createBohudurPayment(data: {
  full_name: string;
  email: string;
  amount: number;
  message?: string;
}): Promise<{ payment_url: string; paymentkey: string }> {
  const apiKey = await getBohudurApiKey();

  if (!apiKey) {
    throw new Error('Bohudur API Key সেট করা হয়নি। অ্যাডমিন প্যানেল > সেটিংস থেকে কনফিগার করুন।');
  }

  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/payment/success?paymentkey=PAYMENTKEY_PLACEHOLDER`
    : '';
  const cancelUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/payment/cancel?paymentkey=PAYMENTKEY_PLACEHOLDER`
    : '';

  const requestBody: BohudurCreatePaymentRequest = {
    full_name: data.full_name,
    email: data.email,
    amount: data.amount,
    return_type: 'GET',
    redirect_url: redirectUrl,
    cancel_url: cancelUrl,
    metadata: {
      message: data.message || '',
      source: 'Free Food Map',
    },
    webhook: {
      success: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/bohudur/webhook`,
      cancel: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/bohudur/webhook`,
    },
  };

  const response = await fetch(`${BOHUDUR_BASE_URL}/create/v2/`, {
    method: 'POST',
    headers: {
      'AH-BOHUDUR-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`পেমেন্ট তৈরি ব্যর্থ: ${response.status} ${errorText}`);
  }

  const result = await response.json() as BohudurCreatePaymentResponse;

  if (result.responseCode !== 200 || !result.payment_url) {
    throw new Error(`পেমেন্ট তৈরি ব্যর্থ: ${result.status || 'অজানা ত্রুটি'}`);
  }

  return {
    payment_url: result.payment_url,
    paymentkey: result.paymentkey,
  };
}

/**
 * Execute / finalize a payment.
 */
export async function executeBohudurPayment(paymentkey: string): Promise<BohudurQueryResponse> {
  const apiKey = await getBohudurApiKey();
  if (!apiKey) throw new Error('Bohudur API Key সেট করা হয়নি');

  const response = await fetch(`${BOHUDUR_BASE_URL}/execute/v2/`, {
    method: 'POST',
    headers: {
      'AH-BOHUDUR-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentkey }),
  });

  if (!response.ok) {
    throw new Error(`পেমেন্ট এক্সিকিউট ব্যর্থ: ${response.status}`);
  }

  return response.json() as Promise<BohudurQueryResponse>;
}

/**
 * Query payment status.
 */
export async function queryBohudurPayment(paymentkey: string): Promise<BohudurQueryResponse> {
  const apiKey = await getBohudurApiKey();
  if (!apiKey) throw new Error('Bohudur API Key সেট করা হয়নি');

  const response = await fetch(`${BOHUDUR_BASE_URL}/query/v2/`, {
    method: 'POST',
    headers: {
      'AH-BOHUDUR-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentkey }),
  });

  if (!response.ok) {
    throw new Error(`পেমেন্ট কোয়েরি ব্যর্থ: ${response.status}`);
  }

  return response.json() as Promise<BohudurQueryResponse>;
}

/**
 * Test the Bohudur API connection.
 */
export async function testBohudurConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BOHUDUR_BASE_URL}/create/v2/`, {
      method: 'POST',
      headers: {
        'AH-BOHUDUR-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Test',
        email: 'test@test.com',
        amount: 1,
        return_type: 'GET',
        redirect_url: 'https://example.com',
        cancel_url: 'https://example.com',
        metadata: { test: 'true' },
        webhook: { success: 'https://example.com', cancel: 'https://example.com' },
      }),
    });

    if (response.ok) {
      return { success: true, message: 'কানেকশন সফল! API Key সঠিক আছে।' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const msg = (errorData as Record<string, unknown>)?.message || response.statusText;
      return { success: false, message: `কানেকশন ব্যর্থ: ${msg}` };
    }
  } catch (err) {
    return { success: false, message: `কানেকশন ত্রুটি: ${err instanceof Error ? err.message : 'অজানা'}` };
  }
}
