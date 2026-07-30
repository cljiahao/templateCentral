<!-- ref: add/redaction/implementation.md
     loaded-by: add/SKILL.md
     prereq: Stack identified; project already has the templateCentral harness seeded (scaffold or migrate). Do not invoke this file directly — it is loaded at runtime by the templatecentral:add skill. -->

## Step 0 — Verify context

Confirm `.claude/settings.json` and `.claude/hooks/user-prompt-guard.cjs` (TS stacks) or
`.claude/hooks/user-prompt-guard.py` (FastAPI) already exist — this capability extends the existing
harness rather than creating one from scratch. If they don't exist, invoke `templatecentral:migrate`
first (Project-migration path), then re-check.

## Step 1 — Collect real values from the user

Ask the user for their project's real infrastructure values:

1. Real internal CIDR range(s) they want masked, e.g. `172.18.161.0/24`. IPv4 only.
2. Real internal domain suffix(es) they want masked, e.g. `corp.internal`.

At least one CIDR or one domain suffix is required — if the user has neither yet (a brand-new project
with no deployed infra), tell them to come back and run this capability once they do; there's nothing
to configure yet.

## Step 2 — Write `.claude/redaction-config.json`

Substitute the user's real values for the example below (JSON, not YAML — both hook runtimes parse it
with zero added dependencies):

```json
{
  "cidrs": ["172.18.161.0/24"],
  "domains": ["corp.internal"]
}
```

## Step 3 — Seed the `PostToolUse` hook

**For TS stacks (nestjs / nextjs / vite-react)** — write `.claude/hooks/redact-sensitive-output.cjs`:

```javascript
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), '.claude', 'redaction-config.json');
const MAP_PATH = path.join(process.cwd(), '.claude', '.redaction-map.json');
const SYNTHETIC_BASE = ipToInt('10.0.0.0'); // RFC 1918 private-use space
const SYNTHETIC_SPACE_BITS = 24; // 10.0.0.0/8 has 24 variable bits below the fixed leading octet
const DOMAIN_SUFFIX = 'example'; // RFC 2606 reserved

function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function intToIp(int) {
  return [24, 16, 8, 0].map((shift) => (int >>> shift) & 0xff).join('.');
}

function maskFor(prefixLen) {
  if (prefixLen === 0) return 0;
  return (0xffffffff << (32 - prefixLen)) >>> 0;
}

function parseCidr(cidrStr) {
  const [ip, prefixStr] = cidrStr.split('/');
  const prefixLen = Number(prefixStr);
  const mask = maskFor(prefixLen);
  const network = ipToInt(ip) & mask;
  return { network, prefixLen, mask };
}

function cidrContains(cidr, ipInt) {
  return (ipInt & cidr.mask) === cidr.network;
}

const IPV4_RE = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function emptyMap() {
  return { cidrs: {}, domains: {}, nextCidrOffset: 0, nextDomainIndex: 0 };
}

// Allocates a non-overlapping, alignment-correct synthetic block within 10.0.0.0/8
// for a CIDR of the given real prefix length. Known limitation: prefixLen <= 8 can
// only ever get ONE allocation (10.0.0.0/8 IS the entire synthetic space at that
// size) -- a second such range in config will collide. Real deployed ranges are
// essentially never a full /8, so this is accepted rather than solved.
function allocateSyntheticCidr(prefixLen, map) {
  const slotBits = 32 - prefixLen;
  const slotSize = slotBits >= 32 ? 0x100000000 : (1 << slotBits) >>> 0;
  const spaceSize = 1 << SYNTHETIC_SPACE_BITS; // 2^24
  let offset = map.nextCidrOffset;
  const remainder = offset % slotSize;
  if (remainder !== 0) offset += slotSize - remainder; // align
  if (offset + slotSize > spaceSize) {
    throw new Error('redact-sensitive-output: synthetic 10.0.0.0/8 space exhausted');
  }
  map.nextCidrOffset = offset + slotSize;
  const networkInt = (SYNTHETIC_BASE + offset) >>> 0;
  return { network: networkInt, prefixLen, mask: maskFor(prefixLen) };
}

function getOrAssignMaskedCidr(realCidrStr, map) {
  if (map.cidrs[realCidrStr]) return parseCidr(map.cidrs[realCidrStr]);
  const real = parseCidr(realCidrStr);
  const synthetic = allocateSyntheticCidr(real.prefixLen, map);
  const syntheticStr = `${intToIp(synthetic.network)}/${synthetic.prefixLen}`;
  map.cidrs[realCidrStr] = syntheticStr;
  return synthetic;
}

function getOrAssignMaskedDomain(realSuffix, map) {
  if (map.domains[realSuffix]) return map.domains[realSuffix];
  const synthetic = `masked${map.nextDomainIndex}.${DOMAIN_SUFFIX}`;
  map.domains[realSuffix] = synthetic;
  map.nextDomainIndex += 1;
  return synthetic;
}

function maskIps(text, cidrStrs, map) {
  let count = 0;
  const cidrs = cidrStrs.map((c) => ({ str: c, parsed: parseCidr(c) }));
  const masked = text.replace(IPV4_RE, (match) => {
    const ipInt = ipToInt(match);
    for (const { str, parsed } of cidrs) {
      if (cidrContains(parsed, ipInt)) {
        const synthetic = getOrAssignMaskedCidr(str, map);
        const hostBits = ipInt & ~synthetic.mask;
        const maskedInt = (hostBits | synthetic.network) >>> 0;
        count += 1;
        return intToIp(maskedInt);
      }
    }
    return match;
  });
  return { text: masked, count };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskDomains(text, domainSuffixes, map) {
  let count = 0;
  let masked = text;
  for (const suffix of domainSuffixes) {
    const re = new RegExp(`\\b(?:[\\w-]+\\.)*${escapeRegExp(suffix)}\\b`, 'g');
    masked = masked.replace(re, (match) => {
      const synthetic = getOrAssignMaskedDomain(suffix, map);
      const prefixLen = match.length - suffix.length;
      count += 1;
      return match.slice(0, prefixLen) + synthetic;
    });
  }
  return { text: masked, count };
}

function redact(text, config, map) {
  const ipResult = maskIps(text, config.cidrs || [], map);
  const domainResult = maskDomains(ipResult.text, config.domains || [], map);
  return { text: domainResult.text, count: ipResult.count + domainResult.count };
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) process.exit(0);

  let config;
  try {
    config = loadJson(CONFIG_PATH, null);
  } catch (err) {
    process.stderr.write(`redact-sensitive-output: malformed ${CONFIG_PATH} -- skipping this pass: ${err.message}\n`);
    process.exit(0);
  }

  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (err) {
    process.exit(0);
  }

  const originalText =
    typeof input.tool_output === 'string' ? input.tool_output : JSON.stringify(input.tool_output ?? '');

  let map;
  try {
    map = loadJson(MAP_PATH, null) || emptyMap();
  } catch (err) {
    map = emptyMap();
  }

  const { text: maskedText, count } = redact(originalText, config, map);

  if (count === 0) process.exit(0);

  fs.mkdirSync(path.dirname(MAP_PATH), { recursive: true });
  saveJson(MAP_PATH, map);

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      updatedToolOutput: maskedText,
      additionalContext: `${count} value(s) in this output were masked per .claude/redaction-config.json. Do not attempt to infer or troubleshoot the real values -- hand IP/network-level troubleshooting to the human operator.`,
    },
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  ipToInt,
  intToIp,
  maskFor,
  parseCidr,
  cidrContains,
  allocateSyntheticCidr,
  getOrAssignMaskedCidr,
  getOrAssignMaskedDomain,
  maskIps,
  maskDomains,
  redact,
  emptyMap,
};
```

**For FastAPI** — write `.claude/hooks/redact_sensitive_output.py`:

```python
#!/usr/bin/env python3
import ipaddress
import json
import re
import sys
from pathlib import Path

CONFIG_PATH = Path.cwd() / '.claude' / 'redaction-config.json'
MAP_PATH = Path.cwd() / '.claude' / '.redaction-map.json'
SYNTHETIC_BASE = int(ipaddress.IPv4Address('10.0.0.0'))  # RFC 1918 private-use space
SYNTHETIC_SPACE_BITS = 24  # 10.0.0.0/8 has 24 variable bits below the fixed leading octet
DOMAIN_SUFFIX = 'example'  # RFC 2606 reserved

IPV4_RE = re.compile(
    r'\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b'
)


def mask_for(prefix_len):
    if prefix_len == 0:
        return 0
    return (0xFFFFFFFF << (32 - prefix_len)) & 0xFFFFFFFF


def parse_cidr(cidr_str):
    ip_str, prefix_str = cidr_str.split('/')
    prefix_len = int(prefix_str)
    mask = mask_for(prefix_len)
    network = int(ipaddress.IPv4Address(ip_str)) & mask
    return {'network': network, 'prefixLen': prefix_len, 'mask': mask}


def cidr_contains(cidr, ip_int):
    return (ip_int & cidr['mask']) == cidr['network']


def int_to_ip(value):
    return str(ipaddress.IPv4Address(value))


def empty_map():
    return {'cidrs': {}, 'domains': {}, 'nextCidrOffset': 0, 'nextDomainIndex': 0}


# Allocates a non-overlapping, alignment-correct synthetic block within 10.0.0.0/8
# for a CIDR of the given real prefix length. Known limitation: prefixLen <= 8 can
# only ever get ONE allocation (10.0.0.0/8 IS the entire synthetic space at that
# size) -- a second such range in config will collide. Real deployed ranges are
# essentially never a full /8, so this is accepted rather than solved.
def allocate_synthetic_cidr(prefix_len, redaction_map):
    slot_bits = 32 - prefix_len
    slot_size = 1 << slot_bits
    space_size = 1 << SYNTHETIC_SPACE_BITS
    offset = redaction_map['nextCidrOffset']
    remainder = offset % slot_size
    if remainder != 0:
        offset += slot_size - remainder
    if offset + slot_size > space_size:
        raise ValueError('redact-sensitive-output: synthetic 10.0.0.0/8 space exhausted')
    redaction_map['nextCidrOffset'] = offset + slot_size
    network_int = (SYNTHETIC_BASE + offset) & 0xFFFFFFFF
    return {'network': network_int, 'prefixLen': prefix_len, 'mask': mask_for(prefix_len)}


def get_or_assign_masked_cidr(real_cidr_str, redaction_map):
    existing = redaction_map['cidrs'].get(real_cidr_str)
    if existing:
        return parse_cidr(existing)
    real = parse_cidr(real_cidr_str)
    synthetic = allocate_synthetic_cidr(real['prefixLen'], redaction_map)
    synthetic_str = f"{int_to_ip(synthetic['network'])}/{synthetic['prefixLen']}"
    redaction_map['cidrs'][real_cidr_str] = synthetic_str
    return synthetic


def get_or_assign_masked_domain(real_suffix, redaction_map):
    existing = redaction_map['domains'].get(real_suffix)
    if existing:
        return existing
    synthetic = f"masked{redaction_map['nextDomainIndex']}.{DOMAIN_SUFFIX}"
    redaction_map['domains'][real_suffix] = synthetic
    redaction_map['nextDomainIndex'] += 1
    return synthetic


def mask_ips(text, cidr_strs, redaction_map):
    count = 0
    cidrs = [(c, parse_cidr(c)) for c in cidr_strs]

    def replace(match):
        nonlocal count
        try:
            ip_int = int(ipaddress.IPv4Address(match.group(0)))
        except ValueError:
            # Candidate matched the loose regex (e.g. a leading-zero octet like
            # "192.168.01.1") but isn't a strictly valid address -- leave as-is
            # rather than crashing the whole hook over a cosmetic edge case.
            return match.group(0)
        for cidr_str, parsed in cidrs:
            if cidr_contains(parsed, ip_int):
                synthetic = get_or_assign_masked_cidr(cidr_str, redaction_map)
                host_bits = ip_int & (~synthetic['mask'] & 0xFFFFFFFF)
                masked_int = (host_bits | synthetic['network']) & 0xFFFFFFFF
                count += 1
                return int_to_ip(masked_int)
        return match.group(0)

    masked = IPV4_RE.sub(replace, text)
    return masked, count


def mask_domains(text, domain_suffixes, redaction_map):
    count = 0
    masked = text
    for suffix in domain_suffixes:
        pattern = re.compile(r'\b(?:[\w-]+\.)*' + re.escape(suffix) + r'\b')

        def replace(match, suffix=suffix):
            nonlocal count
            synthetic = get_or_assign_masked_domain(suffix, redaction_map)
            prefix_len = len(match.group(0)) - len(suffix)
            count += 1
            return match.group(0)[:prefix_len] + synthetic

        masked = pattern.sub(replace, masked)
    return masked, count


def redact(text, config, redaction_map):
    text, ip_count = mask_ips(text, config.get('cidrs', []), redaction_map)
    text, domain_count = mask_domains(text, config.get('domains', []), redaction_map)
    return text, ip_count + domain_count


def load_json(path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text())


def save_json(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n')


def main():
    if not CONFIG_PATH.exists():
        sys.exit(0)

    try:
        config = load_json(CONFIG_PATH, None)
    except (json.JSONDecodeError, OSError) as err:
        sys.stderr.write(f'redact-sensitive-output: malformed {CONFIG_PATH} -- skipping this pass: {err}\n')
        sys.exit(0)

    try:
        input_data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, OSError):
        sys.exit(0)

    tool_output = input_data.get('tool_output', '')
    original_text = tool_output if isinstance(tool_output, str) else json.dumps(tool_output)

    try:
        redaction_map = load_json(MAP_PATH, None) or empty_map()
    except (json.JSONDecodeError, OSError):
        redaction_map = empty_map()

    masked_text, count = redact(original_text, config, redaction_map)

    if count == 0:
        sys.exit(0)

    MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    save_json(MAP_PATH, redaction_map)

    output = {
        'hookSpecificOutput': {
            'hookEventName': 'PostToolUse',
            'updatedToolOutput': masked_text,
            'additionalContext': (
                f'{count} value(s) in this output were masked per .claude/redaction-config.json. '
                'Do not attempt to infer or troubleshoot the real values -- hand IP/network-level '
                'troubleshooting to the human operator.'
            ),
        }
    }
    sys.stdout.write(json.dumps(output))
    sys.exit(0)


if __name__ == '__main__':
    main()
```

## Step 4 — Wire the hook into `.claude/settings.json`

Merge this entry into the existing `hooks.PostToolUse` array (do not overwrite other entries — same
merge convention as `harness-kit.md` Step A):

**TS stacks:**
```json
{
  "matcher": "Bash|Read|Grep|Glob",
  "hooks": [{ "type": "command", "command": "node .claude/hooks/redact-sensitive-output.cjs" }]
}
```

**FastAPI:**
```json
{
  "matcher": "Bash|Read|Grep|Glob",
  "hooks": [{ "type": "command", "command": "python3 .claude/hooks/redact_sensitive_output.py" }]
}
```

Also merge these two entries into `permissions.deny` (do not remove existing entries):

```json
"Read(.claude/redaction-config.json)",
"Read(.claude/.redaction-map.json)"
```

This is load-bearing: the config/map files contain the real values in plaintext. If the agent can read
them directly, the hook's masking is pointless — the agent already has the real values from the config
file itself.

## Step 5 — Extend `protect-files.sh`

Add `.claude/redaction-config.json` and `.claude/.redaction-map.json` to the same case branch that
already protects `.claude/settings.json`/`.claude/hooks/*` (human-approval required before write) —
find the existing case arm covering `.claude/hooks/*` in `.claude/hooks/protect-files.sh` and add both
new paths to its pattern alternation.

## Step 6 — Add the companion warning to `user-prompt-guard`

**For TS stacks** — in `.claude/hooks/user-prompt-guard.cjs`, insert immediately before the final
`process.exit(0);`:

```javascript
// Redaction companion (OWASP LLM02 infra-topology variant) — only active if add (redaction) has been applied.
// Warns, never blocks: the human is the one party allowed to reference real infra values.
try {
  const fs = require('fs');
  const configPath = '.claude/redaction-config.json';
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const flagged = [];
    for (const cidrStr of config.cidrs || []) {
      const [ip, prefixStr] = cidrStr.split('/');
      const prefixLen = Number(prefixStr);
      const mask = prefixLen === 0 ? 0 : (0xffffffff << (32 - prefixLen)) >>> 0;
      const toInt = (s) => { const p = s.split('.').map(Number); return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0; };
      const network = toInt(ip) & mask;
      const matches = prompt.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g) || [];
      for (const m of matches) {
        if ((toInt(m) & mask) === network) flagged.push(m);
      }
    }
    for (const suffix of config.domains || []) {
      if (lower.includes(suffix.toLowerCase())) flagged.push(suffix);
    }
    if (flagged.length > 0) {
      process.stderr.write(`Note: this prompt contains real configured infra value(s) (${flagged.join(', ')}) from .claude/redaction-config.json — Claude will see them in cleartext for this turn. Non-blocking.\n`);
    }
  }
} catch { /* fail open — never let the redaction check block a legitimate prompt */ }

process.exit(0);
```

**For FastAPI** — in `.claude/hooks/user-prompt-guard.py`, insert immediately before the final
`sys.exit(0)`:

```python
# Redaction companion (OWASP LLM02 infra-topology variant) -- only active if add (redaction) has been applied.
# Warns, never blocks: the human is the one party allowed to reference real infra values.
try:
    import os
    config_path = '.claude/redaction-config.json'
    if os.path.exists(config_path):
        with open(config_path) as f:
            config = json.load(f)
        flagged = []
        ipv4_re = re.compile(r'\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b')
        def to_int(s):
            p = [int(x) for x in s.split('.')]
            return (p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]
        for cidr_str in config.get('cidrs', []):
            ip, prefix_str = cidr_str.split('/')
            prefix_len = int(prefix_str)
            mask = 0 if prefix_len == 0 else (0xFFFFFFFF << (32 - prefix_len)) & 0xFFFFFFFF
            network = to_int(ip) & mask
            for m in ipv4_re.findall(prompt):
                if (to_int(m) & mask) == network:
                    flagged.append(m)
        for suffix in config.get('domains', []):
            if suffix.lower() in lower:
                flagged.append(suffix)
        if flagged:
            sys.stderr.write(f'Note: this prompt contains real configured infra value(s) ({", ".join(flagged)}) from .claude/redaction-config.json -- Claude will see them in cleartext for this turn. Non-blocking.\n')
except Exception:
    pass  # fail open -- never let the redaction check block a legitimate prompt

sys.exit(0)
```

## Step 7 — Gitignore the map file

Add this line to `.gitignore` if not already present:

```
.claude/.redaction-map.json
```

The config file (`.claude/redaction-config.json`) is NOT gitignored — it's meant to be committed so the
team shares the same masking policy; only the accumulated real→synthetic mapping is local/sensitive
enough to exclude from history.

## Step 8 — Confirm

```bash
node -e "require('./.claude/hooks/redact-sensitive-output.cjs')" 2>&1 | head -5   # TS stacks: loads without error
python3 -c "import sys; sys.path.insert(0,'.claude/hooks'); import redact_sensitive_output"  # FastAPI: loads without error
grep -q "PostToolUse" .claude/settings.json
grep -q "redaction-config.json" .claude/settings.json
```

Capability is complete once all four checks pass.
