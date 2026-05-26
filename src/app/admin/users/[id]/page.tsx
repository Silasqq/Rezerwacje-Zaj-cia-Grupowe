import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatShortDate } from "@/lib/utils";
import { AssignPackageDialog } from "./assign-package-dialog";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");

  const [user, packages] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        userPackages: {
          include: { package: true, assignedByAdmin: true },
          orderBy: { purchasedAt: "desc" },
        },
        reservations: {
          include: { class: { include: { classType: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!user) notFound();

  const activePackages = user.userPackages.filter(
    (up) =>
      up.creditsRemaining > 0 && (!up.expiresAt || up.expiresAt > new Date()),
  );
  const totalActiveCredits = activePackages.reduce(
    (sum, up) => sum + up.creditsRemaining,
    0,
  );

  return (
    <>
      <MainNav role="ADMIN" userName={userName} />
      <main className="container space-y-6 py-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy klientów
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {user.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Klient od {formatShortDate(user.createdAt)}
              </span>
            </div>
          </div>
          <AssignPackageDialog userId={user.id} packages={packages} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dostępne godziny</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalActiveCredits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aktywne pakiety</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activePackages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Wszystkie rezerwacje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{user.reservations.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historia pakietów</CardTitle>
            <CardDescription>Wszystkie przypisane do klienta pakiety</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.userPackages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak pakietów. Kliknij &quot;Przypisz pakiet&quot; powyżej.
              </p>
            ) : (
              user.userPackages.map((up) => {
                const isExpired = up.expiresAt && up.expiresAt < new Date();
                const isUsedUp = up.creditsRemaining === 0;
                return (
                  <div key={up.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{up.package.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Przypisany: {formatShortDate(up.purchasedAt)}
                          {up.expiresAt && ` • Ważny do: ${formatShortDate(up.expiresAt)}`}
                          {up.assignedByAdmin &&
                            ` • przez: ${up.assignedByAdmin.firstName} ${up.assignedByAdmin.lastName}`}
                        </div>
                        {up.notes && (
                          <div className="mt-1 text-xs italic text-muted-foreground">
                            &ldquo;{up.notes}&rdquo;
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={isExpired || isUsedUp ? "outline" : "success"}>
                          {up.creditsRemaining} / {up.creditsTotal}
                        </Badge>
                        {isExpired && <Badge variant="destructive">Wygasł</Badge>}
                        {isUsedUp && !isExpired && <Badge variant="secondary">Wykorzystany</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historia rezerwacji ({user.reservations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak rezerwacji</p>
            ) : (
              user.reservations.map((r) => {
                const statusLabel = {
                  CONFIRMED: { text: "Potwierdzona", variant: "success" as const },
                  CANCELLED_BY_USER: { text: "Anulowana", variant: "secondary" as const },
                  CANCELLED_LATE: { text: "Za późno", variant: "warning" as const },
                  CANCELLED_BY_ADMIN: { text: "Przez studio", variant: "outline" as const },
                  NO_SHOW: { text: "Nieobecność", variant: "destructive" as const },
                  ATTENDED: { text: "Obecność", variant: "success" as const },
                }[r.status];

                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <div className="font-medium">{r.class.classType.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(r.class.startsAt)}
                      </div>
                    </div>
                    <Badge variant={statusLabel.variant}>{statusLabel.text}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
