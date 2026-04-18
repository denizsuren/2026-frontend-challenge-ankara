const BASE_URL = "https://api.jotform.com";

const SOURCES = {
  checkins: {
    formId: "261065067494966",
    apiKey: "ad39735f1449a6dc28d60e0921352665",
    label: "Checkins",
  },
  messages: {
    formId: "261065765723966",
    apiKey: "ad39735f1449a6dc28d60e0921352665",
    label: "Messages",
  },
  sightings: {
    formId: "261065244786967",
    apiKey: "ad39735f1449a6dc28d60e0921352665",
    label: "Sightings",
  },
  personalNotes: {
    formId: "261065509008958",
    apiKey: "ad39735f1449a6dc28d60e0921352665",
    label: "Personal Notes",
  },
  anonymousTips: {
    formId: "261065875889981",
    apiKey: "ad39735f1449a6dc28d60e0921352665",
    label: "Anonymous Tips",
  },
};

async function fetchSource(key) {
  const { formId, apiKey, label } = SOURCES[key];
  const url = `${BASE_URL}/form/${formId}/submissions?apiKey=${apiKey}&limit=1000`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label} yüklenemedi`);

  const data = await response.json();
  if (data.responseCode !== 200) throw new Error(`${label}: ${data.message}`);

  return { key, label, submissions: data.content || [] };
}

export async function fetchAllData() {
  const keys = Object.keys(SOURCES);
  const results = await Promise.all(keys.map((k) => fetchSource(k)));

  const organized = {};
  results.forEach((r) => {
    organized[r.key] = r.submissions;
  });

  return organized;
}