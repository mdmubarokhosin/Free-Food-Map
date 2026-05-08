'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserLocation, NearbyPlace } from '@/types';

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'লোকেশন পেতে সমস্যা হয়েছে';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'লোকেশন পারমিশন দেওয়া হয়নি';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'লোকেশন তথ্য পাওয়া যায়নি';
            break;
          case err.TIMEOUT:
            errorMessage = 'লোকেশন রিকোয়েস্ট টাইমআউট হয়েছে';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  // Auto-get location on mount
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return { location, loading, error, getLocation };
}

// Fetch nearby places using Nominatim (OpenStreetMap)
export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 1000
): Promise<NearbyPlace[]> {
  try {
    // Use Nominatim reverse geocoding for address
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'bn,en',
        },
      }
    );

    const data = await response.json();
    const places: NearbyPlace[] = [];

    if (data && data.address) {
      const address = data.address;
      const displayName = data.display_name || '';

      // Extract relevant place names
      if (address.restaurant || address.amenity) {
        places.push({
          name: address.restaurant || address.amenity || 'অজানা স্থান',
          address: displayName,
          lat: lat,
          lng: lng,
          distance: 0,
          types: [address.amenity?.toLowerCase() || 'place'],
        });
      }

      // Add area/neighborhood
      if (address.neighbourhood || address.suburb || address.quarter) {
        places.push({
          name: address.neighbourhood || address.suburb || address.quarter || '',
          address: displayName,
          lat: lat,
          lng: lng,
          distance: 0,
          types: ['neighbourhood'],
        });
      }

      // Add road/street
      if (address.road) {
        places.push({
          name: address.road,
          address: displayName,
          lat: lat,
          lng: lng,
          distance: 0,
          types: ['road'],
        });
      }
    }

    // Search for nearby amenities using Overpass API
    try {
      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["amenity"~"restaurant|food_bank|soup_kitchen|place_of_worship|community_centre"](around:${radius},${lat},${lng});
          node["shop"~"supermarket|convenience|grocery"](around:${radius},${lat},${lng});
        );
        out body 20;
      `;

      const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      const overpassData = await overpassResponse.json();

      if (overpassData.elements) {
        overpassData.elements.forEach((element: { lat: number; lon: number; tags?: Record<string, string> }) => {
          if (element.tags?.name) {
            const distance = calculateDistance(lat, lng, element.lat, element.lon);
            places.push({
              name: element.tags.name,
              address: element.tags['addr:street'] || element.tags.name,
              lat: element.lat,
              lng: element.lon,
              distance: Math.round(distance * 1000), // in meters
              types: element.tags.amenity ? [element.tags.amenity] : ['place'],
            });
          }
        });
      }
    } catch {
      // Overpass API failed, continue with basic results
    }

    // Sort by distance
    return places.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return [];
  }
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} মিটার`;
  }
  return `${km.toFixed(1)} কিমি`;
}

// Get Google Maps directions URL
export function getGoogleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  originLat?: number,
  originLng?: number
): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  if (originLat !== undefined && originLng !== undefined) {
    return `${baseUrl}${originLat},${originLng}/${destLat},${destLng}`;
  }
  return `${baseUrl}//${destLat},${destLng}`;
}

// Get Google Maps place URL
export function getGoogleMapsPlaceUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
