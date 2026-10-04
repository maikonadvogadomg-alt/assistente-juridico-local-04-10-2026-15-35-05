/**
 * Banco de dados LOCAL — antes era Postgres na nuvem (Neon/Replit), com
 * DATABASE_URL e senha. Agora é o mesmo Postgres, mas rodando dentro do
 * próprio programa (PGlite) e guardado na pasta  dados/banco .
 * Sem internet, sem senha, sem conta. Copie a pasta "dados" para fazer backup.
 */
import path from "path";
import fs from "fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "dados"));
const DB_DIR = path.join(DATA_DIR, "banco");
fs.mkdirSync(DB_DIR, { recursive: true });

export const pglite = new PGlite(DB_DIR);

// Cria as tabelas que faltarem (não apaga nada). Espelha shared/schema.ts.
await pglite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL
);
CREATE TABLE IF NOT EXISTS snippets (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  html text NOT NULL DEFAULT '',
  css text NOT NULL DEFAULT '',
  js text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'html',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS custom_actions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  prompt text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ementas (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Geral',
  texto text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_history (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  input_preview text NOT NULL DEFAULT '',
  result text NOT NULL,
  model text DEFAULT '',
  provider text DEFAULT '',
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  estimated_cost real DEFAULT 0,
  chat_history jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prompt_templates (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Geral',
  texto text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS doc_templates (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Geral',
  conteudo text NOT NULL,
  docx_base64 text,
  docx_filename text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shared_pareceres (
  id varchar PRIMARY KEY,
  html text NOT NULL,
  processo text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS processos_monitorados (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  tribunal text NOT NULL,
  apelido text NOT NULL DEFAULT '',
  classe text NOT NULL DEFAULT '',
  orgao_julgador text NOT NULL DEFAULT '',
  data_ajuizamento text NOT NULL DEFAULT '',
  ultima_movimentacao text NOT NULL DEFAULT '',
  ultima_movimentacao_data text NOT NULL DEFAULT '',
  assuntos text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tramitacao_publicacoes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  ext_id text NOT NULL UNIQUE,
  idempotency_key text,
  numero_processo text NOT NULL DEFAULT '',
  numero_processo_mascara text NOT NULL DEFAULT '',
  tribunal text NOT NULL DEFAULT '',
  orgao text NOT NULL DEFAULT '',
  classe text NOT NULL DEFAULT '',
  texto text NOT NULL DEFAULT '',
  disponibilizacao_date text NOT NULL DEFAULT '',
  publicacao_date text NOT NULL DEFAULT '',
  inicio_prazo_date text NOT NULL DEFAULT '',
  link_tramitacao text NOT NULL DEFAULT '',
  link_tribunal text NOT NULL DEFAULT '',
  destinatarios text NOT NULL DEFAULT '[]',
  advogados text NOT NULL DEFAULT '[]',
  lida text NOT NULL DEFAULT 'nao',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS djen_clientes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  email text NOT NULL DEFAULT '',
  tratamento text NOT NULL DEFAULT '',
  nome_caso text NOT NULL DEFAULT '',
  numero_processo text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS djen_publicacoes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id text NOT NULL DEFAULT '',
  numero_processo text NOT NULL,
  texto text NOT NULL DEFAULT '',
  inicio_sessao text NOT NULL DEFAULT '',
  fim_sessao text NOT NULL DEFAULT '',
  prazo_oral text NOT NULL DEFAULT '',
  link_documento text NOT NULL DEFAULT '',
  cliente_id text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL DEFAULT '',
  email_status text NOT NULL DEFAULT 'nao_enviado',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS djen_execucoes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'executando',
  total_publicacoes text NOT NULL DEFAULT '0',
  processadas text NOT NULL DEFAULT '0',
  com_erro text NOT NULL DEFAULT '0',
  ignoradas text NOT NULL DEFAULT '0',
  log text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS conversations (
  id serial PRIMARY KEY,
  title text NOT NULL DEFAULT 'Nova Conversa',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  conversation_id integer NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
`);

export const db = drizzle(pglite);
