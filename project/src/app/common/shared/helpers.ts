export function formatDate(utcString: string | undefined): string {
  if (!utcString) {
    return 'N/A';
  }
  
  let normalizedString = utcString;
  if (normalizedString.includes('T') && normalizedString.includes('.')) {
    const microsecondRegex = /\.(\d{4,})/;
    const microsecondMatch = microsecondRegex.exec(normalizedString);
    if (microsecondMatch?.[1]) {
      const milliseconds = microsecondMatch[1].substring(0, 3);
      normalizedString = normalizedString.replace(/\.\d+/, `.${milliseconds}`);
      const timezoneRegex = /[+-]\d{2}:\d{2}$|Z$/;
      if (!timezoneRegex.exec(normalizedString)) {
        normalizedString += 'Z';
      }
    }
  }
  
  const utcDate = new Date(normalizedString);

  if (isNaN(utcDate.getTime())) {
    return 'N/A';
  }

  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  const hours = utcDate.getHours();
  const minutes = String(utcDate.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${year}-${month}-${day} ${displayHours}:${minutes}${ampm}`;
}

export function parseBoolean(value: string | boolean | null | undefined): boolean {
  return value === true || value === 'true';
}

export function formatDateWithoutTime(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toDateString();
}
