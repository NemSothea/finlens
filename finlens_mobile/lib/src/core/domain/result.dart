import 'failure.dart';

/// Errors are values, not throws.
///
/// A repository that throws has a signature that lies: `Future<Company>` claims
/// it always returns a company. `Future<Result<Company>>` says what actually
/// happens, and the compiler then forces every caller to deal with the other
/// branch — which is the whole point.
sealed class Result<T> {
  const Result();

  /// Convenience for the common "map the value, keep the failure" case, so
  /// services do not each re-implement the switch.
  Result<R> map<R>(R Function(T value) transform) => switch (this) {
    Success<T>(value: final v) => Success<R>(transform(v)),
    Failed<T>(failure: final f) => Failed<R>(f),
  };

  T? get valueOrNull => switch (this) {
    Success<T>(value: final v) => v,
    Failed<T>() => null,
  };

  Failure? get failureOrNull => switch (this) {
    Success<T>() => null,
    Failed<T>(failure: final f) => f,
  };

  bool get isSuccess => this is Success<T>;
}

final class Success<T> extends Result<T> {
  const Success(this.value);
  final T value;
}

final class Failed<T> extends Result<T> {
  const Failed(this.failure);
  final Failure failure;
}
