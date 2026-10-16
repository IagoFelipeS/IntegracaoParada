// Troque pelo endereço que deve receber as solicitações.
const EMAIL_DESTINO = "seu-email@exemplo.com";

const form = document.querySelector("#booking-form");
const steps = [...document.querySelectorAll("[data-step]")];
const progressSteps = [...document.querySelectorAll("[data-progress-step]")];
const message = document.querySelector("#form-message");

function showStep(stepNumber) {
  steps.forEach((step) => {
    step.hidden = Number(step.dataset.step) !== stepNumber;
  });

  progressSteps.forEach((step) => {
    const number = Number(step.dataset.progressStep);
    step.classList.toggle("is-active", number === stepNumber);
    step.classList.toggle("is-complete", number < stepNumber);
  });

  document.querySelector(".progress").setAttribute("aria-label", `Etapa ${stepNumber} de 2`);
  message.textContent = "";
}

function getDriverDetails() {
  const data = new FormData(form);
  return {
    name: data.get("name").trim(),
    phone: data.get("phone").trim(),
    vehicle: data.get("vehicleType").trim(),
    meetingTime: data.get("meetingTime"),
  };
}

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

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const selectedTime = form.querySelector('input[name="meetingTime"]:checked');
  if (!selectedTime) {
    form.querySelector('input[name="meetingTime"]').reportValidity();
    return;
  }

  if (EMAIL_DESTINO === "seu-email@exemplo.com") {
    message.textContent = "Configure o endereço de recebimento em EMAIL_DESTINO, no arquivo app.js, antes de confirmar.";
    return;
  }

  const driver = getDriverDetails();
  const subject = `Agendamento de reunião - ${driver.name}`;
  const body = [
    "Nova solicitação de reunião",
    "",
    `Nome: ${driver.name}`,
    `Telefone: ${driver.phone}`,
    `Tipologia do veículo: ${driver.vehicle}`,
    `Horário: ${driver.meetingTime}`,
  ].join("\n");
  const mailto = `mailto:${encodeURIComponent(EMAIL_DESTINO)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  message.textContent = "Seu aplicativo de email será aberto com a mensagem preenchida. Envie o email para concluir a solicitação.";
  window.location.href = mailto;
});
