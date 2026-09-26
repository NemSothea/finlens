import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/config_scope.dart';
import '../../../router/app_router.dart';

/// M1 placeholder for the company screen.
///
/// It proves the route and its parameter reach a screen — including from a cold
/// deep link — and states plainly where the data will come from. The valuation
/// itself stays server-side forever: a second DCF implementation in Dart would
/// eventually disagree with the web one, and two fair values for one company is
/// the worst bug this product could ship.
class StockDetailScreen extends StatelessWidget {
  const StockDetailScreen({required this.symbol, super.key});

  final String symbol;

  @override
  Widget build(BuildContext context) {
    final config = ConfigScope.of(context);
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(symbol),
        actions: [
          IconButton(
            tooltip: 'Watchlist',
            icon: const Icon(Icons.bookmark_border),
            onPressed: () => context.push(AppRouter.watchlistPath),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(symbol, style: text.headlineMedium),
          const SizedBox(height: 8),
          Text(
            'Wired up in M3, from ${config.apiBaseUrl}/api/stocks/$symbol.',
            style: text.bodyMedium,
          ),
          const SizedBox(height: 16),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Coming in M2–M3'),
                  SizedBox(height: 8),
                  Text('• profile, quote and key metrics'),
                  Text('• 30 years of statements as charts'),
                  Text(
                    '• DCF fair value and margin of safety, computed server-side',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
