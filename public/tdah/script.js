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
const profileLabel = document.querySelector("#profile-label");
const caseLabel = document.querySelector("#case-label");
const impactLabel = document.querySelector("#impact-label");

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

function sumGroup(scores, group) {
  return scores
    .filter((item) => item.group === group)
    .reduce((sum, item) => sum + item.score, 0);
}

function scoreById(scores, id) {
  return scores.find((item) => item.id === id)?.score || 0;
}

function profileFrom(scores) {
  const attention = sumGroup(scores, "Attention");
  const impulse = sumGroup(scores, "Impulsivité / agitation");
  const frequentAttention = scores.filter((item) => item.group === "Attention" && item.score >= 2).length;
  const frequentImpulse = scores.filter((item) => item.group === "Impulsivité / agitation" && item.score >= 2).length;

  if (frequentAttention >= 3 && frequentImpulse >= 3) {
    return {
      label: "Mixte attention + impulsivité",
      note: "Le profil combine des difficultés exécutives et une agitation/impulsivité fréquente. En consultation, il sera utile de donner des exemples dans les deux registres."
    };
  }

  if (attention >= impulse + 4 || frequentAttention >= 4) {
    return {
      label: "Dominante attention / fonctions exécutives",
      note: "Les réponses évoquent surtout l’organisation, la mémoire prospective, le démarrage ou la finalisation des tâches."
    };
  }

  if (impulse >= attention + 4 || frequentImpulse >= 4) {
    return {
      label: "Dominante agitation / impulsivité",
      note: "Les réponses évoquent surtout l’agitation intérieure, la difficulté à attendre, les interruptions ou la recherche de stimulation."
    };
  }

  return {
    label: "Profil à préciser",
    note: "Les réponses ne montrent pas une dominante nette. Les exemples concrets et le retentissement aideront à clarifier."
  };
}

function impactFrom(contexts, history, factors) {
  if (contexts.length >= 3 && history.length >= 2) {
    return {
      label: "Élevé",
      note: "Plusieurs contextes sont touchés et des indices anciens sont présents. Cela renforce l’intérêt d’une évaluation structurée."
    };
  }

  if (contexts.length >= 2) {
    return {
      label: "Modéré",
      note: "Le retentissement apparaît dans plusieurs contextes. C’est un élément important à documenter."
    };
  }

  if (factors.length >= 2) {
    return {
      label: "À interpréter prudemment",
      note: "Plusieurs facteurs peuvent imiter ou aggraver des symptômes proches du TDAH. Ils doivent être discutés avant de conclure."
    };
  }

  return {
    label: "À documenter",
    note: "Le niveau de gêne fonctionnelle reste à préciser avec des exemples concrets."
  };
}

function matchingCases(scores, contexts, factors) {
  const cases = [];

  if (scoreById(scores, "forget") >= 2 || scoreById(scores, "organize") >= 2 || scoreById(scores, "avoid") >= 2) {
    cases.push({
      weight: scoreById(scores, "forget") + scoreById(scores, "organize") + scoreById(scores, "avoid"),
      label: "Administratif qui déborde",
      detail: "Rendez-vous, papiers, objets, messages ou délais deviennent difficiles à tenir malgré l’envie de bien faire."
    });
  }

  if (scoreById(scores, "restless") >= 2 || scoreById(scores, "wait") >= 2 || scoreById(scores, "switch") >= 2) {
    cases.push({
      weight: scoreById(scores, "restless") + scoreById(scores, "wait") + scoreById(scores, "switch"),
      label: "Agitation intérieure",
      detail: "Besoin de mouvement, ennui rapide, impatience ou recherche de stimulation dominent le vécu quotidien."
    });
  }

  if (scoreById(scores, "interrupt") >= 2 || scoreById(scores, "emotion") >= 2 || contexts.includes("Relations et vie sociale")) {
    cases.push({
      weight: scoreById(scores, "interrupt") + scoreById(scores, "emotion") + (contexts.includes("Relations et vie sociale") ? 2 : 0),
      label: "Relations sous tension",
      detail: "Interruptions, réponses rapides, réactions émotionnelles ou malentendus peuvent peser sur les échanges."
    });
  }

  if (scoreById(scores, "pace") >= 2 || contexts.includes("Travail ou études")) {
    cases.push({
      weight: scoreById(scores, "pace") + (contexts.includes("Travail ou études") ? 2 : 0),
      label: "Performance irrégulière",
      detail: "Les délais, la concentration prolongée ou les transitions peuvent produire une impression d’effort constant."
    });
  }

  if (factors.includes("Sommeil insuffisant ou irrégulier")) {
    cases.push({
      weight: 1,
      label: "Sommeil à clarifier",
      detail: "Le sommeil peut majorer l’inattention, l’irritabilité et l’agitation. Il est important de le décrire précisément."
    });
  }

  return cases.length
    ? cases.sort((a, b) => b.weight - a.weight)
    : [{ weight: 0, label: "Cas à préciser", detail: "Ajoute des exemples concrets pour rapprocher le profil d’une situation clinique utile." }];
}

function nextQuestions(profile, impact, factors) {
  const questions = [
    "Depuis quel âge ces difficultés sont-elles visibles, et qui pourrait les confirmer ?",
    "Dans quels contextes les conséquences sont-elles les plus coûteuses ?",
    "Quelles stratégies compensent déjà les difficultés, et où échouent-elles ?"
  ];

  if (profile.label.includes("agitation") || profile.label.includes("impulsivité")) {
    questions.push("L’agitation est-elle visible de l’extérieur ou surtout intérieure ?");
  }

  if (profile.label.includes("attention")) {
    questions.push("Les difficultés augmentent-elles avec les tâches longues, répétitives ou peu stimulantes ?");
  }

  if (impact.label === "À interpréter prudemment" || factors.length) {
    questions.push("Quels facteurs peuvent expliquer ou amplifier les symptômes : sommeil, stress, humeur, substances, problème médical ?");
  }

  return questions;
}

function buildSummary(scores, contexts, history, factors, notes, level, profile, impact, cases, questions) {
  const frequent = scores
    .filter((item) => item.score >= 2)
    .map((item) => `- ${item.text} (${labels[item.score]})`);
  const caseLines = cases.map((item) => `- ${item.label} : ${item.detail}`);
  const questionLines = questions.map((item) => `- ${item}`);

  return [
    "Résumé de pré-évaluation TDAH adulte",
    "",
    "Statut : outil informatif, pas un diagnostic.",
    `Orientation de discussion : ${level.title}`,
    `Profil d’orientation : ${profile.label}`,
    `Retentissement : ${impact.label}`,
    "",
    `Difficultés fréquentes notées : ${frequent.length ? "" : "aucune difficulté fréquente cochée"}`,
    frequent.join("\n"),
    "",
    "Cas-types proches à discuter :",
    caseLines.join("\n"),
    "",
    `Contextes touchés : ${contexts.length ? contexts.join(", ") : "non renseigné"}`,
    `Indices depuis l’enfance : ${history.length ? history.join(", ") : "non renseigné"}`,
    `Facteurs à discuter : ${factors.length ? factors.join(", ") : "non renseigné"}`,
    "",
    "Avis d’orientation :",
    profile.note,
    impact.note,
    "",
    "Questions utiles pour la consultation :",
    questionLines.join("\n"),
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
  const profile = profileFrom(scores);
  const impact = impactFrom(contexts, history, factors);
  const cases = matchingCases(scores, contexts, factors);
  const questions = nextQuestions(profile, impact, factors);

  resultTitle.textContent = level.title;
  resultText.textContent = `${level.text} ${profile.note}`;
  profileLabel.textContent = profile.label;
  caseLabel.textContent = cases[0].label;
  impactLabel.textContent = impact.label;
  meterFill.style.width = `${Math.min(100, Math.round((totalScore / 36) * 100))}%`;
  summaryOutput.textContent = buildSummary(scores, contexts, history, factors, notes, level, profile, impact, cases, questions);
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
  profileLabel.textContent = "Non évalué";
  caseLabel.textContent = "À préciser";
  impactLabel.textContent = "À documenter";
  meterFill.style.width = "0";
  summaryOutput.textContent = "Le résumé apparaîtra ici.";
  copyStatus.textContent = "";
});
