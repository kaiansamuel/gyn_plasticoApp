function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return formatLocalDate(new Date());
}

export function currentMonthStart(): string {
  const now = new Date();
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function currentMonthEnd(): string {
  const now = new Date();
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}
