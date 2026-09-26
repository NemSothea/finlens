import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/failure.dart';
import '../../../core/format.dart';
import '../../../core/presentation/failure_view.dart';
import '../../../core/presentation/loading_skeleton.dart';
import '../../../core/providers.dart';
import '../../../router/app_router.dart';
import '../application/search_providers.dart';
import '../domain/search_hit.dart';

/// Ticker search, on real data from `GET /api/stocks/search`.
///
/// Four states, always: skeleton while loading, a typed error state, an empty
/// state with a next action, and the list. Empty gets its own branch because "no
/// matches for XYZQ" and "type something to begin" are different sentences, and
/// an empty list rendered as data says neither.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({this.initialQuery = '', super.key});

  /// From `/?q=AAPL`. Applied once, and only when nothing has been typed yet, so
  /// returning to this screen keeps what the user last searched rather than
  /// snapping back to whatever the original link said.
  final String initialQuery;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

/// Stateful for controllers only — a `TextEditingController` and the debounce
/// `Timer`, both disposed below. The query itself lives in a Notifier, because it
/// outlives this widget: navigating to a company and back must not clear it.
class _SearchScreenState extends ConsumerState<SearchScreen> {
  static const Duration _debounce = Duration(milliseconds: 300);

  final TextEditingController _controller = TextEditingController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();

    final committed = ref.read(searchQueryProvider);
    final initial = committed.isEmpty ? widget.initialQuery.trim() : committed;

    // Restores the field after a round trip to a company screen, or seeds it from
    // a `?q=` link.
    _controller.text = initial;

    if (committed.isEmpty && initial.isNotEmpty) {
      // A Notifier cannot be written during initState's build phase.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) ref.read(searchQueryProvider.notifier).submit(initial);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  /// Debounced: one word typed is one request, not five. Without this the API
  /// gets a query per keystroke and the list flickers through partial matches.
  void _onChanged(String value) {
    _timer?.cancel();
    _timer = Timer(
      _debounce,
      () => ref.read(searchQueryProvider.notifier).submit(value.trim()),
    );
  }

  void _submitNow(String value) {
    _timer?.cancel();
    ref.read(searchQueryProvider.notifier).submit(value.trim());
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final query = ref.watch(searchQueryProvider);
    final results = ref.watch(searchResultsProvider);
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(config.appName),
        actions: [
          IconButton(
            tooltip: 'Watchlist',
            icon: const Icon(Icons.bookmark_border),
            onPressed: () => context.push(AppRouter.watchlistPath),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _controller,
              autocorrect: false,
              textCapitalization: TextCapitalization.characters,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                labelText: 'Ticker or company',
                hintText: 'AAPL',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: query.isEmpty && _controller.text.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'Clear',
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _controller.clear();
                          _submitNow('');
                        },
                      ),
              ),
              onChanged: _onChanged,
              onSubmitted: _submitNow,
            ),
          ),
          Expanded(
            // Error is checked before loading on purpose: Riverpod can hold both
            // at once (a reload that has already failed), and an error we can
            // explain is more useful than a skeleton that hides it.
            child: switch (results) {
              AsyncValue(hasError: true, error: final error) => FailureView(
                failure: error is Failure
                    ? error
                    : UnknownFailure(detail: error.toString()),
                onRetry: () => ref.invalidate(searchResultsProvider),
              ),
              AsyncValue(isLoading: true) =>
                query.isEmpty ? const _Prompt() : const ListLoadingSkeleton(),
              AsyncValue(:final value) when query.isEmpty || value == null =>
                const _Prompt(),
              AsyncValue(:final value) =>
                value!.isEmpty
                    ? _NoMatches(query: query)
                    : _ResultList(hits: value),
            },
          ),
          if (config.isDev)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(config.apiBaseUrl, style: text.bodySmall),
            ),
        ],
      ),
    );
  }
}

/// The pre-query state. Not an error and not an empty result — nothing has been
/// asked yet, so it says what to do rather than what went wrong.
class _Prompt extends StatelessWidget {
  const _Prompt();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.query_stats, size: 40, color: colors.onSurfaceVariant),
            const SizedBox(height: 12),
            Text('Search a company', style: text.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Thirty years of statements, and what the numbers imply about value.',
              style: text.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _NoMatches extends StatelessWidget {
  const _NoMatches({required this.query});

  final String query;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 40, color: colors.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(
              'Nothing matches "$query"',
              style: text.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'We cover listed companies our pipeline has ingested. Try the ticker.',
              style: text.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultList extends StatelessWidget {
  const _ResultList({required this.hits});

  final List<SearchHit> hits;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: hits.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final hit = hits[index];
        final text = Theme.of(context).textTheme;

        return ListTile(
          title: Text('${hit.symbol} · ${hit.name}'),
          subtitle: Text(
            [hit.exchange, hit.sector].whereType<String>().join(' · '),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatPrice(hit.price), style: text.bodyMedium),
              Text(formatCompact(hit.marketCap), style: text.bodySmall),
            ],
          ),
          onTap: () => context.push(AppRouter.stockDetailPathFor(hit.symbol)),
        );
      },
    );
  }
}
