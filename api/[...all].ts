// Catch-all API function for Vercel: every /api/* hits your Express app
import app from '../server/index.js'; // HUOM. .js-pääte ESM:ää varten
console.log("At api/[...all].ts");
export default app;