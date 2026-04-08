const semanticNetwork = {
  conditions: {
    Waterlogging: {
      type: "Condition",
      category: "Water",
      score: 30,
      description: "Excess standing water is observed in the field.",
      observation: "Water remains stagnant on the field surface.",
      recommendation_hint: "Check drainage immediately."
    },
    Poor_Drainage: {
      type: "Condition",
      category: "Water",
      score: 20,
      description: "The field does not drain water effectively.",
      observation: "Water takes too long to disappear after rain.",
      recommendation_hint: "Inspect the drainage path."
    },
    Pest_Presence: {
      type: "Condition",
      category: "Pest",
      score: 25,
      description: "Visible pests are found on the crop.",
      observation: "Insects or feeding damage are noticed on the plants.",
      recommendation_hint: "Inspect the crop for pest control action."
    },
    Leaf_Yellowing: {
      type: "Condition",
      category: "Crop_Symptom",
      score: 15,
      description: "Leaves are turning yellow abnormally.",
      observation: "Yellow discoloration is visible on the leaves.",
      recommendation_hint: "Check plant health and nutrient condition."
    },
    Leaf_Spots: {
      type: "Condition",
      category: "Crop_Symptom",
      score: 20,
      description: "Leaves show unusual spots or lesions.",
      observation: "Brown, black, or irregular spots are visible.",
      recommendation_hint: "Inspect for possible disease symptoms."
    },
    Heavy_Rainfall: {
      type: "Condition",
      category: "Weather",
      score: 15,
      description: "Recent rainfall has been unusually high.",
      observation: "The area has experienced strong or frequent rain recently.",
      recommendation_hint: "Continue close field monitoring after rainfall."
    }
  },
  risk_levels: {
    Low_Risk: {
      type: "RiskLevel",
      min_score: 0,
      max_score: 24,
      recommendation: "At the moment, this looks relatively low risk. Regular monitoring should be enough."
    },
    Medium_Risk: {
      type: "RiskLevel",
      min_score: 25,
      max_score: 49,
      recommendation: "This looks like a moderate risk situation. A field inspection is recommended."
    },
    High_Risk: {
      type: "RiskLevel",
      min_score: 50,
      max_score: 999,
      recommendation: "This appears to be a high risk situation. Immediate action is recommended."
    }
  }
};

// Regex-based patterns for more flexible condition extraction
const conditionPatterns = {
  Waterlogging: [
    /\bstanding water\b/,
    /\bstagnant water\b/,
    /\bwaterlogged\b/,
    /\bflooded\b/,
    /\bflooded field\b/,
    /\bwater remains\b/,
    /\bwater remaining\b/
  ],
  Poor_Drainage: [
    /\bpoor drainage\b/,
    /\bdoes not drain\b/,
    /\bdoesn t drain\b/,
    /\bdrains slowly\b/,
    /\bslow drainage\b/,
    /\bwater stays\b/,
    /\bwater stays for a long time\b/,
    /\bwater remains for a long time\b/,
    /\bwater remains.*after rain\b/,
    /\bwater remains.*after rainfall\b/,
    /\blong time after rainfall\b/,
    /\blong time after rain\b/
  ],
  Pest_Presence: [
    /\bpest\b/,
    /\bpests\b/,
    /\binsect\b/,
    /\binsects\b/,
    /\bbug\b/,
    /\bbugs\b/,
    /\binsect damage\b/,
    /\bpest damage\b/,
    /\bfeeding damage\b/
  ],
  Leaf_Yellowing: [
    /\byellow leaves\b/,
    /\byellow leaf\b/,
    /\bleaf yellowing\b/,
    /\byellowing leaves\b/,
    /\bleaves turning yellow\b/,
    /\bleaves are turning yellow\b/,
    /\bleaf is turning yellow\b/,
    /\bleaves are yellow\b/,
    /\byellow discoloration\b/,
    /\byellow discolouration\b/,
    /\byellow\b.*\bleaves\b/,
    /\bleaves\b.*\byellow\b/
  ],
  Leaf_Spots: [
    /\bleaf spots\b/,
    /\bspots on leaves\b/,
    /\bbrown spots\b/,
    /\bblack spots\b/,
    /\blesion\b/,
    /\blesions\b/,
    /\bunusual spots\b/,
    /\bspots\b.*\bleaves\b/,
    /\bleaves\b.*\bspots\b/
  ],
  Heavy_Rainfall: [
    /\bheavy rain\b/,
    /\bheavy rainfall\b/,
    /\bstrong rain\b/,
    /\bfrequent rain\b/,
    /\ba lot of rain\b/,
    /\brainfall recently\b/,
    /\brain recently\b/,
    /\brecent heavy rain\b/,
    /\brecent heavy rainfall\b/
  ]
};

const categoryKeywords = {
  Water: [
    "water",
    "drainage",
    "flood",
    "flooded",
    "waterlogging",
    "standing water"
  ],
  Pest: [
    "pest",
    "pests",
    "insect",
    "insects",
    "bug",
    "bugs"
  ],
  Crop_Symptom: [
    "crop symptom",
    "crop symptoms",
    "crop",
    "leaf",
    "leaves",
    "yellow",
    "spot",
    "spots",
    "lesion",
    "lesions"
  ],
  Weather: [
    "weather",
    "rain",
    "rainfall",
    "heavy rain"
  ]
};

const categoryDisplayNames = {
  Water: "water-related symptoms",
  Pest: "pest-related symptoms",
  Crop_Symptom: "crop symptoms",
  Weather: "weather-related symptoms"
};

const allCategories = ["Water", "Pest", "Crop_Symptom", "Weather"];

const negativeExactPatterns = [
  "no",
  "none",
  "nothing",
  "nope",
  "not really",
  "nothing else",
  "that's all",
  "thats all",
  "no other symptoms",
  "no more symptoms",
  "no other issue",
  "no other issues",
  "no additional symptoms",
  "nothing more",
  "no more"
];

const affirmativeExactPatterns = [
  "yes",
  "yeah",
  "yep"
];

const state = {
  stage: "initial", // initial | awaiting_category | awaiting_symptom_detail | done
  selectedConditions: [],
  selectedCategories: [],
  pendingCategory: null
};

function getCondition(conditionName) {
  return semanticNetwork.conditions[conditionName] ?? null;
}

function getRiskLevels() {
  return semanticNetwork.risk_levels;
}

function calculateScore(selectedConditions) {
  let totalScore = 0;

  for (const conditionName of selectedConditions) {
    const condition = getCondition(conditionName);
    if (condition) {
      totalScore += condition.score;
    }
  }

  return totalScore;
}

function classifyRisk(totalScore) {
  const riskLevels = Object.entries(getRiskLevels()).sort(
    (a, b) => a[1].min_score - b[1].min_score
  );

  for (const [riskName, riskInfo] of riskLevels) {
    if (riskInfo.min_score <= totalScore && totalScore <= riskInfo.max_score) {
      return riskName;
    }
  }

  return "Unknown_Risk";
}

function getRecommendation(riskLevel) {
  const riskInfo = getRiskLevels()[riskLevel];
  return riskInfo ? riskInfo.recommendation : "No recommendation available.";
}

function getConditionDetails(selectedConditions) {
  const details = [];

  for (const conditionName of selectedConditions) {
    const condition = getCondition(conditionName);
    if (condition) {
      details.push({
        name: conditionName,
        category: condition.category,
        description: condition.description,
        recommendation_hint: condition.recommendation_hint
      });
    }
  }

  return details;
}

function evaluateConditions(selectedConditions) {
  const totalScore = calculateScore(selectedConditions);
  const riskLevel = classifyRisk(totalScore);
  const recommendation = getRecommendation(riskLevel);
  const conditionDetails = getConditionDetails(selectedConditions);

  return {
    selected_conditions: selectedConditions,
    total_score: totalScore,
    risk_level: riskLevel,
    recommendation,
    condition_details: conditionDetails
  };
}

function formatRiskName(riskName) {
  return riskName.replaceAll("_", " ");
}

function formatConditionName(name) {
  return name.replaceAll("_", " ");
}

function formatConditionPhrase(name) {
  return formatConditionName(name).toLowerCase();
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractConditionsFromText(text) {
  const normalized = normalizeText(text);
  const matchedConditions = [];

  for (const [condition, patterns] of Object.entries(conditionPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        matchedConditions.push(condition);
        break;
      }
    }
  }

  return [...new Set(matchedConditions)];
}

function extractCategoriesFromText(text) {
  const normalized = normalizeText(text);
  const matchedCategories = [];

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        matchedCategories.push(category);
        break;
      }
    }
  }

  return [...new Set(matchedCategories)];
}

function detectReplyIntent(text) {
  const normalized = normalizeText(text);

  if (negativeExactPatterns.includes(normalized)) {
    return "negative";
  }

  if (affirmativeExactPatterns.includes(normalized)) {
    return "affirmative";
  }

  if (/^(no|none|nothing|nope)\b/.test(normalized)) {
    return "negative";
  }

  if (/^(yes|yeah|yep)\b/.test(normalized)) {
    return "affirmative";
  }

  return "unknown";
}

function addUniqueConditions(newConditions) {
  for (const condition of newConditions) {
    if (!state.selectedConditions.includes(condition)) {
      state.selectedConditions.push(condition);
    }

    const category = getCondition(condition)?.category;
    if (category && !state.selectedCategories.includes(category)) {
      state.selectedCategories.push(category);
    }
  }
}

function getRemainingCategories() {
  return allCategories.filter(category => !state.selectedCategories.includes(category));
}

function getRemainingCategoryDisplayText() {
  const remaining = getRemainingCategories();
  return remaining.map(category => categoryDisplayNames[category]).join(", ");
}

function showDetectedConditions(conditions) {
  if (conditions.length === 0) return;

  const readable = conditions
    .map(condition => formatConditionPhrase(condition))
    .join(", ");

  addMessage(
    "bot",
    `Got it — from what you described, it sounds like there may be ${readable}.`
  );
}

function askForOtherCategories() {
  const remaining = getRemainingCategories();

  if (remaining.length === 0) {
    showFinalResult();
    return;
  }

  state.stage = "awaiting_category";
  const categoryText = remaining.map(category => categoryDisplayNames[category]).join(", ");

  addMessage(
    "bot",
    `Are you noticing anything else as well? For example, ${categoryText}. You can say "no" if that’s all, or just describe what you’re seeing.`
  );
}

function askForSymptomDetail(category) {
  state.stage = "awaiting_symptom_detail";
  state.pendingCategory = category;

  addMessage(
    "bot",
    `Alright — could you tell me a little more about the ${categoryDisplayNames[category]}?`
  );
}

function showFinalResult() {
  state.stage = "done";

  const result = evaluateConditions(state.selectedConditions);

  let html = `
    <div class="result-card">
      <h3>Assessment Summary</h3>
      <p><strong>Risk Level:</strong> ${formatRiskName(result.risk_level)}</p>
      <p><strong>Total Score:</strong> ${result.total_score}</p>
      <p>${result.recommendation}</p>
  `;

  if (result.condition_details.length > 0) {
    html += `<p><strong>What I picked up from your description:</strong></p><ul>`;
    for (const detail of result.condition_details) {
      html += `
        <li>
          <strong>${formatConditionName(detail.name)}</strong> (${detail.category})<br>
          ${detail.description}<br>
          <em>Suggested check:</em> ${detail.recommendation_hint}
        </li>
      `;
    }
    html += `</ul>`;
  } else {
    html += `<p>I could not confidently identify any clear condition from the description provided.</p>`;
  }

  html += `</div>`;

  addMessage(
    "bot",
    "Thanks — I’ve got enough information now. Here’s the assessment based on what you described:"
  );
  addMessage("bot", html, true);
}

function resetState() {
  state.stage = "initial";
  state.selectedConditions = [];
  state.selectedCategories = [];
  state.pendingCategory = null;
}

const chatMessages = document.getElementById("chatMessages");
const symptomInput = document.getElementById("symptomInput");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");

function addMessage(sender, text, isHtml = false) {
  const row = document.createElement("div");
  row.className = `message-row ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (isHtml) {
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }

  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showWelcomeMessage() {
  addMessage(
    "bot",
    "Welcome to the Field Risk Assessment Chatbot. Tell me what you’re observing in the field, and I’ll help narrow it down before giving you a final assessment."
  );
}

function handleInitialInput(inputText) {
  const matchedConditions = extractConditionsFromText(inputText);

  if (matchedConditions.length === 0) {
    addMessage(
      "bot",
      "I’m not quite sure which symptom that points to yet. Could you mention something more specific, such as standing water, poor drainage, pests, yellow leaves, leaf spots, or heavy rain?"
    );
    return;
  }

  addUniqueConditions(matchedConditions);
  showDetectedConditions(matchedConditions);
  askForOtherCategories();
}

function handleCategorySelection(inputText) {
  const intent = detectReplyIntent(inputText);
  const matchedConditions = extractConditionsFromText(inputText);
  const matchedCategories = extractCategoriesFromText(inputText);

  if (intent === "negative" && matchedConditions.length === 0 && matchedCategories.length === 0) {
    addMessage("bot", "Alright, thanks — that helps.");
    showFinalResult();
    return;
  }

  if (matchedConditions.length > 0) {
    addUniqueConditions(matchedConditions);
    showDetectedConditions(matchedConditions);
    askForOtherCategories();
    return;
  }

  const remainingCategories = getRemainingCategories();
  const validMatchedCategories = matchedCategories.filter(category =>
    remainingCategories.includes(category)
  );

  if (validMatchedCategories.length > 0) {
    askForSymptomDetail(validMatchedCategories[0]);
    return;
  }

  if (intent === "affirmative") {
    addMessage(
      "bot",
      `Got it — could you tell me a bit more about what you're seeing? You can mention something like ${getRemainingCategoryDisplayText()}.`
    );
    return;
  }

  addMessage(
    "bot",
    `Hmm, I’m not quite sure which category that falls under. You can reply with something like ${getRemainingCategoryDisplayText()}, say "no", or just describe the symptom in a little more detail.`
  );
}

function handleSymptomDetail(inputText) {
  const matchedConditions = extractConditionsFromText(inputText);

  if (matchedConditions.length === 0) {
    addMessage(
      "bot",
      `I’m not fully sure what that points to yet for ${categoryDisplayNames[state.pendingCategory]}. Could you describe it a bit more clearly, or say "no" if there’s nothing there?`
    );
    return;
  }

  const filteredConditions = matchedConditions.filter(condition => {
    const category = getCondition(condition)?.category;
    return category === state.pendingCategory;
  });

  if (filteredConditions.length === 0) {
    addMessage(
      "bot",
      `I picked up a symptom from that reply, but it doesn’t seem to match ${categoryDisplayNames[state.pendingCategory]}. Could you describe that part a little more specifically, or say "no" if not?`
    );
    return;
  }

  addUniqueConditions(filteredConditions);
  showDetectedConditions(filteredConditions);
  state.pendingCategory = null;
  askForOtherCategories();
}

function handleAnalysis() {
  const inputText = symptomInput.value.trim();

  if (!inputText) {
    addMessage("bot", "Go ahead and type what you’re observing before continuing.");
    return;
  }

  addMessage("user", inputText);

  if (state.stage === "done") {
    addMessage(
      "bot",
      "This assessment is already complete. Press Reset if you’d like to start a new one."
    );
    symptomInput.value = "";
    return;
  }

  if (state.stage === "initial") {
    handleInitialInput(inputText);
  } else if (state.stage === "awaiting_category") {
    handleCategorySelection(inputText);
  } else if (state.stage === "awaiting_symptom_detail") {
    const intent = detectReplyIntent(inputText);

    if (intent === "negative") {
      addMessage("bot", "Alright — no problem.");
      state.pendingCategory = null;
      askForOtherCategories();
    } else {
      handleSymptomDetail(inputText);
    }
  }

  symptomInput.value = "";
}

function resetChat() {
  chatMessages.innerHTML = "";
  symptomInput.value = "";
  resetState();
  showWelcomeMessage();
}

sendBtn.addEventListener("click", handleAnalysis);

symptomInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleAnalysis();
  }
});

resetBtn.addEventListener("click", resetChat);

showWelcomeMessage();