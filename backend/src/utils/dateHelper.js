

// export function getDateKey(timestamp) {
//   const date = new Date(timestamp);
//   return date.toISOString().split('T')[0]; // "2026-01-17"
// }

// export function getWeekKey(timestamp) {
//   const date = new Date(timestamp);
//   const year = date.getFullYear();
//   const week = getISOWeek(date);
//   return `${year}-W${week.toString().padStart(2, '0')}`; // "2026-W03"
// }

// export function getMonthKey(timestamp) {
//   const date = new Date(timestamp);
//   const year = date.getFullYear();
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');
//   return `${year}-${month}`; // "2026-01"
// }

// export function getISOWeek(date) {
//   const target = new Date(date.valueOf());
//   const dayNr = (date.getDay() + 6) % 7;
//   target.setDate(target.getDate() - dayNr + 3);
//   const firstThursday = target.valueOf();
//   target.setMonth(0, 1);
//   if (target.getDay() !== 4) {
//     target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
//   }
//   return 1 + Math.ceil((firstThursday - target) / 604800000);
// }

// export function getWeekBounds(weekKey) {
//   const [year, week] = weekKey.split('-W').map(Number);
  
//   const jan4 = new Date(year, 0, 4);
//   const firstThursday = new Date(jan4);
//   firstThursday.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7 + 3);
  
//   const startDate = new Date(firstThursday);
//   startDate.setDate(firstThursday.getDate() - 3 + (week - 1) * 7);
  
//   const endDate = new Date(startDate);
//   endDate.setDate(startDate.getDate() + 6);
  
//   return {
//     startDate: getDateKey(startDate),
//     endDate: getDateKey(endDate)
//   };
// }

