import 'package:finlens_mobile/src/app.dart';
import 'package:finlens_mobile/src/core/config/app_config.dart';
import 'package:finlens_mobile/src/core/domain/result.dart';
import 'package:finlens_mobile/src/core/providers.dart';
import 'package:finlens_mobile/src/core/retry_policy.dart';
import 'package:finlens_mobile/src/features/search/application/search_providers.dart';
import 'package:finlens_mobile/src/features/search/domain/search_hit.dart';
import 'package:finlens_mobile/src/features/search/domain/search_repository.dart';
import 'package:finlens_mobile/src/router/app_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Fake repository, not a fake HTTP layer.
///
/// The repository is the abstraction the application layer depends on, so faking
/// it tests the screens without a server and without asserting on Dio internals.
class FakeSearchRepository implements SearchRepository {
  FakeSearchRepository({this.hits = const [], this.result});

  final List<SearchHit> hits;

  /// Set to return a `Failed(...)` and exercise the error state.
  final Result<List<SearchHit>>? result;

  final List<String> queries = [];

  @override
  Future<Result<List<SearchHit>>> search(String query, {int limit = 10}) async {
    queries.add(query);
    return result ?? Success(hits);
  }
}

/// Pumps the real app at [location] with fakes injected.
Future<void> pumpApp(
  WidgetTester tester, {
  String location = AppRouter.searchPath,
  SearchRepository? searchRepository,
}) async {
  final config = AppConfig.dev();

  await tester.pumpWidget(
    ProviderScope(
      // Same retry policy as the app: a test that auto-retried would never see
      // the error state a user sees.
      retry: noAutomaticRetry,
      overrides: [
        appConfigProvider.overrideWithValue(config),
        if (searchRepository != null)
          searchRepositoryProvider.overrideWithValue(searchRepository),
      ],
      child: FinlensApp(
        config: config,
        router: AppRouter.build(initialLocation: location),
      ),
    ),
  );
  await tester.pumpAndSettle();
}
