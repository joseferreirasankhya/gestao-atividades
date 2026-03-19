---
name: Design tokens e padroes visuais do projeto
description: CSS custom properties, padroes de botoes, inputs, cards e dark mode usados no Gestao de Atividades
type: project
---

Design system implícito via CSS custom properties em :root e .dark:
- Cores: --primary, --background, --foreground, --secondary, --muted, --accent, --destructive, --border, --input, --ring
- Sombras: --shadow-sm, --shadow-md, --shadow-card
- Radius: --radius (0.75rem)
- Dark mode: classe .dark no html

Padroes de componentes:
- Botoes header (theme-toggle): 2.25rem x 2.25rem, border-radius 0.5rem, borda --border, hover para --accent com borda --primary/0.3, active scale(0.9)
- Inputs (search-input): focus com box-shadow 0 0 0 3px hsl(var(--primary)/0.12), border-color --primary/0.5
- Cards (kpi-layout-card): bg --background, border --border, radius --radius, shadow --shadow-card, dark bg --secondary

**Why:** Manter consistencia visual ao adicionar novos componentes.
**How to apply:** Qualquer novo elemento deve reusar esses tokens e seguir os padroes de hover/focus/active existentes.
