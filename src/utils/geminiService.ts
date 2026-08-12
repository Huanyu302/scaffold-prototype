import { GoogleGenerativeAI } from '@google/generative-ai';

// Retrieve secure client token from environment bindings
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("VITE_GEMINI_API_KEY is not defined in your environment configs. Falling back to structured dry-run simulation mode.");
}

export interface SubScoreItem {
  dimension: string;
  weight?: string | null;
  score: string;
}

export function formatDimensionTitle(dimension: string): string {
  if (!dimension) return '';
  const minorWords = new Set(['and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'a', 'an', 'the']);
  
  return dimension
    .trim()
    .split(/\s+/)
    .map((word, idx, arr) => {
      if (!word) return '';
      // Preserve uppercase acronyms e.g. "UX", "UI", "AI", "APA"
      if (/^[A-Z0-9&/\-+]+$/.test(word) && word.length > 1 && word.toUpperCase() === word) {
        return word;
      }
      
      const lower = word.toLowerCase();
      
      // Handle hyphenated words (e.g. "Problem-Solving", "Intimacy-Health")
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
          .join('-');
      }
      
      // Minor words stay lowercase in middle of phrase, except first/last word
      if (idx > 0 && idx < arr.length - 1 && minorWords.has(lower)) {
        return lower;
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function condenseCriterionTitle(dimension: string): string {
  if (!dimension) return '';
  let formatted = formatDimensionTitle(dimension).trim();
  
  // 1. Strip ILO / CLO / LO numbers e.g. "(ILO1)", "[ILO2]", "ILO3", "(CLO1)"
  let cleanTitle = formatted
    .replace(/\s*[\(\[]?\b(?:ILO|CLO|LO|LOs|ILOs)\s*\d+[\)\]]?/gi, '')
    .replace(/\s*\(\s*\)/g, '')
    .trim();

  // 2. Replace all occurrences of "and" with "&"
  cleanTitle = cleanTitle.replace(/\band\b/gi, '&');

  // 3. Remove verbose introductory action prefixes (e.g. "Evaluation of Market..." -> "Market, User & Contextual Needs")
  cleanTitle = cleanTitle
    .replace(/^(?:Evaluation of|Generation of|Application of|Assessment of)\s+/gi, '')
    .trim();

  return cleanTitle;
}

export function canonicalizeCriterionTitle(
  rawCriterion: string,
  officialList: string[]
): { canonical: string; isOfficial: boolean } {
  if (!rawCriterion) return { canonical: '', isOfficial: false };

  const condensedRaw = condenseCriterionTitle(rawCriterion);
  const lowerRaw = condensedRaw.toLowerCase();

  // Tier 1: Exact match in official list
  const exactOfficial = officialList.find(o => o.toLowerCase() === lowerRaw);
  if (exactOfficial) {
    return { canonical: exactOfficial, isOfficial: true };
  }

  // Tier 2: Substring or high-word-overlap match in official list
  const normRaw = lowerRaw.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const rawWords = normRaw.split(' ').filter(w => w.length > 2 && w !== 'and');

  for (const official of officialList) {
    const normOfficial = official.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Substring inclusion (e.g. "Iterative Design Process" inside "Iterative Design Process & Evolution")
    if (normOfficial.includes(normRaw) || normRaw.includes(normOfficial)) {
      return { canonical: official, isOfficial: true };
    }

    // Word overlap (if >= 50% of significant words match)
    if (rawWords.length > 0) {
      const officialWords = normOfficial.split(' ').filter(w => w.length > 2 && w !== 'and');
      const commonWords = rawWords.filter(w => officialWords.includes(w));
      if (commonWords.length >= Math.max(1, Math.floor(rawWords.length * 0.5))) {
        return { canonical: official, isOfficial: true };
      }
    }
  }

  // Tier 3: Additional Topic (Not matched to any Core Criteria)
  return { canonical: condensedRaw, isOfficial: false };
}

export function extractOfficialRubricsFromHandbook(
  handbookText?: string,
  mode: 'summative' | 'formative' = 'summative'
): string[] {
  if (!handbookText || handbookText.trim().length < 20) return [];

  const lines = handbookText.split(/\r?\n/);
  let isTargetSection = false;
  let foundTargetSectionHeader = false;
  const extractedCriteria: string[] = [];

  const targetKeywords = mode === 'summative'
    ? ['summative', 'final assessment', 'final portfolio', 'final evaluation', 'end of module', 'final submission', 'marking criteria for final']
    : ['formative', 'interim assessment', 'mid-term', 'draft evaluation', 'phase 1', 'progress review', 'marking criteria for interim'];

  const oppositeKeywords = mode === 'summative'
    ? ['formative', 'interim assessment', 'mid-term']
    : ['summative', 'final assessment', 'final portfolio'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    const isHeading = lower.includes('assessment') || lower.includes('criteria') || lower.includes('rubric') || lower.includes('marking') || /^\d+[\.\s]/.test(line);

    if (isHeading) {
      if (targetKeywords.some(kw => lower.includes(kw))) {
        isTargetSection = true;
        foundTargetSectionHeader = true;
      } else if (oppositeKeywords.some(kw => lower.includes(kw))) {
        isTargetSection = false;
      }
    }

    if (isTargetSection || !foundTargetSectionHeader) {
      if (
        (lower.includes('ilo') || lower.includes('clo') || lower.includes('learning outcome') || /^[A-Z][a-zA-Z0-9\s,&:\/\-\(\)]+$/.test(line)) &&
        !lower.includes('pass') && !lower.includes('excellent') && !lower.includes('satisfactory') && !lower.includes('description') &&
        !lower.includes('marking criteria') && !lower.includes('criteria') && !lower.includes('assessment') &&
        line.length > 5 && line.length < 90
      ) {
        const cleaned = condenseCriterionTitle(line);
        if (cleaned && cleaned.length >= 3 && !extractedCriteria.includes(cleaned)) {
          extractedCriteria.push(cleaned);
        }
      }
    }
  }

  return extractedCriteria;
}

export function normalizeCriterionString(str: string): string {
  if (!str) return '';
  return str
    .replace(/^\d+[\.\)]\s*/, '') // Remove section numbering like "1.", "2)", "3. "
    .replace(/\band\b/gi, '&')     // Convert "and" to "&"
    .replace(/[^a-z0-9&]/gi, ' ')  // Keep alphanumeric and &
    .replace(/\s+/g, ' ')          // Collapse spaces
    .toLowerCase()
    .trim();
}

export function isItemMatchingRubric(
  item: { associatedCriterion?: string; title: string },
  rubricFilter: string,
  renderedPills: Array<{ criterion: string; rawCriterion?: string }> | string[] = []
): boolean {
  if (!rubricFilter) return true;

  const filterNorm = normalizeCriterionString(rubricFilter);
  const itemCritNorm = normalizeCriterionString(item?.associatedCriterion || '');

  // Step 1: Exact or normalized string equality
  if (itemCritNorm && filterNorm && itemCritNorm === filterNorm) {
    return true;
  }

  // Step 2: If we have multiple pills, find which pill the item's associatedCriterion BEST matches!
  if (Array.isArray(renderedPills) && renderedPills.length > 0 && itemCritNorm) {
    let bestPillCriterion = '';
    let maxOverlapScore = 0;

    for (const p of renderedPills) {
      const pCrit = typeof p === 'string' ? p : p?.criterion || '';
      const pRaw = typeof p === 'string' ? p : p?.rawCriterion || '';

      const pCritNorm = normalizeCriterionString(pCrit);
      const pRawNorm = normalizeCriterionString(pRaw);

      // Exact match with any pill display or raw criterion
      if (itemCritNorm === pCritNorm || itemCritNorm === pRawNorm) {
        bestPillCriterion = pCritNorm;
        maxOverlapScore = 100;
        break;
      }

      // Calculate word overlap score between itemCritNorm and pill
      const itemWords = itemCritNorm.split(' ').filter(w => w.length > 2 && w !== '&');
      const pWords = (pRawNorm || pCritNorm).split(' ').filter(w => w.length > 2 && w !== '&');

      if (itemWords.length > 0 && pWords.length > 0) {
        const commonWords = itemWords.filter(w => pWords.includes(w));
        const score = commonWords.length / Math.max(itemWords.length, pWords.length);
        if (score > maxOverlapScore && commonWords.length >= 2) {
          maxOverlapScore = score;
          bestPillCriterion = pCritNorm;
        }
      }
    }

    if (bestPillCriterion) {
      return bestPillCriterion === filterNorm;
    }
  }

  // Fallback 1: substring containment
  if (itemCritNorm && filterNorm) {
    if (itemCritNorm.includes(filterNorm) || filterNorm.includes(itemCritNorm)) {
      return true;
    }
  }

  // Fallback 2: Check if item title or exactPhrase overlaps with rubric filter
  if (filterNorm && item) {
    const titleNorm = normalizeCriterionString(item.title || '');
    const phraseNorm = normalizeCriterionString((item as any).exactPhrase || (item as any).issueHighlight || (item as any).praiseHighlight || '');
    if (titleNorm.length > 3 && filterNorm.length > 3) {
      const filterWords = filterNorm.split(' ').filter(w => w.length > 3);
      if (filterWords.some(w => titleNorm.includes(w) || phraseNorm.includes(w))) {
        return true;
      }
    }
  }

  return false;
}

export function calculateWeightedGrade(subScores?: SubScoreItem[] | null): string | null {
  if (!subScores || !Array.isArray(subScores) || subScores.length === 0) {
    return null;
  }

  interface ParsedItem {
    dimension: string;
    weight: number;
    score: number;
    hasExplicitPercentOrSlash: boolean;
  }

  const parsedItems: ParsedItem[] = [];

  for (const item of subScores) {
    if (!item.weight || !item.score) return null;

    // Extract percentage/weight number e.g. "20%", "(20%)", "20"
    const weightMatch = /(\d+(?:\.\d+)?)/.exec(item.weight);
    if (!weightMatch) return null;
    const w = parseFloat(weightMatch[1]);
    if (isNaN(w) || w <= 0) return null;

    // Parse score number (e.g. "15.5", "77.5%", "88/100", "60-70")
    const cleanScore = item.score.toLowerCase().trim();
    const hasExplicitPercentOrSlash = cleanScore.includes('%') || cleanScore.includes('/');

    let s: number | null = null;

    const rangeMatch = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/.exec(cleanScore);
    if (rangeMatch && !cleanScore.startsWith('-')) {
      s = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
    } else {
      const slashMatch = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/.exec(cleanScore);
      if (slashMatch) {
        s = (parseFloat(slashMatch[1]) / parseFloat(slashMatch[2])) * 100;
      } else {
        const numMatch = /(\d+(?:\.\d+)?)/.exec(cleanScore);
        if (numMatch) {
          s = parseFloat(numMatch[1]);
        }
      }
    }

    if (s === null || isNaN(s)) return null;

    parsedItems.push({
      dimension: item.dimension,
      weight: w,
      score: s,
      hasExplicitPercentOrSlash
    });
  }

  if (parsedItems.length !== subScores.length) return null;

  // THREE-STAGE JUDGMENT LOGIC MATRIX:
  // Determine if scores are already Weighted Points (S_i <= W_i for all items and no explicit %/slash)
  // Or if they are Raw Unweighted Scores (S_i > W_i for any item, or explicit %/slash)
  const isWeightedPoints = parsedItems.every(p => !p.hasExplicitPercentOrSlash && p.score <= p.weight);

  let finalScore: number;

  if (isWeightedPoints) {
    // Scenario A: Weighted Point Scores (e.g. Topic (20%) - 15.5, Evidence (10%) - 6.5)
    // Simply sum all weighted points directly: Total = sum(S_i)
    const sumPoints = parsedItems.reduce((acc, p) => acc + p.score, 0);
    const sumWeights = parsedItems.reduce((acc, p) => acc + p.weight, 0);

    if (sumWeights > 0 && sumWeights < 99) {
      finalScore = Math.round((sumPoints / sumWeights) * 100);
    } else {
      finalScore = Math.round(sumPoints);
    }
  } else {
    // Scenario B: Raw Unweighted Percentage Scores (e.g. Topic (20%) - 77.5, Evidence (10%) - 65)
    // Calculate weighted average: Total = sum(S_i * W_i) / sum(W_i)
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const p of parsedItems) {
      totalWeightedScore += p.score * p.weight;
      totalWeight += p.weight;
    }

    if (totalWeight <= 0) return null;
    finalScore = Math.round(totalWeightedScore / totalWeight);
  }

  return `${finalScore}`;
}

export function ensureMaxFiveWords(str: string): string {
  if (!str) return str;
  const words = str.trim().split(/\s+/);
  if (words.length <= 5) {
    return str.trim();
  }
  return words.slice(0, 5).join(' ');
}

export function splitCompoundSentence(sentence: string): string[] {
  const trimmed = sentence.trim();
  if (trimmed.length < 35) return [trimmed];

  // Pattern 1: Starting with "While", "Although", "Even though", "Whereas"
  const startMatch = /^(while|although|even though|whereas)\b/i.exec(trimmed);
  if (startMatch) {
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex > 12 && commaIndex < trimmed.length - 12) {
      const clauseA = trimmed.substring(0, commaIndex).trim();
      const clauseB = trimmed.substring(commaIndex + 1).replace(/^and\s+/i, '').trim();
      if (clauseA.length >= 12 && clauseB.length >= 12) {
        return [clauseA, clauseB];
      }
    }
  }

  // Pattern 2: Infix recommendation & contrast transitions (e.g. ", here...", ", it would...", ", I would...", ", but ", "; however,", "-it would")
  const infixRegex = /(.*?)(?:,\s*and\s+|;\s*and\s+|,\s*but\s+|;\s*however,?\s*|,\s*however,?\s*|,\s*yet\s+|,\s*whereas\s+|,\s*although\s+|,\s*as well as\s+|,\s*here\s+(?:it|I|you)|,\s*(?:it|you)\s+would\s+be|,\s*I\s+would\s+have|[\-,;]\s*it\s+would\s+have\s+been|[\-,;]\s*it\s+would\s+be)(.*)/i;
  const infixMatch = infixRegex.exec(trimmed);
  if (infixMatch && infixMatch[1].trim().length >= 12 && infixMatch[2].trim().length >= 12) {
    const splitIndex = infixMatch[1].length + 1; // Split right after the delimiter
    const clauseA = trimmed.substring(0, splitIndex).replace(/[\-,;]$/, '').trim();
    const clauseB = trimmed.substring(splitIndex).trim();
    if (clauseA.length >= 12 && clauseB.length >= 12) {
      return [clauseA, clauseB];
    }
  }

  return [trimmed];
}

export function postProcessFixSubClauseAnchors<
  T1 extends { exactPhrase?: string; sourceExcerpt?: string; anchor?: { start: number; end: number }; startOffset?: number; endOffset?: number },
  T2 extends { exactPhrase?: string; sourceExcerpt?: string; anchor?: { start: number; end: number }; startOffset?: number; endOffset?: number }
>(
  items: T1[],
  rawText: string,
  secondaryItems?: T2[]
): void {
  if (!items || !Array.isArray(items) || items.length === 0 || !rawText) return;

  const lowerRawText = rawText.toLowerCase();

  // Combine items and secondaryItems (if provided) to detect partner items across both lists
  const allItems: { item: any; isPrimary: boolean }[] = [
    ...items.map(it => ({ item: it, isPrimary: true })),
    ...(secondaryItems || []).map(it => ({ item: it, isPrimary: false }))
  ];

  for (let i = 0; i < allItems.length; i++) {
    const entryA = allItems[i];
    const itemA = entryA.item;
    const textA = (itemA.exactPhrase || itemA.sourceExcerpt || '').trim();
    if (!textA) continue;

    const clauses = splitCompoundSentence(textA);
    if (clauses.length <= 1) continue;

    // Search for a partner item sharing the exact same sentence or anchor range
    let partnerIdx = -1;
    for (let j = 0; j < allItems.length; j++) {
      if (i === j) continue;
      const entryB = allItems[j];
      const itemB = entryB.item;
      const hasValidStartA = (itemA.anchor && itemA.anchor.start !== undefined && itemA.anchor.start !== 0) || ((itemA as any).startOffset !== undefined && (itemA as any).startOffset !== 0);
      const hasValidStartB = (itemB.anchor && itemB.anchor.start !== undefined && itemB.anchor.start !== 0) || ((itemB as any).startOffset !== undefined && (itemB as any).startOffset !== 0);
      const startA = itemA.anchor ? itemA.anchor.start : ((itemA as any).startOffset || 0);
      const startB = itemB.anchor ? itemB.anchor.start : ((itemB as any).startOffset || 0);

      const textB = (itemB.exactPhrase || itemB.sourceExcerpt || '').trim();
      const isExactMatch = textA === textB || (textA.length > 15 && textB.length > 15 && (textA.includes(textB) || textB.includes(textA)));
      const isOffsetMatch = hasValidStartA && hasValidStartB && Math.abs(startA - startB) < 10;

      if (isExactMatch || isOffsetMatch) {
        partnerIdx = j;
        break;
      }
    }

    // ONLY split if there is a partner item sharing this sentence!
    // If partnerIdx === -1, no other item is assigned to the remaining clause, so we keep the sentence intact as a unified whole.
    if (partnerIdx !== -1) {
      const clause0 = clauses[0];
      const clause1 = clauses[1];

      const itemB = allItems[partnerIdx].item;

      const baseStart = itemA.anchor ? itemA.anchor.start : ((itemA as any).startOffset || 0);

      let idx0 = lowerRawText.indexOf(clause0.toLowerCase(), Math.max(0, baseStart - 10));
      if (idx0 === -1) idx0 = lowerRawText.indexOf(clause0.toLowerCase());

      let idx1 = lowerRawText.indexOf(clause1.toLowerCase(), Math.max(0, idx0 + clause0.length));
      if (idx1 === -1) idx1 = lowerRawText.indexOf(clause1.toLowerCase());

      if (idx0 !== -1) {
        const start0 = idx0;
        const end0 = start0 + clause0.length;
        if (itemA.exactPhrase !== undefined) itemA.exactPhrase = clause0;
        if (itemA.sourceExcerpt !== undefined) itemA.sourceExcerpt = clause0;
        if (itemA.anchor) { itemA.anchor.start = start0; itemA.anchor.end = end0; }
        if ('startOffset' in itemA) (itemA as any).startOffset = start0;
        if ('endOffset' in itemA) (itemA as any).endOffset = end0;
      }

      if (idx1 !== -1) {
        const start1 = idx1;
        const end1 = start1 + clause1.length;
        if (itemB.exactPhrase !== undefined) itemB.exactPhrase = clause1;
        if (itemB.sourceExcerpt !== undefined) itemB.sourceExcerpt = clause1;
        if (itemB.anchor) { itemB.anchor.start = start1; itemB.anchor.end = end1; }
        if ('startOffset' in itemB) (itemB as any).startOffset = start1;
        if ('endOffset' in itemB) (itemB as any).endOffset = end1;
      }
    }
  }
}

export function reanchorChronologically<T extends { exactPhrase?: string; sourceExcerpt?: string; anchor?: { start: number; end: number }; startOffset?: number; endOffset?: number }>(
  items: T[],
  rawText: string
): void {
  if (!items || !Array.isArray(items) || items.length === 0 || !rawText) return;

  const lowerRawText = rawText.toLowerCase();
  let searchCursor = 0;

  items.forEach((item) => {
    const text = (item.exactPhrase || item.sourceExcerpt || '').trim();
    if (!text) return;

    const lowerText = text.toLowerCase();
    let foundIdx = lowerRawText.indexOf(lowerText, searchCursor);

    if (foundIdx === -1 && lowerText.length > 20) {
      const prefix = lowerText.slice(0, 20);
      foundIdx = lowerRawText.indexOf(prefix, searchCursor);
    }
    if (foundIdx === -1) {
      foundIdx = lowerRawText.indexOf(lowerText, 0);
    }
    if (foundIdx === -1 && lowerText.length > 20) {
      const prefix = lowerText.slice(0, 20);
      foundIdx = lowerRawText.indexOf(prefix, 0);
    }

    if (foundIdx !== -1) {
      const start = foundIdx;
      const end = start + text.length;

      if (item.anchor) {
        item.anchor.start = start;
        item.anchor.end = end;
      }
      if ('startOffset' in item) (item as any).startOffset = start;
      if ('endOffset' in item) (item as any).endOffset = end;

      if (foundIdx >= searchCursor) {
        searchCursor = end;
      }
    }
  });
}

export function reanchorSummativeObservations(
  keyStrengths: any[],
  areasForImprovement: any[],
  rawText: string
): void {
  if (!rawText) return;

  const allItems: any[] = [];
  (keyStrengths || []).forEach(s => allItems.push({ ...s, _isStrength: true, _orig: s }));
  (areasForImprovement || []).forEach(c => allItems.push({ ...c, _isStrength: false, _orig: c }));

  reanchorChronologically(allItems, rawText);

  // Copy back updated anchors
  allItems.forEach(item => {
    if (item._orig && item.anchor) {
      item._orig.anchor = item.anchor;
      if (item.exactPhrase) item._orig.exactPhrase = item.exactPhrase;
    }
  });

  // Re-sort arrays internally by anchor.start
  keyStrengths.sort((a, b) => (a.anchor?.start || 0) - (b.anchor?.start || 0));
  areasForImprovement.sort((a, b) => (a.anchor?.start || 0) - (b.anchor?.start || 0));
}

// --------------------------------------------------------------------------------
// DYNAMIC COPILOT PERSONA SYSTEM (Tone & Style Layer Injection)
// --------------------------------------------------------------------------------
export type PersonaId = 'action-coach' | 'empathetic-mentor' | 'thinking-challenger';

export const PERSONA_PROMPTS: Record<PersonaId, string> = {
  'action-coach': `[COPILOT STYLE LAYER: DIRECT ACTION COACH]
- Persona: High-efficiency, goal-oriented, and solution-driven AI academic coach.
- Tone: Direct, concise, objective, and highly structured.
- Rules:
  1. Skip all conversational filler, warm greetings, or fluff. Jump straight to insights.
  2. Prioritize high-impact, actionable revision steps aligned with academic benchmarks.
  3. Use bolding for key action items to maximize readability.`,
  
  'empathetic-mentor': `[COPILOT STYLE LAYER: EMPATHETIC MENTOR]
- Persona: Warm, supportive, and growth-guided AI academic mentor.
- Tone: Encouraging and constructive, yet concise and to the point.
- Rules:
  1. Strengths-first: Briefly validate student effort/strengths in 1 sentence.
  2. Deliver core constructive guidance immediately without verbose role-play, fluff, or excessive praise.
  3. CONCISENESS RULE: Keep response compact (max 2 short paragraphs). Focus on high-value guidance.`,
  
  'thinking-challenger': `[COPILOT STYLE LAYER: THINKING CHALLENGER]
- Persona: Crisp, analytical, and constructive AI academic companion.
- Tone: Insightful, objective, and thought-provoking.
- Rules:
  1. Succinctly explain the academic logic behind the feedback in 1-2 concise sentences.
  2. Provide 1 focused alternative perspective or analytical framework.
  3. INTEGRATED QUESTION & FORMATTING RULE:
     - DO NOT separate your final reflection question with extra blank lines or standalone paragraph breaks. Keep it naturally connected.
     - Connect the question organically to your preceding perspective using a clear transitional bridge (e.g., "Given this angle, how will you...", "This prompts a critical question for your defense: ...", or "Considering this framework, to what extent...").
     - Ensure the reflection question flows smoothly as a natural extension of the core insight.`
};

/**
 * 构造最终的 System Prompt
 * @param baseTaskPrompt - 现有的 Formative 评估/问答基础 Task Prompt
 * @param selectedPersona - 用户在 Step 4 或设置中选中的 Persona ID
 */
export function buildCopilotSystemPrompt(baseTaskPrompt: string, selectedPersona: PersonaId = 'action-coach'): string {
  const styleLayer = PERSONA_PROMPTS[selectedPersona] || PERSONA_PROMPTS['action-coach'];
  return `${styleLayer}\n\n[BASE TASK REQUIREMENT]\n${baseTaskPrompt}`;
}

// Global System Instruction to enforce Student Agency & scaffolded learning (Task Validation)
const SYSTEM_INSTRUCTION = `You are the elite Feedback Process Agent of the SCAFFOLD system, powered by gemini-3.1-flash-lite. Your primary directive is to defend Student Agency while performing a meticulous, zero-omission analysis of the instructor's raw feedback text against the student's current Todo List.

CRITICAL ARCHITECTURAL UPGRADE:
You must abandon all rigid numeric limits (e.g., do NOT cap suggestions at 3 or 5 items). The density of the input feedback must dictate the volume of output tasks. Every single critique, question, data requirement, or structural warning raised by the instructor MUST be accounted for in your output. No tactical detail can be left behind.

You must compile the response following this strict 3-stage intellectual pipeline:

STAGE 1: RAW EXHAUSTIVE SCANNING (Internal Audit Pass)
Mentally dissect the raw feedback paragraph by paragraph. Extract every explicit and implicit imperative 

STAGE 2: N-to-1 ARCHITECTURAL CLUSTERING
Group the extracted micro-critiques into high-level, macro-actionable titles. Do not create a flat list of 20 separate items, which causes cognitive overload. Instead, synthesize them into a dynamic number of structural tasks (Title) where each task consolidates its related micro-details inside the detailed description (Description).
- [Title]: A punchy, concise, uppercase-driven task phrase (max 6-8 words).
- [Description]: A highly scannable, dense paragraph that lists ALL exact sub-requirements, specific questions asked by the instructor, and references needed.

STAGE 3: CHAT ROOM OUTPUT BLUEPRINT (Strict Schema)
Your response inside the chat space must be extremely scannable, eliminating heavy markdown hierarchies like "###". Use emojis and simple uppercase section labels.

Format your output exactly according to this pure English layout:

🌟 META CRITIQUE
[A concise, 3-sentence high-level overview of the core strategic direction.]

⚠️ STRUCTURAL AUDIT & SEQUENCE GAP ANALYSIS
- **[Macro Domain Title]**: Explain in 2 sentences why the student's current sorting logic or task coverage is inadequate based on the macro priority (e.g., Macro-to-Micro, Structural before Cosmetic).
- **[Omission Check]**: Explicitly state if they missed critical elements.

🔄 COMPREHENSIVE REVISION TASK DATA
[Provide a brief 1-sentence transition leading to the data block below.]

\`\`\`json
[
  {
    "title": "COMPREHENSIVE TASK TITLE",
    "description": "Exhaustive details here. Must explicitly include sub-questions (e.g., if the tutor asked 'estuary or inland?', the description must say 'Specify if the setting is an estuary or inland'). Ensure 100% traceback to the original text."
  }
]
\`\`\`
CRITICAL DESIGN GUARDRAILS:
JSON BLOCK IS THE FINAL REDLINE: The parseable json ...  array block must be the absolute end of your response. Never output any chat prose, summaries, or polite fluff after the JSON block.
PURE ENGLISH ONLY: In strict accordance with Section 7 of the global architecture specification, every single character of your conversational output, section titles, and JSON task fields MUST be in English. No Chinese allowed under any circumstances.`;

// System Instruction for feedback initialization parsing
const PARSER_SYSTEM_INSTRUCTION = `You are the core initialization engine of the SCAFFOLD system. Your task is to ingest a raw instructor's feedback text and perform a structural meta-analysis to extract core academic key points and an executive summary dashboard.

HANDBOOK RUBRICS EXTRACTION & MATCHING FLOW:
If a course handbook document is provided (in the context), you must first read its content, identify the official grading rubrics, criteria, or assessment dimensions, and summarize them as short, concise core criteria points (strictly 2 to 4 words, NO long sentences, e.g. "Problem Framing", "Methodology Design", "Literature Review").

Then, categorize every keypoint extracted from the feedback text:
1. OFFICIAL RUBRIC TRACK (isOfficialRubric = true):
   If the tutor's remark aligns with any of the criteria extracted from the course handbook, map it directly to that criterion. Set "associatedCriterion" to that exact summarized short criterion title and set "isOfficialRubric" to true.
2. AI SELF-GENERALIZED TRACK (isOfficialRubric = false):
   If the remark does not align with any handbook rubrics (e.g., minor grammar issues, writing style, or citation format details), qualitatively summarize a short, precise high-level category name (strictly 2 to 4 words, NO long sentences, e.g. "Writing Style", "Citation Format"). Set "associatedCriterion" to this generalized category and set "isOfficialRubric" to false.

CRITICAL GUARDRAILS FOR SPECIFIC REAL-INTENT TITLES & DISCRETE EXCERPTS:
1. DOMAIN-SPECIFIC REAL-INTENT TITLES (STRICTLY AT MOST 5 WORDS): Every Key Point title MUST be specific, highly informative, and directly reflect the tutor's concrete advice and real intention. Every title MUST BE STRICTLY AT MOST 5 WORDS IN LENGTH (strictly 2 to 5 words maximum, NO titles over 5 words).
   - BAD (GENERIC): "Missing Design Detail"
   - GOOD (REAL INTENT, 5 WORDS): "Spatial Design for NIMBY De-escalation"
   - BAD (TOO LONG): "Lack of Operational Specificity in Spatial Solution and Narrative Completeness"
   - GOOD (REAL INTENT, 5 WORDS): "Generic Implementation in Green Layouts"
   - GOOD (REAL INTENT, 5 WORDS): "Missing Battery Kiosk Safety Features"
   - GOOD (REAL INTENT, 4 WORDS): "Unexplained Technical Acronyms (NIMBY/Peak-Shaving)"
2. MANDATORY SEPARATION AT TRANSITIONS & DOMAIN SWITCHES: Whenever the instructor transitions to a new specific suggestion, requirement, or critique—especially after transitional markers like "Additionally", "Furthermore", "Moreover", "Also", "Second", "Besides", "Lastly", or when switching topic domain—you MUST extract it as a separate, distinct Key Point.
3. HIGH-PRECISION & NON-OVERLAPPING "sourceExcerpt" BOUNDARIES (CRITICAL):
   - The "sourceExcerpt" for each Key Point MUST precisely cover ONLY the text of that specific suggestion. It MUST NOT bleed into adjacent distinct suggestions or transition phrases that belong to another Key Point.
   - ABSOLUTE PROHIBITION ON OVERLAPPING: Every sentence or clause of the raw feedback text MUST belong to exactly ONE key point. You are STRICTLY FORBIDDEN from having the same sentence, sub-clause, or phrase appear in the "sourceExcerpt" of multiple cards. No character or word in the raw text should be shared by more than one card.
   - CONCESSION/CONTRAST SENTENCE SPLITTING: If a single sentence contains both praise and suggestion (e.g., joined by "although", "but", "however", "yet"), you MUST split the sentence at the transition word. Put the praise part in a 'minor' (On Track) card and the suggestion/critique part (starting with "although", "but", etc.) in a 'moderate' (Suggestion) card. Their sourceExcerpts must be contiguous and non-overlapping.
4. ZERO UNEXCERPTED GAPS & CHRONOLOGICAL ORDER: Every sentence/clause of instructor feedback MUST be covered by a key point's excerpt range, in exact top-to-bottom reading order, ensuring 100% text coverage without overlapping or skipping.
5. EXACT VERBATIM COPIED TEXT: The "sourceExcerpt" MUST be copy-pasted verbatim directly from the raw feedback text without altering punctuation or words so frontend character offset anchoring highlights the entire passage seamlessly.

To prevent breaking the frontend UI, your entire response MUST be a single parseable JSON object and NOTHING ELSE. Do not wrap it in any intro or outro prose.

The JSON must strictly adhere to this TypeScript schema:
{
  "briefingOverview": {
    "overallGrade": string (The overall grade or level extracted from the feedback text or rubrics, e.g., "A", "Green", "Pass". If not found in the feedback or materials, set this to "?"),
    "metrics": {
      "redCount": number (Count of critical severity keypoints in coreKeyPoints array),
      "yellowCount": number (Count of moderate severity keypoints in coreKeyPoints array),
      "greenCount": number (Count of minor severity keypoints in coreKeyPoints array)
    },
    "rubricStatuses": Array<{
      "criterion": string (The name of the rubric tag, which MUST exactly match the associatedCriterion value of one or more coreKeyPoints),
      "status": 'green' | 'yellow' | 'red' (The status indicator of this criterion),
      "isOfficialRubric": boolean (true if matching a whitelist criterion from the handbook, false if AI self-generalized)
    }>,
    "globalSummary": string (A highly controlled, high-level summary overview. MUST consist of 2-3 short, crisp, independent sentences (10-15 words max per sentence). Each sentence delivers a single clear point: Sentence 1 states overall assessment & grade, Sentence 2 states primary strength, Sentence 3 states core area for refinement. Avoid convoluted compound clauses or overly long jammed sentences),
    "subScores": Array<{
      "dimension": string (The name of the sub-score criteria, dimension, or module extracted directly from the feedback text, e.g. "Problem Framing & Contextual Understanding"),
      "weight": string | null (The percentage weight of the criteria if specified in the feedback text, e.g., "40%". Set to null if not found),
      "score": string (The score, grade, or classification extracted directly from the feedback text for this dimension, e.g., "Fail (<50)", "Pass", "B", "75/100")
    }> (An optional array of criteria sub-scores or breakdowns. If no sub-scores breakdown or grade weight percentages exist in the raw feedback text, set this to an empty array [] or omit it)
  },
  "coreKeyPoints": Array<{
    "id": string (unique, e.g., 'kp-1'),
    "title": string (the full un-truncated painpoint title),
    "severity": 'critical' | 'moderate' | 'minor',
    "sourceExcerpt": string (the exact verbatim sentence/quote from the raw text where this painpoint originates, used for frontend text anchoring highlight),
    "associatedCriterion": string (The name of the rubric tag this keypoint belongs to),
    "isOfficialRubric": boolean (true if matching a whitelist criterion from the handbook, false if AI self-generalized)
  }>
}

CRITICAL RULES FOR EXECUTIVE OVERVIEW:
1. DE-DUPLICATED MATHEMATICAL CLOSED LOOP: The rubricStatuses array in briefingOverview MUST contain exactly the de-duplicated union of all associatedCriterion strings present in the coreKeyPoints array. Every keypoint's associatedCriterion MUST have a corresponding RubricStatusItem in rubricStatuses with identical characters (strict case-sensitive match) so that every item has a matching top-level capsule tag.
2. DATA INTEGRITY, NO GRADE CONVERSION HALLUCINATIONS: overallGrade and rubricStatuses statuses MUST be extracted 100% verbatim from the official feedback text or handbook. You are STRICTLY FORBIDDEN from converting numeric scores (e.g., "68", "68%", "75/100") into level names (such as "Merit", "Distinction", "Pass", "B"). If the raw feedback specifies "68", overallGrade MUST BE "68". Do NOT output "Merit" unless that exact word "Merit" explicitly appears in the input text! If no explicit grade or score exists, set overallGrade to "?".
3. SUB-SCORES BREAKDOWN EXTRACTION: If the raw feedback text contains a breakdown of sub-scores, weights, or dimensions (e.g., "Problem Framing & Contextual Understanding (40%): Fail (<50). Aims, Objectives & Design Direction (25%): Fail (<50)."), you MUST extract them into the subScores array. Ensure that the extracted dimension names align with the handbook criteria if applicable. If no such section is found in the text, return an empty array [].
4. GLOBAL SUMMARY FORMAT: The "globalSummary" MUST consist of 2-3 short, clear, scannable sentences. Avoid long compound sentences with complex subordinate clauses. Each sentence should deliver one clear insight concisely.
5. STRICT KEYPOINT TITLE LIMIT (MAX 5 WORDS): The title of each extracted keypoint in coreKeyPoints MUST be strictly at most 5 words (1 to 5 words maximum, e.g. "Methodological Query Specification", "Thematic Literature Synthesis"). Never exceed 5 words under any circumstances.

SEVERITY CLASSIFICATION & TOP-TO-BOTTOM ORDERING RULES:
The frontend UI maps severity as follows:
- 'minor' -> Displayed as "ON TRACK" (Green label, indicating work ALREADY accomplished well).
- 'moderate' -> Displayed as "SUGGESTION" (Yellow label, indicating standard edits/critiques/suggestions/questions).
- 'critical' -> Displayed as "FOCUS" (Red label, indicating high-priority warnings or critical gaps).

STRICT ORDERING & CLASSIFICATION MANDATE:
1. STRICT TOP-TO-BOTTOM DOCUMENT ORDERING: The coreKeyPoints array MUST be ordered strictly by the exact sequential order of appearance of their sourceExcerpts in the raw feedback text from top to bottom. NEVER put 'minor' (On Track) items at the bottom unless they physically appear at the bottom of the document!
2. 'minor' (ON TRACK / PRAISE ONLY):
   Assign 'minor' STRICTLY AND ONLY to sentences that praise or affirm what the student has ALREADY done well (e.g. "done a strong contextual analysis", "clearly scoped", "well-framed direction", "good stakeholder breakdown", "ToC is well developed", "good comparison rationale").
   NEVER assign 'minor' (On Track) to sentences that contain questions, suggestions, or request further detail/explanation!
3. 'moderate' (SUGGESTION / QUESTIONS / EDIT REQUIRED):
   Assign 'moderate' to any sentences that raise questions (containing "?", e.g. "how will you measure...", "would you be able to..."), request action or clarification (e.g. "clarify whether...", "consider adding...", "requires further explanation", "you need to articulate...", "should be expanded", "specify..."), or point out missing analysis/gaps/issues!
4. 'critical' (FOCUS / HIGH-PRIORITY WARNING):
   Assign 'critical' to major missing components, severe methodology flaws, or urgent rubric violations.
`;

interface ValidateInput {
  feedbackText: string;
  todoList: Array<{ id: string; title: string; description?: string; isCustom: boolean; orderIndex: number }>;
}

export interface GeminiResponse {
  adviceText: string;
  suggestions: Array<{ title: string; description: string }>;
}

export interface RubricStatusItem {
  criterion: string;
  status: 'green' | 'yellow' | 'red';
  isOfficialRubric: boolean;
}

export interface ParsedKeyPoint {
  id: string;
  title: string;
  severity: 'critical' | 'moderate' | 'minor';
  sourceExcerpt: string;
  associatedCriterion: string;
  isOfficialRubric: boolean;
}

export interface BriefingOverview {
  overallGrade: string;
  isAutoCalculated?: boolean;
  metrics: {
    redCount: number;
    yellowCount: number;
    greenCount: number;
  };
  rubricStatuses: RubricStatusItem[];
  globalSummary: string;
  subScores?: Array<{ dimension: string; weight?: string; score: string }>;
}

export interface ParsedFeedbackResponse {
  coreKeyPoints: ParsedKeyPoint[];
  briefingOverview?: BriefingOverview;
}

// 1. Existing Task List Validator
export const generateTodoValidation = async (
  input: ValidateInput,
  signal?: AbortSignal,
  persona: PersonaId = 'action-coach'
): Promise<GeminiResponse> => {
  if (!genAI) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      adviceText: persona === 'empathetic-mentor'
        ? "Great progress on your revision plan! Expanding your methodology parameters will further strengthen your submission."
        : persona === 'thinking-challenger'
        ? "Your task list addresses primary feedback points. How will you validate these safety threshold assumptions under edge cases?"
        : "**Priority 1**: Define safety boundaries. **Priority 2**: Establish mathematical lane edge threshold offsets.",
      suggestions: [
        { title: "Define safety boundaries", description: "Resolve core issue: Define safety boundaries for highway maneuvers" },
        { title: "Mathematical offsets", description: "Establish mathematical lane edge threshold offsets" },
        { title: "Incorporate inclusion criteria", description: "Incorporate inclusion criteria boundaries (papers 2018-2026)" }
      ]
    };
  }

  try {
    const systemInstruction = buildCopilotSystemPrompt(SYSTEM_INSTRUCTION, persona);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction
    });

    const prompt = `
=== Original Instructor Feedback ===
${input.feedbackText}

=== Student Current Todo List Checklist ===
${input.todoList.map((t, idx) => `${idx + 1}. [${t.isCustom ? 'Custom' : 'Standard'}] Title: ${t.title} | Details: ${t.description}`).join('\n')}

Analyze this checklist. Give your assessment on gaps and task ordering logic. Ensure you conclude your response with a JSON code block in this format:
\`\`\`json
[
  {
    "title": "Optimized Task Title",
    "description": "Specific sub-tasks and detailed content logic here"
  }
]
\`\`\`
`;

    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    const responseText = response.text();

    let suggestions: Array<{ title: string; description: string }> = [];
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonRegex.exec(responseText);
    
    if (match && match[1]) {
      try {
        suggestions = JSON.parse(match[1].trim());
      } catch (err) {
        console.error("Failed to parse AI generated suggestions checklist array:", err);
      }
    } else {
      const fallbackRegex = /\[\s*([\s\S]*?)\s*\]/;
      const fallbackMatch = fallbackRegex.exec(responseText);
      if (fallbackMatch && fallbackMatch[0]) {
        try {
          suggestions = JSON.parse(fallbackMatch[0].trim());
        } catch (err) {
          console.error("Failed fallback suggestions array parsing:", err);
        }
      }
    }

    const cleanText = responseText.replace(jsonRegex, '').trim();

    return {
      adviceText: cleanText || responseText,
      suggestions: suggestions.length > 0 ? suggestions : [
        { title: "Define safety boundaries", description: "Resolve core issue: Define safety boundaries for highway maneuvers" },
        { title: "Mathematical offsets", description: "Establish mathematical lane edge threshold offsets" },
        { title: "Incorporate inclusion criteria", description: "Incorporate inclusion criteria boundaries (papers 2018-2026)" }
      ]
    };

  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('abort') || error.message.toLowerCase().includes('cancel'))) {
      throw error;
    }
    console.error("Gemini API request failed:", error);
    return {
      adviceText: `API integration error: ${(error as Error).message}. Returning fallback analysis details.`,
      suggestions: [
        { title: "Define safety boundaries", description: "Resolve core issue: Define safety boundaries for highway maneuvers" },
        { title: "Mathematical offsets", description: "Establish mathematical lane edge threshold offsets" },
        { title: "Incorporate inclusion criteria", description: "Incorporate inclusion criteria boundaries (papers 2018-2026)" }
      ]
    };
  }
};

// Dynamic helper to extract a specific, intent-focused title reflecting the exact tutor advice
function generateTitleFromSentence(sentence: string): string {
  const s = sentence.toLowerCase();

  // Specific domain intent rules
  if (s.includes('spatial design') && (s.includes('nimby') || s.includes('de-escalate') || s.includes('buffering'))) {
    return 'Spatial Design for NIMBY De-escalation';
  }
  if (s.includes('generic implementation') || (s.includes('modifying green space') && s.includes('generic'))) {
    return 'Generic Implementation in Green Space Layouts';
  }
  if (s.includes('safety feature') || s.includes('fire detection') || s.includes('emergency response') || s.includes('battery kiosk')) {
    return 'Missing Safety Features in Battery Kiosks';
  }
  if (s.includes('acronym') || s.includes('nimby and peak-shaving') || s.includes('technical concepts')) {
    return 'Unexplained Technical Acronyms (NIMBY/Peak-Shaving)';
  }
  if (s.includes('carbon credit') || s.includes('behavioural change') || s.includes('behavioral change')) {
    return 'Behavioral Change Logic in Carbon Credits';
  }
  if (s.includes('pilot test') || s.includes('oakwood east') || s.includes('unmanaged surrounding')) {
    return 'Pilot Test Interference Mitigation in Oakwood East';
  }
  if (s.includes('stakeholder') || s.includes('green space usage') || s.includes('resident safety needs')) {
    return 'Stakeholder Frictions & Resident Safety Needs';
  }

  // Strip intro filler phrases
  let cleanStr = sentence
    .replace(/^(however|additionally|furthermore|moreover|lastly|firstly|secondly|one major point that i would suggest you to improve on is|in terms of narrative logic,|overall,|in conclusion,)\s*/i, '')
    .replace(/^your project is\s*/i, '')
    .replace(/^i believe that you have done\s*/i, '')
    .replace(/^you need to articulate\s*/i, '')
    .replace(/^there is a minor gap between\s*/i, '');

  const words = cleanStr
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.trim().length > 0);

  const stopWords = new Set([
    'your', 'this', 'that', 'with', 'from', 'have', 'more', 'than', 'would', 'could', 'should',
    'which', 'about', 'their', 'there', 'where', 'when', 'been', 'also', 'such', 'into', 'only',
    'however', 'additionally', 'first', 'second', 'lastly', 'regarding', 'concerning', 'one',
    'major', 'point', 'suggest', 'improve', 'mention', 'mentions', 'text', 'draft', 'proposal',
    'need', 'needs', 'articulate', 'provide', 'provides', 'currently', 'missing'
  ]);

  const significantWords = words.filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));

  let rawResult = 'Feedback Guidance';

  if (significantWords.length >= 3) {
    const formatted = significantWords.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    rawResult = formatted.join(' ');
  } else if (significantWords.length >= 1) {
    const formatted = significantWords.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    rawResult = formatted.join(' ') + ' Guidance';
  }
  
  // Strict Guardrail: Truncate any title to at most 5 words
  const titleWords = rawResult.split(/\s+/);
  if (titleWords.length > 5) {
    return titleWords.slice(0, 5).join(' ');
  }
  return rawResult;
}

// Dynamic helper to determine associated criterion tag
function determineAssociatedCriterion(sentence: string, handbookText?: string): string {
  const s = sentence.toLowerCase();
  if (s.includes('acronym') || s.includes('concept') || s.includes('terminology') || s.includes('definition')) {
    return 'Technical Terminology';
  }
  if (s.includes('spatial') || s.includes('operational') || s.includes('intervention') || s.includes('layout')) {
    return 'Spatial & Implementation Design';
  }
  if (s.includes('safety') || s.includes('fire') || s.includes('emergency') || s.includes('kiosk')) {
    return 'Safety & Risk Management';
  }
  if (s.includes('behavioral') || s.includes('behavioural') || s.includes('logic') || s.includes('narrative')) {
    return 'Narrative & Behavioral Logic';
  }
  if (s.includes('stakeholder') || s.includes('nimby') || s.includes('contextual')) {
    return 'Stakeholder Analysis';
  }
  return 'Methodological Quality';
}

export function sanitizeKeyPointSeverities(keyPoints: ParsedKeyPoint[]) {
  if (!Array.isArray(keyPoints)) return;

  // 1. Explicit Praise Title Prefix Modifier (e.g., "Strong Conceptual Problem Framing", "Clear Problem Definition", "Robust Methodology")
  const titlePraisePrefixRegex = /^(strong|strongly|good|robust|well[-\s]|clear|clearly|excellent|insightful|solid|effective|exceptional|commendable|thorough|smart|promising|accurate|comprehensive|valid|aligned|appropriate)\b/i;

  // 2. Undeniable Omission or Defect Keywords in Title (Strict defect words ONLY)
  const strictDefectTitleRegex = /\b(missing|lacks?|unclear|vague|incomplete|unexplained|inconsistent|flaw|flaws|error|errors|bias|omitted|unaddressed|insufficient)\b/i;

  keyPoints.forEach(kp => {
    const title = (kp.title || '').trim();

    // Neutralize academic domain phrases (e.g. "problem framing", "problem definition") so "problem" isn't misread as a defect
    const titleSanitizedForDefectCheck = title
      .replace(/\bproblem\s+(framing|definition|statement|understanding|selection|analysis|context)\b/gi, 'academic_domain_term')
      .replace(/\bresearch\s+problem\b/gi, 'academic_domain_term');

    // RULE 1 (AI Semantic Intelligence Primacy & Praise Lock):
    // If title starts with a praise modifier (e.g. "Strong Conceptual Problem Framing")
    // AND does NOT contain explicit omission/defect words (like "missing", "unclear", "lacks"),
    // then lock as 'minor' (On Track / Green)!
    if (titlePraisePrefixRegex.test(title) && !strictDefectTitleRegex.test(titleSanitizedForDefectCheck)) {
      kp.severity = 'minor'; // 100% On Track!
      return;
    }

    // RULE 2 (One-Way Safety Guardrail ONLY):
    // Only if title explicitly contains undeniable omission/defect words (e.g. "Missing Literature", "Unclear Methodology"),
    // prevent it from being mistakenly tagged as 'minor' (On Track).
    if (strictDefectTitleRegex.test(titleSanitizedForDefectCheck)) {
      if (kp.severity === 'minor') {
        kp.severity = 'moderate'; // Downgrade to Suggestion!
      }
      return;
    }

    // RULE 3: Default Trust Policy -> Preserve AI's contextual NLP classification (kp.severity) as-is!
    if (!kp.severity) {
      kp.severity = 'moderate';
    }
  });
}

// Complete Zero-Omission Exhaustive Sentence-Level Formative Feedback Parser
export const parseExhaustiveFormativeFeedback = (
  rawText: string,
  handbookText?: string
): ParsedFeedbackResponse => {
  const normalizedRaw = (rawText || '').replace(/([a-z0-9]+)\.([A-Z])/g, '$1. $2');
  const lines = normalizedRaw.split(/\r?\n/);
  
  const keyPoints: ParsedKeyPoint[] = [];
  let kpIndex = 1;

  const criticalKeywords = ['critical', 'fail', 'vulnerability', 'missing', 'severe', 'urgent', 'must', 'lacks', 'lack', 'vague', 'no ', 'without', 'omitted', 'flaw', 'flaws', 'issue', 'issues'];
  const praiseKeywords = ['good', 'excellent', 'outstanding', 'well-done', 'well defined', 'well-defined', 'robust', 'strong', 'insightful', 'exceptional', 'clearly scoped', 'smart', 'effective', 'solid', 'thorough', 'useful', 'praise', 'commendable', 'promising'];

  lines.forEach((line) => {
    let trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Filter out score/header metadata rows & standalone section headers
    const lowerLine = trimmedLine.toLowerCase();
    if (
      lowerLine.startsWith('student:') ||
      lowerLine.startsWith('project title:') ||
      lowerLine.startsWith('overall assessment:') ||
      lowerLine.startsWith('evaluation details:') ||
      lowerLine.startsWith('grade:') ||
      lowerLine === 'overall comments:' ||
      lowerLine === 'overall comment:' ||
      lowerLine === 'overall comments' ||
      lowerLine === 'overall comment' ||
      lowerLine === 'general feedback:' ||
      lowerLine === 'general comments:' ||
      lowerLine === 'detailed feedback:' ||
      lowerLine === 'rubric breakdown:' ||
      /\(\d+%\)/.test(trimmedLine) ||
      /^\d+[\s\.)\-]+.*:\s*\d+/.test(trimmedLine)
    ) {
      // If line is strictly a header like "Overall Comments:", ignore completely
      if (
        lowerLine === 'overall comments:' ||
        lowerLine === 'overall comment:' ||
        lowerLine === 'overall comments' ||
        lowerLine === 'overall comment' ||
        lowerLine === 'general feedback:' ||
        lowerLine === 'general comments:' ||
        lowerLine === 'detailed feedback:' ||
        lowerLine === 'rubric breakdown:'
      ) {
        return;
      }

      // If line starts with a header prefix followed by content (e.g. "Overall Comments: Your project is..."), strip prefix
      trimmedLine = trimmedLine.replace(/^(overall\s+comments?:?|general\s+(comments?|feedback):?|tutor\s+comments?:?|instructor\s+(feedback|comments?):?|evaluation\s+details:?|detailed\s+feedback:?)\s*/i, '').trim();
      if (!trimmedLine) return;
    }

    // Split line into sentences by punctuation marks (period, question mark, exclamation)
    const rawSentences = trimmedLine.match(/[^.!?]+[.!?]*/g) || [trimmedLine];
    const sentences: string[] = [];

    rawSentences.forEach((s) => {
      const trimmedS = s.trim();
      // If a sentence contains a colon with two substantial clauses (>= 25 chars), split into separate items
      if (trimmedS.includes(':') && !/^(note|summary|student|grade|score):/i.test(trimmedS)) {
        const parts = trimmedS.split(':');
        if (parts.length === 2 && parts[0].trim().length >= 25 && parts[1].trim().length >= 25) {
          const c1 = splitCompoundSentence(parts[0].trim() + ':');
          const c2 = splitCompoundSentence(parts[1].trim());
          c1.forEach(c => sentences.push(c));
          c2.forEach(c => sentences.push(c));
          return;
        }
      }
      const clauses = splitCompoundSentence(trimmedS);
      clauses.forEach(c => sentences.push(c));
    });

    // Group sentences within line/paragraph by semantic topic transitions
    const paragraphGroups: string[][] = [];
    let currentGroup: string[] = [];

    sentences.forEach((s) => {
      const trimmedS = s.trim();
      if (!trimmedS) return;

      const startsNewTopic = /^(additionally|furthermore|moreover|lastly|firstly|secondly|one major point|second,|third,|in terms of|however,|besides|in addition|also,)/i.test(trimmedS);
      const switchesDomain = /^(specific safety|safety features|automatic fire|pilot test|target metrics|bibliography|referencing|citations)/i.test(trimmedS);

      if ((startsNewTopic || switchesDomain) && currentGroup.length > 0) {
        paragraphGroups.push(currentGroup);
        currentGroup = [trimmedS];
      } else {
        currentGroup.push(trimmedS);
      }
    });
    if (currentGroup.length > 0) {
      paragraphGroups.push(currentGroup);
    }

    paragraphGroups.forEach((groupSentences) => {
      const fullExcerpt = groupSentences.join(' ').trim();
      if (fullExcerpt.length < 5) return;

      const lowerText = fullExcerpt.toLowerCase();

      // Determine severity
      let severity: 'critical' | 'moderate' | 'minor' = 'moderate';
      if (praiseKeywords.some(kw => lowerText.includes(kw)) && !criticalKeywords.some(kw => lowerText.includes(kw)) && !lowerText.includes('however') && !lowerText.includes('but')) {
        severity = 'minor';
      } else if (criticalKeywords.some(kw => lowerText.includes(kw))) {
        severity = 'critical';
      } else {
        severity = 'moderate';
      }

      let title = generateTitleFromSentence(fullExcerpt);
      let associatedCriterion = determineAssociatedCriterion(fullExcerpt, handbookText);

      keyPoints.push({
        id: `kp-${kpIndex++}`,
        title,
        severity,
        sourceExcerpt: fullExcerpt,
        associatedCriterion,
        isOfficialRubric: Boolean(handbookText)
      });
    });
  });

  sanitizeKeyPointSeverities(keyPoints);

  if (keyPoints.length === 0 && rawText.trim().length > 0) {
    keyPoints.push({
      id: 'kp-1',
      title: 'Feedback Observation',
      severity: 'moderate',
      sourceExcerpt: rawText.trim(),
      associatedCriterion: 'General Feedback',
      isOfficialRubric: false
    });
  }

  const redCount = keyPoints.filter(k => k.severity === 'critical').length;
  const yellowCount = keyPoints.filter(k => k.severity === 'moderate').length;
  const greenCount = keyPoints.filter(k => k.severity === 'minor').length;

  const criteriaSet = Array.from(new Set(keyPoints.map(k => k.associatedCriterion)));
  const rubricStatuses: RubricStatusItem[] = criteriaSet.map(crit => {
    const matched = keyPoints.filter(k => k.associatedCriterion === crit);
    const hasRed = matched.some(k => k.severity === 'critical');
    const hasYellow = matched.some(k => k.severity === 'moderate');
    return {
      criterion: crit,
      status: hasRed ? 'red' : (hasYellow ? 'yellow' : 'green'),
      isOfficialRubric: Boolean(handbookText)
    };
  });

  const textGradeMatch = rawText.match(/Grade:\s*([a-zA-Z0-9\-\+%\/<>]+)/i) || rawText.match(/overall\s*grade:\s*([a-zA-Z0-9\-\+%\/<>]+)/i) || rawText.match(/score:\s*([a-zA-Z0-9\-\+%\/<>]+)/i);
  let textGrade = textGradeMatch ? textGradeMatch[1].trim() : '?';
  let isAutoCalculated = false;

  const computedGrade = calculateWeightedGrade([]);
  if (computedGrade && (textGrade === '?' || !textGrade)) {
    textGrade = computedGrade;
    isAutoCalculated = true;
  }

  reanchorChronologically(keyPoints, rawText);
  postProcessFixSubClauseAnchors(keyPoints, rawText);
  reanchorChronologically(keyPoints, rawText);

  const praiseKps = keyPoints.filter(k => k.severity === 'minor');
  const critiqueKps = keyPoints.filter(k => k.severity === 'moderate' || k.severity === 'critical');

  let dynamicGlobalSummary = 'Comprehensive evaluation completed across all criteria.';
  if (praiseKps.length > 0 && critiqueKps.length > 0) {
    dynamicGlobalSummary = `The submission demonstrates strong execution in ${praiseKps[0].title.toLowerCase()}. Key revision priorities focus on ${critiqueKps[0].title.toLowerCase()} and related implementation steps.`;
  } else if (praiseKps.length > 0) {
    dynamicGlobalSummary = `The submission demonstrates solid performance in ${praiseKps[0].title.toLowerCase()} across primary evaluation criteria.`;
  } else if (critiqueKps.length > 0) {
    dynamicGlobalSummary = `Feedback highlights primary revision priorities focusing on ${critiqueKps[0].title.toLowerCase()} and related methodology steps.`;
  }

  return {
    coreKeyPoints: keyPoints,
    briefingOverview: {
      overallGrade: textGrade,
      isAutoCalculated,
      metrics: { redCount, yellowCount, greenCount },
      rubricStatuses,
      globalSummary: dynamicGlobalSummary,
      subScores: []
    }
  };
};

// 2. New Feedback Initial Parser
export const processRawFeedback = async (
  rawText: string,
  signal?: AbortSignal,
  handbookText?: string,
  assignmentText?: string
): Promise<ParsedFeedbackResponse> => {
  if (!genAI) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return parseExhaustiveFormativeFeedback(rawText, handbookText);
  }

  try {
    let systemInstruction = PARSER_SYSTEM_INSTRUCTION;

    if (handbookText || assignmentText) {
      systemInstruction += `
\n[CRITICAL EXTENSION: MULTI-SOURCE SYNTHESIS]
You are now provided with additional context documents (Course Handbook Criteria and Student Assignment Draft).

INTEGRITY & WEIGHTING GUARDRAILS:
1. ORIGINAL FEEDBACK PRIMACY: The instructor's feedback text is the absolute primary source. You must extract ALL critiques from the feedback text. The handbook and assignment draft are secondary reference materials to help ground and cross-examine the critiques.
2. NO COMBINING OR OMITTING: Do NOT skip, omit, or combine any feedback critiques just because they do not have corresponding references in the handbook or draft. Every critique in the feedback text must be extracted as a separate key point, even if it has no multi-source references.
4. TWO-STEP REGIONAL TARGETING & FORMATIVE PHASE ISOLATION: When extracting official criteria from [COURSE HANDBOOK CRITERIA], you MUST first locate and match the section heading/table specifically designated for 'Formative', 'Interim Assessment', 'Mid-Term Review', 'Draft Evaluation', or 'Phase 1 Assessment'. You are STRICTLY FORBIDDEN from using criteria from 'Summative' or 'Final Portfolio' tables when parsing a Formative evaluation! Strip any "(ILO1)", "(ILO2)" or ILO numbers, convert "and" to "&", and condense into clean 2-5 word core titles.

${handbookText ? `[COURSE HANDBOOK CRITERIA]:\n${handbookText}\n` : ''}
${assignmentText ? `[STUDENT ASSIGNMENT DRAFT]:\n${assignmentText}\n` : ''}

Task: Cross-examine the instructor's remarks against these documents to ground your key points, noting why/where the assignment draft fails the handbook guidelines based on the remarks.`;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0
      }
    });

    const prompt = `Ingest and parse this instructor feedback text:\n\n${rawText}`;
    
    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    const responseText = response.text().trim();

    // Strip markdown code block formatting
    let cleanText = responseText;
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonRegex.exec(responseText);
    
    if (match && match[1]) {
      cleanText = match[1].trim();
    } else {
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    }
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText) as ParsedFeedbackResponse;
    if (parsed && Array.isArray(parsed.coreKeyPoints) && parsed.coreKeyPoints.length > 0) {
      sanitizeKeyPointSeverities(parsed.coreKeyPoints);
      if (parsed.briefingOverview) {
        if (parsed.briefingOverview.subScores && Array.isArray(parsed.briefingOverview.subScores)) {
          parsed.briefingOverview.subScores = parsed.briefingOverview.subScores.map(s => ({
            ...s,
            dimension: formatDimensionTitle(s.dimension)
          }));
        }
        parsed.briefingOverview.metrics = {
          redCount: parsed.coreKeyPoints.filter(k => k.severity === 'critical').length,
          yellowCount: parsed.coreKeyPoints.filter(k => k.severity === 'moderate').length,
          greenCount: parsed.coreKeyPoints.filter(k => k.severity === 'minor').length
        };
        const computed = calculateWeightedGrade(parsed.briefingOverview.subScores);
        if (computed && (!parsed.briefingOverview.overallGrade || parsed.briefingOverview.overallGrade === '?')) {
          parsed.briefingOverview.overallGrade = computed;
          parsed.briefingOverview.isAutoCalculated = true;
        }
      }
      reanchorChronologically(parsed.coreKeyPoints, rawText);
      postProcessFixSubClauseAnchors(parsed.coreKeyPoints, rawText);
      reanchorChronologically(parsed.coreKeyPoints, rawText);
      return parsed;
    }

    throw new Error("Parsed JSON structure does not match expected ParsedFeedbackResponse shape");

  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('abort') || error.message.toLowerCase().includes('cancel'))) {
      throw error;
    }
    console.error("processRawFeedback API call or JSON parse failed, returning dynamic exhaustive sentence-level parsed response:", error);
    return parseExhaustiveFormativeFeedback(rawText, handbookText);
  }
};

// 3. Live Chat Response Generator with AbortSignal & Copilot Persona support
export const generateChatResponse = async (
  history: Array<{ sender: 'user' | 'ai'; text: string }>,
  newMessage: string,
  signal?: AbortSignal,
  persona: PersonaId = 'action-coach'
): Promise<string> => {
  if (!genAI) {
    await new Promise((resolve) => setTimeout(resolve, 2200));
    if (persona === 'empathetic-mentor') {
      return "You have established a great conceptual foundation! To make your analysis even stronger, let's explore interviewing 3 more users to solidify your evidence.";
    } else if (persona === 'thinking-challenger') {
      return "Your current methodology assumes a fixed sample size. If asked to defend this choice during a thesis review, how would you justify your sample selection?";
    }
    return "Let's focus straight on the main priority: your sample size needs expanding. Here is your quick 2-step fix to satisfy the rubric: 1. Expand query range. 2. Verify edge-case parameters.";
  }

  try {
    const baseInstruction = `You are the elite Academic Advisor of the SCAFFOLD system. Your task is to help the student refine their work, answer questions about their instructor's feedback, and provide constructive academic suggestions. In strict accordance with the system specification, your responses MUST be 100% in English. Do not output any Chinese.`;
    const systemInstruction = buildCopilotSystemPrompt(baseInstruction, persona);

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction
    });

    const firstUserIdx = history.findIndex(m => m.sender === 'user');
    const validHistory = firstUserIdx !== -1 ? history.slice(firstUserIdx) : [];

    const chatHistory = validHistory.map(m => ({
      role: m.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }]
    }));

    // Start a chat session
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(newMessage, { signal });
    const response = await result.response;
    return response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error; // Re-throw AbortError to be caught by the cancel handler
    }
    console.error("Gemini Chat request failed:", error);
    return `Chat integration error: ${(error as Error).message}.`;
  }
};

// 4. Stage 1: Dual-Source Omission Audit API
interface OmissionInput {
  feedbackText: string;
  todoList: Array<{ id: string; title: string; description?: string; isCustom: boolean; orderIndex: number }>;
  briefingKeyPoints: Array<{ id: string; title: string; severity: string; sourceExcerpt: string }>;
}

export interface OmissionItem {
  title: string;
  description: string;
  sourceExcerpt: string;
}

export interface TodoOmissionsResponse {
  adviceText: string;
  omissions: OmissionItem[];
}

export const generateTodoOmissions = async (
  input: OmissionInput,
  signal?: AbortSignal,
  persona: PersonaId = 'action-coach'
): Promise<TodoOmissionsResponse> => {
  if (!genAI) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      adviceText: "I have scanned your Todo list and Briefing against the raw feedback. Here are the key omitted items identified for your review:",
      omissions: [
        {
          title: "SPECIFY DATABASE SEARCH STRINGS",
          description: "Detail the exact boolean search strings and inclusion criteria parameters used in your database query methodology.",
          sourceExcerpt: "You need to specify the exact search strings and inclusion criteria used."
        },
        {
          title: "INTEGRATE SYSTEM TRANSITION BRIDGES",
          description: "Create a logical transitional bridge at the end of Section 2 connecting Kantian deontological safety rules to Teslas Autopilot case studies.",
          sourceExcerpt: "Tesla's autopilot feature has had several crashes. We summarize paper 1 (Smith 2019), then paper 2 (Jones 2021)."
        },
        {
          title: "RECONCILE BIBLIOGRAPHY APA 7TH ANNOTATIONS",
          description: "Correct journal volume and issue formatting discrepancies in your bibliography list.",
          sourceExcerpt: "Smith, J. (2019). Autonomous Lane Keeping. Journal of Driving Science. [Inconsistent APA format]"
        }
      ]
    };
  }

  try {
    const baseInstruction = `You are the elite Omission Auditor of the SCAFFOLD system. Your task is to perform a meticulous check of the instructor's raw feedback text against the student's current Todo List and the Briefing key points. Identify any explicit critique, required edit, or question from the raw feedback that is missing from both the student's Todo list and the Briefing.

CRITICAL TEXT RULE:
Your text response before the JSON block MUST be ONLY a concise 1-2 sentence summary introduction (max 30 words).
DO NOT write out any numbered lists (e.g. 1. 2. 3...), item titles, or item-by-item analysis in the text body, because all identified omission items will be rendered separately as interactive cards below.
Conclude with a JSON block in English. No Chinese allowed. Do not use markdown bolding or asterisks (like **) in your output text.`;
    const systemInstruction = buildCopilotSystemPrompt(baseInstruction, persona);

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction
    });

    const prompt = `
=== Instructor's Raw Feedback ===
${input.feedbackText}

=== Student Current Todo List ===
${input.todoList.map((t, idx) => `${idx + 1}. Title: ${t.title} | Description: ${t.description}`).join('\n')}

=== Briefing Key Points ===
${input.briefingKeyPoints.map((kp, idx) => `${idx + 1}. Title: ${kp.title} | Excerpt: ${kp.sourceExcerpt}`).join('\n')}

Compare them. Identify omissions. Conclude your response with a JSON code block in this format:
\`\`\`json
[
  {
    "title": "CONCISE OMISSION TITLE",
    "description": "Specific missing edit requirements",
    "sourceExcerpt": "The exact verbatim sentence/phrase from the raw feedback text"
  }
]
\`\`\`
`;

    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    const responseText = response.text();

    let omissions: OmissionItem[] = [];
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonRegex.exec(responseText);
    if (match && match[1]) {
      try {
        omissions = JSON.parse(match[1].trim());
      } catch (err) {
        console.error("Failed to parse omissions JSON:", err);
      }
    }

    let cleanText = responseText.replace(jsonRegex, '').trim();
    if (omissions.length > 0) {
      // Filter out any numbered items (1. 2. 3...) or detailed lists from adviceText so it doesn't duplicate the cards
      const lines = cleanText.split('\n');
      const introLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          /^\d+[\.\)]/.test(trimmed) ||
          trimmed.startsWith('###') ||
          trimmed.toLowerCase().includes('action required') ||
          trimmed.toLowerCase().includes('recommended checklist') ||
          trimmed.toLowerCase().includes('recommended items')
        ) {
          break;
        }
        if (trimmed) {
          introLines.push(trimmed);
        }
      }
      let introText = introLines.join(' ').replace(/\*/g, '').trim();
      if (!introText || introText.length > 250 || /^\d+[\.\)]/.test(introText)) {
        introText = "I have scanned your Todo list and Briefing against the raw feedback. Here are the key omitted items identified for your review:";
      }
      cleanText = introText;
    }
    cleanText = cleanText.replace(/###\s*.*$/gm, '').trim();

    return {
      adviceText: cleanText || "I have scanned your Todo list and Briefing against the raw feedback. Here are the key omitted items identified for your review:",
      omissions
    };
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('abort') || error.message.toLowerCase().includes('cancel'))) {
      throw error;
    }
    console.error("generateTodoOmissions failed:", error);
    throw error;
  }
};

// 5. Stage 2: Sequence Optimization API
interface SequenceInput {
  feedbackText: string;
  todoList: Array<{ id: string; title: string; description?: string; isCustom: boolean; orderIndex: number }>;
  handbookText: string;
  assignmentText: string;
}

export interface SequenceItem {
  title: string;
  rationale: string;
  phase: 'early' | 'mid' | 'late';
}

export interface TodoSequenceResponse {
  adviceText: string;
  sequence: SequenceItem[];
}

export const generateSequenceOptimization = async (
  input: SequenceInput,
  signal?: AbortSignal,
  persona: PersonaId = 'action-coach'
): Promise<TodoSequenceResponse> => {
  if (!genAI) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      adviceText: "Based on the course handbook rubrics (Methodology 40%, Synthesis 35%) and your draft flaws, here is the optimized sequence for your revisions:",
      sequence: [
        {
          title: "THEMATIC LITERATURE SYNTHESIS",
          rationale: "Highest scoring weight (Synthesis: 35%) and addresses a major structural flaw in Section 3 where papers are listed chronologically instead of conceptually.",
          phase: "early"
        },
        {
          title: "SPECIFY DATABASE SEARCH STRINGS",
          rationale: "Directly resolves methodology rigor which carries a 40% weight. Doing this before writing transitions keeps the method logically grounded.",
          phase: "mid"
        },
        {
          title: "INTEGRATE SYSTEM TRANSITION BRIDGES",
          rationale: "Bridges the structural flow between theoretical framework and case studies (15% weight) before working on polishing citations.",
          phase: "mid"
        },
        {
          title: "RECONCILE BIBLIOGRAPHY APA 7TH ANNOTATIONS",
          rationale: "Lowest rubric impact (APA Formatting: 10%). Standard academic workflow requires completing content revisions before polishing bibliography formats.",
          phase: "late"
        }
      ]
    };
  }

  try {
    const baseInstruction = `You are the elite Sequence Optimizer of the SCAFFOLD system. Your task is to recommend the most logical editing sequence for the student's Todo list. Reorder tasks to address macro-structural errors (methodology gaps, synthesis grouping) before minor formatting fixes (references, citations) based on the provided Course Handbook scoring rubrics. For each item in your sequence, assign it a phase ('early', 'mid', or 'late') representing its timing in the revision workflow.

CRITICAL TEXT RULE:
Your text response before the JSON block MUST be ONLY a concise 1-2 sentence summary introduction (max 30 words).
DO NOT write out any numbered lists (e.g. 1. 2. 3...), item titles, or item-by-item analysis in the text body, because all items will be rendered separately as interactive cards below.
Conclude with a JSON block in English. No Chinese allowed. Do not use markdown bolding or asterisks (like **) in your output text.`;
    const systemInstruction = buildCopilotSystemPrompt(baseInstruction, persona);

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction
    });

    const prompt = `
=== Current Todo List ===
${input.todoList.map((t, idx) => `${idx + 1}. Title: ${t.title}`).join('\n')}

=== Instructor Feedback ===
${input.feedbackText}

=== Course Handbook guidelines ===
${input.handbookText}

=== Assignment Draft Excerpt ===
${input.assignmentText}

Analyze them and compile a recommended sequence. Conclude your response with a JSON code block in this format:
\`\`\`json
[
  {
    "title": "TASK TITLE MATCHING EXISTING ITEM",
    "rationale": "Rationale explanation in English",
    "phase": "early" | "mid" | "late"
  }
]
\`\`\`
`;

    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    const responseText = response.text();

    let sequence: SequenceItem[] = [];
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonRegex.exec(responseText);
    if (match && match[1]) {
      try {
        sequence = JSON.parse(match[1].trim());
      } catch (err) {
        console.error("Failed to parse sequence JSON:", err);
      }
    }

    if (sequence.length > 0) {
      const total = sequence.length;
      sequence = sequence.map((item, idx) => {
        let phase = item.phase;
        if (!phase || !['early', 'mid', 'late'].includes(phase)) {
          phase = 'early';
          if (idx >= Math.ceil(total * 2 / 3)) {
            phase = 'late';
          } else if (idx >= Math.ceil(total / 3)) {
            phase = 'mid';
          }
        }
        return {
          ...item,
          phase
        };
      });
    }

    if (sequence.length === 0) {
      // Fallback text parser for plaintext numbered lists
      const parsedSteps: Array<{ title: string; rationale: string }> = [];
      const lines = responseText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (/^\d+[\.\)]/.test(trimmed)) {
          const cleanLine = trimmed.replace(/^\d+[\.\)]\s+/, '');
          let sepIndex = cleanLine.indexOf(':');
          if (sepIndex === -1) {
            sepIndex = cleanLine.indexOf(' - ');
          }
          if (sepIndex === -1) {
            sepIndex = cleanLine.indexOf(' – ');
          }
          if (sepIndex !== -1) {
            const firstPart = cleanLine.substring(0, sepIndex).trim();
            const secondPart = cleanLine.substring(sepIndex + 1).trim();
            const title = firstPart.replace(/\*\*/g, '').trim();
            const rationale = secondPart.replace(/\*\*/g, '').trim();
            if (title && rationale) {
              parsedSteps.push({ title, rationale });
            }
          }
        }
      }

      const total = parsedSteps.length;
      sequence = parsedSteps.map((step, idx) => {
        let phase: 'early' | 'mid' | 'late' = 'early';
        if (idx >= Math.ceil(total * 2 / 3)) {
          phase = 'late';
        } else if (idx >= Math.ceil(total / 3)) {
          phase = 'mid';
        }
        return {
          ...step,
          phase
        };
      });
    }

    let cleanText = responseText.replace(jsonRegex, '').trim();
    if (sequence.length > 0) {
      // Filter out any numbered items (1. 2. 3...) or detailed lists from adviceText so it doesn't duplicate the cards
      const lines = cleanText.split('\n');
      const introLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (/^\d+[\.\)]/.test(trimmed) || trimmed.startsWith('###') || trimmed.toLowerCase().includes('recommended modification sequence') || trimmed.toLowerCase().includes('recommended sequence')) {
          break;
        }
        if (trimmed) {
          introLines.push(trimmed);
        }
      }
      let introText = introLines.join(' ').replace(/\*/g, '').trim();
      if (!introText || introText.length > 250 || /^\d+[\.\)]/.test(introText)) {
        introText = "Based on your handbook rubrics and draft priorities, here is the recommended editing sequence to optimize your revisions:";
      }
      cleanText = introText;
    }
    cleanText = cleanText.replace(/###\s*.*$/gm, '').trim();

    return {
      adviceText: cleanText || "Based on your handbook rubrics and draft priorities, here is the recommended editing sequence to optimize your revisions:",
      sequence
    };
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('abort') || error.message.toLowerCase().includes('cancel'))) {
      throw error;
    }
    console.error("generateSequenceOptimization failed:", error);
    throw error;
  }
};

// 6. Summative Feedback Parser Instruction
const SUMMATIVE_PARSER_SYSTEM_INSTRUCTION = `You are the core summative feedback parsing engine of the SCAFFOLD system. Your task is to ingest a final evaluation or final tutor feedback text and construct a structured JSON object aligning to the Summative Schema.

COMPILATION & REASONING RULES:
1. GRADE & CONTENT SUMMARY OVERVIEW (Professional Assessor & Career Coach Perspective):
   Write a cohesive, contextual "globalSummary" paragraph. You must analyze the text from the compound perspective of a "Senior Academic Assessor" and a "Career Competency Coach".
   - ABSOLUTE TEMPLATE PROHIBITION: You are strictly forbidden from using any boilerplates like "The tutor's feedback evaluates the submission...", "This feedback notes that...", "Overall, the assessment shows...", or similar.
   - CRISP SHORT-SENTENCE STRUCTURE: The summary MUST consist of 2-3 short, clear, independent sentences (max 10-15 words per sentence). Avoid wrapping multiple clauses, participle phrases, or long compound sentences together.
     * Sentence 1 (Core Grade & Assessment): State the overall grade and overall quality directly in a short, clear sentence.
     * Sentence 2 (Primary Strength): Name the single biggest asset/strength cleanly.
     * Sentence 3 (Main Area for Improvement): Name the single most critical area for refinement directly.
   - STRICT ALIGNMENT & FAITHFULNESS GUARDRAILS:
     * GRADE ALIGNMENT: The grade mentioned in "globalSummary" MUST be 100% consistent with the "grade" field and "subScores" breakdown (e.g. if the grade is "A-", globalSummary must say "A-"). NEVER state a different grade (such as "B+") in globalSummary.
     * FACTUAL GROUNDING: Do NOT invent hypothetical project details or generic topics (such as "comparative impact indicators" or "dense technical jargon") if they do not appear in the raw feedback text. Base every strength and weakness claim 100% on the extracted feedback points.

2. GRADE BREAKDOWN (Rubrics/PBL Component Value Extraction):
   If the tutor feedback contains an explicit sub-scores breakdown, dimension grades, or weights (e.g., "Problem Framing & Contextual Understanding (40%): Very good (60-70)"), you MUST extract them into the "subScores" array. Do not return null if they exist in the feedback. If no such scores exist, set "subScores" to null.

3. HANDBOOK RUBRICS & ABSTRACT TAXONOMY TAGS EXTRACTION FLOW:
   Identify the core evaluation criteria from the course handbook, rubrics, or subScores breakdown.
   - SOURCING HIERARCHY & TWO-STEP REGIONAL TARGETING (CRITICAL):
     * TIER 1 (GRADE BREAKDOWN PRIORITY): If explicit subScores/grade breakdown exist in the feedback text, extract their exact dimension titles as Core Criteria. You MUST use 100% VERBATIM dimension titles directly from the breakdown text without any word count limits or length truncation.
     * TIER 2 (COURSE HANDBOOK REGIONAL MATCHING - NO LAZY FIRST TABLE): If NO subScores exist in the feedback text, scan the COURSE HANDBOOK CONTEXT for the official Rubric table corresponding to THIS specific evaluation phase:
       - MANDATE AGAINST LAZY FIRST-TABLE PICKING: DO NOT subconsciously or lazily read the first table encountered in the document! PDF handbooks often place the Interim/Formative table on early pages. You MUST scan section/chapter headings first to locate the specific section for 'Summative Assessment', 'Final Evaluation', 'Final Portfolio', or 'End-of-Term Assessment'. Only extract criteria from the rubric table situated INSIDE that Final/Summative section! You are STRICTLY FORBIDDEN from extracting criteria from 'Formative', 'Interim', 'Draft', or 'Mid-term' rubric tables when parsing a Summative evaluation!
       - CRITERIA EXTRACTION (VERBATIM CORE WORDS ONLY): Once the Summative/Final rubric table is located, extract the criterion titles from its 'Criteria' column. You MUST use the VERBATIM original wording or exact words extracted directly from the original phrase. ABSOLUTE PROHIBITION: You are STRICTLY FORBIDDEN from performing synonym replacements, semantic paraphrasing, or inventing external summary terms (e.g. do NOT substitute 'Problem Definition' with 'Problem Framing' if the text says 'Problem Definition'). Strip any "(ILO1)", "(ILO2)" or ILO numbers, convert "and" to "&", and preserve the original wording. Do NOT include page numbers or source metadata.

4. SEMANTIC OBSERVATIONS EXTRACTION & COMPLETE ANCHORING RULES:
    - SEMANTIC KEY POINT EXTRACTION & HIGH-FIDELITY ANCHORING (CRITICAL):
       * You MUST extract and anchor key points based strictly on the specific qualitative findings/comments. Do NOT force-merge unrelated comments just because they reside in the same paragraph or share the same tone.
       * MULTIPLE KEY POINTS PER PARAGRAPH (CRITICAL): If a single paragraph contains multiple distinct observations, qualitative points, or tools under discussion (even if they all share the same tone, such as all being critiques or all being strengths), you MUST extract them as separate, independent cards.
       * Your "exactPhrase" field MUST contain the COMPLETE, UN-TRUNCATED, VERBATIM passage of all sentences that directly support the identified key point (including any concrete examples and explanation sentences for that specific point).
       * Your "anchor" { "start", "end" } MUST cover precisely the span of these related sentences. Do NOT stretch the anchor to cover the entire paragraph if the paragraph contains other unrelated comments or sentences.
    - EXHAUSTIVE PARSING & NO OMISSION DIRECTIVE (CRITICAL):
      * You MUST read and analyze the entire feedback text from top to bottom. Avoid skipping or ignoring important qualitative paragraphs or sentences.
      * UNIVERSAL CONTRAST-SPLITTING ALGORITHM (ABSOLUTE MANDATE FOR ALL MATERIALS):
         You MUST apply this step-by-step parsing algorithm to every single paragraph in the feedback text:
         1. SCAN: Analyze the paragraph sentence-by-sentence.
         2. DETECT TRANSITION: Identify if there is a contrast transition sentence starting with or led by transition words (e.g., "However,", "but", "yet", "although", "whereas", "on the other hand", "; however,").
         3. SPLIT: If a transition is detected, you MUST split the paragraph at that transition point into exactly two contiguous parts:
            - Part A (Praise Part): From the first character of the paragraph to the character immediately before the transition word. Classify this verbatim chunk under "keyStrengths".
            - Part B (Critique Part): From the transition word to the last character/period of the paragraph (including all subsequent supporting explanations, examples, or requirements in that paragraph). Classify this verbatim chunk under "areasForImprovement".
         4. NO NESTED EXTRACTION (ABSOLUTE PROHIBITION ON OVERLAPPING): You are STRICTLY FORBIDDEN from performing nested extraction or creating overlapping anchors. Once Part B (Critique Part) is partitioned, you MUST treat it as a single, unified critique block. You MUST NOT extract any sub-clauses or sentences within Part B (such as praise clauses inside concession sentences, e.g., "While minimising investment risk is smart" in "While minimising investment risk is smart, you also need to ensure...") as a separate "keyStrengths" card. Extracting overlapping segments of text into multiple cards will break the frontend highlighting. Part A and Part B must be completely non-overlapping and contiguous.
         5. NO OMISSION: You MUST output BOTH Part A and Part B as separate cards. You are STRICTLY FORBIDDEN from omitting either part.
       * GENERALIZED CONTRAST-SPLITTING PATTERN & SCHEMA MAPPING (UNIVERSAL TEMPLATE):
         - Abstract Input Paragraph: "[Praise statement about Tool X]. [Transition word (e.g., However/But/Yet)], [critique statement about Tool X shortcoming]. [Supporting example or instruction sentence containing a concession clause, e.g., 'While doing Y is good, you must do Z']."
         - Expected Output Cards:
           1. In "keyStrengths" (Praise Part):
              * "title": "[Condense Praise Statement to 2-5 words]"
              * "exactPhrase": "[Praise statement about Tool X]."
              * "anchor": { "start": <start of paragraph>, "end": <index before transition> }
           2. In "areasForImprovement" (Critique Part):
              * "title": "[Condense Shortcoming to 2-5 words]"
              * "exactPhrase": "[Transition word (e.g., However/But/Yet)], [critique statement about Tool X]. [Supporting example or instruction sentence containing a concession clause, e.g., 'While doing Y is good, you must do Z']."
              * "anchor": { "start": <index of transition>, "end": <end of paragraph> }
         - Every contrast paragraph in ANY feedback text MUST be partitioned into exactly two adjacent, non-overlapping cards matching this structural template. Under no circumstances should the concession clause ('While doing Y is good') be re-extracted into keyStrengths.
       * TOPIC-SHIFT SEGMENTATION (ABSOLUTE MANDATE): If a single paragraph transitions from discussing one tool, artifact, or evaluation theme to another (e.g., from "Theory of Change (ToC)" or "stakeholders" to a "comparison chart", or from "indicator development" to "calculations"), you MUST split the paragraph at that transition point and generate separate, independent cards. NEVER merge discussions of different artifacts or tools into a single card, even if they share the same tone or reside in the same paragraph.
    - ACCURATE SEMANTIC CLASSIFICATION:
      * Accurately determine the type/category (keyStrengths vs areasForImprovement) based on the semantic tone of the block.
      * For contrast paragraphs, split at the transition word (e.g., "However,", "; however,", "but") into two contiguous sub-blocks: classify the praise sub-block as keyStrengths and the critique sub-block as areasForImprovement. Ensure their exactPhrase fields match their respective halves of the split paragraph verbatim.
    - CHRONOLOGICAL & STRUCTURAL ORDERING:
      * You MUST output the cards in both keyStrengths and areasForImprovement in the exact order they appear in the original text (chronological sequence of writing).
    - SCORE BREAKDOWN & HEADER STRIPPING (CRITICAL):
      * You must scan the feedback text, identify all structured grade breakdown rows (e.g. lines with weights like "(40%)", grade descriptions, and scores like "(60-70)"), and completely exclude them from the key strengths and areas for improvement analysis. Never extract overall dimension headers as key findings.
      * SECTION HEADINGS STRIPPING: Identify and completely exclude all standalone section/criterion headings, titles, or labels (e.g. "ToC and Concept Comparison", "Indicators and Calculations", "Organisational Context and SDG Goal", "Evaluation Details"). You are STRICTLY FORBIDDEN from treating headings as qualitative feedback comments or generating cards for them. Only extract from actual narrative prose paragraphs.
    - FEEDBACK NARRATIVE SANDBOXING: You must lock your qualitative analysis sandbox strictly to the free-text prose commentary (e.g. general feedback or descriptive review paragraphs).
    - KEY STRENGTHS (keyStrengths): Extract specific qualitative remarks praising the student's work from the narrative body. Provide a precise, unique, high-fidelity descriptive title in title-case summarizing the strength clearly from an evaluative perspective (e.g. "Thorough Conceptual Framework Design"), praiseHighlight (a micro-distillation of the praise passage), and anchor coordinates { start, end } representing the precise character offset range of the praise passage inside originalFeedbackText.
    - AREAS FOR IMPROVEMENT (areasForImprovement): Extract specific qualitative critiques or improvements. Provide a precise, unique, high-fidelity descriptive title in title-case summarizing the critique clearly from a weakness/deficit perspective (e.g. "ToC Causal Linkage & Input Gaps"), issueHighlight (micro-distillation of the issue passage), and anchor coordinates { start, end } representing the precise character offset range of the critique passage.

    - OBSERVATION TITLE SPECIFICATION (CRITICAL FOR ACCURACY & DE-DUPLICATION):
      * EVALUATIVE STYLE (STRENGTH / WEAKNESS PERSPECTIVE): Write titles from a performance feedback perspective describing the presence of an asset or deficit.
      * NO GENERIC CATEGORY TAGS: Avoid short generic tags. Each card's title MUST be a precise, context-rich, and unique summary of the thematic feedback observation.
      * STRICT TITLE WORD LIMIT (MAX 5 WORDS): Each title in keyStrengths and areasForImprovement MUST be strictly limited to AT MOST 5 WORDS (1 to 5 words maximum, e.g., "Robust Conceptual Design", "Unclear Scoring Rationale"). Never exceed 5 words under any circumstances.

The JSON object must strictly adhere to this TypeScript schema:
{
  "grade": string (the final grade, e.g., "A-", "B+", "A", "Pass"),
  "originalFeedbackText": string (the exact 100% complete original feedback text provided by the tutor, preserving all score breakdowns, weights, headers, and body paragraphs without stripping or removing any content),
  "globalSummary": string (the grade-feedback tone alignment overview paragraph),
  "subScores": Array<{
    "dimension": string,
    "weight": string | null,
    "score": string
  }> | null,
  "keyStrengths": Array<{
    "id": string (e.g., insight-1),
    "title": string (precise, unique descriptive title-case summary, e.g., "Robust Conceptual Design of Safety Audit Framework"),
    "associatedCriterion": string (Short 2-4 word abstract taxonomy tag, e.g., "Problem Framing", "User Research", "Scenarios & Tasks"),
    "isOfficialRubric": boolean (true if matching official handbook rubric, false if AI self-generalized),
    "praiseHighlight": string (micro-distillation of praise sentence),
    "exactPhrase": string (the complete, un-truncated, full verbatim passage or multi-sentence paragraph matching the original feedback text from start to end),
    "anchor": { "start": number, "end": number }
  }>,
  "areasForImprovement": Array<{
    "id": string (e.g., insight-2),
    "title": string (precise, unique descriptive title-case summary, e.g., "Align Theoretical Debates with Empirical Setup"),
    "associatedCriterion": string (Short 2-4 word abstract taxonomy tag, e.g., "Problem Framing", "User Research", "Scenarios & Tasks"),
    "isOfficialRubric": boolean (true if matching official handbook rubric, false if AI self-generalized),
    "issueHighlight": string (micro-distillation of issue sentence),
    "exactPhrase": string (the complete, un-truncated, full verbatim passage or multi-sentence paragraph matching the original feedback text from start to end),
    "anchor": { "start": number, "end": number }
  }>,
  "nextSteps": {
    "academicRecommendations": Array<{
      "id": string,
      "metaCapabilityTag": "Academic Writing" | "Structural & Causal Logic" | "Visual & Presentation Design" | "Research Methodology & Evidence" | "Project & Risk Management",
      "targetWeaknessTitle": string (brief summary of targeted weakness for internal mapping),
      "title": string (cross-project universal recommendation title),
      "description": string (universal academic standard description),
      "actionableGuidance": string (transferrable action guidance for future projects)
    }>,
    "advancedExplorations": Array<{
      "id": string,
      "topicTitle": string (macro exploration topic title, e.g., "Systems Thinking for Sustainable Transitions"),
      "explorationScope": string (in-depth narrative exploration scope and frontier direction guidance),
      "capabilityTag": string (specific topic capability tag, e.g., "Systems & Sustainability", "Research & Impact Metrics")
    }> | null
  }
}

4. NEXT STEPS & ACTIONABLE RECOMMENDATIONS (nextSteps):
   - GROUP 1: ACADEMIC ACTIONABLE RECOMMENDATIONS (academicRecommendations):
     * Directly analyze the extracted "areasForImprovement" (weaknesses).
     * QUANTITY & BOUNDARY RULE: The total count of academic recommendations MUST NOT EXCEED the number of extracted "areasForImprovement" (weaknesses), and must be at most 5 items in total.
     * META-CAPABILITY TAGGING RULE (CRITICAL): Every recommendation's "metaCapabilityTag" MUST be EXACTLY one of these 5 universal meta-capability categories:
       1. "Academic Writing" (academic terminology, acronyms, style, register)
       2. "Structural & Causal Logic" (logical flow, Theory of Change, causal mechanisms, narrative transitions)
       3. "Visual & Presentation Design" (slide density, data visualization, visual hierarchy, layout)
       4. "Research Methodology & Evidence" (scoring rubrics, empirical metrics, evidence grounding, criteria)
       5. "Project & Risk Management" (boundary conditions, risk management, feasibility, stakeholder scope)
     * CROSS-PROJECT TRANSFERABILITY RULE (ABSOLUTE PROHIBITION): You are STRICTLY FORBIDDEN from mentioning any specific domain proper nouns or task-specific project details. Frame every recommendation as a universal academic standard and transferable behavior for future academic tasks.

   - GROUP 2: ADVANCED LEARNING & EXPLORATION (advancedExplorations):
     * Generate 2-3 advanced exploration topics focused on long-term capability growth, project scalability, structural logic, and systemic risk analysis.
     * If COURSE HANDBOOK CONTEXT is provided, align topics with the handbook's standards. If absent, infer high-level transferable explorations based on feedback themes. Always populate "advancedExplorations" with 2-3 items.

To prevent breaking the frontend UI, your entire response MUST be a single parseable JSON object and NOTHING ELSE. Do not wrap it in any intro or outro prose. All keys, values, and text must be strictly in English.`;

export type MetaCapabilityTag = 
  | 'Academic Writing' 
  | 'Structural & Causal Logic' 
  | 'Visual & Presentation Design' 
  | 'Research Methodology & Evidence' 
  | 'Project & Risk Management';

export interface SummativeAcademicRecommendation {
  id: string;
  metaCapabilityTag: MetaCapabilityTag;
  targetWeaknessTitle: string;
  title: string;
  description: string;
  actionableGuidance: string;
}

export interface SummativeAdvancedExploration {
  id: string;
  topicTitle: string;
  explorationScope: string;
  capabilityTag?: string;
}

export interface SummativeNextSteps {
  academicRecommendations: SummativeAcademicRecommendation[];
  advancedExplorations?: SummativeAdvancedExploration[] | null;
}

export interface SummativeParsedResponse {
  projectId: string;
  date?: string;
  grade: string;
  isAutoCalculated?: boolean;
  originalFeedbackText: string;
  globalSummary: string;
  subScores: Array<{
    dimension: string;
    weight: string | null;
    score: string;
  }> | null;
  keyStrengths: Array<{
    id: string;
    title: string;
    praiseHighlight: string;
    exactPhrase?: string;
    anchor: { start: number; end: number };
  }>;
  areasForImprovement: Array<{
    id: string;
    title: string;
    issueHighlight: string;
    exactPhrase?: string;
    anchor: { start: number; end: number };
  }>;
  nextSteps?: SummativeNextSteps;
}

export const alignGlobalSummaryWithGrade = (summary: string, grade?: string | null): string => {
  if (!summary) return '';

  const cleanGrade = (grade && grade !== '?') ? grade.trim() : '';
  const gradePatternStr = `(?:[A-F][+-]?|Pass|Fail|Distinction|Merit|\\?|<\\d+|>\\d+|\\d+%)`;

  if (cleanGrade) {
    const article = /^[aeiou]/i.test(cleanGrade) ? 'an' : 'a';
    let aligned = summary;

    // Pattern 1: "This B+ submission", "This B+ draft", "This B+ project", "A B+ submission", "An A- paper"
    aligned = aligned.replace(
      new RegExp(`\\b(This|A|An|The)\\s+${gradePatternStr}\\s+(submission|draft|project|report|paper|essay|thesis|assessment|work)\\b`, 'gi'),
      `$1 ${cleanGrade} $2`
    );

    // Pattern 2: "earns a B+ grade", "securing a B+ grade", "achieves a B+ grade", "with a B+ grade", "receives a B+ grade"
    aligned = aligned.replace(
      new RegExp(`\\b(earns|secures|achieves|receives|gets|with)\\s+(?:a|an)?\\s+${gradePatternStr}\\s+(grade|score|mark|evaluation|level)?\\b`, 'gi'),
      `$1 ${article} ${cleanGrade} grade`
    );

    // Pattern 3: "a B+ grade", "an A- grade", "a B+ score", "a B+ mark"
    aligned = aligned.replace(
      new RegExp(`\\b(?:a|an)\\s+${gradePatternStr}\\s+(grade|score|mark|evaluation|level)\\b`, 'gi'),
      `${article} ${cleanGrade} $1`
    );

    // Pattern 4: "strong B+ grade", "solid B+", "final B+", "overall B+"
    aligned = aligned.replace(
      new RegExp(`\\b(strong|solid|final|overall)\\s+${gradePatternStr}\\b`, 'gi'),
      `$1 ${cleanGrade}`
    );

    return aligned;
  } else {
    // STRICT NO-GRADE MODE: Strip any invented grade references from summary completely!
    let sanitized = summary;

    // Pattern 1: "This B+ submission" -> "This submission"
    sanitized = sanitized.replace(
      new RegExp(`\\b(This|A|An|The)\\s+${gradePatternStr}\\s+(submission|draft|project|report|paper|essay|thesis|assessment|work)\\b`, 'gi'),
      '$1 $2'
    );

    // Pattern 2: "earns a B+ grade" / "securing a B+ grade" -> "demonstrates"
    sanitized = sanitized.replace(
      new RegExp(`\\b(earns|secures|achieves|receives|gets|with)\\s+(?:a|an)?\\s+${gradePatternStr}\\s+(?:grade|score|mark|evaluation|level)?\\b`, 'gi'),
      'demonstrates'
    );

    // Pattern 3: "a B+ grade" / "an A- grade" -> "the assessment"
    sanitized = sanitized.replace(
      new RegExp(`\\b(?:a|an)\\s+${gradePatternStr}\\s+(grade|score|mark|evaluation|level)\\b`, 'gi'),
      'the $1'
    );

    // Pattern 4: "strong B+" -> "strong"
    sanitized = sanitized.replace(
      new RegExp(`\\b(strong|solid|final|overall)\\s+${gradePatternStr}\\b`, 'gi'),
      '$1'
    );

    // Clean up any whitespace or punctuation artifacts
    sanitized = sanitized.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();

    return sanitized;
  }
};

export const generateMockSummativeParsedResponse = (
  rawText: string,
  handbookText?: string,
  userFinalGrade?: string
): SummativeParsedResponse => {
  // Normalize concatenated sentences like "clearer.Your ToC"
  const normalizedRaw = (rawText || '').replace(/([a-z0-9]+)\.([A-Z])/g, '$1. $2');
  const lines = normalizedRaw.split(/\r?\n/);
  const keyStrengths: any[] = [];
  const areasForImprovement: any[] = [];
  let strengthCount = 1;
  let improvementCount = 1;
  let searchCursor = 0;
  let currentCriterion = '';

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Detect section headers / criterion headers like "1.Problem definition and design rationale-Excellent"
    if (/^\d+[\s\.\)\-]+/.test(trimmedLine) || trimmedLine.includes('Rationale') || trimmedLine.includes('Prototyping') || trimmedLine.endsWith(':')) {
      const cleanHeader = trimmedLine.replace(/^\d+[\s\.\)\-]+/, '').replace(/[\-\–]\s*(Excellent|Good|Pass|Fail|Satisfactory).*$/i, '').trim();
      if (cleanHeader.length >= 4) {
        currentCriterion = cleanHeader;
      }
    }

    // Check if this line is a header (no punctuation at the end of the line and relatively short, or matches section headings)
    const hasPunctuation = /[.!?]$/.test(trimmedLine);
    const isHeader = trimmedLine.length < 65 && !hasPunctuation && 
                     (!/^(you|your|i |this|these|the |an |a )/i.test(trimmedLine) || 
                      trimmedLine.toLowerCase().includes('comparison') ||
                      trimmedLine.toLowerCase().includes('context') ||
                      trimmedLine.toLowerCase().includes('calculation') ||
                      trimmedLine.toLowerCase().includes('indicators') ||
                      trimmedLine.toLowerCase().includes('thinking') ||
                      trimmedLine.toLowerCase().includes('assessment') ||
                      trimmedLine.toLowerCase().includes('writing') ||
                      trimmedLine.toLowerCase().includes('discipline') ||
                      trimmedLine.toLowerCase().includes('rigor') ||
                      trimmedLine.toLowerCase().includes('synthesis') ||
                      trimmedLine.endsWith(':'));
    if (isHeader) return;

    // Split paragraph line into sentences
    const rawSentences = trimmedLine.match(/[^.!?]+[.!?]*/g) || [trimmedLine];
    const sentences: string[] = [];

    rawSentences.forEach((s) => {
      const trimmedS = s.trim();
      if (!trimmedS) return;
      sentences.push(trimmedS);
    });

    // Group sentences into semantic blocks within the paragraph
    // If a sentence starts with transition contrast words ("however", "but", "yet", "although", "though"),
    // OR starts with a topic shift keyword (e.g. "the comparison chart", "your toc", "the toc", "theory of change", "your impact indicators", "in your interventions"), start a new block.
    // Otherwise, append to current block to merge them and highlight the entire discussion region.
    const blocks: string[] = [];
    let currentBlock = '';

    sentences.forEach((s) => {
      const startsNewBlock = /^(however|but|yet|although|though|nevertheless|nonetheless)/i.test(s) ||
                             /^(the comparison chart|comparison chart|your toc|the toc|theory of change|in your interventions|your impact indicators|development of indicators|your back-of-the-envelope|indicators and calculations)/i.test(s);
      if (startsNewBlock && currentBlock.length > 0) {
        blocks.push(currentBlock.trim());
        currentBlock = s;
      } else {
        currentBlock = currentBlock ? currentBlock + ' ' + s : s;
      }
    });
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }

    // Process each merged block as a single thematic key point
    blocks.forEach((blockText) => {
      const trimmed = blockText.trim();
      if (trimmed.length < 10) return;

      const lower = trimmed.toLowerCase();
      
      // SCORE BREAKDOWN STRIPPING: Filter out headers and criteria score rows completely
      if (lower.startsWith('student:') || 
          lower.startsWith('project title:') || 
          lower.includes('overall assessment:') || 
          lower.includes('evaluation details:') ||
          lower.includes('grade:') ||
          /\(\d+%\)/.test(trimmed) ||               // matches e.g. "(40%)"
          /\(\d+-\d+\)/.test(trimmed) ||             // matches e.g. "(60-70)"
          /\d+\/\d+/.test(trimmed) ||                // matches e.g. "85/100"
          /^\d+[\s\.)\-]+/.test(trimmed) && trimmed.includes(':') // e.g. "1. Critical Thinking (Grade: 88/100):"
      ) {
        return;
      }

      const isGood = [
        'good', 'excellent', 'outstanding', 'well', 'robust', 'disciplined', 'praise', 
        'strong', 'insightful', 'exceptional', 'clearly', 'scoped', 'relevant', 'smart', 
        'referencing', 'calculations', 'explained', 'minimising', 'effective', 'solid', 
        'rigorous', 'thorough', 'useful', 'appropriate', 'clearer', 'positive', 'linked causally',
        'is discussed', 'presented', 'clever', 'articulated'
      ].some(w => lower.includes(w)) && !/would\s+have\s+been\s+good|would\s+be\s+good|could\s+have\s+been|should\s+have\s+been/i.test(lower);

      const isBad = [
        'lack', 'lacks', 'however', 'but', 'should', 'would have helped', 'help', 'polished', 
        'mismatch', 'typo', 'fail', 'subjective', 'weak', 'error', 'polish', 'dense', 'crowded', 
        'gap', 'gaps', 'difficult', 'unclear', 'not ', 'not', 'no ', 'without', 'missing', 
        'unclarified', 'unexplained', 'lower', 'harder', 'require', 'requires', 'unshared', 
        'incomplete', 'abrupt', 'excessive', 'imprecise', 'inadequate', 'unconsidered', 
        'harder to follow', 'earlier', 'further explanation', 'needs', 'need', 'brief', 'depth',
        'would have been good', 'would be good', 'could showcase', 'could include', 'should showcase', 'should include'
      ].some(w => lower.includes(w));

      let startOffset = rawText.indexOf(trimmed, searchCursor);
      if (startOffset === -1) {
        const cleanSub = trimmed.slice(0, Math.min(20, trimmed.length));
        startOffset = rawText.indexOf(cleanSub, searchCursor);
      }
      if (startOffset === -1) {
        startOffset = rawText.indexOf(trimmed);
      }
      if (startOffset === -1) startOffset = searchCursor;

      const endOffset = startOffset + trimmed.length;
      searchCursor = endOffset;

      let title = generateTitleFromSentence(trimmed);

      const isConstructive = ['however', 'but', 'brief', 'depth', 'could', 'ensure', 'consider', 'make', 'improve', 'recommend', 'suggest', 'discuss', 'introduce', 'earlier', 'helpful'].some(w => lower.includes(w)) || /^(however|but|should|could|would)/i.test(trimmed);

      if (isBad || isConstructive) {
        areasForImprovement.push({
          id: `improvement-${improvementCount++}`,
          title,
          issueHighlight: trimmed,
          exactPhrase: trimmed,
          associatedCriterion: currentCriterion || undefined,
          isOfficialRubric: Boolean(currentCriterion),
          anchor: { start: startOffset, end: endOffset }
        });
      } else {
        keyStrengths.push({
          id: `strength-${strengthCount++}`,
          title,
          praiseHighlight: trimmed,
          exactPhrase: trimmed,
          associatedCriterion: currentCriterion || undefined,
          isOfficialRubric: Boolean(currentCriterion),
          anchor: { start: startOffset, end: endOffset }
        });
      }
    });
  });

  if (keyStrengths.length === 0) {
    keyStrengths.push({
      id: 'strength-1',
      title: 'Conceptual Safety Design',
      praiseHighlight: 'The conceptual safety framework shows thorough design and validation.',
      anchor: { start: 0, end: rawText.length }
    });
  }

  const subScores: any[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Pattern 1: Dimension (Weight%): Score or Dimension (Weight%) - Score
    const weightMatch = /([^\n\r(]+)\s*\(\s*(\d+(?:\.\d+)?%?)\s*\)\s*[:=\-–]?\s*([^\n\r]+)/i.exec(trimmed);
    if (weightMatch) {
      const dimension = weightMatch[1].replace(/^\d+[\s\.)\-]+/, '').trim();
      const weight = weightMatch[2].trim().endsWith('%') ? weightMatch[2].trim() : `${weightMatch[2].trim()}%`;
      const score = weightMatch[3].replace(/^[:\-–\s]+/, '').replace(/[.\s]+$/, '').trim();
      subScores.push({ dimension, weight, score });
      return;
    }
    
    // Pattern 2: Dimension: Score
    const colonMatch = /([^\n\r:]+)\s*:\s*([^\n\r]+)/i.exec(trimmed);
    if (colonMatch) {
      const left = colonMatch[1].trim();
      const right = colonMatch[2].replace(/[.\s]+$/, '').trim();
      
      const leftLower = left.toLowerCase();
      if (!['student', 'project title', 'overall assessment', 'evaluation details', 'grade', 'overall grade', 'overallcomments', 'overall comments'].some(x => leftLower.includes(x)) && left.length < 60 && right.length < 50) {
        const dimension = left.replace(/^\d+[\s\.)\-]+/, '').trim();
        subScores.push({ dimension, weight: null, score: right });
        return;
      }
    }
    
    // Pattern 3: Dimension (Score) or Dimension (Grade: Score)
    const gradeMatch = /([^\n\r(]+)\s*\(\s*(Grade:\s*)?([^\n\r)]+)\s*\)/i.exec(trimmed);
    if (gradeMatch) {
      const left = gradeMatch[1].trim();
      const right = gradeMatch[3].trim();
      const leftLower = left.toLowerCase();
      if (!['student', 'project title', 'overall assessment', 'evaluation details', 'grade', 'overall grade'].some(x => leftLower.includes(x)) && left.length < 60 && right.length < 50) {
        const dimension = left.replace(/^\d+[\s\.)\-]+/, '').trim();
        subScores.push({ dimension, weight: null, score: right });
        return;
      }
    }
  });

  // STRICT GRADE PRIORITY:
  // 1. User input final grade if provided
  // 2. Explicit grade in text if present
  // 3. Otherwise: NO GRADE (empty string)
  const trimmedInputGrade = (userFinalGrade || '').trim();
  const textGradeMatch = rawText.match(/Grade:\s*([a-zA-Z0-9\-\+<>]+)/i) || rawText.match(/overallGrade:\s*([a-zA-Z0-9\-\+<>]+)/i);
  const textGrade = textGradeMatch ? textGradeMatch[1].trim() : '';

  let effectiveGrade = trimmedInputGrade || textGrade || '';
  let isAutoCalculated = false;

  if (!effectiveGrade || effectiveGrade === '?') {
    const computed = calculateWeightedGrade(subScores);
    if (computed) {
      effectiveGrade = computed;
      isAutoCalculated = true;
    }
  }

  const highestWeightScore = subScores.reduce((prev, current) => {
    const prevPct = prev.weight ? parseInt(prev.weight) : 0;
    const currPct = current.weight ? parseInt(current.weight) : 0;
    return currPct > prevPct ? current : prev;
  }, subScores[0] || null);

  const firstBadScore = subScores.find(s => s.score.toLowerCase().includes('fail') || s.score.toLowerCase().includes('satisfactory') || s.score.toLowerCase().includes('50-60') || s.score.toLowerCase().includes('poor') || s.score.toLowerCase().includes('<50')) || subScores[subScores.length - 1] || null;

  const topStrengthName = keyStrengths[0]?.title || (highestWeightScore ? highestWeightScore.dimension : 'conceptual safety framework design');
  const topWeaknessName = areasForImprovement[0]?.title || (firstBadScore ? firstBadScore.dimension : 'literature synthesis transitions');

  const articleStr = effectiveGrade ? (/^[aeiou]/i.test(effectiveGrade) ? 'an' : 'a') : '';
  const s1 = effectiveGrade
    ? `This submission achieves ${articleStr} ${effectiveGrade} grade overall.`
    : `This submission demonstrates a solid analytical foundation overall.`;
  const s2 = `The main strength lies in ${topStrengthName.toLowerCase()}.`;
  const s3 = `The primary area for refinement is ${topWeaknessName.toLowerCase()}.`;

  const rawSummary = `${s1} ${s2} ${s3}`;
  
  const globalSummary = alignGlobalSummaryWithGrade(rawSummary, effectiveGrade);

  // Generate Next Steps recommendations with Meta-Capability Tags & Cross-Project Transferability
  const metaTagPool: MetaCapabilityTag[] = [
    'Academic Writing',
    'Structural & Causal Logic',
    'Research Methodology & Evidence',
    'Visual & Presentation Design',
    'Project & Risk Management'
  ];

  const academicRecommendations: SummativeAcademicRecommendation[] = areasForImprovement.slice(0, 5).map((area, idx) => {
    const lowerTitle = area.title.toLowerCase();

    let metaTag: MetaCapabilityTag = 'Academic Writing';
    let recTitle = 'Standardize Domain Terminology & Nomenclature';
    let recDesc = 'To ensure unambiguous communication across technical documents, define specialized acronyms and domain terms explicitly upon first occurrence.';
    let guidance = 'Construct a dedicated glossary or introduce parenthetical definitions whenever introducing domain-specific abbreviations in future academic writing.';

    if (lowerTitle.includes('transition') || lowerTitle.includes('literature') || lowerTitle.includes('causal') || lowerTitle.includes('toc') || lowerTitle.includes('theory')) {
      metaTag = 'Structural & Causal Logic';
      recTitle = 'Establish Explicit Theoretical-to-Empirical Narrative Links';
      recDesc = 'Strengthen document cohesion by directly connecting theoretical review themes to empirical metric selection and evaluation hypotheses.';
      guidance = 'Map theoretical literature findings directly to empirical evaluation parameters before detailing experimental setups in future research.';
    } else if (lowerTitle.includes('rationale') || lowerTitle.includes('chart') || lowerTitle.includes('scoring') || lowerTitle.includes('rubric') || lowerTitle.includes('mismatch')) {
      metaTag = 'Research Methodology & Evidence';
      recTitle = 'Document Objective Scoring Benchmarks & Criteria';
      recDesc = 'Eliminate qualitative ambiguity by establishing transparent, documented evaluation rubrics and scoring benchmark matrices.';
      guidance = 'Define quantitative scoring rubrics and threshold criteria prior to analyzing empirical results in subsequent projects.';
    } else if (lowerTitle.includes('slides') || lowerTitle.includes('presentation') || lowerTitle.includes('visual') || lowerTitle.includes('dense') || lowerTitle.includes('subjective')) {
      metaTag = 'Visual & Presentation Design';
      recTitle = 'Optimize Visual Information Density & Executive Summary Layouts';
      recDesc = 'Avoid dense text blocks by pairing structured visual diagrams with concise executive takeaways for high-impact communication.';
      guidance = 'Limit presentation slides to high-level visual diagrams and bulleted summaries, placing detailed data tables in appendix materials.';
    } else if (lowerTitle.includes('edge-case') || lowerTitle.includes('prerequisite') || lowerTitle.includes('scope') || lowerTitle.includes('risk')) {
      metaTag = 'Project & Risk Management';
      recTitle = 'Formalize Boundary Condition & Risk Mitigation Scenarios';
      recDesc = 'Enhance research robustness by explicitly auditing edge cases, system prerequisite constraints, and potential operational risks.';
      guidance = 'Include a dedicated risk management matrix and boundary condition analysis when scoping complex technical frameworks.';
    } else {
      metaTag = metaTagPool[idx % metaTagPool.length];
    }

    const recId = `rec-${idx + 1}`;
    const initialNoteSaved = false;

    return {
      id: `rec-${idx + 1}`,
      metaCapabilityTag: metaTag,
      targetWeaknessTitle: area.title,
      title: recTitle,
      description: recDesc,
      actionableGuidance: guidance
    };
  });

  const defaultExplorations: SummativeAdvancedExploration[] = [
    {
      id: 'exp-1',
      topicTitle: 'Formal Safety Proofs & Closed-Loop Autonomous Simulation',
      explorationScope: 'Explore formal verification methodologies for autonomous maneuver safety boundaries.',
      capabilityTag: 'Research Methodology & Evidence'
    },
    {
      id: 'exp-2',
      topicTitle: 'Incorporating Scalability and Sensitivity Analysis',
      explorationScope: "Future roadmap sections should evaluate the model's elasticity, specifically identifying the variables that would require modification when transitioning from smaller pilot environments to high-density deployments.",
      capabilityTag: 'Project & Risk Management'
    }
  ];

  const advancedExplorations: SummativeAdvancedExploration[] = defaultExplorations;

  if (Array.isArray(keyStrengths)) {
    keyStrengths.forEach(k => {
      if (k.title) k.title = ensureMaxFiveWords(k.title);
    });
  }
  if (Array.isArray(areasForImprovement)) {
    areasForImprovement.forEach(a => {
      if (a.title) a.title = ensureMaxFiveWords(a.title);
    });
  }

  reanchorSummativeObservations(keyStrengths, areasForImprovement, rawText);
  postProcessFixSubClauseAnchors(keyStrengths, rawText, areasForImprovement);
  reanchorSummativeObservations(keyStrengths, areasForImprovement, rawText);

  return {
    projectId: '',
    grade: effectiveGrade || '?',
    isAutoCalculated,
    originalFeedbackText: rawText,
    globalSummary,
    subScores: subScores.length > 0 ? subScores.map(s => ({ ...s, dimension: formatDimensionTitle(s.dimension) })) : null,
    keyStrengths,
    areasForImprovement,
    nextSteps: {
      academicRecommendations,
      advancedExplorations
    }
  };
};

export const processSummativeFeedback = async (
  rawText: string,
  signal?: AbortSignal,
  handbookText?: string,
  assignmentText?: string,
  userFinalGrade?: string
): Promise<SummativeParsedResponse> => {
  // STRICT GRADE PRIORITY CHECK:
  // 1. User input final grade if provided
  // 2. Explicit grade in text if present
  // 3. Otherwise: NO GRADE (empty string)
  const trimmedInputGrade = (userFinalGrade || '').trim();
  const textGradeMatch = rawText.match(/Grade:\s*([a-zA-Z0-9\-\+<>]+)/i) || rawText.match(/overallGrade:\s*([a-zA-Z0-9\-\+<>]+)/i);
  const textGrade = textGradeMatch ? textGradeMatch[1].trim() : '';

  const effectiveGrade = trimmedInputGrade || textGrade || '';

  if (!genAI) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return generateMockSummativeParsedResponse(rawText, handbookText, userFinalGrade);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: SUMMATIVE_PARSER_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0
      }
    });

    let prompt = `Ingest and parse this final tutor feedback text into the requested structured JSON schema:\n\n${rawText}`;
    
    if (effectiveGrade) {
      prompt += `\n\n[CRITICAL OVERALL GRADE DIRECTIVE]: The overall grade for this submission is strictly: "${effectiveGrade}". You MUST set the "grade" field in your JSON response to "${effectiveGrade}". Inside "globalSummary", any grade reference MUST match "${effectiveGrade}" exactly (e.g. "This ${effectiveGrade} submission"). You are STRICTLY FORBIDDEN from stating any other grade (such as B+ or A).`;
    } else {
      prompt += `\n\n[CRITICAL NO-GRADE DIRECTIVE]: Neither user input nor the feedback text contains an overall grade. You are STRICTLY FORBIDDEN from inventing, guessing, or hallucinating any letter grade, percentage, or score (such as 'B+', 'A-', 'Pass', '80%') in globalSummary or anywhere else. Set 'grade' in JSON to '?' and write globalSummary purely qualitatively without mentioning any grade.`;
    }

    if (handbookText) {
      prompt += `\n\n[SUMMATIVE REGIONAL MATCHING DIRECTIVE]: You are parsing a SUMMATIVE / FINAL assessment. When inspecting COURSE HANDBOOK CONTEXT below, DO NOT lazily read the first table you encounter (which is often the Interim / Formative table on earlier pages). You MUST first scan the document headings to locate the specific section/chapter for 'Summative Assessment', 'Final Evaluation', 'Final Portfolio', or 'End of Term Assessment'. Only extract criteria from the rubric table situated INSIDE that Final/Summative section!\n\nCOURSE HANDBOOK CONTEXT:\n${handbookText}`;
    }
    if (assignmentText) {
      prompt += `\n\nSTUDENT ASSIGNMENT DRAFT CONTEXT:\n${assignmentText}`;
    }
    
    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    const responseText = response.text().trim();

    let cleanText = responseText;
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonRegex.exec(responseText);
    
    if (match && match[1]) {
      cleanText = match[1].trim();
    } else {
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    }
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText) as SummativeParsedResponse;
    if (parsed) {
      parsed.originalFeedbackText = rawText;
      parsed.grade = effectiveGrade || '?';
      if (parsed.globalSummary) {
        parsed.globalSummary = alignGlobalSummaryWithGrade(parsed.globalSummary, effectiveGrade);
      }
      if (Array.isArray(parsed.keyStrengths)) {
        parsed.keyStrengths.forEach(k => {
          if (k.title) k.title = ensureMaxFiveWords(k.title);
        });
      }
      if (Array.isArray(parsed.areasForImprovement)) {
        parsed.areasForImprovement.forEach(a => {
          if (a.title) a.title = ensureMaxFiveWords(a.title);
        });
      }
      reanchorSummativeObservations(parsed.keyStrengths || [], parsed.areasForImprovement || [], rawText);
      if (parsed.keyStrengths || parsed.areasForImprovement) {
        postProcessFixSubClauseAnchors(parsed.keyStrengths || [], rawText, parsed.areasForImprovement || []);
      }
      reanchorSummativeObservations(parsed.keyStrengths || [], parsed.areasForImprovement || [], rawText);
      return parsed;
    }
    throw new Error("Parsed JSON structure does not match expected SummativeParsedResponse shape");
  } catch (error) {
    console.error("processSummativeFeedback API call or JSON parse failed, returning dynamic fallback:", error);
    return generateMockSummativeParsedResponse(rawText, handbookText, userFinalGrade);
  }
};

/* ============================================================================
   5. DYNAMIC CAREER COMPETENCY ANALYSIS GENERATOR (GEMINI API INTEGRATION)
   ============================================================================ */

export interface DynamicCareerSkillComparison {
  skill: string;
  coreName: string;
  required: number;
  current: number;
  provenance: string;
  reasoning: string;
  industryTools: string[];
  proficiencyRequirement: string;
}

export interface DynamicCareerRoleAnalysis {
  id: string;
  title: string;
  category: string;
  matchScore: number;
  tagColor: string;
  industryOverview: string;
  coreDeliverables: string[];
  toolsStack: string[];
  skillComparisons: DynamicCareerSkillComparison[];
}

const CAREER_ANALYSIS_SYSTEM_INSTRUCTION = `You are a Principal Technical Recruiter and Staff Engineering Director in Silicon Valley. Your directive is to dissect an input target job role (in English) and produce a 100% domain-authentic, industry-accurate 6-competency alignment analysis.

CRITICAL INSTRUCTIONS FOR AUTHENTICITY (ABSOLUTELY NO GENERIC TEMPLATES):
1. **DO NOT generate generic terms** like "Core Domain Knowledge", "Technical Execution", "Problem Framing", "Design Engineering", "Quality Verification" unless explicitly customized with domain specifics.
2. **GENERATE 6 HYPER-SPECIFIC COMPETENCIES** that directly reflect the real technical, methodological, and domain tools used in this specific role in top tech/design companies (e.g. for "Robotics Engineer": "ROS2 Architecture", "Kinematics & Dynamics", "Sensor Fusion & SLAM", "Real-Time C++ Firmware", "Control Systems Theory", "Safety Protocol Audit").
3. For each competency:
   - "skill": Full authentic competency title (e.g., "Spatial Binaural Rendering", "ROS2 Navigation Pipeline", "LLM Evaluation & Evals")
   - "coreName": Concise 1-3 word radar axis tick label (strictly max 15 chars, e.g., "Spatial Audio", "ROS2 Pipeline", "LLM Evals", "C++ RTOS")
   - "required": Target required benchmark score (integer between 65 and 95)
   - "current": Student current mastery score (integer between 40 and 90)
   - "provenance": Relevant course code provenance string from an advanced interdisciplinary curriculum (e.g., "PDE-101 (Grade A)", "RES-301 (Grade A-)", "IXD-201 (Grade B+)")
   - "reasoning": A single natural, professional feedback sentence analyzing student current proficiency against target requirements. DO NOT use formulaic prefixes ("Gap:", "Target Met:"). DO NOT use formulaic suffixes ("to reach Target"). Write crisp, analytical, authentic review sentences.
   - "industryTools": Array of 3 to 4 specialized industry tools, frameworks, protocols, or advanced techniques for growth in this competency (e.g., ["Nav2 Path Planning", "Eigen Library", "Gazebo Simulation", "Behavior Trees"]).
   - "proficiencyRequirement": A crisp 1-sentence description of what an industry practitioner needs to demonstrate.
4. Role Metadata:
   - "title": Standardized professional title (e.g., "Robotics Software Engineer")
   - "category": Sector name (e.g., "ROBOTICS & AUTONOMY", "AUDIO & DSP SYSTEMS", "AI & DATA SYSTEMS", "HARDWARE & EMBEDDED", "UX & HUMAN FACTORS", "SPECIALIZED ENGINEERING")
   - "matchScore": Realistic overall match percentage integer (between 58 and 91)
   - "tagColor": Hex color matching sector vibe (e.g., "#0284C7", "#8B5CF6", "#10B981", "#EC4899", "#F59E0B")
   - "industryOverview": A 1-2 sentence executive overview of what this role does in modern product organizations.
   - "coreDeliverables": Array of 3 specific industry deliverables (e.g., ["ROS2 System Architecture", "Kinematic Simulation Models", "Safety Protocol Audits"])
   - "toolsStack": Array of 4-5 real-world software tools and frameworks (e.g., ["ROS2", "Gazebo", "C++20", "Python", "Docker"])

To prevent breaking the frontend UI, your entire response MUST be a single parseable JSON object and NOTHING ELSE. Do not wrap it in any intro or outro prose.`;

export const generateMockCareerRoleAnalysis = (targetRole: string): DynamicCareerRoleAnalysis => {
  const cleanRole = targetRole.trim() || 'Custom Target Role';
  const slug = cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  let category = 'SPECIALIZED ENGINEERING';
  let tagColor = '#00A3C4';
  let skillComparisons: DynamicCareerSkillComparison[] = [];
  let coreDeliverables: string[] = [];
  let toolsStack: string[] = [];

  if (slug.includes('robot') || slug.includes('auto') || slug.includes('control') || slug.includes('kinematic')) {
    category = 'ROBOTICS & AUTONOMY';
    tagColor = '#0284C7';
    coreDeliverables = ['ROS2 Navigation Pipeline Specs', 'Kinematic & Dynamic Simulation Models', 'Fail-Safe Safety Audit Matrix'];
    toolsStack = ['ROS2', 'Gazebo', 'Eigen C++', 'Python', 'Docker'];
    skillComparisons = [
      {
        skill: 'ROS2 Architecture & Middleware',
        coreName: 'ROS2 Middleware',
        required: 92,
        current: 78,
        provenance: 'IXD-201 (Grade A), IXD-202 (Grade B+)',
        reasoning: 'Demonstrates solid node graph architecture, with opportunities to optimize QoS publisher profiles and zero-copy IPC transport.',
        industryTools: ['ROS2 Nav2 Pipeline', 'FastDDS Middleware', 'Zero-Copy Transport', 'Node Lifecycle Management'],
        proficiencyRequirement: 'Architecting deterministic ROS2 node graphs with high-rate sensor feedback loops.'
      },
      {
        skill: 'Kinematics & Motion Control',
        coreName: 'Kinematics',
        required: 88,
        current: 72,
        provenance: 'PDE-101 (Grade A), PDE-102 (Grade B+)',
        reasoning: 'Proficient in forward kinematics, with scope to advance inverse trajectory optimization and joint trajectory constraints.',
        industryTools: ['MoveIt2 Motion Planning', 'Jacobian Matrix Solver', 'Trajectory Smoothing', 'Torque Control'],
        proficiencyRequirement: 'Solving 6-DOF inverse kinematics with real-time collision avoidance.'
      },
      {
        skill: 'Sensor Fusion & SLAM',
        coreName: 'Sensor Fusion',
        required: 90,
        current: 82,
        provenance: 'IXD-201 (Grade A)',
        reasoning: 'Effective Extended Kalman Filter tuning for IMU/Odometry, with potential to integrate LiDAR-Visual SLAM optimization.',
        industryTools: ['LiDAR-Visual SLAM', 'EKF Sensor Fusion', 'Point Cloud Library (PCL)', 'Occupancy Grid Mapping'],
        proficiencyRequirement: 'Fusing IMU, wheel encoder, and LiDAR telemetry for sub-centimeter localization.'
      },
      {
        skill: 'Real-Time C++ Firmware',
        coreName: 'C++ Firmware',
        required: 85,
        current: 80,
        provenance: 'IXD-202 (Grade B+)',
        reasoning: 'Confidently handles C++ memory management, with space to master lock-free ring buffers and RT-PREEMPT kernel threads.',
        industryTools: ['RT-PREEMPT Kernel', 'C++20 Concurrency', 'Lock-Free Queues', 'Hardware Abstraction Layer'],
        proficiencyRequirement: 'Writing thread-safe, hard real-time C++ drivers for actuator control.'
      },
      {
        skill: 'Control Systems Theory',
        coreName: 'Control Theory',
        required: 85,
        current: 65,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Understands PID loop tuning, with room to explore Model Predictive Control (MPC) and state-space regulation.',
        industryTools: ['Model Predictive Control (MPC)', 'State-Space Regulation', 'LQR Controller Tuning', 'Bode Stability'],
        proficiencyRequirement: 'Designing robust MPC controllers for dynamic balance under perturbations.'
      },
      {
        skill: 'Safety & Fail-Safe Protocols',
        coreName: 'Safety Protocols',
        required: 80,
        current: 85,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Establishes clear hardware emergency stop logic well-aligned with ISO 13849 functional safety standards.',
        industryTools: ['ISO 13849 Safety Audit', 'Emergency Watchdog Timers', 'Fault Tree Analysis', 'Fail-Safe Logic'],
        proficiencyRequirement: 'Implementing redundant, ISO-compliant safety shutdown protocols.'
      }
    ];
  } else if (slug.includes('audio') || slug.includes('dsp') || slug.includes('sound') || slug.includes('acoust')) {
    category = 'AUDIO & DSP SYSTEMS';
    tagColor = '#8B5CF6';
    coreDeliverables = ['Spatial Binaural Audio Engine Brief', 'Real-Time FIR/IIR DSP Filter Specs', 'Psychoacoustic Subjective Usability Reports'];
    toolsStack = ['Max/MSP', 'Wwise Engine', 'MATLAB DSP', 'Reaper DAW', 'Pure Data'];
    skillComparisons = [
      {
        skill: 'Spatial Binaural Rendering',
        coreName: 'Spatial Audio',
        required: 90,
        current: 85,
        provenance: 'IXD-202 (Grade B+)',
        reasoning: 'Strong foundation in HRTF convolution, with room to expand real-time dynamic room acoustics reflection modeling.',
        industryTools: ['HRTF Interpolation Algorithms', 'Dynamic Room Acoustics', 'Ambisonics Encoding', 'Head-Tracking Sync'],
        proficiencyRequirement: 'Building real-time binaural audio renderers with dynamic 6-DOF head-tracking.'
      },
      {
        skill: 'DSP Filter Architecture',
        coreName: 'DSP Filters',
        required: 88,
        current: 74,
        provenance: 'IXD-202 (Grade B+)',
        reasoning: 'Hands-on practice in IIR biquad filtering, with scope to advance fixed-point SIMD vector optimizations.',
        industryTools: ['Fixed-Point SIMD Math', 'Biquad Filter Design', 'Spectral Noise Suppression', 'FFT Overlap-Add'],
        proficiencyRequirement: 'Designing ultra-low-latency FIR/IIR digital filter cascades.'
      },
      {
        skill: 'Psychoacoustic Evaluation',
        coreName: 'Psychoacoustics',
        required: 85,
        current: 80,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Excels at masking threshold measurement, with potential to integrate formal MUSHRA subjective listening trials.',
        industryTools: ['MUSHRA Subjective Protocols', 'Auditory Masking Models', 'Loudness Standards (ITU-R BS.1770)', 'Perceptual Tuning'],
        proficiencyRequirement: 'Conducting double-blind listening tests to validate acoustic algorithms.'
      },
      {
        skill: 'Interactive Audio Engine Integration',
        coreName: 'Audio Engine',
        required: 82,
        current: 84,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Solid state-machine sound triggering, with opportunities to refine procedural sound synthesis graphs.',
        industryTools: ['Wwise SoundSeed Synthesis', 'Procedural Audio Graphs', 'Dynamic Bus Routing', 'Voice Management'],
        proficiencyRequirement: 'Integrating middleware sound engines into interactive real-time runtime environments.'
      },
      {
        skill: 'Transducer & Acoustic Tuning',
        coreName: 'Transducers',
        required: 80,
        current: 68,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Understands driver frequency response curve measurement, with space to master micro-enclosure acoustic chamber DFM.',
        industryTools: ['Klippel Distortion Analysis', 'Chamber Resonance Tuning', 'Enclosure DFM Snap-Fits', 'Acoustic Mesh Tuning'],
        proficiencyRequirement: 'Tuning speaker driver enclosures for minimal harmonic distortion.'
      },
      {
        skill: 'Real-Time Signal Pipeline',
        coreName: 'Signal Pipeline',
        required: 85,
        current: 75,
        provenance: 'IXD-201 (Grade A)',
        reasoning: 'Effective ring-buffer audio callback handling, with potential to minimize double-buffer DMA latency.',
        industryTools: ['DMA Callback Optimization', 'Jitter-Free Audio Ring-Buffers', 'ASIO/CoreAudio Drivers', 'Latency Profiling'],
        proficiencyRequirement: 'Achieving sub-5ms round-trip audio input/output processing.'
      }
    ];
  } else if (slug.includes('ai') || slug.includes('data') || slug.includes('ml') || slug.includes('llm') || slug.includes('intelligence')) {
    category = 'AI & DATA SYSTEMS';
    tagColor = '#EC4899';
    coreDeliverables = ['LLM Evals Benchmark Matrix', 'RAG Retrieval System Architecture Specs', 'Inference Latency & Cost Optimization Brief'];
    toolsStack = ['PyTorch', 'LangChain', 'Pinecone Vector DB', 'Python', 'Weights & Biases'];
    skillComparisons = [
      {
        skill: 'Model Evaluation & Benchmark Evals',
        coreName: 'Model Evals',
        required: 92,
        current: 78,
        provenance: 'RES-301 (Grade A-), IXD-202 (Grade B+)',
        reasoning: 'Solid automated eval pipeline setup, with space to expand adversarial red-teaming and hallucination scoring.',
        industryTools: ['Automated LLM Evals', 'Adversarial Red-Teaming', 'Semantic Hallucination Scoring', 'Prompt Regression Test'],
        proficiencyRequirement: 'Designing rigorous quantitative eval rubrics for generative model outputs.'
      },
      {
        skill: 'RAG & Context Architecture',
        coreName: 'RAG Architecture',
        required: 90,
        current: 82,
        provenance: 'IXD-201 (Grade A)',
        reasoning: 'Proficient in vector embedding retrieval, with scope to advance hybrid sparse-dense re-ranking pipelines.',
        industryTools: ['Hybrid Sparse-Dense Search', 'Cohere Re-ranking Models', 'Chunking Strategy Optimization', 'Vector Indexing'],
        proficiencyRequirement: 'Architecting multi-stage RAG retrieval pipelines with sub-200ms latency.'
      },
      {
        skill: 'Inference Latency & Cost Tradeoffs',
        coreName: 'Inference Cost',
        required: 85,
        current: 70,
        provenance: 'PDE-103 (Grade B)',
        reasoning: 'Understands token cost metrics, with opportunities to implement speculative decoding and model distillation tradeoffs.',
        industryTools: ['Speculative Decoding', 'Model Distillation Tradeoffs', 'Token Cost Modeling', 'Cache KV Optimization'],
        proficiencyRequirement: 'Optimizing token throughput while cutting API inference costs by 40%.'
      },
      {
        skill: 'AI Governance & Moderation',
        coreName: 'AI Governance',
        required: 80,
        current: 85,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Strong ethical boundary framing, well-aligned with enterprise AI safety guidelines and bias mitigation.',
        industryTools: ['Guardrails AI Filtering', 'Bias Mitigation Audits', 'PII Anonymization Rules', 'Compliance Matrix'],
        proficiencyRequirement: 'Implementing strict guardrails for safety, privacy, and bias compliance.'
      },
      {
        skill: 'Data Pipeline Engineering',
        coreName: 'Data Pipeline',
        required: 85,
        current: 72,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Handles basic dataset cleaning, with room to scale automated ETL pipeline validation and deduplication.',
        industryTools: ['Automated ETL Pipeline', 'Data Deduplication Algorithms', 'Synthetic Dataset Generation', 'Feature Store'],
        proficiencyRequirement: 'Engineering clean, automated dataset pipelines for continuous fine-tuning.'
      },
      {
        skill: 'Prompt Architecture & Specs',
        coreName: 'Prompt Specs',
        required: 82,
        current: 88,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Excels at zero-shot and few-shot prompt formulation, producing reliable structured JSON model responses.',
        industryTools: ['Few-Shot Schema Formatting', 'System Instruction Tuning', 'JSON Mode Enforcement', 'Prompt Versioning'],
        proficiencyRequirement: 'Crafting deterministic, structured system prompts for complex agent workflows.'
      }
    ];
  } else if (slug.includes('design') || slug.includes('ux') || slug.includes('research') || slug.includes('human')) {
    category = 'UX & HUMAN FACTORS';
    tagColor = '#10B981';
    coreDeliverables = ['Longitudinal User Insight Synthesis Brief', 'Biomechanical Ergonomic Audit', 'SUS Usability Benchmark Report'];
    toolsStack = ['Dovetail', 'Figma', 'Qualtrics', 'Tobii Eye Tracking', 'Lookback.io'];
    skillComparisons = [
      {
        skill: 'Design Research Methodologies',
        coreName: 'Design Research',
        required: 92,
        current: 86,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Demonstrates solid foundational research design, with opportunities to deepen longitudinal study modeling and behavioral telemetry.',
        industryTools: ['Longitudinal Study Design', 'Behavioral Telemetry', 'Statistical Power Analysis', 'Research Ops Architecture'],
        proficiencyRequirement: 'Designing end-to-end qualitative & quantitative research protocols for complex domains.'
      },
      {
        skill: 'User Insights & Synthesis',
        coreName: 'User Insights',
        required: 90,
        current: 84,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Excels at thematic affinity mapping and persona creation, while strategic opportunity mapping provides a strong growth trajectory.',
        industryTools: ['Longitudinal Insight Tracking', 'Strategic Opportunity Mapping', 'Behavioral Pattern Abstraction', 'Persona Validation'],
        proficiencyRequirement: 'Synthesizing 30+ raw interview transcripts into actionable product architecture briefs.'
      },
      {
        skill: 'Strategic Problem Framing',
        coreName: 'Problem Framing',
        required: 85,
        current: 82,
        provenance: 'RES-301 (Grade A-), PDE-103 (Grade B)',
        reasoning: 'Frames user friction points effectively, with opportunity to elevate strategic opportunity mapping for executive alignment.',
        industryTools: ['Strategic Opportunity Mapping', 'Business Goal Alignment', 'Executive Communication', 'Problem Scoping'],
        proficiencyRequirement: 'Formulating crisp research questions that guide product strategy.'
      },
      {
        skill: 'Concept Ideation & Speculative Design',
        coreName: 'Concept Ideation',
        required: 80,
        current: 85,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Displays creative concept generation and speculative design capabilities well-aligned with industry research practices.',
        industryTools: ['Speculative Design', 'Co-Creation Facilitation', 'Concept Benchmarking', 'Value Alignment'],
        proficiencyRequirement: 'Rapidly sketching solution concepts directly responding to user insights.'
      },
      {
        skill: 'Ergonomics & Human Factors',
        coreName: 'Ergonomics',
        required: 80,
        current: 60,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Establishes clear physical interaction usability, with scope to integrate cognitive workload assessment and accessibility standards.',
        industryTools: ['Cognitive Workload Assessment', 'Accessibility Standards', 'Usability Metrics', 'Biomechanical Clearance'],
        proficiencyRequirement: 'Measuring physical strain, cognitive load, and accessibility fit.'
      },
      {
        skill: 'User Testing & Usability Benchmarking',
        coreName: 'User Testing',
        required: 88,
        current: 64,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Hands-on experience in qualitative user testing, with opportunities to incorporate formal lab metrics and biometric evaluation.',
        industryTools: ['Lab Testing Protocols', 'Quantitative SUS Analytics', 'Biometric Heatmap Analysis', 'Usability Benchmarking'],
        proficiencyRequirement: 'Conducting lab usability tests with quantitative SUS metrics and eye-tracking heatmaps.'
      }
    ];
  } else {
    category = 'SPECIALIZED ENGINEERING';
    tagColor = '#00A3C4';
    coreDeliverables = [`${cleanRole} Technical Specifications`, 'Cross-Domain System Architecture Schematics', 'Verification & Test Audit Matrix'];
    toolsStack = ['SolidWorks CAD', 'Figma', 'System Analytics', 'Prototyping Rigs', 'Python'];
    skillComparisons = [
      {
        skill: 'System Architecture & Integration',
        coreName: 'System Arch',
        required: 90,
        current: 78,
        provenance: 'PDE-102 (Grade B+), IXD-201 (Grade A)',
        reasoning: 'Demonstrates solid structural system modeling, with opportunities to deepen scalable architecture patterns and real-time validation.',
        industryTools: ['Scalable Architecture Design', 'Real-Time Telemetry', 'Fault Tolerance Modeling', 'System Integration'],
        proficiencyRequirement: 'Designing robust, end-to-end multi-module technical architectures under complex constraints.'
      },
      {
        skill: 'Parametric DFM CAD Modeling',
        coreName: 'DFM CAD',
        required: 85,
        current: 82,
        provenance: 'PDE-101 (Grade A), PDE-103 (Grade B)',
        reasoning: 'Confidently executes functional 3D CAD models, with space to advance GD&T assembly tolerancing and DFM injection molding rules.',
        industryTools: ['GD&T Assembly Tolerancing', 'DFM Injection Molding', 'Material Trade-off Analysis', 'Finite Element Analysis'],
        proficiencyRequirement: 'Translating design specifications into DFM-ready CAD assemblies.'
      },
      {
        skill: 'Behavioral Telemetry Analytics',
        coreName: 'Telemetry',
        required: 82,
        current: 85,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Displays strong telemetry log analysis well-aligned with modern quantitative product validation metrics.',
        industryTools: ['Log Telemetry Processing', 'Usage Funnel Analytics', 'Automated Anomaly Detection'],
        proficiencyRequirement: 'Analyzing quantitative telemetry data to optimize product performance.'
      },
      {
        skill: 'Strategic Problem Framing',
        coreName: 'Problem Framing',
        required: 85,
        current: 80,
        provenance: 'RES-301 (Grade A-), PDE-103 (Grade B)',
        reasoning: 'Frames key problem boundaries effectively, with opportunity to elevate strategic opportunity mapping for executive alignment.',
        industryTools: ['Strategic Opportunity Mapping', 'Business Goal Alignment', 'Executive Scoping'],
        proficiencyRequirement: 'Formulating crisp strategic problem statements that align technical capabilities with business goals.'
      },
      {
        skill: 'Quantitative Usability Metrics',
        coreName: 'Usability Metrics',
        required: 88,
        current: 72,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Establishes clear experimental setup logic, with room to incorporate formal lab metric evaluation and statistical rigor.',
        industryTools: ['Statistical Power Analysis', 'Formal Lab Protocols', 'Biometric Heatmap Analysis'],
        proficiencyRequirement: 'Executing empirical evaluation to validate design performance.'
      },
      {
        skill: 'Functional Physical Prototyping',
        coreName: 'Prototyping',
        required: 80,
        current: 84,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Excels at rapid functional prototype iteration, bringing physical-digital interaction concepts to life.',
        industryTools: ['Rapid CNC Machining', '3D Printing Tolerances', 'Functional Benchmarking'],
        proficiencyRequirement: 'Rapidly producing functional physical-digital prototypes.'
      }
    ];
  }

  return {
    id: `role-custom-${slug}`,
    title: cleanRole.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category,
    matchScore: 78,
    tagColor,
    industryOverview: `Synthesizes multidisciplinary design, engineering, and validation frameworks to deliver high-impact ${cleanRole} solutions.`,
    coreDeliverables,
    toolsStack,
    skillComparisons
  };
};

export const generateCareerRoleAnalysis = async (
  targetRole: string,
  signal?: AbortSignal
): Promise<DynamicCareerRoleAnalysis> => {
  const cleanRole = targetRole.trim();
  if (!cleanRole) {
    return generateMockCareerRoleAnalysis('Custom Target Role');
  }

  if (!genAI) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateMockCareerRoleAnalysis(cleanRole);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: CAREER_ANALYSIS_SYSTEM_INSTRUCTION
    });

    const prompt = `Perform a comprehensive competency alignment and career spectrum analysis for the following target job role (in English):\n\nTarget Role: "${cleanRole}"\n\nReturn the structured JSON output as specified.`;

    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    const responseText = response.text().trim();

    let cleanText = responseText;
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonRegex.exec(responseText);

    if (match && match[1]) {
      cleanText = match[1].trim();
    } else {
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    }
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText) as DynamicCareerRoleAnalysis;
    if (parsed && Array.isArray(parsed.skillComparisons) && parsed.skillComparisons.length > 0) {
      parsed.id = `role-api-${cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      parsed.title = parsed.title || cleanRole;
      return parsed;
    }
    throw new Error("Parsed JSON structure does not match expected DynamicCareerRoleAnalysis shape");
  } catch (error) {
    console.error("generateCareerRoleAnalysis API call or JSON parse failed, returning dynamic fallback:", error);
    return generateMockCareerRoleAnalysis(cleanRole);
  }
};

