import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPackagesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");

  const packages = await prisma.package.findMany({
    include: {
      _count: { select: { userPackages: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <MainNav role="ADMIN" userName={userName} />
      <main className="container space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Pakiety</h1>
          <p className="text-muted-foreground">Dostępne pakiety treningowe</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista pakietów</CardTitle>
            <CardDescription>
              Edycja pakietów w MVP odbywa się przez bazę danych - skontaktuj się z administratorem
              technicznym
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {packages.map((p) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{p.name}</h3>
                        {!p.isActive && <Badge variant="outline">Nieaktywny</Badge>}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Godziny</div>
                          <div className="font-medium">{p.creditsCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Cena</div>
                          <div className="font-medium">{Number(p.pricePln).toFixed(2)} zł</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Ważność</div>
                          <div className="font-medium">{p.validityDays} dni</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Przypisany</div>
                          <div className="font-medium">{p._count.userPackages}×</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jak edytować pakiety?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              W obecnej wersji (Faza 1) pakiety są zarządzane przez seed bazy danych. Aby zmienić
              cennik lub dodać nowy pakiet:
            </p>
            <ol className="ml-5 list-decimal space-y-1">
              <li>
                Otwórz hPanel Hostingera → Bazy danych MySQL → phpMyAdmin → tabela{" "}
                <code className="rounded bg-muted px-1">packages</code>
              </li>
              <li>Dodaj/edytuj wiersz (zachowując format pól)</li>
              <li>Zmiany są widoczne natychmiast</li>
            </ol>
            <p className="mt-2">
              W Fazie 2 (po wdrożeniu płatności online) tutaj pojawi się pełen CRUD pakietów z
              edycją z UI.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
