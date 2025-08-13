// utils/dateFormatter.js
export function formatBookingDate(dateString) {
  if (!dateString) return '';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',  // e.g., Monday
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};
