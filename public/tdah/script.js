const questions = [
  { id: "focus", group: "Attention", text: "Perdre le fil d’une tâche même quand elle est importante." },
  { id: "finish", group: "Attention", text: "Commencer plusieurs choses et avoir du mal à les terminer." },
  { id: "organize", group: "Attention", text: "Avoir du mal à organiser les étapes, les priorités ou les délais." },
  { id: "forget", group: "Attention", text: "Oublier des rendez-vous, objets, messages ou démarches prévues." },
  { id: "avoid", group: "Attention", text: "Repousser les tâches longues, administratives ou répétitives." },
  { id: "detail", group: "Attention", text: "Faire des erreurs d’inattention malgré l’envie de bien faire." },
  { id: "restless", group: "Impulsivité / agitation", text: "Ressentir une agitation intérieure ou un besoin de bouger." },
  { id: "interrupt", group: "Impulsivité / agitation", text: "Couper la parole, répondre trop vite ou agir avant d’avoir tout entendu." },
  { id: "wait", group: "Impulsivité / agitation", text: "Avoir du mal à attendre, ralentir ou rester dans une activité calme." },
  { id: "switch", group: "Impulsivité / agitation", text: "Changer souvent d’activité pour chercher de la nouveauté ou de la stimulation." },
  { id: "emotion", group: "Impulsivité / agitation", text: "Réagir fortement sur le moment puis regretter après coup." },
  { id: "pace", group: "Impulsivité / agitation", text: "Sous-estimer le temps nécessaire ou arriver régulièrement en retard." }
];

const labels = ["Jamais", "Parfois", "Souvent", "Très souvent"];
const questionList = document.querySelector("#question-list");
const form = document.querySelector("#assessment-form");
const resultTitle = document.querySelector("#result-title");
const resultText = document.querySelector("#result-text");
const meterFill = document.querySelector("#meter-fill");
const summaryOutput = document.querySelector("#summary-output");
const copyStatus = document.querySelector("#copy-status");

function renderQuestions() {
  questionList.innerHTML = questions
    .map((question, index) => {
      const options = labels
        .map((label, value) => `
          <label class="scale-option" data-label="${label}">
            <input type="radio" name="${question.id}" value="${value}" ${value === 0 ? "checked" : ""}>
          </label>
        `)
        .join("");

      return `
        <fieldset class="question-row">
          <legend class="question-text">${index + 1}. ${question.text}</legend>
          <div class="scale-options">${options}</div>
        </fieldset>
      `;
    })
    .join("");
}

function checkedValues(selector) {
  return Array.from(document.querySelectorAll(`${selector} input:checked`)).map((input) => input.value);
}

function getScores() {
  return questions.map((question) => {
    const selected = document.querySelector(`input[name="${question.id}"]:checked`);
    return {
      ...question,
      score: Number(selected?.value || 0)
    };
  });
}

function levelFrom(score, contexts, history) {
  if (score >= 24 && contexts >= 2 && history >= 1) {
    return {
      title: "Priorité élevée pour en parler",
      text: "Les réponses décrivent plusieurs difficultés fréquentes, avec retentissement dans plusieurs contextes et des indices anciens. Cela mérite une évaluation professionnelle."
    };
  }

  if (score >= 14 || contexts >= 2) {
    return {
      title: "À discuter avec un professionnel",
      text: "Les réponses montrent des difficultés à clarifier. Un professionnel pourra vérifier l’histoire, le retentissement et les autres causes possibles."
    };
  }

  return {
    title: "Observations à surveiller",
    text: "Les réponses actuelles ne suffisent pas à orienter fortement vers une évaluation TDAH, mais les exemples concrets restent utiles si la gêne persiste."
  };
}

function buildSummary(scores, contexts, history, factors, notes, level) {
  const frequent = scores
    .filter((item) => item.score >= 2)
    .map((item) => `- ${item.text} (${labels[item.score]})`);

  return [
    "Résumé de pré-évaluation TDAH adulte",
    "",
    "Statut : outil informatif, pas un diagnostic.",
    `Orientation de discussion : ${level.title}`,
    "",
    `Difficultés fréquentes notées : ${frequent.length ? "" : "aucune difficulté fréquente cochée"}`,
    frequent.join("\n"),
    "",
    `Contextes touchés : ${contexts.length ? contexts.join(", ") : "non renseigné"}`,
    `Indices depuis l’enfance : ${history.length ? history.join(", ") : "non renseigné"}`,
    `Facteurs à discuter : ${factors.length ? factors.join(", ") : "non renseigné"}`,
    "",
    "Notes libres :",
    notes || "Non renseigné",
    "",
    "Points à vérifier en consultation : symptômes depuis l’enfance, retentissement dans plusieurs contextes, diagnostics différentiels, troubles associés, options d’accompagnement."
  ].join("\n");
}

renderQuestions();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const scores = getScores();
  const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
  const contexts = checkedValues("#context-list");
  const history = checkedValues("#history-list");
  const factors = checkedValues("#factor-list");
  const notes = document.querySelector("#notes").value.trim();
  const level = levelFrom(totalScore, contexts.length, history.length);

  resultTitle.textContent = level.title;
  resultText.textContent = level.text;
  meterFill.style.width = `${Math.min(100, Math.round((totalScore / 36) * 100))}%`;
  summaryOutput.textContent = buildSummary(scores, contexts, history, factors, notes, level);
  copyStatus.textContent = "";
});

document.querySelector("#copy-summary").addEventListener("click", async () => {
  const text = summaryOutput.textContent.trim();

  if (!text || text === "Le résumé apparaîtra ici.") {
    copyStatus.textContent = "Génère d’abord un résumé.";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Résumé copié.";
  } catch {
    copyStatus.textContent = "Copie manuelle possible dans le bloc de résumé.";
  }
});

document.querySelector("#reset-form").addEventListener("click", () => {
  form.reset();
  resultTitle.textContent = "À compléter";
  resultText.textContent = "Remplis les sections, puis génère un résumé. Les réponses restent dans ton navigateur et ne sont pas envoyées à un serveur.";
  meterFill.style.width = "0";
  summaryOutput.textContent = "Le résumé apparaîtra ici.";
  copyStatus.textContent = "";
});
