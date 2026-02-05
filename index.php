<?php
// Serve dist/index.html with corrected asset paths
$distFile = __DIR__ . '/dist/index.html';

if (file_exists($distFile)) {
    $html = file_get_contents($distFile);
    
    // Replace /assets/ with /dist/assets/ 
    $html = str_replace('href="/', 'href="/dist/', $html);
    $html = str_replace('src="/', 'src="/dist/', $html);
    
    // Fix any double-replacements
    $html = str_replace('/dist//dist/', '/dist/', $html);
    
    echo $html;
} else {
    http_response_code(500);
    echo "Error: Frontend build not found at dist/index.html";
}
?>
