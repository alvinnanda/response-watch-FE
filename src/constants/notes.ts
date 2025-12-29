export const NOTE_COLORS = [
  { id: 'default', value: 'default', class: 'bg-white', border: 'border-gray-200' },
  { id: 'red', value: 'red', class: 'bg-red-50', border: 'border-red-200' },
  { id: 'orange', value: 'orange', class: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'yellow', value: 'yellow', class: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'green', value: 'green', class: 'bg-green-50', border: 'border-green-200' },
  { id: 'teal', value: 'teal', class: 'bg-teal-50', border: 'border-teal-200' },
  { id: 'blue', value: 'blue', class: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'purple', value: 'purple', class: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'pink', value: 'pink', class: 'bg-pink-50', border: 'border-pink-200' },
];

export const getNoteColor = (colorId?: string) => {
  return NOTE_COLORS.find(c => c.value === colorId) || NOTE_COLORS[0];
};
