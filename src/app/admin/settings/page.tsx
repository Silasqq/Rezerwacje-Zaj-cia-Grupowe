import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");
  const settings = await getAllSettings();

  return (
    <>
      <MainNav role="ADMIN" userName={userName} />
      <main className="container space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Ustawienia</h1>
          <p className="text-muted-foreground">Globalne ustawienia systemu rezerwacji</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Polityka rezerwacji</CardTitle>
            <CardDescription>
              Te wartości obowiązują domyślnie dla wszystkich zajęć. Można je nadpisać per zajęcia
              (przy edycji konkretnych zajęć).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
