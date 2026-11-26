export type DeadlineState = 'overdue' | 'today' | 'soon' | 'upcoming' | 'none';

export const formatDueDate = (isoDate: string | null): string => {
  if (!isoDate) return 'No due date';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'No due date';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const getDeadlineState = (
  isoDate: string | null,
  status: string
): DeadlineState => {
  if (!isoDate || status === 'Completed') return 'none';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'none';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  const soonCutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  if (date < startOfToday) return 'overdue';
  if (date >= startOfToday && date <= endOfToday) return 'today';
  if (date <= soonCutoff) return 'soon';
  return 'upcoming';
};

export const toDateInputValue = (isoDate: string | null): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromDateInputValue = (value: string): string | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  // Store at 23:59:00 local time so due date covers the full chosen calendar day
  const localEnd = new Date(year, month - 1, day, 23, 59, 0, 0);
  return localEnd.toISOString();
};
