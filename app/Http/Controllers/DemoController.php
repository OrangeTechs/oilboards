<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DemoController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Demo/Index');
    }
}
