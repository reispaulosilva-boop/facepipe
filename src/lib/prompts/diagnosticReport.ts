import type { Thirds, LipRatio, TopographicRegion, AnalysisResults } from "@/types";

interface ReportPromptParams {
  thirds: Thirds;
  lipRatio: LipRatio | null;
  topographicRegions: TopographicRegion[];
  analysisResults: AnalysisResults;
  patientGender: string;
  patientAge: string | number | null;
  /** Tipo de análise selecionado pelo usuário (acne, melasma, poros, etc.) */
  analysisType: string;
}

export function buildDiagnosticReportPrompt(p: ReportPromptParams): string {
  const { thirds, lipRatio, topographicRegions, analysisResults, patientGender, patientAge } = p;

  return `Você é um dermatologista especialista em harmonização facial com domínio da técnica AB Face (Braz, 2020) e sólida base em visagismo clínico.

## DADOS DO PACIENTE
- Gênero: ${patientGender}
- Idade: ${patientAge ?? "Não informada"}

## MÉTRICAS FACIAIS (MediaPipe — 478 landmarks)

**Terços Verticais:**
- Superior: ${thirds.upperThird.mm} mm
- Médio: ${thirds.middleThird.mm} mm
- Inferior: ${thirds.lowerThird.mm} mm
- Equilíbrio: ${evaluateThirds(thirds)}

**Proporção Labial:**
- Lábio superior: ${lipRatio?.superiorMm ?? "N/D"} mm
- Lábio inferior: ${lipRatio?.inferiorMm ?? "N/D"} mm
- Razão superior:inferior = 1:${lipRatio?.ratio ?? "N/D"} (ideal: 1:1.6)

**Morfologia:**
- Formato facial: ${analysisResults.morphology}

**Regiões Topográficas:** ${topographicRegions?.map(r => r.name).join(", ") ?? "N/D"}

## INSTRUÇÕES

Analise os dados acima em conjunto com a imagem facial fornecida. Gere um laudo clínico estruturado em Markdown, usando exatamente esta hierarquia:

### 1. Análise Morfológica
Descreva o formato facial e suas implicações estéticas e clínicas.

### 2. Análise de Proporções
Avalie os terços verticais (equilíbrio, desvios) e a proporção labial. Sinalize desvios clinicamente relevantes (>10% de diferença entre terços; razão labial <1:1.3 ou >1:2).

### 3. Diagnóstico Estético
Síntese em 3–5 pontos clínicos objetivos: desvios prioritários, regiões de maior impacto visual e classificação de envelhecimento facial predominante (volumétrico, gravitacional, dinâmico ou misto).

### 4. Plano de Tratamento Sugerido
Liste até 4 intervenções priorizadas por impacto, com justificativa clínica baseada nas métricas. Especifique região anatômica e objetivo funcional de cada intervenção. Não mencione marcas ou produtos específicos.

## REGRAS
- Tom clínico e técnico, adequado a prontuário médico
- Markdown limpo: use ###, **, e listas com -
- Não repita os dados brutos das métricas — interprete-os
- Se a imagem tiver baixa qualidade ou ângulo inadequado, sinalize no início do laudo
- Extensão: 350–550 palavras`;
}

function evaluateThirds(thirds: Thirds): string {
  const values = [thirds.upperThird.mm, thirds.middleThird.mm, thirds.lowerThird.mm];
  const avg = values.reduce((a, b) => a + b, 0) / 3;
  const maxDev = Math.max(...values.map(v => Math.abs(v - avg) / avg * 100));
  if (maxDev < 10) return "Equilibrado (<10% desvio)";
  if (maxDev < 20) return `Desvio leve (${maxDev.toFixed(0)}%)`;
  return `Desvio acentuado (${maxDev.toFixed(0)}%)`;
}
