# Gyn Plástico App

Aplicativo web e Android feito com React, Vite e Capacitor 8. A URL da API deve ser configurada em `VITE_API_URL`, incluindo o prefixo `/api/v1` (veja `.env.example`).

## Scanner de produtos

O scanner usa `@capacitor/barcode-scanner` 3.x, plugin mantido pelo time Ionic e compatível com Capacitor 8. No Android, o plugin exige `minSdkVersion 26`, configurado em `android/variables.gradle`. O app lê a string do código e a envia para `/estoques/resolver`; a pesquisa manual continua disponível caso o scanner não possa ser usado.

Após alterar dependências nativas, sincronize o projeto Android com `npx cap sync android`.
