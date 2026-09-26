// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Providers expose abstractions, not implementations, so a widget test can swap
/// in a fake repository without a running server.

@ProviderFor(searchRepository)
final searchRepositoryProvider = SearchRepositoryProvider._();

/// Providers expose abstractions, not implementations, so a widget test can swap
/// in a fake repository without a running server.

final class SearchRepositoryProvider
    extends
        $FunctionalProvider<
          SearchRepository,
          SearchRepository,
          SearchRepository
        >
    with $Provider<SearchRepository> {
  /// Providers expose abstractions, not implementations, so a widget test can swap
  /// in a fake repository without a running server.
  SearchRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'searchRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$searchRepositoryHash();

  @$internal
  @override
  $ProviderElement<SearchRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SearchRepository create(Ref ref) {
    return searchRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SearchRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SearchRepository>(value),
    );
  }
}

String _$searchRepositoryHash() => r'a5d77f5e6411b8966780fb3053c412a2f0751ac4';

@ProviderFor(searchService)
final searchServiceProvider = SearchServiceProvider._();

final class SearchServiceProvider
    extends $FunctionalProvider<SearchService, SearchService, SearchService>
    with $Provider<SearchService> {
  SearchServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'searchServiceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$searchServiceHash();

  @$internal
  @override
  $ProviderElement<SearchService> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SearchService create(Ref ref) {
    return searchService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SearchService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SearchService>(value),
    );
  }
}

String _$searchServiceHash() => r'75a5c57f9c2c14ec6a7fc477d12ea94a79e65a1e';

/// The committed query — set by the search field after its debounce, not on every
/// keystroke, so one word of typing is one request rather than five.

@ProviderFor(SearchQuery)
final searchQueryProvider = SearchQueryProvider._();

/// The committed query — set by the search field after its debounce, not on every
/// keystroke, so one word of typing is one request rather than five.
final class SearchQueryProvider extends $NotifierProvider<SearchQuery, String> {
  /// The committed query — set by the search field after its debounce, not on every
  /// keystroke, so one word of typing is one request rather than five.
  SearchQueryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'searchQueryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$searchQueryHash();

  @$internal
  @override
  SearchQuery create() => SearchQuery();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(String value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<String>(value),
    );
  }
}

String _$searchQueryHash() => r'812496cbb43b54533091d270307c77aa858c33ad';

/// The committed query — set by the search field after its debounce, not on every
/// keystroke, so one word of typing is one request rather than five.

abstract class _$SearchQuery extends $Notifier<String> {
  String build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<String, String>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<String, String>,
              String,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

/// Results for the current query.
///
/// A `Failure` is thrown into `AsyncValue.error` on purpose: `AsyncValue` already
/// models loading/error/data, and the screen pattern-matches the failure variant
/// out of it. Wrapping `Result` inside `AsyncValue` would give two error channels
/// for one error.

@ProviderFor(searchResults)
final searchResultsProvider = SearchResultsProvider._();

/// Results for the current query.
///
/// A `Failure` is thrown into `AsyncValue.error` on purpose: `AsyncValue` already
/// models loading/error/data, and the screen pattern-matches the failure variant
/// out of it. Wrapping `Result` inside `AsyncValue` would give two error channels
/// for one error.

final class SearchResultsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<SearchHit>>,
          List<SearchHit>,
          FutureOr<List<SearchHit>>
        >
    with $FutureModifier<List<SearchHit>>, $FutureProvider<List<SearchHit>> {
  /// Results for the current query.
  ///
  /// A `Failure` is thrown into `AsyncValue.error` on purpose: `AsyncValue` already
  /// models loading/error/data, and the screen pattern-matches the failure variant
  /// out of it. Wrapping `Result` inside `AsyncValue` would give two error channels
  /// for one error.
  SearchResultsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'searchResultsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$searchResultsHash();

  @$internal
  @override
  $FutureProviderElement<List<SearchHit>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<SearchHit>> create(Ref ref) {
    return searchResults(ref);
  }
}

String _$searchResultsHash() => r'e0e595781b038a30564758d2d47c8b946a216fe7';
