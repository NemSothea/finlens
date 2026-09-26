import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app.dart';
import 'src/core/config/app_config.dart';
import 'src/core/providers.dart';
import 'src/core/retry_policy.dart';

/// Default entry point — development flavor.
///
/// `main.dart` exists so `flutter run` with no arguments does something safe. The
/// explicit flavors are `main_dev.dart` and `main_prod.dart`; a release build must
/// name one, because defaulting a store build to dev config is how a shipped app
/// ends up pointing at a laptop.
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
