import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Package, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");

  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [totalUsers, activeClients, upcomingClasses, totalReservationsThisWeek, recentReservations] =
    await Promise.all([
      prisma.user.count({ where: { role: "CLIENT", deletedAt: null } }),
      prisma.user.count({
        where: {
          role: "CLIENT",
          deletedAt: null,
          userPackages: { some: { creditsRemaining: { gt: 0 } } },
        },
      }),
      prisma.class.findMany({
        where: { startsAt: { gte: now, lt: weekFromNow }, status: "SCHEDULED" },
        include: {
          classType: true,
          _count: { select: { reservations: { where: { status: "CONFIRMED" } } } },
        },
        orderBy: { startsAt: "asc" },
        take: 10,
      }),
      prisma.reservation.count({
        where: {
          status: "CONFIRMED",
          class: { startsAt: { gte: now, lt: weekFromNow } },
        },
      }),
      prisma.reservation.findMany({
        where: { status: "CONFIRMED" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          class: { include: { classType: true } },
        },
        orderBy: { reservedAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <>
      <MainNav role="ADMIN" userName={userName} />
      <main className="container space-y-8 py-8">
        <div>
          <h1 className="text-3xl font-bold">Panel administratora</h1>
          <p className="text-muted-foreground">Przegląd działalności studia</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wszyscy klienci</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktywni (z pakietem)</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zajęcia w tym tygodniu</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingClasses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rezerwacje (tydzień)</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalReservationsThisWeek}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Najbliższe zajęcia</CardTitle>
              <CardDescription>Nadchodzący tydzień</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak zajęć w nadchodzącym tygodniu</p>
              ) : (
                upcomingClasses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-1 rounded-full"
                        style={{ backgroundColor: c.classType.colorHex }}
                      />
                      <div>
                        <div className="font-medium">{c.classType.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(c.startsAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {c._count.reservations}/{c.capacity}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ostatnie rezerwacje</CardTitle>
              <CardDescription>5 najnowszych zapisów</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak rezerwacji</p>
              ) : (
                recentReservations.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="font-medium">
                      {r.user.firstName} {r.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.class.classType.name} • {formatDateTime(r.class.startsAt)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
