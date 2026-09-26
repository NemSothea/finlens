import 'package:flutter/material.dart';

import '../domain/failure.dart';

/// One place that turns a `Failure` into a sentence.
///
/// Written per variant, not from `detail`: the detail string can hold a URL or a
/// vendor message, and neither belongs in front of a user. Because `Failure` is
/// sealed, adding a variant breaks this switch at compile time instead of falling
/// through to a generic apology.
String failureHeadline(Failure failure) => switch (failure) {
  NetworkFailure() => 'No connection',
  TimeoutFailure() => 'The server took too long',
  ServerFailure() => 'Something broke on our side',
  NotFoundFailure(subject: final subject) =>
    subject == null ? 'Not found' : 'We do not cover $subject',
  BadRequestFailure() => 'That request was not valid',
  UnauthorizedFailure() => 'Sign in to see this',
  PaymentRequiredFailure() => 'Pro covers this',
  ParseFailure() => 'We could not read the response',
  UnknownFailure() => 'Something went wrong',
};

String failureBody(Failure failure) => switch (failure) {
  NetworkFailure() => 'Check your connection and try again.',
  TimeoutFailure() => 'The request timed out before anything came back.',
  ServerFailure() => 'This is ours to fix. Try again in a moment.',
  NotFoundFailure() => 'Check the ticker, or search for the company by name.',
  BadRequestFailure(message: final message) =>
    message ?? 'Adjust the request and try again.',
  UnauthorizedFailure() => 'Your session has expired.',
  PaymentRequiredFailure(message: final message) =>
    message ?? 'Upgrade to see the full history and the interactive model.',
  ParseFailure() =>
    'The server answered in a shape this version does not understand.',
  UnknownFailure() =>
    'Try again. If it keeps happening, it is worth reporting.',
};

/// The error state every async screen renders. A retry button appears only when
/// retrying could plausibly work — offering one for a 404 just wastes a tap.
class FailureView extends StatelessWidget {
  const FailureView({required this.failure, this.onRetry, super.key});

  final Failure failure;
  final VoidCallback? onRetry;

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
            Icon(Icons.error_outline, size: 36, color: colors.error),
            const SizedBox(height: 12),
            Text(
              failureHeadline(failure),
              style: text.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              failureBody(failure),
              style: text.bodySmall,
              textAlign: TextAlign.center,
            ),
            if (onRetry != null && failure.isRetryable) ...[
              const SizedBox(height: 16),
              FilledButton(onPressed: onRetry, child: const Text('Try again')),
            ],
          ],
        ),
      ),
    );
  }
}
