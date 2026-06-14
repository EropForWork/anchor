import '../widgets/editor/link_utils.dart';

const _blockedSchemes = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
];

const _allowedSchemes = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
];

/// Stricter than editor [normalizeUrl]: preview links/images only use safe schemes.
String? sanitizeMarkdownHref(String? raw) {
  if (raw == null) return null;
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;

  final lower = trimmed.toLowerCase();
  for (final blocked in _blockedSchemes) {
    if (lower.startsWith(blocked)) return null;
  }

  final normalized = normalizeUrl(trimmed);
  final normalizedLower = normalized.toLowerCase();
  for (final scheme in _allowedSchemes) {
    if (normalizedLower.startsWith(scheme)) return normalized;
  }

  return null;
}

String markdownPreviewLine(String source) {
  for (final line in source.split(RegExp(r'\r?\n'))) {
    final trimmed = line.trim();
    if (trimmed.isNotEmpty) return trimmed;
  }
  return '[Markdown]';
}
