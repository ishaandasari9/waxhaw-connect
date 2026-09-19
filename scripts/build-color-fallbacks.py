"""
Regenerates the hex fallback block in src/styles.css.

Every color on this site is written in oklch, which browsers before 2023 do not
understand. Those browsers would render unstyled text on an unstyled
background, so each custom property also gets a plain hex value inside an
@supports block that only older browsers apply.

Run after changing any color token:  python3 scripts/build-color-fallbacks.py
"""
import math
import re
from pathlib import Path

START = '/* Hex fallbacks for browsers without oklch support. Generated; see scripts/build-color-fallbacks.py */'
END = '/* End generated fallbacks */'


def to_hex(lightness, chroma, hue, alpha=None):
    a = chroma * math.cos(math.radians(hue))
    b = chroma * math.sin(math.radians(hue))
    l_, m_, s_ = (lightness + 0.3963377774 * a + 0.2158037573 * b,
                  lightness - 0.1055613458 * a - 0.0638541728 * b,
                  lightness - 0.0894841775 * a - 1.2914855480 * b)
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
           -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
           -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)

    def channel(value):
        value = 1.055 * value ** (1 / 2.4) - 0.055 if value > 0.0031308 else 12.92 * value
        return round(255 * max(0.0, min(1.0, value)))

    out = '#%02x%02x%02x' % tuple(channel(c) for c in rgb)
    return out + '%02x' % round(255 * alpha) if alpha is not None else out


OKLCH = re.compile(r'oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*(?:/\s*([\d.]+)\s*)?\)')


def convert(value):
    def replace(match):
        lightness = float(match.group(1))
        lightness = lightness / 100 if '%' in match.group(0).split()[0] or lightness > 1 else lightness
        alpha = float(match.group(4)) if match.group(4) else None
        return to_hex(lightness, float(match.group(2)), float(match.group(3)), alpha)
    return OKLCH.sub(replace, value)


def declarations_in(contents):
    return [(name.strip(), value.strip()) for name, value in
            (line.split(':', 1) for line in contents.split(';') if ':' in line)
            if name.strip().startswith('--') and 'oklch' in value]


def block(selector, declarations, indent='  '):
    lines = [f'{indent}  {name}: {convert(value)};' for name, value in declarations]
    return f'{indent}{selector} {{\n' + '\n'.join(lines) + f'\n{indent}}}'


def split_media(css):
    """Yields (media condition or None, css text). A dark-theme fallback has to
    stay inside its @media, or an old browser would apply it in light mode."""
    plain, index = [], 0
    while True:
        at = css.find('@media', index)
        if at < 0:
            plain.append(css[index:])
            break
        plain.append(css[index:at])
        open_brace = css.index('{', at)
        depth, position = 1, open_brace + 1
        while depth:
            if css[position] == '{':
                depth += 1
            elif css[position] == '}':
                depth -= 1
            position += 1
        yield css[at + 6:open_brace].strip(), css[open_brace + 1:position - 1]
        index = position
    yield None, ''.join(plain)


def main():
    path = Path(__file__).resolve().parent.parent / 'src' / 'styles.css'
    css = path.read_text()
    body = css.split(START)[0]

    rule = re.compile(r"(:root|html\[[^\]]+\](?:\[[^\]]+\])?)\s*\{([^}]*)\}")
    blocks = []
    for condition, section in split_media(body):
        inner = [block(selector, declarations_in(contents), '    ' if condition else '  ')
                 for selector, contents in rule.findall(section) if declarations_in(contents)]
        if not inner:
            continue
        blocks.append(f'  @media {condition} {{\n' + '\n'.join(inner) + '\n  }' if condition else '\n'.join(inner))

    generated = f'{START}\n@supports not (color: oklch(0% 0 0)) {{\n' + '\n'.join(blocks) + f'\n}}\n{END}\n'
    path.write_text(body.rstrip('\n') + '\n\n' + generated)
    print(f'Wrote fallbacks for {len(blocks)} rule(s).')


if __name__ == '__main__':
    main()
