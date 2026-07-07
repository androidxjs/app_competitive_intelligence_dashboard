import { createApiServer } from "./http.js";

const port = Number(process.env.PORT ?? 4310);
const server = createApiServer();

server.listen(port, () => {
  console.log(`App Competitive Intelligence API listening on http://localhost:${port}`);
});
