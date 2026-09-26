import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app.dart';
import 'src/core/config/app_config.dart';
import 'src/core/providers.dart';
import 'src/core/retry_policy.dart';

/// Production entry point.
///
///   flutter build ipa       -t lib/main_prod.dart
///   flutter build appbundle -t lib/main_prod.dart
void main() {
  final config = AppConfig.prod();

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
