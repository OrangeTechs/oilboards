<?php

use App\Http\Controllers\LandingController;
use App\Http\Controllers\DemoController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\AssistantController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('landing');
Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');
Route::post('/assistant', [AssistantController::class, 'chat'])->name('assistant.chat');
Route::get('/demo', [DemoController::class, 'index'])->name('demo');
Route::get('/demo/{any}', [DemoController::class, 'index'])->where('any', '.*')->name('demo.any');
