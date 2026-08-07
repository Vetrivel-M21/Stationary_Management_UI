// Date formatting helper to ensure DD/MM/YYYY (Date/Month/Year) format across the application

export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${day}/${month}/${year} ${time}`;
};

export const formatLocationDisplay = (branchName, locationStr) => {
  if (!locationStr) return '-';
  let cleaned = locationStr.trim();
  if (branchName) {
    const bName = branchName.trim();
    if (cleaned.toLowerCase().startsWith(`${bName.toLowerCase()} - `)) {
      cleaned = cleaned.substring(bName.length + 3).trim();
    } else if (cleaned.toLowerCase().startsWith(`${bName.toLowerCase()}-`)) {
      cleaned = cleaned.substring(bName.length + 1).trim();
    } else if (cleaned.toLowerCase() === bName.toLowerCase()) {
      return '-';
    }
  }
  return cleaned || '-';
};
