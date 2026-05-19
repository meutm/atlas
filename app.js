(function () {
  "use strict";

  const STORAGE_KEY = "meu-atlas-platform-v1";
  const SESSION_KEY = "meu-atlas-session-v1";
  const THEME_KEY = "meu-atlas-theme-v1";
  const ACCESS_KEY = "meu-atlas-access-v1";
  const LOGO = "./assets/meu-logo-albastru.png";
  const SUPABASE_URL = "https://rwrrtgnsslyquyjaakwb.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cnJ0Z25zc2x5cXV5amFha3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjU2NTQsImV4cCI6MjA5NDcwMTY1NH0.a0uoOHkcIhyezaQWhl7obSd5lKoBWuFVtQLMiw-TYgo";
  const USERNAME_DOMAIN = "meu-atlas.local";
  const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const realtimeTables = [
    "members",
    "profiles",
    "role_assignments",
    "tasks",
    "operational_logs",
    "time_entries",
    "risks",
    "files",
    "registry_entries",
    "registry_history",
  ];
  let realtimeChannel = null;
  let realtimeReloadTimer = null;
  let clockTicker = null;
  const seedMemberIds = new Set(Array.from({ length: 22 }, (_, index) => `MEM-${String(index + 1).padStart(4, "0")}`));
  const protectedUsernames = new Set(["admin.meu"]);

  const defaultAccounts = [
    { username: "admin.meu", password: "Atlas2026!", name: "Admin MEU", role: "Admin", memberId: "MEM-0005", scope: "Toate departamentele" },
    { username: "director.meu", password: "Director2026!", name: "Director Executiv", role: "Director", memberId: "MEM-0001", scope: "Leadership" },
    { username: "hr.meu", password: "HR2026!", name: "HR MEU", role: "HR", memberId: "MEM-0011", scope: "Resurse Umane" },
    { username: "safe.meu", password: "Safe2026!", name: "Safe Person", role: "Safe Person", memberId: "MEM-0015", scope: "Restricționat" },
    { username: "logistica.meu", password: "Logistica2026!", name: "Coordonator Logistică", role: "Coordonator", memberId: "MEM-0006", scope: "Logistică" },
    { username: "head.meu", password: "Head2026!", name: "Head MEU", role: "Head", memberId: "MEM-0020", scope: "Comunicare" },
  ];

  const departments = [
    "Executiv & Tehnologie",
    "Logistică",
    "Resurse Umane",
    "Comunicare",
    "Suport Instituțional",
    "Fundraising & Parteneriate",
  ];

  const statuses = [
    "Backlog",
    "De făcut",
    "În lucru",
    "În așteptare",
    "Revizuire",
    "Finalizat",
  ];

  const priorities = ["Scăzută", "Normală", "Ridicată", "Critică"];
  const urgencyLevels = ["Scăzută", "Normală", "Ridicată", "Critică"];
  const logTypes = [
    "Realizat",
    "Planificat",
    "Problemă",
    "Risc",
    "Cerere",
    "Decizie",
    "Observație",
    "Escaladare",
  ];
  const activities = [
    "Ședință",
    "Administrativ",
    "Logistică",
    "Comunicare",
    "Recrutare",
    "Producție eveniment",
    "Răspuns critic",
    "Suport participanți",
  ];

  const routes = [
    { id: "dashboard", label: "Panou executiv", icon: "layout-dashboard", roles: ["Admin", "Director", "HR", "Safe Person", "Coordonator"] },
    { id: "board", label: "Board operațional", icon: "kanban-square", roles: ["Admin", "Director", "HR", "Safe Person", "Coordonator", "Head", "Membru"] },
    { id: "logs", label: "Raportări", icon: "message-square-text", roles: ["Admin", "Director", "HR", "Safe Person", "Coordonator", "Head", "Membru"] },
    { id: "time", label: "Pontaj", icon: "clock-3", roles: ["Admin", "Director", "HR", "Coordonator", "Head", "Membru"] },
    { id: "registry", label: "Registratură", icon: "stamp", roles: ["Admin", "Director", "HR", "Safe Person", "Coordonator", "Head", "Membru"] },
    { id: "members", label: "Membri", icon: "users", roles: ["Admin", "Director", "HR", "Coordonator"] },
    { id: "risks", label: "Risc & Compliance", icon: "shield-alert", roles: ["Admin", "Director", "HR", "Safe Person"] },
    { id: "archive", label: "Arhivă dovezi", icon: "folder-archive", roles: ["Admin", "Director", "HR", "Safe Person", "Coordonator"] },
    { id: "admin", label: "Admin", icon: "settings", roles: ["Admin"] },
  ];

  const filters = {
    boardSearch: "",
    boardDepartment: "Toate",
    boardPriority: "Toate",
    logType: "Toate",
    logStatus: "Toate",
    memberDepartment: "Toate",
    timeStatus: "Toate",
    timeScope: "Luna aceasta",
  };

  const view = document.getElementById("view");
  const navList = document.getElementById("navList");
  const loginScreen = document.getElementById("loginScreen");
  const loginForm = document.getElementById("loginForm");
  const loginSupport = document.getElementById("loginSupport");
  const currentUserChip = document.getElementById("currentUserChip");
  const themeToggle = document.getElementById("themeToggle");
  const accessToggle = document.getElementById("accessToggle");
  const accessPanel = document.getElementById("accessPanel");
  const accessClose = document.getElementById("accessClose");
  const accessReset = document.getElementById("accessReset");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalContent = document.getElementById("modalContent");
  const modalClose = document.getElementById("modalClose");
  const toastStack = document.getElementById("toastStack");

  let state = loadState();

  function seedState() {
    const members = [
      member("MEM-0001", "Viorel Lambu", "viorel.lambu@meutimisoara.ro", "Executiv & Tehnologie", "Director General", "", "Director", false),
      member("MEM-0002", "Paula Iovescu", "paula.iovescu@meutimisoara.ro", "Executiv & Tehnologie", "Director General Adjunct", "Viorel Lambu", "Director", false),
      member("MEM-0003", "Marina Petrescu", "marina.petrescu@meutimisoara.ro", "Executiv & Tehnologie", "Project Manager - External Affairs", "Viorel Lambu", "Manager", false),
      member("MEM-0004", "Maysa Coman", "maysa.coman@meutimisoara.ro", "Executiv & Tehnologie", "Project Manager - Operations", "Viorel Lambu", "Manager", false),
      member("MEM-0005", "Andrei Tufiș", "andrei.tufis@meutimisoara.ro", "Executiv & Tehnologie", "Chief Technology Officer", "Viorel Lambu", "Admin", true),
      member("MEM-0006", "Rareș Crăciun", "rares.craciun@meutimisoara.ro", "Logistică", "Head of Mobility & Accommodation", "Maysa Coman", "Coordonator", false),
      member("MEM-0007", "Tatiana Gulca", "tatiana.gulca@meutimisoara.ro", "Logistică", "Head of Event Production", "Maysa Coman", "Coordonator", false),
      member("MEM-0008", "Patricia Dumitrean", "patricia.dumitrean@meutimisoara.ro", "Logistică", "Head of Venues & Hospitality", "Maysa Coman", "Coordonator", false),
      member("MEM-0009", "Dariana Iovicescu", "dariana.iovicescu@meutimisoara.ro", "Logistică", "Head of Production & Materials", "Maysa Coman", "Coordonator", true),
      member("MEM-0010", "Danu Plămădeală", "danu.plamadeala@meutimisoara.ro", "Logistică", "Head of Protocol & Ceremonial Affairs", "Maysa Coman", "Coordonator", false),
      member("MEM-0011", "Raluca Panainte", "raluca.panainte@meutimisoara.ro", "Resurse Umane", "Director of Human Resources", "Viorel Lambu", "Director", false),
      member("MEM-0012", "Cristian Mocuța", "cristian.mocuta@meutimisoara.ro", "Resurse Umane", "Head of Simulation Programme", "Raluca Panainte", "Coordonator", false),
      member("MEM-0013", "Darius Shahheydari", "darius.shahheydari@meutimisoara.ro", "Resurse Umane", "Head of Recruitment & Selection", "Raluca Panainte", "Coordonator", false),
      member("MEM-0014", "Andreea Potorac", "andreea.potorac@meutimisoara.ro", "Resurse Umane", "Head of Participants", "Raluca Panainte", "Coordonator", false),
      member("MEM-0015", "Luca Ciubotaru", "luca.ciubotaru@meutimisoara.ro", "Resurse Umane", "Head of Wellbeing & Internal Culture", "Raluca Panainte", "Coordonator", true),
      member("MEM-0016", "Karina Lupaș", "karina.lupas@meutimisoara.ro", "Resurse Umane", "Head of Risk & Safety Management", "Raluca Panainte", "Coordonator", false),
      member("MEM-0017", "Raluca Ciucuriță", "raluca.ciucurita@meutimisoara.ro", "Resurse Umane", "Head of Legal Affairs & Compliance", "Raluca Panainte", "Coordonator", false),
      member("MEM-0018", "Alessia Caragea", "alessia.caragea@meutimisoara.ro", "Comunicare", "Director of Communication, Image & Institutional Marketing", "Viorel Lambu", "Director", false),
      member("MEM-0019", "George Ropotă", "george.ropota@meutimisoara.ro", "Comunicare", "Head of Communications & Public Affairs", "Alessia Caragea", "Coordonator", false),
      member("MEM-0020", "Nicoleta Voina", "nicoleta.voina@meutimisoara.ro", "Comunicare", "Head of Social Media & Digital Strategy", "Alessia Caragea", "Coordonator", false),
      member("MEM-0021", "Cristiana Ozon", "cristiana.ozon@meutimisoara.ro", "Fundraising & Parteneriate", "Director of Fundraising & Partnerships", "Viorel Lambu", "Director", false),
      member("MEM-0022", "Alexia Rain", "alexia.rain@meutimisoara.ro", "Fundraising & Parteneriate", "Asistent Manager", "Cristiana Ozon", "Coordonator", false),
    ];

    const roleAssignments = [
      role("Executiv & Tehnologie", "Director General", "MEM-0001"),
      role("Executiv & Tehnologie", "Director General Adjunct", "MEM-0002"),
      role("Executiv & Tehnologie", "Project Manager 1 - External Affairs", "MEM-0003"),
      role("Executiv & Tehnologie", "Project Manager 2 - Operations", "MEM-0004"),
      role("Executiv & Tehnologie", "Chief Technology Officer", "MEM-0005"),
      role("Logistică", "Director of Logistics", ""),
      role("Logistică", "Head of Mobility & Accommodation", "MEM-0006"),
      role("Logistică", "Head of Event Production", "MEM-0007"),
      role("Logistică", "Head of Venues & Hospitality", "MEM-0008"),
      role("Logistică", "Head of Production & Materials", "MEM-0009", true),
      role("Logistică", "Head of Protocol & Ceremonial Affairs", "MEM-0010"),
      role("Resurse Umane", "Director of Human Resources", "MEM-0011"),
      role("Resurse Umane", "Head of Simulation Programme", "MEM-0012"),
      role("Resurse Umane", "Head of Recruitment & Selection", "MEM-0013"),
      role("Resurse Umane", "Head of Participants", "MEM-0014"),
      role("Resurse Umane", "Director HR - suport participanți", "MEM-0011"),
      role("Resurse Umane", "Head of Wellbeing & Internal Culture", "MEM-0015", true),
      role("Resurse Umane", "Head of Risk & Safety Management", "MEM-0016"),
      role("Resurse Umane", "Head of Legal Affairs & Compliance", "MEM-0017"),
      role("Comunicare", "Director of Communication, Image & Institutional Marketing", "MEM-0018"),
      role("Comunicare", "Head of Communications & Public Affairs", "MEM-0019"),
      role("Comunicare", "Head of Social Media & Digital Strategy", "MEM-0020"),
      role("Comunicare", "Head of Brand & Visual Identity", ""),
      role("Comunicare", "Head of Visual Storytelling", "MEM-0019"),
      role("Suport Instituțional", "Head of EU Institutional Affairs", "MEM-0001"),
      role("Suport Instituțional", "Head of Academic Affairs", "MEM-0005", true),
      role("Fundraising & Parteneriate", "Director of Fundraising & Partnerships", "MEM-0021"),
      role("Fundraising & Parteneriate", "Asistent Manager", "MEM-0022"),
      role("Fundraising & Parteneriate", "Head of Corporate Sponsorships", "MEM-0001"),
      role("Fundraising & Parteneriate", "Head of EU & Institutional Grants", "MEM-0001"),
      role("Fundraising & Parteneriate", "Head of Alumni & Donor Relations", "MEM-0001"),
    ];

    return {
      members,
      currentAccount: null,
      remoteReady: false,
      registryEntries: [],
      registryHistory: [],
      tasks: [
        task("TASK-0001", "Finalizare model pontaj pentru voluntari", "Configurare câmpuri, validări și activități standard pentru raportarea orelor.", "Resurse Umane", "MEM-0011", "În lucru", "Ridicată", offsetDate(3), false, "", ""),
        task("TASK-0002", "Confirmare program acces locații", "Obținere confirmare pentru orele de acces și persoanele de contact pe locații.", "Logistică", "MEM-0008", "În așteptare", "Critică", offsetDate(1), true, "Lipsește confirmarea finală de la contactul locației.", ""),
        task("TASK-0003", "Calendar conținut social media", "Plan editorial pentru anunțuri, reminder participanți și materiale instituționale.", "Comunicare", "MEM-0020", "Revizuire", "Normală", offsetDate(5), false, "", ""),
        task("TASK-0004", "Mapare sponsori corporate", "Segmentare sponsori potențiali, status contact și următorul pas.", "Fundraising & Parteneriate", "MEM-0021", "De făcut", "Ridicată", offsetDate(8), false, "", ""),
        task("TASK-0005", "Structură Drive pentru dovezi", "Foldere standard pentru task-uri, loguri, pontaj și risc.", "Executiv & Tehnologie", "MEM-0005", "Finalizat", "Normală", offsetDate(-1), false, "", "https://drive.google.com/drive/folders/meu-internal-platform"),
        task("TASK-0006", "Briefing Safe Person & compliance", "Pregătire flux restricționat, acces și text de consimțământ.", "Resurse Umane", "MEM-0015", "În lucru", "Critică", offsetDate(2), false, "", ""),
        task("TASK-0007", "Simulare check-in participanți", "Test de flux pentru registrare, badge-uri, prezență și situații speciale.", "Resurse Umane", "MEM-0014", "Backlog", "Normală", offsetDate(11), false, "", ""),
        task("TASK-0008", "Protocol ceremonie deschidere", "Ordine de intrare, speakeri, invitați și responsabilități în sală.", "Logistică", "MEM-0010", "De făcut", "Normală", offsetDate(9), false, "", ""),
        task("TASK-0009", "Lista parteneri academici", "Confirmări, contacte, invitații și documente justificative.", "Suport Instituțional", "MEM-0001", "În așteptare", "Ridicată", offsetDate(6), true, "Se așteaptă răspuns de la doi parteneri.", ""),
        task("TASK-0010", "Plan mobilitate și cazare", "Verificare intervale sosire, alocări, contacte și fallback logistic.", "Logistică", "MEM-0006", "În lucru", "Ridicată", offsetDate(4), false, "", ""),
        task("TASK-0011", "Pachet onboarding pentru membri noi", "Material unic pentru acces, reguli de raportare și responsabilități.", "Resurse Umane", "MEM-0013", "De făcut", "Normală", offsetDate(12), false, "", ""),
        task("TASK-0012", "Dashboard leadership pentru blocaje", "Indicatori pentru task-uri întârziate, loguri critice și follow-up-uri.", "Executiv & Tehnologie", "MEM-0005", "Revizuire", "Ridicată", offsetDate(2), false, "", ""),
      ],
      logs: [
        log("LOG-0001", "MEM-0020", "Comunicare", "Realizat", "Reminder participanți trimis", "Am trimis reminderul pentru completarea profilului de participant.", "", false, "", "", "Normală", "", "Echipă", "Închis"),
        log("LOG-0002", "MEM-0008", "Logistică", "Problemă", "Lipsă confirmare acces locație", "Contactul locației nu a confirmat încă intervalul de acces pentru echipa tehnică.", "TASK-0002", true, "MEM-0004", offsetDate(1), "Critică", "", "Leadership", "Follow-up"),
        log("LOG-0003", "MEM-0014", "Resurse Umane", "Planificat", "Verificare listă participanți", "Mâine voi verifica lista de participanți cu status incomplet.", "", true, "MEM-0014", offsetDate(1), "Normală", "", "Echipă", "Nou"),
        log("LOG-0004", "MEM-0015", "Resurse Umane", "Risc", "Flux Safe Person neclar pentru eveniment", "Trebuie separat clar accesul la raportările sensibile.", "TASK-0006", true, "MEM-0017", offsetDate(2), "Critică", "", "Restricționat", "Analizat"),
        log("LOG-0005", "MEM-0021", "Fundraising & Parteneriate", "Cerere", "Aprobare pachet sponsorizare", "Avem nevoie de aprobarea finală pentru pachetul standard de sponsorizare.", "TASK-0004", true, "MEM-0001", offsetDate(2), "Ridicată", "", "Leadership", "Nou"),
        log("LOG-0006", "MEM-0019", "Comunicare", "Decizie", "Briefing mutat la ICAM", "Briefingul comun se va desfășura la ICAM pentru acces mai bun al echipelor.", "", false, "", "", "Normală", "", "Echipă", "Închis"),
        log("LOG-0007", "MEM-0006", "Logistică", "Observație", "Sosiri târzii în ziua 1", "Mai mulți participanți au indicat sosiri după ora estimată inițial.", "TASK-0010", true, "MEM-0006", offsetDate(3), "Ridicată", "", "Echipă", "Follow-up"),
        log("LOG-0008", "MEM-0005", "Executiv & Tehnologie", "Realizat", "Bază inițială pentru platformă", "Am stabilit tabelele principale: membri, task-uri, loguri, pontaj, risc și fișiere.", "TASK-0005", false, "", "", "Normală", "https://drive.google.com/drive/folders/meu-internal-platform", "Leadership", "Închis"),
      ],
      timeEntries: [
        time("TIME-0001", "MEM-0005", offsetDate(-2), "Executiv & Tehnologie", "Administrativ", "", "", 3.5, "Mapare structură tehnică platformă", "Acceptat"),
        time("TIME-0002", "MEM-0011", offsetDate(-1), "Resurse Umane", "Recrutare", "TASK-0011", "", 2, "Verificare onboarding și status membri", "În așteptare"),
        time("TIME-0003", "MEM-0008", offsetDate(-1), "Logistică", "Logistică", "TASK-0002", "LOG-0002", 1.5, "Follow-up locație", "Necesită clarificare"),
        time("TIME-0004", "MEM-0020", offsetDate(-3), "Comunicare", "Comunicare", "TASK-0003", "", 4, "Calendar conținut și copy", "Acceptat"),
        time("TIME-0005", "MEM-0021", offsetDate(-4), "Fundraising & Parteneriate", "Administrativ", "TASK-0004", "", 2.25, "Actualizare listă sponsori", "Acceptat"),
        time("TIME-0006", "MEM-0015", offsetDate(0), "Resurse Umane", "Răspuns critic", "TASK-0006", "LOG-0004", 1.75, "Draft flux Safe Person", "În așteptare"),
      ],
      risks: [
        risk("RISK-0001", "Protecția datelor", "Acces prea larg la raportările sensibile.", "Critică", "MEM-0017", "Separare tabel restricționat, roluri AppSheet și folder Drive dedicat.", "Restricționat", "Deschis"),
        risk("RISK-0002", "Adopție internă", "Membrii pot uita să actualizeze task-urile și pontajul.", "Ridicată", "MEM-0011", "Formulare scurte, digest săptămânal și revizuire în ședințe.", "Leadership", "Monitorizat"),
        risk("RISK-0003", "Logistică", "Transportul poate să nu acopere sosirile târzii.", "Ridicată", "MEM-0006", "Plan fallback cu două intervale suplimentare.", "Echipă", "Deschis"),
      ],
      files: [
        file("FILE-0001", "MEM-0005", "Task", "TASK-0005", "Structură Drive platformă", "Folder", "https://drive.google.com/drive/folders/meu-internal-platform"),
        file("FILE-0002", "MEM-0020", "Log", "LOG-0001", "Dovadă reminder participanți", "Screenshot", "https://drive.google.com/file/d/meu-reminder"),
        file("FILE-0003", "MEM-0017", "Risc", "RISK-0001", "Notă acces compliance", "Document", "https://drive.google.com/file/d/meu-compliance-note"),
      ],
      accounts: defaultAccounts.map((account) => ({ ...account })),
      roles: roleAssignments,
      clock: null,
      audit: [
        { timestamp: new Date().toISOString(), user: "Admin MEU", action: "Inițializare platformă", record: "System" },
      ],
    };
  }

  function member(id, name, email, department, role, manager, accessLevel, safePerson) {
    return {
      id,
      name,
      email,
      department,
      role,
      manager,
      accessLevel,
      safePerson,
      status: "Activ",
      addedAt: offsetDate(-10),
    };
  }

  function role(department, title, memberId, safePerson = false) {
    return {
      department,
      role: title,
      memberId,
      assignedTo: memberId ? memberNameFromSeed(memberId) : "",
      safePerson,
      status: memberId ? "Ocupat" : "Neocupat",
    };
  }

  function memberNameFromSeed(memberId) {
    const names = {
      "MEM-0001": "Viorel Lambu",
      "MEM-0002": "Paula Iovescu",
      "MEM-0003": "Marina Petrescu",
      "MEM-0004": "Maysa Coman",
      "MEM-0005": "Andrei Tufiș",
      "MEM-0006": "Rareș Crăciun",
      "MEM-0007": "Tatiana Gulca",
      "MEM-0008": "Patricia Dumitrean",
      "MEM-0009": "Dariana Iovicescu",
      "MEM-0010": "Danu Plămădeală",
      "MEM-0011": "Raluca Panainte",
      "MEM-0012": "Cristian Mocuța",
      "MEM-0013": "Darius Shahheydari",
      "MEM-0014": "Andreea Potorac",
      "MEM-0015": "Luca Ciubotaru",
      "MEM-0016": "Karina Lupaș",
      "MEM-0017": "Raluca Ciucuriță",
      "MEM-0018": "Alessia Caragea",
      "MEM-0019": "George Ropotă",
      "MEM-0020": "Nicoleta Voina",
      "MEM-0021": "Cristiana Ozon",
      "MEM-0022": "Alexia Rain",
    };
    return names[memberId] || "";
  }

  function task(id, title, description, department, ownerId, status, priority, deadline, blocker, blockerText, evidenceUrl) {
    return {
      id,
      title,
      description,
      department,
      ownerId,
      collaborators: [],
      status,
      priority,
      deadline,
      blocker,
      blockerText,
      evidenceUrl,
      relatedLogId: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function log(id, submittedBy, department, type, title, narrative, relatedTaskId, needsFollowUp, followUpOwnerId, deadline, urgency, evidenceUrl, visibility, status) {
    return {
      id,
      submittedBy,
      department,
      type,
      title,
      narrative,
      relatedTaskId,
      needsFollowUp,
      followUpOwnerId,
      deadline,
      urgency,
      evidenceUrl,
      convertToTask: false,
      visibility,
      status,
      submittedAt: new Date().toISOString(),
    };
  }

  function time(id, memberId, date, department, activity, relatedTaskId, relatedLogId, hours, notes, validationStatus) {
    return {
      id,
      memberId,
      date,
      department,
      activity,
      relatedTaskId,
      relatedLogId,
      hours,
      notes,
      validationStatus,
      validatedBy: validationStatus === "Acceptat" ? "MEM-0011" : "",
      createdAt: new Date().toISOString(),
    };
  }

  function risk(id, category, description, severity, ownerId, mitigation, visibility, status) {
    return { id, category, description, severity, ownerId, mitigation, visibility, status, createdAt: new Date().toISOString() };
  }

  function file(id, uploadedBy, relatedType, relatedId, title, fileType, driveUrl) {
    return { id, uploadedBy, relatedType, relatedId, title, fileType, driveUrl, uploadedAt: new Date().toISOString() };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeState(JSON.parse(saved));
    } catch (error) {
      console.warn("Nu am putut încărca datele salvate.", error);
    }
    return seedState();
  }

  function normalizeState(data) {
    const fresh = seedState();
    return {
      ...fresh,
      ...data,
      accounts: Array.isArray(data.accounts) && data.accounts.length ? data.accounts : fresh.accounts,
      roles: Array.isArray(data.roles) && data.roles.length > 2 ? data.roles : fresh.roles,
      currentAccount: data.currentAccount || null,
      remoteReady: Boolean(data.remoteReady),
      registryEntries: Array.isArray(data.registryEntries) ? data.registryEntries : fresh.registryEntries,
      registryHistory: Array.isArray(data.registryHistory) ? data.registryHistory : fresh.registryHistory,
    };
  }

  function saveState(action) {
    state.audit = state.audit || [];
    if (action) {
      const account = activeAccount();
      state.audit.unshift({
        timestamp: new Date().toISOString(),
        user: account?.name || "Admin MEU",
        action,
        record: currentRouteLabel(),
      });
      state.audit = state.audit.slice(0, 40);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderNav();
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function activeAccount() {
    const session = getSession();
    if (session?.account) return session.account;
    if (state.currentAccount && state.currentAccount.username === session?.username) return state.currentAccount;
    return state.accounts.find((account) => account.username === session?.username) || null;
  }

  function usernameToEmail(username) {
    return `${String(username || "").trim().toLowerCase()}@${USERNAME_DOMAIN}`;
  }

  function canAccessRoute(routeId) {
    const account = activeAccount();
    const route = routes.find((item) => item.id === routeId);
    return Boolean(account && route && route.roles.includes(account.role));
  }

  function firstAllowedRoute() {
    const account = activeAccount();
    return routes.find((route) => account && route.roles.includes(account.role))?.id || "board";
  }

  function accountDepartment() {
    const account = activeAccount();
    if (!account) return "";
    return state.members.find((memberItem) => memberItem.id === account.memberId)?.department || account.scope;
  }

  function visibleTasks() {
    const account = activeAccount();
    if (!account || ["Admin", "Director"].includes(account.role)) return state.tasks;
    if (account.role === "HR") return state.tasks.filter((taskItem) => taskItem.department === "Resurse Umane" || taskItem.ownerId === account.memberId);
    if (account.role === "Safe Person") return state.tasks.filter((taskItem) => taskItem.department === "Resurse Umane" || taskItem.priority === "Critică" || taskItem.ownerId === account.memberId);
    return state.tasks.filter((taskItem) => taskItem.department === accountDepartment() || taskItem.ownerId === account.memberId);
  }

  function visibleLogs() {
    const account = activeAccount();
    if (!account || ["Admin", "Director"].includes(account.role)) return state.logs;
    if (account.role === "Safe Person") return state.logs.filter((logItem) => logItem.visibility === "Restricționat" || logItem.urgency === "Critică" || logItem.submittedBy === account.memberId);
    if (account.role === "HR") return state.logs.filter((logItem) => logItem.department === "Resurse Umane" || logItem.visibility !== "Restricționat" || logItem.submittedBy === account.memberId);
    return state.logs.filter((logItem) => logItem.submittedBy === account.memberId || (logItem.department === accountDepartment() && logItem.visibility === "Echipă"));
  }

  function visibleTimeEntries() {
    const account = activeAccount();
    if (!account || ["Admin", "Director", "HR"].includes(account.role)) return state.timeEntries;
    if (account.role === "Coordonator") return state.timeEntries.filter((entry) => entry.department === accountDepartment() || entry.memberId === account.memberId);
    return state.timeEntries.filter((entry) => entry.memberId === account.memberId);
  }

  function visibleMembers() {
    const account = activeAccount();
    if (!account || ["Admin", "Director", "HR"].includes(account.role)) return state.members;
    return state.members.filter((memberItem) => memberItem.department === accountDepartment() || memberItem.id === account.memberId);
  }

  function timeDefaultMemberId() {
    return activeAccount()?.memberId || "MEM-0005";
  }

  function timeDefaultDepartment(memberId = timeDefaultMemberId()) {
    return state.members.find((memberItem) => memberItem.id === memberId)?.department || accountDepartment() || "Executiv & Tehnologie";
  }

  function canValidateTime() {
    return ["Admin", "Director", "HR"].includes(activeAccount()?.role);
  }

  function renderAuth() {
    const account = activeAccount();
    loginScreen.hidden = Boolean(account);
    document.body.classList.toggle("auth-required", !account);
    if (currentUserChip) {
      currentUserChip.textContent = account ? `${account.name} · ${account.role}` : "Neautentificat";
    }
    if (loginSupport) {
      loginSupport.hidden = Boolean(account);
    }
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("theme-dark", isDark);
    localStorage.setItem(THEME_KEY, theme);
    if (themeToggle) {
      themeToggle.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}"></i>`;
      themeToggle.setAttribute("aria-label", isDark ? "Activează tema luminoasă" : "Activează tema întunecată");
    }
    refreshIcons();
  }

  function initialTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
  }

  function defaultAccessSettings() {
    return {
      contrast: false,
      text: 0,
      spacing: false,
      font: false,
      links: false,
      motion: false,
      grayscale: false,
      focus: false,
    };
  }

  function getAccessSettings() {
    try {
      return { ...defaultAccessSettings(), ...JSON.parse(localStorage.getItem(ACCESS_KEY) || "{}") };
    } catch {
      return defaultAccessSettings();
    }
  }

  function saveAccessSettings(settings) {
    localStorage.setItem(ACCESS_KEY, JSON.stringify(settings));
  }

  function applyAccessSettings(settings = getAccessSettings()) {
    document.body.classList.toggle("access-contrast", settings.contrast);
    document.body.classList.toggle("access-spacing", settings.spacing);
    document.body.classList.toggle("access-readable", settings.font);
    document.body.classList.toggle("access-links", settings.links);
    document.body.classList.toggle("access-reduce-motion", settings.motion);
    document.body.classList.toggle("access-grayscale", settings.grayscale);
    document.body.classList.toggle("access-focus", settings.focus);
    document.body.classList.toggle("access-text-1", settings.text === 1);
    document.body.classList.toggle("access-text-2", settings.text === 2);
    document.querySelectorAll("[data-access]").forEach((button) => {
      const key = button.dataset.access;
      const active = key === "text" ? settings.text > 0 : Boolean(settings[key]);
      button.classList.toggle("active", active);
      if (key === "text") {
        button.innerHTML = `<i data-lucide="case-sensitive"></i>${settings.text === 0 ? "Text mai mare" : settings.text === 1 ? "Text mare" : "Text foarte mare"}`;
      }
    });
    refreshIcons();
  }

  function toggleAccessSetting(key) {
    const settings = getAccessSettings();
    if (key === "text") {
      settings.text = (settings.text + 1) % 3;
    } else {
      settings[key] = !settings[key];
    }
    saveAccessSettings(settings);
    applyAccessSettings(settings);
  }

  function offsetDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function currentRoute() {
    return (location.hash || "#dashboard").replace("#", "");
  }

  function currentRouteLabel() {
    return routes.find((route) => route.id === currentRoute())?.label || "Platformă";
  }

  function formatRegistryDate(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    return new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function optionList(values, selected) {
    return values
      .map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`)
      .join("");
  }

  function departmentOptions(selected, includeAll) {
    const values = includeAll ? ["Toate", ...departments] : departments;
    return optionList(values, selected);
  }

  function memberOptions(selected, includeEmpty) {
    const first = includeEmpty ? `<option value="">Selectează</option>` : "";
    return (
      first +
      state.members
        .filter((memberItem) => memberItem.status === "Activ")
        .map((memberItem) => `<option value="${memberItem.id}" ${memberItem.id === selected ? "selected" : ""}>${escapeHtml(memberItem.name)}</option>`)
        .join("")
    );
  }

  function timeMemberOptions(selected) {
    const account = activeAccount();
    const members =
      account && !["Admin", "Director", "HR"].includes(account.role)
        ? visibleMembers().filter((memberItem) => memberItem.status === "Activ")
        : state.members.filter((memberItem) => memberItem.status === "Activ");
    return members
      .map((memberItem) => `<option value="${memberItem.id}" ${memberItem.id === selected ? "selected" : ""}>${escapeHtml(memberItem.name)}</option>`)
      .join("");
  }

  function timeDepartmentOptions(selected) {
    const account = activeAccount();
    if (!account || ["Admin", "Director", "HR"].includes(account.role)) return departmentOptions(selected);
    const department = accountDepartment() || selected;
    return optionList([department], department);
  }

  function taskOptions(selected, includeEmpty) {
    const first = includeEmpty ? `<option value="">Fără task asociat</option>` : "";
    return (
      first +
      state.tasks
        .map((taskItem) => `<option value="${taskItem.id}" ${taskItem.id === selected ? "selected" : ""}>${escapeHtml(taskItem.id)} - ${escapeHtml(taskItem.title)}</option>`)
        .join("")
    );
  }

  function logOptions(selected, includeEmpty) {
    const first = includeEmpty ? `<option value="">Fără log asociat</option>` : "";
    return (
      first +
      state.logs
        .map((logItem) => `<option value="${logItem.id}" ${logItem.id === selected ? "selected" : ""}>${escapeHtml(logItem.id)} - ${escapeHtml(logItem.title)}</option>`)
        .join("")
    );
  }

  function formatDate(value) {
    if (!value) return "Fără termen";
    return new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function daysUntil(value) {
    if (!value) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(value);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function memberName(id) {
    return state.members.find((memberItem) => memberItem.id === id)?.name || "Nealocat";
  }

  function normalizeMember(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email || "",
      department: row.department,
      role: row.primary_role,
      manager: row.manager || "",
      accessLevel: row.access_level || "Head",
      safePerson: Boolean(row.safe_person),
      status: row.status || "Activ",
      addedAt: row.created_at || "",
    };
  }

  function normalizeRoleAssignment(row) {
    return {
      id: row.id,
      department: row.department,
      role: row.title,
      memberId: row.member_id || "",
      assignedTo: row.member_id ? memberName(row.member_id) : "",
      safePerson: Boolean(row.safe_person),
      status: row.status || "Ocupat",
    };
  }

  function normalizeTask(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || "",
      department: row.department,
      ownerId: row.owner_id || "",
      collaborators: [],
      status: row.status,
      priority: row.priority,
      deadline: row.deadline || "",
      blocker: Boolean(row.blocker),
      blockerText: row.blocker_text || "",
      evidenceUrl: row.evidence_url || "",
      relatedLogId: row.related_log_id || "",
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
      createdBy: row.created_by || "",
    };
  }

  function normalizeLog(row) {
    return {
      id: row.id,
      submittedBy: row.submitted_by || "",
      department: row.department,
      type: row.type,
      title: row.title,
      narrative: row.narrative,
      relatedTaskId: row.related_task_id || "",
      needsFollowUp: Boolean(row.needs_follow_up),
      followUpOwnerId: row.follow_up_owner_id || "",
      deadline: row.deadline || "",
      urgency: row.urgency,
      evidenceUrl: row.evidence_url || "",
      convertToTask: false,
      visibility: row.visibility,
      status: row.status,
      submittedAt: row.created_at || "",
      createdBy: row.created_by || "",
    };
  }

  function normalizeTimeEntry(row) {
    return {
      id: row.id,
      memberId: row.member_id || "",
      date: row.work_date,
      department: row.department,
      activity: row.activity,
      relatedTaskId: row.related_task_id || "",
      relatedLogId: row.related_log_id || "",
      hours: Number(row.hours || 0),
      notes: row.notes || "",
      validationStatus: row.validation_status,
      validatedBy: row.validated_by || "",
      createdAt: row.created_at || "",
      createdBy: row.created_by || "",
    };
  }

  function normalizeRisk(row) {
    return {
      id: row.id,
      category: row.category,
      description: row.description,
      severity: row.severity,
      ownerId: row.owner_id || "",
      mitigation: row.mitigation || "",
      visibility: row.visibility,
      status: row.status,
      createdAt: row.created_at || "",
      createdBy: row.created_by || "",
    };
  }

  function normalizeFile(row) {
    return {
      id: row.id,
      uploadedBy: row.uploaded_by || "",
      relatedType: row.related_type,
      relatedId: row.related_id,
      title: row.title,
      fileType: row.file_type,
      driveUrl: row.drive_url,
      uploadedAt: row.created_at || "",
      createdBy: row.created_by || "",
    };
  }

  function normalizeRegistryEntry(row) {
    return {
      id: row.id,
      registryNumber: row.registry_number,
      sequence: row.sequence_number,
      documentDate: row.document_date,
      title: row.title,
      summary: row.summary || "",
      documentType: row.document_type || "Document",
      direction: row.direction || "Intern",
      department: row.department || "",
      requesterId: row.requester_id || "",
      externalParty: row.external_party || "",
      status: row.status || "Înregistrat",
      fileUrl: row.file_url || "",
      createdBy: row.created_by || "",
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    };
  }

  function normalizeRegistryHistory(row) {
    return {
      id: row.id,
      registryEntryId: row.registry_entry_id,
      action: row.action,
      note: row.note || "",
      actorId: row.actor_id || "",
      createdAt: row.created_at || "",
    };
  }

  function normalizeProfile(row) {
    return {
      username: row.username,
      password: "",
      name: row.display_name,
      role: row.role === "Membru" ? "Head" : row.role,
      memberId: row.member_id || "",
      scope: row.department_scope || "",
      status: row.status || "Activ",
      authUserId: row.id || "",
    };
  }

  async function fetchSupabaseTable(table, mapper, fallback) {
    const { data, error } = await supabaseClient.from(table).select("*");
    if (error) {
      console.warn(`Nu am putut încărca ${table}.`, error);
      return fallback;
    }
    return Array.isArray(data) ? data.map(mapper) : fallback;
  }

  async function loadRemoteData() {
    if (!supabaseClient) return;
    const members = await fetchSupabaseTable("members", normalizeMember, state.members);
    state.members = members;
    state.roles = await fetchSupabaseTable("role_assignments", normalizeRoleAssignment, state.roles);
    state.tasks = await fetchSupabaseTable("tasks", normalizeTask, state.tasks);
    state.logs = await fetchSupabaseTable("operational_logs", normalizeLog, state.logs);
    state.timeEntries = await fetchSupabaseTable("time_entries", normalizeTimeEntry, state.timeEntries);
    state.risks = await fetchSupabaseTable("risks", normalizeRisk, state.risks);
    state.files = await fetchSupabaseTable("files", normalizeFile, state.files);
    state.accounts = await fetchSupabaseTable("profiles", normalizeProfile, state.accounts);
    state.registryEntries = await fetchSupabaseTable("registry_entries", normalizeRegistryEntry, state.registryEntries || []);
    state.registryHistory = await fetchSupabaseTable("registry_history", normalizeRegistryHistory, state.registryHistory || []);
    state.remoteReady = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async function refreshRemoteDataSilently(reason = "Realtime update") {
    if (!activeAccount()) return;
    clearTimeout(realtimeReloadTimer);
    realtimeReloadTimer = setTimeout(async () => {
      const routeBefore = currentRoute();
      await loadRemoteData();
      render();
      if (!["dashboard"].includes(routeBefore)) {
        toast("Actualizat live", reason);
      }
    }, 350);
  }

  function setupRealtime() {
    if (!supabaseClient || realtimeChannel) return;
    realtimeChannel = supabaseClient.channel("meu-atlas-live");
    realtimeTables.forEach((table) => {
      realtimeChannel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => refreshRemoteDataSilently("Datele au fost sincronizate."),
      );
    });
    realtimeChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info("MEU Atlas realtime conectat.");
      }
    });
  }

  function teardownRealtime() {
    if (supabaseClient && realtimeChannel) {
      supabaseClient.removeChannel(realtimeChannel);
    }
    realtimeChannel = null;
  }

  async function loadProfileForUser(user) {
    const { data, error } = await supabaseClient.from("profiles").select("*").eq("id", user.id).single();
    if (error || !data) {
      throw new Error("Contul există în Auth, dar nu are profil MEU Atlas în tabelul profiles.");
    }
    return {
      username: data.username,
      password: "",
      name: data.display_name,
      role: data.role,
      memberId: data.member_id || "",
      scope: data.department_scope,
      status: data.status || "Activ",
      authUserId: data.id || user.id || "",
    };
  }

  async function loginWithSupabase(username, password) {
    if (!supabaseClient) throw new Error("Supabase nu este încărcat.");
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) throw error;
    const account = await loadProfileForUser(data.user);
    if (account.status === "Suspendat") {
      await supabaseClient.auth.signOut();
      throw new Error("Contul este suspendat.");
    }
    state.currentAccount = account;
    await loadRemoteData();
    setupRealtime();
    saveState("Autentificare Supabase");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username, account, loggedAt: new Date().toISOString() }));
    return account;
  }

  async function restoreSupabaseSession() {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.auth.getSession();
    if (!data.session?.user) {
      if (activeAccount()) setupRealtime();
      return;
    }
    try {
      const account = await loadProfileForUser(data.session.user);
      state.currentAccount = account;
      await loadRemoteData();
      setupRealtime();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username, account, loggedAt: new Date().toISOString() }));
      render();
    } catch (error) {
      console.warn(error);
    }
  }

  async function createAccountRemote(payload) {
    if (!supabaseClient) throw new Error("Supabase nu este încărcat.");
    const { data, error } = await supabaseClient.functions.invoke("create-account", {
      body: payload,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function adminToolRemote(action, payload = {}) {
    if (!supabaseClient) throw new Error("Supabase nu este încărcat.");
    const { data, error } = await supabaseClient.functions.invoke("admin-tools", {
      body: { action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  function toTaskRow(taskItem) {
    return {
      id: taskItem.id,
      title: taskItem.title,
      description: taskItem.description || "",
      department: taskItem.department,
      owner_id: taskItem.ownerId || null,
      status: taskItem.status,
      priority: taskItem.priority,
      deadline: taskItem.deadline || null,
      blocker: Boolean(taskItem.blocker),
      blocker_text: taskItem.blockerText || "",
      evidence_url: taskItem.evidenceUrl || "",
      related_log_id: taskItem.relatedLogId || null,
      created_by: taskItem.createdBy || currentAuthUserId() || null,
      updated_at: new Date().toISOString(),
    };
  }

  function toLogRow(logItem) {
    return {
      id: logItem.id,
      submitted_by: logItem.submittedBy || null,
      department: logItem.department,
      type: logItem.type,
      title: logItem.title,
      narrative: logItem.narrative,
      related_task_id: logItem.relatedTaskId || null,
      needs_follow_up: Boolean(logItem.needsFollowUp),
      follow_up_owner_id: logItem.followUpOwnerId || null,
      deadline: logItem.deadline || null,
      urgency: logItem.urgency,
      evidence_url: logItem.evidenceUrl || "",
      visibility: logItem.visibility,
      status: logItem.status,
      created_by: logItem.createdBy || currentAuthUserId() || null,
    };
  }

  function toTimeEntryRow(entry) {
    return {
      id: entry.id,
      member_id: entry.memberId || null,
      work_date: entry.date,
      department: entry.department,
      activity: entry.activity,
      related_task_id: entry.relatedTaskId || null,
      related_log_id: entry.relatedLogId || null,
      hours: Number(entry.hours || 0),
      notes: entry.notes || "",
      validation_status: entry.validationStatus,
      validated_by: entry.validatedBy || null,
      created_by: entry.createdBy || currentAuthUserId() || null,
    };
  }

  function toMemberRow(memberItem) {
    return {
      id: memberItem.id,
      name: memberItem.name,
      email: memberItem.email || "",
      department: memberItem.department,
      primary_role: memberItem.role,
      manager: memberItem.manager || null,
      access_level: memberItem.accessLevel,
      safe_person: Boolean(memberItem.safePerson),
      status: memberItem.status,
    };
  }

  function toRiskRow(riskItem) {
    return {
      id: riskItem.id,
      category: riskItem.category,
      description: riskItem.description,
      severity: riskItem.severity,
      owner_id: riskItem.ownerId || null,
      mitigation: riskItem.mitigation || "",
      visibility: riskItem.visibility,
      status: riskItem.status,
      created_by: riskItem.createdBy || currentAuthUserId() || null,
    };
  }

  function toFileRow(fileItem) {
    return {
      id: fileItem.id,
      uploaded_by: fileItem.uploadedBy || null,
      related_type: fileItem.relatedType,
      related_id: fileItem.relatedId,
      title: fileItem.title,
      file_type: fileItem.fileType,
      drive_url: fileItem.driveUrl,
      created_by: fileItem.createdBy || currentAuthUserId() || null,
    };
  }

  function toRegistryEntryRow(entry) {
    return {
      id: entry.id,
      registry_number: entry.registryNumber,
      sequence_number: entry.sequence,
      document_date: entry.documentDate,
      title: entry.title,
      summary: entry.summary || "",
      document_type: entry.documentType,
      direction: entry.direction,
      department: entry.department,
      requester_id: entry.requesterId || null,
      external_party: entry.externalParty || "",
      status: entry.status,
      file_url: entry.fileUrl || "",
    };
  }

  function toRegistryHistoryRow(historyItem) {
    return {
      registry_entry_id: historyItem.registryEntryId,
      action: historyItem.action,
      note: historyItem.note || "",
      actor_id: historyItem.actorId || null,
    };
  }

  async function remoteInsert(table, row) {
    if (!supabaseClient || !activeAccount()) return false;
    const { error } = await supabaseClient.from(table).insert(row);
    if (error) throw error;
    return true;
  }

  async function remoteRpc(name, args = {}) {
    if (!supabaseClient || !activeAccount()) return null;
    const { data, error } = await supabaseClient.rpc(name, args);
    if (error) throw error;
    return data;
  }

  async function remoteUpdate(table, id, patch) {
    if (!supabaseClient || !activeAccount()) return false;
    const { error } = await supabaseClient.from(table).update(patch).eq("id", id);
    if (error) throw error;
    return true;
  }

  async function tryRemote(label, operation) {
    try {
      const synced = await operation();
      if (synced) return true;
    } catch (error) {
      console.warn(error);
      toast("Salvat local", `${label} nu s-a sincronizat in Supabase: ${error.message || "eroare necunoscuta"}`);
      return false;
    }
    return false;
  }

  function isAdminAccount() {
    return activeAccount()?.role === "Admin";
  }

  function currentAuthUserId() {
    return activeAccount()?.authUserId || "";
  }

  function createdByCurrentUser(item) {
    const authUserId = currentAuthUserId();
    return Boolean(authUserId && item?.createdBy === authUserId);
  }

  function canDeleteRecord(entity, item) {
    const account = activeAccount();
    if (!account) return false;
    if (account.role === "Admin") return true;
    if (!item) return false;
    const memberId = account.memberId;
    if (entity === "task") return createdByCurrentUser(item) || item.ownerId === memberId;
    if (entity === "log") return createdByCurrentUser(item) || item.submittedBy === memberId || item.followUpOwnerId === memberId;
    if (entity === "time") return createdByCurrentUser(item) || item.memberId === memberId;
    if (entity === "risk") return createdByCurrentUser(item) || item.ownerId === memberId;
    if (entity === "file") return createdByCurrentUser(item) || item.uploadedBy === memberId;
    if (entity === "registry") return createdByCurrentUser(item) || item.requesterId === memberId;
    return false;
  }

  function deleteButton(entity, id, label, variant = "danger-button", item = null) {
    if (!canDeleteRecord(entity, item)) return "";
    return `
      <button class="${variant} delete-button" data-delete-type="${escapeHtml(entity)}" data-delete-id="${escapeHtml(id)}" data-delete-label="${escapeHtml(label)}">
        <i data-lucide="trash-2"></i>Șterge
      </button>
    `;
  }

  function localDeleteRecord(entity, id) {
    const removeFrom = (key, predicate) => {
      const before = state[key].length;
      state[key] = state[key].filter((item) => !predicate(item));
      return before - state[key].length;
    };

    if (entity === "task") {
      state.logs.forEach((item) => {
        if (item.relatedTaskId === id) item.relatedTaskId = "";
      });
      state.timeEntries.forEach((item) => {
        if (item.relatedTaskId === id) item.relatedTaskId = "";
      });
      state.files = state.files.filter((item) => !(item.relatedType === "Task" && item.relatedId === id));
      return removeFrom("tasks", (item) => item.id === id);
    }
    if (entity === "log") {
      state.tasks.forEach((item) => {
        if (item.relatedLogId === id) item.relatedLogId = "";
      });
      state.timeEntries.forEach((item) => {
        if (item.relatedLogId === id) item.relatedLogId = "";
      });
      state.files = state.files.filter((item) => !(item.relatedType === "Log" && item.relatedId === id));
      return removeFrom("logs", (item) => item.id === id);
    }
    if (entity === "time") return removeFrom("timeEntries", (item) => item.id === id);
    if (entity === "risk") {
      state.files = state.files.filter((item) => !(item.relatedType === "Risc" && item.relatedId === id));
      return removeFrom("risks", (item) => item.id === id);
    }
    if (entity === "file") return removeFrom("files", (item) => item.id === id);
    if (entity === "registry") {
      state.registryHistory = (state.registryHistory || []).filter((item) => item.registryEntryId !== id);
      return removeFrom("registryEntries", (item) => item.id === id);
    }
    if (entity === "member") {
      state.accounts.forEach((item) => {
        if (item.memberId === id) item.memberId = "";
      });
      state.roles.forEach((item) => {
        if (item.memberId === id) item.memberId = "";
      });
      state.tasks.forEach((item) => {
        if (item.ownerId === id) item.ownerId = "";
      });
      state.logs.forEach((item) => {
        if (item.submittedBy === id) item.submittedBy = "";
        if (item.followUpOwnerId === id) item.followUpOwnerId = "";
      });
      state.timeEntries.forEach((item) => {
        if (item.memberId === id) item.memberId = "";
        if (item.validatedBy === id) item.validatedBy = "";
      });
      state.risks.forEach((item) => {
        if (item.ownerId === id) item.ownerId = "";
      });
      state.files.forEach((item) => {
        if (item.uploadedBy === id) item.uploadedBy = "";
      });
      (state.registryEntries || []).forEach((item) => {
        if (item.requesterId === id) item.requesterId = "";
      });
      (state.registryHistory || []).forEach((item) => {
        if (item.actorId === id) item.actorId = "";
      });
      return removeFrom("members", (item) => item.id === id);
    }
    if (entity === "account") return removeFrom("accounts", (item) => item.username === id);
    return 0;
  }

  async function deleteRecord(entity, id, label) {
    const item = localRecord(entity, id);
    if (!canDeleteRecord(entity, item)) {
      toast("Acces refuzat", "Poți șterge doar ce ai creat tu sau ce este asociat contului tău.");
      return;
    }
    if (entity === "account" && protectedUsernames.has(id)) {
      toast("Cont protejat", "Contul admin.meu nu se șterge din platformă.");
      return;
    }
    if (entity === "member" && seedMemberIds.has(id)) {
      toast("Membru protejat", "Membrii de bază rămân în structură. Poți șterge membrii adăugați în teste.");
      return;
    }
    if (!confirm(`Ștergi definitiv ${label}?`)) return;

    try {
      if (supabaseClient) {
        await adminToolRemote("delete-record", { entity, id });
        await loadRemoteData();
      } else {
        localDeleteRecord(entity, id);
        saveState(`Șters: ${label}`);
      }
      closeModal();
      render();
      toast("Șters", `${label} a fost eliminat.`);
    } catch (error) {
      console.warn(error);
      toast("Nu am putut șterge", error.message || "Verifică funcția admin-tools în Supabase.");
    }
  }

  function localRecord(entity, id) {
    if (entity === "task") return state.tasks.find((item) => item.id === id);
    if (entity === "log") return state.logs.find((item) => item.id === id);
    if (entity === "time") return state.timeEntries.find((item) => item.id === id);
    if (entity === "risk") return state.risks.find((item) => item.id === id);
    if (entity === "file") return state.files.find((item) => item.id === id);
    if (entity === "registry") return (state.registryEntries || []).find((item) => item.id === id);
    if (entity === "member") return state.members.find((item) => item.id === id);
    if (entity === "account") return state.accounts.find((item) => item.username === id);
    return null;
  }

  async function resetTestData() {
    if (!isAdminAccount()) return;
    const confirmed = confirm(
      "Curăți datele de test? Se șterg task-uri, loguri, pontaje, riscuri, fișiere, registratura, conturile create după admin.meu și membrii adăugați în teste.",
    );
    if (!confirmed) return;

    try {
      if (supabaseClient) {
        const result = await adminToolRemote("reset-test-data");
        await loadRemoteData();
        saveState("Date de test curățate");
        render();
        toast("Date curățate", result?.message || "Platforma a fost curățată pentru teste noi.");
        return;
      }

      const current = activeAccount();
      state = seedState();
      state.currentAccount = current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
      toast("Date resetate", "Platforma locală a revenit la setul inițial.");
    } catch (error) {
      console.warn(error);
      toast("Reset nereușit", error.message || "Verifică funcția admin-tools în Supabase.");
    }
  }

  function attachDeleteButtons(root = document) {
    root.querySelectorAll("[data-delete-type]").forEach((button) => {
      if (button.dataset.deleteBound === "1") return;
      button.dataset.deleteBound = "1";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteRecord(button.dataset.deleteType, button.dataset.deleteId, button.dataset.deleteLabel || "elementul selectat");
      });
    });
  }

  function memberInitials(idOrName) {
    const name = idOrName?.startsWith?.("MEM-") ? memberName(idOrName) : idOrName || "MEU";
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function priorityClass(value) {
    if (value === "Critică") return "priority-critical";
    if (value === "Ridicată") return "priority-high";
    if (value === "Normală") return "priority-normal";
    return "priority-low";
  }

  function statusClass(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("finalizat") || normalized.includes("închis") || normalized.includes("acceptat")) return "status-done";
    if (normalized.includes("lucru") || normalized.includes("follow")) return "status-progress";
    if (normalized.includes("așteptare") || normalized.includes("nou") || normalized.includes("pending")) return "status-pending";
    if (normalized.includes("revizuire") || normalized.includes("analizat")) return "status-review";
    if (normalized.includes("clarificare")) return "status-needs";
    return "status-backlog";
  }

  function nextId(prefix, collection) {
    const max = collection.reduce((largest, item) => {
      const number = Number(String(item.id || "").replace(`${prefix}-`, ""));
      return Number.isFinite(number) ? Math.max(largest, number) : largest;
    }, 0);
    return `${prefix}-${String(max + 1).padStart(4, "0")}`;
  }

  function countBy(items, getKey) {
    return items.reduce((acc, item) => {
      const key = getKey(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function sum(items, getValue) {
    return items.reduce((total, item) => total + Number(getValue(item) || 0), 0);
  }

  function renderNav() {
    const allowedRoutes = routes.filter((route) => canAccessRoute(route.id));
    const openTasks = visibleTasks().filter((taskItem) => !["Finalizat", "Arhivat"].includes(taskItem.status)).length;
    const openLogs = visibleLogs().filter((logItem) => !["Închis"].includes(logItem.status)).length;
    const pendingTime = visibleTimeEntries().filter((entry) => entry.validationStatus === "În așteptare").length;
    const risks = state.risks.filter((riskItem) => riskItem.status !== "Închis").length;
    const registryOpen = (state.registryEntries || []).filter((entry) => entry.status !== "Arhivat").length;
    const counters = {
      board: openTasks,
      logs: openLogs,
      time: pendingTime,
      risks,
      registry: registryOpen,
    };

    navList.innerHTML = allowedRoutes
      .map(
        (route) => `
          <a class="nav-item ${currentRoute() === route.id ? "active" : ""}" href="#${route.id}" data-route="${route.id}">
            <i data-lucide="${route.icon}"></i>
            <span>${route.label}</span>
            ${counters[route.id] ? `<span class="counter">${counters[route.id]}</span>` : ""}
          </a>
        `,
      )
      .join("");
    refreshIcons();
  }

  function render() {
    renderAuth();
    if (!activeAccount()) {
      view.innerHTML = "";
      renderNav();
      refreshIcons();
      return;
    }
    if (!canAccessRoute(currentRoute())) {
      location.hash = firstAllowedRoute();
      return;
    }
    const route = routes.some((item) => item.id === currentRoute()) ? currentRoute() : firstAllowedRoute();
    document.body.classList.remove("sidebar-open");
    renderNav();
    if (route !== "time") stopClockTicker();

    if (route === "dashboard") renderDashboard();
    if (route === "board") renderBoard();
    if (route === "logs") renderLogs();
    if (route === "time") renderTime();
    if (route === "members") renderMembers();
    if (route === "registry") renderRegistry();
    if (route === "risks") renderRisks();
    if (route === "archive") renderArchive();
    if (route === "admin") renderAdmin();

    attachDeleteButtons(view);
    refreshIcons();
  }

  function pageHead(eyebrow, title, lead, action = "") {
    return `
      <div class="page-head">
        <div>
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="lead">${escapeHtml(lead)}</p>
        </div>
        <div class="toolbar">${action}</div>
      </div>
    `;
  }

  function renderDashboard() {
    const scopedTasks = visibleTasks();
    const scopedLogs = visibleLogs();
    const scopedTime = visibleTimeEntries();
    const openTasks = scopedTasks.filter((taskItem) => !["Finalizat", "Arhivat"].includes(taskItem.status));
    const blockers = openTasks.filter((taskItem) => taskItem.blocker);
    const criticalLogs = scopedLogs.filter((logItem) => logItem.urgency === "Critică" && logItem.status !== "Închis");
    const hoursThisMonth = sum(scopedTime, (entry) => entry.hours);
    const validatedHours = sum(scopedTime.filter((entry) => entry.validationStatus === "Acceptat"), (entry) => entry.hours);
    const departmentsCount = countBy(openTasks, (taskItem) => taskItem.department);
    const maxDept = Math.max(1, ...Object.values(departmentsCount));
    const statusCount = countBy(scopedTasks, (taskItem) => taskItem.status);
    const urgentSignals = [...openTasks]
      .filter((taskItem) => taskItem.priority === "Critică" || taskItem.blocker || daysUntil(taskItem.deadline) <= 2)
      .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
      .slice(0, 6);
    const recentLogs = [...scopedLogs].slice(0, 5);

    view.innerHTML = `
      ${pageHead(
        "MEU Atlas",
        "Panou executiv",
        "Vedere unificată pentru oameni, lucru, pontaj, riscuri și follow-up-uri.",
        `<button class="ghost-button" data-action="print"><i data-lucide="printer"></i>Raport</button>
         <button class="primary-button" data-action="open-task"><i data-lucide="plus"></i>Task nou</button>`,
      )}

      <div class="grid cols-4">
              ${metric("Membri activi", visibleMembers().filter((memberItem) => memberItem.status === "Activ").length, "users", "Structură vizibilă")}
        ${metric("Task-uri deschise", openTasks.length, "list-checks", `${blockers.length} blocaje active`)}
        ${metric("Ore raportate", hoursThisMonth.toFixed(1), "clock-3", `${validatedHours.toFixed(1)} ore validate`)}
        ${metric("Loguri critice", criticalLogs.length, "siren", "Escaladări și riscuri")}
      </div>

      <div class="dashboard-layout" style="margin-top:16px">
        <div class="grid">
          <section class="panel logo-watermark">
            <div class="section-title">
              <h2>Flux pe status</h2>
              <img class="mini-logo" src="${LOGO}" alt="" aria-hidden="true" />
            </div>
            <div class="bar-list">
              ${statuses
                .map((status, index) => {
                  const count = statusCount[status] || 0;
                  const max = Math.max(1, scopedTasks.length);
                  const color = index % 3 === 0 ? "teal" : index % 3 === 1 ? "" : "green";
                  return barRow(status, count, Math.round((count / max) * 100), color);
                })
                .join("")}
            </div>
          </section>

          <section class="panel">
            <div class="section-title">
              <h2>Încărcare pe departamente</h2>
              <span class="badge blue">${openTasks.length} task-uri active</span>
            </div>
            <div class="bar-list">
              ${departments
                .map((department, index) => {
                  const count = departmentsCount[department] || 0;
                  const color = index % 4 === 0 ? "" : index % 4 === 1 ? "amber" : index % 4 === 2 ? "green" : "teal";
                  return barRow(department, count, Math.round((count / maxDept) * 100), color);
                })
                .join("")}
            </div>
          </section>
        </div>

        <div class="grid">
          <section class="panel">
            <div class="section-title">
              <h2>Semnale executive</h2>
              <span class="badge red">${urgentSignals.length}</span>
            </div>
            <div class="signal-list">
              ${urgentSignals.length ? urgentSignals.map(signalItem).join("") : emptyState("Nu există semnale urgente.")}
            </div>
          </section>

          <section class="panel">
            <div class="section-title">
              <h2>Ultimele raportări</h2>
              <button class="ghost-button" data-route-jump="logs"><i data-lucide="arrow-right"></i>Deschide</button>
            </div>
            <div class="timeline">
              ${recentLogs.map(timelineItem).join("")}
            </div>
          </section>
        </div>
      </div>
    `;

    view.querySelector('[data-action="open-task"]').addEventListener("click", () => openTaskModal());
    view.querySelector('[data-action="print"]').addEventListener("click", () => window.print());
    view.querySelectorAll("[data-route-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = button.dataset.routeJump;
      });
    });
  }

  function metric(label, value, icon, hint) {
    return `
      <section class="metric">
        <div class="metric-top">
          <div>
            <small>${escapeHtml(label)}</small>
            <strong>${escapeHtml(value)}</strong>
          </div>
          <span class="metric-icon"><i data-lucide="${icon}"></i></span>
        </div>
        <span class="delta">${escapeHtml(hint)}</span>
      </section>
    `;
  }

  function barRow(label, count, percent, color) {
    return `
      <div class="bar-row">
        <span>${escapeHtml(label)}</span>
        <span class="bar-track"><span class="bar-fill ${color}" style="width:${Math.max(5, percent)}%"></span></span>
        <strong>${count}</strong>
      </div>
    `;
  }

  function signalItem(taskItem) {
    const due = daysUntil(taskItem.deadline);
    const dueText = due < 0 ? `${Math.abs(due)} zile întârziere` : due === 0 ? "Astăzi" : `${due} zile`;
    return `
      <button class="signal-item" data-task-detail="${taskItem.id}">
        <span>
          <strong>${escapeHtml(taskItem.title)}</strong>
          <span class="row-meta">
            <span>${escapeHtml(taskItem.department)}</span>
            <span>${escapeHtml(memberName(taskItem.ownerId))}</span>
          </span>
        </span>
        <span class="badge ${taskItem.priority === "Critică" ? "red" : "amber"}">${escapeHtml(dueText)}</span>
      </button>
    `;
  }

  function timelineItem(logItem) {
    return `
      <div class="timeline-item">
        <div class="inline-meta">
          <span class="badge ${logItem.urgency === "Critică" ? "red" : logItem.urgency === "Ridicată" ? "amber" : "blue"}">${escapeHtml(logItem.type)}</span>
          <span>${escapeHtml(logItem.department)}</span>
        </div>
        <strong>${escapeHtml(logItem.title)}</strong>
        <p class="meta">${escapeHtml(memberName(logItem.submittedBy))} · ${formatDateTime(logItem.submittedAt)}</p>
      </div>
    `;
  }

  function renderBoard() {
    const search = filters.boardSearch.toLowerCase();
    const scopedTasks = visibleTasks();
    const filteredTasks = scopedTasks.filter((taskItem) => {
      const matchesSearch = [taskItem.title, taskItem.description, taskItem.department, memberName(taskItem.ownerId)]
        .join(" ")
        .toLowerCase()
        .includes(search);
      const matchesDepartment = filters.boardDepartment === "Toate" || taskItem.department === filters.boardDepartment;
      const matchesPriority = filters.boardPriority === "Toate" || taskItem.priority === filters.boardPriority;
      return matchesSearch && matchesDepartment && matchesPriority;
    });

    view.innerHTML = `
      ${pageHead(
        "Operațiuni",
        "Board operațional",
        "Task-uri grupate pe status, cu owner, termen, prioritate, blocaje și dovezi.",
        `<button class="ghost-button" data-action="export-board"><i data-lucide="download"></i>Export</button>
         <button class="primary-button" data-action="open-task"><i data-lucide="plus"></i>Task nou</button>`,
      )}

      <div class="board-toolbar">
        <div class="global-search">
          <i data-lucide="search"></i>
          <input id="boardSearch" type="search" value="${escapeHtml(filters.boardSearch)}" placeholder="Caută în board..." />
        </div>
        <div class="filter-bar">
          <select class="field-select" id="boardDepartment">${departmentOptions(filters.boardDepartment, true)}</select>
          <select class="field-select" id="boardPriority">${optionList(["Toate", ...priorities], filters.boardPriority)}</select>
        </div>
      </div>

      <div class="board" id="kanbanBoard">
        ${statuses
          .map((status) => {
            const cards = filteredTasks.filter((taskItem) => taskItem.status === status);
            return `
              <section class="kanban-column" data-status="${escapeHtml(status)}">
                <div class="kanban-head">
                  <strong>${escapeHtml(status)}</strong>
                  <span class="badge blue">${cards.length}</span>
                </div>
                <div class="kanban-cards">
                  ${cards.length ? cards.map(taskCard).join("") : `<div class="empty-state"><div><img src="${LOGO}" alt="" /><span>Coloană liberă</span></div></div>`}
                </div>
              </section>
            `;
          })
          .join("")}
      </div>
    `;

    view.querySelector('[data-action="open-task"]').addEventListener("click", () => openTaskModal());
    view.querySelector('[data-action="export-board"]').addEventListener("click", () => exportJson("meu-atlas-board.json", visibleTasks()));
    view.querySelector("#boardSearch").addEventListener("input", (event) => {
      filters.boardSearch = event.target.value;
      renderBoard();
    });
    view.querySelector("#boardDepartment").addEventListener("change", (event) => {
      filters.boardDepartment = event.target.value;
      renderBoard();
    });
    view.querySelector("#boardPriority").addEventListener("change", (event) => {
      filters.boardPriority = event.target.value;
      renderBoard();
    });

    attachTaskDetails();
    attachDragAndDrop();
  }

  function taskCard(taskItem) {
    const due = daysUntil(taskItem.deadline);
    const dueClass = due < 0 || taskItem.priority === "Critică" ? "red" : due <= 2 ? "amber" : "blue";
    return `
      <article class="task-card" draggable="true" data-task-id="${taskItem.id}">
        <div class="task-title">
          <strong>${escapeHtml(taskItem.title)}</strong>
          <span class="badge ${priorityClass(taskItem.priority)}">${escapeHtml(taskItem.priority)}</span>
        </div>
        <p class="meta">${escapeHtml(taskItem.description)}</p>
        <div class="task-meta">
          <span class="tag">${escapeHtml(taskItem.department)}</span>
          <span class="badge ${dueClass}">${formatDate(taskItem.deadline)}</span>
          ${taskItem.blocker ? `<span class="badge red">Blocaj</span>` : ""}
        </div>
        <div class="task-meta">
          <span class="avatar-small">${escapeHtml(memberInitials(taskItem.ownerId))}</span>
          <span>${escapeHtml(memberName(taskItem.ownerId))}</span>
          ${taskItem.evidenceUrl ? `<span class="tag">Dovadă</span>` : ""}
          ${deleteButton("task", taskItem.id, `taskul ${taskItem.id}`, "ghost-button", taskItem)}
        </div>
      </article>
    `;
  }

  function attachDragAndDrop() {
    const cards = view.querySelectorAll(".task-card");
    const columns = view.querySelectorAll(".kanban-column");

    cards.forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        card.classList.add("dragging");
        event.dataTransfer.setData("text/plain", card.dataset.taskId);
      });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
    });

    columns.forEach((column) => {
      column.addEventListener("dragover", (event) => {
        event.preventDefault();
        column.classList.add("is-over");
      });
      column.addEventListener("dragleave", () => column.classList.remove("is-over"));
      column.addEventListener("drop", async (event) => {
        event.preventDefault();
        column.classList.remove("is-over");
        const taskId = event.dataTransfer.getData("text/plain");
        const taskItem = state.tasks.find((item) => item.id === taskId);
        if (taskItem && taskItem.status !== column.dataset.status) {
          taskItem.status = column.dataset.status;
          taskItem.updatedAt = new Date().toISOString();
          await tryRemote("Mutarea task-ului", () =>
            remoteUpdate("tasks", taskItem.id, {
              status: taskItem.status,
              updated_at: taskItem.updatedAt,
            }),
          );
          saveState(`Task mutat în ${column.dataset.status}`);
          renderBoard();
          toast("Status actualizat", `${taskItem.id} este acum în ${column.dataset.status}.`);
        }
      });
    });
  }

  function attachTaskDetails() {
    view.querySelectorAll("[data-task-id], [data-task-detail]").forEach((element) => {
      element.addEventListener("click", () => openTaskDetails(element.dataset.taskId || element.dataset.taskDetail));
    });
  }

  function renderLogs() {
    const logs = visibleLogs().filter((logItem) => {
      const matchesType = filters.logType === "Toate" || logItem.type === filters.logType;
      const matchesStatus = filters.logStatus === "Toate" || logItem.status === filters.logStatus;
      return matchesType && matchesStatus;
    });

    view.innerHTML = `
      ${pageHead(
        "Raportări operaționale",
        "Loguri și situații",
        "Canal unic pentru realizat, planificat, probleme, riscuri, cereri, decizii și escaladări.",
        `<button class="ghost-button" data-action="export-logs"><i data-lucide="download"></i>Export</button>`,
      )}

      <div class="split-layout">
        <section class="panel logo-watermark">
          <div class="section-title">
            <h2>Log nou</h2>
            <img class="mini-logo" src="${LOGO}" alt="" aria-hidden="true" />
          </div>
          ${logForm("inlineLogForm")}
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Registru raportări</h2>
            <div class="filter-bar">
              <select id="logTypeFilter">${optionList(["Toate", ...logTypes], filters.logType)}</select>
              <select id="logStatusFilter">${optionList(["Toate", "Nou", "Analizat", "Follow-up", "Închis"], filters.logStatus)}</select>
            </div>
          </div>
          <div class="data-list">
            ${logs.length ? logs.map(logRow).join("") : emptyState("Nu există raportări pe filtrul curent.")}
          </div>
        </section>
      </div>
    `;

    view.querySelector('[data-action="export-logs"]').addEventListener("click", () => exportJson("meu-atlas-loguri.json", visibleLogs()));
    attachLogForm(view.querySelector("#inlineLogForm"));
    view.querySelector("#logTypeFilter").addEventListener("change", (event) => {
      filters.logType = event.target.value;
      renderLogs();
    });
    view.querySelector("#logStatusFilter").addEventListener("change", (event) => {
      filters.logStatus = event.target.value;
      renderLogs();
    });
    attachLogActions();
  }

  function logForm(formId) {
    return `
      <form id="${formId}" class="form-grid">
        <div class="field">
          <label>Tip log</label>
          <select name="type" required>${optionList(logTypes, "Realizat")}</select>
        </div>
        <div class="field">
          <label>Urgență</label>
          <select name="urgency" required>${optionList(urgencyLevels, "Normală")}</select>
        </div>
        <div class="field full">
          <label>Titlu</label>
          <input name="title" required placeholder="Ex: Confirmare furnizor primită" />
        </div>
        <div class="field">
          <label>Raportat de</label>
          <select name="submittedBy" required>${memberOptions("MEM-0005")}</select>
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department" required>${departmentOptions("Executiv & Tehnologie")}</select>
        </div>
        <div class="field full">
          <label>Narațiune</label>
          <textarea name="narrative" required placeholder="Ce s-a întâmplat, ce urmează sau ce este necesar"></textarea>
        </div>
        <div class="field">
          <label>Task asociat</label>
          <select name="relatedTaskId">${taskOptions("", true)}</select>
        </div>
        <div class="field">
          <label>Owner follow-up</label>
          <select name="followUpOwnerId">${memberOptions("", true)}</select>
        </div>
        <div class="field">
          <label>Termen follow-up</label>
          <input name="deadline" type="date" />
        </div>
        <div class="field">
          <label>Vizibilitate</label>
          <select name="visibility">${optionList(["Echipă", "Leadership", "Restricționat"], "Echipă")}</select>
        </div>
        <div class="field full">
          <label>URL dovadă</label>
          <input name="evidenceUrl" type="url" placeholder="https://drive.google.com/..." />
        </div>
        <label class="checkbox-field full">
          <input name="needsFollowUp" type="checkbox" />
          <span>Necesită follow-up</span>
        </label>
        <label class="checkbox-field full">
          <input name="convertToTask" type="checkbox" />
          <span>Transformă în task după salvare</span>
        </label>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="send"></i>Salvează log</button>
        </div>
      </form>
    `;
  }

  function logRow(logItem) {
    return `
      <article class="log-row">
        <div>
          <div class="inline-meta">
            <span class="badge ${logItem.urgency === "Critică" ? "red" : logItem.urgency === "Ridicată" ? "amber" : "blue"}">${escapeHtml(logItem.type)}</span>
            <span class="status-pill ${statusClass(logItem.status)}">${escapeHtml(logItem.status)}</span>
            <span class="tag">${escapeHtml(logItem.visibility)}</span>
          </div>
          <strong>${escapeHtml(logItem.title)}</strong>
          <p class="meta">${escapeHtml(logItem.narrative)}</p>
          <div class="row-meta">
            <span>${escapeHtml(logItem.id)}</span>
            <span>${escapeHtml(memberName(logItem.submittedBy))}</span>
            <span>${escapeHtml(logItem.department)}</span>
            ${logItem.deadline ? `<span>${formatDate(logItem.deadline)}</span>` : ""}
          </div>
        </div>
        <div class="button-row">
          ${logItem.status !== "Închis" ? `<button class="ghost-button" data-log-close="${logItem.id}"><i data-lucide="check-circle-2"></i>Închide</button>` : ""}
          <button class="soft-button" data-log-task="${logItem.id}"><i data-lucide="copy-plus"></i>Task</button>
          ${deleteButton("log", logItem.id, `logul ${logItem.id}`, "danger-button", logItem)}
        </div>
      </article>
    `;
  }

  function attachLogForm(form) {
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const logItem = {
        id: nextId("LOG", state.logs),
        submittedBy: data.get("submittedBy"),
        department: data.get("department"),
        type: data.get("type"),
        title: data.get("title").trim(),
        narrative: data.get("narrative").trim(),
        relatedTaskId: data.get("relatedTaskId"),
        needsFollowUp: data.has("needsFollowUp"),
        followUpOwnerId: data.get("followUpOwnerId"),
        deadline: data.get("deadline"),
        urgency: data.get("urgency"),
        evidenceUrl: data.get("evidenceUrl").trim(),
        convertToTask: data.has("convertToTask"),
        visibility: data.get("visibility"),
        status: data.has("needsFollowUp") ? "Follow-up" : "Nou",
        submittedAt: new Date().toISOString(),
        createdBy: currentAuthUserId(),
      };
      state.logs.unshift(logItem);
      await tryRemote("Logul", () => remoteInsert("operational_logs", toLogRow(logItem)));
      if (logItem.convertToTask) await createTaskFromLog(logItem, false);
      saveState("Log operațional creat");
      render();
      closeModal();
      toast("Log salvat", `${logItem.id} a fost adăugat în registru.`);
    });
  }

  function attachLogActions() {
    view.querySelectorAll("[data-log-close]").forEach((button) => {
      button.addEventListener("click", async () => {
        const logItem = state.logs.find((item) => item.id === button.dataset.logClose);
        if (!logItem) return;
        logItem.status = "Închis";
        await tryRemote("Inchiderea logului", () => remoteUpdate("operational_logs", logItem.id, { status: logItem.status }));
        saveState("Log închis");
        renderLogs();
        toast("Raportare închisă", logItem.title);
      });
    });
    view.querySelectorAll("[data-log-task]").forEach((button) => {
      button.addEventListener("click", async () => {
        const logItem = state.logs.find((item) => item.id === button.dataset.logTask);
        if (!logItem) return;
        const created = await createTaskFromLog(logItem, true);
        toast("Task generat", `${created.id} a fost creat din ${logItem.id}.`);
      });
    });
  }

  async function createTaskFromLog(logItem, shouldRender) {
    const created = {
      id: nextId("TASK", state.tasks),
      title: logItem.title,
      description: logItem.narrative,
      department: logItem.department,
      ownerId: logItem.followUpOwnerId || logItem.submittedBy,
      collaborators: [],
      status: "De făcut",
      priority: logItem.urgency === "Critică" ? "Critică" : logItem.urgency === "Ridicată" ? "Ridicată" : "Normală",
      deadline: logItem.deadline || offsetDate(3),
      blocker: logItem.type === "Problemă" || logItem.type === "Escaladare",
      blockerText: logItem.type === "Problemă" || logItem.type === "Escaladare" ? logItem.narrative : "",
      evidenceUrl: logItem.evidenceUrl,
      relatedLogId: logItem.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentAuthUserId(),
    };
    state.tasks.unshift(created);
    logItem.relatedTaskId = created.id;
    logItem.needsFollowUp = true;
    logItem.status = "Follow-up";
    await tryRemote("Taskul generat din log", () => remoteInsert("tasks", toTaskRow(created)));
    await tryRemote("Actualizarea logului", () =>
      remoteUpdate("operational_logs", logItem.id, {
        related_task_id: logItem.relatedTaskId,
        needs_follow_up: logItem.needsFollowUp,
        status: logItem.status,
      }),
    );
    saveState("Task creat din log");
    if (shouldRender) renderLogs();
    return created;
  }

  function renderTime() {
    const visibleEntries = visibleTimeEntries();
    const scopedTime = filterTimeScope(visibleEntries);
    const filteredEntries = scopedTime.filter((entry) => filters.timeStatus === "Toate" || entry.validationStatus === filters.timeStatus);
    const pending = scopedTime.filter((entry) => entry.validationStatus === "În așteptare");
    const accepted = scopedTime.filter((entry) => entry.validationStatus === "Acceptat");
    const todayHours = sum(visibleEntries.filter((entry) => isToday(entry.date)), (entry) => entry.hours);
    const weekHours = sum(visibleEntries.filter((entry) => isThisWeek(entry.date)), (entry) => entry.hours);
    const totalHours = sum(scopedTime, (entry) => entry.hours);
    const acceptedHours = sum(accepted, (entry) => entry.hours);
    const activeClock = state.clock;

    view.innerHTML = `
      ${pageHead(
        "Pontaj",
        "Timp, contribuții și validări",
        "Timer live, pontaj manual și validare curată pentru orele lucrate în MEU Atlas.",
        `<button class="ghost-button" data-action="export-time"><i data-lucide="download"></i>Export</button>`,
      )}

      <div class="grid cols-4">
        ${metric("Azi", todayHours.toFixed(1), "sun", "Ore înregistrate astăzi")}
        ${metric("Săptămâna", weekHours.toFixed(1), "calendar-range", "Vizibile pentru contul tău")}
        ${metric("Validate", acceptedHours.toFixed(1), "badge-check", "În filtrul curent")}
        ${metric("De verificat", pending.length, "hourglass", "În așteptare")}
      </div>

      <div class="time-console" style="margin-top:16px">
        <section class="panel logo-watermark clock-card ${activeClock ? "is-running" : ""}">
          <div class="section-title">
            <h2>Timer pontaj</h2>
            <span class="badge ${activeClock ? "green" : "blue"}">${activeClock ? "Activ" : "Pregătit"}</span>
          </div>

          <div class="clock-panel">
            <div class="clock-face">
              <p class="meta">${activeClock ? "Sesiune în desfășurare" : "Alege contextul și pornește timerul"}</p>
              <div class="clock-time" data-clock-time>${activeClock ? elapsedClock(activeClock.start) : "00:00:00"}</div>
              <div class="clock-context">
                ${activeClock ? clockContext(activeClock) : `<span class="tag">${escapeHtml(memberName(timeDefaultMemberId()))}</span><span class="tag">${escapeHtml(timeDefaultDepartment())}</span>`}
              </div>
            </div>
            <div class="clock-actions">
              <button class="${activeClock ? "danger-button" : "primary-button"}" id="clockToggle">
                <i data-lucide="${activeClock ? "square" : "play"}"></i>
                ${activeClock ? "Oprește și salvează" : "Pornește"}
              </button>
              ${activeClock ? `<button class="ghost-button" id="clockCancel"><i data-lucide="x"></i>Anulează</button>` : ""}
            </div>
          </div>

          ${activeClock ? activeClockSummary(activeClock) : clockStartForm()}
          ${!activeClock ? quickClockPresets() : ""}
        </section>

        <section class="panel manual-time-card">
          <div class="section-title">
            <h2>Pontaj manual</h2>
            <span class="badge blue">Corecție rapidă</span>
          </div>
          ${timeForm()}
        </section>
      </div>

      <section class="panel" style="margin-top:16px">
        <div class="section-title">
          <h2>Registru pontaj</h2>
          <div class="filter-bar">
            <select id="timeScopeFilter">${optionList(["Azi", "Săptămâna aceasta", "Luna aceasta", "Toate"], filters.timeScope)}</select>
            <select id="timeStatusFilter">${optionList(["Toate", "În așteptare", "Acceptat", "Necesită clarificare"], filters.timeStatus)}</select>
          </div>
        </div>
        <div class="table-head time-head">
          <span>Membru</span><span>Ore</span><span>Activitate</span><span>Validare</span>
        </div>
        <div class="data-list">
          ${filteredEntries.length ? filteredEntries.map(timeRow).join("") : emptyState("Nu există pontaje pe filtrul curent.")}
        </div>
      </section>
    `;

    view.querySelector('[data-action="export-time"]').addEventListener("click", () => exportJson("meu-atlas-pontaj.json", visibleTimeEntries()));
    view.querySelector("#timeEntryForm").addEventListener("submit", handleTimeSubmit);
    view.querySelector("#timeScopeFilter").addEventListener("change", (event) => {
      filters.timeScope = event.target.value;
      renderTime();
    });
    view.querySelector("#timeStatusFilter").addEventListener("change", (event) => {
      filters.timeStatus = event.target.value;
      renderTime();
    });
    view.querySelector("#clockToggle").addEventListener("click", handleClockToggle);
    view.querySelector("#clockCancel")?.addEventListener("click", handleClockCancel);
    view.querySelectorAll("[data-clock-preset]").forEach((button) => {
      button.addEventListener("click", () => startClockFromPreset(button.dataset.clockPreset));
    });
    attachTimeValidation();
    setupClockTicker();
  }

  function isToday(value) {
    return value === new Date().toISOString().slice(0, 10);
  }

  function isThisWeek(value) {
    if (!value) return false;
    const target = new Date(value);
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return target >= start && target < end;
  }

  function isThisMonth(value) {
    if (!value) return false;
    const target = new Date(value);
    const today = new Date();
    return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
  }

  function filterTimeScope(entries) {
    if (filters.timeScope === "Azi") return entries.filter((entry) => isToday(entry.date));
    if (filters.timeScope === "Săptămâna aceasta") return entries.filter((entry) => isThisWeek(entry.date));
    if (filters.timeScope === "Luna aceasta") return entries.filter((entry) => isThisMonth(entry.date));
    return entries;
  }

  function clockContext(clock) {
    return `
      <span class="tag">${escapeHtml(memberName(clock.memberId))}</span>
      <span class="tag">${escapeHtml(clock.department)}</span>
      <span class="tag">${escapeHtml(clock.activity)}</span>
      ${clock.relatedTaskId ? `<span class="tag">${escapeHtml(clock.relatedTaskId)}</span>` : ""}
    `;
  }

  function activeClockSummary(clock) {
    return `
      <div class="active-clock-summary">
        <div>
          <span class="meta">Pornit la</span>
          <strong>${formatDateTime(clock.start)}</strong>
        </div>
        <div>
          <span class="meta">Se va salva ca</span>
          <strong data-clock-duration>${elapsedHours(clock.start).toFixed(2)} ore</strong>
        </div>
        <div>
          <span class="meta">Notă</span>
          <strong>${escapeHtml(clock.notes || "Sesiune timer")}</strong>
        </div>
      </div>
    `;
  }

  function quickClockPresets() {
    const presets = ["Ședință", "Administrativ", "Comunicare", "Recrutare"];
    return `
      <div class="time-presets">
        ${presets.map((activity) => `<button class="ghost-button" data-clock-preset="${escapeHtml(activity)}"><i data-lucide="zap"></i>${escapeHtml(activity)}</button>`).join("")}
      </div>
    `;
  }

  function clockStartForm() {
    const memberId = timeDefaultMemberId();
    const department = timeDefaultDepartment(memberId);
    return `
      <form id="clockStartForm" class="form-grid compact-clock-form" style="margin-top:14px">
        <div class="field">
          <label>Membru</label>
          <select name="memberId">${timeMemberOptions(memberId)}</select>
        </div>
        <div class="field">
          <label>Activitate</label>
          <select name="activity">${optionList(activities, "Administrativ")}</select>
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department">${timeDepartmentOptions(department)}</select>
        </div>
        <div class="field">
          <label>Task</label>
          <select name="relatedTaskId">${taskOptions("", true)}</select>
        </div>
        <div class="field full">
          <label>Notă scurtă</label>
          <input name="notes" placeholder="Ex: pregătire materiale, call parteneri" />
        </div>
      </form>
    `;
  }

  function elapsedClock(start) {
    const diff = Math.max(0, Date.now() - new Date(start).getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function elapsedHours(start) {
    const rawHours = Math.max(0, (Date.now() - new Date(start).getTime()) / 3600000);
    return Math.max(0.25, Math.round(rawHours * 4) / 4);
  }

  function stopClockTicker() {
    if (clockTicker) clearInterval(clockTicker);
    clockTicker = null;
  }

  function setupClockTicker() {
    stopClockTicker();
    if (!state.clock || currentRoute() !== "time") return;
    const updateClock = () => {
      const clockNode = view.querySelector("[data-clock-time]");
      const durationNode = view.querySelector("[data-clock-duration]");
      if (clockNode) clockNode.textContent = elapsedClock(state.clock.start);
      if (durationNode) durationNode.textContent = `${elapsedHours(state.clock.start).toFixed(2)} ore`;
    };
    updateClock();
    clockTicker = setInterval(updateClock, 1000);
  }

  async function handleClockToggle() {
    if (state.clock) {
      const hours = elapsedHours(state.clock.start);
      const entry = {
        id: nextId("TIME", state.timeEntries),
        memberId: state.clock.memberId,
        date: new Date().toISOString().slice(0, 10),
        department: state.clock.department,
        activity: state.clock.activity,
        relatedTaskId: state.clock.relatedTaskId,
        relatedLogId: "",
        hours,
        notes: state.clock.notes || "Sesiune timer",
        validationStatus: "În așteptare",
        validatedBy: "",
        createdAt: new Date().toISOString(),
        createdBy: state.clock.createdBy || currentAuthUserId(),
      };
      state.timeEntries.unshift(entry);
      state.clock = null;
      stopClockTicker();
      await tryRemote("Pontajul", () => remoteInsert("time_entries", toTimeEntryRow(entry)));
      saveState("Sesiune pontaj închisă");
      renderTime();
      toast("Pontaj creat", `${entry.hours} ore au fost adăugate.`);
      return;
    }

    const form = view.querySelector("#clockStartForm");
    const data = new FormData(form);
    const memberId = data.get("memberId") || timeDefaultMemberId();
    state.clock = {
      memberId,
      department: data.get("department") || timeDefaultDepartment(memberId),
      activity: data.get("activity"),
      relatedTaskId: data.get("relatedTaskId"),
      notes: data.get("notes").trim(),
      start: new Date().toISOString(),
      createdBy: currentAuthUserId(),
      startedBy: activeAccount()?.username || "",
    };
    saveState("Sesiune pontaj pornită");
    renderTime();
    toast("Sesiune pornită", `Pontaj activ pentru ${memberName(state.clock.memberId)}.`);
  }

  function startClockFromPreset(activity) {
    if (state.clock) return;
    const memberId = timeDefaultMemberId();
    state.clock = {
      memberId,
      department: timeDefaultDepartment(memberId),
      activity,
      relatedTaskId: "",
      notes: `Start rapid: ${activity}`,
      start: new Date().toISOString(),
      createdBy: currentAuthUserId(),
      startedBy: activeAccount()?.username || "",
    };
    saveState("Sesiune pontaj pornită rapid");
    renderTime();
    toast("Timer pornit", `${activity} pentru ${memberName(memberId)}.`);
  }

  function handleClockCancel() {
    if (!state.clock) return;
    if (!confirm("Anulezi sesiunea activă fără să salvezi pontaj?")) return;
    state.clock = null;
    stopClockTicker();
    saveState("Sesiune pontaj anulată");
    renderTime();
    toast("Sesiune anulată", "Nu s-a salvat niciun pontaj.");
  }

  function timeForm() {
    const memberId = timeDefaultMemberId();
    const department = timeDefaultDepartment(memberId);
    return `
      <form id="timeEntryForm" class="form-grid">
        <div class="field">
          <label>Membru</label>
          <select name="memberId" required>${timeMemberOptions(memberId)}</select>
        </div>
        <div class="field">
          <label>Data</label>
          <input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" required />
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department" required>${timeDepartmentOptions(department)}</select>
        </div>
        <div class="field">
          <label>Activitate</label>
          <select name="activity" required>${optionList(activities, "Administrativ")}</select>
        </div>
        <div class="field">
          <label>Ore</label>
          <input name="hours" type="number" min="0.25" step="0.25" value="1" required />
        </div>
        <div class="field">
          <label>Task</label>
          <select name="relatedTaskId">${taskOptions("", true)}</select>
        </div>
        <div class="field full">
          <label>Log asociat</label>
          <select name="relatedLogId">${logOptions("", true)}</select>
        </div>
        <div class="field full">
          <label>Notițe</label>
          <textarea name="notes" placeholder="Ce ai lucrat, în 1-2 propoziții"></textarea>
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="plus"></i>Adaugă pontaj</button>
        </div>
      </form>
    `;
  }

  async function handleTimeSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const hours = Number(data.get("hours"));
    if (!Number.isFinite(hours) || hours <= 0) {
      toast("Ore invalide", "Pontajul trebuie să aibă minimum 0.25 ore.");
      return;
    }
    const memberId = data.get("memberId") || timeDefaultMemberId();
    const entry = {
      id: nextId("TIME", state.timeEntries),
      memberId,
      date: data.get("date"),
      department: data.get("department") || timeDefaultDepartment(memberId),
      activity: data.get("activity"),
      relatedTaskId: data.get("relatedTaskId"),
      relatedLogId: data.get("relatedLogId"),
      hours,
      notes: data.get("notes").trim(),
      validationStatus: "În așteptare",
      validatedBy: "",
      createdAt: new Date().toISOString(),
      createdBy: currentAuthUserId(),
    };
    state.timeEntries.unshift(entry);
    await tryRemote("Pontajul", () => remoteInsert("time_entries", toTimeEntryRow(entry)));
    saveState("Pontaj creat");
    renderTime();
    toast("Pontaj adăugat", `${entry.id} a fost salvat.`);
  }

  function timeRow(entry) {
    return `
      <article class="time-row">
        <div>
          <strong>${escapeHtml(memberName(entry.memberId))}</strong>
          <div class="row-meta">
            <span>${formatDate(entry.date)}</span>
            <span>${escapeHtml(entry.department)}</span>
            ${entry.relatedTaskId ? `<span>${escapeHtml(entry.relatedTaskId)}</span>` : ""}
            ${entry.createdAt ? `<span>${formatDateTime(entry.createdAt)}</span>` : ""}
          </div>
        </div>
        <strong>${Number(entry.hours).toFixed(2)}</strong>
        <div>
          <span class="tag">${escapeHtml(entry.activity)}</span>
          <p class="meta">${escapeHtml(entry.notes || "Fără notițe")}</p>
        </div>
        <div class="button-row">
          <span class="status-pill ${statusClass(entry.validationStatus)}">${escapeHtml(entry.validationStatus)}</span>
          ${canValidateTime() && entry.validationStatus !== "Acceptat" ? `<button class="soft-button" data-time-accept="${entry.id}"><i data-lucide="badge-check"></i>Acceptă</button>` : ""}
          ${canValidateTime() && entry.validationStatus !== "Necesită clarificare" ? `<button class="ghost-button" data-time-clarify="${entry.id}"><i data-lucide="circle-help"></i>Clarifică</button>` : ""}
          ${deleteButton("time", entry.id, `pontajul ${entry.id}`, "danger-button", entry)}
        </div>
      </article>
    `;
  }

  function attachTimeValidation() {
    view.querySelectorAll("[data-time-accept]").forEach((button) => {
      button.addEventListener("click", async () => {
        const entry = state.timeEntries.find((item) => item.id === button.dataset.timeAccept);
        if (!entry) return;
        entry.validationStatus = "Acceptat";
        entry.validatedBy = "MEM-0011";
        await tryRemote("Validarea pontajului", () =>
          remoteUpdate("time_entries", entry.id, {
            validation_status: entry.validationStatus,
            validated_by: entry.validatedBy,
          }),
        );
        saveState("Pontaj acceptat");
        renderTime();
      });
    });
    view.querySelectorAll("[data-time-clarify]").forEach((button) => {
      button.addEventListener("click", async () => {
        const entry = state.timeEntries.find((item) => item.id === button.dataset.timeClarify);
        if (!entry) return;
        entry.validationStatus = "Necesită clarificare";
        entry.validatedBy = "MEM-0011";
        await tryRemote("Clarificarea pontajului", () =>
          remoteUpdate("time_entries", entry.id, {
            validation_status: entry.validationStatus,
            validated_by: entry.validatedBy,
          }),
        );
        saveState("Pontaj marcat pentru clarificare");
        renderTime();
      });
    });
  }

  function renderMembers() {
    const scopedMembers = visibleMembers();
    const members = scopedMembers.filter((memberItem) => filters.memberDepartment === "Toate" || memberItem.department === filters.memberDepartment);
    const safePersons = scopedMembers.filter((memberItem) => memberItem.safePerson).length;
    const directors = scopedMembers.filter((memberItem) => memberItem.accessLevel === "Director").length;

    view.innerHTML = `
      ${pageHead(
        "HR",
        "Registru membri",
        "Profiluri, roluri, acces, manageri și indicator Safe Person.",
        `<button class="ghost-button" data-action="export-members"><i data-lucide="download"></i>Export</button>
         <button class="primary-button" data-action="open-member"><i data-lucide="user-plus"></i>Membru nou</button>`,
      )}

      <div class="grid cols-3">
        ${metric("Membri activi", scopedMembers.filter((memberItem) => memberItem.status === "Activ").length, "users", "În registrul vizibil")}
        ${metric("Directori", directors, "briefcase-business", "Nivel director")}
        ${metric("Safe Persons", safePersons, "heart-handshake", "Marcaj sensibil")}
      </div>

      <section class="panel" style="margin-top:16px">
        <div class="section-title">
          <h2>Listă membri</h2>
          <select id="memberDepartmentFilter">${departmentOptions(filters.memberDepartment, true)}</select>
        </div>
        <div class="table-head member-head">
          <span></span><span>Membru</span><span>Rol</span><span>Status</span>
        </div>
        <div class="data-list">
          ${members.map(memberRow).join("")}
        </div>
      </section>
    `;

    view.querySelector('[data-action="open-member"]').addEventListener("click", () => openMemberModal());
    view.querySelector('[data-action="export-members"]').addEventListener("click", () => exportJson("meu-atlas-membri.json", visibleMembers()));
    view.querySelector("#memberDepartmentFilter").addEventListener("change", (event) => {
      filters.memberDepartment = event.target.value;
      renderMembers();
    });
    view.querySelectorAll("[data-member-detail]").forEach((button) => {
      button.addEventListener("click", () => openMemberDetails(button.dataset.memberDetail));
    });
  }

  function memberRow(memberItem) {
    return `
      <article class="member-row">
        <span class="avatar">${escapeHtml(memberInitials(memberItem.name))}</span>
        <span>
          <strong>${escapeHtml(memberItem.name)}</strong>
          <span class="row-meta">
            <span>${escapeHtml(memberItem.email)}</span>
            <span>${escapeHtml(memberItem.department)}</span>
          </span>
        </span>
        <span>
          <strong>${escapeHtml(memberItem.role)}</strong>
          <span class="row-meta">${escapeHtml(memberItem.manager || "Fără manager setat")}</span>
        </span>
        <span class="button-row">
          <span class="status-pill ${statusClass(memberItem.status)}">${escapeHtml(memberItem.status)}</span>
          ${memberItem.safePerson ? `<span class="badge teal">Safe Person</span>` : ""}
          <span class="tag">${escapeHtml(memberItem.accessLevel)}</span>
          <button class="ghost-button" data-member-detail="${memberItem.id}"><i data-lucide="eye"></i>Detalii</button>
          ${seedMemberIds.has(memberItem.id) ? "" : deleteButton("member", memberItem.id, `membrul ${memberItem.name}`, "danger-button", memberItem)}
        </span>
      </article>
    `;
  }

  function openMemberModal() {
    openModal(`
      <h2 id="modalTitle">Membru nou</h2>
      <form id="memberForm" class="form-grid">
        <div class="field">
          <label>Nume</label>
          <input name="name" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input name="email" type="email" required />
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department" required>${departmentOptions("Resurse Umane")}</select>
        </div>
        <div class="field">
          <label>Rol</label>
          <input name="role" required />
        </div>
        <div class="field">
          <label>Manager</label>
          <input name="manager" />
        </div>
        <div class="field">
          <label>Nivel acces</label>
          <select name="accessLevel">${optionList(["Head", "Coordonator", "Manager", "Director", "Admin"], "Head")}</select>
        </div>
        <div class="field">
          <label>Status</label>
          <select name="status">${optionList(["Activ", "Onboarding", "Inactiv"], "Activ")}</select>
        </div>
        <label class="checkbox-field">
          <input name="safePerson" type="checkbox" />
          <span>Safe Person</span>
        </label>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="user-plus"></i>Adaugă membru</button>
        </div>
      </form>
    `);

    document.getElementById("memberForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const memberItem = {
        id: nextId("MEM", state.members),
        name: data.get("name").trim(),
        email: data.get("email").trim(),
        department: data.get("department"),
        role: data.get("role").trim(),
        manager: data.get("manager").trim(),
        accessLevel: data.get("accessLevel"),
        safePerson: data.has("safePerson"),
        status: data.get("status"),
        addedAt: new Date().toISOString().slice(0, 10),
      };
      state.members.push(memberItem);
      await tryRemote("Membrul", () => remoteInsert("members", toMemberRow(memberItem)));
      saveState("Membru adăugat");
      closeModal();
      renderMembers();
      toast("Membru adăugat", `${memberItem.name} este acum în registru.`);
    });
  }

  function openMemberDetails(memberId) {
    const memberItem = state.members.find((item) => item.id === memberId);
    if (!memberItem) return;
    const tasks = state.tasks.filter((taskItem) => taskItem.ownerId === memberId);
    const hours = sum(state.timeEntries.filter((entry) => entry.memberId === memberId), (entry) => entry.hours);
    const logs = state.logs.filter((logItem) => logItem.submittedBy === memberId);
    openModal(`
      <h2 id="modalTitle">${escapeHtml(memberItem.name)}</h2>
      <div class="grid cols-3">
        ${metric("Task-uri", tasks.length, "list-checks", "Owner")}
        ${metric("Ore", hours.toFixed(1), "clock-3", "Raportate")}
        ${metric("Loguri", logs.length, "message-square", "Trimise")}
      </div>
      <section class="panel" style="margin-top:14px">
        <p class="inline-meta">
          <span class="tag">${escapeHtml(memberItem.department)}</span>
          <span class="tag">${escapeHtml(memberItem.role)}</span>
          <span class="tag">${escapeHtml(memberItem.accessLevel)}</span>
          ${memberItem.safePerson ? `<span class="badge teal">Safe Person</span>` : ""}
        </p>
        <p><strong>Email:</strong> ${escapeHtml(memberItem.email)}</p>
        <p><strong>Manager:</strong> ${escapeHtml(memberItem.manager || "Nesetat")}</p>
        <p><strong>Status:</strong> ${escapeHtml(memberItem.status)}</p>
      </section>
      <div class="button-row" style="margin-top:14px">
        ${deleteButton("member", memberItem.id, `membrul ${memberItem.name}`, "danger-button", memberItem)}
      </div>
    `);
  }

  function renderRegistry() {
    const entries = [...(state.registryEntries || [])].sort((a, b) => Number(b.sequence || 0) - Number(a.sequence || 0));
    const issuedToday = entries.filter((entry) => entry.documentDate === new Date().toISOString().slice(0, 10)).length;
    const lastEntry = entries[0];

    view.innerHTML = `
      ${pageHead(
        "Registratură",
        "Registru documente MEU",
        "Alocare controlată de numere MEUTM, cu istoric, descriere scurtă și trasabilitate.",
        `<button class="primary-button" data-action="open-registry"><i data-lucide="stamp"></i>Număr nou</button>`,
      )}

      <div class="grid cols-3">
        ${metric("Total înregistrări", entries.length, "archive", "Registru curent")}
        ${metric("Astăzi", issuedToday, "calendar-check", formatRegistryDate(new Date()))}
        ${metric("Ultimul număr", lastEntry ? lastEntry.registryNumber : "MEUTM/0000", "hash", lastEntry ? lastEntry.title : "Nicio înregistrare")}
      </div>

      <section class="panel" style="margin-top:16px">
        <div class="section-title">
          <h2>Istoric registratură</h2>
          <span class="badge blue">${entries.length}</span>
        </div>
        <div class="registry-list">
          ${entries.length ? entries.map(registryRow).join("") : emptyState("Nu există încă numere de înregistrare.")}
        </div>
      </section>
    `;

    view.querySelector('[data-action="open-registry"]').addEventListener("click", () => openRegistryModal());
    view.querySelectorAll("[data-registry-detail]").forEach((button) => {
      button.addEventListener("click", () => openRegistryDetails(button.dataset.registryDetail));
    });
  }

  function registryRow(entry) {
    return `
      <article class="registry-row">
        <span>
          <strong>${escapeHtml(entry.registryNumber)}</strong>
          <span class="row-meta">
            <span>${formatDate(entry.documentDate)}</span>
            <span>${escapeHtml(entry.documentType)}</span>
            <span>${escapeHtml(entry.direction)}</span>
          </span>
        </span>
        <span>
          <strong>${escapeHtml(entry.title)}</strong>
          <span class="row-meta">${escapeHtml(entry.summary || "Fără descriere")}</span>
        </span>
        <span class="tag">${escapeHtml(entry.department || "General")}</span>
        <span class="button-row">
          <span class="status-pill ${statusClass(entry.status)}">${escapeHtml(entry.status)}</span>
          <button class="ghost-button" data-registry-detail="${entry.id}"><i data-lucide="eye"></i>Detalii</button>
          ${deleteButton("registry", entry.id, `numărul ${entry.registryNumber}`, "danger-button", entry)}
        </span>
      </article>
    `;
  }

  function openRegistryModal() {
    openModal(`
      <h2 id="modalTitle">Număr nou de înregistrare</h2>
      <form id="registryForm" class="form-grid">
        <div class="field">
          <label>Data documentului</label>
          <input name="documentDate" type="date" value="${new Date().toISOString().slice(0, 10)}" required />
        </div>
        <div class="field">
          <label>Tip document</label>
          <select name="documentType">${optionList(["Adresă", "Contract", "Cerere", "Decizie", "Proces-verbal", "Invitație", "Dovadă", "Alt document"], "Adresă")}</select>
        </div>
        <div class="field">
          <label>Direcție</label>
          <select name="direction">${optionList(["Intrare", "Ieșire", "Intern"], "Intern")}</select>
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department">${departmentOptions(accountDepartment() || "Executiv & Tehnologie")}</select>
        </div>
        <div class="field full">
          <label>Titlu document</label>
          <input name="title" required placeholder="Ex: Adresă confirmare parteneriat" />
        </div>
        <div class="field full">
          <label>Descriere pe scurt</label>
          <textarea name="summary" required placeholder="Descriere scurtă, clară, suficientă pentru istoric"></textarea>
        </div>
        <div class="field">
          <label>Solicitant / responsabil</label>
          <select name="requesterId">${memberOptions(activeAccount()?.memberId || "MEM-0005")}</select>
        </div>
        <div class="field">
          <label>Instituție / persoană externă</label>
          <input name="externalParty" placeholder="Opțional" />
        </div>
        <div class="field full">
          <label>URL document</label>
          <input name="fileUrl" type="url" placeholder="https://drive.google.com/..." />
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="stamp"></i>Generează număr</button>
        </div>
      </form>
    `);

    document.getElementById("registryForm").addEventListener("submit", handleRegistrySubmit);
  }

  async function handleRegistrySubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft = {
      title: data.get("title").trim(),
      summary: data.get("summary").trim(),
      documentType: data.get("documentType"),
      direction: data.get("direction"),
      department: data.get("department"),
      requesterId: data.get("requesterId"),
      externalParty: data.get("externalParty").trim(),
      documentDate: data.get("documentDate"),
      fileUrl: data.get("fileUrl").trim(),
    };

    let created;
    try {
      created = await remoteRpc("create_registry_entry", {
        p_title: draft.title,
        p_summary: draft.summary,
        p_document_type: draft.documentType,
        p_direction: draft.direction,
        p_department: draft.department,
        p_requester_id: draft.requesterId || null,
        p_external_party: draft.externalParty || "",
        p_document_date: draft.documentDate,
        p_file_url: draft.fileUrl || "",
      });
      await loadRemoteData();
      const createdId = Array.isArray(created) ? created[0]?.id : created?.id;
      const entry = state.registryEntries.find((item) => item.id === createdId) || normalizeRegistryEntry(Array.isArray(created) ? created[0] : created);
      toast("Număr generat", entry.registryNumber);
    } catch (error) {
      console.warn(error);
      const nextSequence = Math.max(0, ...(state.registryEntries || []).map((entry) => Number(entry.sequence || 0))) + 1;
      const fallbackEntry = {
        id: crypto.randomUUID(),
        registryNumber: `MEUTM/${String(nextSequence).padStart(4, "0")}/${formatRegistryDate(draft.documentDate)}`,
        sequence: nextSequence,
        ...draft,
        status: "Înregistrat",
        createdBy: currentAuthUserId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.registryEntries.unshift(fallbackEntry);
      state.registryHistory.unshift({
        id: crypto.randomUUID(),
        registryEntryId: fallbackEntry.id,
        action: "Creat local",
        note: "Supabase nu a generat numărul. Verifică funcția SQL create_registry_entry.",
        actorId: activeAccount()?.memberId || "",
        createdAt: new Date().toISOString(),
      });
      toast("Număr local", fallbackEntry.registryNumber);
    }

    saveState("Număr de registratură creat");
    closeModal();
    renderRegistry();
  }

  function openRegistryDetails(entryId) {
    const entry = (state.registryEntries || []).find((item) => item.id === entryId);
    if (!entry) return;
    const history = (state.registryHistory || [])
      .filter((item) => item.registryEntryId === entryId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    openModal(`
      <h2 id="modalTitle">${escapeHtml(entry.registryNumber)}</h2>
      <p class="inline-meta">
        <span class="tag">${escapeHtml(entry.documentType)}</span>
        <span class="tag">${escapeHtml(entry.direction)}</span>
        <span class="status-pill ${statusClass(entry.status)}">${escapeHtml(entry.status)}</span>
      </p>
      <section class="panel" style="margin-top:14px">
        <h2>${escapeHtml(entry.title)}</h2>
        <p>${escapeHtml(entry.summary)}</p>
        <p class="row-meta">
          <span>${formatDate(entry.documentDate)}</span>
          <span>${escapeHtml(entry.department)}</span>
          <span>${escapeHtml(memberName(entry.requesterId))}</span>
          ${entry.externalParty ? `<span>${escapeHtml(entry.externalParty)}</span>` : ""}
        </p>
        ${entry.fileUrl ? `<a class="soft-button" href="${escapeHtml(entry.fileUrl)}" target="_blank" rel="noreferrer"><i data-lucide="external-link"></i>Deschide document</a>` : ""}
      </section>
      <section class="panel" style="margin-top:14px">
        <div class="section-title">
          <h2>Istoric</h2>
          <span class="badge blue">${history.length}</span>
        </div>
        <div class="timeline">
          ${history.length ? history.map(registryHistoryItem).join("") : `<p class="meta">Nu există evenimente suplimentare.</p>`}
        </div>
      </section>
      <form id="registryHistoryForm" class="form-grid" style="margin-top:14px">
        <div class="field">
          <label>Status</label>
          <select name="status">${optionList(["Înregistrat", "În lucru", "Trimis", "Primit", "Arhivat"], entry.status)}</select>
        </div>
        <div class="field">
          <label>Notă istoric</label>
          <input name="note" placeholder="Ex: transmis către partener" />
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="history"></i>Actualizează istoricul</button>
        </div>
      </form>
      <div class="button-row" style="margin-top:14px">
        ${deleteButton("registry", entry.id, `numărul ${entry.registryNumber}`, "danger-button", entry)}
      </div>
    `);

    document.getElementById("registryHistoryForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const newStatus = data.get("status");
      const note = data.get("note").trim();
      entry.status = newStatus;
      entry.updatedAt = new Date().toISOString();
      const historyItem = {
        id: crypto.randomUUID(),
        registryEntryId: entry.id,
        action: `Status: ${newStatus}`,
        note,
        actorId: activeAccount()?.memberId || "",
        createdAt: new Date().toISOString(),
      };
      state.registryHistory.unshift(historyItem);
      await tryRemote("Actualizarea registraturii", async () => {
        await remoteUpdate("registry_entries", entry.id, { status: entry.status, updated_at: entry.updatedAt });
        await remoteInsert("registry_history", toRegistryHistoryRow(historyItem));
        return true;
      });
      saveState("Registratură actualizată");
      closeModal();
      renderRegistry();
    });

    refreshIcons();
  }

  function registryHistoryItem(item) {
    return `
      <div class="timeline-item">
        <strong>${escapeHtml(item.action)}</strong>
        <p class="meta">${formatDateTime(item.createdAt)} · ${escapeHtml(memberName(item.actorId))}</p>
        ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
      </div>
    `;
  }

  function renderRisks() {
    view.innerHTML = `
      ${pageHead(
        "Guvernanță",
        "Risc & Compliance",
        "Registru cu acces restricționat pentru risc, siguranță, GDPR, legal și Safe Person.",
        `<button class="primary-button" data-action="open-risk"><i data-lucide="shield-plus"></i>Risc nou</button>`,
      )}

      <div class="split-layout">
        <section class="panel">
          <div class="section-title">
            <h2>Registru activ</h2>
            <span class="badge red">Acces controlat</span>
          </div>
          <div class="data-list">
            ${state.risks.map(riskRow).join("")}
          </div>
        </section>

        <section class="panel logo-watermark">
          <div class="section-title">
            <h2>Matrice acces</h2>
            <img class="mini-logo" src="${LOGO}" alt="" aria-hidden="true" />
          </div>
          <div class="access-grid">
            ${accessTile("Task-uri operaționale", "Departament + Leadership", "Vizibilitate de lucru")}
            ${accessTile("Pontaj", "Membru + HR + Director", "Agregat pentru Executive")}
            ${accessTile("Raportări sensibile", "Safe Person + Compliance", "Separat de restul logurilor")}
            ${accessTile("Registru membri", "HR + Admin", "Contact limitat pentru echipe")}
            ${accessTile("Audit", "CTO + Director", "Istoric modificări")}
            ${accessTile("Arhivă Drive", "După record", "Permisiuni aliniate")}
          </div>
        </section>
      </div>
    `;

    view.querySelector('[data-action="open-risk"]').addEventListener("click", () => openRiskModal());
    view.querySelectorAll("[data-risk-close]").forEach((button) => {
      button.addEventListener("click", async () => {
        const riskItem = state.risks.find((item) => item.id === button.dataset.riskClose);
        if (!riskItem) return;
        riskItem.status = "Monitorizat";
        await tryRemote("Actualizarea riscului", () => remoteUpdate("risks", riskItem.id, { status: riskItem.status }));
        saveState("Risc monitorizat");
        renderRisks();
      });
    });
  }

  function riskRow(riskItem) {
    return `
      <article class="risk-row">
        <div>
          <div class="inline-meta">
            <span class="badge ${riskItem.severity === "Critică" ? "red" : "amber"}">${escapeHtml(riskItem.severity)}</span>
            <span class="tag">${escapeHtml(riskItem.category)}</span>
            <span class="tag">${escapeHtml(riskItem.visibility)}</span>
          </div>
          <strong>${escapeHtml(riskItem.description)}</strong>
          <p class="meta">${escapeHtml(riskItem.mitigation)}</p>
        </div>
        <div>
          <strong>${escapeHtml(memberName(riskItem.ownerId))}</strong>
          <p class="meta">${escapeHtml(riskItem.status)}</p>
        </div>
        <div class="button-row">
          <button class="ghost-button" data-risk-close="${riskItem.id}"><i data-lucide="check"></i>Monitorizat</button>
          ${deleteButton("risk", riskItem.id, `riscul ${riskItem.id}`, "danger-button", riskItem)}
        </div>
      </article>
    `;
  }

  function accessTile(title, audience, note) {
    return `
      <div class="access-tile">
        <strong>${escapeHtml(title)}</strong>
        <span class="tag">${escapeHtml(audience)}</span>
        <small class="meta">${escapeHtml(note)}</small>
      </div>
    `;
  }

  function openRiskModal() {
    openModal(`
      <h2 id="modalTitle">Risc nou</h2>
      <form id="riskForm" class="form-grid">
        <div class="field">
          <label>Categorie</label>
          <select name="category">${optionList(["Protecția datelor", "Siguranță", "Legal", "Logistică", "Adopție internă", "Operațional"], "Operațional")}</select>
        </div>
        <div class="field">
          <label>Severitate</label>
          <select name="severity">${optionList(["Scăzută", "Normală", "Ridicată", "Critică"], "Ridicată")}</select>
        </div>
        <div class="field full">
          <label>Descriere</label>
          <textarea name="description" required></textarea>
        </div>
        <div class="field">
          <label>Owner</label>
          <select name="ownerId">${memberOptions("MEM-0017")}</select>
        </div>
        <div class="field">
          <label>Vizibilitate</label>
          <select name="visibility">${optionList(["Echipă", "Leadership", "Restricționat"], "Restricționat")}</select>
        </div>
        <div class="field full">
          <label>Mitigare</label>
          <textarea name="mitigation" required></textarea>
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="shield-plus"></i>Salvează risc</button>
        </div>
      </form>
    `);

    document.getElementById("riskForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const riskItem = {
        id: nextId("RISK", state.risks),
        category: data.get("category"),
        description: data.get("description").trim(),
        severity: data.get("severity"),
        ownerId: data.get("ownerId"),
        mitigation: data.get("mitigation").trim(),
        visibility: data.get("visibility"),
        status: "Deschis",
        createdAt: new Date().toISOString(),
        createdBy: currentAuthUserId(),
      };
      state.risks.unshift(riskItem);
      await tryRemote("Riscul", () => remoteInsert("risks", toRiskRow(riskItem)));
      saveState("Risc creat");
      closeModal();
      renderRisks();
      toast("Risc salvat", "Registrul a fost actualizat.");
    });
  }

  function renderArchive() {
    view.innerHTML = `
      ${pageHead(
        "Dovezi",
        "Arhivă Drive",
        "Foldere, fișiere și linkuri asociate task-urilor, logurilor, pontajului și riscurilor.",
        `<button class="primary-button" data-action="open-file"><i data-lucide="file-plus-2"></i>Fișier nou</button>`,
      )}

      <div class="split-layout">
        <section class="panel">
          <div class="section-title">
            <h2>Structură foldere</h2>
            <img class="mini-logo" src="${LOGO}" alt="" aria-hidden="true" />
          </div>
          <div class="folder-tree">
            ${folder("MEU_Internal_Platform", 0)}
            ${folder("00_Admin", 1)}
            ${folder("01_Member_Registry", 1)}
            ${folder("02_Task_Evidence", 1)}
            ${departments.map((department) => folder(department.replaceAll(" ", "_"), 2)).join("")}
            ${folder("03_Operational_Logs", 1)}
            ${["Done", "Planned", "Issues", "Risks", "Requests", "Decisions", "Escalations"].map((item) => folder(item, 2)).join("")}
            ${folder("04_Timekeeping", 1)}
            ${folder("05_Risk_Safety_Compliance_RESTRICTED", 1)}
            ${folder("06_Dashboards_Exports", 1)}
            ${folder("99_Archive", 1)}
          </div>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Fișiere indexate</h2>
            <button class="ghost-button" data-action="export-files"><i data-lucide="download"></i>Export</button>
          </div>
          <div class="data-list">
            ${state.files.map(fileRow).join("")}
          </div>
        </section>
      </div>
    `;

    view.querySelector('[data-action="open-file"]').addEventListener("click", () => openFileModal());
    view.querySelector('[data-action="export-files"]').addEventListener("click", () => exportJson("meu-atlas-fisiere.json", state.files));
  }

  function folder(name, indent) {
    return `<div class="folder-line indent-${indent}"><i data-lucide="folder"></i><span>${escapeHtml(name)}</span></div>`;
  }

  function fileRow(fileItem) {
    return `
      <article class="file-row">
        <div>
          <strong>${escapeHtml(fileItem.title)}</strong>
          <div class="row-meta">
            <span>${escapeHtml(fileItem.id)}</span>
            <span>${escapeHtml(fileItem.relatedType)}: ${escapeHtml(fileItem.relatedId)}</span>
            <span>${escapeHtml(memberName(fileItem.uploadedBy))}</span>
          </div>
        </div>
        <span class="tag">${escapeHtml(fileItem.fileType)}</span>
        <a class="soft-button" href="${escapeHtml(fileItem.driveUrl)}" target="_blank" rel="noreferrer">
          <i data-lucide="external-link"></i>Deschide
        </a>
        ${deleteButton("file", fileItem.id, `fișierul ${fileItem.id}`, "danger-button", fileItem)}
      </article>
    `;
  }

  function openFileModal() {
    openModal(`
      <h2 id="modalTitle">Fișier nou</h2>
      <form id="fileForm" class="form-grid">
        <div class="field full">
          <label>Titlu</label>
          <input name="title" required />
        </div>
        <div class="field">
          <label>Încărcat de</label>
          <select name="uploadedBy">${memberOptions("MEM-0005")}</select>
        </div>
        <div class="field">
          <label>Tip fișier</label>
          <select name="fileType">${optionList(["Document", "Screenshot", "Folder", "Foto", "Contract", "Dovadă"], "Document")}</select>
        </div>
        <div class="field">
          <label>Tip record</label>
          <select name="relatedType">${optionList(["Task", "Log", "Pontaj", "Risc", "Membru"], "Task")}</select>
        </div>
        <div class="field">
          <label>ID record</label>
          <input name="relatedId" placeholder="TASK-0001" required />
        </div>
        <div class="field full">
          <label>URL Drive</label>
          <input name="driveUrl" type="url" placeholder="https://drive.google.com/..." required />
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="file-plus-2"></i>Adaugă fișier</button>
        </div>
      </form>
    `);

    document.getElementById("fileForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const fileItem = {
        id: nextId("FILE", state.files),
        uploadedBy: data.get("uploadedBy"),
        relatedType: data.get("relatedType"),
        relatedId: data.get("relatedId").trim(),
        title: data.get("title").trim(),
        fileType: data.get("fileType"),
        driveUrl: data.get("driveUrl").trim(),
        uploadedAt: new Date().toISOString(),
        createdBy: currentAuthUserId(),
      };
      state.files.unshift(fileItem);
      await tryRemote("Fisierul", () => remoteInsert("files", toFileRow(fileItem)));
      saveState("Fișier indexat");
      closeModal();
      renderArchive();
      toast("Fișier adăugat", "Arhiva a fost actualizată.");
    });
  }

  function renderAdmin() {
    const pendingRoles = state.roles.filter((role) => role.status === "Neocupat");
    const activeAccounts = state.accounts.filter((account) => account.status !== "Suspendat");
    view.innerHTML = `
      ${pageHead(
        "Configurare",
        "Admin platformă",
        "Conturi, roluri, exporturi, audit și pregătirea pentru GitHub Pages + Supabase.",
        `<button class="danger-button" data-action="reset-test-data"><i data-lucide="trash-2"></i>Curăță teste</button>`,
      )}

      <div class="admin-hero">
        <section class="panel logo-watermark">
          <div class="section-title">
            <h2>Conturi & acces</h2>
            <img class="mini-logo" src="${LOGO}" alt="" aria-hidden="true" />
          </div>
          <div class="account-summary">
            <div>
              <strong>${activeAccounts.length}</strong>
              <span>conturi active</span>
            </div>
            <div>
              <strong>${new Set(state.accounts.map((account) => account.role)).size}</strong>
              <span>roluri de acces</span>
            </div>
            <div>
              <strong>${pendingRoles.length}</strong>
              <span>roluri neocupate</span>
            </div>
          </div>
          <button class="primary-button" data-action="open-account"><i data-lucide="user-plus"></i>Creează cont</button>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Publicare live</h2>
            <span class="badge green">GitHub Pages + Supabase</span>
          </div>
          <p class="lead">Aplicația rămâne statică pe GitHub Pages, iar Supabase preia autentificarea, baza de date, rolurile și permisiunile.</p>
          <div class="launch-steps">
            <span><i data-lucide="check-circle-2"></i>Supabase Auth cu username + parolă</span>
            <span><i data-lucide="check-circle-2"></i>Tabele Postgres pentru membri, task-uri, loguri, pontaj</span>
            <span><i data-lucide="check-circle-2"></i>RLS pentru acces pe roluri</span>
          </div>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Laborator testare</h2>
            <span class="badge amber">Admin only</span>
          </div>
          <p class="lead">Curăță rapid datele introduse în teste: task-uri, loguri, pontaje, riscuri, fișiere, registratură, conturi create și membri adăugați.</p>
          <button class="danger-button" data-action="reset-test-data"><i data-lucide="trash-2"></i>Curăță datele de test</button>
        </section>
      </div>

      <section class="panel" style="margin-top:16px">
        <div class="section-title">
          <h2>Conturi existente</h2>
          <span class="badge blue">${state.accounts.length}</span>
        </div>
        <div class="account-grid">
          ${state.accounts.map(accountCard).join("")}
        </div>
      </section>

      <div class="grid cols-2" style="margin-top:16px">
        <section class="panel">
          <div class="section-title">
            <h2>Setări principale</h2>
            <span class="badge blue">Platformă</span>
          </div>
          <div class="compact-list">
            <p><strong>Statusuri task:</strong> ${statuses.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join(" ")}</p>
            <p><strong>Priorități:</strong> ${priorities.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join(" ")}</p>
            <p><strong>Tipuri log:</strong> ${logTypes.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join(" ")}</p>
          </div>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Export date</h2>
            <span class="badge blue">JSON local</span>
          </div>
          <div class="button-row">
            <button class="soft-button" data-export="all"><i data-lucide="database-backup"></i>Toate datele</button>
            <button class="ghost-button" data-export="tasks"><i data-lucide="kanban-square"></i>Task-uri</button>
            <button class="ghost-button" data-export="members"><i data-lucide="users"></i>Membri</button>
            <button class="ghost-button" data-export="audit"><i data-lucide="history"></i>Audit</button>
          </div>
        </section>
      </div>

      <div class="grid cols-2" style="margin-top:16px">
        <section class="panel">
          <div class="section-title">
            <h2>Roluri neocupate</h2>
            <span class="badge amber">${pendingRoles.length}</span>
          </div>
          <div class="data-list">
            ${pendingRoles
              .map(
                (role) => `
                  <div class="signal-item">
                    <span>
                      <strong>${escapeHtml(role.role)}</strong>
                      <span class="row-meta">${escapeHtml(role.department)}</span>
                    </span>
                    <span class="badge amber">${escapeHtml(role.status)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Audit recent</h2>
            <span class="badge blue">${state.audit.length}</span>
          </div>
          <div class="timeline">
            ${state.audit
              .slice(0, 8)
              .map(
                (audit) => `
                  <div class="timeline-item">
                    <strong>${escapeHtml(audit.action)}</strong>
                    <p class="meta">${formatDateTime(audit.timestamp)} · ${escapeHtml(audit.user)} · ${escapeHtml(audit.record)}</p>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      </div>
    `;

    view.querySelector('[data-action="open-account"]').addEventListener("click", () => openAccountModal());
    view.querySelectorAll("[data-account-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const account = state.accounts.find((item) => item.username === button.dataset.accountToggle);
        if (!account) return;
        account.status = account.status === "Suspendat" ? "Activ" : "Suspendat";
        saveState("Status cont actualizat");
        renderAdmin();
        toast("Cont actualizat", `${account.username} este ${account.status}.`);
      });
    });
    view.querySelectorAll('[data-action="reset-test-data"]').forEach((button) => {
      button.addEventListener("click", resetTestData);
    });
    view.querySelectorAll("[data-export]").forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.dataset.export;
        const payload =
          type === "tasks" ? state.tasks : type === "members" ? state.members : type === "audit" ? state.audit : state;
        exportJson(`meu-atlas-${type}.json`, payload);
      });
    });
  }

  function accountCard(account) {
    return `
      <article class="account-card">
        <div class="account-avatar">${escapeHtml(memberInitials(account.name))}</div>
        <div>
          <strong>${escapeHtml(account.name)}</strong>
          <p class="meta">${escapeHtml(account.username)} · ${escapeHtml(account.scope)}</p>
        </div>
        <span class="badge ${account.status === "Suspendat" ? "red" : "green"}">${escapeHtml(account.status || "Activ")}</span>
        <span class="tag">${escapeHtml(account.role)}</span>
        <button class="ghost-button" data-account-toggle="${escapeHtml(account.username)}">
          <i data-lucide="${account.status === "Suspendat" ? "unlock" : "lock"}"></i>
          ${account.status === "Suspendat" ? "Activează" : "Suspendă"}
        </button>
        ${protectedUsernames.has(account.username) ? "" : deleteButton("account", account.username, `contul ${account.username}`, "danger-button", account)}
      </article>
    `;
  }

  function openAccountModal() {
    openModal(`
      <h2 id="modalTitle">Cont nou</h2>
      <form id="accountForm" class="form-grid">
        <div class="field">
          <label>Nume afișat</label>
          <input name="name" required placeholder="Ex: Coordonator HR" />
        </div>
        <div class="field">
          <label>Username</label>
          <input name="username" required placeholder="ex: prenume.nume" />
        </div>
        <div class="field">
          <label>Parolă temporară</label>
          <input name="password" required minlength="8" placeholder="minimum 8 caractere" />
        </div>
        <div class="field">
          <label>Rol acces</label>
          <select name="role">${optionList(["Admin", "Director", "HR", "Safe Person", "Coordonator", "Head"], "Head")}</select>
        </div>
        <div class="field">
          <label>Head asociat</label>
          <select name="memberId">${memberOptions("", true)}</select>
        </div>
        <div class="field">
          <label>Scope</label>
          <select name="scope">${optionList(["Toate departamentele", "Leadership", "Restricționat", ...departments], "Comunicare")}</select>
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="user-plus"></i>Creează cont</button>
        </div>
      </form>
    `);

    document.getElementById("accountForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const username = data.get("username").trim();
      if (state.accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
        toast("Username existent", "Alege un username diferit.");
        return;
      }
      const payload = {
        username,
        password: data.get("password"),
        name: data.get("name").trim(),
        role: data.get("role"),
        memberId: data.get("memberId"),
        scope: data.get("scope"),
      };
      if (supabaseClient) {
        try {
          await createAccountRemote(payload);
          await loadRemoteData();
        } catch (error) {
          console.warn(error);
          toast("Contul nu a fost creat", error.message || "Verifică Edge Function create-account în Supabase.");
          return;
        }
      } else {
        state.accounts.push({
          ...payload,
          status: "Activ",
        });
        saveState("Cont creat local");
      }
      closeModal();
      renderAdmin();
      toast("Cont creat", `${username} poate intra în MEU Atlas.`);
    });
  }

  function phase(number, title, text) {
    return `
      <div class="phase">
        <span class="badge blue">Faza ${number}</span>
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(text)}</small>
      </div>
    `;
  }

  function taskForm(defaults = {}) {
    return `
      <form id="taskForm" class="form-grid">
        <div class="field full">
          <label>Titlu</label>
          <input name="title" value="${escapeHtml(defaults.title || "")}" required />
        </div>
        <div class="field full">
          <label>Descriere</label>
          <textarea name="description" required>${escapeHtml(defaults.description || "")}</textarea>
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department" required>${departmentOptions(defaults.department || "Executiv & Tehnologie")}</select>
        </div>
        <div class="field">
          <label>Owner</label>
          <select name="ownerId" required>${memberOptions(defaults.ownerId || "MEM-0005")}</select>
        </div>
        <div class="field">
          <label>Status</label>
          <select name="status" required>${optionList(statuses, defaults.status || "De făcut")}</select>
        </div>
        <div class="field">
          <label>Prioritate</label>
          <select name="priority" required>${optionList(priorities, defaults.priority || "Normală")}</select>
        </div>
        <div class="field">
          <label>Deadline</label>
          <input name="deadline" type="date" value="${escapeHtml(defaults.deadline || offsetDate(7))}" required />
        </div>
        <div class="field">
          <label>URL dovadă</label>
          <input name="evidenceUrl" type="url" value="${escapeHtml(defaults.evidenceUrl || "")}" />
        </div>
        <label class="checkbox-field full">
          <input name="blocker" type="checkbox" ${defaults.blocker ? "checked" : ""} />
          <span>Este blocat</span>
        </label>
        <div class="field full">
          <label>Descriere blocaj</label>
          <textarea name="blockerText">${escapeHtml(defaults.blockerText || "")}</textarea>
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="plus"></i>Salvează task</button>
        </div>
      </form>
    `;
  }

  function openTaskModal(defaults = {}) {
    openModal(`
      <h2 id="modalTitle">Task nou</h2>
      ${taskForm(defaults)}
    `);

    document.getElementById("taskForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const taskItem = {
        id: nextId("TASK", state.tasks),
        title: data.get("title").trim(),
        description: data.get("description").trim(),
        department: data.get("department"),
        ownerId: data.get("ownerId"),
        collaborators: [],
        status: data.get("status"),
        priority: data.get("priority"),
        deadline: data.get("deadline"),
        blocker: data.has("blocker"),
        blockerText: data.get("blockerText").trim(),
        evidenceUrl: data.get("evidenceUrl").trim(),
        relatedLogId: defaults.relatedLogId || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentAuthUserId(),
      };
      state.tasks.unshift(taskItem);
      await tryRemote("Taskul", () => remoteInsert("tasks", toTaskRow(taskItem)));
      saveState("Task creat");
      closeModal();
      render();
      toast("Task creat", `${taskItem.id} a fost adăugat în board.`);
    });
  }

  function openTaskDetails(taskId) {
    const taskItem = state.tasks.find((item) => item.id === taskId);
    if (!taskItem) return;
    const relatedLogs = state.logs.filter((logItem) => logItem.relatedTaskId === taskId || logItem.id === taskItem.relatedLogId);
    const relatedTime = state.timeEntries.filter((entry) => entry.relatedTaskId === taskId);
    openModal(`
      <h2 id="modalTitle">${escapeHtml(taskItem.title)}</h2>
      <p class="inline-meta">
        <span class="tag">${escapeHtml(taskItem.id)}</span>
        <span class="status-pill ${statusClass(taskItem.status)}">${escapeHtml(taskItem.status)}</span>
        <span class="badge ${priorityClass(taskItem.priority)}">${escapeHtml(taskItem.priority)}</span>
        <span class="tag">${escapeHtml(taskItem.department)}</span>
      </p>
      <p>${escapeHtml(taskItem.description)}</p>
      <div class="grid cols-3">
        ${metric("Owner", memberInitials(taskItem.ownerId), "user-round", memberName(taskItem.ownerId))}
        ${metric("Deadline", formatDate(taskItem.deadline), "calendar-days", daysUntil(taskItem.deadline) < 0 ? "Întârziat" : "În termen")}
        ${metric("Ore", sum(relatedTime, (entry) => entry.hours).toFixed(1), "clock-3", "Raportate pe task")}
      </div>
      ${
        taskItem.blocker
          ? `<section class="panel" style="margin-top:14px"><span class="badge red">Blocaj</span><p>${escapeHtml(taskItem.blockerText || "Blocaj fără descriere.")}</p></section>`
          : ""
      }
      <section class="panel" style="margin-top:14px">
        <div class="section-title">
          <h2>Loguri asociate</h2>
          <span class="badge blue">${relatedLogs.length}</span>
        </div>
        ${relatedLogs.length ? relatedLogs.map(timelineItem).join("") : `<p class="meta">Nu există loguri asociate.</p>`}
      </section>
      <div class="button-row" style="margin-top:14px">
        ${statuses.map((status) => `<button class="ghost-button" data-task-status="${status}" data-task="${taskId}">${escapeHtml(status)}</button>`).join("")}
        ${deleteButton("task", taskItem.id, `taskul ${taskItem.id}`, "danger-button", taskItem)}
      </div>
    `);

    modalContent.querySelectorAll("[data-task-status]").forEach((button) => {
      button.addEventListener("click", async () => {
        taskItem.status = button.dataset.taskStatus;
        taskItem.updatedAt = new Date().toISOString();
        await tryRemote("Actualizarea taskului", () =>
          remoteUpdate("tasks", taskItem.id, {
            status: taskItem.status,
            updated_at: taskItem.updatedAt,
          }),
        );
        saveState("Status task actualizat");
        closeModal();
        render();
        toast("Status actualizat", `${taskItem.id} este în ${taskItem.status}.`);
      });
    });
  }

  function openLogModal() {
    openModal(`
      <h2 id="modalTitle">Log rapid</h2>
      ${logForm("modalLogForm")}
    `);
    attachLogForm(document.getElementById("modalLogForm"));
    refreshIcons();
  }

  function openModal(html) {
    modalContent.innerHTML = html;
    modalBackdrop.hidden = false;
    attachDeleteButtons(modalContent);
    refreshIcons();
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    modalContent.innerHTML = "";
  }

  function toast(title, message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = `<i data-lucide="check-circle-2"></i><div><strong>${escapeHtml(title)}</strong><p class="meta">${escapeHtml(message)}</p></div>`;
    toastStack.appendChild(node);
    refreshIcons();
    setTimeout(() => node.remove(), 3800);
  }

  function emptyState(text) {
    return `<div class="empty-state"><div><img src="${LOGO}" alt="" /><span>${escapeHtml(text)}</span></div></div>`;
  }

  function exportJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    toast("Export pregătit", filename);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function searchEverything(query) {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const results = [];
    visibleMembers().forEach((item) => {
      if ([item.name, item.email, item.role, item.department].join(" ").toLowerCase().includes(needle)) {
        results.push({ type: "Membru", title: item.name, meta: `${item.department} · ${item.role}`, route: "members" });
      }
    });
    visibleTasks().forEach((item) => {
      if ([item.title, item.description, item.department, memberName(item.ownerId)].join(" ").toLowerCase().includes(needle)) {
        results.push({ type: "Task", title: item.title, meta: `${item.id} · ${item.status} · ${item.department}`, route: "board" });
      }
    });
    visibleLogs().forEach((item) => {
      if ([item.title, item.narrative, item.type, item.department].join(" ").toLowerCase().includes(needle)) {
        results.push({ type: "Log", title: item.title, meta: `${item.id} · ${item.type} · ${item.status}`, route: "logs" });
      }
    });
    return results.slice(0, 12);
  }

  function openSearchModal(query) {
    const results = searchEverything(query);
    openModal(`
      <h2 id="modalTitle">Rezultate căutare</h2>
      <div class="data-list">
        ${
          results.length
            ? results
                .map(
                  (result) => `
                    <button class="signal-item" data-search-route="${result.route}">
                      <span>
                        <span class="badge blue">${escapeHtml(result.type)}</span>
                        <strong>${escapeHtml(result.title)}</strong>
                        <span class="row-meta">${escapeHtml(result.meta)}</span>
                      </span>
                      <i data-lucide="arrow-right"></i>
                    </button>
                  `,
                )
                .join("")
            : emptyState("Nu am găsit rezultate.")
        }
      </div>
    `);
    modalContent.querySelectorAll("[data-search-route]").forEach((button) => {
      button.addEventListener("click", () => {
        closeModal();
        location.hash = button.dataset.searchRoute;
      });
    });
  }

  document.getElementById("menuToggle").addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });

  themeToggle.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("theme-dark") ? "light" : "dark");
  });

  accessToggle.addEventListener("click", () => {
    const open = accessPanel.hidden;
    accessPanel.hidden = !open;
    accessToggle.setAttribute("aria-expanded", String(open));
    refreshIcons();
  });

  accessClose.addEventListener("click", () => {
    accessPanel.hidden = true;
    accessToggle.setAttribute("aria-expanded", "false");
  });

  document.querySelectorAll("[data-access]").forEach((button) => {
    button.addEventListener("click", () => toggleAccessSetting(button.dataset.access));
  });

  accessReset.addEventListener("click", () => {
    const settings = defaultAccessSettings();
    saveAccessSettings(settings);
    applyAccessSettings(settings);
    toast("Accesibilitate resetată", "Setările MEU Access au revenit la standard.");
  });

  window.addEventListener("mousemove", (event) => {
    if (document.body.classList.contains("access-focus")) {
      document.body.style.setProperty("--access-focus-y", `${event.clientY}px`);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "");
    let account;
    try {
      account = await loginWithSupabase(username, password);
    } catch (error) {
      console.warn(error);
      account = state.accounts.find((item) => item.username === username && item.password === password && item.status !== "Suspendat");
      if (!account) {
        toast("Autentificare respinsă", error.message || "Username sau parolă incorectă.");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username, account, loggedAt: new Date().toISOString() }));
    }
    location.hash = firstAllowedRoute();
    render();
    toast("Bine ai venit", `${account.name} are acces ${account.role}.`);
  });

  document.getElementById("logoutButton").addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    teardownRealtime();
    sessionStorage.removeItem(SESSION_KEY);
    state.currentAccount = null;
    saveState("Ieșire din cont");
    closeModal();
    render();
  });

  document.getElementById("newTaskTop").addEventListener("click", () => openTaskModal());
  document.getElementById("newLogTop").addEventListener("click", () => openLogModal());

  document.getElementById("globalSearch").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      openSearchModal(event.currentTarget.value);
    }
  });

  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) closeModal();
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
  });

  applyTheme(initialTheme());
  applyAccessSettings();
  render();
  restoreSupabaseSession();
})();
