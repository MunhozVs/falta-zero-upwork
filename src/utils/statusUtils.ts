export const statusColors: Record<string, string> = {
  'Scheduled': "bg-blue-50 text-blue-700 border border-blue-200",
  'Confirmed': "bg-green-50 text-green-700 border border-green-200",
  'Cancelled': "bg-red-50 text-red-700 border border-red-200",
  'Completed': "bg-gray-100 text-gray-700 border border-gray-200",
  'Human_Required': "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20",
};

export const getStatusStyles = (status: string) => {
  return statusColors[status] || "bg-surface-container-low text-on-surface-variant border border-outline-variant/10";
};

export const getInitials = (name: string) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};
