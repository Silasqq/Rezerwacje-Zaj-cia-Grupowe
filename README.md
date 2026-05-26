# 🏋️ Studio Treningów - System Rezerwacji

Aplikacja webowa do zarządzania rezerwacjami zajęć grupowych (FBW, Zdrowe Plecy, Hyrox).

**Stack:** Next.js 14 · TypeScript · Prisma · MySQL · Auth.js (NextAuth) · Tailwind CSS

## ✨ Funkcje (Faza 1 - MVP)

- 🔐 Rejestracja i logowanie klientów
- 📅 Tygodniowy kalendarz zajęć
- ✅ Zapisy i wypisy w czasie rzeczywistym (transakcyjne, bez race conditions)
- 🎫 System "godzin treningowych" (pojedyncze kredyty z dat wygaśnięcia)
- ⏰ Konfigurowalna polityka anulowania (domyślnie 12h)
- 👨‍💼 Pełen panel administracyjny:
  - Dashboard z metrykami
  - Zarządzanie zajęciami (tworzenie, edycja, anulowanie)
  - Zarządzanie klientami z wyszukiwaniem
  - Ręczne przypisywanie pakietów klientom
  - Lista uczestników na zajęcia
  - Ustawienia globalne

## 🚀 Deploy na Hostinger Business

Poniżej kompletna instrukcja od zera do działającej aplikacji.

### Krok 1: Przygotuj bazę MySQL

1. Zaloguj się do **hPanel** → **Bazy danych** → **Bazy danych MySQL**
2. Kliknij **Utwórz nową bazę MySQL**
3. Zapisz dane:
   - **Nazwa bazy**: np. `u123456789_booking`
   - **Nazwa użytkownika**: np. `u123456789_admin`
   - **Hasło**: wygeneruj mocne hasło
   - **Host**: zazwyczaj `localhost`

### Krok 2: Wygeneruj sekret Auth.js

W terminalu (Mac/Linux) lub Git Bash (Windows):

```bash
openssl rand -base64 32
```

Skopiuj wynik - to będzie `AUTH_SECRET`.

### Krok 3: Wrzuć kod na GitHub

```bash
# W katalogu projektu
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Stwórz nowe repozytorium na github.com, potem:
git remote add origin https://github.com/TWOJ-USERNAME/booking-app.git
git push -u origin main
```

### Krok 4: Podepnij aplikację w hPanel

1. **hPanel** → **Strony internetowe** → **Dodaj stronę**
2. Wybierz **Aplikacje Node.js**
3. Wybierz **Importuj repozytorium Git**
4. Autoryzuj GitHub i wybierz swoje repo
5. Framework powinien być wykryty automatycznie jako **Next.js**
6. Pozostaw domyślne ustawienia build:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Output directory: `.next`

### Krok 5: Dodaj zmienne środowiskowe

W ustawieniach aplikacji Node.js w hPanel dodaj:

```env
DATABASE_URL=mysql://u123456789_admin:TWOJE_HASLO@localhost:3306/u123456789_booking
AUTH_SECRET=wygenerowany_sekret_z_kroku_2
AUTH_URL=https://twoja-domena.pl
NEXTAUTH_URL=https://twoja-domena.pl
NEXT_PUBLIC_APP_URL=https://twoja-domena.pl
TZ=Europe/Warsaw

# Opcjonalnie - login domyślnego admina (jeśli nie podasz, użyje admin@example.com / Admin123!)
SEED_ADMIN_EMAIL=twoj.admin@email.pl
SEED_ADMIN_PASSWORD=MocneHasloAdmina123!
```

### Krok 6: Pierwszy deploy + utworzenie tabel

Po pierwszym deployu kod się zbuduje, ale baza będzie pusta. Musisz utworzyć tabele.

**Opcja A: Lokalnie (zalecane)**

1. W hPanel włącz **Remote MySQL** → dodaj swój IP (sprawdzisz go na `whatismyip.com`)
2. Zmień lokalny `.env`:
   ```env
   DATABASE_URL="mysql://u123456789_admin:HASLO@srv123.hstgr.io:3306/u123456789_booking"
   ```
   (host weź z hPanel → Bazy danych → "Nazwa serwera")
3. W terminalu:
   ```bash
   npm install
   npm run db:push      # utworzy tabele
   npm run db:seed      # utworzy admina i podstawowe dane
   ```

**Opcja B: Przez phpMyAdmin (alternatywa)**

1. Wygeneruj SQL: `npx prisma migrate dev --create-only` lokalnie
2. Skopiuj zawartość z `prisma/migrations/.../migration.sql`
3. W hPanel → **Bazy danych** → **phpMyAdmin** → zakładka SQL → wklej i wykonaj
4. Następnie potrzebujesz uruchomić seed - dla MVP najlepiej Opcja A

### Krok 7: Gotowe! 🎉

1. Wejdź na swoją domenę
2. Zaloguj się jako admin (login z `SEED_ADMIN_EMAIL` lub domyślny `admin@example.com` / `Admin123!`)
3. **Natychmiast zmień hasło admina** (na razie przez seed - w Fazie 2 dodamy zmianę hasła z UI)
4. Dodaj pierwsze zajęcia, przypisz pakiety klientom

### Aktualizacje

Każdy `git push` na branch `main` automatycznie redeployuje aplikację. Jeśli zmienisz schemat bazy:

```bash
# Lokalnie po zmianach w schema.prisma
npm run db:push
git add -A && git commit -m "Update schema" && git push
```

## 🛠️ Rozwój lokalny

```bash
# Wymagania: Node.js 18+, MySQL lub Docker
git clone <repo>
cd booking-app
npm install
cp .env.example .env
# Wypełnij DATABASE_URL (najprościej Docker: docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=booking mysql)
npm run db:push
npm run db:seed
npm run dev
# http://localhost:3000
```

Domyślne dane logowania (po seedzie):
- Admin: `admin@example.com` / `Admin123!`
- Klient: utwórz przez rejestrację

## 📁 Struktura projektu

```
booking-app/
├── prisma/
│   ├── schema.prisma       # Schemat bazy (Faza 1 + przygotowanie pod Fazę 2)
│   └── seed.ts             # Startowy admin, pakiety, typy zajęć
├── src/
│   ├── app/
│   │   ├── (public)/       # Landing, login, register
│   │   ├── dashboard/      # Panel klienta
│   │   ├── calendar/       # Kalendarz tygodniowy
│   │   ├── profile/        # Profil klienta
│   │   └── admin/          # Panel administratora
│   │       ├── classes/    # Zarządzanie zajęciami
│   │       ├── users/      # Zarządzanie klientami
│   │       ├── packages/   # Pakiety (read-only w MVP)
│   │       └── settings/   # Ustawienia globalne
│   ├── components/
│   │   ├── ui/             # shadcn-style komponenty
│   │   └── main-nav.tsx
│   ├── lib/
│   │   ├── prisma.ts       # Singleton Prisma
│   │   ├── booking.ts      # ❤️ Serce systemu - transakcyjna logika
│   │   ├── actions.ts      # Server Actions
│   │   ├── settings.ts     # Dostęp do konfiguracji
│   │   └── utils.ts        # Format dat, cn(), itp.
│   ├── auth.ts             # Konfiguracja Auth.js
│   └── middleware.ts       # Ochrona routów
└── package.json
```

## 🔒 Bezpieczeństwo

- Hasła hashowane bcrypt z saltem (12 rund)
- Session JWT z konfigurowalnym sekretem
- Middleware blokuje dostęp do `/admin/*` bez roli ADMIN
- Transakcje SERIALIZABLE chronią przed race conditions przy zapisach
- Audit log dla wszystkich operacji krytycznych (rezerwacje, anulowania, przypisania pakietów)
- Soft delete użytkowników (RODO-friendly)
- Walidacja danych przez Zod we wszystkich Server Actions

## 🎯 Faza 2 (zaplanowana, nieaktywna)

Schemat bazy zawiera już tabele pod Fazę 2:
- 💳 **Płatności online** (Przelewy24, Tpay, Stripe)
- 🎁 **Kody promocyjne** (procentowe, kwotowe, darmowe kredyty)
- 👥 **System poleceń** (referrer ↔ referred)
- 🏆 **Wyzwania i konkursy** (streaki, miesięczne challenge)
- 📧 **Powiadomienia** (email, SMS, push, in-app)

Tabele są gotowe - dodanie obsługi to wdrażanie kolejnych modułów bez migracji.

## 📞 Wsparcie

W przypadku problemów:
- Logi build/runtime w hPanel → Strony internetowe → Twoja aplikacja → Logi
- Hostinger automatycznie skanuje logi i sugeruje fixy
- AI Logs Assistant (w hPanel) potrafi pomóc przy typowych błędach

## 📄 Licencja

Wewnętrzny projekt studia treningowego.
