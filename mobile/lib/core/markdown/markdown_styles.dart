import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

MarkdownStyleSheet markdownBlockStyleSheet(ThemeData theme) {
  final body = GoogleFonts.dmSans(
    fontSize: 16,
    height: 1.55,
    color: theme.colorScheme.onSurface,
  );
  final heading = GoogleFonts.playfairDisplay(
    fontWeight: FontWeight.bold,
    color: theme.colorScheme.onSurface,
  );

  return MarkdownStyleSheet.fromTheme(theme).copyWith(
    p: body.copyWith(height: 1.55),
    pPadding: const EdgeInsets.only(bottom: 6),
    h1: heading.copyWith(fontSize: 24, height: 1.3),
    h1Padding: const EdgeInsets.only(top: 4, bottom: 4),
    h2: heading.copyWith(fontSize: 20, height: 1.3),
    h2Padding: const EdgeInsets.only(top: 4, bottom: 4),
    h3: heading.copyWith(fontSize: 18, fontWeight: FontWeight.w600),
    h3Padding: const EdgeInsets.only(top: 2, bottom: 2),
    code: GoogleFonts.jetBrainsMono(
      fontSize: 13,
      color: theme.colorScheme.onSurface,
      backgroundColor: theme.colorScheme.surfaceContainerHighest,
    ),
    codeblockDecoration: BoxDecoration(
      color: theme.colorScheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(4),
    ),
    codeblockPadding: const EdgeInsets.all(10),
    blockquote: body.copyWith(
      fontStyle: FontStyle.italic,
      color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
    ),
    blockquoteDecoration: BoxDecoration(
      border: Border(
        left: BorderSide(
          color: theme.colorScheme.tertiary.withValues(alpha: 0.5),
          width: 3,
        ),
      ),
    ),
    blockquotePadding: const EdgeInsets.only(left: 12),
    listBullet: body,
    listIndent: 20,
    a: TextStyle(
      color: theme.colorScheme.tertiary,
      decoration: TextDecoration.underline,
    ),
  );
}

InputDecoration markdownSourceDecoration(ThemeData theme) {
  return InputDecoration(
    hintText: 'Write markdown…',
    hintStyle: GoogleFonts.jetBrainsMono(
      fontSize: 14,
      color: theme.colorScheme.onSurface.withValues(alpha: 0.45),
    ),
    border: InputBorder.none,
    contentPadding: const EdgeInsets.all(12),
    isDense: true,
  );
}

TextStyle markdownSourceTextStyle(ThemeData theme) {
  return GoogleFonts.jetBrainsMono(
    fontSize: 14,
    height: 1.5,
    color: theme.colorScheme.onSurface,
  );
}

TextStyle markdownEmptyTextStyle(ThemeData theme) {
  return GoogleFonts.jetBrainsMono(
    fontSize: 14,
    fontStyle: FontStyle.italic,
    color: theme.colorScheme.onSurface.withValues(alpha: 0.45),
  );
}

BoxDecoration markdownBlockDecoration({required ThemeData theme}) {
  return BoxDecoration(
    color: theme.colorScheme.surfaceContainerHighest,
    borderRadius: BorderRadius.circular(4),
  );
}
