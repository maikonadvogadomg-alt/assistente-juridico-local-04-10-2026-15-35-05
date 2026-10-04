// Lê o arquivo .env (se existir) ANTES de tudo. É onde ficam as chaves
// (senha do app, chaves de IA, DataJud…). Veja o .env.exemplo.
import path from "path";
import fs from "fs";

const file = path.resolve(process.cwd(), ".env");
if (fs.existsSync(file)) {
  try {
    (process as any).loadEnvFile(file);
  } catch {
    // Node mais antigo: lê na mão (CHAVE=valor por linha)
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}
if (process.argv.includes("--producao")) process.env.NODE_ENV = "production";
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
