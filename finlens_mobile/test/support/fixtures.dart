import 'dart:convert';
import 'dart:io';

/// Fixtures are real captured responses from a running `next dev`, not
/// hand-written JSON. Hand-written fixtures encode what we *think* the API sends,
/// which is exactly the assumption a DTO test is supposed to check.
Map<String, dynamic> loadFixture(String name) {
  final file = File('test/fixtures/$name.json');
  return jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
}
