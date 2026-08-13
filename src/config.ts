const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export function getApiUrl(): string {
  if (!configuredApiUrl) {
    throw new Error(
      'A URL da API não foi configurada. Defina VITE_API_URL antes de iniciar o aplicativo.',
    );
  }

  return configuredApiUrl.replace(/\/$/, '');
}
