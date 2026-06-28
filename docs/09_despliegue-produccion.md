# 🛢️ OILBOARDS — Doc 9: Guía de Despliegue a Producción

**Servidor, Supervisor, Nginx, CI/CD, backups y monitoreo · Para DevOps y deploy**

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Propósito | Pasar de desarrollo a producción de forma segura, reproducible y con cero downtime |
| Diferencia con Doc 1 | Doc 1 cubre el droplet de **desarrollo**. Este cubre **producción** |

> **Antes de continuar:** producción significa que hay datos de un cliente real. Dos errores aquí tienen consecuencias reales — un droplet sin backup que se cae, o un deploy mal configurado que expone datos entre tenants. Leer completo antes de ejecutar.

---

## 1. Infraestructura de producción recomendada por fase

### Fase MVP (primeros 1-2 clientes)
| Componente | Solución | Costo aprox. |
|---|---|---|
| Servidor app | DigitalOcean Droplet 4GB RAM / 2 vCPU | ~$24/mes |
| Base de datos | DigitalOcean Managed PostgreSQL (1 node) | ~$15/mes |
| Redis | DigitalOcean Managed Redis | ~$15/mes |
| Almacenamiento (exports, audios) | DigitalOcean Spaces (S3-compatible) | ~$5/mes |
| SSL | Certbot / Let's Encrypt | gratis |
| **Total** | | **~$59/mes** |

> **¿Por qué Managed DB?** En producción, la base de datos NO vive en el mismo droplet que la app. Si el droplet falla o se reinicia, la DB sigue viva. Además, DigitalOcean Managed DB hace backups automáticos diarios.

### Fase escalamiento (3+ clientes / SCADA real)
Migración a AWS o Azure con RDS PostgreSQL + ElastiCache Redis + S3 + EC2/ECS. Se paga con los ingresos de los contratos. No adelantar este gasto.

---

## 2. Setup del droplet de producción desde cero

### Paso 1 — Crear el droplet
```
Imagen:    Ubuntu 24.04 LTS x64
Plan:      Regular CPU, 4GB RAM, 2 vCPU, 80GB NVMe SSD (~$24/mes)
Región:    NYC1 o SFO3 (menor latencia para México)
Auth:      SSH Keys (NUNCA contraseña)
Opciones:  Activar "Monitoring" (métricas gratis)
```

### Paso 2 — Acceso y endurecimiento
```bash
ssh root@IP_PRODUCCION

# Usuario de deploy (nunca trabajar como root)
adduser deploy
usermod -aG sudo deploy
# Copiar SSH key al nuevo usuario
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Deshabilitar login root por SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### Paso 3 — PHP, Composer, Node (igual que desarrollo, con versiones fijas)
```bash
# (Reconectarse como deploy)
ssh deploy@IP_PRODUCCION

sudo apt update && sudo apt upgrade -y
sudo add-apt-repository -y ppa:ondrej/php
sudo apt install -y php8.3 php8.3-fpm php8.3-pgsql php8.3-redis \
  php8.3-mbstring php8.3-xml php8.3-curl php8.3-bcmath \
  php8.3-zip php8.3-gd php8.3-intl unzip git

curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Paso 4 — Nginx
```bash
sudo apt install -y nginx
```

**Configuración del server block (`/etc/nginx/sites-available/oilboards`):**

```nginx
server {
    listen 80;
    server_name oilboards.com www.oilboards.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name oilboards.com www.oilboards.com;

    root /var/www/oilboards/public;
    index index.php;

    # SSL (Certbot lo llena automáticamente)
    ssl_certificate     /etc/letsencrypt/live/oilboards.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oilboards.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";

    # Tamaño máximo upload (para audios)
    client_max_body_size 30M;

    # Laravel
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ \.php$ {
        fastcgi_pass   unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include        fastcgi_params;
        fastcgi_read_timeout 120; # Para exports pesados
    }

    # WebSocket Reverb (proxy al puerto 8080)
    location /app {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400; # WebSocket de larga duración
    }

    location ~ /\.(?!well-known).* { deny all; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/oilboards /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Paso 5 — SSL con Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d oilboards.com -d www.oilboards.com
# Certbot renueva automáticamente. Verificar con:
sudo certbot renew --dry-run
```

### Paso 6 — Deploy de la aplicación
```bash
sudo mkdir -p /var/www/oilboards
sudo chown deploy:deploy /var/www/oilboards

cd /var/www/oilboards
git clone https://github.com/tu-org/oilboards.git .

composer install --no-dev --optimize-autoloader
npm ci && npm run build

cp .env.production .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=RolesAndPermissionsSeeder --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

sudo chown -R deploy:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Paso 7 — Variables de entorno de producción (`.env.production`)

```env
APP_NAME="Oilboards"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://oilboards.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=<managed-db-host.db.ondigitalocean.com>
DB_PORT=25060
DB_DATABASE=oilboards
DB_USERNAME=oilboards_user
DB_PASSWORD=<contraseña-segura>
DB_SSLMODE=require

REDIS_HOST=<managed-redis-host.db.ondigitalocean.com>
REDIS_PORT=25061
REDIS_PASSWORD=<contraseña-redis>
REDIS_SCHEME=tls

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=<id>
REVERB_APP_KEY=<key>
REVERB_APP_SECRET=<secret>
REVERB_HOST=oilboards.com
REVERB_PORT=443
REVERB_SCHEME=https

QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=480

FILESYSTEM_DISK=spaces
DO_SPACES_KEY=<key>
DO_SPACES_SECRET=<secret>
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=oilboards-exports

ANTHROPIC_API_KEY=<llave-produccion>

MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
MAIL_PASSWORD=<resend-api-key>
MAIL_FROM_ADDRESS=hola@oilboards.com
MAIL_FROM_NAME="Oilboards"
```

---

## 3. Supervisor (procesos permanentes en background)

Supervisor mantiene Reverb y Queue Worker corriendo siempre. Si se caen, los reinicia automáticamente.

```bash
sudo apt install -y supervisor
```

**Configuración de Reverb (`/etc/supervisor/conf.d/oilboards-reverb.conf`):**
```ini
[program:oilboards-reverb]
process_name=%(program_name)s
command=php /var/www/oilboards/artisan reverb:start --host=127.0.0.1 --port=8080
autostart=true
autorestart=true
user=deploy
redirect_stderr=true
stdout_logfile=/var/log/supervisor/oilboards-reverb.log
stdout_logfile_maxbytes=10MB
stopwaitsecs=10
```

**Configuración de Queue Worker (`/etc/supervisor/conf.d/oilboards-worker.conf`):**
```ini
[program:oilboards-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/oilboards/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/supervisor/oilboards-worker.log
stdout_logfile_maxbytes=10MB
stopwaitsecs=10
```

> `numprocs=2` — dos workers en paralelo. Uno para Jobs normales (exports), otro para Jobs de IA (pueden tardar más). Ajustar según carga.

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
sudo supervisorctl status  # verificar que todo está RUNNING
```

---

## 4. Laravel Scheduler (tareas programadas)

```bash
# Agregar al crontab del usuario deploy
crontab -e

# Agregar esta línea:
* * * * * cd /var/www/oilboards && php artisan schedule:run >> /dev/null 2>&1
```

**Tareas programadas en `app/Console/Kernel.php`:**
```php
protected function schedule(Schedule $schedule): void
{
    // Limpiar exports expirados (diario a las 3 AM)
    $schedule->command('exports:cleanup')->dailyAt('03:00');

    // Renovar SSL (Certbot lo hace solo, pero por si acaso)
    $schedule->command('certbot renew --quiet')->weekly();

    // Recordatorio de reporte si pozos no han reportado al final del turno
    $schedule->command('reports:remind')->cron('0 7,15,23 * * *');

    // Limpiar tokens Sanctum expirados
    $schedule->command('sanctum:prune-expired --hours=480')->daily();
}
```

---

## 5. CI/CD con GitHub Actions

Cada push a `main` despliega automáticamente a producción con cero downtime.

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy a Producción

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'

      - name: Instalar dependencias PHP
        run: composer install --no-dev --optimize-autoloader

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Build frontend
        run: npm ci && npm run build

      - name: Deploy al servidor vía SSH
        uses: appleboy/ssh-action@v1
        with:
          host:     ${{ secrets.PROD_HOST }}
          username: deploy
          key:      ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /var/www/oilboards

            # Pull del código
            git pull origin main

            # Dependencias (sin dev)
            composer install --no-dev --optimize-autoloader

            # Frontend ya viene compilado en el repo (o se compila aquí)
            npm ci && npm run build

            # Migraciones (--force para producción)
            php artisan migrate --force

            # Limpiar y recachear
            php artisan config:cache
            php artisan route:cache
            php artisan view:cache
            php artisan event:cache

            # Reiniciar workers (para que tomen el código nuevo)
            sudo supervisorctl restart oilboards-worker:*
            sudo supervisorctl restart oilboards-reverb

            echo "✅ Deploy completado: $(date)"
```

**Secrets necesarios en GitHub (Settings → Secrets):**
- `PROD_HOST` — IP del droplet de producción
- `PROD_SSH_KEY` — llave SSH privada del usuario deploy

> **Cero downtime:** Nginx sigue sirviendo con el código anterior mientras se ejecuta el deploy. Solo hay un breve momento de reinicio al final de `supervisorctl restart`.

---

## 6. Backups

### Base de datos (Managed PostgreSQL de DigitalOcean)
DigitalOcean Managed DB hace **backups automáticos diarios** con retención de 7 días. No requiere configuración adicional. Verificar que está activo en el panel.

### Backup manual adicional (recomendado para el primer mes)
```bash
# Agregar al scheduler o correr manualmente
pg_dump "postgresql://user:pass@host:25060/oilboards?sslmode=require" \
  | gzip > /tmp/oilboards_backup_$(date +%Y%m%d).sql.gz

# Subir a Spaces
aws s3 cp /tmp/oilboards_backup_*.sql.gz s3://oilboards-exports/backups/ \
  --endpoint-url https://nyc3.digitaloceanspaces.com
```

### Archivos de exports y audios
Almacenados en **DigitalOcean Spaces** (S3-compatible). Spaces tiene redundancia incorporada. Configurar retención de 90 días para audios y 30 días para exports.

---

## 7. Monitoreo

### Monitoreo de uptime
**Better Uptime** (gratis hasta 5 monitors) o **UptimeRobot**:
- Monitor `https://oilboards.com` (HTTP)
- Monitor `https://oilboards.com/api/v1/health` (endpoint de health check)
- Alertas a email/WhatsApp si cae

**Health check endpoint:**
```php
// routes/api.php
Route::get('/health', fn() => response()->json([
    'status' => 'ok',
    'db'     => DB::connection()->getPdo() ? 'ok' : 'error',
    'redis'  => Redis::ping() === 'PONG' ? 'ok' : 'error',
    'time'   => now()->toISOString(),
]));
```

### Logs de aplicación
```bash
# Ver errores en tiempo real
tail -f /var/www/oilboards/storage/logs/laravel.log

# Logs de Supervisor
tail -f /var/log/supervisor/oilboards-worker.log
tail -f /var/log/supervisor/oilboards-reverb.log
```

### Métricas del droplet
DigitalOcean Monitoring (ya activado en el Paso 1 del setup):
- Alertas de CPU > 80% por más de 5 minutos
- Alertas de RAM > 90%
- Alertas de disco > 85%

---

## 8. Checklist de go-live (antes del primer cliente)

### Infraestructura
- [ ] Droplet de producción creado y endurecido.
- [ ] Managed PostgreSQL y Managed Redis configurados.
- [ ] DigitalOcean Spaces configurado para exports y audios.
- [ ] Nginx configurado con SSL (verificar candado en el navegador).
- [ ] Headers de seguridad verificados (usar `securityheaders.com`).

### Aplicación
- [ ] `.env` de producción configurado (sin `APP_DEBUG=true`).
- [ ] Migraciones y seeders corridos.
- [ ] `config:cache`, `route:cache`, `view:cache` aplicados.
- [ ] Supervisor corriendo Reverb y Queue Worker (`supervisorctl status` = RUNNING).
- [ ] Scheduler configurado en crontab.
- [ ] CI/CD probado con un deploy de prueba.

### Seguridad
- [ ] Login con credenciales incorrectas → 401 (no 500).
- [ ] Usuario de Organización A no puede ver datos de Organización B.
- [ ] Operador no puede ver pozos que no tiene asignados.
- [ ] `APP_DEBUG=false` confirmado (no expone stack traces).
- [ ] Rate limiting activo (probar con curl).

### Monitoreo
- [ ] Monitor de uptime configurado (Better Uptime / UptimeRobot).
- [ ] Alertas de CPU/RAM/disco en DigitalOcean Monitoring.
- [ ] Email de notificación de errores críticos configurado.
- [ ] Backup automático de DB verificado en panel de DigitalOcean.

### Funcional
- [ ] Login → dashboard → crear reporte → exportar PDF: flujo completo funciona.
- [ ] Grabar audio → transcribir → estructurar → guardar: flujo completo funciona.
- [ ] Alerta se crea → Claude genera diagnóstico → llega al ingeniero: funciona.
- [ ] WebSocket Reverb: actualización en tiempo real visible entre dos pestañas.
- [ ] Modo offline en celular: guardar reporte → reconectar → sync automático: funciona.

---

*Fin del Doc 9. Con esto tienes todo lo necesario para pasar de desarrollo a producción de forma segura.*
