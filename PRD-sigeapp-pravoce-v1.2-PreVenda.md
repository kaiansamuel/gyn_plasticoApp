# PRD SigeApp PraVocê v1.2 — Fluxo de Pré-venda no Aplicativo

## 1. Escopo deste documento

Este PRD aplica-se **somente ao aplicativo do cliente**:

```text
/home/kaian/projetos/claude/sigeapp-pravoce
```

Stack atual:

- React
- Vite
- Capacitor
- Android

A API/backend está no projeto separado:

```text
/home/kaian/projetos/claude/sigeApp
```

Este PRD não autoriza o aplicativo a acessar o PostgreSQL diretamente.

---

## 2. Objetivo

Adicionar ao aplicativo um fluxo para o vendedor criar uma **pré-venda**.

A pré-venda será enviada para a API NestJS.

Fluxo:

```text
Aplicativo
   ↓
API NestJS
   ↓
PostgreSQL / SIGE
   ↓
Pré-venda aparece no SIGE desktop
   ↓
Usuário do ERP transforma em pedido de venda
```

O aplicativo nunca grava diretamente em banco.

---

## 3. Dependência da API

O frontend só deve ser integrado à criação real quando existir na API:

```http
POST /api/v1/pre-vendas
```

Não duplicar regras do banco no frontend.

A API será responsável por:

- validar filial;
- validar vendedor;
- gerar número;
- validar cliente;
- validar produtos;
- gravar capa;
- gravar itens;
- garantir transação;
- impedir duplicidade.

---

## 4. Regra de filial

A filial continua definida no login/sessão.

O aplicativo não deve oferecer troca livre de filial dentro da criação da pré-venda.

A filial utilizada será a mesma da sessão autenticada.

---

## 5. Regra de vendedor

### Usuário com `CD_VENDEDOR > 0`

- não mostrar seletor para trocar vendedor;
- utilizar o vendedor vinculado ao usuário autenticado.

### Usuário com `CD_VENDEDOR = 0`

- permitir selecionar vendedor;
- carregar opções permitidas pela API;
- enviar o vendedor escolhido para validação no backend.

O frontend não decide permissão; apenas reflete a regra retornada pela API.

---

## 6. Entrada para criar pré-venda

Adicionar uma ação clara no aplicativo:

```text
Nova pré-venda
```

Pode ser:

- botão no módulo de Vendas;
- FAB;
- ação destacada no dashboard.

Usar o padrão visual atual do aplicativo.

Não redesenhar o app inteiro.

---

## 7. Fluxo de telas

O fluxo deve ser simples e adequado ao uso por vendedor em celular.

### Etapa 1 — Cliente

Permitir:

- pesquisar cliente;
- visualizar nome;
- visualizar código;
- selecionar um cliente.

Não permitir prosseguir sem cliente.

### Etapa 2 — Condições

Permitir:

- forma de pagamento;
- parcela quando aplicável;
- vendedor apenas quando a regra permitir;
- observação opcional.

### Etapa 3 — Produtos

Permitir:

- pesquisar produto;
- selecionar produto;
- informar quantidade;
- visualizar/informar valor unitário conforme regra atual da API;
- visualizar valor bruto;
- desconto quando permitido;
- visualizar valor total do item;
- adicionar item.

### Etapa 4 — Carrinho / itens

Mostrar:

- produto;
- quantidade;
- valor unitário;
- desconto;
- valor total;
- editar item;
- remover item antes do envio.

A remoção aqui é apenas estado local do formulário.

Não significa `DELETE` no banco.

### Etapa 5 — Revisão

Antes do envio mostrar:

- cliente;
- vendedor;
- filial;
- forma de pagamento;
- itens;
- quantidade total;
- valor dos produtos;
- desconto;
- valor final;
- observação.

Botão:

```text
Enviar pré-venda
```

### Etapa 6 — Sucesso

Após resposta `201` da API mostrar:

```text
Pré-venda criada com sucesso
Número: XXXXX
```

Oferecer:

- voltar para Vendas;
- criar nova pré-venda.

---

## 8. Contrato conceitual

O app deve usar o contrato compartilhado/API definido pelo backend.

Conceitualmente enviará:

```json
{
  "clienteCodigo": 0,
  "clienteDescricao": "",
  "formaPagamentoCodigo": 0,
  "parcelaCodigo": 0,
  "data": "YYYY-MM-DD",
  "hora": "HH:mm",
  "observacao": "",
  "valorProdutos": 0,
  "valorDesconto": 0,
  "valorTotal": 0,
  "vendedorCodigo": 0,
  "itens": [
    {
      "produtoCodigo": 0,
      "sequencia": 1,
      "descricao": "",
      "quantidade": 0,
      "valorUnitario": 0,
      "valorTotal": 0,
      "percentualDesconto": 0
    }
  ]
}
```

Não inventar campos adicionais sem necessidade.

---

## 9. Cálculos no frontend

O frontend pode calcular valores para feedback visual:

```text
subtotal item = quantidade × valor unitário
subtotal geral = soma dos itens
total = subtotal - desconto
```

Mas:

- a API continua sendo autoridade final;
- a API deve validar todos os valores;
- não confiar no total enviado pelo frontend sem validação.

---

## 10. Proteção contra envio duplicado

Obrigatório:

- ao tocar em `Enviar pré-venda`, desabilitar imediatamente o botão;
- mostrar loading;
- impedir duplo toque;
- não reenviar automaticamente em timeout;
- trabalhar com o mecanismo de idempotência definido pela API;
- se houver dúvida sobre resultado de timeout, consultar/confirmar antes de criar outra pré-venda.

---

## 11. Estados de erro

Tratar de forma amigável:

- cliente inválido;
- produto inválido;
- vendedor não permitido;
- forma de pagamento inválida;
- sessão expirada;
- API indisponível;
- gravação temporariamente desabilitada;
- erro de validação;
- timeout;
- conflito/duplicidade.

Não mostrar:

- SQL;
- stack trace;
- detalhes internos da API.

---

## 12. Segurança

O aplicativo:

- nunca recebe credenciais do PostgreSQL;
- nunca acessa `ADMCAO`, `CAPAORC` ou `ITEMORC` diretamente;
- nunca executa SQL;
- nunca conhece senha de banco;
- usa apenas HTTP/HTTPS contra a API.

---

## 13. Integração com módulos atuais

Preservar:

- login;
- seleção de filial;
- dashboard;
- vendas;
- filtro de `FLG_PEDIDO`;
- regra de vendedor;
- clientes;
- estoques;
- contas a receber;
- Capacitor;
- Android.

Não regredir funcionalidades já validadas.

---

## 14. Vendas existentes

A criação de pré-venda é nova funcionalidade.

Não confundir:

- lista de vendas/pedidos (`PEDISAID`);
- pré-venda (`CAPAORC` + `ITEMORC`).

A tela de Vendas existente continua mostrando os pedidos conforme os filtros já implementados.

A nova pré-venda pode ser acessada a partir do módulo de Vendas, mas deve ter fluxo próprio.

---

## 15. API URL

Durante desenvolvimento, usar configuração por ambiente.

Exemplo:

```env
VITE_API_URL=http://g5.no-ip.info:3000/api/v1
```

Para APK de homologação/produção, usar a URL pública oficial da API.

Não gravar IP local fixo diretamente no código fonte.

---

## 16. Android / Capacitor

Preservar a configuração Capacitor atual.

Não gerar APK antes que:

1. backend esteja implementado;
2. endpoint esteja testado;
3. uma pré-venda real tenha sido homologada;
4. frontend esteja integrado;
5. fluxo funcione no navegador.

Somente depois:

- `vite build`;
- `cap sync android`;
- build do APK.

---

## 17. Testes do frontend

Obrigatórios:

- fluxo sem cliente;
- fluxo sem itens;
- quantidade zero;
- cálculo de item;
- cálculo total;
- regra vendedor fixo;
- regra gerente selecionando vendedor;
- bloqueio de duplo envio;
- loading;
- sucesso;
- erros da API;
- sessão expirada;
- build;
- lint;
- typecheck;
- testes existentes.

---

## 18. Ordem de execução

### Marco 1 — Auditoria

Primeiro:

- ler o projeto `sigeapp-pravoce`;
- mapear telas, rotas, services, auth e contratos;
- identificar onde a ação `Nova pré-venda` se encaixa;
- verificar como o app consome a API;
- verificar regra atual de usuário/vendedor;
- não alterar código;
- apresentar plano e parar.

### Marco 2 — Estrutura visual

Após autorização:

- criar fluxo/telas;
- estado local;
- busca de cliente;
- busca de produto;
- itens;
- revisão;
- sem enviar gravação real ainda.

### Marco 3 — Integração

Somente após backend pronto:

- integrar `POST /pre-vendas`;
- tratamento de erros;
- idempotência;
- estados de loading;
- sucesso.

### Marco 4 — Homologação

- rodar no navegador;
- testar com API real;
- criar uma pré-venda controlada;
- validar junto ao SIGE desktop.

### Marco 5 — APK

Somente após homologação:

- build;
- Capacitor sync;
- APK;
- teste em celular físico.

---

## 19. Alterações permitidas neste repositório

O Codex pode alterar:

- `src/**`;
- testes;
- configuração de ambiente frontend;
- arquivos necessários do Vite;
- configuração Capacitor apenas quando chegar à fase de APK.

Não alterar:

- backend `sigeApp`;
- credenciais de banco;
- SQL;
- regras internas das tabelas do ERP.

---

## 20. Restrições finais

O Codex deve obedecer:

- não acessar banco diretamente;
- não copiar lógica SQL para o frontend;
- não alterar API neste repositório;
- não gerar APK antes da homologação;
- não fazer commit automaticamente;
- não quebrar filtros e módulos existentes;
- não alterar design geral sem necessidade;
- em dúvida sobre regra de negócio, parar e perguntar.
