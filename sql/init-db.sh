#!/bin/bash

# Script para inicializar la base de datos en orden correcto
# Se ejecuta automáticamente cuando Docker inicia

set -e

echo "📋 Ejecutando scripts de inicialización de BD..."

# 1. Crear esquema principal y vistas
echo "  1️⃣  Creando esquema principal (001_bdd.sql)..."
psql -U postgres -d srmm_db -f /docker-entrypoint-initdb.d/001_bdd.sql

# 2. Migraciones incrementales
if [ -f /docker-entrypoint-initdb.d/002_logistica_eventos.sql ]; then
	echo "  2️⃣  Aplicando migración logística (002_logistica_eventos.sql)..."
	psql -U postgres -d srmm_db -f /docker-entrypoint-initdb.d/002_logistica_eventos.sql
else
	echo "  2️⃣  002_logistica_eventos.sql no encontrado, se omite"
fi

# 3. Relación maquinaria-operador
if [ -f /docker-entrypoint-initdb.d/003_maquinaria_operadores.sql ]; then
	echo "  3️⃣  Aplicando relación maquinaria-operador (003_maquinaria_operadores.sql)..."
	psql -U postgres -d srmm_db -f /docker-entrypoint-initdb.d/003_maquinaria_operadores.sql
else
	echo "  3️⃣  003_maquinaria_operadores.sql no encontrado, se omite"
fi

echo "✅ Base de datos inicializada correctamente"
