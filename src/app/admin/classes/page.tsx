import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { CreateClassDialog } from "./create-class-dialog";

export default async function AdminClassesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");

  const [classTypes, classes] = await Promise.all([
    prisma.classType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.class.findMany({
      where: { startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: {
        classType: true,
        _count: { select: { reservations: { where: { status: "CONFIRMED" } } } },
      },
      orderBy: { startsAt: "asc" },
      take: 100,
    }),
  ]);

  return (
    <>
      <MainNav role="ADMIN" userName={userName} />
      <main className="container space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Zarządzanie zajęciami</h1>
            <p className="text-muted-foreground">Dodawaj i edytuj terminy treningów</p>
          </div>
          <CreateClassDialog classTypes={classTypes} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista zajęć</CardTitle>
            <CardDescription>Wszystkie zaplanowane zajęcia od dzisiaj</CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak zaplanowanych zajęć. Kliknij &quot;Dodaj zajęcia&quot; powyżej.
              </p>
            ) : (
              <div className="space-y-2">
                {classes.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/classes/${c.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-1 rounded-full"
                        style={{ backgroundColor: c.classType.colorHex }}
                      />
                      <div>
                        <div className="font-medium">{c.classType.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(c.startsAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.status === "CANCELLED" && <Badge variant="destructive">Anulowane</Badge>}
                      <Badge variant={c._count.reservations >= c.capacity ? "warning" : "secondary"}>
                        {c._count.reservations}/{c.capacity}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
