# Futura Smart | Tecnologia NFC & Gestão de Placas

Aplicação moderna e minimalista desenvolvida para gerenciamento centralizado e **redirecionamento dinâmico** de plaquinhas físicas inteligentes (Acrílico com chip NFC e QR Code).

## 🔐 Credenciais de Administrador

* **E-mail:** `wluchesi@gmail.com`
* **Senha:** `C@n@l4141`
* **Perfil:** Administrador Principal (Super Admin)

---

## 👥 Modelo de Permissões e Acesso

1. **Administrador (`wluchesi@gmail.com`):**
   * Acesso completo e irrestrito ao sistema.
   * Visualiza **todas as placas** cadastradas de todos os usuários com identificação do proprietário.
   * Painel de Gestão de Usuários: pode criar novos usuários, alterar senhas, alternar permissões de administrador e excluir cadastros.
   * Pode criar placas vinculadas a qualquer cliente ou para si mesmo.

2. **Usuários Comuns (Novos Cadastros):**
   * Ao criar conta pelo botão **"Novo Cadastro"**, o sistema solicita:
     * **Nome Completo**
     * **E-mail**
     * **WhatsApp** (com link direto de contato no painel do administrador)
     * **Senha**
   * **Isolamento de Dados:** Cada usuário comum **só tem acesso às suas próprias placas e estatísticas**.
   * Não visualiza placas nem dados de nenhum outro cliente.
   * Não tem acesso ao menu de gerenciamento de usuários.

---

## 🚀 Como Executar o Sistema

Para iniciar o servidor local:

```bash
npm start
# ou em modo de desenvolvimento com auto-reload:
npm run dev
```

Abra no seu navegador: **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ Como Funciona o Redirecionamento Dinâmico

1. **URL Inteligente Única:**
   Cada placa física possui um identificador amigável (slug), por exemplo:
   * **Tag NFC gravada com:** `http://localhost:3000/r/barbearia-vintage?src=nfc`
   * **QR Code impresso com:** `http://localhost:3000/r/barbearia-vintage?src=qr`

2. **Troca de Link Sem Regravar a Placa:**
   Se o estabelecimento mudar de endereço do Google, quiser direcionar para o Instagram ou para um cardápio sazonal, você altera a URL de destino diretamente no painel. **A plaquinha física na mesa do cliente passa a redirecionar para o novo destino instantaneamente**, sem custo de nova placa.

3. **Métricas e Auditoria Automática:**
   O motor intercepta o acesso em menos de 15 milissegundos via HTTP 302, identifica o dispositivo (iPhone, Android, Desktop), a fonte (NFC vs QR Code) e registra nos gráficos em tempo real antes de enviar o cliente para a página final.

---

## 🛠️ Recursos Integrados no Painel

* **Painel HUD em Dark Glassmorphism:** Métricas de placas ativas, total de acessos, % de adesão NFC vs QR Code e acessos de hoje.
* **Estúdio de Produção de Placas:**
  * **Mockup 3D Interativo:** Simula a placa física de acrílico Black Piano com bordas douradas e QR Code central.
  * **Exportação Gráfica:** Download do QR Code em **PNG Alta Resolução** e **SVG Vetorial** para envio direto à gráfica.
  * **Guia de Gravação NFC:** URL formatada pronta com botão de cópia em 1 clique e passo a passo para o aplicativo gratuito *NFC Tools*.
* **Status Ativo / Pausa:** Switch liga/desliga instantâneo para pausar redirecionamentos com tela amigável para o cliente.
* **Filtros e Busca em Tempo Real:** Pesquise por estabelecimento, local (balcão/mesa) ou filtre por tipo (Google, Instagram, WhatsApp, Cardápio).
* **Logs ao Vivo:** Gaveta lateral com feed de auditoria de acessos em tempo real e distribuição por aparelhos.
