// Shared formatting for skill and summon combat messages.

function formatMessage(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in values) || values[key] === undefined) {
      throw new Error(`Message placeholder {${key}} has no value in "${template}".`);
    }
    return String(values[key]);
  });
}

module.exports = { formatMessage };
