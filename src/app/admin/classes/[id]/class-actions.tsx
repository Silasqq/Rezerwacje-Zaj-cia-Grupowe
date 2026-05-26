"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelClassAction, deleteClassAction } from "@/lib/actions";

export function ClassActions({ classId, status }: { classId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    const reason = prompt("Powód anulowania (opcjonalny):") ?? undefined;
    if (!confirm("Anulować zajęcia? Wszystkie kredyty wrócą do klientów.")) return;

    startTransition(async () => {
      const result = await cancelClassAction(classId, reason);
      if (result.ok) toast.success(result.message ?? "Anulowano");
      else toast.error(result.error);
    });
  }

  function handleDelete() {
    if (!confirm("Usunąć zajęcia? Tej akcji nie można cofnąć.")) return;
    startTransition(async () => {
      const result = await deleteClassAction(classId);
      if (result.ok) {
        toast.success(result.message ?? "Usunięto");
        router.push("/admin/classes");
      } else toast.error(result.error);
    });
  }

  return (
    <div className="flex gap-2 pt-2">
      {status !== "CANCELLED" && (
        <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isPending}>
          Anuluj zajęcia
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleDelete} disabled={isPending}>
        Usuń
      </Button>
    </div>
  );
}
