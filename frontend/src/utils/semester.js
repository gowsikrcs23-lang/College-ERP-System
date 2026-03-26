const romanMap = [
  ['M', 1000],
  ['CM', 900],
  ['D', 500],
  ['CD', 400],
  ['C', 100],
  ['XC', 90],
  ['L', 50],
  ['XL', 40],
  ['X', 10],
  ['IX', 9],
  ['V', 5],
  ['IV', 4],
  ['I', 1]
];

export const toRoman = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '';
  let result = '';
  let remaining = Math.floor(num);
  romanMap.forEach(([symbol, amount]) => {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  });
  return result;
};

export const formatSemester = (value) => {
  const roman = toRoman(value);
  return roman || String(value || '');
};
