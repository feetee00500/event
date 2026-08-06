declare global {
  interface CloudflareEnv {
    DATABASE_URL?: string;
    HYPERDRIVE?: { connectionString: string };
  }
}

export {};
