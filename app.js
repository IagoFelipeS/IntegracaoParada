const STORAGE_KEY = "integracao-j-arantes-meetings";

const form = document.querySelector("#booking-form");
const steps = [...document.querySelectorAll("[data-step]")];
const progressSteps = [...document.querySelectorAll("[data-progress-step]")];
const message = document.querySelector("#form-message");
const dateInput = document.querySelector("#meeting-date");
const adminMessage = document.querySelector("#admin-message");
const appointmentList = document.querySelector("#appointment-list");
const emptyAgenda = document.querySelector("#empty-agenda");
const bookingIntro = document.querySelector("#booking-intro");
const progress = document.querySelector("#booking-progress");
const successPanel = document.querySelector("#success-panel");
const adminPanel = document.querySelector("#admin-panel");
let bookingComplete = false;

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

function saveAppointments(appointments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch (error) {
    throw new Error("Não foi possível salvar a reunião neste navegador. Verifique o espaço disponível e tente novamente.", { cause: error });
  }
}

function showStep(stepNumber) {
  steps.forEach((step) => {
    step.hidden = Number(step.dataset.step) !== stepNumber;
  });

  progressSteps.forEach((step) => {
    const number = Number(step.dataset.progressStep);
    step.classList.toggle("is-active", number === stepNumber);
    step.classList.toggle("is-complete", number < stepNumber);
  });

  progress.setAttribute("aria-label", `Etapa ${stepNumber} de 3`);
  message.textContent = "";

  if (stepNumber === 2) {
    refreshTimeOptions();
  }
}

function getDriverDetails() {
  const data = new FormData(form);
  return {
    name: data.get("name").trim(),
    phone: data.get("phone").trim(),
    vehicle: data.get("vehicleType").trim(),
    date: data.get("meetingDate"),
    meetingTime: data.get("meetingTime"),
  };
}

function setTimeLabel(label, value, isBooked) {
  const [start, end] = value.split(" - ");
  label.replaceChildren(document.createTextNode(start));
  const detail = document.createElement("small");
  detail.textContent = isBooked ? `– ${end} · Ocupado` : `– ${end}`;
  label.append(detail);
}

function refreshTimeOptions() {
  const dateIsValid = dateInput.checkValidity();
  let appointments;

  try {
    appointments = readAppointments();
  } catch (error) {
    message.textContent = error.message;
    form.querySelectorAll('input[name="meetingTime"]').forEach((input) => {
      input.disabled = true;
    });
    return;
  }

  const radios = form.querySelectorAll('input[name="meetingTime"]');
  radios.forEach((radio) => {
    const isBooked = appointments.some((appointment) => (
      appointment.date === dateInput.value && appointment.meetingTime === radio.value
    ));
    const label = radio.closest(".time-option");
    radio.disabled = !dateIsValid || isBooked;
    label.classList.toggle("is-booked", isBooked);
    setTimeLabel(label.querySelector("[data-time-label]"), radio.value, isBooked);

    if (isBooked && radio.checked) {
      radio.checked = false;
    }
  });

  if (dateIsValid) {
    message.textContent = "";
  }
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
    const today = formatLocalDate(new Date());
    const appointments = readAppointments()
      .filter((appointment) => appointment.date >= today)
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

function showAdmin() {
  bookingIntro.hidden = true;
  progress.hidden = true;
  form.hidden = true;
  successPanel.hidden = true;
  adminPanel.hidden = false;
  renderAgenda();
  document.querySelector("#admin-nav-button").textContent = "Voltar";
}

function showBooking() {
  adminPanel.hidden = true;
  bookingIntro.hidden = false;
  successPanel.hidden = !bookingComplete;
  form.hidden = bookingComplete;
  progress.hidden = bookingComplete;
  document.querySelector("#admin-nav-button").textContent = "Ver agenda";
}

const today = new Date();
const lastAvailableDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
dateInput.min = formatLocalDate(today);
dateInput.max = formatLocalDate(lastAvailableDay);
dateInput.value = dateInput.min;
refreshTimeOptions();

document.querySelector("#admin-nav-button").addEventListener("click", () => {
  if (adminPanel.hidden) {
    showAdmin();
  } else {
    showBooking();
  }
});

dateInput.addEventListener("change", () => {
  form.querySelectorAll('input[name="meetingTime"]').forEach((input) => {
    input.checked = false;
  });
  refreshTimeOptions();
});

document.querySelector("#continue-button").addEventListener("click", () => {
  const firstStepFields = steps[0].querySelectorAll("input, select");
  const firstInvalidField = [...firstStepFields].find((field) => !field.checkValidity());

  if (firstInvalidField) {
    firstInvalidField.reportValidity();
    return;
  }

  showStep(2);
});

document.querySelector("#back-button").addEventListener("click", () => {
  showStep(1);
});

document.querySelector("#review-button").addEventListener("click", () => {
  const selectedTime = form.querySelector('input[name="meetingTime"]:checked');
  if (!selectedTime) {
    const firstAvailableTime = form.querySelector('input[name="meetingTime"]:not(:disabled)');
    if (firstAvailableTime) {
      firstAvailableTime.reportValidity();
    } else {
      message.textContent = "Não há horários disponíveis nesta data. Escolha outra data.";
    }
    return;
  }

  const driver = getDriverDetails();
  document.querySelector("#review-name").textContent = driver.name;
  document.querySelector("#review-phone").textContent = driver.phone;
  document.querySelector("#review-vehicle").textContent = driver.vehicle;
  document.querySelector("#review-date").textContent = formatDisplayDate(driver.date);
  document.querySelector("#review-time").textContent = driver.meetingTime;
  showStep(3);
});

document.querySelector("#back-to-schedule-button").addEventListener("click", () => {
  showStep(2);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (steps.findIndex((step) => !step.hidden) !== 2) {
    return;
  }

  const driver = getDriverDetails();

  try {
    const appointments = readAppointments();
    const slotTaken = appointments.some((appointment) => (
      appointment.date === driver.date && appointment.meetingTime === driver.meetingTime
    ));

    if (slotTaken) {
      message.textContent = "Este horário acabou de ser reservado. Escolha outro horário para continuar.";
      showStep(2);
      return;
    }

    appointments.push({
      ...driver,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    saveAppointments(appointments);
  } catch (error) {
    message.textContent = error.message;
    return;
  }

  bookingComplete = true;
  form.hidden = true;
  progress.hidden = true;
  successPanel.hidden = false;
});

document.querySelector("#new-booking-button").addEventListener("click", () => {
  bookingComplete = false;
  form.reset();
  dateInput.value = dateInput.min;
  successPanel.hidden = true;
  form.hidden = false;
  progress.hidden = false;
  showStep(1);
});

document.querySelector("#back-to-booking-button").addEventListener("click", showBooking);
