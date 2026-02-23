// shared/functions/application.ts
import appDetails from "../definitions/appDetails/appDetails.json";

export const appDetailsProjectByDomain = (domain: string | null) => {
  if (!domain) return null
  return appDetails.projects.find((item) => item.domain === domain);
};

export const appDetailsProjectByKey = (key: string | null) => {
  if (!key) return null
  return appDetails.projects.find((item) => item.key === key);
};