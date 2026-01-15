#!/bin/bash

echo "🧹 Limpiando referencias a market-expenses del dashboard..."

DASHBOARD_TS="src/app/dashboard/dashboard.component.ts"
DASHBOARD_HTML="src/app/dashboard/dashboard.component.html"

if [ ! -f "$DASHBOARD_TS" ]; then
    echo "❌ Error: No se encontró $DASHBOARD_TS"
    exit 1
fi

# Crear backup
cp "$DASHBOARD_TS" "$DASHBOARD_TS.backup"
echo "✅ Backup creado: $DASHBOARD_TS.backup"

# Eliminar import de market-expenses
sed -i '' "/market-expenses\/market-expenses.service/d" "$DASHBOARD_TS"

# Actualizar import de models
sed -i '' "s/Employee, Payment, User, MarketExpense, MarketExpenseStats/Employee, Payment, User, Category/g" "$DASHBOARD_TS"

echo "✅ Imports actualizados"

# Mensaje para cambios manuales
echo ""
echo "⚠️  IMPORTANTE: Aún necesitas hacer cambios manuales:"
echo ""
echo "1. En $DASHBOARD_TS:"
echo "   - Eliminar del constructor: private marketExpensesService: MarketExpensesService,"
echo "   - Eliminar todas las propiedades relacionadas con marketExpenses"
echo "   - Eliminar todos los métodos relacionados con market expenses"
echo "   - Eliminar this.loadMarketExpenses() de ngOnInit()"
echo ""
echo "2. En $DASHBOARD_HTML:"
echo "   - Eliminar la tab de 'expenses'"
echo "   - Eliminar toda la sección '<!-- Market Expenses Tab -->'"
echo "   - Eliminar el modal de market expenses"
echo ""
echo "O mejor aún, descarga el dashboard limpio que te voy a generar..."
echo ""
