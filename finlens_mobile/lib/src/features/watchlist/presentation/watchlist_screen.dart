import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../router/app_router.dart';

/// M1 placeholder for the watchlist.
///
/// Rendered as the empty state on purpose: every async screen in this app owes
/// four states — loading, error, empty, data — and empty is not a special case
/// of data. It gets its own widget with one clear next action, which is what
/// this is.
class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Watchlist')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.bookmark_border,
                size: 40,
                color: colors.onSurfaceVariant,
              ),
              const SizedBox(height: 12),
              Text('Nothing tracked yet', style: text.titleMedium),
              const SizedBox(height: 4),
              Text(
                'Signing in and syncing the watchlist lands in M4.',
                style: text.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go(AppRouter.searchPath),
                child: const Text('Find a company'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
