<?php

namespace App\Http\Controllers;

use App\Services\AnthropicClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantController extends Controller
{
    /**
     * POST /assistant
     *
     * Chat del Asistente Técnico Virtual. Stateless: el frontend envía el
     * historial completo de la conversación; aquí no se persiste nada.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'messages'              => ['required', 'array', 'min:1', 'max:40'],
            'messages.*.role'       => ['required', 'in:user,assistant'],
            'messages.*.content'    => ['required', 'string', 'max:2000'],
            'context'               => ['nullable', 'string', 'max:400'],
        ]);

        $cfg    = config('assistant');
        $apiKey = (string) ($cfg['api_key'] ?? '');

        if ($apiKey === '') {
            return response()->json([
                'text' => 'El asistente no está configurado todavía. (Falta ANTHROPIC_API_KEY en el servidor.)',
                'done' => true,
            ]);
        }

        // Sanitizar y limitar el historial a los últimos N turnos (controla tokens).
        $messages = array_map(
            fn ($m) => ['role' => $m['role'], 'content' => $m['content']],
            $validated['messages']
        );
        $maxTurns = (int) ($cfg['max_turns'] ?? 12);
        if (count($messages) > $maxTurns) {
            $messages = array_slice($messages, -$maxTurns);
        }

        // El primer mensaje debe ser del usuario (requisito de la API).
        while (!empty($messages) && $messages[0]['role'] !== 'user') {
            array_shift($messages);
        }
        if (empty($messages)) {
            return response()->json(['text' => '¿En qué puedo ayudarte sobre tu activo?', 'done' => true]);
        }

        // Si el frontend mandó la ubicación actual, se inyecta al system prompt
        // para que el asistente oriente sobre la pantalla donde está el usuario.
        $system = $cfg['system_prompt'];
        $context = trim((string) ($validated['context'] ?? ''));
        if ($context !== '') {
            $system .= "\n\n# CONTEXTO ACTUAL DEL USUARIO\n"
                . "El usuario está viendo ahora la pantalla del demo: «{$context}». "
                . "Si su mensaje es un saludo, una pregunta general o vaga, o pide orientación, "
                . "oriéntalo PRIMERO de forma breve sobre esta pantalla (qué muestra y qué puede hacer aquí). "
                . "Si pregunta algo específico de otra parte, respóndelo normal, pero sin perder de vista dónde está parado.";
        }

        $data = AnthropicClient::send($apiKey, [
            'model'       => $cfg['model'],
            'max_tokens'  => $cfg['max_tokens'],
            'temperature' => $cfg['temperature'],
            'system'      => $system,
            'messages'    => $messages,
        ]);

        if (AnthropicClient::isError($data)) {
            error_log('[AssistantController::chat] ' . json_encode($data));
            return response()->json([
                'text' => AnthropicClient::randomFallback($cfg['fallback'] ?? null),
                'done' => true,
            ]);
        }

        return response()->json([
            'text' => AnthropicClient::extractText($data) ?? AnthropicClient::randomFallback($cfg['fallback'] ?? null),
            'done' => true,
        ]);
    }
}
