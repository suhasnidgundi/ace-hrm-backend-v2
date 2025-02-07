import morgan from "morgan";
import { morganStream } from "../config/logger.js";

// Custom Morgan token for request body
morgan.token("body", (req) => JSON.stringify(req.body));

// Custom Morgan format
const morganFormat =
  process.env.NODE_ENV === "production"
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
    : ":method :url :status :response-time ms - :res[content-length] :body";

export const requestLogger = morgan(morganFormat, { stream: morganStream });
