export function plural(quantidade, singular, formaPlural = `${singular}s`) {
  return `${quantidade} ${quantidade === 1 ? singular : formaPlural}`;
}
