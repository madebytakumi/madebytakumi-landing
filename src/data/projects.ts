import { languages, type Lang } from "@/i18n";

// Non-translatable, structural metadata for each project, merged by index with
// the translatable copy in the i18n dictionaries (title/description/keywords).
// Keep this array in the same order as `projects.items` in es.ts / en.ts.
const projectMeta = [
  { logo: "/projects/glyvo.png", logoAlt: "Glyvo", url: "https://glyvo.madebytakumi.com.mx" },
  { logo: "/projects/exorno.svg", logoAlt: "Exorno", url: "https://exorno-landing.pages.dev/" },
] as const;

export const getProjects = (lang: Lang = "es") =>
  languages[lang].projects.items.map((item, i) => ({ ...item, ...projectMeta[i] }));
