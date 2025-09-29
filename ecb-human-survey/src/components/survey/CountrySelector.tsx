'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const COUNTRIES = [
  { value: 'China', label: 'China', flag: '🇨🇳' },
  { value: 'India', label: 'India', flag: '🇮🇳' },
  { value: 'Kenya', label: 'Kenya', flag: '🇰🇪' },
  { value: 'Korea', label: 'Korea', flag: '🇰🇷' },
  { value: 'Nigeria', label: 'Nigeria', flag: '🇳🇬' },
  { value: 'United States', label: 'United States', flag: '🇺🇸' },
];

interface CountrySelectorProps {
  onCountrySelected?: () => void;
}

export function CountrySelector({ onCountrySelected }: CountrySelectorProps) {
  const { userProfile, updateUserCountry, loading } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState(userProfile?.selected_country || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCountry = async () => {
    if (!selectedCountry) {
      toast.error('Please select a country.');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateUserCountry(selectedCountry);
      toast.success('Country saved successfully!');
      if (onCountrySelected) {
        onCountrySelected();
      }
    } catch (error) {
      toast.error('Failed to save country.', {
        description: (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCountryData = COUNTRIES.find(c => c.value === selectedCountry);

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={loading || isSaving}>
          <SelectTrigger className="w-full border-gray-300 focus:border-gray-500">
            <SelectValue placeholder="Select your country..." />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCountryData && (
          <div className="text-center space-y-2 p-3 bg-gray-100 rounded border">
            <div className="text-xl">{selectedCountryData.flag}</div>
            <div className="font-medium text-gray-900">{selectedCountryData.label}</div>
            <p className="text-xs text-gray-600">
              You will evaluate images related to {selectedCountryData.label} culture
            </p>
          </div>
        )}
      </div>

      <Button 
        onClick={handleSaveCountry} 
        disabled={!selectedCountry || isSaving || loading}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Country'
        )}
      </Button>
    </div>
  );
}