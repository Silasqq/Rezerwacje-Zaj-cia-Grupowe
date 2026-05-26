import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { ClassActions } from "./class-actions";

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      classType: true,
      reservations: {
        include: { user: true },
        orderBy: { reservedAt: "asc" },
      },
    },
  });

  if (!cls) notFound();

  const confirmed = cls.reservations.filter((r) => r.status === "CONFIRMED");
  const cancelled = cls.reservations.filter(
    (r) =>
      r.status === "CANCELLED_BY_USER" ||
      r.status === "CANCELLED_LATE" ||
      r.status === "CANCELLED_BY_ADMIN",
  );

  return (
    <>
      <MainNav role="ADMIN" userName={userName} />
      <main className="container space-y-6 py-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/classes">
            <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{cls.classType.name}</CardTitle>
                <CardDescription>{formatDateTime(cls.startsAt)}</CardDescription>
              </div>
              {cls.status === "CANCELLED" && <Badge variant="destructive">Anulowane</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Pojemność</div>
                <div className="font-medium">
                  {confirmed.length} / {cls.capacity}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Lokalizacja</div>
                <div className="font-medium">{cls.location ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Czas trwania</div>
                <div className="font-medium">
                  {Math.round((cls.endsAt.getTime() - cls.startsAt.getTime()) / 60000)} min
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Okno anulowania</div>
                <div className="font-medium">
                  {cls.cancellationWindowHours ?? "globalne"}{" "}
                  {cls.cancellationWindowHours ? "h" : ""}
                </div>
              </div>
            </div>
            {cls.notes && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="text-xs font-medium uppercase text-muted-foreground">Notatki</div>
                {cls.notes}
              </div>
            )}
            <ClassActions classId={cls.id} status={cls.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista uczestników ({confirmed.length})</CardTitle>
            <CardDescription>Klienci zapisani na te zajęcia</CardDescription>
          </CardHeader>
          <CardContent>
            {confirmed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak zapisanych klientów</p>
            ) : (
              <div className="space-y-2">
                {confirmed.map((r, idx) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">
                        {idx + 1}. {r.user.firstName} {r.user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.user.email} {r.user.phone && `• ${r.user.phone}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {cancelled.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Anulowane rezerwacje ({cancelled.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cancelled.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      {r.user.firstName} {r.user.lastName}
                    </div>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
