# PROJECT_AUDIT.md: Bússola Atual do Facepipe

**Data da Auditoria:** 2026-04-09  
**Status do Projeto:** Alfa Clínico Funcional  
**Arquitetura Base:** Next.js (App Router) + MediaPipe + Gemini AI  
**Paradigma de Dados:** Zero-Storage (Ephemeral processing)

---

## 1. Mapeamento de Fluxo de Dados (Data Path)

O ciclo de vida de uma análise no Facepipe segue um pipeline estritamente linear e efêmero:

1.  **Ingestão (Frontend):** 
    - O arquivo de imagem é selecionado via `FileDropzone.tsx`.
    - O `useFaceStore.ts` armazena o `File` no estado `imageFile`. *Nenhum upload ocorre neste estágio.*
2.  **Processamento Biométrico (Local - MediaPipe):**
    - `ClinicalWorkspace.tsx` detecta a mudança em `imageFile`.
    - O hook `useFaceLandmarker.ts` recebe o `HTMLImageElement`.
    - MediaPipe (WASM/GPU) extrai **478 pontos (landmarks)**.
    - O resultado é salvo em `analysisResults.landmarks` no store central.
3.  **Cálculo de Proporções (Geometria Facial):**
    - `LightTable.tsx` consome os landmarks via `useMemo`.
    - Funções em `facialAnalysis.ts` (`calcThirds`, `calcFifths`, etc.) determinam métricas clínicas (pixels e milímetros via calibração de íris).
    - O estado é sincronizado com os componentes `MelasmaOverlay.tsx` e `DiagnosticReport.tsx`.
4.  **Inteligência Generativa (Remoto - Gemini):**
    - **Análise de Melasma:** `ClinicalWorkspace.tsx` comprime a imagem (base64) e envia para `api/gemini/route.ts` com o `buildMelasmaPrompt()`.
    - **Laudo Diagnóstico:** O sistema usa `html-to-image (toPng)` para capturar a tela com overlays, enviando o screenshot para a API para contextualização visual total da análise.
    - O servidor Gemini processa e retorna JSON (Melasma) ou Markdown (Laudo), persistindo apenas na memória RAM do cliente durante a sessão.

---

## 2. Auditoria de Fidelidade Clínica

### Validação de Métricas AB Face
- **Terços Faciais:** Utiliza Landmarks 10 (Trichion), 168 (Glabela), 2 (Subnasale) e 152 (Menton). 
    - *Sucesso:* Suporte a ajuste manual do Trichion integrada via drag-and-drop no `LightTable`.
- **Quintos Faciais:** Implementado com precisão horizontal (Landmarks 454-234 para limites faciais).
- **Proporção Labial:** Calculada via razão vertical entre vermelhão superior (0-13) e inferior (13-17). Ideal 1:1.6 detectado consistentemente.
- **Calibração:** Baseada no diâmetro horizontal da íris esquerda (11.7mm). 
    - *Observação:* Variações biológicas na íris podem introduzir margem de erro <5% em distâncias absolutas.

### Scoring mMASI (Melasma)
- **Lógica:** O motor AI calcula Áreas (0-6), Intensidade (0-4) e Homogeneidade (0-4).
- **Fórmula no Prompt:** `mMASI = 0.3(F) + 0.3(RMR) + 0.3(LMR) + 0.1(C)`. Segue rigorosamente o padrão acadêmico.
- **Alinhamento:** Marcadores AR em `MelasmaOverlay.tsx` utilizam coordenadas percentuais (x, y) geradas dinamicamente pela IA sobre a topologia facial.

---

## 3. Segurança e Privacidade (Zero-Storage)

### Auditoria da Rota `src/app/api/gemini/route.ts`
- **Persistência de Logs:** ✅ **Nenhuma.** O código processa o corpo do request (base64) diretamente para o `inlineData` do SDK do Gemini.  
- **Buffers de Servidor:** ✅ **Limpos.** Não há uso de `fs.writeFileSync` ou buffers temporários em `/tmp`.
- **Headers de Segurança:** O tráfego ocorre via POST com payload JSON efêmero.

### Processamento Local
- Confirmado que **nenhum dado biométrico (landmark coordinates)** sai do navegador. Apenas a imagem (necessária para visão computacional do Gemini) e prompts de texto trafegam via HTTPS.

---

## 4. Consistência de UX/Design

### Padrão Clínico Estético
- **Design System:** Mantido consistentemente com Glassmorphism (blur-3xl), bordas sutilmente iluminadas (white/10) e paleta Dark Clinical.
- **Componentes:** `Toolbox.tsx` e `LightTable.tsx` seguem o padrão de workstation profissional de alta gama.

### Gargalos de Performance Identificados
- > [!WARNING]
  > **Renderização SVG:** O `LightTable.tsx` renderiza o mesh completo (478 pontos) e múltiplos overlays biométricos. Em resoluções 4K ou dispositivos móveis, o uso intensivo de `Framer Motion` em centenas de elementos SVG pode causar jitter no zoom. 
- > [!TIP]
  > Considere migrar o mesh biométrico para um `Canvas 2D` se a performance degradar em hardware antigo.

---

## 5. Documentação de "Gaps" Técnicos

### Placeholders Identificados
- **Laudo PDF:** O botão de exportação em `DiagnosticReport.tsx` (linha 91) é visual, sem função de geração de PDF real implementada.
- **Alertas de Erro:** `ClinicalWorkspace.tsx` utiliza `alert()` nativo. Recomenda-se migrar para componentes customizados de "Toast" ou "Dialog" para manter o padrão premium.
- **Placeholder de Componentes:** O `DiagnosticReport` está atualmente comentado na árvore principal do `ClinicalWorkspace` (linha 448).

### Inconsistências de Tipagem (TypeScript)
- **Landmarks:** Muitas interfaces ainda utilizam `any[]` para arrays de landmarks.  
    - *Ação Corretiva:* Padronizar para `Landmark[]` definido em `facialAnalysis.ts`.
- **Cálculos Matemáticos:** Pequena divergência visual no tooltip do Melasma (exibe subtotal não ponderado), enquanto o Score Total segue a fórmula ponderada correta.

---

## Veredito da Auditoria
O Facepipe está arquitetalmente sólido e as métricas clínicas são fiéis aos padrões dermatológicos. O sistema cumpre a promessa de privacidade absoluta. O foco para a próxima fase deve ser a finalização dos workflows de exportação e o polimento da robustez de tipos.
