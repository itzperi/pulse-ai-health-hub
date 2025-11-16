import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  generic_name: string;
  default_dosage: string;
}

interface MedicationEntry {
  medication_id: string;
  name: string;
  dosage: string;
  days: number;
  instructions: string;
  quantity: number;
}

interface Props {
  medications: MedicationEntry[];
  onAdd: (med: MedicationEntry) => void;
  onRemove: (index: number) => void;
}

export function MedicineAutocomplete({ medications, onAdd, onRemove }: Props) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [dosage, setDosage] = useState('');
  const [days, setDays] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (search.length > 0) {
      searchMedications();
    } else {
      setSuggestions([]);
    }
  }, [search]);

  const searchMedications = async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .ilike('name', `%${search}%`)
      .limit(10);

    if (error) {
      console.error('Error searching medications:', error);
      return;
    }

    setSuggestions(data || []);
  };

  const handleSelectMedication = (med: Medication) => {
    setSearch(med.name);
    setDosage(med.default_dosage);
    setSuggestions([]);
  };

  const handleAddMedication = () => {
    if (!search || !dosage || !days) return;

    const selectedMed = suggestions.find(m => m.name === search);
    
    onAdd({
      medication_id: selectedMed?.id || '',
      name: search,
      dosage,
      days: parseInt(days),
      instructions,
      quantity: parseInt(days)
    });

    // Reset form
    setSearch('');
    setDosage('');
    setDays('');
    setInstructions('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search Medicine</Label>
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type medicine name (e.g., Dolo)"
          />
          {suggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((med) => (
                <button
                  key={med.id}
                  onClick={() => handleSelectMedication(med)}
                  className="w-full text-left px-4 py-2 hover:bg-accent transition-colors"
                >
                  <div className="font-medium">{med.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {med.generic_name} - {med.default_dosage}
                  </div>
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Dosage</Label>
          <Input
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g., 650mg"
          />
        </div>
        <div>
          <Label>Days</Label>
          <Input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Number of days"
          />
        </div>
        <div>
          <Label>Instructions</Label>
          <Input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="After meals"
          />
        </div>
      </div>

      <Button type="button" onClick={handleAddMedication} variant="outline" className="w-full">
        Add Medication
      </Button>

      {/* Display added medications */}
      {medications.length > 0 && (
        <div className="space-y-2">
          <Label>Added Medications</Label>
          {medications.map((med, index) => (
            <Card key={index} className="p-3 flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{med.name}</div>
                <div className="text-sm text-muted-foreground">
                  {med.dosage} - {med.days} days - {med.instructions || 'No instructions'}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}