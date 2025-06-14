#!/bin/bash

echo "🔍 Verificando pacotes instalados..."

echo ""
echo "📦 Listando pacotes Holdstation:"
npm list | grep holdstation

echo ""
echo "📂 Verificando node_modules:"
ls -la node_modules/ | grep holdstation

echo ""
echo "📋 Verificando package.json:"
cat package.json | grep -A5 -B5 holdstation

echo ""
echo "🔍 Tentando encontrar arquivos do SDK:"
find node_modules -name "*holdstation*" -type d

echo ""
echo "📄 Verificando conteúdo dos diretórios encontrados:"
for dir in $(find node_modules -name "*holdstation*" -type d); do
    echo "=== $dir ==="
    ls -la "$dir"
    if [ -f "$dir/package.json" ]; then
        echo "--- package.json ---"
        cat "$dir/package.json" | head -20
    fi
    echo ""
done
