import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seedowanie bazy danych...");

  // ----- ADMIN -----
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "Admin",
      lastName: "Studio",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email} / hasło: ${adminPassword}`);

  // ----- TYPY ZAJĘĆ -----
  const classTypes = [
    { name: "FBW", slug: "fbw", description: "Full Body Workout - trening całego ciała", colorHex: "#ef4444", sortOrder: 1 },
    { name: "Zdrowe Plecy", slug: "zdrowe-plecy", description: "Trening wzmacniający mięśnie pleców i posturę", colorHex: "#10b981", sortOrder: 2 },
    { name: "Hyrox", slug: "hyrox", description: "Trening funkcjonalny w stylu Hyrox", colorHex: "#f59e0b", sortOrder: 3 },
  ];

  for (const ct of classTypes) {
    await prisma.classType.upsert({
      where: { slug: ct.slug },
      update: {},
      create: ct,
    });
  }
  console.log(`✅ Typy zajęć: ${classTypes.length}`);

  // ----- PAKIETY -----
  const packages = [
    { name: "Pakiet 1 trening", creditsCount: 1, pricePln: 60, validityDays: 30, sortOrder: 1 },
    { name: "Pakiet 4 treningi", creditsCount: 4, pricePln: 220, validityDays: 45, sortOrder: 2 },
    { name: "Pakiet 8 treningów", creditsCount: 8, pricePln: 400, validityDays: 60, sortOrder: 3 },
    { name: "Pakiet 12 treningów", creditsCount: 12, pricePln: 540, validityDays: 90, sortOrder: 4 },
  ];

  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({ where: { name: pkg.name } });
    if (!existing) {
      await prisma.package.create({ data: pkg });
    }
  }
  console.log(`✅ Pakiety: ${packages.length}`);

  // ----- USTAWIENIA -----
  const settings = [
    {
      key: "cancellation_window_hours",
      value: JSON.stringify(12),
      description: "Ile godzin przed zajęciami klient może anulować rezerwację bez utraty kredytu",
    },
    {
      key: "default_class_capacity",
      value: JSON.stringify(12),
      description: "Domyślna pojemność zajęć przy tworzeniu nowego terminu",
    },
    {
      key: "default_class_duration_minutes",
      value: JSON.stringify(60),
      description: "Domyślny czas trwania zajęć w minutach",
    },
    {
      key: "min_booking_hours_before_class",
      value: JSON.stringify(1),
      description: "Minimalna liczba godzin przed zajęciami aby można było się zapisać",
    },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { description: s.description },
      create: s,
    });
  }
  console.log(`✅ Ustawienia: ${settings.length}`);

  // ----- PRZYKŁADOWE ZAJĘCIA na najbliższy tydzień -----
  const fbw = await prisma.classType.findUnique({ where: { slug: "fbw" } });
  const zp = await prisma.classType.findUnique({ where: { slug: "zdrowe-plecy" } });
  const hyrox = await prisma.classType.findUnique({ where: { slug: "hyrox" } });

  if (fbw && zp && hyrox) {
    const now = new Date();
    const baseDate = new Date(now);
    baseDate.setHours(0, 0, 0, 0);

    const scheduleTemplate = [
      { dayOffset: 1, hour: 9, classTypeId: fbw.id, capacity: 12 },
      { dayOffset: 1, hour: 18, classTypeId: zp.id, capacity: 10 },
      { dayOffset: 2, hour: 9, classTypeId: hyrox.id, capacity: 8 },
      { dayOffset: 2, hour: 18, classTypeId: fbw.id, capacity: 12 },
      { dayOffset: 3, hour: 9, classTypeId: zp.id, capacity: 10 },
      { dayOffset: 4, hour: 18, classTypeId: fbw.id, capacity: 12 },
      { dayOffset: 4, hour: 19, classTypeId: hyrox.id, capacity: 8 },
      { dayOffset: 5, hour: 9, classTypeId: zp.id, capacity: 10 },
      { dayOffset: 6, hour: 10, classTypeId: fbw.id, capacity: 12 },
      { dayOffset: 6, hour: 11, classTypeId: hyrox.id, capacity: 8 },
    ];

    let created = 0;
    for (const item of scheduleTemplate) {
      const startsAt = new Date(baseDate);
      startsAt.setDate(startsAt.getDate() + item.dayOffset);
      startsAt.setHours(item.hour, 0, 0, 0);
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + 60);

      const existing = await prisma.class.findFirst({
        where: { classTypeId: item.classTypeId, startsAt },
      });
      if (!existing) {
        await prisma.class.create({
          data: {
            classTypeId: item.classTypeId,
            startsAt,
            endsAt,
            capacity: item.capacity,
            location: "Sala Główna",
          },
        });
        created++;
      }
    }
    console.log(`✅ Zajęcia: ${created} nowych terminów`);
  }

  console.log("🎉 Seed zakończony!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
