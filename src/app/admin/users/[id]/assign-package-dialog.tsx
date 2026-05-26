"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assignPackageAction } from "@/lib/actions";

interface Package {
  id: string;
  name: string;
  creditsCount: number;
  validityDays: number;
  pricePln: any; // Decimal
}

export function AssignPackageDialog({
  userId,
  packages,
}: {
  userId: string;
  packages: Package[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  // Domyślna data ważności = dzisiaj + validityDays z pakietu
  const defaultExpiry = selectedPackage
    ? new Date(Date.now() + selectedPackage.validityDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : "";

  function onSubmit(formData: FormData) {
    formData.set("userId", userId);
    startTransition(async () => {
      const result = await assignPackageAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Pakiet przypisany");
        setOpen(false);
        setSelectedPackageId("");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Przypisz pakiet
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
        <h2 className="mb-4 text-xl font-semibold">Przypisz pakiet klientowi</h2>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="packageId">Pakiet</Label>
            <select
              id="packageId"
              name="packageId"
              required
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Wybierz...</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {Number(p.pricePln).toFixed(2)} zł ({p.validityDays} dni)
                </option>
              ))}
            </select>
          </div>

          {selectedPackage && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div>
                <strong>Godzin treningowych:</strong> {selectedPackage.creditsCount}
              </div>
              <div>
                <strong>Ważność:</strong> {selectedPackage.validityDays} dni od dziś
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Data ważności (możesz nadpisać)</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={defaultExpiry}
              key={defaultExpiry}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notatka (np. forma płatności)</Label>
            <Input id="notes" name="notes" placeholder="np. opłacone gotówką 13.05" />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending || !selectedPackageId} className="flex-1">
              {isPending ? "Przypisywanie..." : "Przypisz pakiet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
