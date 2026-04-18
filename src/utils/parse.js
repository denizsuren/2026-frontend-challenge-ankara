export function parseSubmission(raw, source) {
  const flat = {
    id: raw.id,
    createdAt: raw.created_at,
    source,
  };

  if (raw.answers) {
    Object.values(raw.answers).forEach((field) => {
      if (field.answer !== null && field.answer !== undefined && field.answer !== "") {
        flat[field.name] = field.answer;
      }
    });
  }

  return flat;
}

export function parseAll(rawData) {
  const result = {};
  Object.keys(rawData).forEach((source) => {
    result[source] = rawData[source].map((r) => parseSubmission(r, source));
  });
  return result;
}