import 'package:flutter/material.dart';

/// Loading is a skeleton, not a spinner.
///
/// A spinner says "something is happening somewhere"; a skeleton says what is
/// about to appear and keeps the layout from jumping when it does.
class ListLoadingSkeleton extends StatelessWidget {
  const ListLoadingSkeleton({this.rows = 6, super.key});

  final int rows;

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).colorScheme.surfaceContainerHighest;

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: rows,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, _) => Row(
        children: [
          _Block(width: 56, height: 16, color: base),
          const SizedBox(width: 12),
          Expanded(child: _Block(height: 16, color: base)),
          const SizedBox(width: 12),
          _Block(width: 64, height: 16, color: base),
        ],
      ),
    );
  }
}

class _Block extends StatelessWidget {
  const _Block({required this.height, required this.color, this.width});

  final double? width;
  final double height;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    width: width,
    height: height,
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(6),
    ),
  );
}
