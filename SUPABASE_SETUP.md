# MEU Atlas - pași Supabase + GitHub Pages

## 1. Creezi proiectul Supabase

1. Intră pe https://supabase.com/dashboard.
2. New project.
3. Name: `meu-atlas`.
4. Region: alege cea mai apropiată regiune europeană disponibilă.
5. Salvează parola de database într-un loc sigur.

## 2. Creezi baza de date

1. În proiect, mergi la **SQL Editor**.
2. New query.
3. Lipește tot conținutul din `supabase-schema.sql`.
4. Run.

Schema creează tabele pentru membri, profiluri/conturi, roluri, task-uri, loguri, pontaj, riscuri și fișiere.

## 3. Setezi autentificarea

Supabase Auth folosește email + parolă nativ. Pentru experiența cerută de noi, cu username + parolă, aplicația va transforma username-ul într-un email intern:

`admin.meu` devine `admin.meu@meu-atlas.local`

Utilizatorul vede doar username-ul. Supabase primește emailul tehnic.

În Supabase:

1. Authentication > Providers.
2. Email provider: Enabled.
3. Pentru pilot intern, dezactivează public signups dacă vrei conturi create doar de Admin.
4. Authentication > URL Configuration:
   - Site URL: linkul GitHub Pages.
   - Redirect URLs: același link GitHub Pages.

## 4. Creezi contul Admin inițial

1. Authentication > Users.
2. Add user.
3. Email: `admin.meu@meu-atlas.local`.
4. Password: o parolă puternică.
5. După creare, mergi în Table Editor > `profiles`.
6. Adaugă rând:
   - `id`: UUID-ul userului creat în Auth.
   - `username`: `admin.meu`
   - `display_name`: `Admin MEU`
   - `role`: `Admin`
   - `member_id`: `MEM-0005`
   - `department_scope`: `Toate departamentele`
   - `status`: `Activ`

## 5. Crearea conturilor noi în aplicație

Pentru live, butonul **Creează cont** nu trebuie să folosească `service_role` în browser. Corect este:

1. Admin apasă Creează cont în MEU Atlas.
2. Aplicația cheamă o Supabase Edge Function.
3. Edge Function verifică dacă userul curent este Admin.
4. Edge Function creează userul în Supabase Auth și profilul în `profiles`.

Important: cheia `service_role` rămâne doar în Supabase Edge Function, niciodată în GitHub Pages.

## 6. Publicare pe GitHub Pages

1. Creezi repo GitHub, de exemplu `meu-atlas`.
2. Pui fișierele aplicației în repo:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `assets/meu-logo-albastru.png`
3. GitHub > repo > Settings > Pages.
4. Source: Deploy from branch.
5. Branch: `main`, folder `/root`.
6. Save.

GitHub îți va da un link de forma:

`https://username.github.io/meu-atlas/`

Acela devine linkul platformei până ai domeniu propriu.

## 7. Ce mai facem în cod înainte de live

1. Adăugăm `supabase-js`.
2. Înlocuim `localStorage` cu citire/scriere în tabele Supabase.
3. Legăm login-ul de Supabase Auth.
4. Legăm Admin > Creează cont de Edge Function.
5. Mutăm fișierele/dovezile în Supabase Storage sau Google Drive, în funcție de decizia finală.
