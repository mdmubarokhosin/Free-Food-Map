'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { ComprehensiveStatus, ServiceStatus as ServiceStatusType } from '@/types';
import { getSystemStatus } from '@/lib/services';
import Navbar from '@/components/app/Navbar';
import Footer from '@/components/app/Footer';
import AddSpotModal from '@/components/app/AddSpotModal';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

// Service icon mapping
const serviceIcons: Record<string, string> = {
  Database: 'bi bi-database',
  'API Server': 'bi bi-hdd-server',
  'Auth Service': 'bi bi-key',
  'Map Service': 'bi bi-globe',
  Storage: 'bi bi-hdd',
  CDN: 'bi bi-lightning-charge',
  Cache: 'bi bi-layers',
  'Background Jobs': 'bi bi-activity',
  Notifications: 'bi bi-bell',
};

// Bengali number converter
function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

// Format time ago in Bengali
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${toBengaliNumber(diffDays)} দিন ${toBengaliNumber(diffHours % 24)} ঘণ্টা আগে`;
  if (diffHours > 0) return `${toBengaliNumber(diffHours)} ঘণ্টা ${toBengaliNumber(diffMins % 60)} মিনিট আগে`;
  return `${toBengaliNumber(diffMins)} মিনিট আগে`;
}

// Format time only in Bengali
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${toBengaliNumber(displayHours)}:${toBengaliNumber(minutes.toString().padStart(2, '0'))} ${period}`;
}

// Format date short in Bengali
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${toBengaliNumber(day)}-${toBengaliNumber(month)}`;
}

// Service name translations
const serviceNameBn: Record<string, string> = {
  'Database': 'ডাটাবেস',
  'API Server': 'এপিআই সার্ভার',
  'Auth Service': 'অথ সার্ভিস',
  'Map Service': 'ম্যাপ সার্ভিস',
  'Storage': 'স্টোরেজ',
  'CDN': 'সিডিএন',
  'Cache': 'ক্যাশ',
  'Background Jobs': 'ব্যাকগ্রাউন্ড জব',
  'Notifications': 'নোটিফিকেশন',
};

export default function StatusPage() {
  const [status, setStatus] = useState<ComprehensiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getSystemStatus();
      if (data.success) {
        setStatus(data.status || null);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Chart configs
  const uptimeChartConfig = {
    uptime: {
      label: 'আপটাইম %',
      color: '#22c55e',
    },
  } satisfies ChartConfig;

  const responseTimeChartConfig = {
    responseTime: {
      label: 'রেসপন্স টাইম',
      color: '#3b82f6',
    },
  } satisfies ChartConfig;

  // Memoized chart data
  const uptimeChartData = useMemo(() => {
    if (!status?.uptimeHistory) return [];
    return status.uptimeHistory.map((d) => ({
      date: formatDateShort(d.date),
      uptime: Math.round(d.uptime * 10) / 10,
    }));
  }, [status?.uptimeHistory]);

  const responseTimeChartData = useMemo(() => {
    if (!status?.responseTimeHistory) return [];
    return status.responseTimeHistory
      .filter((_, i) => i % 4 === 0) // Every hour
      .map((d) => ({
        time: formatTime(d.timestamp),
        responseTime: d.responseTime,
      }));
  }, [status?.responseTimeHistory]);

  // Operational services count
  const operationalCount = status?.services.filter(
    (s) => s.status === 'operational'
  ).length || 0;
  const totalServices = status?.services.length || 9;

  // System status badge
  const getStatusBadge = () => {
    switch (status?.systemStatus) {
      case 'operational':
        return { text: 'সব সিস্টেম সচল', color: 'bg-green-500' };
      case 'degraded':
        return { text: 'সীমিত ক্ষমতায় সচল', color: 'bg-yellow-500' };
      case 'partial_outage':
        return { text: 'আংশিক সমস্যা', color: 'bg-orange-500' };
      case 'major_outage':
        return { text: 'বড় সমস্যা', color: 'bg-red-500' };
      default:
        return { text: 'অজানা', color: 'bg-gray-500' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onAddSpot={() => setAddModalOpen(true)} />

      <main className="flex-1 container px-3 sm:px-4 py-6 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <i className="bi bi-arrow-left text-base mr-1"></i>
              হোমে ফিরে যান
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <i className="bi bi-arrow-repeat text-4xl animate-spin text-green-600 mx-auto mb-3"></i>
              <p className="text-muted-foreground">স্ট্যাটাস লোড হচ্ছে...</p>
            </div>
          </div>
        ) : status ? (
          <div className="space-y-6">
            {/* Header Status Card */}
            <Card className="border">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <i className="bi bi-activity text-2xl text-green-600"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${statusBadge.color} animate-pulse`} />
                        <span className="text-xl font-bold text-green-600">
                          {statusBadge.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <i className="bi bi-clock text-base"></i>
                        <span className="text-sm">
                          সর্বশেষ চেক: {formatTimeAgo(status.lastCheck)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchStatus(true)}
                    disabled={refreshing}
                  >
                    <i className={`bi bi-arrow-clockwise text-base mr-1 ${refreshing ? 'animate-spin' : ''}`}></i>
                    {refreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">আপটাইম</p>
                      <p className="text-3xl font-bold text-green-700">
                        {toBengaliNumber(status.uptime.toFixed(2))}%
                      </p>
                    </div>
                    <i className="bi bi-graph-up-arrow text-4xl text-green-400"></i>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">গড় রেসপন্স</p>
                      <p className="text-3xl font-bold text-yellow-700">
                        {toBengaliNumber(status.avgResponseTime)}মি.সে.
                      </p>
                    </div>
                    <i className="bi bi-signal text-4xl text-yellow-400"></i>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">মোট চেক</p>
                      <p className="text-3xl font-bold">
                        {toBengaliNumber(status.totalChecks.toLocaleString())}
                      </p>
                    </div>
                    <i className="bi bi-bar-chart text-4xl text-muted-foreground/40"></i>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Status Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <i className="bi bi-hdd-server text-xl text-muted-foreground"></i>
                  <CardTitle className="text-lg">
                    সার্ভিস স্ট্যাটাস ({toBengaliNumber(operationalCount)}/{toBengaliNumber(totalServices)})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {status.services.map((service: ServiceStatusType) => {
                    const iconClass = serviceIcons[service.name] || 'bi bi-hdd-server';
                    return (
                      <div
                        key={service.name}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <i className={`${iconClass} text-xl text-muted-foreground`}></i>
                          <span className="font-medium">{serviceNameBn[service.name] || service.name}</span>
                        </div>
                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <span className="text-sm text-muted-foreground">
                            {toBengaliNumber(service.responseTime)}মি.সে.
                          </span>
                          <Badge
                            variant="outline"
                            className={`${
                              service.status === 'operational'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : service.status === 'degraded'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-1.5 ${
                                service.status === 'operational'
                                  ? 'bg-green-500'
                                  : service.status === 'degraded'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                            />
                            {service.status === 'operational'
                              ? 'সচল'
                              : service.status === 'degraded'
                              ? 'সীমিত'
                              : 'বন্ধ'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Uptime History Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">আপটাইম ইতিহাস</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={uptimeChartConfig} className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={uptimeChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          domain={[98, 100]}
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="uptime"
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Response Time Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">রেসপন্স টাইম</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={responseTimeChartConfig} className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={responseTimeChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 9 }}
                          className="text-muted-foreground"
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="responseTime"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* SSL Certificate & Incident History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SSL Certificate */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-shield-check text-xl text-muted-foreground"></i>
                    <CardTitle className="text-lg">এসএসএল সার্টিফিকেট</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">সার্টিফিকেট স্ট্যাটাস</span>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        <i className="bi bi-check-circle text-xs mr-1"></i>
                        বৈধ
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">হোস্টনেম</span>
                      <span className="font-mono text-sm">{status.ssl.hostname}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ইস্যুকারী</span>
                      <span className="text-sm">{status.ssl.issuer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">প্রোটোকল</span>
                      <Badge variant="outline" className="font-mono">
                        {status.ssl.protocol}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">সর্বশেষ চেক</span>
                      <span className="text-sm">
                        {new Date(status.ssl.lastChecked).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Incident History */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-exclamation-triangle text-xl text-muted-foreground"></i>
                    <CardTitle className="text-lg">ঘটনা ইতিহাস</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {status.incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <i className="bi bi-check-circle text-5xl text-green-500 mb-3"></i>
                      <p className="font-medium text-green-600">
                        সব সিস্টেম সঠিকভাবে চলছে
                      </p>
                      <p className="text-sm text-muted-foreground">কোনো ঘটনা নেই</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {status.incidents.map((incident) => (
                        <div
                          key={incident.id}
                          className="p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{incident.title}</span>
                            <Badge variant="outline">{incident.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {incident.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Checks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <i className="bi bi-clock text-xl text-muted-foreground"></i>
                  <CardTitle className="text-lg">সাম্প্রতিক চেক</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {status.recentChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/30 gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(check.timestamp).toLocaleString('bn-BD')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <span className="text-sm font-medium">
                          {toBengaliNumber(check.responseTime)}মি.সে.
                        </span>
                        <Badge
                          variant="outline"
                          className={`${
                            check.status === 'ok'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {check.status === 'ok' ? 'সঠিক' : 'ত্রুটি'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* App Stats */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <i className="bi bi-bar-chart text-xl text-green-600"></i>
                  <CardTitle className="text-lg text-green-700">
                    অ্যাপ্লিকেশন পরিসংখ্যান
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/70 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {toBengaliNumber(status.appStats.totalSpots)}
                    </p>
                    <p className="text-sm text-green-600">মোট স্পট</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {toBengaliNumber(status.appStats.verifiedSpots)}
                    </p>
                    <p className="text-sm text-green-600">ভেরিফাইড</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {toBengaliNumber(status.appStats.activeSpots)}
                    </p>
                    <p className="text-sm text-green-600">সক্রিয়</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {toBengaliNumber(status.appStats.newSpots)}
                    </p>
                    <p className="text-sm text-green-600">গত ৭ দিনে</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {toBengaliNumber(status.appStats.totalViews.toLocaleString())}
                    </p>
                    <p className="text-sm text-green-600">মোট ভিউ</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {toBengaliNumber(status.appStats.totalReviews)}
                    </p>
                    <p className="text-sm text-green-600">রিভিউ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">স্ট্যাটাস লোড করতে সমস্যা হয়েছে</p>
          </div>
        )}
      </main>

      <Footer />

      <AddSpotModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={() => setAddModalOpen(false)}
      />
    </div>
  );
}
