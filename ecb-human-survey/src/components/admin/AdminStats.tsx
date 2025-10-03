import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Globe, 
  Zap, 
  BarChart3
} from 'lucide-react';

interface CountryStats {
  country: string;
  totalUsers: number;
  totalResponses: number;
  avgCompletionRate: number;
}

interface ModelStats {
  model: string;
  totalResponses: number;
  avgImageQuality: number;
  avgCulturalRepresentation: number;
}

interface ResponseTypeStats {
  type: string;
  count: number;
  percentage: number;
}

const AdminStats: React.FC = () => {
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [responseTypeStats, setResponseTypeStats] = useState<ResponseTypeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalUsers: 0,
    totalResponses: 0,
    totalCountries: 0,
    totalModels: 0,
    avgCompletionRate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const countryMap = new Map<string, CountryStats>();
        const modelMap = new Map<string, ModelStats>();
        const responseTypeMap = new Map<string, number>();
        let totalResponses = 0;
        // let totalUsers = 0;
        // let totalCompletionTime = 0;

        // Fetch step responses
        const stepQuery = query(collection(db, 'step_responses'), orderBy('timestamp', 'desc'));
        const stepUnsubscribe = onSnapshot(stepQuery, (snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const country = data.country || 'Unknown';
            const model = data.model || 'Unknown';
            
            totalResponses++;
            // totalCompletionTime += data.completion_time_seconds || 0;

            // Country stats
            if (!countryMap.has(country)) {
              countryMap.set(country, {
                country,
                totalUsers: 0,
                totalResponses: 0,
                avgCompletionRate: 0
              });
            }
            const countryStat = countryMap.get(country)!;
            countryStat.totalResponses++;

            // Model stats
            if (!modelMap.has(model)) {
              modelMap.set(model, {
                model,
                totalResponses: 0,
                avgImageQuality: 0,
                avgCulturalRepresentation: 0
              });
            }
            const modelStat = modelMap.get(model)!;
            modelStat.totalResponses++;
            modelStat.avgImageQuality += data.image_quality || 0;
            modelStat.avgCulturalRepresentation += data.cultural_representative || 0;

            // Response type stats
            responseTypeMap.set('step', (responseTypeMap.get('step') || 0) + 1);
          });
        });

        // Fetch attribution responses
        const attributionQuery = query(collection(db, 'attribution_responses'), orderBy('timestamp', 'desc'));
        const attributionUnsubscribe = onSnapshot(attributionQuery, (snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const country = data.country || 'Unknown';
            
            totalResponses++;
            // totalCompletionTime += data.completion_time_seconds || 0;

            // Country stats
            if (!countryMap.has(country)) {
              countryMap.set(country, {
                country,
                totalUsers: 0,
                totalResponses: 0,
                avgCompletionRate: 0
              });
            }
            const countryStat = countryMap.get(country)!;
            countryStat.totalResponses++;

            // Response type stats
            responseTypeMap.set('attribution', (responseTypeMap.get('attribution') || 0) + 1);
          });
        });

        // Fetch survey responses
        const surveyQuery = query(collection(db, 'survey_responses'), orderBy('timestamp', 'desc'));
        const surveyUnsubscribe = onSnapshot(surveyQuery, (snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const country = data.country || 'Unknown';
            const model = data.model || 'Unknown';
            
            totalResponses++;
            // totalCompletionTime += data.completion_time_seconds || 0;

            // Country stats
            if (!countryMap.has(country)) {
              countryMap.set(country, {
                country,
                totalUsers: 0,
                totalResponses: 0,
                avgCompletionRate: 0
              });
            }
            const countryStat = countryMap.get(country)!;
            countryStat.totalResponses++;

            // Model stats
            if (!modelMap.has(model)) {
              modelMap.set(model, {
                model,
                totalResponses: 0,
                avgImageQuality: 0,
                avgCulturalRepresentation: 0
              });
            }
            const modelStat = modelMap.get(model)!;
            modelStat.totalResponses++;
            modelStat.avgImageQuality += data.image_quality || 0;
            modelStat.avgCulturalRepresentation += data.cultural_representative || 0;

            // Response type stats
            responseTypeMap.set('survey', (responseTypeMap.get('survey') || 0) + 1);
          });

          // Calculate averages
          const countryStatsArray = Array.from(countryMap.values()).map(stat => ({
            ...stat,
            avgCompletionRate: stat.totalResponses > 0 ? (stat.totalResponses / 1560) * 100 : 0 // 5 models * 312 images = 1560
          }));

          const modelStatsArray = Array.from(modelMap.values()).map(stat => ({
            ...stat,
            avgImageQuality: stat.totalResponses > 0 ? stat.avgImageQuality / stat.totalResponses : 0,
            avgCulturalRepresentation: stat.totalResponses > 0 ? stat.avgCulturalRepresentation / stat.totalResponses : 0
          }));

          const responseTypeStatsArray = Array.from(responseTypeMap.entries()).map(([type, count]) => ({
            type,
            count,
            percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0
          }));

          setCountryStats(countryStatsArray.sort((a, b) => b.totalResponses - a.totalResponses));
          setModelStats(modelStatsArray.sort((a, b) => b.totalResponses - a.totalResponses));
          setResponseTypeStats(responseTypeStatsArray.sort((a, b) => b.count - a.count));

          setOverallStats({
            totalUsers: countryMap.size,
            totalResponses,
            totalCountries: countryMap.size,
            totalModels: modelMap.size,
            avgCompletionRate: totalResponses > 0 ? (totalResponses / (countryMap.size * 1560)) * 100 : 0
          });

          setLoading(false);
        });

        return () => {
          stepUnsubscribe();
          attributionUnsubscribe();
          surveyUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalResponses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCountries}</div>
            <p className="text-xs text-muted-foreground">Different countries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Models</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalModels}</div>
            <p className="text-xs text-muted-foreground">AI models evaluated</p>
          </CardContent>
        </Card>
      </div>

      {/* Response Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Response Type Distribution</CardTitle>
          <CardDescription>Breakdown of different response types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {responseTypeStats.map((stat) => (
              <div key={stat.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {stat.type}
                  </Badge>
                  <span className="text-sm text-gray-600">{stat.count.toLocaleString()} responses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{stat.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Country Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Country Performance</CardTitle>
          <CardDescription>Response statistics by country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Country</th>
                  <th className="text-right p-2 font-medium">Responses</th>
                  <th className="text-right p-2 font-medium">Completion Rate</th>
                  <th className="text-center p-2 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {countryStats.map((stat) => (
                  <tr key={stat.country} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span>{stat.country}</span>
                      </div>
                    </td>
                    <td className="p-2 text-right font-medium">
                      {stat.totalResponses.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      {stat.avgCompletionRate.toFixed(1)}%
                    </td>
                    <td className="p-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(stat.avgCompletionRate, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
          <CardDescription>Average scores by AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Model</th>
                  <th className="text-right p-2 font-medium">Responses</th>
                  <th className="text-right p-2 font-medium">Avg Quality</th>
                  <th className="text-right p-2 font-medium">Avg Cultural</th>
                </tr>
              </thead>
              <tbody>
                {modelStats.map((stat) => (
                  <tr key={stat.model} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <Badge variant="outline" className="capitalize">
                        {stat.model}
                      </Badge>
                    </td>
                    <td className="p-2 text-right font-medium">
                      {stat.totalResponses.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{stat.avgImageQuality.toFixed(2)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(stat.avgImageQuality / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{stat.avgCulturalRepresentation.toFixed(2)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(stat.avgCulturalRepresentation / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;