import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/utils";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const sp = await searchParams;
  const query = sp.q?.trim();
  const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");

  const users = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { email: { contains: query } },
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { phone: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      userPackages: {
        where: {
          creditsRemaining: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { creditsRemaining: true, expiresAt: true },
      },
      _count: {
        select: {
          reservations: { where: { status: "CONFIRMED" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <MainNav role="ADMIN" userName={userName} />
      <main className="container space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Klienci</h1>
          <p className="text-muted-foreground">{users.length} klientów na liście</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Wyszukaj klienta</CardTitle>
            <CardDescription>Po imieniu, nazwisku, emailu lub telefonie</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="get" className="flex gap-2">
              <Input
                name="q"
                placeholder="np. Jan Kowalski lub jan@example.com"
                defaultValue={query ?? ""}
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Szukaj
              </button>
              {query && (
                <Link
                  href="/admin/users"
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Wyczyść
                </Link>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista klientów</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak wyników</p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => {
                  const totalCredits = u.userPackages.reduce(
                    (sum, up) => sum + up.creditsRemaining,
                    0,
                  );
                  const hasActivePackage = u.userPackages.length > 0;

                  return (
                    <Link
                      key={u.id}
                      href={`/admin/users/${u.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div>
                        <div className="font-medium">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                          {u.phone && ` • ${u.phone}`}
                          {` • Klient od ${formatShortDate(u.createdAt)}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {u._count.reservations} rezerwacji
                        </Badge>
                        {hasActivePackage ? (
                          <Badge variant="success">{totalCredits} godz.</Badge>
                        ) : (
                          <Badge variant="outline">Brak pakietu</Badge>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
