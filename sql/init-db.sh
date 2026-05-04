#!/bin/bash

# Script para inicializar la base de datos en orden correcto
# Se ejecuta automáticamente cuando Docker inicia

set -e

echo "📋 Ejecutando scripts de inicialización de BD..."

# 1. Crear las tablas principales
echo "  1️⃣  Creando tablas..."
psql -U postgres -d srmm_db -f /docker-entrypoint-initdb.d/001_base_crud_usuarios.sql

# 2. Crear las vistas de reportes
echo "  2️⃣  Creando vistas..."
psql -U postgres -d srmm_db -f /docker-entrypoint-initdb.d/vistas_reportes.sql

echo "✅ Base de datos inicializada correctamente"
