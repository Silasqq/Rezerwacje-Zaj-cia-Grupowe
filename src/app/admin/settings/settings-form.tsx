"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingAction } from "@/lib/actions";

interface SettingsFormProps {
  settings: {
    cancellation_window_hours: number;
    default_class_capacity: number;
    default_class_duration_minutes: number;
    min_booking_hours_before_class: number;
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(settings);

  const settingDefs = [
    {
      key: "cancellation_window_hours" as const,
      label: "Okno anulowania (godziny)",
      description:
        "Ile godzin przed zajęciami klient może anulować rezerwację bez utraty kredytu. Po tym czasie godzina przepada.",
      min: 0,
      max: 168,
    },
    {
      key: "min_booking_hours_before_class" as const,
      label: "Minimalny czas zapisu przed zajęciami (godziny)",
      description: "Jak długo przed zajęciami zapisy są jeszcze otwarte.",
      min: 0,
      max: 48,
    },
    {
      key: "default_class_capacity" as const,
      label: "Domyślna pojemność zajęć",
      description: "Domyślna liczba miejsc przy tworzeniu nowych zajęć.",
      min: 1,
      max: 100,
    },
    {
      key: "default_class_duration_minutes" as const,
      label: "Domyślny czas trwania (minuty)",
      description: "Domyślny czas trwania zajęć przy tworzeniu nowych terminów.",
      min: 15,
      max: 240,
    },
  ];

  function handleSave(key: keyof typeof settings) {
    const value = values[key];
    startTransition(async () => {
      const result = await updateSettingAction(key, value);
      if (result.ok) toast.success("Zapisano");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {settingDefs.map((def) => (
        <div key={def.key} className="space-y-2 rounded-lg border p-4">
          <Label htmlFor={def.key}>{def.label}</Label>
          <p className="text-xs text-muted-foreground">{def.description}</p>
          <div className="flex gap-2">
            <Input
              id={def.key}
              type="number"
              min={def.min}
              max={def.max}
              value={values[def.key]}
              onChange={(e) =>
                setValues({ ...values, [def.key]: Number(e.target.value) })
              }
              className="max-w-[160px]"
            />
            <Button
              type="button"
              onClick={() => handleSave(def.key)}
              disabled={isPending || values[def.key] === settings[def.key]}
            >
              Zapisz
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
