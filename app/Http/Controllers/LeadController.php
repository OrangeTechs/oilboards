<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => ['required', 'email', 'max:255', function ($attr, $value, $fail) {
                $blocked = ['gmail.', 'hotmail.', 'yahoo.', 'outlook.'];
                foreach ($blocked as $domain) {
                    if (str_contains(strtolower($value), $domain)) {
                        $fail('Por favor usa tu correo corporativo.');
                        return;
                    }
                }
            }],
            'company'     => 'required|string|max:255',
            'position'    => 'required|string|max:255',
            'wells_count' => 'required|in:1-5,6-20,Más de 20',
        ]);

        $validated['source'] = 'landing';
        Lead::create($validated);

        return response()->json(['success' => true]);
    }
}
