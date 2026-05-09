// GitHub Contents API — upload images to repo
// Reads token/owner/repo from Firebase settings

import { database } from './firebase';
import { ref, get } from 'firebase/database';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  token: '',
  owner: 'mdmubarokhosin',
  repo: 'Free-Food-Map',
};

async function getGitHubConfig(): Promise<GitHubConfig> {
  try {
    const settingsRef = ref(database, 'settings/github');
    const snapshot = await get(settingsRef);
    if (!snapshot.exists()) return DEFAULT_GITHUB_CONFIG;
    const data = snapshot.val();
    return {
      token: data.token || DEFAULT_GITHUB_CONFIG.token,
      owner: data.owner || DEFAULT_GITHUB_CONFIG.owner,
      repo: data.repo || DEFAULT_GITHUB_CONFIG.repo,
    };
  } catch {
    return DEFAULT_GITHUB_CONFIG;
  }
}

/**
 * Upload an image file to GitHub repo via Contents API.
 * Returns the raw.githubusercontent.com URL on success.
 */
export async function uploadImageToGitHub(file: File): Promise<string> {
  const config = await getGitHubConfig();

  if (!config.token) {
    throw new Error('GitHub Personal Access Token সেট করা হয়নি। অ্যাডমিন প্যানেল > সেটিংস থেকে কনফিগার করুন।');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `spot_${timestamp}_${randomStr}.${ext}`;
  const path = `images/spots/${filename}`;

  // Convert file to base64
  const base64 = await fileToBase64(file);

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      message: `Upload spot image: ${filename}`,
      content: base64,
      branch: 'main',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as Record<string, unknown>)?.message || response.statusText;
    throw new Error(`GitHub আপলোড ব্যর্থ: ${message}`);
  }

  const rawData = await response.json();
  const downloadUrl = (rawData as Record<string, unknown>).content?.download_url as string;
  // Prefer raw URL
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/main/${path}`;
}

/**
 * Convert a File to base64 string (without data:xxx;base64, prefix)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix
      const base64 = result.split(',')[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error('ফাইল base64 রূপান্তর ব্যর্থ'));
      }
    };
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে'));
    reader.readAsDataURL(file);
  });
}
