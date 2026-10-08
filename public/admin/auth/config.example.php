<?php
// Voorbeeld. De deploy-workflow schrijft config.php met de echte waarden uit de GitHub-secrets.
// Handmatig instellen kan ook: kopieer naar config.php en vul in. config.php nooit in git zetten.
return [
    'client_id' => 'GitHub OAuth App: Client ID',
    'client_secret' => 'GitHub OAuth App: Client secret',
    // Optioneel, standaard dit script zelf: 'redirect_uri' => 'https://www.badminton-pbo.be/admin/auth/',
];
