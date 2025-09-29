'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModelSurvey } from './ModelSurvey';

const MODELS = [
  { id: 'flux', name: 'Flux' },
  { id: 'hidream', name: 'HiDream' },
  { id: 'nextstep', name: 'NextStep' },
  { id: 'qwen', name: 'Qwen' },
  { id: 'sd35', name: 'SD3.5' },
];

interface ModelTabsProps {
  selectedCountry: string;
  initialModel?: string | null;
}

export function ModelTabs({ selectedCountry, initialModel }: ModelTabsProps) {
  const [activeModel, setActiveModel] = useState(() => {
    // Use initialModel if provided and valid, otherwise default to first model
    if (initialModel && MODELS.some(m => m.id === initialModel)) {
      return initialModel;
    }
    return MODELS[0].id;
  });

  // Update active model if initialModel changes
  useEffect(() => {
    if (initialModel && MODELS.some(m => m.id === initialModel)) {
      setActiveModel(initialModel);
    }
  }, [initialModel]);

  return (
    <Tabs value={activeModel} onValueChange={setActiveModel} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-8">
        {MODELS.map((model) => (
          <TabsTrigger key={model.id} value={model.id} className="text-sm">
            {model.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {MODELS.map((model) => (
        <TabsContent key={model.id} value={model.id}>
          <ModelSurvey model={model.id} country={selectedCountry} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
