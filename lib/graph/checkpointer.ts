// LangGraph Checkpointer Configuration
// Uses Supabase Postgres for persistence

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

export function createCheckpointer(): PostgresSaver {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return PostgresSaver.fromConnString(databaseUrl);
}
