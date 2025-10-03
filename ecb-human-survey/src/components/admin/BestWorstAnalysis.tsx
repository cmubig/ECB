import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Globe,
  Zap
} from 'lucide-react';

interface BestWorstData {
  model: string;
  country: string;
  totalResponses: number;
  avgImageQuality: number;
  avgCulturalRepresentation: number;
  bestStepCounts: { [step: string]: number };
  worstStepCounts: { [step: string]: number };
  mostSelectedBest: string;
  mostSelectedWorst: string;
}

const BestWorstAnalysis: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<BestWorstData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResponses: 0,
    uniqueModels: 0,
    uniqueCountries: 0
  });

  useEffect(() => {
    const fetchBestWorstData = async () => {
      setLoading(true);
      try {
        // const allData: any[] = [];
        const modelCountryMap = new Map<string, BestWorstData>();

        // Fetch step responses
        const stepQuery = query(collection(db, 'step_responses'), orderBy('timestamp', 'desc'));
        const stepUnsubscribe = onSnapshot(stepQuery, (snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.model}_${data.country}`;
            
            if (!modelCountryMap.has(key)) {
              modelCountryMap.set(key, {
                model: data.model || 'Unknown',
                country: data.country || 'Unknown',
                totalResponses: 0,
                avgImageQuality: 0,
                avgCulturalRepresentation: 0,
                bestStepCounts: {},
                worstStepCounts: {},
                mostSelectedBest: '',
                mostSelectedWorst: ''
              });
            }

            const item = modelCountryMap.get(key)!;
            item.totalResponses++;
            item.avgImageQuality += data.image_quality || 0;
            item.avgCulturalRepresentation += data.cultural_representative || 0;

            // Count best/worst steps
            if (data.is_best) {
              const step = data.step || 'unknown';
              item.bestStepCounts[step] = (item.bestStepCounts[step] || 0) + 1;
            }
            if (data.is_worst) {
              const step = data.step || 'unknown';
              item.worstStepCounts[step] = (item.worstStepCounts[step] || 0) + 1;
            }
          });

          // Calculate averages and find most selected
          const processedData = Array.from(modelCountryMap.values()).map(item => {
            if (item.totalResponses > 0) {
              item.avgImageQuality = item.avgImageQuality / item.totalResponses;
              item.avgCulturalRepresentation = item.avgCulturalRepresentation / item.totalResponses;
            }

            // Find most selected best step
            const bestSteps = Object.entries(item.bestStepCounts);
            if (bestSteps.length > 0) {
              item.mostSelectedBest = bestSteps.reduce((a, b) => a[1] > b[1] ? a : b)[0];
            }

            // Find most selected worst step
            const worstSteps = Object.entries(item.worstStepCounts);
            if (worstSteps.length > 0) {
              item.mostSelectedWorst = worstSteps.reduce((a, b) => a[1] > b[1] ? a : b)[0];
            }

            return item;
          });

          setAnalysisData(processedData);
          setStats({
            totalResponses: processedData.reduce((sum, item) => sum + item.totalResponses, 0),
            uniqueModels: new Set(processedData.map(item => item.model)).size,
            uniqueCountries: new Set(processedData.map(item => item.country)).size
          });
          setLoading(false);
        });

        return () => {
          stepUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching best/worst analysis data:', error);
        setLoading(false);
      }
    };

    fetchBestWorstData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Best/Worst Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all models and countries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Models</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueModels}</div>
            <p className="text-xs text-muted-foreground">Different AI models evaluated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueCountries}</div>
            <p className="text-xs text-muted-foreground">Different countries represented</p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Best/Worst Step Analysis by Model and Country</CardTitle>
          <CardDescription>
            Analysis of which steps are most frequently selected as best and worst
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Model</th>
                  <th className="text-left p-2 font-medium">Country</th>
                  <th className="text-right p-2 font-medium">Total</th>
                  <th className="text-right p-2 font-medium">Avg Quality</th>
                  <th className="text-right p-2 font-medium">Avg Cultural</th>
                  <th className="text-center p-2 font-medium">Most Best</th>
                  <th className="text-center p-2 font-medium">Most Worst</th>
                  <th className="text-center p-2 font-medium">Best Steps</th>
                  <th className="text-center p-2 font-medium">Worst Steps</th>
                </tr>
              </thead>
              <tbody>
                {analysisData
                  .sort((a, b) => b.totalResponses - a.totalResponses)
                  .map((item, index) => (
                  <tr key={`${item.model}_${item.country}_${index}`} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <Badge variant="outline" className="capitalize">
                        {item.model}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span>{item.country}</span>
                      </div>
                    </td>
                    <td className="p-2 text-right font-medium">
                      {item.totalResponses.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{item.avgImageQuality.toFixed(2)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(item.avgImageQuality / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{item.avgCulturalRepresentation.toFixed(2)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(item.avgCulturalRepresentation / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {item.mostSelectedBest ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {item.mostSelectedBest}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {item.mostSelectedWorst ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {item.mostSelectedWorst}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <div className="space-y-1">
                        {Object.entries(item.bestStepCounts)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([step, count]) => (
                          <div key={step} className="text-xs">
                            <span className="font-medium">{step}:</span> {count}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="space-y-1">
                        {Object.entries(item.worstStepCounts)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([step, count]) => (
                          <div key={step} className="text-xs">
                            <span className="font-medium">{step}:</span> {count}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Analysis of best/worst step selection patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Most Preferred Steps
              </h4>
              <div className="space-y-2">
                {(() => {
                  const allBestSteps = analysisData.flatMap(item => 
                    Object.entries(item.bestStepCounts).map(([step, count]) => ({ step, count }))
                  );
                  const stepTotals = allBestSteps.reduce((acc, { step, count }) => {
                    acc[step] = (acc[step] || 0) + count;
                    return acc;
                  }, {} as { [step: string]: number });
                  
                  return Object.entries(stepTotals)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([step, count]) => (
                    <div key={step} className="flex justify-between items-center">
                      <span className="text-sm">{step}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                Least Preferred Steps
              </h4>
              <div className="space-y-2">
                {(() => {
                  const allWorstSteps = analysisData.flatMap(item => 
                    Object.entries(item.worstStepCounts).map(([step, count]) => ({ step, count }))
                  );
                  const stepTotals = allWorstSteps.reduce((acc, { step, count }) => {
                    acc[step] = (acc[step] || 0) + count;
                    return acc;
                  }, {} as { [step: string]: number });
                  
                  return Object.entries(stepTotals)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([step, count]) => (
                    <div key={step} className="flex justify-between items-center">
                      <span className="text-sm">{step}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BestWorstAnalysis;
