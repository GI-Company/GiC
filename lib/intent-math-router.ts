export type CalculatorSolvedRoute = {
  intent: 'math';
  status: 'solved';
  confidence: 'high';
  operation: string;
  expression: string;
  result: number;
  resultText: string;
};

export type CalculatorClarifyRoute = {
  intent: 'math';
  status: 'clarify';
  confidence: 'high' | 'medium';
  reason: string;
};

export type MathRoute =
  | { intent: 'chat' }
  | CalculatorSolvedRoute
  | CalculatorClarifyRoute;

const MAX_ABS_RESULT = 1e15;
const MAX_EXPRESSION_LENGTH = 256;

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const SCALE_NUMBERS: Record<string, number> = {
  hundred: 100,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
};

const NUMBER_WORDS = [
  ...Object.keys(SMALL_NUMBERS),
  ...Object.keys(SCALE_NUMBERS),
  'and', 'point', 'negative',
];

const NUMBER_WORD_PATTERN = new RegExp(
  `\\b(?:${NUMBER_WORDS.join('|')})(?:[\\s-]+(?:${NUMBER_WORDS.join('|')}))*\\b`,
  'gi',
);

function parseIntegerWords(words: string[]): number | null {
  let total = 0;
  let current = 0;
  let sawNumber = false;

  for (const word of words) {
    if (word === 'and') continue;
    if (word in SMALL_NUMBERS) {
      current += SMALL_NUMBERS[word];
      sawNumber = true;
      continue;
    }
    if (word === 'hundred') {
      current = (current || 1) * 100;
      sawNumber = true;
      continue;
    }
    if (word in SCALE_NUMBERS) {
      const scale = SCALE_NUMBERS[word];
      if (scale >= 1_000) {
        total += (current || 1) * scale;
        current = 0;
        sawNumber = true;
        continue;
      }
    }
    return null;
  }

  return sawNumber ? total + current : null;
}

function parseNumberWords(raw: string): number | null {
  const words = raw.toLowerCase().replace(/-/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length || words.every((word) => word === 'and')) return null;

  let sign = 1;
  if (words[0] === 'negative') {
    sign = -1;
    words.shift();
  }

  const pointIndex = words.indexOf('point');
  if (pointIndex >= 0) {
    const wholeWords = words.slice(0, pointIndex);
    const fractionWords = words.slice(pointIndex + 1);
    const whole = wholeWords.length ? parseIntegerWords(wholeWords) : 0;
    if (whole == null || !fractionWords.length) return null;
    const digits: string[] = [];
    for (const word of fractionWords) {
      if (!(word in SMALL_NUMBERS) || SMALL_NUMBERS[word] > 9) return null;
      digits.push(String(SMALL_NUMBERS[word]));
    }
    return sign * (whole + Number(`0.${digits.join('')}`));
  }

  const integer = parseIntegerWords(words);
  return integer == null ? null : sign * integer;
}

export function normalizeNumberWords(input: string): string {
  return input.replace(NUMBER_WORD_PATTERN, (match) => {
    const parsed = parseNumberWords(match);
    return parsed == null ? match : String(parsed);
  });
}

type Token = { kind: 'number'; value: number } | { kind: 'op'; value: string };

function tokenizeExpression(expression: string): Token[] {
  if (expression.length > MAX_EXPRESSION_LENGTH) throw new Error('Expression is too long.');
  const compact = expression.replace(/\s+/g, '');
  const tokens: Token[] = [];
  let index = 0;

  while (index < compact.length) {
    const char = compact[index];
    if ('+-*/^()%'.includes(char)) {
      tokens.push({ kind: 'op', value: char });
      index += 1;
      continue;
    }

    const match = compact.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
    if (!match) throw new Error('Unsupported character in expression.');
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new Error('Invalid number.');
    tokens.push({ kind: 'number', value });
    index += match[0].length;
  }

  return tokens;
}

class ExpressionParser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    const value = this.parseAddSub();
    if (this.index !== this.tokens.length) throw new Error('Unexpected token.');
    return checked(value);
  }

  private peekOp(value?: string): boolean {
    const token = this.tokens[this.index];
    return token?.kind === 'op' && (value == null || token.value === value);
  }

  private consumeOp(value: string): boolean {
    if (!this.peekOp(value)) return false;
    this.index += 1;
    return true;
  }

  private parseAddSub(): number {
    let value = this.parseMulDiv();
    while (true) {
      if (this.consumeOp('+')) value = checked(value + this.parseMulDiv());
      else if (this.consumeOp('-')) value = checked(value - this.parseMulDiv());
      else return value;
    }
  }

  private parseMulDiv(): number {
    let value = this.parsePower();
    while (true) {
      if (this.consumeOp('*')) value = checked(value * this.parsePower());
      else if (this.consumeOp('/')) {
        const divisor = this.parsePower();
        if (divisor === 0) throw new Error('Division by zero.');
        value = checked(value / divisor);
      } else return value;
    }
  }

  private parsePower(): number {
    let value = this.parseUnary();
    if (this.consumeOp('^')) value = checked(value ** this.parsePower());
    return value;
  }

  private parseUnary(): number {
    if (this.consumeOp('+')) return this.parseUnary();
    if (this.consumeOp('-')) return checked(-this.parseUnary());
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();
    while (this.consumeOp('%')) value = checked(value / 100);
    return value;
  }

  private parsePrimary(): number {
    const token = this.tokens[this.index];
    if (token?.kind === 'number') {
      this.index += 1;
      return token.value;
    }
    if (this.consumeOp('(')) {
      const value = this.parseAddSub();
      if (!this.consumeOp(')')) throw new Error('Unclosed parenthesis.');
      return value;
    }
    throw new Error('Expected a number.');
  }
}

function checked(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Result is not finite.');
  if (Math.abs(value) > MAX_ABS_RESULT) throw new Error('Result is outside the supported range.');
  return value;
}

export function evaluateExpression(expression: string): number {
  return new ExpressionParser(tokenizeExpression(expression)).parse();
}

export function formatNumber(value: number): string {
  if (Object.is(value, -0)) value = 0;
  if (Number.isInteger(value)) return String(value);
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

function solved(operation: string, expression: string, result: number): CalculatorSolvedRoute {
  return {
    intent: 'math',
    status: 'solved',
    confidence: 'high',
    operation,
    expression,
    result,
    resultText: formatNumber(result),
  };
}

function solve(operation: string, expression: string): CalculatorSolvedRoute | CalculatorClarifyRoute {
  try {
    return solved(operation, expression, evaluateExpression(expression));
  } catch (cause) {
    return {
      intent: 'math',
      status: 'clarify',
      confidence: 'high',
      reason: cause instanceof Error ? cause.message : 'The calculation could not be evaluated safely.',
    };
  }
}

function numbersIn(input: string): number[] {
  const matches = input.match(/[-+]?(?:\d+(?:\.\d+)?|\.\d+)/g) ?? [];
  return matches.map(Number).filter(Number.isFinite);
}

function mathIntentLikely(input: string): boolean {
  const hasNumber = /\d/.test(input) || NUMBER_WORD_PATTERN.test(input);
  NUMBER_WORD_PATTERN.lastIndex = 0;
  if (!hasNumber) return /\b(square root|squared|cubed)\b/i.test(input);
  return /(?:[+*/^%=]|\d\s*-\s*\d)|\b(?:add|plus|sum|total|altogether|combined|minus|subtract|difference|left|remain|remaining|lost|gave|spent|used|remove|times|multiply|product|each|per|divide|divided|shared|split|quotient|percent|percentage|discount|tip|tax|average|mean|rate|cost|price|half|quarter|how many|how much|calculate|compute|evaluate)\b/i.test(input);
}

function directExpression(input: string): string | null {
  let candidate = input.toLowerCase().trim();
  candidate = candidate
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\bmultiplied\s+by\b/g, '*')
    .replace(/\btimes\b/g, '*')
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\bdivided\s+by\b/g, '/')
    .replace(/\bto\s+the\s+power\s+of\b/g, '^')
    .replace(/\b(?:what\s+is|calculate|compute|evaluate|please|can\s+you|could\s+you|tell\s+me)\b/g, ' ')
    .replace(/[?$=]/g, ' ')
    .trim();

  if (!/[+*/^%-]/.test(candidate)) return null;
  if (/[a-z]/i.test(candidate)) return null;
  if (!/\d/.test(candidate)) return null;
  if (!/^[\d.eE+\-*/^%()\s]+$/.test(candidate)) return null;
  return candidate;
}

function twoNumberPattern(input: string, pattern: RegExp): [number, number] | null {
  const match = input.match(pattern);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
}

export function routeMathIntent(rawMessage: string): MathRoute {
  const original = rawMessage.trim();
  if (!original) return { intent: 'chat' };

  const normalized = normalizeNumberWords(original)
    .replace(/(?<=\d),(?=\d{3}\b)/g, '')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');
  const lower = normalized.toLowerCase();

  if (!mathIntentLikely(lower)) return { intent: 'chat' };

  let match = lower.match(/\bsquare\s+root\s+of\s+(-?\d+(?:\.\d+)?)\b/);
  if (match) {
    const value = Number(match[1]);
    if (value < 0) return { intent: 'math', status: 'clarify', confidence: 'high', reason: 'Square root of a negative number is outside the real-number calculator.' };
    return solved('square_root', `sqrt(${value})`, Math.sqrt(value));
  }

  match = lower.match(/\b(-?\d+(?:\.\d+)?)\s+(squared|cubed)\b/);
  if (match) {
    const value = Number(match[1]);
    const power = match[2] === 'squared' ? 2 : 3;
    return solve('power', `${value}^${power}`);
  }

  match = lower.match(/\b(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(-?\d+(?:\.\d+)?)\b/);
  if (match) return solve('percent_of', `(${match[1]}/100)*${match[2]}`);

  match = lower.match(/\bwhat\s+percent(?:age)?\s+(?:is|of)?\s*(-?\d+(?:\.\d+)?)\s+(?:of|out\s+of)\s+(-?\d+(?:\.\d+)?)\b/);
  if (match) return solve('percentage', `(${match[1]}/${match[2]})*100`);

  match = lower.match(/\b(?:increase|raise)\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)\s*%/);
  if (match) return solve('percent_increase', `${match[1]}*(1+${match[2]}/100)`);

  match = lower.match(/\b(?:decrease|reduce)\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)\s*%/);
  if (match) return solve('percent_decrease', `${match[1]}*(1-${match[2]}/100)`);

  match = lower.match(/\b(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s+discount\s+(?:on|off)\s+\$?(-?\d+(?:\.\d+)?)/);
  if (match) return solve('discount_total', `${match[2]}*(1-${match[1]}/100)`);

  match = lower.match(/\b(?:tip|tax)\s+(?:of|at)\s+(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s+(?:on|of)\s+\$?(-?\d+(?:\.\d+)?)/);
  if (match) return solve('percent_amount', `(${match[1]}/100)*${match[2]}`);

  match = lower.match(/\$?(-?\d+(?:\.\d+)?)[^.!?]{0,40}?(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s+off\b/);
  if (match) return solve('discount_total', `${match[1]}*(1-${match[2]}/100)`);

  match = lower.match(/\b(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)\s+of\s+(-?\d+(?:\.\d+)?)\b/);
  if (match) return solve('fraction_of', `(${match[1]}/${match[2]})*${match[3]}`);

  match = lower.match(/\b(half|quarter)\s+of\s+(-?\d+(?:\.\d+)?)\b/);
  if (match) return solve('fraction_of', `${match[1] === 'half' ? '0.5' : '0.25'}*${match[2]}`);

  const direct = directExpression(normalized);
  if (direct) return solve('expression', direct);

  const addPair = twoNumberPattern(lower, /\b(?:add|sum\s+of)\s+\$?(-?\d+(?:\.\d+)?)\s+(?:and|to)\s+\$?(-?\d+(?:\.\d+)?)/);
  if (addPair) return solve('addition', `${addPair[0]}+${addPair[1]}`);

  const subtractFrom = twoNumberPattern(lower, /\bsubtract\s+\$?(-?\d+(?:\.\d+)?)\s+from\s+\$?(-?\d+(?:\.\d+)?)/);
  if (subtractFrom) return solve('subtraction', `${subtractFrom[1]}-${subtractFrom[0]}`);

  const multiplyPair = twoNumberPattern(lower, /\b(?:multiply|product\s+of)\s+\$?(-?\d+(?:\.\d+)?)\s+(?:by|and)\s+\$?(-?\d+(?:\.\d+)?)/);
  if (multiplyPair) return solve('multiplication', `${multiplyPair[0]}*${multiplyPair[1]}`);

  const dividePair = twoNumberPattern(lower, /\bdivide\s+\$?(-?\d+(?:\.\d+)?)\s+by\s+\$?(-?\d+(?:\.\d+)?)/);
  if (dividePair) return solve('division', `${dividePair[0]}/${dividePair[1]}`);

  const values = numbersIn(lower);

  match = lower.match(/\b(\d+(?:\.\d+)?)\s+[^.!?]{0,50}?\bcost(?:s)?\s+\$?(\d+(?:\.\d+)?)[.!?]?\s*(?:what|how\s+much)[^.!?]{0,70}?\b(\d+(?:\.\d+)?)\b/);
  if (match) return solve('proportional_cost', `(${match[2]}/${match[1]})*${match[3]}`);

  if (/\baverage|\bmean\b/.test(lower) && values.length >= 2 && values.length <= 20) {
    return solve('average', `(${values.join('+')})/${values.length}`);
  }

  if (values.length === 2 && /\b(?:shared|split|divided)\s+(?:equally\s+)?(?:among|between)\b/.test(lower)) {
    return solve('equal_share', `${values[0]}/${values[1]}`);
  }

  if (values.length === 2 && /\b(?:cost|costs|total price)\b/.test(lower) && /\beach\b/.test(lower)) {
    if (/\b(?:how much|cost)\s+(?:does\s+)?each\b/.test(lower)) {
      return solve('unit_price', `${values[1]}/${values[0]}`);
    }
    return solve('total_cost', `${values[0]}*${values[1]}`);
  }

  if (values.length === 2 && /\b(?:per\s+hour|mph|miles\s+per\s+hour|km\/?h|kilometers\s+per\s+hour)\b/.test(lower) && /\b(?:for)\b/.test(lower)) {
    return solve('rate_times_time', `${values[0]}*${values[1]}`);
  }

  if (values.length === 2 && /\beach\b/.test(lower) && /\b(?:total|altogether|in\s+all|how\s+many)\b/.test(lower)) {
    return solve('equal_groups_total', `${values[0]}*${values[1]}`);
  }

  if (values.length === 2 && /\b(?:gave\s+away|lost|spent|used|removed|sold|ate|eats?|consumed?|left|remain|remaining)\b/.test(lower)) {
    return solve('remaining', `${values[0]}-${values[1]}`);
  }

  if (values.length >= 2 && values.length <= 10 && /\b(?:total|altogether|combined|in\s+all)\b/.test(lower)) {
    return solve('sum_word_problem', values.join('+'));
  }

  if (values.length === 2 && /\b(?:buys?|gets?|receives?|adds?|gains?|more|another)\b/.test(lower) && /\b(?:now|total|altogether|how\s+many|how\s+much)\b/.test(lower)) {
    return solve('addition_word_problem', `${values[0]}+${values[1]}`);
  }

  if (values.length === 2 && /\b(?:how\s+many|how\s+much)\s+(?:are\s+)?(?:left|remain|remaining)\b/.test(lower)) {
    return solve('subtraction_word_problem', `${values[0]}-${values[1]}`);
  }

  return {
    intent: 'math',
    status: 'clarify',
    confidence: 'medium',
    reason: 'I detected a math request, but I could not reduce it to one unambiguous deterministic expression.',
  };
}

export function buildCalculatorAgentMessage(originalMessage: string, route: Exclude<MathRoute, { intent: 'chat' }>): string {
  if (route.status === 'solved') {
    return [
      'Original user request:',
      originalMessage,
      '',
      '[Trusted deterministic calculator result]',
      `Operation: ${route.operation}`,
      `Expression: ${route.expression}`,
      `Result: ${route.resultText}`,
      '',
      'Answer the original user request naturally. Use the calculator result as authoritative. Do not recompute or change the numeric result.',
    ].join('\n');
  }

  return [
    'Original user request:',
    originalMessage,
    '',
    '[Deterministic calculator routing note]',
    `The request appears mathematical, but the calculator did not produce a result safely: ${route.reason}`,
    'Ask one concise clarifying question needed to determine the calculation. Do not guess a numeric answer.',
  ].join('\n');
}

export function calculatorRoutingMetadata(route: MathRoute) {
  if (route.intent === 'chat') return { intent: 'chat' as const };
  if (route.status === 'clarify') {
    return {
      intent: 'math' as const,
      tool: 'deterministic_calculator' as const,
      status: 'clarify' as const,
    };
  }
  return {
    intent: 'math' as const,
    tool: 'deterministic_calculator' as const,
    status: 'solved' as const,
    operation: route.operation,
    expression: route.expression,
    result: route.resultText,
  };
}
