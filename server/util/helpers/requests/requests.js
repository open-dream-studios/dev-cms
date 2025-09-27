// // server/util/helpers/requests/requests.js
// export function normalizeParams(input) {
//   if (!input) return {};

//   if (typeof input === 'string') {
//     try {
//       return JSON.parse(input);
//     } catch {
//       return {};
//     }
//   }

//   if (typeof input === 'object') {
//     if (input.parameters !== undefined) {
//       return normalizeParams(input.parameters);
//     }
//     return input;
//   }

//   return {};
// }