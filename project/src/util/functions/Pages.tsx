export function domainToUrl(domain: string): string {
  domain = domain.trim();
  if (/^https?:\/\//i.test(domain)) {
    return domain;
  }
  return `https://${domain}`;
}

export function removeTrailingSlash(str: string | null) {
  return str ? str.replace(/\/+$/, "") : str;
}
