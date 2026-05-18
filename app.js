(function () {
  "use strict";

  const STORAGE_KEY = "meu-atlas-platform-v1";
  const SESSION_KEY = "meu-atlas-session-v1";
  const THEME_KEY = "meu-atlas-theme-v1";
  const ACCESS_KEY = "meu-atlas-access-v1";
  const LOGO = "./assets/meu-logo-albastru.png";

  const defaultAccounts = [
    { username: "admin.meu", password: "Atlas2026!", name: "Admin MEU", role: "Admin", memberId: "MEM-0005", scope: "Toate departamentele" },
    { username: "director.meu", password: "Director2026!", name: "Director Executiv", role: "Director", memberId: "MEM-0001", scope: "Leadership" },
    { username: "hr.meu", password: "HR2026!", name: "HR MEU", role: "HR", memberId: "MEM-0011", scope: "Resurse Umane" },
    { username: "safe.meu", password: "Safe2026!", name: "Safe Person", role: "Safe Person", memberId: "MEM-0015", scope: "Restricționat" },
    { username: "logistica.meu", password: "Logistica2026!", name: "Coordonator Logistică", role: "Coordonator", memberId: "MEM-0006", scope: "Logistică" },
    { username: "membru.meu", password: "Membru2026!", name: "Membru MEU", role: "Membru", memberId: "MEM-0020", scope: "Comunicare" },
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
    { id: "board", label: "Board operațional", icon: "kanban-square", roles: ["Admin", "Director", "HR", "Safe Person", "Coordonator", "Membru"] },
    { id: "logs", label: "Raportări", icon: "message-square-text", roles: ["Admin", "Director", "HR", "Safe Person", "Coordonator", "Membru"] },
    { id: "time", label: "Pontaj", icon: "clock-3", roles: ["Admin", "Director", "HR", "Coordonator", "Membru"] },
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
    return state.accounts.find((account) => account.username === session?.username) || null;
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
    const counters = {
      board: openTasks,
      logs: openLogs,
      time: pendingTime,
      risks,
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

    if (route === "dashboard") renderDashboard();
    if (route === "board") renderBoard();
    if (route === "logs") renderLogs();
    if (route === "time") renderTime();
    if (route === "members") renderMembers();
    if (route === "risks") renderRisks();
    if (route === "archive") renderArchive();
    if (route === "admin") renderAdmin();

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
      column.addEventListener("drop", (event) => {
        event.preventDefault();
        column.classList.remove("is-over");
        const taskId = event.dataTransfer.getData("text/plain");
        const taskItem = state.tasks.find((item) => item.id === taskId);
        if (taskItem && taskItem.status !== column.dataset.status) {
          taskItem.status = column.dataset.status;
          taskItem.updatedAt = new Date().toISOString();
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
        </div>
      </article>
    `;
  }

  function attachLogForm(form) {
    if (!form) return;
    form.addEventListener("submit", (event) => {
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
      };
      state.logs.unshift(logItem);
      if (logItem.convertToTask) createTaskFromLog(logItem, false);
      saveState("Log operațional creat");
      render();
      closeModal();
      toast("Log salvat", `${logItem.id} a fost adăugat în registru.`);
    });
  }

  function attachLogActions() {
    view.querySelectorAll("[data-log-close]").forEach((button) => {
      button.addEventListener("click", () => {
        const logItem = state.logs.find((item) => item.id === button.dataset.logClose);
        if (!logItem) return;
        logItem.status = "Închis";
        saveState("Log închis");
        renderLogs();
        toast("Raportare închisă", logItem.title);
      });
    });
    view.querySelectorAll("[data-log-task]").forEach((button) => {
      button.addEventListener("click", () => {
        const logItem = state.logs.find((item) => item.id === button.dataset.logTask);
        if (!logItem) return;
        const created = createTaskFromLog(logItem, true);
        toast("Task generat", `${created.id} a fost creat din ${logItem.id}.`);
      });
    });
  }

  function createTaskFromLog(logItem, shouldRender) {
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
    };
    state.tasks.unshift(created);
    logItem.relatedTaskId = created.id;
    logItem.needsFollowUp = true;
    logItem.status = "Follow-up";
    saveState("Task creat din log");
    if (shouldRender) renderLogs();
    return created;
  }

  function renderTime() {
    const scopedTime = visibleTimeEntries();
    const filteredEntries = scopedTime.filter((entry) => filters.timeStatus === "Toate" || entry.validationStatus === filters.timeStatus);
    const pending = scopedTime.filter((entry) => entry.validationStatus === "În așteptare");
    const accepted = scopedTime.filter((entry) => entry.validationStatus === "Acceptat");
    const totalHours = sum(scopedTime, (entry) => entry.hours);
    const acceptedHours = sum(accepted, (entry) => entry.hours);
    const activeClock = state.clock;

    view.innerHTML = `
      ${pageHead(
        "Pontaj",
        "Timp, contribuții și validări",
        "Înregistrări zilnice, sesiuni clock-in/clock-out și validare pentru HR/directori.",
        `<button class="ghost-button" data-action="export-time"><i data-lucide="download"></i>Export</button>`,
      )}

      <div class="grid cols-3">
        ${metric("Total ore", totalHours.toFixed(1), "timer", "Toate înregistrările")}
        ${metric("Ore validate", acceptedHours.toFixed(1), "badge-check", "Acceptate de HR")}
        ${metric("În așteptare", pending.length, "hourglass", "Necesită verificare")}
      </div>

      <div class="split-layout" style="margin-top:16px">
        <section class="panel logo-watermark">
          <div class="section-title">
            <h2>Sesiune rapidă</h2>
            <img class="mini-logo" src="${LOGO}" alt="" aria-hidden="true" />
          </div>
          <div class="clock-panel">
            <div>
              <p class="meta">${activeClock ? `Pornit de ${escapeHtml(memberName(activeClock.memberId))}` : "Nicio sesiune activă"}</p>
              <div class="clock-time">${activeClock ? elapsedClock(activeClock.start) : "00:00"}</div>
            </div>
            <button class="${activeClock ? "danger-button" : "primary-button"}" id="clockToggle">
              <i data-lucide="${activeClock ? "square" : "play"}"></i>
              ${activeClock ? "Oprește" : "Pornește"}
            </button>
          </div>
          ${!activeClock ? clockStartForm() : ""}
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Adaugă pontaj</h2>
          </div>
          ${timeForm()}
        </section>
      </div>

      <section class="panel" style="margin-top:16px">
        <div class="section-title">
          <h2>Registru pontaj</h2>
          <select id="timeStatusFilter">${optionList(["Toate", "În așteptare", "Acceptat", "Necesită clarificare"], filters.timeStatus)}</select>
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
    view.querySelector("#timeStatusFilter").addEventListener("change", (event) => {
      filters.timeStatus = event.target.value;
      renderTime();
    });
    view.querySelector("#clockToggle").addEventListener("click", handleClockToggle);
    attachTimeValidation();
  }

  function clockStartForm() {
    return `
      <form id="clockStartForm" class="form-grid" style="margin-top:14px">
        <div class="field">
          <label>Membru</label>
          <select name="memberId">${memberOptions("MEM-0005")}</select>
        </div>
        <div class="field">
          <label>Activitate</label>
          <select name="activity">${optionList(activities, "Administrativ")}</select>
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department">${departmentOptions("Executiv & Tehnologie")}</select>
        </div>
        <div class="field">
          <label>Task</label>
          <select name="relatedTaskId">${taskOptions("", true)}</select>
        </div>
      </form>
    `;
  }

  function elapsedClock(start) {
    const diff = Math.max(0, Date.now() - new Date(start).getTime());
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function handleClockToggle() {
    if (state.clock) {
      const start = new Date(state.clock.start);
      const hours = Math.max(0.25, Math.round(((Date.now() - start.getTime()) / 3600000) * 4) / 4);
      const entry = {
        id: nextId("TIME", state.timeEntries),
        memberId: state.clock.memberId,
        date: new Date().toISOString().slice(0, 10),
        department: state.clock.department,
        activity: state.clock.activity,
        relatedTaskId: state.clock.relatedTaskId,
        relatedLogId: "",
        hours,
        notes: "Sesiune clock-in/clock-out",
        validationStatus: "În așteptare",
        validatedBy: "",
        createdAt: new Date().toISOString(),
      };
      state.timeEntries.unshift(entry);
      state.clock = null;
      saveState("Sesiune pontaj închisă");
      renderTime();
      toast("Pontaj creat", `${entry.hours} ore au fost adăugate.`);
      return;
    }

    const form = view.querySelector("#clockStartForm");
    const data = new FormData(form);
    state.clock = {
      memberId: data.get("memberId"),
      department: data.get("department"),
      activity: data.get("activity"),
      relatedTaskId: data.get("relatedTaskId"),
      start: new Date().toISOString(),
    };
    saveState("Sesiune pontaj pornită");
    renderTime();
    toast("Sesiune pornită", `Pontaj activ pentru ${memberName(state.clock.memberId)}.`);
  }

  function timeForm() {
    return `
      <form id="timeEntryForm" class="form-grid">
        <div class="field">
          <label>Membru</label>
          <select name="memberId" required>${memberOptions("MEM-0005")}</select>
        </div>
        <div class="field">
          <label>Data</label>
          <input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" required />
        </div>
        <div class="field">
          <label>Departament</label>
          <select name="department" required>${departmentOptions("Executiv & Tehnologie")}</select>
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
          <textarea name="notes" placeholder="Rezumat scurt al activității"></textarea>
        </div>
        <div class="field full">
          <button class="primary-button" type="submit"><i data-lucide="plus"></i>Adaugă pontaj</button>
        </div>
      </form>
    `;
  }

  function handleTimeSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const entry = {
      id: nextId("TIME", state.timeEntries),
      memberId: data.get("memberId"),
      date: data.get("date"),
      department: data.get("department"),
      activity: data.get("activity"),
      relatedTaskId: data.get("relatedTaskId"),
      relatedLogId: data.get("relatedLogId"),
      hours: Number(data.get("hours")),
      notes: data.get("notes").trim(),
      validationStatus: "În așteptare",
      validatedBy: "",
      createdAt: new Date().toISOString(),
    };
    state.timeEntries.unshift(entry);
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
          </div>
        </div>
        <strong>${Number(entry.hours).toFixed(2)}</strong>
        <div>
          <span class="tag">${escapeHtml(entry.activity)}</span>
          <p class="meta">${escapeHtml(entry.notes || "Fără notițe")}</p>
        </div>
        <div class="button-row">
          <span class="status-pill ${statusClass(entry.validationStatus)}">${escapeHtml(entry.validationStatus)}</span>
          ${entry.validationStatus !== "Acceptat" ? `<button class="soft-button" data-time-accept="${entry.id}"><i data-lucide="badge-check"></i>Acceptă</button>` : ""}
          ${entry.validationStatus !== "Necesită clarificare" ? `<button class="ghost-button" data-time-clarify="${entry.id}"><i data-lucide="circle-help"></i>Clarifică</button>` : ""}
        </div>
      </article>
    `;
  }

  function attachTimeValidation() {
    view.querySelectorAll("[data-time-accept]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = state.timeEntries.find((item) => item.id === button.dataset.timeAccept);
        if (!entry) return;
        entry.validationStatus = "Acceptat";
        entry.validatedBy = "MEM-0011";
        saveState("Pontaj acceptat");
        renderTime();
      });
    });
    view.querySelectorAll("[data-time-clarify]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = state.timeEntries.find((item) => item.id === button.dataset.timeClarify);
        if (!entry) return;
        entry.validationStatus = "Necesită clarificare";
        entry.validatedBy = "MEM-0011";
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
      <button class="member-row" data-member-detail="${memberItem.id}">
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
        </span>
      </button>
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
          <select name="accessLevel">${optionList(["Membru", "Coordonator", "Manager", "Director", "Admin"], "Membru")}</select>
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

    document.getElementById("memberForm").addEventListener("submit", (event) => {
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
    `);
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
        <button class="ghost-button" data-risk-close="${riskItem.id}"><i data-lucide="check"></i>Monitorizat</button>
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

    document.getElementById("riskForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      state.risks.unshift({
        id: nextId("RISK", state.risks),
        category: data.get("category"),
        description: data.get("description").trim(),
        severity: data.get("severity"),
        ownerId: data.get("ownerId"),
        mitigation: data.get("mitigation").trim(),
        visibility: data.get("visibility"),
        status: "Deschis",
        createdAt: new Date().toISOString(),
      });
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

    document.getElementById("fileForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      state.files.unshift({
        id: nextId("FILE", state.files),
        uploadedBy: data.get("uploadedBy"),
        relatedType: data.get("relatedType"),
        relatedId: data.get("relatedId").trim(),
        title: data.get("title").trim(),
        fileType: data.get("fileType"),
        driveUrl: data.get("driveUrl").trim(),
        uploadedAt: new Date().toISOString(),
      });
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
        `<button class="danger-button" data-action="reset-demo"><i data-lucide="rotate-ccw"></i>Reset demo</button>`,
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
    view.querySelector('[data-action="reset-demo"]').addEventListener("click", () => {
      if (!confirm("Resetezi datele demo MEU Atlas?")) return;
      localStorage.removeItem(STORAGE_KEY);
      state = seedState();
      saveState("Reset demo");
      render();
      toast("Date resetate", "Platforma a revenit la setul inițial.");
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
          <select name="role">${optionList(["Admin", "Director", "HR", "Safe Person", "Coordonator", "Membru"], "Membru")}</select>
        </div>
        <div class="field">
          <label>Membru asociat</label>
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

    document.getElementById("accountForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const username = data.get("username").trim();
      if (state.accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
        toast("Username existent", "Alege un username diferit.");
        return;
      }
      state.accounts.push({
        username,
        password: data.get("password"),
        name: data.get("name").trim(),
        role: data.get("role"),
        memberId: data.get("memberId"),
        scope: data.get("scope"),
        status: "Activ",
      });
      saveState("Cont creat");
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

    document.getElementById("taskForm").addEventListener("submit", (event) => {
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
      };
      state.tasks.unshift(taskItem);
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
      </div>
    `);

    modalContent.querySelectorAll("[data-task-status]").forEach((button) => {
      button.addEventListener("click", () => {
        taskItem.status = button.dataset.taskStatus;
        taskItem.updatedAt = new Date().toISOString();
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

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "");
    const account = state.accounts.find((item) => item.username === username && item.password === password && item.status !== "Suspendat");
    if (!account) {
      toast("Autentificare respinsă", "Username sau parolă incorectă.");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username, loggedAt: new Date().toISOString() }));
    location.hash = firstAllowedRoute();
    render();
    toast("Bine ai venit", `${account.name} are acces ${account.role}.`);
  });

  document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
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
})();
