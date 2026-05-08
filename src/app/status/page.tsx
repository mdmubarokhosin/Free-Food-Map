'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/app/Navbar';
import Footer from '@/components/app/Footer';
import { getRealSystemStats, RealSystemStats } from '@/lib/services';
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SPOT_TYPE_LABELS, SPOT_TYPE_CONFIG } from '@/types';

// Bengali number converter
function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

// Spot type labels in Bengali for charts
const SPOT_TYPE_BN: Record<string, string> = {
  daily_meal: 'দৈনিক খাবার',
  weekly_meal: 'সাপ্তাহিক খাবার',
  grocery: 'গ্রোসারি',
  soup_kitchen: 'স্যুপ কিচেন',
  other: 'অন্যান্য',
};

const CHART_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function StatusPage() {
  const [stats, setStats] = useState<RealSystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getRealSystemStats();
      if (data.success) {
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // City distribution chart
  const cityChartConfig: ChartConfig = useMemo(() => {
    if (!stats?.cityDistribution.length) return { count: { label: 'স্পট সংখ্যা', color: '#22c55e' } };
    const config: ChartConfig = {};
    stats.cityDistribution.slice(0, 8).forEach((item, i) => {
      config[item.city] = { label: item.city, color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    return config;
  }, [stats?.cityDistribution]);

  const cityChartData = useMemo(() => {
    if (!stats?.cityDistribution) return [];
    return stats.cityDistribution.slice(0, 8).map((item) => ({
      city: item.city,
      count: item.count,
    }));
  }, [stats?.cityDistribution]);

  // Spot type distribution
  const typeChartConfig: ChartConfig = {
    count: { label: 'সংখ্যা', color: '#f59e0b' },
  };

  const typeChartData = useMemo(() => {
    if (!stats?.spotTypeDistribution) return [];
    return stats.spotTypeDistribution.map((item) => ({
      type: SPOT_TYPE_BN[item.type] || item.type,
      count: item.count,
      fill: SPOT_TYPE_CONFIG[item.type as keyof typeof SPOT_TYPE_CONFIG]?.color || '#94a3b8',
    }));
  }, [stats?.spotTypeDistribution]);

  // Pie chart data for overview
  const overviewPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'ভেরিফাইড', value: stats.verifiedSpots, fill: '#22c55e' },
      { name: 'অনিশ্চিত', value: stats.totalSpots - stats.verifiedSpots, fill: '#f59e0b' },
    ];
  }, [stats]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50/40 via-[#FAFAF9] to-white dark:from-[#111111] dark:to-stone-900">
      <Navbar onAddSpot={() => {}} compact />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-xl shadow-sm">
                <i className="bi bi-bar-chart text-2xl text-teal-600 dark:text-teal-400"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  সিস্টেম পরিসংখ্যান
                </h1>
                <p className="text-sm text-muted-foreground">
                  ফ্রি ফুড ম্যাপ - রিয়েল টাইম ডাটা
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
            >
              <i className={`bi bi-arrow-clockwise text-base mr-1 ${refreshing ? 'animate-spin' : ''}`}></i>
              {refreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <i className="bi bi-arrow-repeat text-4xl animate-spin text-green-600 mx-auto mb-3"></i>
              <p className="text-muted-foreground">পরিসংখ্যান লোড হচ্ছে...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200/50 dark:border-teal-800/30 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="bi bi-geo-alt text-green-600 text-sm"></i>
                    <p className="text-xs text-green-700 font-medium">মোট স্পট</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {toBengaliNumber(stats.totalSpots)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50 dark:border-emerald-800/30 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="bi bi-check-circle text-emerald-600 text-sm"></i>
                    <p className="text-xs text-emerald-700 font-medium">ভেরিফাইড</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {toBengaliNumber(stats.verifiedSpots)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200/50 dark:border-amber-800/30 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="bi bi-lightning text-amber-600 text-sm"></i>
                    <p className="text-xs text-amber-700 font-medium">সক্রিয়</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {toBengaliNumber(stats.activeSpots)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200/50 dark:border-sky-800/30 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="bi bi-star text-blue-600 text-sm"></i>
                    <p className="text-xs text-blue-700 font-medium">রিভিউ</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {toBengaliNumber(stats.totalReviews)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-200/50 dark:border-purple-800/30 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="bi bi-calendar-event text-purple-600 text-sm"></i>
                    <p className="text-xs text-purple-700 font-medium">ইভেন্ট</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {toBengaliNumber(stats.totalEvents)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">গত ৭ দিনে নতুন</p>
                  <p className="text-xl font-bold text-green-600">
                    +{toBengaliNumber(stats.newSpots)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">মোট ভিউ</p>
                  <p className="text-xl font-bold">
                    {toBengaliNumber(stats.totalViews)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">রিপোর্ট</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{toBengaliNumber(stats.totalReports)}</p>
                    {stats.pendingReports > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5">
                        {toBengaliNumber(stats.pendingReports)} অপেক্ষমান
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">সক্রিয় ইভেন্ট</p>
                  <p className="text-xl font-bold text-purple-600">
                    {toBengaliNumber(stats.activeEvents)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* City Distribution Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-building text-xl text-muted-foreground"></i>
                    <CardTitle className="text-lg">শহর অনুযায়ী স্পট</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {cityChartData.length > 0 ? (
                    <ChartContainer config={cityChartConfig} className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cityChartData} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                          <YAxis
                            type="category"
                            dataKey="city"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            width={80}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {cityChartData.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                      কোনো ডাটা নেই
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Spot Type Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-tags text-xl text-muted-foreground"></i>
                    <CardTitle className="text-lg">স্পটের ধরন অনুযায়ী</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {typeChartData.length > 0 ? (
                    <ChartContainer config={typeChartConfig} className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={typeChartData} margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="type" tick={{ fontSize: 10 }} className="text-muted-foreground" angle={-20} textAnchor="end" height={60} />
                          <YAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {typeChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                      কোনো ডাটা নেই
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Verification Status */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <i className="bi bi-pie-chart text-xl text-muted-foreground"></i>
                  <CardTitle className="text-lg">ভেরিফিকেশন অবস্থা</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {stats.totalSpots > 0 ? (
                    <ChartContainer
                      config={{ verified: { label: 'ভেরিফাইড', color: '#22c55e' }, unverified: { label: 'অনিশ্চিত', color: '#f59e0b' } }}
                      className="h-[200px] w-[200px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overviewPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {overviewPieData.map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[200px] w-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      কোনো স্পট নেই
                    </div>
                  )}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">ভেরিফাইড স্পট</span>
                      </div>
                      <span className="font-bold text-green-700">{toBengaliNumber(stats.verifiedSpots)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-sm font-medium">অনিশ্চিত স্পট</span>
                      </div>
                      <span className="font-bold text-amber-700">{toBengaliNumber(stats.totalSpots - stats.verifiedSpots)}</span>
                    </div>
                    {stats.totalSpots > 0 && (
                      <div className="text-sm text-muted-foreground">
                        ভেরিফিকেশন হার: <span className="font-bold text-foreground">{toBengaliNumber(Math.round((stats.verifiedSpots / stats.totalSpots) * 100))}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Updated Info */}
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <i className="bi bi-clock"></i>
                  <span>
                    সর্বশেষ আপডেট: {new Date(stats.lastUpdated).toLocaleString('bn-BD')}
                  </span>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">
                  সকল ডাটা Firebase Realtime Database থেকে সরাসরি সংগ্রহ করা হয়েছে
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <i className="bi bi-exclamation-triangle text-4xl text-amber-500 mx-auto mb-3"></i>
              <p className="text-muted-foreground">পরিসংখ্যান লোড করতে সমস্যা হয়েছে</p>
              <Button variant="outline" className="mt-3" onClick={() => fetchStats()}>
                আবার চেষ্টা করুন
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer standard />
    </div>
  );
}
