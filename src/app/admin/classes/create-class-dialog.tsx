"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClassAction } from "@/lib/actions";

interface ClassType {
  id: string;
  name: string;
  durationMinutes: number;
}

export function CreateClassDialog({ classTypes }: { classTypes: ClassType[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createClassAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Zajęcia utworzone");
        setOpen(false);
      } else toast.error(result.error);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Dodaj zajęcia
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold">Nowe zajęcia</h2>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classTypeId">Rodzaj zajęć</Label>
            <select
              id="classTypeId"
              name="classTypeId"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Wybierz...</option>
              {classTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startsAt">Data i godzina</Label>
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Czas (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={15}
                max={240}
                defaultValue={60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Limit miejsc</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                max={100}
                defaultValue={12}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Sala / lokalizacja</Label>
            <Input id="location" name="location" placeholder="Sala Główna" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancellationWindowHours">
              Okno anulowania w h (puste = globalne ustawienie)
            </Label>
            <Input
              id="cancellationWindowHours"
              name="cancellationWindowHours"
              type="number"
              min={0}
              placeholder="np. 12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notatki (opcjonalnie)</Label>
            <Input id="notes" name="notes" placeholder="np. weź matę" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Tworzenie..." : "Utwórz"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
