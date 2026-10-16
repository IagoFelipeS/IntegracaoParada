const STORAGE_KEY = "integracao-j-arantes-meetings";
const ADMIN_USERNAME = "teste";
const ADMIN_PASSWORD = "123456";

const loginForm = document.querySelector("#login-form");
const loginView = document.querySelector("#login-view");
const loginMessage = document.querySelector("#login-message");
const agendaView = document.querySelector("#agenda-view");
const appointmentList = document.querySelector("#appointment-list");
const emptyAgenda = document.querySelector("#empty-agenda");
const adminMessage = document.querySelector("#admin-message");

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(value) {
  return parseLocalDate(value).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function readAppointments() {
  let stored;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new Error("Não foi possível acessar a agenda local deste navegador.", { cause: error });
  }

  if (!stored) {
    return [];
  }

  let appointments;
  try {
    appointments = JSON.parse(stored);
  } catch (error) {
    throw new Error("Os dados locais da agenda estão inválidos. Limpe os dados deste site para reiniciar a demonstração.", { cause: error });
  }

  if (!Array.isArray(appointments) || appointments.some((appointment) => (
    !appointment
    || typeof appointment.name !== "string"
    || typeof appointment.phone !== "string"
    || typeof appointment.vehicle !== "string"
    || typeof appointment.date !== "string"
    || typeof appointment.meetingTime !== "string"
  ))) {
    throw new Error("Os dados locais da agenda estão em um formato inválido. Limpe os dados deste site para reiniciar a demonstração.");
  }

  return appointments;
}

function createAppointmentCard(appointment) {
  const card = document.createElement("article");
  card.className = "appointment-card";

  const header = document.createElement("div");
  header.className = "appointment-card-header";

  const date = document.createElement("span");
  date.className = "appointment-date";
  date.textContent = formatDisplayDate(appointment.date);

  const time = document.createElement("span");
  time.className = "appointment-time";
  time.textContent = appointment.meetingTime;

  const name = document.createElement("h3");
  name.textContent = appointment.name;

  const details = document.createElement("p");
  details.textContent = `${appointment.phone} · ${appointment.vehicle}`;

  header.append(date, time);
  card.append(header, name, details);
  return card;
}

function renderAgenda() {
  adminMessage.hidden = true;
  adminMessage.textContent = "";
  appointmentList.replaceChildren();

  try {
    const today = new Date();
    const firstDay = formatLocalDate(today);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
    const lastAvailableDay = formatLocalDate(lastDay);
    const appointments = readAppointments()
      .filter((appointment) => appointment.date >= firstDay && appointment.date <= lastAvailableDay)
      .sort((first, second) => (
        first.date.localeCompare(second.date)
        || first.meetingTime.localeCompare(second.meetingTime)
      ));

    appointments.forEach((appointment) => {
      appointmentList.append(createAppointmentCard(appointment));
    });

    emptyAgenda.hidden = appointments.length > 0;
    document.querySelector("#meeting-count").textContent = `${appointments.length} ${appointments.length === 1 ? "reunião" : "reuniões"}`;
  } catch (error) {
    emptyAgenda.hidden = true;
    adminMessage.textContent = error.message;
    adminMessage.hidden = false;
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  const data = new FormData(loginForm);
  const username = data.get("username").trim();
  const password = data.get("password");

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    loginMessage.textContent = "Usuário ou senha incorretos.";
    return;
  }

  loginView.hidden = true;
  agendaView.hidden = false;
  renderAgenda();
});

document.querySelector("#logout-button").addEventListener("click", () => {
  loginForm.reset();
  loginMessage.textContent = "";
  agendaView.hidden = true;
  loginView.hidden = false;
  document.querySelector("#admin-username").focus();
});
