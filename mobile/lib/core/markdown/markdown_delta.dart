import 'package:flutter_quill/flutter_quill.dart';

import 'markdown_constants.dart';
import 'markdown_href_policy.dart';

/// Delta embed for markdown blocks. Value is raw markdown source text.
class MarkdownBlockEmbed extends CustomBlockEmbed {
  const MarkdownBlockEmbed(String value) : super(embedType, value);

  static const String embedType = markdownBlockEmbedType;

  static MarkdownBlockEmbed fromNode(Embed node) {
    final data = node.value.data;
    return MarkdownBlockEmbed(data is String ? data : '');
  }
}

/// Extract searchable / preview text from a single delta op payload.
String? deltaDataToPlainText(dynamic data) {
  if (data is String) return data;
  if (data is Map) {
    final markdown = data[MarkdownBlockEmbed.embedType];
    if (markdown is String) return markdownPreviewLine(markdown);
  }
  return '';
}
