'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProgress, getAttributionResponses } from '@/lib/firestore';
import { getTotalQuestionsForModel } from '@/lib/dataset-loader';
import { UserProgress } from '@/types/survey';
import { Loader2, Play, CheckCircle, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

// Multi-loop edit models
const MULTI_LOOP_MODELS = [
  { 
    id: 'flux', 
    name: 'FLUX.1 Kontext [dev]', 
    description: 'Black Forest Labs',
    experimentType: 'Multi-loop edit'
  },
  { 
    id: 'hidream', 
    name: 'HiDream-E1.1', 
    description: 'HiDream AI',
    experimentType: 'Multi-loop edit'
  },
  { 
    id: 'nextstep', 
    name: 'NextStep-1-Large-Edit', 
    description: 'StepFun AI',
    experimentType: 'Multi-loop edit'
  },
  { 
    id: 'qwen', 
    name: 'Qwen-Image-Edit', 
    description: 'Alibaba Cloud',
    experimentType: 'Multi-loop edit'
  },
  { 
    id: 'sd35', 
    name: 'Stable Diffusion 3.5 Medium', 
    description: 'Stability AI',
    experimentType: 'Multi-loop edit'
  },
];

// For backward compatibility, use multi-loop models as default
const MODELS = MULTI_LOOP_MODELS;


// This will be loaded from actual CSV data

interface ModelProgressProps {
  modelId: string;
  modelName: string;
  description: string;
  completed: number;
  total: number;
  experimentType?: string;
}

function ModelProgressCard({ modelId, modelName, description, completed, total, experimentType }: ModelProgressProps) {
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
  const isCompleted = completed >= total;
  const isComingSoon = total === 0;

  return (
    <Card className="border-gray-200 shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">{modelName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            {experimentType && (
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 mt-2 text-xs">
                {experimentType}
              </Badge>
            )}
          </div>
          {isComingSoon ? (
            <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">
              Soon
            </Badge>
          ) : isCompleted ? (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          {isComingSoon ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Data coming soon</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{completed} / {total}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-500">
                
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <Link href={`/survey?model=${modelId}`}>
            <Button 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isCompleted || isComingSoon}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : isComingSoon ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Coming Soon
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {completed > 0 ? 'Continue' : 'Start'} Evaluation
                </>
              )}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface AttributionProgressProps {
  completed: boolean;
}

function AttributionProgressCard({ completed }: AttributionProgressProps) {
  return (
    <Card className="border-gray-200 shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">Attribution Evaluation</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Evaluate cultural attribute additions</p>
            <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50 mt-2 text-xs">
              Attribute addition
            </Badge>
          </div>
          {completed ? (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ImageIcon className="w-4 h-4" />
            <span>Base image transformation</span>
          </div>
        </div>
        
        <div className="mt-auto">
          {completed ? (
            <Button 
              className="w-full bg-gray-500 text-white cursor-not-allowed"
              disabled={true}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </Button>
          ) : (
            <Link href="/attribution">
              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Attribution Evaluation
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressDashboardProps {
  country: string;
}

export function ProgressDashboard({ country }: ProgressDashboardProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [modelQuestionCounts, setModelQuestionCounts] = useState<Record<string, number>>({});
  const [attributionCompleted, setAttributionCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        // Load user progress, question counts, and attribution responses in parallel
        const [userProgress, ...questionCounts] = await Promise.all([
          getUserProgress(user.uid),
          ...MODELS.map(model => getTotalQuestionsForModel(model.id, country))
        ]);
        
        setProgress(userProgress);
        
        // Create question counts object
        const counts: Record<string, number> = {};
        MODELS.forEach((model, index) => {
          counts[model.id] = questionCounts[index];
        });
        setModelQuestionCounts(counts);
        
        // Check attribution completion
        try {
          const attributionResponses = await getAttributionResponses(user.uid);
          setAttributionCompleted(attributionResponses.length > 0);
        } catch (error) {
          console.warn('Could not load attribution responses:', error);
          setAttributionCompleted(false);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, country]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
      </div>
    );
  }

  const totalCompleted = progress ? Object.values(progress.completed_by_model).flat().length : 0;
  const totalQuestions = Object.values(modelQuestionCounts).reduce((sum, count) => sum + count, 0);
  const overallProgress = totalQuestions > 0 ? (totalCompleted / totalQuestions) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Overall Progress */}
      <Card className="border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Overall Progress</CardTitle>
          <p className="text-sm text-gray-600">Your evaluation progress across all models for {country}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Completed</span>
              <span className="font-medium">{totalCompleted} / {totalQuestions}</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-xs text-gray-500">
              {Math.round(overallProgress)}% complete • {totalQuestions - totalCompleted} questions remaining
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Model Progress Cards */}
      <div>
        <h3 className="text-lg font-medium mb-4">Model Evaluations</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {MODELS.map((model) => {
            const completed = progress?.completed_by_model[model.id]?.length || 0;
            const total = modelQuestionCounts[model.id] || 0;
            return (
              <ModelProgressCard
                key={model.id}
                modelId={model.id}
                modelName={model.name}
                description={model.description}
                completed={completed}
                total={total}
                experimentType={model.experimentType}
              />
            );
          })}
          <AttributionProgressCard completed={attributionCompleted} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-gray-900">{MODELS.length}</div>
            <div className="text-xs text-gray-600">AI Models</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-gray-900">{totalCompleted}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-gray-900">{totalQuestions - totalCompleted}</div>
            <div className="text-xs text-gray-600">Remaining</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-light text-gray-900">{Math.round(overallProgress)}%</div>
            <div className="text-xs text-gray-600">Progress</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
