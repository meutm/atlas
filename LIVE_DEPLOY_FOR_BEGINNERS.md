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

Aici nu trebuie sa faci singur codul. Imi dai:

1. linkul GitHub Pages;
2. Supabase Project URL;
3. Supabase anon public key.

Eu modific aplicatia ca:

1. login-ul sa intre prin Supabase;
2. task-urile sa se salveze in Supabase;
3. logurile sa se salveze in Supabase;
4. pontajul sa se salveze in Supabase;
5. conturile create din Admin sa fie conturi reale.

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

## Partea F - Ce imi trimiti mie dupa ce faci GitHub + Supabase

Trimite-mi:

1. Link GitHub Pages.
2. Supabase Project URL.
3. Supabase anon public key.
4. Parola pe care vrei sa o folosesti pentru `admin.meu`, sau imi spui sa o lasi tu manual.

Cu astea, eu fac conectarea reala.
