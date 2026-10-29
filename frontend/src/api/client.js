const baseHref = document.querySelector("base")?.getAttribute("href") || "/";
const apiRoot = baseHref.includes("{{")
  ? "/api/"
  : new URL("api/", document.baseURI).pathname;
let cachedKey = "";
try {
  sessionStorage.removeItem("storm-api-key");
} catch {}

export const call = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (cachedKey) headers.Authorization = "Basic " + btoa(":" + cachedKey);
  let r = await fetch(apiRoot + path.replace(/^\//, ""), {
    ...options,
    headers,
  });
  if (r.status === 401 && !cachedKey) {
    cachedKey = window.prompt("API key required") || "";
    if (!cachedKey) throw Error("API key required");
    return call(path, options);
  }
  if (!r.ok && r.status !== 304) {
    let e;
    try {
      e = await r.json();
    } catch {}
    throw Error(e?.Error || r.statusText);
  }
  if (r.status === 204 || r.status === 304) return null;
  return r.json();
};
