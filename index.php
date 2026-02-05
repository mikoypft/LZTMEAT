<?php
/**
 * Serve the React SPA from dist/index.html
 * No rewrite rules - just direct PHP serving
 */

$distFile = __DIR__ . '/dist/index.html';

if (!file_exists($distFile)) {
    http_response_code(404);
    echo "Error: dist/index.html not found at " . $distFile;
    exit;
}

// Read the dist/index.html file
$html = file_get_contents($distFile);

// Replace asset paths from /assets/ to /dist/assets/
// This handles the Vite build output paths
$html = str_replace('href="/', 'href="/dist/', $html);
$html = str_replace('src="/', 'src="/dist/', $html);
$html = str_replace('data-src="/', 'data-src="/dist/', $html);

// Fix any double replacements
$html = str_replace('/dist//dist/', '/dist/', $html);

// Set correct headers and serve
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
echo $html;
?>
