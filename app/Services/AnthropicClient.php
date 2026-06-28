<?php
/**
 * Oilboards — AnthropicClient
 *
 * Helper centralizado para llamadas a la API de Anthropic.
 * Adaptado del cliente de producción de Medriks (Orange Technologies).
 * Resuelve fallos en las primeras solicitudes:
 *   - CURLOPT_CONNECTTIMEOUT (DNS lookup + SSL handshake)
 *   - Reintentos ante errores transitorios de red / 5xx
 *   - keep-alive para reutilizar conexiones SSL
 *
 * Uso:
 *   $result = AnthropicClient::send($apiKey, $payload);
 *   if (AnthropicClient::isError($result)) { ... }
 *   $text = AnthropicClient::extractText($result);
 */

namespace App\Services;

class AnthropicClient
{
    private const ENDPOINT    = 'https://api.anthropic.com/v1/messages';
    private const API_VERSION = '2023-06-01';

    // Timeouts
    private const CONNECT_TIMEOUT = 10;   // segundos para establecer la conexión (DNS + SSL)
    private const REQUEST_TIMEOUT = 60;   // segundos para recibir la respuesta completa

    // Reintentos
    private const MAX_RETRIES    = 2;     // intentos extra si falla (total = 3 llamadas máx)
    private const RETRY_DELAY_MS = 800;   // milisegundos entre reintentos

    /**
     * Envía un mensaje a la API de Anthropic con reintentos automáticos.
     *
     * @param  string $apiKey    API key (sk-ant-...)
     * @param  array  $payload   Cuerpo del request (model, messages, system, etc.)
     * @param  int    $maxTokens Override de max_tokens (opcional)
     * @return array  Respuesta de Anthropic, o ['_curl_error' => '...'] / ['error' => [...]]
     */
    public static function send(string $apiKey, array $payload, int $maxTokens = 0): array
    {
        if ($maxTokens > 0) {
            $payload['max_tokens'] = $maxTokens;
        }

        $payload['stream'] = false;

        if (isset($payload['messages'])) {
            $payload['messages'] = self::normalizeToolUseInputs($payload['messages']);
        }

        $lastErrno = 0;
        $lastError = '';

        for ($attempt = 0; $attempt <= self::MAX_RETRIES; $attempt++) {
            if ($attempt > 0) {
                usleep(self::RETRY_DELAY_MS * 1000 * $attempt);
                error_log(sprintf(
                    '[AnthropicClient] Reintento %d/%d después de error cURL %d: %s',
                    $attempt, self::MAX_RETRIES, $lastErrno, $lastError
                ));
            }

            $ch = curl_init(self::ENDPOINT);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_HTTPHEADER     => [
                    'x-api-key: ' . $apiKey,
                    'anthropic-version: ' . self::API_VERSION,
                    'content-type: application/json',
                    'connection: keep-alive',
                ],
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
                CURLOPT_TIMEOUT        => self::REQUEST_TIMEOUT,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_ENCODING       => 'gzip',
            ]);

            $response  = curl_exec($ch);
            $lastErrno = curl_errno($ch);
            $lastError = curl_error($ch);
            $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            // Error de red / conexión → reintentar
            if ($lastErrno !== 0) {
                continue;
            }

            $data = json_decode($response, true);

            // 5xx de Anthropic (sobrecarga / error servidor) → reintentar
            if (isset($data['error']) && $httpCode >= 500) {
                error_log(sprintf(
                    '[AnthropicClient] HTTP %d de Anthropic, reintentando: %s',
                    $httpCode, json_encode($data['error'])
                ));
                $lastErrno = -1;
                $lastError = 'HTTP ' . $httpCode;
                continue;
            }

            // Éxito o error de cliente (4xx) — devolver sin reintentar
            return $data ?? ['error' => ['type' => 'invalid_response', 'message' => 'Respuesta vacía de Anthropic']];
        }

        error_log('[AnthropicClient] Todos los intentos fallaron. Último error: ' . $lastError);
        return ['_curl_error' => $lastError, '_curl_errno' => $lastErrno];
    }

    /** Extrae el texto de la respuesta. Devuelve null si hubo error. */
    public static function extractText(array $response): ?string
    {
        if (isset($response['_curl_error']) || isset($response['error'])) {
            return null;
        }
        foreach ($response['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'text' && isset($block['text'])) {
                return $block['text'];
            }
        }
        return null;
    }

    /** True si la respuesta es un error (cURL o Anthropic). */
    public static function isError(array $response): bool
    {
        return isset($response['_curl_error']) || isset($response['error']);
    }

    /** Frase aleatoria del pool de fallback (separadas por |). */
    public static function randomFallback(?string $phrases, string $default = 'Dame un momento e intenta de nuevo.'): string
    {
        if (empty($phrases)) {
            return $default;
        }
        $options = array_filter(array_map('trim', explode('|', $phrases)));
        return empty($options) ? $default : $options[array_rand($options)];
    }

    /**
     * Normaliza tool_use.input vacío ([] → {}) antes de codificar.
     * PHP decodifica {} y [] vacíos igual; Anthropic exige objeto en tool_use.input.
     */
    private static function normalizeToolUseInputs(array $messages): array
    {
        foreach ($messages as &$msg) {
            if (!is_array($msg['content'] ?? null)) {
                continue;
            }
            foreach ($msg['content'] as &$block) {
                if (($block['type'] ?? '') === 'tool_use' && ($block['input'] ?? null) === []) {
                    $block['input'] = new \stdClass();
                }
            }
            unset($block);
        }
        unset($msg);
        return $messages;
    }
}
