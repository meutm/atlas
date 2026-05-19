# MEU Atlas live - ghid pe pasi simpli

Acesta este traseul corect:

**GitHub Pages = locul unde sta interfata**

**Supabase = locul unde stau login-ul, conturile, baza de date si permisiunile**

## Partea A - Pui platforma pe GitHub Pages

### 1. Creezi cont GitHub

Intri pe https://github.com si iti faci cont, daca nu ai deja.

### 2. Creezi un repository nou

1. Apesi butonul **+** din dreapta sus.
2. Alegi **New repository**.
3. La nume pui: `meu-atlas`.
4. Bifezi **Public** sau **Private**. Pentru GitHub Pages simplu, Public e cel mai usor.
5. Apesi **Create repository**.

### 3. Incarci fisierele

In repository:

1. Apesi **Add file**.
2. Apesi **Upload files**.
3. Incarci:
   - `index.html`
   - `styles.css`
   - `app.js`
   - folderul `assets`
4. Apesi **Commit changes**.

Nu incarca documentele de lucru daca nu vrei sa fie publice.

### 4. Activezi GitHub Pages

1. In repository, mergi la **Settings**.
2. In meniul din stanga, mergi la **Pages**.
3. La **Source**, alegi **Deploy from a branch**.
4. La branch alegi `main`.
5. Folder: `/root`.
6. Save.

Dupa 1-2 minute, GitHub iti da un link de forma:

`https://username.github.io/meu-atlas/`

Acela este linkul temporar live.

## Partea B - Creezi Supabase

### 1. Creezi proiect Supabase

1. Intri pe https://supabase.com/dashboard.
2. Te loghezi cu GitHub.
3. Apesi **New project**.
4. Nume proiect: `meu-atlas`.
5. La database password pui o parola foarte puternica.
6. Region: alege o regiune din Europa.
7. Apesi **Create new project**.

### 2. Creezi tabelele

1. In Supabase, intri in proiect.
2. In stanga, apesi **SQL Editor**.
3. Apesi **New query**.
4. Copiezi tot din fisierul `supabase-schema.sql`.
5. Lipesti in SQL Editor.
6. Apesi **Run**.

Gata: ai baza de date.

### 3. Activezi login cu parola

1. In stanga, mergi la **Authentication**.
2. Mergi la **Providers**.
3. Verifica sa fie activ **Email**.

Noi vrem username + parola, dar Supabase lucreaza nativ cu email + parola.

Solutia noastra:

`admin.meu` devine in spate `admin.meu@meu-atlas.local`

Utilizatorul vede username. Supabase primeste email tehnic.

### 4. Pui linkul GitHub Pages in Supabase

1. Authentication > URL Configuration.
2. La **Site URL**, pui linkul tau GitHub Pages:

`https://username.github.io/meu-atlas/`

3. La **Redirect URLs**, adaugi acelasi link.
4. Save.

### 5. Gasesti cheile Supabase

1. In stanga, mergi la **Project Settings**.
2. Mergi la **API**.
3. Copiezi:
   - Project URL
   - anon public key

Atentie: `anon public key` poate sta in frontend. `service_role key` NU se pune niciodata in GitHub Pages.

## Partea C - Conectam codul la Supabase

Am facut deja conexiunea in cod pentru proiectul tau Supabase:

- Project URL: `https://rwrrtgnsslyquyjaakwb.supabase.co`
- GitHub Pages: `https://meutm.github.io/atlas/`

Acum trebuie doar sa urci fisierele actualizate pe GitHub Pages.

Incarca in repo:

- `index.html`
- `styles.css`
- `app.js`
- folderul `assets`

Dupa upload, intri pe:

`https://meutm.github.io/atlas/`

Login-ul va folosi Supabase:

- username: `admin.meu`
- parola: parola userului `admin.meu@meu-atlas.local` din Supabase Auth

## Partea D - Contul Admin initial

Inainte sa functioneze tot, trebuie creat primul Admin.

In Supabase:

1. Authentication > Users.
2. Add user.
3. Email:

`admin.meu@meu-atlas.local`

4. Password: alegi o parola.
5. Create user.

Apoi:

1. Table Editor.
2. Tabelul `profiles`.
3. Insert row.
4. Completezi:
   - `id`: copiezi UUID-ul userului din Authentication > Users.
   - `username`: `admin.meu`
   - `display_name`: `Admin MEU`
   - `role`: `Admin`
   - `member_id`: `MEM-0005`
   - `department_scope`: `Toate departamentele`
   - `status`: `Activ`

## Partea E - Crearea conturilor live

In varianta live, conturile se creeaza din:

**Admin > Conturi & acces > Creeaza cont**

Dar tehnic, pentru asta mai facem un pas: o **Supabase Edge Function**.

De ce?

Pentru ca doar serverul are voie sa creeze useri in Auth in siguranta.

Pe scurt:

1. Admin apasa Creeaza cont.
2. Aplicatia trimite cererea la Edge Function.
3. Edge Function verifica daca Adminul chiar e Admin.
4. Edge Function creeaza userul in Supabase Auth.
5. Edge Function creeaza profilul in `profiles`.

Nu punem cheia secreta in browser. Niciodata.

Fisierul functiei este deja pregatit aici:

`supabase/functions/create-account/index.ts`

Ca sa o publici, ai doua variante:

1. imi spui si o facem impreuna din calculatorul tau cu Supabase CLI;
2. o punem mai tarziu, dupa ce verificam login-ul si citirea datelor.

Pana atunci, butonul Creeaza cont ramane disponibil in UI, dar pentru conturi reale recomand sa nu-l folosesti live pana nu publicam functia.

## Partea E2 - Update-ul nou: registratura, realtime, Head

Pentru varianta noua trebuie sa rulezi in Supabase inca un fisier SQL:

`supabase-registry-realtime-head.sql`

Il rulezi asa:

1. Supabase > proiectul tau.
2. SQL Editor.
3. New query.
4. Copiezi tot din `supabase-registry-realtime-head.sql`.
5. Run.

Acest update face patru lucruri importante:

1. adauga modulul **Registratura**;
2. creeaza contorul atomic pentru numere de forma `MEUTM/0001/DD.MM.YYYY`;
3. activeaza realtime pentru task-uri, raportari, pontaj, riscuri, fisiere, membri, conturi si registratura;
4. schimba rolul vechi `Membru` in `Head`, dar pastreaza compatibilitatea cu datele vechi.

Important: numerele de registratura sunt generate de Supabase, nu de browser. Asta inseamna ca doi oameni pot apasa aproape in acelasi timp si tot nu primesc acelasi numar.

## Partea E3 - Publici functia create-account

Butonul **Admin > Conturi & acces > Creeaza cont** are nevoie de functia:

`supabase/functions/create-account/index.ts`

Pasii standard sunt:

1. Instalezi Supabase CLI.
2. Deschizi terminalul in folderul proiectului.
3. Rulezi:

```bash
supabase login
supabase link --project-ref rwrrtgnsslyquyjaakwb
supabase functions deploy create-account --project-ref rwrrtgnsslyquyjaakwb
```

Dupa deploy, testezi din platforma:

1. te loghezi cu `admin.meu`;
2. mergi la **Admin > Conturi & acces**;
3. apesi **Creeaza cont**;
4. alegi rolul `Head`;
5. salvezi;
6. verifici in Supabase > Authentication > Users ca userul a aparut.

Nu pune niciodata cheia `service_role` in `app.js`, `index.html` sau GitHub Pages. Ea trebuie sa ramana doar in Supabase / Edge Function.

## Partea E4 - Publici functia admin-tools pentru stergeri si reset teste

Pentru testare rapida, platforma are acum:

- butoane **Sterge** pe inregistrari;
- buton **Admin > Curata datele de test**;
- protectie pentru `admin.meu` si membrii de baza.

In Supabase, rulezi mai intai SQL-ul mic pentru resetarea contorului de registratura:

1. Supabase > SQL Editor.
2. New query.
3. Copiezi tot din `supabase-admin-tools.sql`.
4. Run.

Apoi publici Edge Function:

```bash
supabase functions deploy admin-tools --project-ref rwrrtgnsslyquyjaakwb --use-api
```

Pe Windows, daca folosesti varianta cu `npx.cmd`, comanda este:

```powershell
npx.cmd -y supabase@latest functions deploy admin-tools --project-ref rwrrtgnsslyquyjaakwb --use-api
```

Dupa deploy:

1. Intri live ca `admin.meu`.
2. Creezi un task / log / pontaj / numar de registratura de test.
3. Apesi **Sterge** pe acel element.
4. Pentru reset mare, mergi la **Admin > Curata datele de test**.

Resetul mare sterge datele introduse pentru teste: task-uri, loguri, pontaje, riscuri, fisiere, registratura, conturi create dupa `admin.meu` si membri adaugati peste structura initiala. Nu sterge `admin.meu` si nu sterge membrii de baza.

## Partea F - Ce imi trimiti mie dupa ce faci GitHub + Supabase

Trimite-mi:

1. Link GitHub Pages.
2. Supabase Project URL.
3. Supabase anon public key.
4. Parola pe care vrei sa o folosesti pentru `admin.meu`, sau imi spui sa o lasi tu manual.

Cu astea, eu fac conectarea reala.
