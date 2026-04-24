export default function sitemap() {
  const baseUrl = "https://ydtfocus.vercel.app";

  const routes = [
    "",
    "/login",
    "/register",
    "/dashboard",
    "/archive",
    "/reading",
    "/grammar",
    "/linefocus",
    "/quiz",
    "/hero",
    "/mistakes",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
