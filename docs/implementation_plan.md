# App Clínico Dermatológico (Facepipe) - Melhoria do VisageMed

Este é o plano de implementação para a criação do "Facepipe", um aplicativo web voltado à análise dermatológica e estética clínica (focado em procedimentos como botox, preenchimentos, lasers, etc.). 

## Objetivos e Restrições
- **Zero-Storage:** Nenhuma imagem do paciente será salva na nuvem. Todo o processamento deve ocorrer estritamente no dispositivo local do usuário (via navegador) por motivos de privacidade clínica.
- **Funcionalidades Core:** Upload/Captura da câmera, Análise através de Landmarks (MediaPipe), Geração de Laudo em PDF, e Download da foto.
- **Alvo da Etapa 1:** Apenas Upload de foto + Integração e renderização *perfeita* dos landmarks do MediaPipe no rosto do paciente.
- **Ambiente:** Next.js, deploy na Vercel e repositório no GitHub.

---

## 🏗️ Arquitetura Proposta

Para atingir alta performance no navegador sem backend, utilizaremos a seguinte stack:

1. **Framework:** **Next.js (App Router)** com React e TypeScript. É a combinação perfeita para fácil publicação na Vercel.
2. **Estilização e UI:** **Tailwind CSS** e **shadcn/ui** para componentes com visual Premium, minimalista e clínico.
3. **Visão Computacional:** **`@mediapipe/tasks-vision`**. Toda a inferência de Machine Learning rodará via WebAssembly e WebGL no próprio navegador, garantindo que a foto *nunca* saia do aparelho do médico.
4. **Canvas Draw:** O desenho das malhas faciais será via API `HTMLCanvasElement` em sincronia milimétrica com a imagem/vídeo.

---

## ⚙️ A Estratégia de Workflows

Abaixo estão as 3 fases desta primeira etapa do projeto e os **prompts exatos** a serem enviados em novas conversas.

#### 🚀 Etapa 1: Setup da Base e Design Clínico
**Seu Prompt para a Nova Conversa:**
> *"Por favor, leia o arquivo `docs/implementation_plan.md` para entender nossa arquitetura. Após isso, execute a Etapa 1: Crie uma nova aplicação Next.js nesta pasta atual substituindo tudo se necessário usando configurações recomendadas (App Router, Tailwind, TypeScript). Crie o shell do aplicativo clínico seguindo princípios de Glassmorphism e Dark Mode premium focados em UX médica. Remova as páginas padrão do Next.js e garanta que o app inicie perfeitamente."*

#### 📸 Etapa 2: Componente de Upload e Canvas
**Seu Prompt para a Nova Conversa:**
> *"Por favor, revise o nosso projeto até agora. Execute a Etapa 2 do nosso escopo: Construa um componente isolado para drag-and-drop de fotos focado na máxima resolução, usando Next.js. Garanta que a imagem carregada seja perfeitamente dimensionada utilizando uma tag Canvas oculta ou visível, sem perder o aspecto (aspect ratio) durante o redimensionamento da janela. O código precisa estar preparado para receber uma camada de desenho visual separada."*

#### 🤖 Etapa 3: Integração do MediaPipe Face Landmarker (Core)
**Seu Prompt para a Nova Conversa:**
> *"Por favor, execute a Etapa 3: Instale a biblioteca `@mediapipe/tasks-vision`. Crie o hook/servico local para detectar os landmarks de um rosto (Face Mesh). Quando fizermos o upload de uma foto no nosso componente, extraia as 478 coordenadas e desenhe a malha 3D por cima do Canvas original com altíssima precisão e cores premium (linhas finas para clínica). Certifique-se de que nenhum dado trafegue na rede."*
