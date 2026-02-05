<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    public function handle(Request $request, Closure $next): Response
    {
        // Set JSON response header for API requests
        if ($request->is('api/*')) {
            $request->headers->set('Accept', 'application/json');
        }

        // Allow from any origin
        $response = $next($request);
        
        $response->header('Access-Control-Allow-Origin', $request->header('Origin') ?? '*');
        $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        $response->header('Access-Control-Max-Age', '86400');
        $response->header('Access-Control-Allow-Credentials', 'true');
        $response->header('Content-Type', 'application/json');

        // Handle preflight request
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $request->header('Origin') ?? '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
                ->header('Access-Control-Max-Age', '86400')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Content-Type', 'application/json');
        }

        return $response;
    }
}
