# Relatório de Auditoria Técnica e Estratégica: FacePipe

**Data:** 19 de Abril de 2026
**Autor:** Manus AI
**Destinatário:** Dr. Paulo (Clube Pele Segura / FacePipe)

## 1. Visão Executiva e Diagnóstico Geral

A auditoria do repositório FacePipe revela um produto com uma fundação conceitual brilhante: o compromisso com o processamento local (Zero-Storage) e a tradução direta de protocolos clínicos (AB Face, proporções de beleza) para código determinístico. O design system (Glassmorphism, Dark Clinical Mode) é coeso e transmite alta autoridade.

No entanto, o projeto encontra-se em um ponto de inflexão crítico. A base de código apresenta sinais claros de "acúmulo de funcionalidades" (*feature creep*), acoplamento excessivo em componentes-chave e relaxamento de políticas de tipagem (TypeScript) que podem comprometer a escalabilidade e a segurança clínica a médio prazo [1].

## 2. Análise Arquitetural e Qualidade de Código

### 2.1. O Gargalo do `LightTable.tsx` e `Toolbox.tsx`
O componente `LightTable.tsx` [2] assumiu responsabilidades demais. Ele gerencia o carregamento da imagem, o estado do pan/zoom, o cálculo em tempo real de dezenas de métricas biométricas (terços, quintos, distâncias) e a renderização de múltiplas camadas SVG.
*   **Problema:** Alta complexidade ciclomática e risco de re-renderizações excessivas. O `Toolbox.tsx` [3] repassa mais de 50 *props* para o `LightTable.tsx`, caracterizando um forte *prop drilling*.
*   **Recomendação:** Extrair os cálculos geométricos para um *custom hook* (ex: `useFacialMetrics`) que consuma o `useFaceStore`. O `LightTable` deve ser estritamente uma camada de apresentação (View).

### 2.2. Tipagem Relaxada e Risco Clínico
A configuração atual do Next.js (`next.config.ts`) possui a flag `ignoreBuildErrors: true` para o TypeScript [4]. Além disso, existem múltiplos usos de `any` (ex: `landmarks: any[]` no Zustand store e em props) [5] [6].
*   **Risco:** Em software de saúde, ignorar erros de tipagem pode levar a falhas silenciosas em cálculos geométricos.
*   **Recomendação:** Remover imediatamente a flag `ignoreBuildErrors` e substituir todos os `any` pela interface `Landmark` já existente no `facialAnalysis.ts`.

### 2.3. Código Legado e Componentes Zumbis
Foi identificado o arquivo `ClinicalCanvas.tsx` [7], que duplica toda a lógica de carregamento de imagem e instanciação do MediaPipe presente no `ClinicalWorkspace.tsx`. Ele não é importado em nenhum lugar da árvore principal.
*   **Recomendação:** Deletar o arquivo `ClinicalCanvas.tsx` para reduzir a superfície de manutenção e evitar confusão em futuras implementações.

## 3. Auditoria do Motor Biométrico (`facialAnalysis.ts`)

O motor matemático é o coração do FacePipe. A implementação das fórmulas clínicas é excelente, mas encontrei um **bug crítico de lógica matemática**:

### 3.1. Bug na Função `calcMorphology`
Na linha 339 do arquivo `facialAnalysis.ts`, o cálculo da altura do rosto para determinar a morfologia (formato do rosto) está utilizando a largura da imagem como multiplicador, em vez da altura [8]:
```typescript
// Código Atual:
const height = verticalDistancePx(landmarks[10], landmarks[152], imageWidth); 

// Código Correto:
const height = verticalDistancePx(landmarks[10], landmarks[152], imageHeight);
```
*   **Impacto:** O formato do rosto será calculado incorretamente em qualquer foto que não seja um quadrado perfeito (1:1), afetando o diagnóstico automatizado.

### 3.2. Calibração da Íris
A calibração atual usa a íris esquerda (pontos 474 e 476) assumindo 11.7mm padrão. Isso é brilhante para estimativa rápida, mas a distorção de lente (perspectiva da câmera do celular) pode introduzir erros de até 10-15% em distâncias absolutas (bizigomática, bigonial).

## 4. Segurança, Performance e Memory Leaks

*   **Memory Leaks de ObjectURL:** No `ClinicalWorkspace.tsx` e `page.tsx`, o sistema cria URLs de objetos (`URL.createObjectURL`) para renderizar as imagens [9]. Embora haja um esforço de limpeza no `useEffect`, a troca rápida de fotos pode deixar URLs órfãs na memória do navegador, causando lentidão progressiva na aba do médico.
*   **Framer Motion Excessivo:** Existem 65 ocorrências de componentes animados (`motion.div`, `AnimatePresence`) [10]. No SVG do `LightTable`, animar opacidade e escala de centenas de pontos biométricos simultaneamente exige muito da CPU.
*   **Segurança:** O repositório contém um arquivo Jupyter Notebook (`Cópia_de_Get_started_interactions_api.ipynb`) [11]. A auditoria confirmou que **não há chaves reais expostas** (apenas placeholders `userdata.get`), mas a presença de notebooks no repositório de produção não é uma boa prática.

## 5. Oportunidades Estratégicas e Roadmap Priorizado

Para escalar o FacePipe com segurança e preparar o terreno para a integração do Gemini Nano Banana (Geração de Imagens e Envelhecimento), proponho o seguinte plano de ação:

### Sprint 1: Estabilidade e Segurança Clínica (Imediato)
1.  **Corrigir Bug Matemático:** Alterar `imageWidth` para `imageHeight` na função `calcMorphology`.
2.  **Blindagem de Tipos:** Remover `ignoreBuildErrors` do `next.config.ts` e resolver os erros de TypeScript resultantes.
3.  **Limpeza de Código:** Deletar `ClinicalCanvas.tsx` e o Jupyter Notebook.

### Sprint 2: Refatoração Arquitetural (Curto Prazo)
1.  **Desacoplamento do LightTable:** Extrair a lógica de cálculo geométrico para *selectors* do Zustand ou *hooks* puros, deixando o componente responsável apenas pelo SVG e Canvas.
2.  **Otimização de Performance:** Reduzir o uso de Framer Motion dentro das tags `<svg>`. Substituir transições de coordenadas por CSS simples onde possível.

### Sprint 3: Preparação para IA Generativa (Médio Prazo)
1.  **Componentes Mockados:** O `SkinQualityPanel.tsx` e o `FacialEvaluationPanel.tsx` atualmente possuem dados fixos (*mockados*). É necessário plugar a rota do Gemini para que esses painéis reflitam a análise real da imagem baseada na técnica AB Face.
2.  **Pipeline de Imagem:** Utilizar a base do `captureAnalysis.ts` (que já exporta a imagem mesclada em PNG) para criar o fluxo de envio da face recortada para a API do Gemini, visando as funcionalidades futuras de simulação de tratamentos e envelhecimento.

## Referências

[1] Auditoria de Código Fonte do repositório FacePipe.
[2] Repositório FacePipe: `src/components/analysis/LightTable.tsx`.
[3] Repositório FacePipe: `src/components/analysis/Toolbox.tsx`.
[4] Repositório FacePipe: `next.config.ts`.
[5] Repositório FacePipe: `src/store/useFaceStore.ts`.
[6] Repositório FacePipe: Busca de ocorrências do tipo `any` nos componentes.
[7] Repositório FacePipe: `src/components/ClinicalCanvas.tsx`.
[8] Repositório FacePipe: `src/utils/facialAnalysis.ts` (linha 339).
[9] Repositório FacePipe: `src/components/analysis/ClinicalWorkspace.tsx` (linhas 97, 106, 116).
[10] Repositório FacePipe: Busca por dependências do `framer-motion`.
[11] Repositório FacePipe: `Cópia_de_Get_started_interactions_api.ipynb`.
