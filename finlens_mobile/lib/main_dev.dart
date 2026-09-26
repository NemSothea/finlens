import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app.dart';
import 'src/core/config/app_config.dart';
import 'src/core/providers.dart';
import 'src/core/retry_policy.dart';

/// Development entry point.
///
///   flutter run -t lib/main_dev.dart
///   flutter run -t lib/main_dev.dart --dart-define=FINLENS_API_BASE_URL=http://192.168.1.8:3001
///
/// The second form is what a physical phone needs: `localhost` on a handset is the
/// handset, not the laptop running `next dev`.
void main() {
  final config = AppConfig.dev();

  runApp(
    // `appConfigProvider` throws until it is overridden here, so a build that
    // forgets the override fails on the first frame instead of quietly running
    // against the wrong API. `retry: noAutomaticRetry` switches off Riverpod's
    // automatic provider retries — see retry_policy.dart for why.
    ProviderScope(
      retry: noAutomaticRetry,
      overrides: [appConfigProvider.overrideWithValue(config)],
      child: FinlensApp(config: config),
    ),
  );
}
