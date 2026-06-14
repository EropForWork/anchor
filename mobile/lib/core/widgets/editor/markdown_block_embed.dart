import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_quill/flutter_quill.dart';

import '../../markdown/markdown_constants.dart';
import '../../markdown/markdown_delta.dart';
import '../../markdown/markdown_href_policy.dart';
import '../../markdown/markdown_styles.dart';
import '../editor/link_utils.dart';

class MarkdownBlockEmbedBuilder extends EmbedBuilder {
  @override
  String get key => MarkdownBlockEmbed.embedType;

  @override
  Widget build(BuildContext context, EmbedContext embedContext) {
    final markdown = MarkdownBlockEmbed.fromNode(embedContext.node).data;
    return MarkdownBlockWidget(
      markdown: markdown,
      readOnly: embedContext.readOnly,
      controller: embedContext.controller,
      node: embedContext.node,
    );
  }
}

class MarkdownBlockWidget extends StatefulWidget {
  final String markdown;
  final bool readOnly;
  final QuillController controller;
  final Embed node;

  const MarkdownBlockWidget({
    super.key,
    required this.markdown,
    required this.readOnly,
    required this.controller,
    required this.node,
  });

  @override
  State<MarkdownBlockWidget> createState() => _MarkdownBlockWidgetState();
}

class _MarkdownBlockWidgetState extends State<MarkdownBlockWidget> {
  late final TextEditingController _textController;
  late final FocusNode _focusNode;
  bool _editing = false;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.markdown);
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeAutoEdit());
  }

  void _maybeAutoEdit() {
    if (!mounted || widget.readOnly) return;
    final pending = _pendingMarkdownAutoEditOffset;
    if (pending == null) return;
    if (_embedOffset() != pending) return;
    _pendingMarkdownAutoEditOffset = null;
    _enterEdit();
  }

  @override
  void didUpdateWidget(covariant MarkdownBlockWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.markdown != widget.markdown && !_editing) {
      _textController.text = widget.markdown;
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChanged);
    _textController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChanged() {
    if (!_focusNode.hasFocus && _editing) {
      _commitAndExitEdit();
    }
  }

  void _enterEdit() {
    if (widget.readOnly || _editing) return;
    setState(() => _editing = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _focusNode.requestFocus();
      _textController.selection = TextSelection.collapsed(
        offset: _textController.text.length,
      );
    });
  }

  void _commitAndExitEdit() {
    if (!_editing) return;
    final newValue = _textController.text;
    setState(() => _editing = false);
    if (newValue != widget.markdown) {
      _updateEmbed(newValue);
    }
  }

  int _embedOffset() {
    return widget.controller.document.root.queryChild(widget.node).offset;
  }

  void _updateEmbed(String newValue) {
    final offset = _embedOffset();
    final block = BlockEmbed.custom(MarkdownBlockEmbed(newValue));
    widget.controller.replaceText(
      offset,
      1,
      block,
      TextSelection.collapsed(offset: offset),
    );
  }

  Future<void> _onMarkdownLinkTap(String text, String? href, String title) async {
    final safe = sanitizeMarkdownHref(href);
    if (safe == null || !mounted) return;
    await launchExternal(context, safe);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: DecoratedBox(
        decoration: markdownBlockDecoration(theme: theme),
        child: _editing
            ? TextField(
                controller: _textController,
                focusNode: _focusNode,
                maxLines: null,
                minLines: 1,
                keyboardType: TextInputType.multiline,
                style: markdownSourceTextStyle(theme),
                decoration: markdownSourceDecoration(theme),
              )
            : GestureDetector(
                onTap: widget.readOnly ? null : _enterEdit,
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  child: widget.markdown.trim().isEmpty
                      ? Text(
                          markdownEmptyPlaceholder,
                          style: markdownEmptyTextStyle(theme),
                        )
                      : MarkdownBody(
                          data: widget.markdown,
                          styleSheet: markdownBlockStyleSheet(theme),
                          shrinkWrap: true,
                          selectable: false,
                          onTapLink: _onMarkdownLinkTap,
                        ),
                ),
              ),
      ),
    );
  }
}

int? _pendingMarkdownAutoEditOffset;

void insertMarkdownBlock(QuillController controller) {
  final selection = controller.selection;
  final index = selection.isValid
      ? selection.baseOffset
      : controller.document.length - 1;
  _pendingMarkdownAutoEditOffset = index;
  final block = BlockEmbed.custom(const MarkdownBlockEmbed(''));
  controller.replaceText(
    index,
    selection.isValid ? selection.end - selection.start : 0,
    block,
    TextSelection.collapsed(offset: index + 1),
  );
  HapticFeedback.selectionClick();
}
