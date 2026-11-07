(function () {
    const app = document.getElementById('calculatorApp');
    const grade = document.body.dataset.calculatorGrade;
    const topic = new URLSearchParams(location.search).get('topic');

    function number(value, label) {
        if (String(value).trim() === '') throw new InputError(`${label} is required.`);
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) throw new InputError(`${label} must be a finite number.`);
        return parsed;
    }

    function integer(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const parsed = number(value, label);
        if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
            throw new InputError(`${label} must be a whole number from ${min} to ${max}.`);
        }
        return parsed;
    }

    function format(value) {
        if (!Number.isFinite(value)) throw new InputError('The result is too large to calculate safely.');
        return Number(value.toPrecision(9)).toString();
    }

    function factorial(n) {
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    function choose(n, r) {
        const k = Math.min(r, n - r);
        let result = 1;
        for (let i = 1; i <= k; i++) result = result * (n - k + i) / i;
        return result;
    }

    function matrixFields(prefix, name, defaults) {
        return defaults.map((value, index) => {
            const row = Math.floor(index / 3), column = index % 3;
            return field(`${prefix}${row + 1}${column + 1}`, `${name}${row + 1}${column + 1}`, value, {
                matrix: name.toLowerCase(), row, column
            });
        });
    }

    function readMatrix(values, prefix, size) {
        return Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, column) =>
                number(values[`${prefix}${row + 1}${column + 1}`], `${prefix.toUpperCase()}${row + 1}${column + 1}`)
            )
        );
    }

    function determinant(matrix) {
        if (matrix.length === 1) return matrix[0][0];
        if (matrix.length === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        return matrix[0].reduce((sum, value, column) => {
            const minor = matrix.slice(1).map(row => row.filter((_, index) => index !== column));
            return sum + (column % 2 ? -1 : 1) * value * determinant(minor);
        }, 0);
    }

    function transpose(matrix) {
        return matrix[0].map((_, column) => matrix.map(row => row[column]));
    }

    function adjugate(matrix) {
        const cofactors = matrix.map((row, rowIndex) => row.map((_, columnIndex) => {
            const minor = matrix.filter((_, i) => i !== rowIndex)
                .map(current => current.filter((_, j) => j !== columnIndex));
            return ((rowIndex + columnIndex) % 2 ? -1 : 1) * determinant(minor);
        }));
        return transpose(cofactors);
    }

    function scaleMatrix(matrix, factor) {
        return matrix.map(row => row.map(value => value * factor));
    }

    function matrixOperation(a, b, operation) {
        if (operation === 'multiply') {
            return a.map(row => b[0].map((_, column) =>
                row.reduce((sum, value, index) => sum + value * b[index][column], 0)
            ));
        }
        return a.map((row, i) => row.map((value, j) =>
            operation === 'add' ? value + b[i][j] : value - b[i][j]
        ));
    }

    function matrixText(matrix) {
        return `[${matrix.map(row => `[${row.map(format).join(', ')}]`).join('; ')}]`;
    }

    function field(id, label, value, options = {}) {
        return { id, label, value: String(value), ...options };
    }

    function config(title, intro, formula, fields, calculate) {
        return { title, intro, formula, fields, calculate };
    }

    const grade11 = {
        sets: config('Set Operations Calculator', 'Calculate unions, intersections, differences, complements, or use set cardinalities.', '|A ∪ B| = |A| + |B| − |A ∩ B|; A′ = U \\ A.', [
            field('mode', 'Input mode', 'elements', { type: 'select', options: [['elements', 'Enter set elements'], ['cardinality', 'Enter cardinalities']] }),
            field('operation', 'Set operation', 'union', { type: 'select', options: [['union', 'Union A ∪ B'], ['intersection', 'Intersection A ∩ B'], ['difference', 'Difference A − B'], ['symmetric', 'Symmetric difference A △ B'], ['complement', 'Complement A′'], ['cardinality', 'Cardinality summary']] }),
            field('setA', 'Set A (comma separated)', '1, 2, 3, 4, 5, 6, 7, 8', { type: 'text', placeholder: 'For example: 1, 2, 3' }),
            field('setB', 'Set B (comma separated)', '5, 6, 7, 8, 9, 10, 11, 12', { type: 'text', placeholder: 'For example: 2, 3, 4' }),
            field('setU', 'Universal set U (comma separated)', '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14', { type: 'text', placeholder: 'Required for complement' }),
            field('universe', 'Universal set size |U|', 14),
            field('a', 'Set size |A|', 8),
            field('b', 'Set size |B|', 8),
            field('intersection', 'Intersection size |A ∩ B|', 4)
        ], v => {
            if (v.mode === 'elements') {
                const parseSet = (raw, label) => {
                    const values = raw.split(',').map(value => value.trim()).filter(Boolean);
                    if (values.length > 200) throw new InputError(`${label} can contain at most 200 elements.`);
                    return new Set(values);
                };
                const A = parseSet(v.setA, 'Set A'), B = parseSet(v.setB, 'Set B'), U = parseSet(v.setU, 'Universal set');
                if (!A.size || !B.size || !U.size) throw new InputError('Enter at least one element in each set.');
                if ([...A, ...B].some(value => !U.has(value))) throw new InputError('Every element of A and B must also belong to the universal set U.');
                const intersection = new Set([...A].filter(value => B.has(value)));
                const union = new Set([...A, ...B]);
                const answerSet = v.operation === 'union' || v.operation === 'cardinality' ? union
                    : v.operation === 'intersection' ? intersection
                        : v.operation === 'difference' ? new Set([...A].filter(value => !B.has(value)))
                            : v.operation === 'symmetric' ? new Set([...A, ...B].filter(value => A.has(value) !== B.has(value)))
                                : new Set([...U].filter(value => !A.has(value)));
                const show = values => `{${[...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(', ')}}`;
                return {
                    answer: v.operation === 'cardinality'
                        ? `|A|=${A.size}; |B|=${B.size}; |A∩B|=${intersection.size}; |A∪B|=${union.size}; |A′|=${U.size - A.size}.`
                        : `${v.operation === 'complement' ? 'A′' : v.operation === 'intersection' ? 'A∩B' : v.operation === 'difference' ? 'A−B' : v.operation === 'symmetric' ? 'A△B' : 'A∪B'} = ${show(answerSet)}.`,
                    steps: `|A|=${A.size}, |B|=${B.size}, |A∩B|=${intersection.size}, |A∪B|=${union.size}.`,
                    visual: { type: 'sets', a: A.size, b: B.size, intersection: intersection.size }
                };
            }
            const u = integer(v.universe, '|U|'), a = integer(v.a, '|A|'), b = integer(v.b, '|B|'), i = integer(v.intersection, '|A ∩ B|');
            if (i > Math.min(a, b) || a > u || b > u) throw new InputError('Set sizes and intersection must be consistent with the universal set.');
            const union = a + b - i;
            if (union > u) throw new InputError('The union cannot be larger than the universal set.');
            const selected = v.operation === 'cardinality' ? `|A|=${a}; |B|=${b}; |A∩B|=${i}; |A∪B|=${union}; |A′|=${u - a}`
                : v.operation === 'intersection' ? `|A ∩ B| = ${i}`
                : v.operation === 'difference' ? `|A − B| = ${a - i}`
                    : v.operation === 'symmetric' ? `|A △ B| = ${a + b - 2 * i}`
                        : v.operation === 'complement' ? `|A′| = ${u - a}`
                            : `|A ∪ B| = ${union}`;
            return { answer: `${selected}; neither=${u - union}.`, steps: '|A ∪ B| = |A| + |B| − |A ∩ B|; complement size is |U| − |A|.', visual: { type: 'sets', a, b, intersection: i } };
        }),
        'relations-functions': config('Function Calculator', 'Evaluate a polynomial function, find its roots, or reverse a linear function.', 'For f(x)=ax²+bx+c, the discriminant b²−4ac determines the real roots. A linear inverse is f⁻¹(y)=(y−b)/a.', [
            field('operation', 'Calculation', 'evaluate', { type: 'select', options: [['evaluate', 'Evaluate f(x)'], ['roots', 'Find real zeroes'], ['inverse', 'Find linear inverse value']] }),
            field('a', 'Coefficient a of x²', 1), field('b', 'Coefficient b of x', -3), field('c', 'Constant c', 2),
            field('x', 'Input x', 2), field('y', 'Input y for inverse', 5)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), c = number(v.c, 'c');
            if (v.operation === 'inverse') {
                if (a !== 0 || b === 0) throw new InputError('For inverse mode, set a = 0 and use a non-zero linear coefficient b.');
                const y = number(v.y, 'y');
                return { answer: `For f(x)=${format(b)}x+${format(c)}, f⁻¹(${format(y)}) = ${format((y - c) / b)}.`, steps: 'Rearrange y = bx + c to make x the subject.' };
            }
            if (v.operation === 'roots') {
                if (!a) {
                    if (!b) return { answer: c ? 'A non-zero constant has no roots.' : 'Every real number is a root of the zero polynomial.', steps: 'The function is constant.' };
                    return { answer: `Linear zero: x = ${format(-c / b)}.`, steps: 'Solve bx + c = 0.' };
                }
                const discriminant = b * b - 4 * a * c;
                if (discriminant < 0) return { answer: 'There are no real zeroes.', steps: 'The discriminant b² − 4ac is negative.' };
                const root = Math.sqrt(discriminant);
                return { answer: `Real zeroes: x = ${format((-b - root) / (2 * a))}${root ? ` and ${format((-b + root) / (2 * a))}` : ' (repeated)'}.`, steps: `Discriminant = ${format(discriminant)}; apply the quadratic formula.` };
            }
            const x = number(v.x, 'x'), output = a * x * x + b * x + c;
            return { answer: `f(${format(x)}) = ${format(output)}.`, steps: `Substitute x=${format(x)} into f(x)=${format(a)}x²+${format(b)}x+${format(c)}.` };
        }),
        'trigonometric-functions': config('Trigonometric Functions Calculator', 'Convert degrees and radians, and evaluate all six trigonometric ratios.', 'Radians = degrees × π/180; sin²θ + cos²θ = 1; tan θ = sin θ/cos θ.', [
            field('unit', 'Input unit', 'degrees', { type: 'select', options: [['degrees', 'Degrees'], ['radians', 'Radians']] }),
            field('angle', 'Angle', 30)
        ], v => {
            const angle = number(v.angle, 'Angle'), radians = v.unit === 'degrees' ? angle * Math.PI / 180 : angle;
            const sin = Math.sin(radians), cos = Math.cos(radians), ratio = value => Math.abs(value) < 1e-12 ? 'undefined' : format(1 / value);
            return { answer: `${format(angle)} ${v.unit === 'degrees' ? '°' : 'rad'} = ${format(v.unit === 'degrees' ? radians : radians * 180 / Math.PI)} ${v.unit === 'degrees' ? 'rad' : '°'}; sin=${format(sin)}, cos=${format(cos)}, tan=${Math.abs(cos) < 1e-12 ? 'undefined' : format(sin / cos)}, csc=${ratio(sin)}, sec=${ratio(cos)}, cot=${Math.abs(sin) < 1e-12 ? 'undefined' : format(cos / sin)}.`, steps: 'The reciprocal ratios are csc=1/sin, sec=1/cos, and cot=cos/sin.' };
        }),
        'complex-numbers': config('Complex Number Calculator', 'Add, subtract, multiply, divide, conjugate, or find modulus and argument of complex numbers.', 'For z=a+bi, |z|=√(a²+b²), arg(z)=atan2(b,a), and z̄=a−bi.', [
            field('operation', 'Operation', 'multiply', { type: 'select', options: [['add', 'Add'], ['subtract', 'Subtract'], ['multiply', 'Multiply'], ['divide', 'Divide'], ['conjugate', 'Conjugate z₁'], ['modulus', 'Modulus |z₁|'], ['argument', 'Argument arg(z₁)'], ['polar', 'Polar form of z₁']] }),
            field('ar', 'First real part', 3), field('ai', 'First imaginary part', 2),
            field('br', 'Second real part', 1), field('bi', 'Second imaginary part', -4)
        ], v => {
            const ar = number(v.ar, 'First real part'), ai = number(v.ai, 'First imaginary part');
            const br = number(v.br, 'Second real part'), bi = number(v.bi, 'Second imaginary part');
            let re, im;
            if (v.operation === 'conjugate') return { answer: `Conjugate: z̄₁ = ${format(ar)} ${ai < 0 ? '+' : '−'} ${format(Math.abs(ai))}i.`, steps: 'Reflect the complex point across the real axis by changing the sign of its imaginary part.' };
            const modulus = Math.hypot(ar, ai), argument = Math.atan2(ai, ar);
            if (v.operation === 'modulus') return { answer: `|z₁| = ${format(modulus)}.`, steps: `|a+bi| = √(a²+b²) = √(${format(ar * ar)} + ${format(ai * ai)}).` };
            if (v.operation === 'argument') return { answer: `arg(z₁) = ${format(argument)} rad = ${format(argument * 180 / Math.PI)}°.`, steps: 'The argument is measured counterclockwise from the positive real axis, with the correct quadrant.' };
            if (v.operation === 'polar') return { answer: `z₁ = ${format(modulus)}(cos ${format(argument)} + i sin ${format(argument)}), θ = ${format(argument * 180 / Math.PI)}°.`, steps: 'Use z = r(cos θ + i sin θ), where r is the modulus and θ is the argument.' };
            if (v.operation === 'add') { re = ar + br; im = ai + bi; }
            if (v.operation === 'subtract') { re = ar - br; im = ai - bi; }
            if (v.operation === 'multiply') { re = ar * br - ai * bi; im = ar * bi + ai * br; }
            if (v.operation === 'divide') {
                const denominator = br * br + bi * bi;
                if (!denominator) throw new InputError('Division by zero is undefined.');
                re = (ar * br + ai * bi) / denominator;
                im = (ai * br - ar * bi) / denominator;
            }
            return { answer: `Result = ${format(re)} ${im < 0 ? '−' : '+'} ${format(Math.abs(im))}i.`, steps: 'The real and imaginary parts are calculated independently using the complex-number rules.' };
        }),
        'linear-inequalities': config('Linear Inequality Solver', 'Solve a one-variable linear inequality and express its solution as an interval.', 'For ax + b ⋚ c, isolate x and reverse the inequality when dividing by a negative number.', [
            field('a', 'Coefficient a', 2), field('b', 'Constant b', 3), field('relation', 'Relation', '<=', { type: 'select', options: [['<', '<'], ['<=', '≤'], ['>', '>'], ['>=', '≥']] }), field('c', 'Right side c', 11)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), c = number(v.c, 'c');
            const relation = v.relation;
            if (a === 0) {
                const trueStatement = relation === '<' ? b < c : relation === '<=' ? b <= c : relation === '>' ? b > c : b >= c;
                return { answer: trueStatement ? 'Every real number is a solution.' : 'There are no solutions.', steps: `With a = 0, the inequality reduces to ${format(b)} ${relation} ${format(c)}.` };
            }
            const boundary = (c - b) / a;
            const reversed = a < 0;
            const solved = reversed ? ({ '<': '>', '<=': '>=', '>': '<', '>=': '<=' })[relation] : relation;
            return { answer: `x ${solved} ${format(boundary)}.`, steps: `Subtract b, then divide by a${reversed ? ' and reverse the inequality because a is negative' : ''}.` };
        }),
        'permutations-combinations': config('Permutations and Combinations Calculator', 'Calculate the number of ordered arrangements or unordered selections.', 'nPr = n!/(n−r)!; nCr = n!/[r!(n−r)!].', [
            field('kind', 'Count', 'combination', { type: 'select', options: [['combination', 'Combination (nCr)'], ['permutation', 'Permutation (nPr)']] }),
            field('n', 'Total items n', 8), field('r', 'Items chosen r', 3)
        ], v => {
            const n = integer(v.n, 'n', 0, 170), r = integer(v.r, 'r', 0, n);
            const result = v.kind === 'permutation' ? factorial(n) / factorial(n - r) : choose(n, r);
            return { answer: `${n}${v.kind === 'permutation' ? 'P' : 'C'}${r} = ${format(result)}.`, steps: v.kind === 'permutation' ? `Order matters: ${n}!/(${n}−${r})!.` : `Order does not matter: ${n}!/[${r}!(${n}−${r})!].` };
        }),
        'binomial-theorem': config('Binomial Theorem Calculator', 'Generate a full binomial expansion or find a selected term of (ax + by)ⁿ.', 'The (r + 1)th term of (ax + by)ⁿ is ⁿCᵣ aⁿ⁻ʳbʳxⁿ⁻ʳyʳ.', [
            field('mode', 'Calculation', 'term', { type: 'select', options: [['term', 'Find one term'], ['expansion', 'Generate the full expansion']] }),
            field('a', 'Coefficient a of x', 2), field('b', 'Coefficient b of y', 1), field('n', 'Power n', 6), field('r', 'Term index r (starts at 0)', 2)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), n = integer(v.n, 'n', 0, 100);
            if (v.mode === 'expansion') {
                if (n > 20) throw new InputError('Limit a full expansion to n ≤ 20 to keep the result readable.');
                const terms = Array.from({ length: n + 1 }, (_, index) => {
                    const coefficient = choose(n, index) * a ** (n - index) * b ** index;
                    const monomial = `${n - index > 0 ? `x${n - index > 1 ? `^${n - index}` : ''}` : ''}${index > 0 ? `y${index > 1 ? `^${index}` : ''}` : ''}`;
                    const coefficientText = Math.abs(coefficient) === 1 && monomial ? '' : format(Math.abs(coefficient));
                    return { coefficient, text: `${coefficientText}${monomial}` };
                }).filter(term => term.coefficient !== 0);
                const expansion = terms.length ? terms.map((term, index) => `${index ? (term.coefficient < 0 ? '− ' : '+ ') : (term.coefficient < 0 ? '−' : '')}${term.text}`).join(' ') : '0';
                return { answer: `(${format(a)}x + ${format(b)}y)^${n} = ${expansion}.`, steps: 'Each term uses the binomial coefficient ⁿCᵣ and reduces the x power by one as the y power increases.', visual: { type: 'binomial', n } };
            }
            const r = integer(v.r, 'r', 0, n);
            const coefficient = choose(n, r), value = coefficient * a ** (n - r) * b ** r;
            return { answer: `Term ${r + 1}: coefficient ${format(coefficient)}; value ${format(value)}.`, steps: `Tᵣ₊₁ = ⁿCᵣ aⁿ⁻ʳ bʳ = ${format(coefficient)} × ${format(a)}^${n - r} × ${format(b)}^${r}.` };
        }),
        'sequences-series': config('Sequence and Series Calculator', 'Find the nth term and sum of the first n terms of an arithmetic or geometric progression.', 'AP: aₙ = a + (n−1)d. GP: aₙ = arⁿ⁻¹.', [
            field('kind', 'Sequence', 'ap', { type: 'select', options: [['ap', 'Arithmetic progression'], ['gp', 'Geometric progression']] }),
            field('sumType', 'Series sum', 'finite', { type: 'select', options: [['finite', 'Finite sum'], ['infinite', 'Infinite GP sum']] }),
            field('first', 'First term a', 3), field('step', 'Common difference d / ratio r', 2), field('n', 'Number of terms n', 8)
        ], v => {
            const a = number(v.first, 'First term'), s = number(v.step, 'Common difference or ratio'), n = integer(v.n, 'n', 1, 1000000);
            let term, sum;
            if (v.kind === 'ap') {
                if (v.sumType === 'infinite') throw new InputError('An arithmetic progression does not have a finite infinite-series sum.');
                term = a + (n - 1) * s; sum = n * (a + term) / 2;
            } else {
                term = a * s ** (n - 1);
                if (v.sumType === 'infinite') {
                    if (Math.abs(s) >= 1) throw new InputError('An infinite geometric series converges only when |r| < 1.');
                    sum = a / (1 - s);
                } else sum = s === 1 ? a * n : a * (s ** n - 1) / (s - 1);
            }
            return { answer: `Term ${n} = ${format(term)}; ${v.sumType === 'infinite' ? 'infinite sum' : `sum of first ${n} terms`} = ${format(sum)}.`, steps: v.kind === 'ap' ? 'Use the arithmetic-progression nth-term and sum formulas.' : v.sumType === 'infinite' ? 'For |r|<1, the infinite GP sum is a/(1−r).' : 'Use the finite geometric-progression nth-term and sum formulas.' };
        }),
        'straight-lines': config('Straight Line Calculator', 'Find the slope, distance, and equation of the line through two points.', 'm = (y₂ − y₁)/(x₂ − x₁).', [
            field('x1', 'x-coordinate x₁', 1), field('y1', 'y-coordinate y₁', 2), field('x2', 'x-coordinate x₂', 5), field('y2', 'y-coordinate y₂', 4)
        ], v => {
            const x1 = number(v.x1, 'x₁'), y1 = number(v.y1, 'y₁'), x2 = number(v.x2, 'x₂'), y2 = number(v.y2, 'y₂');
            if (x1 === x2 && y1 === y2) throw new InputError('Enter two distinct points.');
            const dx = x2 - x1, dy = y2 - y1, distance = Math.hypot(dx, dy);
            const equation = dx === 0 ? `x = ${format(x1)}` : `y = ${format(dy / dx)}x + ${format(y1 - dy / dx * x1)}`;
            return { answer: `Slope = ${dx ? format(dy / dx) : 'undefined (vertical line)'}; distance = ${format(distance)}; line: ${equation}.`, steps: 'The slope uses the change in y divided by the change in x; the distance uses the distance formula.' };
        }),
        'conic-sections': config('Conic Sections Explorer', 'Write a standard circle, ellipse, hyperbola, or parabola equation and test a point.', 'Circle: (x−h)²+(y−k)²=r². Ellipse: (x−h)²/a²+(y−k)²/b²=1. Hyperbola: (x−h)²/a²−(y−k)²/b²=1. Parabola: (x−h)²=4a(y−k).', [
            field('kind', 'Conic', 'circle', { type: 'select', options: [['circle', 'Circle'], ['ellipse', 'Ellipse'], ['hyperbola', 'Horizontal hyperbola'], ['parabola', 'Vertical parabola']] }),
            field('h', 'Center / vertex x-coordinate h', 0), field('k', 'Center / vertex y-coordinate k', 0),
            field('a', 'Radius / semi-axis / focal length a', 5), field('b', 'Semi-axis b (ellipse or hyperbola)', 3),
            field('x', 'Point x-coordinate', 3), field('y', 'Point y-coordinate', 4)
        ], v => {
            const h = number(v.h, 'h'), k = number(v.k, 'k'), a = number(v.a, 'a'), b = number(v.b, 'b'), x = number(v.x, 'Point x'), y = number(v.y, 'Point y');
            if (a <= 0) throw new InputError('Radius, semi-axis, or focal length a must be greater than zero.');
            if (v.kind === 'circle') {
                const distance = Math.hypot(x - h, y - k);
                const relation = Math.abs(distance - a) < 1e-9 ? 'on the circle' : distance < a ? 'inside the circle' : 'outside the circle';
                return { answer: `Circle: (x−${format(h)})² + (y−${format(k)})² = ${format(a * a)}. The point is ${relation}.`, steps: `Its distance from the center is ${format(distance)}; compare that with radius ${format(a)}.` };
            }
            if (v.kind === 'parabola') {
                const residual = (x - h) ** 2 - 4 * a * (y - k);
                return { answer: `Parabola: (x−${format(h)})² = ${format(4 * a)}(y−${format(k)}). The point ${Math.abs(residual) < 1e-9 ? 'lies' : 'does not lie'} on it. Focus: (${format(h)}, ${format(k + a)}); directrix: y=${format(k - a)}.`, steps: 'For a vertical parabola, the signed focal length is a; the focus and directrix are a distance |a| from the vertex.' };
            }
            if (b <= 0) throw new InputError('Semi-axis b must be greater than zero.');
            if (v.kind === 'ellipse') {
                if (b > a) throw new InputError('For this horizontal ellipse form, semi-axis a must be at least as large as b.');
                const value = (x - h) ** 2 / a ** 2 + (y - k) ** 2 / b ** 2;
                const c = Math.sqrt(a * a - b * b);
                const relation = Math.abs(value - 1) < 1e-9 ? 'on the ellipse' : value < 1 ? 'inside the ellipse' : 'outside the ellipse';
                return { answer: `Ellipse: (x−${format(h)})²/${format(a * a)} + (y−${format(k)})²/${format(b * b)} = 1. The point is ${relation}; foci: (${format(h - c)}, ${format(k)}) and (${format(h + c)}, ${format(k)}).`, steps: `The focal distance is c = √(a²−b²) = ${format(c)}.` };
            }
            const value = (x - h) ** 2 / a ** 2 - (y - k) ** 2 / b ** 2;
            const c = Math.sqrt(a * a + b * b);
            return { answer: `Hyperbola: (x−${format(h)})²/${format(a * a)} − (y−${format(k)})²/${format(b * b)} = 1. The point ${Math.abs(value - 1) < 1e-9 ? 'lies' : 'does not lie'} on it; foci: (${format(h - c)}, ${format(k)}) and (${format(h + c)}, ${format(k)}).`, steps: `The focal distance is c = √(a²+b²) = ${format(c)}.` };
        }),
        'three-dimensional-geometry': config('3D Distance Calculator', 'Find the distance and midpoint between two points in three-dimensional space.', 'd = √[(x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²].', [
            field('x1', 'Point 1 x₁', 1), field('y1', 'Point 1 y₁', 2), field('z1', 'Point 1 z₁', 3),
            field('x2', 'Point 2 x₂', 4), field('y2', 'Point 2 y₂', 6), field('z2', 'Point 2 z₂', 3)
        ], v => {
            const p = ['x1', 'y1', 'z1', 'x2', 'y2', 'z2'].map(key => number(v[key], key));
            const d = Math.hypot(p[3] - p[0], p[4] - p[1], p[5] - p[2]);
            return { answer: `Distance = ${format(d)}; midpoint = (${format((p[0] + p[3]) / 2)}, ${format((p[1] + p[4]) / 2)}, ${format((p[2] + p[5]) / 2)}).`, steps: 'The midpoint is the average of corresponding coordinates.' };
        }),
        'limits-derivatives': config('Polynomial Limit and Derivative', 'Evaluate a cubic polynomial and its derivative at a chosen point.', 'For f(x) = ax³ + bx² + cx + d, f′(x) = 3ax² + 2bx + c.', [
            field('a', 'Coefficient a of x³', 1), field('b', 'Coefficient b of x²', -2), field('c', 'Coefficient c of x', 3), field('d', 'Constant d', 1), field('x', 'Point x', 2)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), c = number(v.c, 'c'), d = number(v.d, 'd'), x = number(v.x, 'x');
            const f = a * x ** 3 + b * x ** 2 + c * x + d, derivative = 3 * a * x ** 2 + 2 * b * x + c;
            return { answer: `f(${format(x)}) = ${format(f)}; f′(${format(x)}) = ${format(derivative)}.`, steps: `For a polynomial, limₜ→ₓ f(t) = f(x). Differentiate term by term, then substitute x.` };
        }),
        statistics: config('Statistics Calculator', 'Calculate mean, median, mode, range, variance, and standard deviation from raw observations.', 'Population variance σ² = Σ(x − mean)²/n; sample variance s² = Σ(x − mean)²/(n−1).', [
            field('kind', 'Variance type', 'population', { type: 'select', options: [['population', 'Population'], ['sample', 'Sample']] }),
            field('data', 'Observations (comma or space separated)', '4, 6, 6, 8, 11', { type: 'text', placeholder: 'For example: 4, 6, 6, 8, 11' })
        ], v => {
            const values = parseData(v.data);
            const mean = values.reduce((sum, item) => sum + item, 0) / values.length;
            const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
            const frequency = new Map();
            values.forEach(item => frequency.set(item, (frequency.get(item) || 0) + 1));
            const maxFrequency = Math.max(...frequency.values());
            const modes = [...frequency].filter(([, count]) => count === maxFrequency).map(([item]) => item);
            const modeText = maxFrequency === 1 ? 'none' : modes.map(format).join(', ');
            const squares = values.reduce((sum, item) => sum + (item - mean) ** 2, 0);
            if (v.kind === 'sample' && values.length < 2) throw new InputError('At least two observations are required for sample variance.');
            const variance = squares / (v.kind === 'sample' ? values.length - 1 : values.length);
            return { answer: `n=${values.length}; mean=${format(mean)}; median=${format(median)}; mode=${modeText}; range=${format(sorted[sorted.length - 1] - sorted[0])}; ${v.kind} variance=${format(variance)}; standard deviation=${format(Math.sqrt(variance))}.`, steps: `Sorted data: ${sorted.map(format).join(', ')}. The ${v.kind} variance divides the squared deviations by ${v.kind === 'sample' ? 'n−1' : 'n'}.` };
        }),
        probability: config('Classical Probability Calculator', 'Calculate the probability of an event and its complement from equally likely outcomes.', 'P(E) = favorable outcomes / total outcomes; P(E′) = 1 − P(E).', [
            field('favorable', 'Favorable outcomes', 3), field('total', 'Total equally likely outcomes', 8)
        ], v => {
            const favorable = integer(v.favorable, 'Favorable outcomes'), total = integer(v.total, 'Total outcomes', 1);
            if (favorable > total) throw new InputError('Favorable outcomes cannot exceed total outcomes.');
            return { answer: `P(E) = ${format(favorable / total)} (${format(100 * favorable / total)}%); P(E′) = ${format(1 - favorable / total)}.`, steps: `There are ${favorable} favorable outcomes among ${total} equally likely outcomes.` };
        })
    };

    const grade12 = {
        'relations-functions': config('Function Composition Calculator', 'Evaluate two linear functions and both possible compositions.', 'For f(x)=ax+b and g(x)=cx+d, (f∘g)(x)=f(g(x)).', [
            field('a', 'f coefficient a', 2), field('b', 'f constant b', 1), field('c', 'g coefficient c', 3), field('d', 'g constant d', -2), field('x', 'Input x', 4)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), c = number(v.c, 'c'), d = number(v.d, 'd'), x = number(v.x, 'x');
            const f = value => a * value + b, g = value => c * value + d;
            return { answer: `(f∘g)(${format(x)}) = ${format(f(g(x)))}; (g∘f)(${format(x)}) = ${format(g(f(x)))}.`, steps: `First evaluate the inner function: g(x) = ${format(g(x))} and f(x) = ${format(f(x))}.` };
        }),
        'inverse-trigonometric-functions': config('Inverse Trigonometric Calculator', 'Find a principal-value inverse trigonometric angle in degrees and radians.', 'Principal ranges: sin⁻¹x ∈ [−π/2,π/2], cos⁻¹x ∈ [0,π], tan⁻¹x ∈ (−π/2,π/2).', [
            field('function', 'Function', 'asin', { type: 'select', options: [['asin', 'sin⁻¹(x)'], ['acos', 'cos⁻¹(x)'], ['atan', 'tan⁻¹(x)']] }),
            field('x', 'Input x', 0.5)
        ], v => {
            const x = number(v.x, 'x');
            if (v.function !== 'atan' && (x < -1 || x > 1)) throw new InputError('For sin⁻¹ and cos⁻¹, x must be between −1 and 1.');
            const value = Math[v.function](x);
            return { answer: `${v.function === 'asin' ? 'sin⁻¹' : v.function === 'acos' ? 'cos⁻¹' : 'tan⁻¹'}(${format(x)}) = ${format(value)} rad = ${format(value * 180 / Math.PI)}°.`, steps: 'The result uses the principal-value range for the selected inverse trigonometric function.' };
        }),
        matrices: config('Matrix Calculator', 'Add, subtract, multiply, find determinants and inverses, or transpose 2 × 2 and 3 × 3 matrices.', 'For a 2 × 2 matrix, det(A)=ad−bc and A⁻¹=(1/det A)[d −b; −c a].', [
            field('size', 'Matrix order', '2', { type: 'select', options: [['2', '2 × 2'], ['3', '3 × 3']] }),
            field('operation', 'Operation', 'multiply', { type: 'select', options: [['add', 'Add A + B'], ['subtract', 'Subtract A − B'], ['multiply', 'Multiply AB'], ['determinant', 'Determinant det(A)'], ['inverse', 'Inverse A⁻¹'], ['transpose', 'Transpose Aᵀ'], ['adjugate', 'Adjugate adj(A)']] }),
            ...matrixFields('a', 'A', [1, 2, 3, 4, 0, 1, 5, 6, 0]),
            ...matrixFields('b', 'B', [2, 0, 1, 2, 1, 0, 0, 1, 1])
        ], v => {
            const n = Number(v.size);
            const A = readMatrix(v, 'a', n);
            const op = v.operation;
            if (['add', 'subtract', 'multiply'].includes(op)) {
                const B = readMatrix(v, 'b', n);
                const out = matrixOperation(A, B, op);
                return { answer: `${matrixText(out)}`, steps: op === 'multiply' ? 'Each result entry is the dot product of a row of A and a column of B.' : 'Combine corresponding entries of A and B.' , visual: { type: 'matrix', matrix: out } };
            }
            if (op === 'determinant') {
                const det = determinant(A);
                return { answer: `det(A) = ${format(det)}.`, steps: `The determinant is ${det === 0 ? 'zero, so A is singular.' : 'non-zero, so A is invertible.'}`, visual: { type: 'matrix', matrix: A, determinant: det } };
            }
            if (op === 'transpose') {
                const out = transpose(A);
                return { answer: `Aᵀ = ${matrixText(out)}`, steps: 'Rows and columns are interchanged.', visual: { type: 'matrix', matrix: out } };
            }
            const det = determinant(A);
            if (op === 'inverse') {
                if (Math.abs(det) < 1e-12) throw new InputError('This matrix is singular and has no inverse.');
                const out = scaleMatrix(adjugate(A), 1 / det);
                return { answer: `det(A) = ${format(det)}; A⁻¹ = ${matrixText(out)}`, steps: 'A⁻¹ = adj(A)/det(A). The determinant must be non-zero.', visual: { type: 'matrix', matrix: out } };
            }
            const out = adjugate(A);
            return { answer: `det(A) = ${format(det)}; adj(A) = ${matrixText(out)}`, steps: 'The adjugate is the transpose of the cofactor matrix.', visual: { type: 'matrix', matrix: out } };
        }),
        determinants: config('Determinant and Linear System Calculator', 'Calculate a 2 × 2 or 3 × 3 determinant, inverse, adjugate, or solve AX = b.', 'For 3 × 3 matrices, expand along a row or use cofactors. Cramer’s rule: xᵢ = det(Aᵢ)/det(A).', [
            field('size', 'Matrix order', '3', { type: 'select', options: [['2', '2 × 2'], ['3', '3 × 3']] }),
            field('operation', 'Operation', 'determinant', { type: 'select', options: [['determinant', 'Determinant'], ['inverse', 'Inverse'], ['adjugate', 'Adjugate'], ['solve', 'Solve AX = b']] }),
            ...matrixFields('a', 'A', [1, 2, 3, 0, 1, 4, 5, 6, 0]),
            field('v1', 'Vector b, row 1', 1), field('v2', 'Vector b, row 2', 2), field('v3', 'Vector b, row 3', 3)
        ], v => {
            const n = Number(v.size), A = readMatrix(v, 'a', n), det = determinant(A);
            if (v.operation === 'determinant') return { answer: `det(A) = ${format(det)}.`, steps: `A is ${det === 0 ? 'singular' : 'non-singular'}${det === 0 ? '' : ` and its determinant is ${format(det)}`}.`, visual: { type: 'matrix', matrix: A, determinant: det } };
            if (v.operation === 'adjugate') {
                const out = adjugate(A);
                return { answer: `adj(A) = ${matrixText(out)}; det(A) = ${format(det)}.`, steps: 'Compute cofactors, then transpose the cofactor matrix.', visual: { type: 'matrix', matrix: out } };
            }
            if (v.operation === 'inverse') {
                if (Math.abs(det) < 1e-12) throw new InputError('This matrix is singular and has no inverse.');
                const out = scaleMatrix(adjugate(A), 1 / det);
                return { answer: `A⁻¹ = ${matrixText(out)}; det(A) = ${format(det)}.`, steps: 'A⁻¹ = adj(A)/det(A).', visual: { type: 'matrix', matrix: out } };
            }
            if (Math.abs(det) < 1e-12) throw new InputError('Cramer’s rule requires det(A) ≠ 0; this system has no unique solution.');
            const rhs = Array.from({ length: n }, (_, i) => number(v[`v${i + 1}`], `b${i + 1}`));
            const solution = Array.from({ length: n }, (_, col) => {
                const replaced = A.map((row, i) => row.map((value, j) => j === col ? rhs[i] : value));
                return determinant(replaced) / det;
            });
            return { answer: `det(A) = ${format(det)}; solution X = (${solution.map(format).join(', ')}).`, steps: 'Cramer’s rule replaces one column of A at a time with b, then divides that determinant by det(A).', visual: { type: 'matrix', matrix: A } };
        }),
        'continuity-differentiability': config('Polynomial Derivative Calculator', 'Evaluate a cubic function and its derivative at a point.', 'For f(x) = ax³ + bx² + cx + d, f′(x) = 3ax² + 2bx + c.', [
            field('a', 'Coefficient a of x³', 1), field('b', 'Coefficient b of x²', 0), field('c', 'Coefficient c of x', -3), field('d', 'Constant d', 2), field('x', 'Point x', 2)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), c = number(v.c, 'c'), d = number(v.d, 'd'), x = number(v.x, 'x');
            return { answer: `f(${format(x)}) = ${format(a * x ** 3 + b * x ** 2 + c * x + d)}; f′(${format(x)}) = ${format(3 * a * x ** 2 + 2 * b * x + c)}.`, steps: 'Differentiate term by term and substitute the selected x-value.' };
        }),
        'applications-derivatives': config('Quadratic Optimization Calculator', 'Find a quadratic vertex and the tangent line at a selected point.', 'For f(x)=ax²+bx+c, the vertex occurs at x = −b/(2a).', [
            field('a', 'Coefficient a of x²', 1), field('b', 'Coefficient b of x', -4), field('c', 'Constant c', 3), field('x', 'Tangent point x', 2)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), c = number(v.c, 'c'), x = number(v.x, 'x');
            if (!a) throw new InputError('Coefficient a must be non-zero to have a quadratic vertex.');
            const xv = -b / (2 * a), yv = a * xv ** 2 + b * xv + c, y = a * x ** 2 + b * x + c, slope = 2 * a * x + b;
            const intercept = y - slope * x;
            const tangent = slope === 0
                ? `y = ${format(intercept)}`
                : `y = ${format(slope)}x ${intercept < 0 ? '−' : '+'} ${format(Math.abs(intercept))}`;
            return { answer: `Vertex (${format(xv)}, ${format(yv)}) is a ${a > 0 ? 'minimum' : 'maximum'}. Tangent at x=${format(x)}: ${tangent}.`, steps: `The derivative is f′(x)=2ax+b; its value at the tangent point is the tangent slope.` };
        }),
        integrals: config('Definite Polynomial Integral', 'Evaluate a definite integral for a cubic polynomial.', '∫(ax³+bx²+cx+d)dx = ax⁴/4 + bx³/3 + cx²/2 + dx.', [
            field('a', 'Coefficient a of x³', 1), field('b', 'Coefficient b of x²', 0), field('c', 'Coefficient c of x', 0), field('d', 'Constant d', 0),
            field('lower', 'Lower bound', 0), field('upper', 'Upper bound', 2)
        ], v => {
            const a = number(v.a, 'a'), b = number(v.b, 'b'), c = number(v.c, 'c'), d = number(v.d, 'd'), lower = number(v.lower, 'Lower bound'), upper = number(v.upper, 'Upper bound');
            const F = x => a * x ** 4 / 4 + b * x ** 3 / 3 + c * x ** 2 / 2 + d * x;
            return { answer: `∫ from ${format(lower)} to ${format(upper)} f(x) dx = ${format(F(upper) - F(lower))}.`, steps: 'An antiderivative is evaluated at the upper bound and the lower-bound value is subtracted.' };
        }),
        'applications-integrals': config('Area Under a Linear Curve', 'Find the geometric area between a straight line and the x-axis over an interval.', 'For y = mx + c, split the interval at its x-intercept if the line crosses the axis.', [
            field('m', 'Slope m', 2), field('c', 'Intercept c', -3), field('lower', 'Lower x-bound', 0), field('upper', 'Upper x-bound', 4)
        ], v => {
            const m = number(v.m, 'm'), c = number(v.c, 'c'), lower = number(v.lower, 'Lower bound'), upper = number(v.upper, 'Upper bound');
            if (upper < lower) throw new InputError('Upper bound must not be smaller than lower bound.');
            const signed = x => m * x * x / 2 + c * x;
            let area;
            const root = m ? -c / m : null;
            if (root !== null && root > lower && root < upper) area = Math.abs(signed(root) - signed(lower)) + Math.abs(signed(upper) - signed(root));
            else area = Math.abs(signed(upper) - signed(lower));
            return { answer: `Area = ${format(area)} square units.`, steps: root !== null && root > lower && root < upper ? `The line crosses the x-axis at x=${format(root)}, so the interval is split there.` : 'The area is the absolute value of the definite integral over the interval.' };
        }),
        'differential-equations': config('Exponential Growth and Decay', 'Solve dy/dx = ky using an initial value y(x₀)=y₀.', 'The solution is y(x) = y₀eᵏ⁽ˣ⁻ˣ⁰⁾.', [
            field('k', 'Growth/decay constant k', 0.2), field('y0', 'Initial value y₀', 100), field('x0', 'Initial x₀', 0), field('x', 'Find y at x', 5)
        ], v => {
            const k = number(v.k, 'k'), y0 = number(v.y0, 'y₀'), x0 = number(v.x0, 'x₀'), x = number(v.x, 'x');
            return { answer: `y(${format(x)}) = ${format(y0 * Math.exp(k * (x - x0)))}.`, steps: `Substitute the initial value and x into y = y₀eᵏ⁽ˣ⁻ˣ⁰⁾.` };
        }),
        'vector-algebra': config('Vector Operations Calculator', 'Find the dot product, cross product, magnitudes, and angle between two 3D vectors.', 'a·b = a₁b₁ + a₂b₂ + a₃b₃; cos θ = (a·b)/(|a||b|).', [
            field('ax', 'Vector a: x', 1), field('ay', 'Vector a: y', 2), field('az', 'Vector a: z', 3),
            field('bx', 'Vector b: x', 4), field('by', 'Vector b: y', 5), field('bz', 'Vector b: z', 6)
        ], v => {
            const [ax, ay, az, bx, by, bz] = ['ax', 'ay', 'az', 'bx', 'by', 'bz'].map(key => number(v[key], key));
            const dot = ax * bx + ay * by + az * bz, cross = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
            const ma = Math.hypot(ax, ay, az), mb = Math.hypot(bx, by, bz);
            const angle = ma && mb ? Math.acos(Math.max(-1, Math.min(1, dot / (ma * mb)))) * 180 / Math.PI : null;
            return { answer: `a·b = ${format(dot)}; a×b = (${cross.map(format).join(', ')}); |a| = ${format(ma)}; |b| = ${format(mb)}; angle = ${angle === null ? 'undefined for a zero vector' : `${format(angle)}°`}.`, steps: 'The cross-product components use the determinant rule; the angle follows from the dot-product identity.' };
        }),
        'three-dimensional-geometry': config('Point-to-Plane Distance', 'Find the perpendicular distance from a point to a plane.', 'For plane Ax + By + Cz + D = 0, distance = |Ax₀+By₀+Cz₀+D|/√(A²+B²+C²).', [
            field('a', 'Plane coefficient A', 2), field('b', 'Plane coefficient B', -1), field('c', 'Plane coefficient C', 2), field('d', 'Plane constant D', -3),
            field('x', 'Point x₀', 1), field('y', 'Point y₀', 2), field('z', 'Point z₀', 3)
        ], v => {
            const a = number(v.a, 'A'), b = number(v.b, 'B'), c = number(v.c, 'C'), d = number(v.d, 'D'), x = number(v.x, 'x₀'), y = number(v.y, 'y₀'), z = number(v.z, 'z₀');
            const denominator = Math.hypot(a, b, c);
            if (!denominator) throw new InputError('At least one plane coefficient A, B, or C must be non-zero.');
            return { answer: `Perpendicular distance = ${format(Math.abs(a * x + b * y + c * z + d) / denominator)} units.`, steps: 'Substitute the point into the plane-distance formula and divide by the magnitude of the normal vector.' };
        }),
        'linear-programming': config('Linear Programming Solver', 'Build a two-variable linear program from constraints, choose variable sign conditions, and find its optimum.', 'For a bounded feasible region, a linear objective reaches its optimum at a corner point.', [
            field('objective', 'Objective', 'max', { type: 'select', options: [['max', 'Maximize'], ['min', 'Minimize']] }),
            field('p', 'Coefficient of x in Z = px + qy', 3), field('q', 'Coefficient of y in Z = px + qy', 2),
            field('xDomain', 'Condition for x', 'nonnegative', { type: 'select', options: [['nonnegative', 'x ≥ 0'], ['nonpositive', 'x ≤ 0'], ['free', 'x is unrestricted'], ['zero', 'x = 0']] }),
            field('yDomain', 'Condition for y', 'nonnegative', { type: 'select', options: [['nonnegative', 'y ≥ 0'], ['nonpositive', 'y ≤ 0'], ['free', 'y is unrestricted'], ['zero', 'y = 0']] }),
            field('constraintCount', 'Number of constraints', '3', { type: 'select', options: Array.from({ length: 8 }, (_, index) => [String(index + 1), `${index + 1} ${index ? 'constraints' : 'constraint'}`]) }),
            ...Array.from({ length: 8 }, (_, index) => [
                field(`a${index + 1}`, `Constraint ${index + 1}: coefficient of x`, index === 0 ? 1 : index === 1 ? 1 : index === 2 ? 3 : 1),
                field(`b${index + 1}`, `Constraint ${index + 1}: coefficient of y`, index === 0 ? 1 : index === 1 ? 0 : index === 2 ? 2 : 1),
                field(`relation${index + 1}`, `Constraint ${index + 1}: relation`, '<=', { type: 'select', options: [['<=', '≤'], ['>=', '≥'], ['=', '=']] }),
                field(`c${index + 1}`, `Constraint ${index + 1}: right side`, index === 0 ? 4 : index === 1 ? 2 : index === 2 ? 12 : 4)
            ]).flat()
        ], v => {
            const p = number(v.p, 'p'), q = number(v.q, 'q');
            const count = integer(v.constraintCount, 'Number of constraints', 1, 8);
            const constraints = [];
            for (let index = 1; index <= count; index++) {
                const a = number(v[`a${index}`], `Constraint ${index}, x coefficient`);
                const b = number(v[`b${index}`], `Constraint ${index}, y coefficient`);
                const c = number(v[`c${index}`], `Constraint ${index}, right side`);
                const relation = v[`relation${index}`];
                if (!a && !b) {
                    const valid = relation === '<=' ? 0 <= c : relation === '>=' ? 0 >= c : c === 0;
                    if (!valid) return { answer: 'The constraints are infeasible.', steps: `Constraint ${index} has no variable terms and is false for every (x, y).` };
                    continue;
                }
                if (relation === '<=' || relation === '=') constraints.push({ a, b, c });
                if (relation === '>=' || relation === '=') constraints.push({ a: -a, b: -b, c: -c });
            }
            const addDomain = (variable, domain) => {
                if (domain === 'nonnegative' || domain === 'zero') constraints.push({ a: variable === 'x' ? -1 : 0, b: variable === 'y' ? -1 : 0, c: 0 });
                if (domain === 'nonpositive' || domain === 'zero') constraints.push({ a: variable === 'x' ? 1 : 0, b: variable === 'y' ? 1 : 0, c: 0 });
            };
            addDomain('x', v.xDomain);
            addDomain('y', v.yDomain);
            const satisfies = (x, y) => constraints.every(({ a, b, c }) => a * x + b * y <= c + 1e-8 * Math.max(1, Math.abs(c)));
            const points = [];
            const addPoint = (x, y) => {
                if (Number.isFinite(x) && Number.isFinite(y) && satisfies(x, y)
                    && !points.some(([px, py]) => Math.hypot(px - x, py - y) < 1e-8)) points.push([x, y]);
            };
            addPoint(0, 0);
            constraints.forEach(({ a, b, c }) => {
                const denominator = a * a + b * b;
                addPoint(a * c / denominator, b * c / denominator);
            });
            constraints.forEach((first, index) => constraints.slice(index + 1).forEach(second => {
                const determinant = first.a * second.b - second.a * first.b;
                if (Math.abs(determinant) < 1e-12) return;
                addPoint((first.c * second.b - second.c * first.b) / determinant,
                    (first.a * second.c - second.a * first.c) / determinant);
            }));
            if (!points.length) return { answer: 'The constraints have no feasible solution.', steps: 'No point satisfies all the selected inequalities, equalities, and variable conditions.' };

            const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            constraints.forEach(({ a, b }) => directions.push([-b, a], [b, -a]));
            const feasibleDirections = directions.filter(([dx, dy]) => Math.hypot(dx, dy) > 1e-12
                && constraints.every(({ a, b }) => a * dx + b * dy <= 1e-10));
            const objectiveDirection = v.objective === 'max' ? 1 : -1;
            const unbounded = feasibleDirections.some(([dx, dy]) => objectiveDirection * (p * dx + q * dy) > 1e-10);
            if (unbounded) {
                return {
                    answer: `The ${v.objective === 'max' ? 'maximum' : 'minimum'} is unbounded; there is no finite optimum.`,
                    steps: 'A feasible direction allows the objective to keep improving without violating any constraint.',
                    visual: { type: 'linear-programming', constraints, points, bounded: false }
                };
            }
            const values = points.map(([x, y]) => p * x + q * y);
            const optimum = v.objective === 'max' ? Math.max(...values) : Math.min(...values);
            const best = points.filter((_, index) => Math.abs(values[index] - optimum) < 1e-8);
            const objective = `${format(p)}x ${q < 0 ? '−' : '+'} ${format(Math.abs(q))}y`;
            return {
                answer: `Optimal ${v.objective === 'max' ? 'maximum' : 'minimum'} Z = ${format(optimum)} at ${best.map(([x, y]) => `(${format(x)}, ${format(y)})`).join(' and ')}.`,
                steps: `Z = ${objective} is evaluated at the feasible corner points, including applicable axis/equality boundaries.`,
                visual: { type: 'linear-programming', constraints, points, bounded: feasibleDirections.length === 0 }
            };
        }),
        probability: config('Conditional Probability Checker', 'Find a conditional probability and check whether two events are independent.', 'P(A|B) = P(A∩B)/P(B); A and B are independent when P(A∩B)=P(A)P(B).', [
            field('pa', 'P(A)', 0.5), field('pb', 'P(B)', 0.4), field('pab', 'P(A ∩ B)', 0.2),
            field('condition', 'Conditional probability', 'a-given-b', { type: 'select', options: [['a-given-b', 'P(A | B)'], ['b-given-a', 'P(B | A)']] })
        ], v => {
            const pa = number(v.pa, 'P(A)'), pb = number(v.pb, 'P(B)'), pab = number(v.pab, 'P(A ∩ B)');
            if ([pa, pb, pab].some(p => p < 0 || p > 1)) throw new InputError('Probabilities must be between 0 and 1.');
            if (pab > Math.min(pa, pb) || pab < Math.max(0, pa + pb - 1)) throw new InputError('These event probabilities are not mutually consistent.');
            const denominator = v.condition === 'a-given-b' ? pb : pa;
            if (!denominator) throw new InputError('The conditioning event must have non-zero probability.');
            const conditional = pab / denominator, independent = Math.abs(pab - pa * pb) < 1e-10;
            return { answer: `${v.condition === 'a-given-b' ? 'P(A | B)' : 'P(B | A)'} = ${format(conditional)}; events are ${independent ? '' : 'not '}independent.`, steps: `Compare P(A ∩ B) = ${format(pab)} with P(A)P(B) = ${format(pa * pb)}.` };
        })
    };

    function parseData(raw) {
        const parts = raw.trim().split(/[\s,;]+/).filter(Boolean);
        if (!parts.length) throw new InputError('Enter at least one observation.');
        if (parts.length > 1000) throw new InputError('Enter no more than 1,000 observations.');
        return parts.map((value, index) => number(value, `Observation ${index + 1}`));
    }

    function svgElement(name, attrs = {}, text = '') {
        const element = document.createElementNS('http://www.w3.org/2000/svg', name);
        Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
        if (text) element.textContent = text;
        return element;
    }

    function makeSvg(label) {
        return svgElement('svg', {
            class: 'grade-tool-chart',
            viewBox: '0 0 520 320',
            role: 'img',
            'aria-label': label
        });
    }

    function addAxes(svg) {
        const left = 44, right = 496, top = 20, bottom = 282;
        for (let i = 0; i <= 10; i++) {
            const x = left + (right - left) * i / 10;
            const y = top + (bottom - top) * i / 10;
            svg.append(
                svgElement('line', { class: 'grade-chart-grid', x1: x, y1: top, x2: x, y2: bottom }),
                svgElement('line', { class: 'grade-chart-grid', x1: left, y1: y, x2: right, y2: y })
            );
        }
        svg.append(
            svgElement('line', { class: 'grade-chart-axis', x1: left, y1: 151, x2: right, y2: 151 }),
            svgElement('line', { class: 'grade-chart-axis', x1: 270, y1: top, x2: 270, y2: bottom }),
            svgElement('text', { class: 'grade-chart-label', x: right - 12, y: 142 }, 'x'),
            svgElement('text', { class: 'grade-chart-label', x: 279, y: top + 12 }, 'y')
        );
        return {
            x: value => 270 + Math.max(-5, Math.min(5, value)) * 45,
            y: value => 151 - Math.max(-5, Math.min(5, value)) * 26
        };
    }

    function pathFromFunction(map, fn, start = -5, end = 5, samples = 160) {
        let path = '', drawing = false;
        for (let i = 0; i <= samples; i++) {
            const x = start + (end - start) * i / samples;
            const y = fn(x);
            if (!Number.isFinite(y) || Math.abs(y) > 20) {
                drawing = false;
                continue;
            }
            path += `${drawing ? 'L' : 'M'}${map.x(x).toFixed(2)},${map.y(y).toFixed(2)} `;
            drawing = true;
        }
        return path.trim();
    }

    function addPlot(svg, functions) {
        const map = addAxes(svg);
        functions.forEach((fn, index) => {
            const d = pathFromFunction(map, fn);
            if (d) svg.appendChild(svgElement('path', {
                class: index ? 'grade-chart-curve grade-chart-curve-secondary' : 'grade-chart-curve',
                d,
                fill: 'none'
            }));
        });
        return map;
    }

    function makeMatrixDiagram(matrix) {
        const svg = makeSvg('Matrix visualization');
        const size = matrix.length, cell = Math.min(76, 220 / size), originX = 260 - size * cell / 2, originY = 150 - size * cell / 2;
        matrix.flat().forEach((value, index) => {
            const row = Math.floor(index / size), column = index % size;
            const x = originX + column * cell, y = originY + row * cell;
            svg.append(
                svgElement('rect', { class: 'grade-matrix-cell', x, y, width: cell - 5, height: cell - 5, rx: 8 }),
                svgElement('text', { class: 'grade-matrix-value', x: x + (cell - 5) / 2, y: y + cell / 2 + 5, 'text-anchor': 'middle' }, format(value))
            );
        });
        return svg;
    }

    function makeVisualization(topic, values, result) {
        if (result.visual?.type === 'matrix') return makeMatrixDiagram(result.visual.matrix);
        if (result.visual?.type === 'linear-programming') {
            const svg = makeSvg('Linear programming constraints and feasible region');
            const { constraints, points, bounded } = result.visual;
            const left = 54, right = 494, top = 22, bottom = 278;
            const allX = [...points.map(point => point[0]), 0], allY = [...points.map(point => point[1]), 0];
            const span = (values, floor) => {
                let min = Math.min(...values), max = Math.max(...values);
                if (max - min < floor) { min -= floor / 2; max += floor / 2; }
                const padding = (max - min) * 0.18;
                return [min - padding, max + padding];
            };
            const [minX, maxX] = span(allX, 8), [minY, maxY] = span(allY, 8);
            const x = value => left + (value - minX) / (maxX - minX) * (right - left);
            const y = value => bottom - (value - minY) / (maxY - minY) * (bottom - top);
            for (let index = 0; index <= 8; index++) {
                const gx = left + (right - left) * index / 8, gy = top + (bottom - top) * index / 8;
                svg.append(
                    svgElement('line', { class: 'grade-chart-grid', x1: gx, y1: top, x2: gx, y2: bottom }),
                    svgElement('line', { class: 'grade-chart-grid', x1: left, y1: gy, x2: right, y2: gy })
                );
            }
            if (minY <= 0 && maxY >= 0) svg.appendChild(svgElement('line', { class: 'grade-chart-axis', x1: left, y1: y(0), x2: right, y2: y(0) }));
            if (minX <= 0 && maxX >= 0) svg.appendChild(svgElement('line', { class: 'grade-chart-axis', x1: x(0), y1: top, x2: x(0), y2: bottom }));
            const hull = points.slice().sort((first, second) => first[0] - second[0] || first[1] - second[1]);
            const cross = (origin, first, second) => (first[0] - origin[0]) * (second[1] - origin[1]) - (first[1] - origin[1]) * (second[0] - origin[0]);
            if (bounded && hull.length >= 3) {
                const lower = [], upper = [];
                hull.forEach(point => {
                    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 1e-10) lower.pop();
                    lower.push(point);
                });
                hull.slice().reverse().forEach(point => {
                    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 1e-10) upper.pop();
                    upper.push(point);
                });
                const polygon = [...lower.slice(0, -1), ...upper.slice(0, -1)];
                if (polygon.length >= 3) {
                    const path = polygon.map(([px, py], index) => `${index ? 'L' : 'M'}${x(px)},${y(py)}`).join(' ') + ' Z';
                    svg.appendChild(svgElement('path', { class: 'grade-chart-region', d: path }));
                }
            }
            constraints.forEach(({ a, b, c }) => {
                const intersections = [];
                if (Math.abs(b) > 1e-12) {
                    [minX, maxX].forEach(px => {
                        const py = (c - a * px) / b;
                        if (py >= minY && py <= maxY) intersections.push([px, py]);
                    });
                }
                if (Math.abs(a) > 1e-12) {
                    [minY, maxY].forEach(py => {
                        const px = (c - b * py) / a;
                        if (px >= minX && px <= maxX) intersections.push([px, py]);
                    });
                }
                if (intersections.length >= 2) {
                    const first = intersections[0], last = intersections[intersections.length - 1];
                    svg.appendChild(svgElement('line', { class: 'grade-chart-curve-secondary', x1: x(first[0]), y1: y(first[1]), x2: x(last[0]), y2: y(last[1]) }));
                }
            });
            points.forEach(([px, py]) => svg.appendChild(svgElement('circle', { class: 'grade-chart-point', cx: x(px), cy: y(py), r: 5 })));
            return svg;
        }
        if (result.visual?.type === 'sets') {
            const svg = makeSvg('Venn diagram for the selected sets');
            const { a, b, intersection } = result.visual;
            svg.append(
                svgElement('circle', { class: 'grade-venn-circle', cx: 205, cy: 157, r: 90 }),
                svgElement('circle', { class: 'grade-venn-circle grade-venn-secondary', cx: 315, cy: 157, r: 90 }),
                svgElement('text', { class: 'grade-chart-label', x: 180, y: 88, 'text-anchor': 'middle' }, 'A'),
                svgElement('text', { class: 'grade-chart-label', x: 340, y: 88, 'text-anchor': 'middle' }, 'B'),
                svgElement('text', { class: 'grade-chart-label', x: 160, y: 162, 'text-anchor': 'middle' }, String(a - intersection)),
                svgElement('text', { class: 'grade-chart-label', x: 260, y: 162, 'text-anchor': 'middle' }, String(intersection)),
                svgElement('text', { class: 'grade-chart-label', x: 360, y: 162, 'text-anchor': 'middle' }, String(b - intersection))
            );
            return svg;
        }
        if (topic === 'sets') {
            const svg = makeSvg('Venn diagram for set cardinalities');
            const a = number(values.a, '|A|'), b = number(values.b, '|B|'), intersection = number(values.intersection, '|A ∩ B|');
            svg.append(
                svgElement('circle', { class: 'grade-venn-circle', cx: 205, cy: 157, r: 90 }),
                svgElement('circle', { class: 'grade-venn-circle grade-venn-secondary', cx: 315, cy: 157, r: 90 }),
                svgElement('text', { class: 'grade-chart-label', x: 180, y: 88, 'text-anchor': 'middle' }, 'A'),
                svgElement('text', { class: 'grade-chart-label', x: 340, y: 88, 'text-anchor': 'middle' }, 'B'),
                svgElement('text', { class: 'grade-chart-label', x: 160, y: 162, 'text-anchor': 'middle' }, String(a - intersection)),
                svgElement('text', { class: 'grade-chart-label', x: 260, y: 162, 'text-anchor': 'middle' }, String(intersection)),
                svgElement('text', { class: 'grade-chart-label', x: 360, y: 162, 'text-anchor': 'middle' }, String(b - intersection))
            );
            return svg;
        }
        if (topic === 'linear-inequalities') {
            const svg = makeSvg('Number line showing the inequality solution');
            const relation = values.relation, a = number(values.a, 'a');
            if (a === 0) {
                const svg = makeSvg('Number line for a constant inequality');
                const b = number(values.b, 'b'), c = number(values.c, 'c');
                const valid = relation === '<' ? b < c : relation === '<=' ? b <= c : relation === '>' ? b > c : b >= c;
                svg.append(svgElement('line', { class: 'grade-chart-axis', x1: 54, y1: 160, x2: 466, y2: 160 }));
                svg.append(svgElement('text', { class: 'grade-chart-label', x: 260, y: 130, 'text-anchor': 'middle' }, valid ? 'All real numbers' : 'No solution'));
                return svg;
            }
            const boundary = (number(values.c, 'c') - number(values.b, 'b')) / a;
            const x = 260 + Math.max(-5, Math.min(5, boundary)) * 44;
            const inclusive = relation.includes('='), pointsRight = relation[0] === '>';
            svg.append(
                svgElement('line', { class: 'grade-chart-axis', x1: 54, y1: 160, x2: 466, y2: 160 }),
                svgElement('line', { class: 'grade-chart-curve', x1: pointsRight ? x : 54, y1: 160, x2: pointsRight ? 466 : x, y2: 160 }),
                svgElement('circle', { class: inclusive ? 'grade-number-point-filled' : 'grade-number-point-open', cx: x, cy: 160, r: 9 }),
                svgElement('text', { class: 'grade-chart-label', x, y: 202, 'text-anchor': 'middle' }, format(boundary)),
                svgElement('text', { class: 'grade-chart-label', x: 260, y: 86, 'text-anchor': 'middle' }, `x ${relation} ${format(boundary)}`)
            );
            return svg;
        }
        if (topic === 'matrices' || topic === 'determinants') {
            const matrix = result.visual?.matrix || readMatrix(values, 'a', Number(values.size));
            return makeMatrixDiagram(matrix);
        }
        if (topic === 'vector-algebra') {
            const svg = makeSvg('Two-dimensional projection of the vector inputs');
            const map = addAxes(svg);
            [['a', 'grade-chart-curve'], ['b', 'grade-chart-curve-secondary']].forEach(([prefix, className]) => {
                const x = number(values[`${prefix}x`], `${prefix} x`), y = number(values[`${prefix}y`], `${prefix} y`);
                svg.append(
                    svgElement('line', { class: className, x1: map.x(0), y1: map.y(0), x2: map.x(x), y2: map.y(y) }),
                    svgElement('circle', { class: 'grade-chart-point', cx: map.x(x), cy: map.y(y), r: 5 })
                );
            });
            return svg;
        }
        if (topic === 'statistics') {
            const svg = makeSvg('Observation frequency chart');
            const data = parseData(values.data);
            const frequencies = new Map();
            data.forEach(value => frequencies.set(value, (frequencies.get(value) || 0) + 1));
            const entries = [...frequencies].slice(0, 12);
            const max = Math.max(...entries.map(([, count]) => count), 1);
            const barWidth = 390 / entries.length;
            entries.forEach(([value, count], index) => {
                const height = 190 * count / max, x = 64 + index * barWidth, y = 257 - height;
                svg.append(
                    svgElement('rect', { class: 'grade-chart-bar', x: x + 3, y, width: Math.max(4, barWidth - 7), height, rx: 4 }),
                    svgElement('text', { class: 'grade-chart-label', x: x + barWidth / 2, y: 278, 'text-anchor': 'middle' }, format(value)),
                    svgElement('text', { class: 'grade-chart-label', x: x + barWidth / 2, y: y - 7, 'text-anchor': 'middle' }, String(count))
                );
            });
            return svg;
        }
        if (topic === 'probability') {
            const svg = makeSvg('Probability comparison chart');
            const data = grade === '11'
                ? [
                    ['P(E)', number(values.favorable, 'Favorable outcomes') / number(values.total, 'Total outcomes')],
                    ['P(E′)', 1 - number(values.favorable, 'Favorable outcomes') / number(values.total, 'Total outcomes')]
                ]
                : [
                    ['P(A)', number(values.pa, 'P(A)')],
                    ['P(B)', number(values.pb, 'P(B)')],
                    ['P(A∩B)', number(values.pab, 'P(A ∩ B)')]
                ];
            const barWidth = 350 / data.length;
            data.forEach(([label, probability], index) => {
                const height = 190 * probability, x = 85 + index * barWidth, y = 257 - height;
                svg.append(
                    svgElement('rect', { class: 'grade-chart-bar', x: x + 24, y, width: barWidth - 48, height, rx: 5 }),
                    svgElement('text', { class: 'grade-chart-label', x: x + barWidth / 2, y: 278, 'text-anchor': 'middle' }, label),
                    svgElement('text', { class: 'grade-chart-label', x: x + barWidth / 2, y: y - 7, 'text-anchor': 'middle' }, format(probability))
                );
            });
            return svg;
        }
        if (topic === 'permutations-combinations' || topic === 'binomial-theorem') {
            const svg = makeSvg('Binomial coefficient bars');
            const n = Math.min(14, integer(values.n, 'n', 0, 100));
            const coeffs = Array.from({ length: n + 1 }, (_, r) => choose(n, r));
            const max = Math.max(...coeffs, 1), barWidth = 410 / coeffs.length;
            coeffs.forEach((coefficient, index) => {
                const height = 190 * coefficient / max, x = 56 + index * barWidth, y = 258 - height;
                svg.append(
                    svgElement('rect', { class: 'grade-chart-bar', x: x + 2, y, width: Math.max(3, barWidth - 4), height, rx: 3 }),
                    svgElement('text', { class: 'grade-chart-label', x: x + barWidth / 2, y: 278, 'text-anchor': 'middle' }, String(index))
                );
            });
            return svg;
        }

        const svg = makeSvg('Function graph visualization');
        if (topic === 'conic-sections') {
            const map = addAxes(svg), h = number(values.h, 'h'), k = number(values.k, 'k'), a = number(values.a, 'a'), b = number(values.b, 'b'), kind = values.kind;
            if (kind === 'circle' || kind === 'ellipse') {
                const radiusY = kind === 'circle' ? a : b;
                const points = Array.from({ length: 101 }, (_, index) => {
                    const angle = 2 * Math.PI * index / 100;
                    return `${index ? 'L' : 'M'}${map.x(h + a * Math.cos(angle))},${map.y(k + radiusY * Math.sin(angle))}`;
                }).join(' ') + ' Z';
                svg.appendChild(svgElement('path', { class: 'grade-chart-curve', d: points }));
            } else if (kind === 'parabola') {
                svg.appendChild(svgElement('path', { class: 'grade-chart-curve', d: pathFromFunction(map, x => k + (x - h) ** 2 / (4 * a)) }));
            } else {
                const path = pathFromFunction(map, x => Math.abs(x - h) >= a ? k + b * Math.sqrt((x - h) ** 2 / (a * a) - 1) : NaN);
                const lower = pathFromFunction(map, x => Math.abs(x - h) >= a ? k - b * Math.sqrt((x - h) ** 2 / (a * a) - 1) : NaN);
                [path, lower].forEach(d => d && svg.appendChild(svgElement('path', { class: 'grade-chart-curve', d })));
            }
            return svg;
        }
        if (topic === 'straight-lines') {
            const x1 = number(values.x1, 'x₁'), y1 = number(values.y1, 'y₁'), x2 = number(values.x2, 'x₂'), y2 = number(values.y2, 'y₂');
            const map = addAxes(svg);
            if (x1 === x2) {
                const x = map.x(x1);
                svg.appendChild(svgElement('line', { class: 'grade-chart-curve', x1: x, y1: 20, x2: x, y2: 282 }));
            } else {
                svg.appendChild(svgElement('path', { class: 'grade-chart-curve', d: pathFromFunction(map, x => y1 + (y2 - y1) / (x2 - x1) * (x - x1)) }));
            }
            return svg;
        }
        const functions = [];
        if (topic === 'trigonometric-functions') {
            functions.push(x => Math.sin(x * Math.PI / 2), x => Math.cos(x * Math.PI / 2));
        } else if (topic === 'relations-functions') {
            const a = number(values.a, 'a'), b = number(values.b, 'b');
            if (grade === '11') {
                const c = number(values.c, 'c');
                functions.push(x => a * x * x + b * x + c);
            }
            else {
                const c = number(values.c, 'c'), d = number(values.d, 'd');
                functions.push(x => a * x + b, x => c * x + d);
            }
        } else if (topic === 'limits-derivatives' || topic === 'continuity-differentiability' || topic === 'integrals') {
            const a = number(values.a, 'a'), b = number(values.b, 'b'), c = number(values.c, 'c'), d = number(values.d, 'd');
            functions.push(x => a * x ** 3 + b * x ** 2 + c * x + d);
            if (topic === 'limits-derivatives' || topic === 'continuity-differentiability') functions.push(x => 3 * a * x ** 2 + 2 * b * x + c);
        } else if (topic === 'applications-derivatives') {
            const a = number(values.a, 'a'), b = number(values.b, 'b'), c = number(values.c, 'c');
            functions.push(x => a * x * x + b * x + c);
        } else if (topic === 'applications-integrals') {
            const m = number(values.m, 'm'), c = number(values.c, 'c');
            functions.push(x => m * x + c);
        } else if (topic === 'differential-equations') {
            const k = number(values.k, 'k'), y0 = number(values.y0, 'y₀'), x0 = number(values.x0, 'x₀');
            functions.push(x => y0 * Math.exp(k * (x - x0)));
        } else if (topic === 'sequences-series') {
            const svgSequence = makeSvg('Sequence terms plotted by index');
            const map = addAxes(svgSequence), n = Math.min(15, integer(values.n, 'n', 1, 1000000));
            const a = number(values.first, 'first term'), step = number(values.step, 'difference or ratio');
            const termAt = index => values.kind === 'ap' ? a + (index - 1) * step : a * step ** (index - 1);
            for (let index = 1; index <= n; index++) {
                const x = -5 + 10 * (index - 1) / Math.max(1, n - 1);
                const y = termAt(index);
                svgSequence.appendChild(svgElement('circle', { class: 'grade-chart-point', cx: map.x(x), cy: map.y(y), r: 4 }));
            }
            return svgSequence;
        } else         if (topic === 'inverse-trigonometric-functions') {
            const map = addAxes(svg);
            [-1, 1].forEach(value => svg.appendChild(svgElement('line', { class: 'grade-chart-grid', x1: map.x(value), y1: 20, x2: map.x(value), y2: 282 })));
            const sinePath = pathFromFunction(map, x => Math.asin(x), -1, 1);
            if (sinePath) svg.appendChild(svgElement('path', { class: 'grade-chart-curve', d: sinePath }));
            const cosinePath = pathFromFunction(map, x => Math.acos(x), -1, 1);
            if (cosinePath) svg.appendChild(svgElement('path', { class: 'grade-chart-curve-secondary', d: cosinePath }));
            return svg;
        } else if (topic === 'complex-numbers') {
            const map = addAxes(svg);
            const points = [[number(values.ar, 'real part'), number(values.ai, 'imaginary part')]];
            if (['add', 'subtract', 'multiply', 'divide'].includes(values.operation)) {
                points.push([number(values.br, 'real part'), number(values.bi, 'imaginary part')]);
            }
            points.forEach(([x, y], index) => {
                svg.append(
                    svgElement('line', { class: index ? 'grade-chart-curve-secondary' : 'grade-chart-curve', x1: map.x(0), y1: map.y(0), x2: map.x(x), y2: map.y(y) }),
                    svgElement('circle', { class: 'grade-chart-point', cx: map.x(x), cy: map.y(y), r: 6 }),
                    svgElement('text', { class: 'grade-chart-label', x: map.x(x) + 8, y: map.y(y) - 8 }, `${format(x)} ${y < 0 ? '−' : '+'} ${format(Math.abs(y))}i`)
                );
            });
            return svg;
        } else if (topic === 'vector-algebra') {
            functions.push(x => x);
        } else if (topic === 'three-dimensional-geometry') {
            const map = addAxes(svg);
            if (grade === '11') {
                const project = (x, y, z) => [x + 0.5 * z, y - 0.35 * z];
                const first = project(number(values.x1, 'x₁'), number(values.y1, 'y₁'), number(values.z1, 'z₁'));
                const second = project(number(values.x2, 'x₂'), number(values.y2, 'y₂'), number(values.z2, 'z₂'));
                svg.append(
                    svgElement('line', { class: 'grade-chart-curve', x1: map.x(first[0]), y1: map.y(first[1]), x2: map.x(second[0]), y2: map.y(second[1]) }),
                    svgElement('circle', { class: 'grade-chart-point', cx: map.x(first[0]), cy: map.y(first[1]), r: 7 }),
                    svgElement('circle', { class: 'grade-chart-point', cx: map.x(second[0]), cy: map.y(second[1]), r: 7 }),
                    svgElement('text', { class: 'grade-chart-label', x: map.x(first[0]) + 8, y: map.y(first[1]) - 8 }, 'P₁'),
                    svgElement('text', { class: 'grade-chart-label', x: map.x(second[0]) + 8, y: map.y(second[1]) - 8 }, 'P₂')
                );
            } else {
                const a = number(values.a, 'A'), b = number(values.b, 'B'), c = number(values.c, 'C'), d = number(values.d, 'D');
                const z = number(values.z, 'z'), x0 = number(values.x, 'x'), y0 = number(values.y, 'y');
                if (Math.abs(a) + Math.abs(b) > 1e-12) {
                    const intercept = -c * z - d;
                    const line = pathFromFunction(map, x => Math.abs(b) > 1e-12 ? (intercept - a * x) / b : NaN);
                    if (line) svg.appendChild(svgElement('path', { class: 'grade-chart-curve-secondary', d: line }));
                    else {
                        const xLine = -intercept / a;
                        svg.appendChild(svgElement('line', { class: 'grade-chart-curve-secondary', x1: map.x(xLine), y1: 20, x2: map.x(xLine), y2: 282 }));
                    }
                } else {
                    svg.appendChild(svgElement('text', { class: 'grade-chart-label', x: 270, y: 42, 'text-anchor': 'middle' }, 'Horizontal plane'));
                }
                svg.append(
                    svgElement('circle', { class: 'grade-chart-point', cx: map.x(x0), cy: map.y(y0), r: 7 }),
                    svgElement('text', { class: 'grade-chart-label', x: map.x(x0) + 10, y: map.y(y0) - 10 }, `(${format(x0)}, ${format(y0)}, ${format(z)})`)
                );
            }
            return svg;
        }
        if (functions.length) addPlot(svg, functions);
        else addAxes(svg);
        return svg;
    }

    class InputError extends Error {}

    if (!app) {
        const search = document.getElementById('chapterSearch');
        const links = [...document.querySelectorAll('#gradeToolLinks .calc-button')];
        const count = document.getElementById('chapterCount');
        const empty = document.getElementById('noChapters');
        search?.addEventListener('input', () => {
            const query = search.value.trim().toLocaleLowerCase();
            let visible = 0;
            links.forEach(link => {
                const matches = link.textContent.toLocaleLowerCase().includes(query);
                link.hidden = !matches;
                if (matches) visible++;
            });
            if (count) count.textContent = query ? `${visible} of ${links.length} chapters` : `${links.length} chapters available`;
            if (empty) empty.hidden = visible !== 0;
        });
        return;
    }

    const catalogs = { '11': grade11, '12': grade12 };
    const selected = catalogs[grade]?.[topic];
    if (!selected) {
        app.textContent = 'This calculator is not available. Return to the chapter list and choose a topic.';
        return;
    }

    document.title = `${selected.title} • Grade ${grade}`;
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `CBSE • NCERT • GRADE ${grade}`;
    const heading = document.createElement('h1');
    heading.textContent = selected.title;
    const intro = document.createElement('p');
    intro.className = 'grade-tools-intro';
    intro.textContent = selected.intro;
    const formula = document.createElement('p');
    formula.className = 'grade-tool-formula';
    formula.textContent = selected.formula;
    const form = document.createElement('form');
    form.className = 'calculator grade-tool-form';
    const inputs = new Map();
    const wrappers = new Map();

    selected.fields.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'grade-tool-field';
        if (item.matrix) {
            wrapper.dataset.matrix = item.matrix;
            wrapper.dataset.row = String(item.row);
            wrapper.dataset.column = String(item.column);
        }
        const label = document.createElement('label');
        const id = `input-${item.id}`;
        label.htmlFor = id;
        label.textContent = item.label;
        const input = document.createElement(item.type === 'select' ? 'select' : item.type === 'text' ? 'input' : 'input');
        input.id = id;
        input.name = item.id;
        if (item.type === 'select') {
            item.options.forEach(([value, text]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                input.appendChild(option);
            });
            input.value = item.value;
        } else {
            input.type = item.type || 'number';
            input.value = item.value;
            if (item.placeholder) input.placeholder = item.placeholder;
            if (input.type === 'number') input.step = 'any';
        }
        wrapper.append(label, input);
        form.appendChild(wrapper);
        inputs.set(item.id, input);
        wrappers.set(item.id, wrapper);
    });

    const submit = document.createElement('button');
    submit.className = 'grade-tool-submit';
    submit.type = 'submit';
    submit.textContent = 'Calculate';
    form.appendChild(submit);
    const output = document.createElement('section');
    output.className = 'result grade-tool-output';
    output.setAttribute('aria-live', 'polite');
    output.textContent = 'Enter values above, then choose Calculate.';
    const visualization = document.createElement('section');
    visualization.className = 'graph-container grade-tool-visualization';
    visualization.hidden = true;
    const visualizationHeading = document.createElement('h2');
    visualizationHeading.textContent = 'Graph Visualization';
    const diagram = document.createElement('div');
    diagram.className = 'grade-tool-diagram';
    visualization.append(visualizationHeading, diagram);
    app.replaceChildren(eyebrow, heading, intro, formula, form, output, visualization);

    function updateFieldVisibility() {
        const size = Number(inputs.get('size')?.value || 3);
        const operation = inputs.get('operation')?.value;
        if (topic === 'sequences-series' && inputs.get('kind')?.value !== 'gp') inputs.get('sumType').value = 'finite';
        const constraintCount = Number(inputs.get('constraintCount')?.value || 0);
        wrappers.forEach((wrapper, id) => {
            if (['setA', 'setB', 'setU'].includes(id)) wrapper.hidden = inputs.get('mode')?.value !== 'elements';
            if (['universe', 'a', 'b', 'intersection'].includes(id) && topic === 'sets') wrapper.hidden = inputs.get('mode')?.value !== 'cardinality';
            if (['br', 'bi'].includes(id) && topic === 'complex-numbers') wrapper.hidden = !['add', 'subtract', 'multiply', 'divide'].includes(operation);
            if (id === 'r' && topic === 'binomial-theorem') wrapper.hidden = inputs.get('mode')?.value !== 'term';
            if (id === 'sumType' && topic === 'sequences-series') wrapper.hidden = inputs.get('kind')?.value !== 'gp';
            const constraint = topic === 'linear-programming' && id.match(/^(?:a|b|c|relation)(\d+)$/);
            if (constraint) wrapper.hidden = Number(constraint[1]) > constraintCount;
            if (wrapper.dataset.matrix) {
                const outsideSize = Number(wrapper.dataset.row) >= size || Number(wrapper.dataset.column) >= size;
                const unusedMatrix = wrapper.dataset.matrix === 'b'
                    && !['add', 'subtract', 'multiply'].includes(operation);
                wrapper.hidden = outsideSize || unusedMatrix;
            }
            if (/^v[123]$/.test(id)) wrapper.hidden = operation !== 'solve' || Number(id.slice(1)) > size;
        });
    }

    ['size', 'operation', 'mode', 'kind', 'constraintCount'].forEach(id => inputs.get(id)?.addEventListener('change', updateFieldVisibility));
    updateFieldVisibility();

    form.addEventListener('submit', event => {
        event.preventDefault();
        const values = Object.fromEntries([...inputs].map(([key, input]) => [key, input.value]));
        try {
            const result = selected.calculate(values);
            output.dataset.state = 'success';
            const answer = document.createElement('strong');
            answer.textContent = result.answer;
            const steps = document.createElement('p');
            steps.className = 'steps';
            steps.textContent = result.steps;
            output.replaceChildren(answer, steps);
            diagram.replaceChildren(makeVisualization(topic, values, result));
            visualization.hidden = false;
        } catch (error) {
            if (!(error instanceof InputError)) throw error;
            output.dataset.state = 'error';
            const message = document.createElement('strong');
            message.textContent = error.message;
            output.replaceChildren(message);
        }
    });
})();
