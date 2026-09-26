// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Root wiring.
///
/// `appConfig` throws by default and is overridden in `main`. That is deliberate:
/// a default would let a build run against the wrong API without anyone noticing,
/// whereas an unoverridden provider fails on the first frame, loudly, in dev.

@ProviderFor(appConfig)
final appConfigProvider = AppConfigProvider._();

/// Root wiring.
///
/// `appConfig` throws by default and is overridden in `main`. That is deliberate:
/// a default would let a build run against the wrong API without anyone noticing,
/// whereas an unoverridden provider fails on the first frame, loudly, in dev.

final class AppConfigProvider
    extends $FunctionalProvider<AppConfig, AppConfig, AppConfig>
    with $Provider<AppConfig> {
  /// Root wiring.
  ///
  /// `appConfig` throws by default and is overridden in `main`. That is deliberate:
  /// a default would let a build run against the wrong API without anyone noticing,
  /// whereas an unoverridden provider fails on the first frame, loudly, in dev.
  AppConfigProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'appConfigProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$appConfigHash();

  @$internal
  @override
  $ProviderElement<AppConfig> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  AppConfig create(Ref ref) {
    return appConfig(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AppConfig value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AppConfig>(value),
    );
  }
}

String _$appConfigHash() => r'541aef0ff097426be35cb1aca46862e62cc78ce1';

/// One client for the whole app — see `ApiClient` for why that matters.

@ProviderFor(apiClient)
final apiClientProvider = ApiClientProvider._();

/// One client for the whole app — see `ApiClient` for why that matters.

final class ApiClientProvider
    extends $FunctionalProvider<ApiClient, ApiClient, ApiClient>
    with $Provider<ApiClient> {
  /// One client for the whole app — see `ApiClient` for why that matters.
  ApiClientProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'apiClientProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$apiClientHash();

  @$internal
  @override
  $ProviderElement<ApiClient> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ApiClient create(Ref ref) {
    return apiClient(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ApiClient value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ApiClient>(value),
    );
  }
}

String _$apiClientHash() => r'708ab59a2c6e9b4a3955084233699d03b601547f';
