/**
 * Placeholder for Supabase's generated database types.
 *
 * Once tables exist, generate the real types with the Supabase CLI:
 *
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 *
 * Until then this keeps `Database` importable everywhere the Supabase
 * clients need a generic, without hard-coding any schema.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
