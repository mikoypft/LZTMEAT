<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ProductionController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\HistoryController;

// Handle CORS preflight requests
Route::options('{any}', function () {
    return response()->json([], 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->header('Access-Control-Max-Age', '3600');
})->where('any', '.*');

// Auth endpoints
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/refresh', [AuthController::class, 'refresh']);

// Products endpoints
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);
Route::delete('/products/delete-all', [ProductController::class, 'deleteAll']);

// Categories endpoints
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

// Ingredient Categories endpoints
Route::get('/ingredient-categories', [CategoryController::class, 'ingredientCategories']);
Route::post('/ingredient-categories', [CategoryController::class, 'storeIngredientCategory']);
Route::delete('/ingredient-categories/{id}', [CategoryController::class, 'destroyIngredientCategory']);

// Inventory endpoints
Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/inventory', [InventoryController::class, 'store']);
Route::put('/inventory/update', [InventoryController::class, 'update']);

// Ingredients endpoints
Route::get('/ingredients', [IngredientController::class, 'index']);
Route::post('/ingredients', [IngredientController::class, 'store']);
Route::put('/ingredients/{id}', [IngredientController::class, 'update']);
Route::delete('/ingredients/{id}', [IngredientController::class, 'destroy']);
Route::post('/ingredients/reset', [IngredientController::class, 'reset']);

// Sales endpoints
Route::get('/sales', [SaleController::class, 'index']);
Route::post('/sales', [SaleController::class, 'store']);
Route::put('/sales/{id}', [SaleController::class, 'update']);

// Production endpoints
Route::get('/production', [ProductionController::class, 'index']);
Route::post('/production', [ProductionController::class, 'store']);
Route::patch('/production/{id}', [ProductionController::class, 'updateStatus']);
Route::put('/production/{id}', [ProductionController::class, 'updateStatus']);
Route::delete('/production/{id}', [ProductionController::class, 'destroy']);

// Transfers endpoints
Route::get('/transfers', [TransferController::class, 'index']);
Route::post('/transfers', [TransferController::class, 'store']);
Route::put('/transfers/{id}', [TransferController::class, 'updateStatus']);

// Stores endpoints
Route::get('/stores', [StoreController::class, 'index']);
Route::post('/stores', [StoreController::class, 'store']);
Route::put('/stores/{id}', [StoreController::class, 'update']);
Route::delete('/stores/{id}', [StoreController::class, 'destroy']);

// Employees/Users endpoints
Route::get('/employees', [UserController::class, 'index']);
Route::post('/employees', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
Route::delete('/employees/{id}', [UserController::class, 'destroy']);
Route::get('/users/all', [UserController::class, 'allUsers']);

// Suppliers endpoints
Route::get('/suppliers', [SupplierController::class, 'index']);
Route::post('/suppliers', [SupplierController::class, 'store']);
Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

// History endpoints
Route::get('/history', [HistoryController::class, 'index']);
Route::get('/history/pos', [HistoryController::class, 'posHistory']);
Route::get('/history/inventory', [HistoryController::class, 'inventoryHistory']);
Route::get('/history/production', [HistoryController::class, 'productionHistory']);
Route::get('/history/ingredients', [HistoryController::class, 'ingredientsHistory']);
