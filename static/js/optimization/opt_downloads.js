// ==============================
// OPT_DOWNLOADS.JS — Export Functions
// ==============================

export function setupDownloads() {
  const downloadSearchBtn = document.getElementById("optimization-search-download");
  const downloadHistoryBtn = document.getElementById("optimization-history-download");
  const downloadSavedBtn = document.getElementById("optimization-report-download");

  if (!downloadSearchBtn || !downloadHistoryBtn || !downloadSavedBtn) return;

  const toCSV = (data) => {
    if (!data || !data.length) return "";

    const keys = Object.keys(data[0]);
    const escape = (val) => `"${(val ?? "").toString().replace(/"/g, '""')}"`;

    const header = keys.map(escape).join(",");
    const rows = data.map(row => keys.map(k => escape(row[k])).join(","));

    return [header, ...rows].join("\n");
  };

  const download = (filename, data) => {
    const blob = new Blob([toCSV(data)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const temp = document.createElement("a");
    temp.href = url;
    temp.download = filename;
    document.body.appendChild(temp);
    temp.click();
    document.body.removeChild(temp);
    URL.revokeObjectURL(url);
  };

  downloadSearchBtn.addEventListener("click", () => {
    download("optimization_search.csv", window.lastSearchResults || []);
  });

  downloadHistoryBtn.addEventListener("click", () => {
    const history = JSON.parse(localStorage.getItem("optimization-history") || "[]");
    download("optimization_history.csv", history);
  });

  downloadSavedBtn.addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem("optimization-saved") || "[]");
    download("optimization_saved.csv", saved);
  });
}
