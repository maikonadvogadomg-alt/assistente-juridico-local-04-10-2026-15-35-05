import "./env"; // primeiro de tudo: lê o .env
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupWeb } from "./web";
import { createServer } from "http";

// Sessão (login) guardada na memória do próprio programa — antes precisava do Postgres.
const MemoryStore = createMemoryStore(session);

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
  }
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "60mb" }));

app.set("trust proxy", 1);

app.use(session({
  store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
  secret: process.env.SESSION_SECRET || "assistente-juridico-local",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    // Antes era "true": o login nunca ficava salvo em http://localhost.
    // "auto" = seguro só quando o endereço é https.
    secure: "auto",
  },
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("pt-BR", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  await setupWeb(app, httpServer);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") console.error(`\n  ⚠ A porta ${port} já está em uso. Talvez o app já esteja aberto em http://localhost:${port}\n`);
    else console.error(err);
    process.exit(1);
  });
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log(`\n  ✅ Assistente Jurídico ligado em  http://localhost:${port}\n  (deixe esta janela aberta; para desligar, feche-a ou aperte Ctrl+C)\n`);
  });
})();
