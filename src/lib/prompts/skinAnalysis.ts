export interface SkinAnalysisOverlayPoint {
  x: number;        // center x, normalized [0,1]
  y: number;        // center y, normalized [0,1]
  label: string;    // e.g. "pustula", "papula", "comedao_aberto", "comedao_fechado"
  severity: "leve" | "moderada" | "intensa";
}

export interface SkinAnalysisOverlayRegion {
  label: string;
  x: number;        // center x, normalized [0,1]
  y: number;        // center y, normalized [0,1]
  w: number;        // width, normalized [0,1]
  h: number;        // height, normalized [0,1]
  intensity: number; // 0.0–1.0
}

export interface SkinAnalysisResult {
  analysis: {
    summary: string;
    severity: "leve" | "moderada" | "intensa";
    findings: string[];
  };
  overlay: {
    regions: SkinAnalysisOverlayRegion[];
    points: SkinAnalysisOverlayPoint[];
  };
}

export const SKIN_ANALYSIS_TYPES = new Set([
  "acne", "melasma", "poros", "oleosidade", "vermelhidao", "rugas", "flacidez",
]);

export const SKIN_ANALYSIS_LABELS: Record<string, string> = {
  acne:        "Acne",
  melasma:     "Melasma",
  poros:       "Poros Dilatados",
  oleosidade:  "Oleosidade",
  vermelhidao: "Vermelhidão",
  rugas:       "Rugas e Linhas",
  flacidez:    "Flacidez",
};

const JSON_SCHEMA_INSTRUCTION = `
Você também atua como Ilustrador Médico Digital e Designer de Visualização. Siga estas regras de composição visual antes de retornar o JSON:

REGRAS DE COMPOSIÇÃO:
- Limite points a no máximo 12 lesões individuais. Se houver mais, agrupe as próximas em uma region
- Lesões com centro a menos de 4% de distância entre si devem ser agrupadas em uma region, não listadas como points individuais
- Distribua as regions para cobrir as zonas de maior densidade com bounding boxes precisas e não sobrepostas
- Use points apenas para lesões isoladas clinicamente relevantes — não polua a face com dezenas de marcadores
- Posicione x,y de cada point no centro geométrico exato da lesão, não aproximado
- Para regions, x,y devem apontar para o centróide real da área afetada

Retorne SOMENTE JSON válido neste formato exato, sem markdown, sem texto adicional:
{
  "analysis": {
    "summary": "descrição clínica objetiva em 2-3 frases",
    "severity": "leve",
    "findings": ["achado clínico 1", "achado clínico 2"]
  },
  "overlay": {
    "regions": [
      {"label": "nome_regiao", "x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0, "intensity": 0.0}
    ],
    "points": [
      {"x": 0.0, "y": 0.0, "label": "tipo_lesao", "severity": "leve"}
    ]
  }
}

Regras do schema:
- severity deve ser exatamente "leve", "moderada" ou "intensa"
- x, y = coordenadas do centro, normalizadas [0,1] relativas à largura/altura da imagem
- w, h = dimensões da bounding box, normalizadas [0,1]
- intensity = concentração/gravidade da região, valor entre 0.0 e 1.0
- label deve usar snake_case sem espaços (ex: "zona_malar", "pustula", "sulco_nasogeniano")
- Se não houver achados visíveis, retorne arrays vazios para regions e points
- Não inclua comentários ou campos extras no JSON`;

export function buildSkinAnalysisPrompt(analysisType: string): string {
  switch (analysisType) {
    case "acne":        return buildAcnePrompt();
    case "melasma":     return buildMelasmaPrompt();
    case "poros":       return buildPorosPrompt();
    case "oleosidade":  return buildOleosidadePrompt();
    case "vermelhidao": return buildVermelhidaoPrompt();
    case "rugas":       return buildRugasPrompt();
    case "flacidez":    return buildFlacidezPrompt();
    default:
      return buildGenericPrompt(SKIN_ANALYSIS_LABELS[analysisType] ?? analysisType);
  }
}

function buildAcnePrompt(): string {
  return `Você é um Dermatologista de Precisão e Ilustrador Médico.
  
Sua tarefa é realizar uma análise de ACNE com RIGOR ANATÔMICO ABSOLUTO.

INSTRUÇÕES CRÍTICAS:
1. FOCO FACIAL: Analise APENAS a face. Ignore pescoço, colo, peito, cabelos e fundo.
2. PRECISÃO DE LOCALIZAÇÃO: Identifique pápulas, pústulas (inflamatórias) e comedões (não-inflamatórios).
3. MAPEAMENTO GEOMÉTRICO: Posicione os pontos exatamente sobre as lesões na face.
4. FILTRO DE RUÍDO: Se a imagem tiver sombras ou artefatos que não sejam acne, NÃO os marque. É melhor omitir do que alucinar.

Identifique e localize:
- Pápulas e pústulas (label: "pustula" ou "papula")
- Comedões (label: "comedao_aberto" ou "comedao_fechado")
- Regiões de alta densidade (regions)

${JSON_SCHEMA_INSTRUCTION}`;
}

function buildMelasmaPrompt(): string {
  return `Você é um Dermatologista Especialista em Hiperpigmentação e Ilustrador Médico.

Sua tarefa é realizar uma análise de MELASMA e HPI (Hiperpigmentação Pós-Inflamatória) com RIGOR ANATÔMICO ABSOLUTO.

INSTRUÇÕES CRÍTICAS:
1. FOCO FACIAL: Analise APENAS a face. Ignore pescoço, colo e fundo.
2. PRECISÃO DE MANCHAS: Identifique áreas de melasma (geralmente simétricas em bochechas, testa e buço) e manchas de HPI.
3. MAPEAMENTO GEOMÉTRICO: Use 'regions' para áreas extensas e 'points' apenas para manchas isoladas e muito nítidas.
4. INTENSIDADE: O campo 'intensity' (0.0 a 1.0) deve refletir o contraste da mancha em relação à pele sã.
5. FILTRO DE SOMBRAS: NÃO confunda sombras naturais do rosto (ex: sulcos, contorno da mandíbula) com melasma.

Identifique e localize:
- Manchas de Melasma (label: "melasma")
- Hiperpigmentação Pós-Inflamatória (label: "hpi")
- Efélides ou sardas (label: "efelides")

${JSON_SCHEMA_INSTRUCTION}`;
}

function buildPorosPrompt(): string {
  return `Você é um Dermatologista Especialista em Textura Cutânea e Ilustrador Médico.

Sua tarefa é realizar uma análise de POROS DILATADOS e TEXTURA IRREGULAR com RIGOR ANATÔMICO ABSOLUTO.

INSTRUÇÕES CRÍTICAS:
1. FOCO FACIAL: Analise APENAS a face. Ignore pescoço, colo e fundo.
2. PRECISÃO DE TEXTURA: Identifique áreas com poros dilatados (comum em zona T e bochechas internas) e textura de "casca de laranja".
3. MAPEAMENTO GEOMÉTRICO: Use 'regions' para áreas extensas de poros dilatados e 'points' APENAS para poros individuais extremamente proeminentes ou comedões abertos muito visíveis.
4. INTENSIDADE: O campo 'intensity' (0.0 a 1.0) deve refletir o grau de dilatação e irregularidade da textura.
5. FILTRO DE RUÍDO: NÃO confunda o grão natural da pele ou ruído digital da imagem com poros dilatados.

Identifique e localize:
- Poros Dilatados (label: "poros_dilatados")
- Textura Irregular (label: "textura_irregular")
- Poros proeminentes individuais (label: "poro")

${JSON_SCHEMA_INSTRUCTION}`;
}

function buildOleosidadePrompt(): string {
  return `Você é um Dermatologista Especialista em Análise Sebácea e Ilustrador Médico.

Sua tarefa é realizar uma análise de OLEOSIDADE e BRILHO EXCESSIVO com RIGOR ANATÔMICO ABSOLUTO.

INSTRUÇÕES CRÍTICAS:
1. FOCO FACIAL: Analise APENAS a face. Ignore pescoço, colo e fundo.
2. PRECISÃO DE BRILHO: Diferencie o "brilho saudável" (luminosidade natural) da "oleosidade excessiva" (brilho sebáceo).
3. MAPEAMENTO GEOMÉTRICO: Use 'regions' para as Zonas T (testa, nariz, queixo) e áreas malares com brilho.
4. INTENSIDADE: O campo 'intensity' (0.0 a 1.0) deve refletir o grau de brilho sebáceo visível.
5. FILTRO DE LUZ: NÃO confunda o reflexo direto de luzes de estúdio (highlights) com oleosidade da pele.

Identifique e localize:
- Zona T Oleosa (label: "zona_t_oleosa")
- Região Malar Oleosa (label: "malar_oleoso")
- Brilho Perioral (label: "brilho_perioral")

${JSON_SCHEMA_INSTRUCTION}`;
}

function buildVermelhidaoPrompt(): string {
  return `Você é um Dermatologista Especialista em Patologias Vasculares e Ilustrador Médico.

Sua tarefa é realizar uma análise de VERMELHIDÃO, ERITEMA e ROSÁCEA com RIGOR ANATÔMICO ABSOLUTO.

INSTRUÇÕES CRÍTICAS:
1. FOCO FACIAL: Analise APENAS a face. Ignore pescoço, colo e fundo.
2. PRECISÃO VASCULAR: Identifique áreas de eritema difuso (em bochechas e nariz) e vasos dilatados (telangiectasias).
3. MAPEAMENTO GEOMÉTRICO: Use 'regions' para áreas extensas de vermelhidão e 'points' para vasos isolados ou manchas eritematosas pontuais.
4. INTENSIDADE: O campo 'intensity' (0.0 a 1.0) deve refletir o grau de vermelhidão visível.
5. FILTRO DE ARTEFATOS: NÃO confunda o rubor natural das bochechas (blush) ou reflexos de luz com eritema patológico.

Identifique e localize:
- Eritema Difuso (label: "eritema")
- Telangiectasias (label: "telangectasia")
- Padrão de Rosácea (label: "rosacea")
- Mancha Eritematosa (label: "mancha_eritematosa")

${JSON_SCHEMA_INSTRUCTION}`;
}

function buildRugasPrompt(): string {
  return `Você é um Dermatologista Especialista em Rejuvenescimento Facial e Ilustrador Médico.

Sua tarefa é realizar uma análise de RUGAS e LINHAS DE EXPRESSÃO com RIGOR ANATÔMICO ABSOLUTO.

INSTRUÇÕES CRÍTICAS:
1. FOCO FACIAL: Analise APENAS a face. Ignore pescoço, colo e fundo.
2. PRECISÃO DE PROFUNDIDADE: Diferencie rugas estáticas (presentes em repouso) de linhas de expressão dinâmicas.
3. MAPEAMENTO GEOMÉTRICO: Use 'regions' para áreas extensas de rugas (testa, pés de galinha) e 'points' para rugas profundas isoladas.
4. INTENSIDADE: O campo 'intensity' (0.0 a 1.0) deve refletir a profundidade e visibilidade das rugas.
5. FILTRO DE LUZ: NÃO confunda sombras naturais do rosto (ex: contorno da mandíbula) com rugas, a menos que haja sulcos reais.

Identifique e localize:
- Rugas Frontais (label: "frontal")
- Linhas Periorbitais / Pés de galinha (label: "periorbital")
- Sulco Nasogeniano (label: "sulco_nasogeniano")
- Código de barras perilabial (label: "perilabial")
- Linhas de expressão (label: "linha_expressao")
- Rugas Estáticas Profundas (label: "ruga_estatica")

${JSON_SCHEMA_INSTRUCTION}`;
}

function buildFlacidezPrompt(): string {
  return `Você é um Dermatologista Especialista em Harmonização Facial e Sustentação Dérmica.

Sua tarefa é realizar uma análise de FLACIDEZ e PTOSE TECIDUAL com RIGOR ANATÔMICO ABSOLUTO.

INSTRUÇÕES CRÍTICAS:
1. FOCO FACIAL: Analise APENAS a face. Ignore pescoço, colo e fundo.
2. PRECISÃO DE SUSTENTAÇÃO: Identifique sinais de perda de volume e descida dos tecidos (vetores de queda).
3. MAPEAMENTO GEOMÉTRICO: Use 'regions' para áreas de ptose (malar, submandibular) e 'points' para sulcos específicos como o lacrimal.
4. INTENSIDADE: O campo 'intensity' (0.0 a 1.0) deve refletir o grau de ptose tecidual visível.
5. FILTRO DE POSIÇÃO: NÃO confunda a inclinação da cabeça ou sombras de iluminação com flacidez real.

Identifique e localize:
- Ptose Malar (label: "ptose_malar")
- Perda de Contorno Mandibular / Jowls (label: "mandibular")
- Sulco Lacrimal (label: "sulco_lacrimal")
- Descida Perioral (label: "perioral_ptose")
- Flacidez Submandibular (label: "submandibular")

${JSON_SCHEMA_INSTRUCTION}`;
}

function buildGenericPrompt(typeName: string): string {
  return `Você é um dermatologista expert em análise digital de pele.
Analise esta imagem facial com foco em: ${typeName}.
Identifique achados relevantes e mapeie regiões afetadas com coordenadas normalizadas [0,1].
${JSON_SCHEMA_INSTRUCTION}`;
}

/**
 * Formats a SkinAnalysisResult as a Markdown string suitable for DiagnosticReport.
 */
export function formatSkinAnalysisMarkdown(result: SkinAnalysisResult, type: string): string {
  const label = SKIN_ANALYSIS_LABELS[type] ?? type;
  const severityIcon: Record<string, string> = {
    leve: "🟢", moderada: "🟡", intensa: "🔴",
  };
  const icon = severityIcon[result.analysis.severity] ?? "⚪";
  const severityLabel = result.analysis.severity.charAt(0).toUpperCase() + result.analysis.severity.slice(1);

  const findingsBlock = result.analysis.findings.length > 0
    ? result.analysis.findings.map(f => `- ${f}`).join("\n")
    : "- Nenhum achado significativo identificado.";

  const overlayStats = [
    result.overlay.points.length > 0 && `${result.overlay.points.length} lesão(ões) mapeada(s)`,
    result.overlay.regions.length > 0 && `${result.overlay.regions.length} região(ões) identificada(s)`,
  ].filter(Boolean).join(" · ");

  return `### Análise de ${label}

**Severidade:** ${icon} ${severityLabel}

**Sumário Clínico:**
${result.analysis.summary}

**Achados:**
${findingsBlock}

---
*${overlayStats || "Sem lesões visíveis mapeadas"}*`;
}
