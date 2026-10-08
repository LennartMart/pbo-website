<?php
/**
 * GitHub-login voor Decap CMS (/admin en /admin/jeugdcup).
 *
 * Decap opent dit script in een popup. Zonder ?code stuurt het door naar GitHub; GitHub stuurt terug
 * met ?code, dit script ruilt die in voor een token en geeft dat via postMessage aan Decap.
 *
 * Instellingen staan in config.php naast dit bestand (niet in git; de deploy-workflow schrijft het
 * uit de GitHub-secrets OAUTH_CLIENT_ID en OAUTH_CLIENT_SECRET). Zie docs/beheer.md.
 */

declare(strict_types=1);

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$clientId = $config['client_id'] ?? '';
$clientSecret = $config['client_secret'] ?? '';

// Sites die het token mogen ontvangen: de echte site en de testversie op GitHub Pages.
$origins = [
    'https://www.badminton-pbo.be',
    'https://badminton-pbo.be',
    'https://lennartmart.github.io',
];

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function antwoord(string $status, array $inhoud, array $origins): void
{
    $bericht = 'authorization:github:' . $status . ':' . json_encode($inhoud, JSON_UNESCAPED_SLASHES);
    $tekst = $status === 'success' ? 'Ingelogd. Dit venster sluit vanzelf.' : 'Inloggen mislukt: ' . ($inhoud['error'] ?? 'onbekende fout');
    header('Content-Type: text/html; charset=utf-8');
    ?>
<!doctype html>
<html lang="nl-BE">
<head><meta charset="utf-8"><title>PBO beheer</title></head>
<body style="font-family: system-ui, sans-serif; padding: 24px">
<p><?= htmlspecialchars($tekst) ?></p>
<script>
(function () {
  var origins = <?= json_encode(array_values($origins)) ?>;
  var bericht = <?= json_encode($bericht) ?>;
  if (!window.opener) return;
  // Decap antwoordt op "authorizing:github"; pas dan kennen we zijn origin en sturen we het token.
  window.addEventListener('message', function (e) {
    if (origins.indexOf(e.origin) === -1) return;
    window.opener.postMessage(bericht, e.origin);
  }, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body>
</html>
    <?php
    exit;
}

if ($clientId === '' || $clientSecret === '') {
    http_response_code(500);
    antwoord('error', ['error' => 'Login is nog niet ingesteld (config.php ontbreekt).'], $origins);
}

session_start([
    'cookie_secure' => true,
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
]);

$schema = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
$pad = strtok($_SERVER['REQUEST_URI'] ?? '/admin/auth/', '?');
$terug = $config['redirect_uri'] ?? $schema . '://' . $_SERVER['HTTP_HOST'] . $pad;

// Stap 1: naar GitHub.
if (!isset($_GET['code'])) {
    if (($_GET['provider'] ?? 'github') !== 'github') {
        antwoord('error', ['error' => 'Enkel GitHub wordt ondersteund.'], $origins);
    }
    $state = bin2hex(random_bytes(16));
    $_SESSION['pbo_oauth_state'] = $state;
    $scope = in_array($_GET['scope'] ?? '', ['repo', 'public_repo', 'repo,user', 'public_repo,user'], true) ? $_GET['scope'] : 'repo';
    header('Location: https://github.com/login/oauth/authorize?' . http_build_query([
        'client_id' => $clientId,
        'redirect_uri' => $terug,
        'scope' => $scope,
        'state' => $state,
    ]));
    exit;
}

// Stap 2: terug van GitHub, code inruilen voor een token.
$verwacht = $_SESSION['pbo_oauth_state'] ?? '';
unset($_SESSION['pbo_oauth_state']);
if ($verwacht === '' || !hash_equals($verwacht, (string)($_GET['state'] ?? ''))) {
    antwoord('error', ['error' => 'Sessie verlopen. Probeer opnieuw.'], $origins);
}

$context = stream_context_create(['http' => [
    'method' => 'POST',
    'header' => "Accept: application/json\r\nContent-Type: application/x-www-form-urlencoded\r\nUser-Agent: pbo-website-decap\r\n",
    'content' => http_build_query([
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'code' => (string)$_GET['code'],
        'redirect_uri' => $terug,
    ]),
    'timeout' => 15,
    'ignore_errors' => true,
]]);
$json = @file_get_contents('https://github.com/login/oauth/access_token', false, $context);
$data = $json ? json_decode($json, true) : null;

if (!is_array($data) || empty($data['access_token'])) {
    antwoord('error', ['error' => $data['error_description'] ?? 'GitHub gaf geen token terug.'], $origins);
}

antwoord('success', ['token' => $data['access_token'], 'provider' => 'github'], $origins);
