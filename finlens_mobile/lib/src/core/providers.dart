import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'config/app_config.dart';
import 'network/api_client.dart';

part 'providers.g.dart';

/// Root wiring.
///
/// `appConfig` throws by default and is overridden in `main`. That is deliberate:
/// a default would let a build run against the wrong API without anyone noticing,
/// whereas an unoverridden provider fails on the first frame, loudly, in dev.
@Riverpod(keepAlive: true)
AppConfig appConfig(Ref ref) => throw UnimplementedError(
  'appConfigProvider must be overridden in main with AppConfig.dev()/prod().',
);

/// One client for the whole app — see `ApiClient` for why that matters.
@Riverpod(keepAlive: true)
ApiClient apiClient(Ref ref) => ApiClient(config: ref.watch(appConfigProvider));
