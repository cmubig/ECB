'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreSliderProps {
  title: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function ScoreSlider({
  title,
  description,
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
}: ScoreSliderProps) {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  const getScoreLabel = (score: number) => {
    const labels = {
      1: 'Very Poor',
      2: 'Poor',
      3: 'Average',
      4: 'Good',
      5: 'Excellent',
    };
    return labels[score as keyof typeof labels] || score.toString();
  };

  const getScoreColor = (score: number) => {
    if (score <= 2) return 'text-red-600';
    if (score === 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`slider-${title}`} className="text-sm font-medium">
              Score: {value}
            </Label>
            <span className={`text-sm font-medium ${getScoreColor(value)}`}>
              {getScoreLabel(value)}
            </span>
          </div>
          
          <Slider
            id={`slider-${title}`}
            min={min}
            max={max}
            step={step}
            value={[value]}
            onValueChange={handleValueChange}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min} - Very Poor</span>
            <span>{max} - Excellent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
