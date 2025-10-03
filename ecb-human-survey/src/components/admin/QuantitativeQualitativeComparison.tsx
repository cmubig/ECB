import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  // TrendingDown, 
  Target, 
  BarChart3,
  Globe,
  Download,
  AlertTriangle,
  Users
} from 'lucide-react';

interface HumanEvaluationData {
  userId: string;
  model: string;
  country: string;
  imageId: string;
  step: string;
  imageQuality: number; // 1-5
  culturalRepresentation: number; // 1-5
  bestImage: string;
  worstImage: string;
  timestamp: string;
}

interface QuantitativeMetrics {
  model: string;
  country: string;
  imageId: string;
  step: string;
  clipScore: number;
  culturalScore: number;
  aestheticScore: number;
  isBest: boolean;
  isWorst: boolean;
}

interface ComparisonResult {
  model: string;
  country: string;
  imageQualityVsClip: {
    correlation: number;
    humanAvg: number;
    clipAvg: number;
    difference: number;
  };
  culturalVsMetric: {
    correlation: number;
    humanAvg: number;
    culturalAvg: number;
    difference: number;
  };
  bestWorstAlignment: {
    humanBestSteps: { [step: string]: number };
    humanWorstSteps: { [step: string]: number };
    metricBestSteps: { [step: string]: number };
    metricWorstSteps: { [step: string]: number };
    alignmentScore: number;
  };
}

const QuantitativeQualitativeComparison: React.FC = () => {
  const [humanData, setHumanData] = useState<HumanEvaluationData[]>([]);
  const [quantitativeData, setQuantitativeData] = useState<QuantitativeMetrics[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('All Models');
  const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');
  const [overallStats, setOverallStats] = useState({
    totalHumanResponses: 0,
    totalQuantitativeData: 0,
    averageImageQualityCorrelation: 0,
    averageCulturalCorrelation: 0,
    averageDiscrepancy: 0
  });

  // Load quantitative metrics from CSV files
  useEffect(() => {
    const loadQuantitativeData = async () => {
      try {
        const models = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
        const allQuantitativeData: QuantitativeMetrics[] = [];

        for (const model of models) {
          try {
            console.log(`📊 Loading data for ${model}...`);
            
            // Load cultural metrics
            const culturalResponse = await fetch(`/quantitative evaluation_result/${model}/cultural_metrics_summary.csv`);
            if (!culturalResponse.ok) {
              console.error(`Failed to load cultural metrics for ${model}:`, culturalResponse.status);
              continue;
            }
            
            const culturalText = await culturalResponse.text();
            const culturalLines = culturalText.split('\n').slice(1); // Skip header
            console.log(`📊 Cultural metrics for ${model}:`, culturalLines.length, 'lines');

            // Process cultural metrics
            culturalLines.forEach(line => {
              if (line.trim()) {
                const columns = line.split(',');
                if (columns.length >= 18) {
                  const [uid, _groupId, step, country, _category, _subCategory, _variant, _accuracy, _precision, _recall, _f1, _numQuestions, _processingTime, _questionSource, culturalRepresentative, _promptAlignment, isBest, isWorst] = columns;
                  
                  if (uid && step && country) {
                    // Normalize country names
                    let normalizedCountry = country.toLowerCase();
                    if (normalizedCountry === 'south korea') {
                      normalizedCountry = 'korea';
                    }
                    
                    const culturalScore = parseFloat(culturalRepresentative) || 0;
                    const isBestValue = isBest === 'True';
                    const isWorstValue = isWorst === 'True';
                    
                    console.log(`📊 Cultural data: ${model} ${normalizedCountry} ${step} - Raw: ${culturalRepresentative}, Score: ${culturalScore}, Best: ${isBestValue}, Worst: ${isWorstValue}`);
                    
                    allQuantitativeData.push({
                      model,
                      country: normalizedCountry,
                      imageId: uid, // Use the original uid
                      step,
                      clipScore: 0, // Will be filled from general metrics
                      culturalScore: culturalScore,
                      aestheticScore: 0, // Will be filled from general metrics
                      isBest: isBestValue,
                      isWorst: isWorstValue
                    });
                  }
                }
              }
            });

            // Load general metrics for CLIP and Aesthetic scores
            const generalResponse = await fetch(`/quantitative evaluation_result/${model}/general_metrics.csv`);
            if (!generalResponse.ok) {
              console.error(`Failed to load general metrics for ${model}:`, generalResponse.status);
              continue;
            }
            
            const generalText = await generalResponse.text();
            const generalLines = generalText.split('\n').slice(1); // Skip header
            console.log(`📊 General metrics for ${model}:`, generalLines.length, 'lines');

            // Process general metrics - each line represents one step
            generalLines.forEach((line, _rowIndex) => {
              if (line.trim()) {
                const columns = line.split(',');
                if (columns.length >= 10) {
                  const [_rowId, promptUsedForClip, step, _imagePath, _clipCosine, clipScore0100, aestheticScore, _dreamsimDistVsStep0, _dreamsimSimVsStep0, _dreamsimDistVsPrevStep, _dreamsimSimVsPrevStep] = columns;
                  
                  if (clipScore0100 && aestheticScore) {
                    // Extract country and category from prompt
                    const countryMatch = promptUsedForClip.match(/(China|India|Kenya|Nigeria|South Korea|United States)/i);
                    const categoryMatch = promptUsedForClip.match(/(architecture|art|fashion|food|people)/i);
                    const subCategoryMatch = promptUsedForClip.match(/(house|landmark|painting|clothing|main dish|president|daily life)/i);
                    
                    let country = countryMatch ? countryMatch[1].toLowerCase() : 'unknown';
                    // Normalize country names
                    if (country === 'south korea') {
                      country = 'korea';
                    }
                    
                    const category = categoryMatch ? categoryMatch[1] : 'unknown';
                    const subCategory = subCategoryMatch ? subCategoryMatch[1] : 'general';
                    
                    // Convert step path to step name
                    const stepName = step.replace('_path', '');
                    
                    allQuantitativeData.push({
                      model,
                      country,
                      imageId: `${model}_${country}_${category}_${subCategory}_${_rowId}_${stepName}`,
                      step: stepName,
                      clipScore: parseFloat(clipScore0100) || 0,
                      culturalScore: 0, // Will be filled from cultural data
                      aestheticScore: parseFloat(aestheticScore) || 0,
                      isBest: false, // Will be determined from cultural data
                      isWorst: false // Will be determined from cultural data
                    });
                  }
                }
              }
            });

            // Now merge cultural and general data
            const culturalData = allQuantitativeData.filter(d => d.model === model && d.culturalScore > 0);
            const generalData = allQuantitativeData.filter(d => d.model === model && d.clipScore > 0);
            
            console.log(`📊 Cultural data for ${model}:`, culturalData.length, 'entries');
            console.log(`📊 General data for ${model}:`, generalData.length, 'entries');
            console.log(`📊 Sample cultural data:`, culturalData.slice(0, 3));
            console.log(`📊 Sample general data:`, generalData.slice(0, 3));
            console.log(`📊 Cultural data countries:`, [...new Set(culturalData.map(c => c.country))]);
            console.log(`📊 General data countries:`, [...new Set(generalData.map(g => g.country))]);
            
            // Update general data with cultural scores and best/worst info
            generalData.forEach(generalItem => {
              // Try exact match first
              let matchingCultural = culturalData.find(cultural => 
                cultural.country === generalItem.country && 
                cultural.step === generalItem.step
              );
              
              if (matchingCultural) {
                generalItem.culturalScore = matchingCultural.culturalScore;
                generalItem.isBest = matchingCultural.isBest;
                generalItem.isWorst = matchingCultural.isWorst;
                console.log(`📊 Exact match: ${generalItem.country} ${generalItem.step} - Cultural: ${matchingCultural.culturalScore}, Best: ${matchingCultural.isBest}, Worst: ${matchingCultural.isWorst}`);
              } else {
                // Try step number matching (step0 -> 0, step1 -> 1, etc.)
                const stepNumber = generalItem.step.replace('step', '');
                matchingCultural = culturalData.find(cultural => 
                  cultural.country === generalItem.country && 
                  cultural.step === stepNumber
                );
                
             if (matchingCultural) {
               generalItem.culturalScore = matchingCultural.culturalScore;
               generalItem.isBest = matchingCultural.isBest;
               generalItem.isWorst = matchingCultural.isWorst;
               console.log(`📊 Step number match: ${generalItem.country} ${generalItem.step} -> ${stepNumber} - Cultural: ${matchingCultural.culturalScore}, Best: ${matchingCultural.isBest}, Worst: ${matchingCultural.isWorst}`);
               if (matchingCultural.isWorst) {
                 console.log(`🔥 WORST MATCH FOUND: ${generalItem.country} ${generalItem.step} - Cultural: ${matchingCultural.culturalScore}`);
               }
             } else {
               console.log(`📊 No match found for: ${generalItem.country} ${generalItem.step}`);
             }
              }
            });
            
            // Remove cultural-only entries and keep only merged data
            const filteredData = allQuantitativeData.filter(d => d.model !== model || d.clipScore > 0);
            allQuantitativeData.splice(0, allQuantitativeData.length, ...filteredData);
            
            console.log(`📊 Total entries for ${model}:`, allQuantitativeData.filter(d => d.model === model).length);
          } catch (error) {
            console.error(`Error loading data for ${model}:`, error);
          }
        }

        setQuantitativeData(allQuantitativeData);
        console.log('📊 Loaded quantitative data:', allQuantitativeData.length, 'entries');
        console.log('📊 Sample quantitative data:', allQuantitativeData.slice(0, 5));
        console.log('📊 Countries:', [...new Set(allQuantitativeData.map(d => d.country))]);
        console.log('📊 Models:', [...new Set(allQuantitativeData.map(d => d.model))]);
      } catch (error) {
        console.error('Error loading quantitative data:', error);
      }
    };

    loadQuantitativeData();
  }, []);

  // Load human evaluation data from Firebase
  useEffect(() => {
    const fetchHumanData = async () => {
      setLoading(true);
      try {
        const allHumanData: HumanEvaluationData[] = [];

        // Fetch step responses
        const stepQuery = query(collection(db, 'step_responses'), orderBy('timestamp', 'desc'));
        const stepUnsubscribe = onSnapshot(stepQuery, (snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            allHumanData.push({
              userId: data.user_id,
              model: data.model || 'Unknown',
              country: data.country || 'Unknown',
              imageId: data.uid || doc.id,
              step: data.step || 'Unknown',
              imageQuality: data.image_quality || 0,
              culturalRepresentation: data.cultural_representative || 0,
              bestImage: data.is_best ? data.step : '',
              worstImage: data.is_worst ? data.step : '',
              timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
            });
          });

          setHumanData(allHumanData);
          console.log('👥 Loaded human data:', allHumanData.length, 'entries');
        });

        return () => {
          stepUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching human data:', error);
        setLoading(false);
      }
    };

    fetchHumanData();
  }, []);

  const performComparison = useCallback(() => {
    try {
      console.log('🔍 Starting comparison analysis...');
      console.log('👥 Human data:', humanData.length, 'entries');
      console.log('📊 Quantitative data:', quantitativeData.length, 'entries');

      // Normalize country names for matching
  const normalizeCountry = (country: string) => {
    const countryMap: { [key: string]: string } = {
      'korea': 'korea',
      'south korea': 'korea',
      'united states': 'united_states',
      'united_states': 'united_states',
      'usa': 'united_states',
      'us': 'united_states'
    };
    const normalized = countryMap[country.toLowerCase()] || country.toLowerCase();
    console.log(`🌍 Country normalization: "${country}" -> "${normalized}"`);
    return normalized;
  };

      // Filter data based on selected model and country
      const filteredHumanData = humanData.filter(item => {
        const modelMatch = selectedModel === 'All Models' || item.model === selectedModel;
        const countryMatch = selectedCountry === 'All Countries' || 
          normalizeCountry(item.country) === normalizeCountry(selectedCountry);
        return modelMatch && countryMatch;
      });

      const filteredQuantitativeData = quantitativeData.filter(item => {
        const modelMatch = selectedModel === 'All Models' || item.model === selectedModel;
        const countryMatch = selectedCountry === 'All Countries' || 
          normalizeCountry(item.country) === normalizeCountry(selectedCountry);
        return modelMatch && countryMatch;
      });

      console.log('🔍 Filtered human data:', filteredHumanData.length, 'entries');
      console.log('🔍 Filtered quantitative data:', filteredQuantitativeData.length, 'entries');
      console.log('🔍 Sample human data:', filteredHumanData.slice(0, 3));
      console.log('🔍 Sample quantitative data:', filteredQuantitativeData.slice(0, 3));
      
      // Debug: Show sample data
      if (filteredHumanData.length > 0) {
        console.log('🔍 Sample human data:', filteredHumanData.slice(0, 3));
      }
      if (filteredQuantitativeData.length > 0) {
        console.log('🔍 Sample quantitative data:', filteredQuantitativeData.slice(0, 3));
      }

      // Group by model and country
      const modelCountryGroups = new Map<string, { human: HumanEvaluationData[], quantitative: QuantitativeMetrics[] }>();
      
      filteredHumanData.forEach(item => {
        const normalizedCountry = normalizeCountry(item.country);
        const key = `${item.model}_${normalizedCountry}`;
        if (!modelCountryGroups.has(key)) {
          modelCountryGroups.set(key, { human: [], quantitative: [] });
        }
        modelCountryGroups.get(key)!.human.push(item);
      });

      filteredQuantitativeData.forEach(item => {
        const normalizedCountry = normalizeCountry(item.country);
        const key = `${item.model}_${normalizedCountry}`;
        if (!modelCountryGroups.has(key)) {
          modelCountryGroups.set(key, { human: [], quantitative: [] });
        }
        modelCountryGroups.get(key)!.quantitative.push(item);
      });

      console.log('🔍 Model-country groups:', modelCountryGroups.size, 'groups');

      const results: ComparisonResult[] = [];
      let totalImageQualityCorrelation = 0;
      let totalCulturalCorrelation = 0;
      let totalDiscrepancy = 0;
      let validComparisons = 0;

      modelCountryGroups.forEach((data, key) => {
        const [model, country] = key.split('_');
        
        console.log(`🔍 Processing ${model}_${country}:`, data.human.length, 'human,', data.quantitative.length, 'quantitative');
        
        if (data.human.length > 0 && data.quantitative.length > 0) {
          // Calculate correlations
          const imageQualityCorrelation = calculateCorrelation(
            data.human.map(h => h.imageQuality),
            data.quantitative.map(q => q.clipScore)
          );

          const culturalCorrelation = calculateCorrelation(
            data.human.map(h => h.culturalRepresentation),
            data.quantitative.map(q => q.culturalScore)
          );

          // Calculate averages
          const humanImageQualityAvg = data.human.reduce((sum, h) => sum + h.imageQuality, 0) / data.human.length;
          const clipAvg = data.quantitative.reduce((sum, q) => sum + q.clipScore, 0) / data.quantitative.length;
          const humanCulturalAvg = data.human.reduce((sum, h) => sum + h.culturalRepresentation, 0) / data.human.length;
          const culturalAvg = data.quantitative.reduce((sum, q) => sum + q.culturalScore, 0) / data.quantitative.length;

          console.log(`📊 ${model}_${country} - Cultural scores:`, data.quantitative.map(q => q.culturalScore).slice(0, 5));
          console.log(`📊 ${model}_${country} - Cultural avg:`, culturalAvg);
          console.log(`📊 ${model}_${country} - Sample quantitative data:`, data.quantitative.slice(0, 3));
          console.log(`📊 ${model}_${country} - Cultural score details:`, data.quantitative.map(q => ({step: q.step, culturalScore: q.culturalScore, isBest: q.isBest, isWorst: q.isWorst})).slice(0, 5));
          console.log(`📊 ${model}_${country} - Best entries:`, data.quantitative.filter(q => q.isBest).length);
          console.log(`📊 ${model}_${country} - Worst entries:`, data.quantitative.filter(q => q.isWorst).length);

          // Best/Worst alignment
          const humanBestSteps = data.human
            .filter(h => h.bestImage)
            .reduce((acc, h) => {
              acc[h.bestImage] = (acc[h.bestImage] || 0) + 1;
              return acc;
            }, {} as { [step: string]: number });

          const humanWorstSteps = data.human
            .filter(h => h.worstImage)
            .reduce((acc, h) => {
              acc[h.worstImage] = (acc[h.worstImage] || 0) + 1;
              return acc;
            }, {} as { [step: string]: number });

          const metricBestSteps = data.quantitative
            .filter(q => q.isBest)
            .reduce((acc, q) => {
              acc[q.step] = (acc[q.step] || 0) + 1;
              return acc;
            }, {} as { [step: string]: number });

          const metricWorstSteps = data.quantitative
            .filter(q => q.isWorst)
            .reduce((acc, q) => {
              acc[q.step] = (acc[q.step] || 0) + 1;
              return acc;
            }, {} as { [step: string]: number });

          console.log(`📊 ${model}_${country} - Metric worst steps:`, metricWorstSteps);

          console.log(`📊 ${model}_${country} - Quantitative data:`, data.quantitative.length, 'entries');
          console.log(`📊 ${model}_${country} - Best entries:`, data.quantitative.filter(q => q.isBest).length);
          console.log(`📊 ${model}_${country} - Worst entries:`, data.quantitative.filter(q => q.isWorst).length);
          console.log(`📊 ${model}_${country} - Worst details:`, data.quantitative.filter(q => q.isWorst).map(q => ({step: q.step, culturalScore: q.culturalScore})));
          console.log(`📊 ${model}_${country} - Sample quantitative data:`, data.quantitative.slice(0, 3));

          const alignmentScore = calculateBestWorstAlignment(humanBestSteps, humanWorstSteps, metricBestSteps, metricWorstSteps);

          console.log(`📊 ${model}_${country} results:`, {
            imageQualityCorrelation,
            culturalCorrelation,
            humanImageQualityAvg,
            clipAvg,
            humanCulturalAvg,
            culturalAvg
          });

          results.push({
            model,
            country,
            imageQualityVsClip: {
              correlation: imageQualityCorrelation,
              humanAvg: humanImageQualityAvg,
              clipAvg: clipAvg,
              difference: Math.abs(humanImageQualityAvg - (clipAvg / 5)) // Normalize CLIP to 1-5 scale
            },
            culturalVsMetric: {
              correlation: culturalCorrelation,
              humanAvg: humanCulturalAvg,
              culturalAvg: culturalAvg,
              difference: Math.abs(humanCulturalAvg - culturalAvg)
            },
            bestWorstAlignment: {
              humanBestSteps,
              humanWorstSteps,
              metricBestSteps,
              metricWorstSteps,
              alignmentScore
            }
          });

          if (!isNaN(imageQualityCorrelation)) {
            totalImageQualityCorrelation += imageQualityCorrelation;
            totalCulturalCorrelation += culturalCorrelation;
            totalDiscrepancy += Math.abs(humanImageQualityAvg - (clipAvg / 5));
            validComparisons++;
          }
        }
      });

      console.log('📊 Final results:', results.length, 'comparisons');
      console.log('📊 Valid comparisons:', validComparisons);

      setComparisonResults(results);
      setOverallStats({
        totalHumanResponses: filteredHumanData.length,
        totalQuantitativeData: filteredQuantitativeData.length,
        averageImageQualityCorrelation: validComparisons > 0 ? totalImageQualityCorrelation / validComparisons : 0,
        averageCulturalCorrelation: validComparisons > 0 ? totalCulturalCorrelation / validComparisons : 0,
        averageDiscrepancy: validComparisons > 0 ? totalDiscrepancy / validComparisons : 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error performing comparison:', error);
      setLoading(false);
    }
  }, [humanData, quantitativeData, selectedModel, selectedCountry]);

  // Perform comparison analysis
  useEffect(() => {
    if (humanData.length > 0 && quantitativeData.length > 0) {
      performComparison();
    }
  }, [humanData, quantitativeData, selectedModel, selectedCountry, performComparison]);

  const calculateCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const calculateBestWorstAlignment = (
    humanBest: { [step: string]: number },
    humanWorst: { [step: string]: number },
    metricBest: { [step: string]: number },
    metricWorst: { [step: string]: number }
  ): number => {
    const allSteps = new Set([...Object.keys(humanBest), ...Object.keys(humanWorst), ...Object.keys(metricBest), ...Object.keys(metricWorst)]);
    let alignment = 0;
    let totalSteps = 0;

    allSteps.forEach(step => {
      const humanBestCount = humanBest[step] || 0;
      const humanWorstCount = humanWorst[step] || 0;
      const metricBestCount = metricBest[step] || 0;
      const metricWorstCount = metricWorst[step] || 0;

      const humanPreference = humanBestCount - humanWorstCount;
      const metricPreference = metricBestCount - metricWorstCount;

      if (humanPreference !== 0 || metricPreference !== 0) {
        alignment += Math.min(Math.abs(humanPreference), Math.abs(metricPreference)) / Math.max(Math.abs(humanPreference), Math.abs(metricPreference), 1);
        totalSteps++;
      }
    });

    return totalSteps > 0 ? alignment / totalSteps : 0;
  };

  const downloadReport = () => {
    const csvContent = [
      'Model,Country,Image Quality Correlation,CLIP Correlation,Cultural Correlation,Best/Worst Alignment,Human Image Quality Avg,CLIP Avg,Human Cultural Avg,Cultural Metric Avg',
      ...comparisonResults.map(result => 
        `${result.model},${result.country},${result.imageQualityVsClip.correlation.toFixed(3)},${result.imageQualityVsClip.correlation.toFixed(3)},${result.culturalVsMetric.correlation.toFixed(3)},${result.bestWorstAlignment.alignmentScore.toFixed(3)},${result.imageQualityVsClip.humanAvg.toFixed(2)},${result.imageQualityVsClip.clipAvg.toFixed(2)},${result.culturalVsMetric.humanAvg.toFixed(2)},${result.culturalVsMetric.culturalAvg.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantitative_qualitative_comparison_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Analysis</CardTitle>
          <CardDescription>Select specific models and countries for detailed comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="All Models">All Models</option>
                <option value="flux">Flux</option>
                <option value="hidream">HiDream</option>
                <option value="nextstep">NextStep</option>
                <option value="qwen">Qwen</option>
                <option value="sd35">SD35</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <select 
                value={selectedCountry} 
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="All Countries">All Countries</option>
                <option value="china">China</option>
                <option value="india">India</option>
                <option value="kenya">Kenya</option>
                <option value="nigeria">Nigeria</option>
                <option value="korea">Korea</option>
                <option value="south korea">South Korea</option>
                <option value="united states">United States</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalHumanResponses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total human evaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Image Quality Correlation</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.averageImageQualityCorrelation.toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">Human vs CLIP Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cultural Correlation</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.averageCulturalCorrelation.toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">Human vs Cultural Metric</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Discrepancy</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.averageDiscrepancy.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Score Difference</p>
          </CardContent>
        </Card>
      </div>

      {/* Download Report */}
      <Card>
        <CardHeader>
          <CardTitle>Export Analysis</CardTitle>
          <CardDescription>Download detailed comparison results</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadReport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </CardContent>
      </Card>

      {/* Quantitative vs Qualitative Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Quantitative vs Qualitative Evaluation Comparison</CardTitle>
          <CardDescription>Detailed comparison between automated metrics and human evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {comparisonResults.map((result, index) => (
              <div key={`${result.model}_${result.country}_${index}`} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="capitalize text-lg">
                      {result.model}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="capitalize text-lg font-medium">{result.country}</span>
                    </div>
                  </div>
                  <Badge variant={result.imageQualityVsClip.correlation > 0.3 ? 'default' : 'destructive'}>
                    {result.imageQualityVsClip.correlation > 0.3 ? 'Good Alignment' : 'Poor Alignment'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Quality Comparison */}
                  <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
                    Image Quality Analysis
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Human Evaluation (1-5):</span>
                      <span className="text-lg font-bold text-gray-800">
                        {result.imageQualityVsClip.humanAvg.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">CLIP Score (0-100):</span>
                      <span className="text-lg font-bold text-gray-800">
                        {result.imageQualityVsClip.clipAvg.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Normalized CLIP (1-5):</span>
                      <span className="text-lg font-bold text-gray-800">
                        {(result.imageQualityVsClip.clipAvg / 20).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="font-medium">Difference:</span>
                      <span className="text-lg font-bold text-gray-800">
                        {result.imageQualityVsClip.difference.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  </div>

                  {/* Cultural Representation Comparison */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center">
                      <Target className="h-5 w-5 mr-2 text-gray-600" />
                      Cultural Representation Analysis
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Human Evaluation (1-5):</span>
                        <span className="text-lg font-bold text-gray-800">
                          {result.culturalVsMetric.humanAvg.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Cultural Metric (1-5):</span>
                        <span className="text-lg font-bold text-gray-800">
                          {result.culturalVsMetric.culturalAvg.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-medium">Difference:</span>
                        <span className="text-lg font-bold text-gray-800">
                          {result.culturalVsMetric.difference.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best/Worst Selection Analysis */}
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                    Best/Worst Selection Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h5 className="font-medium text-gray-800 mb-2">Human Best Steps</h5>
                      <div className="space-y-1">
                        {Object.entries(result.bestWorstAlignment.humanBestSteps)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([step, count]) => (
                          <div key={step} className="flex justify-between text-sm">
                            <span>{step}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h5 className="font-medium text-gray-800 mb-2">Human Worst Steps</h5>
                      <div className="space-y-1">
                        {Object.entries(result.bestWorstAlignment.humanWorstSteps)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([step, count]) => (
                          <div key={step} className="flex justify-between text-sm">
                            <span>{step}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h5 className="font-medium text-gray-800 mb-2">Automated Best Steps</h5>
                      <div className="space-y-1">
                        {Object.entries(result.bestWorstAlignment.metricBestSteps)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([step, count]) => (
                          <div key={step} className="flex justify-between text-sm">
                            <span>{step}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">Automated Worst Steps</h5>
                      <div className="space-y-1">
                        {Object.entries(result.bestWorstAlignment.metricWorstSteps).length > 0 ? (
                          Object.entries(result.bestWorstAlignment.metricWorstSteps)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([step, count]) => (
                            <div key={step} className="flex justify-between text-sm">
                              <span>{step}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">No automated worst steps data available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <h5 className="font-semibold mb-2">Summary</h5>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Image Quality:</strong> Humans rated {result.imageQualityVsClip.humanAvg.toFixed(2)}/5, 
                      while CLIP scored {result.imageQualityVsClip.clipAvg.toFixed(2)}/100 
                      (normalized: {(result.imageQualityVsClip.clipAvg / 20).toFixed(2)}/5)
                    </p>
                    <p>
                      <strong>Cultural Representation:</strong> Humans rated {result.culturalVsMetric.humanAvg.toFixed(2)}/5, 
                      while automated metrics scored {result.culturalVsMetric.culturalAvg.toFixed(2)}/5
                    </p>
                    <p>
                      <strong>Best/Worst Alignment:</strong> {result.bestWorstAlignment.alignmentScore.toFixed(3)} 
                      ({result.bestWorstAlignment.alignmentScore > 0.5 ? 'Good' : 'Poor'} alignment)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantitativeQualitativeComparison;